# MCP Tool Reference

The `kubernetes-mcp` server registers the following tools to interact with Kubernetes clusters.

## Node & Health Diagnostics
- **`k8s_node_list`**: Retrieves Ready states, versions, OS types, CPU/RAM capacities, and maximum pod allocations for each node.
- **`k8s_cluster_health`**: Verifies active kubeconfig contexts, user auth tags, and control plane endpoint connectivity.

## Workloads Browser & Logs
- **`k8s_pod_list`**: Returns running/completed/failed phases for namespace pods.
- **`k8s_pod_describe`**: Combines spec metrics and recent cluster event logs (crucial for finding pod configuration details).
- **`k8s_pod_logs`**: Streams container stdout logs (supports tail-line limits).

## Workload Controls
- **`k8s_deployment_scale`**: Edits replica targets of deployments.
- **`k8s_rollout_restart`**: Triggers rolling update deployments.
- **`k8s_apply_yaml`**: Synthesizes creates and patch updates for YAML configurations.

## Networking
- **`k8s_service_list`**: Lists active endpoints, ClusterIP allocations, selectors, and ports.
- **`k8s_ingress_list`**: Resolves Ingress controllers load-balancer IPs and HTTP routing path bindings.

## Local Minikube Lifecycle
- **`minikube_status`**: Inspects API server, Host VM/Container, and Kubelet runtimes.
- **`minikube_control`**: Start and Stop operations for the local VM cluster.
