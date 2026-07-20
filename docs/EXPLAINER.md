# Kubernetes, Minikube, and Docker Explainer

## 1. Kubernetes vs. Vanilla Docker

Understanding the difference between **Docker** and **Kubernetes** is central to understanding modern containerization.

```
+-------------------------------------------------------------+
|                        KUBERNETES                           |
|  Orchestrates, scales, and heals containers across multiple |
|  nodes (servers). Handles ingress, configuration, secrets.  |
|                                                             |
|   +-------------------+             +-------------------+   |
|   |      Node 1       |             |      Node 2       |   |
|   |  +-------------+  |             |  +-------------+  |   |
|   |  | Pod (Docker) |  |             |  | Pod (Docker) |  |   |
|   |  +-------------+  |             |  +-------------+  |   |
|   +-------------------+             +-------------------+   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                      VANILLA DOCKER                         |
|  Runs and manages individual containers on a single host.    |
|  No native cluster clustering or automatic multi-node.      |
+-------------------------------------------------------------+
```

| Dimension | Vanilla Docker | Kubernetes (K8s) |
| :--- | :--- | :--- |
| **Scale** | Single node/host execution. | Multi-node clustered execution (fleet scale). |
| **Deployment Unit** | Container. | Pod (one or more tightly coupled containers). |
| **Self-Healing** | Simple restart policies (always, on-failure). | Proactive probes (Liveness/Readiness), auto-recreation of failed pods. |
| **Load Balancing** | External proxy or simple port binding required. | Built-in Services load balance traffic across pods dynamically. |
| **Scaling** | Manual container spin-up. | Auto-scalers (Horizontal Pod Autoscaler) based on CPU/RAM metrics. |
| **Service Discovery** | Basic Docker bridge networks. | Built-in DNS resolver (CoreDNS) routes traffic by service name. |

---

## 2. What is Minikube?

**Minikube** is a lightweight Kubernetes implementation that initializes a local virtual machine or Docker-in-Docker container on your local computer to host a single-node cluster. 

It is designed for developers who want a local testing playground to:
* Validate Deployment YAMLs before pushing to cloud providers (e.g. EKS, GKE, AKS).
* Test ingress routes and cluster service configurations locally.
* Mount local development directories inside running containers using VM sharing scripts.

---

## 3. History & Bibliography

### History
* **2003-2013: Google Borg**: Google developed a cluster management tool named Borg to schedule millions of jobs across thousands of servers.
* **2014: Open Source Release**: Google open-sourced the project under the name **Kubernetes** (Greek for "helmsman" or "pilot") as a containerized successor to Borg.
* **2015: CNCF Foundation**: Google donated Kubernetes to the newly formed Cloud Native Computing Foundation (CNCF) under the Linux Foundation, establishing it as the industry standard for cloud-native orchestration.

### Bibliography
1. **Google Borg Whitepaper**: *Large-scale cluster management at Google with Borg* (Verma et al., EuroSys 2015). [Read paper](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/)
2. **Kubernetes API Specification**: Official reference document outlining the JSON/YAML schema structure. [Read documentation](https://kubernetes.io/docs/reference/kubernetes-api/)
3. **Minikube Project Page**: Repository hosting local virtualization drivers. [Read repo](https://github.com/kubernetes/minikube)

---

## 4. Community Links

* **Kubernetes Slack**: Connect with cloud-native developers. [Join Slack](https://slack.k8s.io/)
* **Kubernetes GitHub**: Official repositories. [Browse code](https://github.com/kubernetes/kubernetes)
* **CNCF Forums**: Open source discussions. [Browse forum](https://forum.cncf.io/)
