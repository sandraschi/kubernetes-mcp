"""
Kubernetes MCP server — FastMCP 3.4.4+, portmanteau pattern.
Provides tools, resources, and prompts for Kubernetes cluster orchestration and Minikube automation.
"""

import asyncio
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastmcp import Context, FastMCP

from .client import KubeClient

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s %(message)s")
logger = logging.getLogger("kubernetes-mcp.server")

VERSION = "0.1.0"
WEB_PORT = int(os.getenv("WEB_PORT", "10811"))
WEB_HOST = os.getenv("WEB_HOST", "127.0.0.1")

# Global instances
project_root = Path(__file__).parent.parent.parent
kube_client = KubeClient()

@asynccontextmanager
async def server_lifespan(mcp_instance: FastMCP):
    logger.info(f"kubernetes-mcp v{VERSION} starting (FastMCP 3.4.4+)")
    yield
    logger.info("kubernetes-mcp shutting down")

mcp = FastMCP(
    "kubernetes-mcp",
    version=VERSION,
    lifespan=server_lifespan,
    instructions=(
        "Kubernetes orchestration and local Minikube control server. "
        "Allows managing cluster workloads (pods, logs, deployment scales, rollout restarts, YAML apply) "
        "and managing the local minikube VM/container environments."
    ),
)


# ── Cluster Tools ─────────────────────────────────────────────────────────────

@mcp.tool()
async def k8s_node_list(ctx: Context = None) -> str:
    """List cluster nodes with health, capacity, and resource statistics.
    
    Returns node statuses (Ready/NotReady), version, CPU, and Memory.
    """
    res = kube_client.list_nodes()
    if not res.get("success"):
        return f"Error: {res.get('error')}"
        
    nodes = res.get("data", [])
    if not nodes:
        return "No nodes found in the cluster."
        
    lines = ["### Kubernetes Nodes\n"]
    for n in nodes:
        lines.append(
            f"- **{n.name}** ({n.status}) | Version: {n.version}\n"
            f"  *OS: {n.os} | Capacity: {n.cpu} CPU, {n.memory} Memory, {n.pods} Max Pods*"
        )
    return "\n".join(lines)


@mcp.tool()
async def k8s_cluster_health(ctx: Context = None) -> str:
    """Check connection status and active context details of the cluster."""
    if not kube_client.config_loaded:
        return "🔴 Not connected. Failed to load local kubeconfig or cluster environment credentials."
        
    # Get active context details
    from kubernetes import config
    try:
        contexts, active = config.list_kube_config_contexts()
        c_name = active.get("name", "unknown")
        cluster = active.get("context", {}).get("cluster", "unknown")
        user = active.get("context", {}).get("user", "unknown")
        return (
            f"### 🟢 Kubernetes Connection: Online\n"
            f"- **Active Context**: `{c_name}`\n"
            f"- **Cluster**: `{cluster}`\n"
            f"- **User Credentials**: `{user}`\n"
            f"- **Kubeconfig Connection**: Validated"
        )
    except Exception as e:
        return f"🟢 Connected, but failed to list contexts: {e}"


# ── Pods & Logs Tools ──────────────────────────────────────────────────────────

@mcp.tool()
async def k8s_pod_list(namespace: str = "default", ctx: Context = None) -> str:
    """List pods in a specific namespace.
    
    Args:
        namespace: The Kubernetes namespace (default: 'default').
    """
    res = kube_client.list_pods(namespace)
    if not res.get("success"):
        return f"Error: {res.get('error')}"
        
    pods = res.get("data", [])
    if not pods:
        return f"No pods found in namespace '{namespace}'."
        
    lines = [f"### Pods in '{namespace}'\n"]
    for p in pods:
        badge = "🟢" if p["status"] == "Running" else "🔴" if p["status"] in ("Failed", "CrashLoopBackOff", "Error", "ImagePullBackOff") else "🟡"
        detail = f" ({p['status_detail']})" if p["status_detail"] else ""
        lines.append(
            f"- {badge} **{p['name']}** - `{p['status']}`{detail} | Restarts: {p['restarts']}\n"
            f"  *IP: {p['ip']} | Node: {p['node']}*"
        )
    return "\n".join(lines)


@mcp.tool()
async def k8s_pod_logs(namespace: str, pod_name: str, container_name: Optional[str] = None, tail_lines: int = 100, ctx: Context = None) -> str:
    """Fetch stdout/stderr logs from a pod container.
    
    Args:
        namespace: Namespace containing the pod.
        pod_name: Name of the pod.
        container_name: Optional target container name (required if multi-container pod).
        tail_lines: Number of tail log lines to fetch (default: 100).
    """
    res = kube_client.get_pod_logs(namespace, pod_name, container_name, tail_lines)
    if not res.get("success"):
        return f"Error: {res.get('error')}"
    return f"### Logs for pod {pod_name} ({container_name or 'default container'})\n```\n{res.get('data')}\n```"


@mcp.tool()
async def k8s_pod_describe(namespace: str, pod_name: str, ctx: Context = None) -> str:
    """Describe a pod in detail, combining specifications and recent event logs.
    
    Useful for troubleshooting CrashLoopBackOff or Pending pod states.
    
    Args:
        namespace: Namespace containing the pod.
        pod_name: Name of the pod.
    """
    res = kube_client.get_pod_description(namespace, pod_name)
    if not res.get("success"):
        return f"Error: {res.get('error')}"
        
    d = res.get("data", {})
    lines = [
        f"### Pod Details: {d['name']} in namespace '{d['namespace']}'\n",
        f"- **Status**: `{d['status']}`",
        f"- **Node**: `{d['node']}`",
        f"- **Pod IP**: `{d['ip']}`\n",
        "#### Containers:"
    ]
    for c in d["containers"]:
        ports = ", ".join(map(str, c["ports"])) if c["ports"] else "None"
        lines.append(f"  - **{c['name']}** (Image: `{c['image']}`) | Ports: {ports}")
        
    lines.append("\n#### Recent Events:")
    if not d["events"]:
        lines.append("  *No events found for this pod.*")
    else:
        for ev in d["events"]:
            lines.append(f"  - **{ev['type']}** | Reason: `{ev['reason']}` | Count: {ev['count']} | {ev['message']}")
            
    return "\n".join(lines)


# ── Workload Control Tools ────────────────────────────────────────────────────

@mcp.tool()
async def k8s_deployment_scale(namespace: str, name: str, replicas: int, ctx: Context = None) -> str:
    """Scale replicas of a Deployment.
    
    Args:
        namespace: Namespace containing the deployment.
        name: Name of the deployment.
        replicas: Desired replica count.
    """
    res = kube_client.scale_deployment(namespace, name, replicas)
    if not res.get("success"):
        return f"Error scaling deployment: {res.get('error')}"
    return res.get("message")


@mcp.tool()
async def k8s_rollout_restart(namespace: str, name: str, ctx: Context = None) -> str:
    """Trigger a rolling update rollout restart for a Deployment.
    
    Args:
        namespace: Namespace containing the deployment.
        name: Name of the deployment to restart.
    """
    res = kube_client.rollout_restart_deployment(namespace, name)
    if not res.get("success"):
        return f"Error restarting deployment: {res.get('error')}"
    return res.get("message")


@mcp.tool()
async def k8s_apply_yaml(yaml_content: str, ctx: Context = None) -> str:
    """Apply a YAML configuration string to create or update cluster resources.
    
    Args:
        yaml_content: Multi-line YAML specification content containing Kubernetes resources.
    """
    res = kube_client.apply_yaml(yaml_content)
    if not res.get("success"):
        return f"Error applying YAML: {res.get('error')}"
        
    lines = [f"### YAML Application Summary: {res['summary']}\n"]
    for r in res.get("results", []):
        status = "✅ Success" if r.get("success") else "❌ Failure"
        action = r.get("action", "") or "error"
        err = f" | Error: {r['error']}" if r.get("error") else ""
        lines.append(f"- **{r.get('resource', 'Unknown')}**: {status} ({action}){err}")
        
    return "\n".join(lines)


# ── Services & Ingress Tools ──────────────────────────────────────────────────

@mcp.tool()
async def k8s_service_list(namespace: str = "default", ctx: Context = None) -> str:
    """List services in a namespace.
    
    Args:
        namespace: Namespace containing the services.
    """
    res = kube_client.list_services(namespace)
    if not res.get("success"):
        return f"Error: {res.get('error')}"
        
    svcs = res.get("data", [])
    if not svcs:
        return f"No services found in namespace '{namespace}'."
        
    lines = [f"### Services in namespace '{namespace}'\n"]
    for s in svcs:
        ports = ", ".join(s["ports"])
        lines.append(
            f"- **{s['name']}** ({s['type']}) | ClusterIP: {s['cluster_ip']}\n"
            f"  *Ports: {ports} | Selector: {s['selector']}*"
        )
    return "\n".join(lines)


@mcp.tool()
async def k8s_ingress_list(namespace: str = "default", ctx: Context = None) -> str:
    """List ingress routing rules in a namespace.
    
    Args:
        namespace: Namespace containing the ingress controllers.
    """
    res = kube_client.list_ingresses(namespace)
    if not res.get("success"):
        return f"Error: {res.get('error')}"
        
    ings = res.get("data", [])
    if not ings:
        return f"No ingress configurations found in namespace '{namespace}'."
        
    lines = [f"### Ingress Rules in namespace '{namespace}'\n"]
    for ing in ings:
        lines.append(f"- **{ing['name']}** | LB IPs: {', '.join(ing['ips']) if ing['ips'] else 'None'}")
        for rule in ing["rules"]:
            lines.append(f"  - Host: `{rule['host']}`")
            for p in rule["paths"]:
                lines.append(f"    * Path: `{p['path']}` ➔ Service: `{p['backend']}`")
    return "\n".join(lines)


# ── Minikube Tools ────────────────────────────────────────────────────────────

@mcp.tool()
async def minikube_status(ctx: Context = None) -> str:
    """Check status of Minikube running states, VMs, and context name."""
    res = kube_client.get_minikube_status()
    if not res.get("success"):
        return f"Error checking Minikube: {res.get('error')}"
        
    if "minikube_installed" in res and not res["minikube_installed"]:
        return "❌ Minikube CLI is not installed or available in PATH."
        
    lines = [f"### Minikube Local Cluster Diagnostics\n"]
    lines.append(f"- **Active Context Name**: `{res.get('active_context', 'N/A')}`")
    
    status = res.get("minikube_status", {})
    if status:
        lines.append(f"- **Minikube Name**: `{status.get('Name', 'minikube')}`")
        host = status.get("Host", "Stopped")
        kubelet = status.get("Kubelet", "Stopped")
        apiserver = status.get("APIServer", "Stopped")
        lines.append(f"- **Host VM/Container**: `{host}`")
        lines.append(f"- **Kubelet state**: `{kubelet}`")
        lines.append(f"- **APIServer state**: `{apiserver}`")
    else:
        lines.append(f"```\n{res.get('raw_status')}\n```")
        
    return "\n".join(lines)


@mcp.tool()
async def minikube_control(action: str, ctx: Context = None) -> str:
    """Control local Minikube cluster lifecycle (start or stop).
    
    Args:
        action: Lifecycle action to take (start, stop).
    """
    if action not in ("start", "stop"):
        return "Error: Action must be 'start' or 'stop'."
        
    # Trigger command asynchronously
    logger.info(f"Triggering Minikube {action} asynchronously")
    
    # Run in a future and check response
    loop = asyncio.get_running_loop()
    task = loop.create_task(kube_client.run_minikube_cmd(action))
    
    # Block for standard tool return if completed fast, or note background progress
    try:
        # Wait up to 5 seconds. If it takes longer, return background status
        res = await asyncio.wait_for(task, timeout=5.0)
        if res.get("success"):
            return res.get("message")
        return f"Error executing Minikube: {res.get('error')}"
    except asyncio.TimeoutExpired:
        return f"Command 'minikube {action}' triggered and running in the background. Check cluster status using `minikube_status` in a moment."
    except Exception as e:
        return f"Error: {e}"


# --- FastAPI Companion App Mount Setup ---
web_app = FastAPI(title="Kubernetes MCP Companion WebApp", version=VERSION)

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@web_app.get("/health")
async def health_check():
    active_context = "unknown"
    try:
        from kubernetes import config
        _, active = config.list_kube_config_contexts()
        active_context = active.get("name", "unknown")
    except:
        pass
    return {"status": "ok", "version": VERSION, "context": active_context, "config_loaded": kube_client.config_loaded}

# Include routing
from .web import router as web_router
web_app.include_router(web_router)


def main():
    transport = os.getenv("MCP_TRANSPORT", "stdio").lower()
    
    # Start Web App
    web_thread = threading.Thread(
        target=lambda: uvicorn.run(web_app, host=WEB_HOST, port=WEB_PORT, log_level="warning"),
        daemon=True
    )
    web_thread.start()
    logger.info(f"FastAPI Companion WebApp running on http://{WEB_HOST}:{WEB_PORT}")
    
    if transport == "http":
        logger.info("Running MCP Server in HTTP transport mode (blocking)")
        mcp.run()
    else:
        logger.info("Running MCP Server in STDIO transport mode (blocking)")
        try:
            asyncio.run(mcp.run_stdio_async())
        except KeyboardInterrupt:
            logger.info("Shutting down via keyboard interrupt")

if __name__ == "__main__":
    main()
