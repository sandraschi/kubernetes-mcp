# Development Setup

## Prerequisites

Before contributing, install the required automation tools:

```bash
# Windows (winget)
winget install astral-sh.uv
winget install Git.Git
winget install Casey.Just
```

Verify the tools are available in your shell:
```bash
uv --version
git --version
just --version
bun --version
```

---

## Setup & Run

1. Clone the repository and sync backend dependencies:
   ```bash
   git clone https://github.com/sandraschi/kubernetes-mcp
   cd kubernetes-mcp
   uv sync
   ```

2. Run tests to ensure environment sanity:
   ```bash
   just test
   ```

3. Spin up fullstack hot-reload server:
   ```powershell
   ./start.ps1
   ```

---

## Development Automation

We use `just` commands to manage recurring tasks:

| Command | Action |
|---------|--------|
| `just fmt` | Format python files with `ruff`. |
| `just lint` | Validate lint guidelines with `ruff`. |
| `just test` | Run complete pytest suite. |
| `just build-frontend` | Compile optimized production Vite SPA to `/web/dist`. |
| `just build-all` | Run frontend compiler and compile Python distribution wheels. |
