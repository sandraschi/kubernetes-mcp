# Per-repo fleet start config for kubernetes-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'kubernetes-mcp'
    BackendPort  = 11183
    FrontendPort = 11184
    HealthPath   = '/health'
    WebRoot      = 'web'
    Backend = @{
        Kind          = 'uvicorn-web-app'
        UvicornTarget = 'kubernetes_mcp.server:web_app'
        SyncExtras    = @('dev')
        SyncOnStart  = $true
        Env           = @{ WEB_PORT = '11183' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
        PortEnvVar     = 'VITE_PORT'
        ApiTargetEnv   = 'VITE_API_TARGET'
    }
}
