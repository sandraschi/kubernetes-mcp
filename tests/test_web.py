import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from kubernetes_mcp.server import web_app as app


client = TestClient(app)


@patch("kubernetes_mcp.web.kube_client")
def test_get_nodes(mock_kube_client):
    mock_kube_client.list_nodes.return_value = {
        "success": True,
        "data": [{"name": "node-1", "status": "Ready", "version": "v1.28.2", "os": "linux", "cpu": "4", "memory": "8Gi"}]
    }
    
    response = client.get("/api/nodes")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "node-1"


@patch("kubernetes_mcp.web.kube_client")
def test_get_pods(mock_kube_client):
    mock_kube_client.list_pods.return_value = {
        "success": True,
        "data": [{"name": "pod-1", "status": "Running", "ip": "10.244.0.5", "node": "node-1", "restarts": 0, "age": "2026-07-20T22:00:00Z"}]
    }
    
    response = client.get("/api/pods?namespace=default")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "pod-1"


@patch("kubernetes_mcp.web.kube_client")
def test_scale_deployment(mock_kube_client):
    mock_kube_client.scale_deployment.return_value = {
        "success": True,
        "message": "Scaled to 3 replicas"
    }
    
    response = client.post("/api/deployment/scale", json={"namespace": "default", "name": "nginx", "replicas": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Scaled to 3 replicas" in data["message"]
