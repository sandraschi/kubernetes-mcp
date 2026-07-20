# kubernetes-mcp — Claude Code Guide

## Overview
FastMCP 3.4.4+ server for Kubernetes cluster orchestration and Minikube automation.

## Entry Points
- `uv run python -m kubernetes_mcp`

## Standards
- Format code using `just fmt` (ruff).
- Lint code using `just lint` (ruff check).
- Run unit tests with `just test` (pytest).
- React frontend: Bun + Zustand + Tailwind CSS v3.
- Build frontend: `just build-frontend` in root or `bun run build` in `/web`.
- See [mcp-central-docs](https://github.com/sandraschi/mcp-central-docs) for global standards.
