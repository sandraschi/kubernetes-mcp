"""
FastAPI routing for companion webapp integration and Kubernetes/Minikube cluster proxies.
"""

from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .client import kube_client

router = APIRouter(prefix="/api")

# Directory configuration for frontend static files
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
dist_dir = project_root / "web" / "dist"


# ── Kubernetes Cluster Proxies ────────────────────────────────────────────────

@router.get("/nodes")
async def get_nodes():
    res = kube_client.list_nodes()
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


@router.get("/pods")
async def get_pods(namespace: str = "default"):
    res = kube_client.list_pods(namespace)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


@router.get("/pod/logs")
async def get_pod_logs(
    namespace: str,
    name: str,
    container: Optional[str] = None,
    tail_lines: int = 100
):
    res = kube_client.get_pod_logs(namespace, name, container, tail_lines)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


@router.get("/pod/describe")
async def get_pod_describe(namespace: str, name: str):
    res = kube_client.get_pod_description(namespace, name)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


class ScalePayload(BaseModel):
    namespace: str
    name: str
    replicas: int


@router.post("/deployment/scale")
async def scale_deployment(payload: ScalePayload):
    res = kube_client.scale_deployment(payload.namespace, payload.name, payload.replicas)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


class RestartPayload(BaseModel):
    namespace: str
    name: str


@router.post("/deployment/restart")
async def restart_deployment(payload: RestartPayload):
    res = kube_client.rollout_restart_deployment(payload.namespace, payload.name)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


class ApplyPayload(BaseModel):
    yaml_content: str


@router.post("/apply")
async def apply_yaml(payload: ApplyPayload):
    res = kube_client.apply_yaml(payload.yaml_content)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


@router.get("/services")
async def get_services(namespace: str = "default"):
    res = kube_client.list_services(namespace)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


@router.get("/ingresses")
async def get_ingresses(namespace: str = "default"):
    res = kube_client.list_ingresses(namespace)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


# ── Minikube Local Controls ───────────────────────────────────────────────────

@router.get("/minikube/status")
async def get_minikube_status():
    res = kube_client.get_minikube_status()
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


class MinikubeControlPayload(BaseModel):
    action: str # start, stop


@router.post("/minikube/control")
async def control_minikube(payload: MinikubeControlPayload):
    if payload.action not in ("start", "stop"):
        raise HTTPException(status_code=400, detail="Action must be 'start' or 'stop'")
    res = await kube_client.run_minikube_cmd(payload.action)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


# ── SPA Mount Setup ───────────────────────────────────────────────────────────

def setup_webapp(app):
    """Mounts built SPA static assets from web/dist or registers fallback route."""
    if dist_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

        @app.get("/{full_path:path}", response_class=HTMLResponse)
        async def serve_spa(full_path: str):
            # Skip API endpoints
            if full_path.startswith("api/") or full_path.startswith("mcp"):
                return None

            index_path = dist_dir / "index.html"
            if index_path.exists():
                return FileResponse(index_path)
            return HTMLResponse(
                content="<h1>Frontend UI not built</h1><p>Please run <code>just build-frontend</code> to compile.</p>",
                status_code=404,
            )
    else:
        @app.get("/", response_class=HTMLResponse)
        async def dev_hint():
            return HTMLResponse(
                content="<h1>Static files missing</h1><p>Expected <code>web/dist</code> but it does not exist.</p>"
            )
