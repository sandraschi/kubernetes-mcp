# Troubleshooting Guide

## Kubeconfig Not Found / Connection Fails
**Cause**: The local context was not initialized, or kubeconfig is missing from `~/.kube/config`.  
**Fix**: Verify your cluster is running (`kubectl cluster-info` or `minikube status`). If using a custom path, ensure `KUBECONFIG` environment variable is set.

## Minikube status fails or command not found
**Cause**: Minikube CLI is not installed or not exposed in Windows system %PATH%.  
**Fix**: Download Minikube CLI and verify running `minikube version` in a new PowerShell window works.

## Deployment scaling or rollout fails (Forbidden)
**Cause**: Active context user permissions do not allow modifying workloads in the target namespace.  
**Fix**: Log in as a cluster administrator or verify RBAC policies allow writing Deployment resources.

## Port already in use (Vite/FastAPI)
**Cause**: A zombie launcher process is holding ports 10810 or 10811.  
**Fix**: Run `./start.ps1` to automatically scan and clean up port listener conflicts.
