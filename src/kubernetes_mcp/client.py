"""
Kubernetes API and Minikube CLI wrapper client logic.
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
from typing import Any, Dict, List, Optional
import yaml
from kubernetes import client, config
from kubernetes.client.rest import ApiException

logger = logging.getLogger("kubernetes-mcp.client")


class KubeClient:
    """Wrapper around the official Kubernetes Python Client and Minikube CLI."""

    def __init__(self):
        self.config_loaded = False
        self._load_config()

    def _load_config(self) -> None:
        """Attempt to load kubeconfig from default location or in-cluster."""
        try:
            config.load_kube_config()
            self.config_loaded = True
            logger.info("Successfully loaded local kubeconfig")
        except Exception as e:
            try:
                config.load_in_cluster_config()
                self.config_loaded = True
                logger.info("Successfully loaded in-cluster Kubernetes config")
            except Exception as inner_e:
                logger.error(f"Failed to load Kubernetes configuration: {e} | {inner_e}")
                self.config_loaded = False

    def get_core_api(self) -> client.CoreV1Api:
        if not self.config_loaded:
            self._load_config()
        return client.CoreV1Api()

    def get_apps_api(self) -> client.AppsV1Api:
        if not self.config_loaded:
            self._load_config()
        return client.AppsV1Api()

    def get_networking_api(self) -> client.NetworkingV1Api:
        if not self.config_loaded:
            self._load_config()
        return client.NetworkingV1Api()

    # --- Node Tools ---
    def list_nodes(self) -> Dict[str, Any]:
        """List cluster nodes with health and resource statistics."""
        try:
            api = self.get_core_api()
            nodes = api.list_node()
            node_list = []
            for n in nodes.items:
                conditions = {c.type: c.status for c in n.status.conditions}
                node_list.append({
                    "name": n.metadata.name,
                    "status": "Ready" if conditions.get("Ready") == "True" else "NotReady",
                    "version": n.status.node_info.kubelet_version,
                    "os": n.status.node_info.os_image,
                    "cpu": n.status.capacity.get("cpu"),
                    "memory": n.status.capacity.get("memory"),
                    "pods": n.status.capacity.get("pods")
                })
            return {"success": True, "data": node_list}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # --- Pods & Workloads ---
    def list_pods(self, namespace: str = "default") -> Dict[str, Any]:
        """List pods in a specific namespace."""
        try:
            api = self.get_core_api()
            pods = api.list_namespaced_pod(namespace)
            pod_list = []
            for p in pods.items:
                status = p.status.phase
                container_statuses = p.status.container_statuses or []
                restarts = sum(cs.restart_count for cs in container_statuses)
                
                # Check for crash loop or pending details
                status_detail = None
                for cs in container_statuses:
                    if cs.state.waiting:
                        status = cs.state.waiting.reason
                        status_detail = cs.state.waiting.message
                    elif cs.state.terminated:
                        status = cs.state.terminated.reason
                        status_detail = cs.state.terminated.message

                pod_list.append({
                    "name": p.metadata.name,
                    "namespace": namespace,
                    "status": status,
                    "status_detail": status_detail,
                    "ip": p.status.pod_ip or "N/A",
                    "node": p.spec.node_name or "N/A",
                    "restarts": restarts,
                    "age": p.metadata.creation_timestamp.isoformat() if p.metadata.creation_timestamp else "N/A"
                })
            return {"success": True, "data": pod_list}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_pod_logs(self, namespace: str, pod_name: str, container_name: Optional[str] = None, tail_lines: int = 100) -> Dict[str, Any]:
        """Fetch stdout/stderr logs from a pod container."""
        try:
            api = self.get_core_api()
            kwargs = {"tail_lines": tail_lines}
            if container_name:
                kwargs["container"] = container_name
                
            logs = api.read_namespaced_pod_log(pod_name, namespace, **kwargs)
            return {"success": True, "data": logs}
        except ApiException as e:
            return {"success": False, "error": f"Kubernetes API Error: {e.reason} ({e.status}) - {e.body}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_pod_description(self, namespace: str, pod_name: str) -> Dict[str, Any]:
        """Describe a pod in detail, combining properties and recent events."""
        try:
            api = self.get_core_api()
            pod = api.read_namespaced_pod(pod_name, namespace)
            
            # Fetch events related to this pod
            events_api = api.list_namespaced_event(
                namespace, 
                field_selector=f"involvedObject.name={pod_name},involvedObject.kind=Pod"
            )
            
            event_list = []
            for ev in events_api.items:
                event_list.append({
                    "type": ev.type,
                    "reason": ev.reason,
                    "message": ev.message,
                    "count": ev.count,
                    "last_timestamp": ev.last_timestamp.isoformat() if ev.last_timestamp else "N/A"
                })

            container_info = []
            for c in pod.spec.containers:
                container_info.append({
                    "name": c.name,
                    "image": c.image,
                    "ports": [p.container_port for p in c.ports] if c.ports else []
                })

            desc = {
                "name": pod.metadata.name,
                "namespace": namespace,
                "status": pod.status.phase,
                "node": pod.spec.node_name,
                "ip": pod.status.pod_ip,
                "containers": container_info,
                "events": event_list
            }
            return {"success": True, "data": desc}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # --- Deployments ---
    def scale_deployment(self, namespace: str, name: str, replicas: int) -> Dict[str, Any]:
        """Scale replicas of a Deployment."""
        try:
            api = self.get_apps_api()
            body = {"spec": {"replicas": replicas}}
            api.patch_namespaced_deployment_scale(name, namespace, body)
            return {"success": True, "message": f"Successfully scaled deployment '{name}' to {replicas} replicas."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def rollout_restart_deployment(self, namespace: str, name: str) -> Dict[str, Any]:
        """Trigger a rolling rollout restart for a Deployment."""
        import datetime
        try:
            api = self.get_apps_api()
            # Annotate pod template with restart timestamp to trigger rolling update
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            body = {
                "spec": {
                    "template": {
                        "metadata": {
                            "annotations": {
                                "kubectl.kubernetes.io/restartedAt": now
                            }
                        }
                    }
                }
            }
            api.patch_namespaced_deployment(name, namespace, body)
            return {"success": True, "message": f"Restart triggered for deployment '{name}' in '{namespace}'."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # --- Apply YAML spec ---
    def apply_yaml(self, yaml_content: str) -> Dict[str, Any]:
        """Apply a raw YAML configuration string to the cluster (creates or updates resources)."""
        # Parse YAML into documents
        try:
            docs = list(yaml.safe_load_all(yaml_content))
        except Exception as e:
            return {"success": False, "error": f"YAML Parse Error: {e}"}

        results = []
        for doc in docs:
            if not doc:
                continue
            kind = doc.get("kind")
            api_version = doc.get("apiVersion")
            metadata = doc.get("metadata", {})
            name = metadata.get("name")
            namespace = metadata.get("namespace", "default")
            
            if not kind or not name:
                results.append({"success": False, "error": "Missing 'kind' or 'metadata.name'"})
                continue
                
            try:
                # We can handle common resource types dynamically using helpers or the generic client
                # To keep it robust, we'll route common types directly to CoreV1 / AppsV1 API
                if kind == "Pod":
                    self.get_core_api().create_namespaced_pod(namespace, doc)
                elif kind == "Service":
                    self.get_core_api().create_namespaced_service(namespace, doc)
                elif kind == "Namespace":
                    self.get_core_api().create_namespace(doc)
                elif kind == "Deployment":
                    self.get_apps_api().create_namespaced_deployment(namespace, doc)
                elif kind == "ConfigMap":
                    self.get_core_api().create_namespaced_config_map(namespace, doc)
                elif kind == "Secret":
                    self.get_core_api().create_namespaced_secret(namespace, doc)
                elif kind == "Ingress":
                    self.get_networking_api().create_namespaced_ingress(namespace, doc)
                else:
                    # Fallback to dynamic client if needed. To remain dependency-light, raise error
                    results.append({"success": False, "error": f"Unsupported resource kind '{kind}' in yaml tool"})
                    continue
                results.append({"success": True, "resource": f"{kind}/{name}", "action": "created"})
            except ApiException as e:
                # Try patching if it already exists (HTTP 409 Conflict)
                if e.status == 409:
                    try:
                        if kind == "Pod":
                            self.get_core_api().patch_namespaced_pod(name, namespace, doc)
                        elif kind == "Service":
                            self.get_core_api().patch_namespaced_service(name, namespace, doc)
                        elif kind == "Deployment":
                            self.get_apps_api().patch_namespaced_deployment(name, namespace, doc)
                        elif kind == "ConfigMap":
                            self.get_core_api().patch_namespaced_config_map(name, namespace, doc)
                        elif kind == "Secret":
                            self.get_core_api().patch_namespaced_secret(name, namespace, doc)
                        elif kind == "Ingress":
                            self.get_networking_api().patch_namespaced_ingress(name, namespace, doc)
                        else:
                            results.append({"success": False, "error": f"Patching kind '{kind}' unsupported"})
                            continue
                        results.append({"success": True, "resource": f"{kind}/{name}", "action": "patched"})
                    except Exception as patch_e:
                        results.append({"success": False, "resource": f"{kind}/{name}", "error": str(patch_e)})
                else:
                    results.append({"success": False, "resource": f"{kind}/{name}", "error": e.body})
            except Exception as e:
                results.append({"success": False, "resource": f"{kind}/{name}", "error": str(e)})

        success_count = sum(1 for r in results if r["success"])
        return {"success": True, "results": results, "summary": f"Applied {success_count}/{len(results)} resources."}

    # --- Services & Networking ---
    def list_services(self, namespace: str = "default") -> Dict[str, Any]:
        try:
            api = self.get_core_api()
            services = api.list_namespaced_service(namespace)
            svc_list = []
            for s in services.items:
                ports = [f"{p.port}:{p.target_port}/{p.protocol}" for p in s.spec.ports] if s.spec.ports else []
                svc_list.append({
                    "name": s.metadata.name,
                    "type": s.spec.type,
                    "cluster_ip": s.spec.cluster_ip,
                    "external_ips": s.spec.external_i_ps or [],
                    "ports": ports,
                    "selector": s.spec.selector or {}
                })
            return {"success": True, "data": svc_list}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def list_ingresses(self, namespace: str = "default") -> Dict[str, Any]:
        try:
            api = self.get_networking_api()
            ingresses = api.list_namespaced_ingress(namespace)
            ing_list = []
            for ing in ingresses.items:
                rules = []
                if ing.spec.rules:
                    for r in ing.spec.rules:
                        paths = []
                        if r.http and r.http.paths:
                            for p in r.http.paths:
                                paths.append({
                                    "path": p.path,
                                    "backend": f"{p.backend.service.name}:{p.backend.service.port.number or p.backend.service.port.name}"
                                })
                        rules.append({"host": r.host or "*", "paths": paths})
                ing_list.append({
                    "name": ing.metadata.name,
                    "rules": rules,
                    "ips": [ip.ip for ip in ing.status.load_balancer.ingress] if ing.status.load_balancer and ing.status.load_balancer.ingress else []
                })
            return {"success": True, "data": ing_list}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # --- Minikube Subprocess CLI Controls ---
    def get_minikube_status(self) -> Dict[str, Any]:
        """Check status of Minikube running states."""
        try:
            # Check context name first
            active_context = ""
            try:
                contexts, active = config.list_kube_config_contexts()
                active_context = active.get("name", "")
            except:
                pass

            res = subprocess.run(["minikube", "status", "-o", "json"], capture_output=True, text=True, timeout=5)
            if res.returncode in (0, 1, 7): # Minikube returns non-zero for stopped states
                try:
                    data = json.loads(res.stdout)
                    return {"success": True, "active_context": active_context, "minikube_status": data}
                except:
                    # Text parse fallback
                    return {"success": True, "active_context": active_context, "raw_status": res.stdout or res.stderr}
            return {"success": False, "error": f"Minikube CLI status error (code {res.returncode}): {res.stderr}"}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Minikube CLI query timed out"}
        except FileNotFoundError:
            return {"success": True, "active_context": active_context, "minikube_installed": False, "message": "Minikube CLI executable not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def run_minikube_cmd(self, action: str) -> Dict[str, Any]:
        """Runs a minikube start/stop command asynchronously in a thread."""
        def run():
            if action == "start":
                res = subprocess.run(["minikube", "start"], capture_output=True, text=True, timeout=120)
            elif action == "stop":
                res = subprocess.run(["minikube", "stop"], capture_output=True, text=True, timeout=60)
            else:
                return {"success": False, "error": f"Invalid minikube action '{action}'"}
                
            if res.returncode == 0:
                return {"success": True, "message": f"Minikube {action} completed successfully."}
            return {"success": False, "error": f"Minikube error: {res.stderr or res.stdout}"}

        try:
            return await asyncio.to_thread(run)
        except Exception as e:
            return {"success": False, "error": str(e)}


# Shared client instance
kube_client = KubeClient()
