import React, { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Layers, 
  Globe, 
  Terminal, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  ExternalLink,
  Info,
  Sparkles,
  RefreshCw,
  Cpu,
  Server,
  Play,
  Square,
  AlertTriangle,
  Settings,
  Code
} from 'lucide-react'
import { useAppStore } from './store'

export default function App() {
  const {
    activeView,
    sidebarCollapsed,
    configLoaded,
    activeContext,
    healthStatus,
    namespaces,
    activeNamespace,
    nodes,
    nodesLoading,
    nodesError,
    pods,
    podsLoading,
    podsError,
    selectedPod,
    podDetail,
    podDetailLoading,
    podLogs,
    podLogsLoading,
    services,
    servicesLoading,
    ingresses,
    ingressesLoading,
    minikubeStatus,
    minikubeLoading,
    minikubeError,
    minikubeInstalled,
    localLlmStatus,
    localLlmUrl,
    localLlmModel,
    setActiveView,
    setSidebarCollapsed,
    setActiveNamespace,
    fetchClusterHealth,
    fetchNodes,
    fetchPods,
    selectPod,
    scaleDeployment,
    restartDeployment,
    applyYaml,
    fetchServices,
    fetchIngresses,
    fetchMinikubeStatus,
    controlMinikube,
    detectLocalLlm
  } = useAppStore()

  // Deployment scale input
  const [scaleNum, setScaleNum] = useState(1)
  const [scaleTarget, setScaleTarget] = useState('')
  
  // YAML input
  const [yamlContent, setYamlContent] = useState('')
  const [yamlResult, setYamlResult] = useState(null)
  const [yamlError, setYamlError] = useState('')

  useEffect(() => {
    fetchClusterHealth()
    fetchNodes()
    fetchPods()
    fetchServices()
    fetchIngresses()
    fetchMinikubeStatus()
    detectLocalLlm()
  }, [])

  const handleRefreshAll = () => {
    fetchClusterHealth()
    fetchNodes()
    fetchPods()
    fetchServices()
    fetchIngresses()
    fetchMinikubeStatus()
  }

  const handleScale = async (e) => {
    e.preventDefault()
    if (!scaleTarget) return
    const res = await scaleDeployment(scaleTarget, parseInt(scaleNum))
    if (res.success) {
      alert(`Scaled deployment ${scaleTarget} to ${scaleNum} replicas.`)
      setScaleTarget('')
    } else {
      alert(`Error: ${res.error}`)
    }
  }

  const handleRestart = async (depName) => {
    if (confirm(`Restart deployment ${depName}?`)) {
      const res = await restartDeployment(depName)
      if (res.success) {
        alert(`Restart rollout triggered for ${depName}`)
      } else {
        alert(`Error: ${res.error}`)
      }
    }
  }

  const handleApplyYaml = async (e) => {
    e.preventDefault()
    setYamlError('')
    setYamlResult(null)
    if (!yamlContent.trim()) {
      setYamlError('YAML content cannot be empty.')
      return
    }
    const res = await applyYaml(yamlContent)
    if (res.success) {
      setYamlResult(res)
    } else {
      setYamlError(res.error || 'Apply failed.')
    }
  }

  return (
    <div className="flex h-screen bg-surface-950 text-surface-100 overflow-hidden font-sans">
      {/* --- Sidebar --- */}
      <aside 
        className={`bg-surface-900 border-r border-surface-800 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-800 h-16 shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-primary-500 animate-pulse" />
              <span className="font-bold text-base tracking-wider bg-gradient-to-r from-primary-400 to-blue-500 bg-clip-text text-transparent">
                KUBERNETES MCP
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <Server className="h-6 w-6 text-primary-500 mx-auto" />
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-100 transition-colors focus:outline-none"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'workloads', label: 'Workloads (Pods)', icon: Layers },
            { id: 'networking', label: 'Networking (SVC)', icon: Globe },
            { id: 'minikube', label: 'Minikube Controller', icon: Settings },
            { id: 'apidocs', label: 'API Docs', icon: BookOpen }
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-500 text-white font-semibold shadow-lg shadow-primary-500/25' 
                    : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-surface-800 text-xs text-surface-500 shrink-0">
          {!sidebarCollapsed && (
            <div className="flex flex-col gap-1">
              <div>Version 0.1.0</div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${configLoaded ? 'bg-green-500' : 'bg-red-500 animate-ping'}`} />
                <span>{configLoaded ? 'Kubeconfig Connected' : 'Disconnected'}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- Main Application Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Fixed Topbar */}
        <header className="bg-surface-900 border-b border-surface-800 h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize text-surface-200">
              {activeView === 'apidocs' ? 'API Documentation' : activeView}
            </h2>
            
            {/* Context Badge */}
            {configLoaded && (
              <div className="hidden sm:flex items-center gap-2 bg-surface-850 border border-surface-800 px-3 py-1 rounded-full text-xs text-surface-300">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Active Context: <strong>{activeContext}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Local LLM Autodiscovery */}
            <div className="flex items-center gap-2 bg-surface-850 px-3 py-1 rounded-lg border border-surface-800 text-xs">
              <Cpu className="h-4 w-4 text-blue-400" />
              {localLlmStatus === 'detected' ? (
                <span className="text-green-400">AI: {localLlmModel}</span>
              ) : localLlmStatus === 'checking' ? (
                <span className="text-surface-500">Checking local LLM...</span>
              ) : (
                <span className="text-surface-400 hover:text-blue-300 cursor-pointer" onClick={detectLocalLlm} title="Click to rescan">
                  GPU Opportunity Available
                </span>
              )}
            </div>

            {/* Namespace Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-400 hidden md:inline">Namespace:</span>
              <select
                value={activeNamespace}
                onChange={(e) => setActiveNamespace(e.target.value)}
                className="bg-surface-800 border border-surface-700 rounded-lg text-xs px-3 py-1.5 text-surface-200 focus:outline-none focus:border-primary-500"
              >
                {namespaces.map((ns) => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleRefreshAll}
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-100 transition-colors"
              title="Refresh All Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* --- Dynamic Page Body --- */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface-950">
          
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              
              {/* GPU Opportunity Banner */}
              {localLlmStatus === 'not_detected' && (
                <div className="bg-gradient-to-r from-blue-500/10 to-primary-600/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-6 w-6 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-primary-400">High-Performance GPU Detected?</h4>
                      <p className="text-xs text-surface-400 mt-0.5">
                        Troubleshoot container errors locally. Run **Ollama** or **LM Studio**, and this webapp will automatically bind to assist with diagnostic log logs.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open('https://ollama.com', '_blank')}
                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
                  >
                    Download Ollama
                  </button>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl shadow-lg">
                  <div className="text-xs text-surface-500 font-medium">CLUSTER HEALTH</div>
                  <div className="text-lg font-bold text-surface-200 mt-1 flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${healthStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {healthStatus === 'healthy' ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-xs text-surface-400 mt-1 truncate">Context: {activeContext}</div>
                </div>

                <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl shadow-lg">
                  <div className="text-xs text-surface-500 font-medium">NODES</div>
                  <div className="text-2xl font-bold text-primary-500 mt-1">{nodes.length}</div>
                  <div className="text-xs text-surface-400 mt-1">Ready nodes: {nodes.filter(n => n.status === 'Ready').length}</div>
                </div>

                <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl shadow-lg">
                  <div className="text-xs text-surface-500 font-medium">TOTAL PODS</div>
                  <div className="text-2xl font-bold text-blue-500 mt-1">{podsLoading ? '...' : pods.length}</div>
                  <div className="text-xs text-surface-400 mt-1">Namespace: {activeNamespace}</div>
                </div>

                <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl shadow-lg">
                  <div className="text-xs text-surface-500 font-medium">UNHEALTHY PODS</div>
                  <div className="text-2xl font-bold text-red-500 mt-1">
                    {podsLoading ? '...' : pods.filter(p => p.status !== 'Running' && p.status !== 'Completed').length}
                  </div>
                  <div className="text-xs text-surface-400 mt-1">Running OK: {pods.filter(p => p.status === 'Running').length}</div>
                </div>
              </div>

              {/* Node List & Yaml Editor Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Node list */}
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg lg:col-span-2 space-y-4">
                  <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2">
                    CLUSTER NODES LIST
                  </h3>
                  {nodesLoading && <div className="text-center py-6 text-xs text-surface-500">Loading nodes...</div>}
                  <div className="space-y-3">
                    {nodes.map((n) => (
                      <div key={n.name} className="bg-surface-850 p-4 rounded-xl border border-surface-800 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-surface-200">{n.name}</div>
                          <div className="text-[10px] text-surface-500 mt-0.5">Kubelet: {n.version} | OS: {n.os}</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            n.status === 'Ready' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {n.status}
                          </span>
                          <div className="text-[10px] text-surface-400 mt-1">{n.cpu} CPU | {n.memory} RAM</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Yaml Card */}
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg space-y-4">
                  <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2 flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary-500" />
                    APPLY RESOURCE YAML
                  </h3>
                  
                  <form onSubmit={handleApplyYaml} className="space-y-4">
                    <textarea
                      placeholder="Paste your Kubernetes YAML configuration here..."
                      value={yamlContent}
                      onChange={(e) => setYamlContent(e.target.value)}
                      rows={6}
                      className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2.5 font-mono text-[10px] text-surface-300 focus:outline-none focus:border-primary-500"
                    />

                    {yamlError && (
                      <div className="text-[10px] text-red-400 bg-red-500/10 p-2.5 rounded-lg flex items-center gap-1.5 border border-red-500/20">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{yamlError}</span>
                      </div>
                    )}

                    {yamlResult && (
                      <div className="text-[10px] text-green-400 bg-green-500/10 p-2.5 rounded-lg border border-green-500/20 space-y-1">
                        <div className="font-bold">YAML Applied successfully:</div>
                        <div className="font-mono">{yamlResult.summary}</div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg text-xs tracking-wider transition-colors shadow-lg shadow-primary-500/20"
                    >
                      APPLY CONFIGURATION
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Workloads View */}
          {activeView === 'workloads' && (
            <div className="space-y-6">
              
              {!configLoaded && (
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-8 text-center text-xs text-surface-500">
                  Connect kubeconfig to load namespace workloads.
                </div>
              )}

              {configLoaded && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Pod Grid */}
                  <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2 flex items-center justify-between">
                      <span>PODS WORKLOADS ({pods.length})</span>
                      <button onClick={fetchPods} className="p-1 rounded bg-surface-850 hover:bg-surface-800 text-surface-400">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </h3>

                    {podsLoading && <div className="text-center py-6 text-xs text-surface-500">Loading workloads...</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
                      {pods.map((p) => {
                        const isSelected = selectedPod === p.name
                        const isRunning = p.status === 'Running' || p.status === 'Completed'
                        return (
                          <div
                            key={p.name}
                            onClick={() => selectPod(p.name)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-surface-850 border-primary-500' 
                                : 'bg-surface-900 border-surface-800 hover:border-surface-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs tracking-wider text-surface-200 truncate block max-w-[12rem]">
                                {p.name}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isRunning ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-surface-500 mt-2 space-y-0.5">
                              <div>IP Address: {p.ip}</div>
                              <div>Target Node: {p.node}</div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-800">
                                <span>Restarts: {p.restarts}</span>
                                <span>Age: {p.age.split('T')[0]}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Detail Panel & Logs Viewer */}
                  <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg space-y-4 h-fit flex flex-col max-h-[80vh] overflow-hidden">
                    <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2 shrink-0">
                      POD DETAIL DIAGNOSTIC
                    </h3>

                    {selectedPod ? (
                      <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                        
                        {/* Pod properties */}
                        {podDetailLoading ? (
                          <div className="text-center py-6 text-xs text-surface-500 shrink-0">Loading describe specs...</div>
                        ) : podDetail ? (
                          <div className="text-xs text-surface-400 space-y-2 shrink-0">
                            <div>Name: <strong className="text-surface-200">{podDetail.name}</strong></div>
                            <div>Status: <span className="text-blue-400 font-semibold">{podDetail.status}</span></div>
                            <div>Pod IP: <code className="text-surface-300 bg-surface-950 px-1 py-0.5 rounded">{podDetail.ip}</code></div>
                            
                            {/* Containers list */}
                            <div className="pt-2 border-t border-surface-800">
                              <span className="font-medium text-surface-300">Containers:</span>
                              <ul className="list-disc list-inside mt-1 text-[10px] space-y-1">
                                {podDetail.containers.map((c) => (
                                  <li key={c.name} className="truncate">
                                    <strong className="text-surface-300">{c.name}</strong> ({c.image})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : null}

                        {/* Logs Terminal box */}
                        <div className="flex-1 flex flex-col min-h-[15rem] overflow-hidden border border-surface-800 rounded-lg bg-surface-950">
                          <div className="p-2 border-b border-surface-800 bg-surface-900 flex items-center justify-between text-[10px] text-surface-500">
                            <span className="flex items-center gap-1.5"><Terminal className="h-3 w-3" /> Stdout Logs</span>
                            <button 
                              onClick={() => selectPod(selectedPod)}
                              className="p-1 rounded bg-surface-800 hover:bg-surface-700 text-surface-400"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <div className="flex-1 p-2.5 font-mono text-[9px] text-green-400 overflow-y-auto whitespace-pre-wrap select-all">
                            {podLogsLoading ? 'Fetching container log stdout...' : podLogs || 'No logs available.'}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-12 text-surface-500 text-xs italic">
                        Select a pod workload from the grid to view details and diagnostics logs.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Networking View */}
          {activeView === 'networking' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Services List */}
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg space-y-4">
                <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2 flex items-center justify-between">
                  <span>SERVICES (CLUSTER IPS)</span>
                  <button onClick={fetchServices} className="p-1 rounded bg-surface-850 hover:bg-surface-800 text-surface-400">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </h3>
                
                {servicesLoading && <div className="text-center py-6 text-xs text-surface-500">Loading services...</div>}
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {services.map((s) => (
                    <div key={s.name} className="bg-surface-850 p-4 rounded-xl border border-surface-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-surface-200">{s.name}</div>
                        <div className="text-[10px] text-surface-500 mt-1">Ports: {s.ports.join(', ')}</div>
                      </div>
                      <div className="text-right">
                        <code className="text-xs text-primary-400 bg-surface-950 px-2 py-0.5 rounded">{s.cluster_ip}</code>
                        <div className="text-[10px] text-surface-500 mt-1">Type: {s.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingress Router List */}
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg space-y-4">
                <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2 flex items-center justify-between">
                  <span>INGRESS INBOUND ROUTES</span>
                  <button onClick={fetchIngresses} className="p-1 rounded bg-surface-850 hover:bg-surface-800 text-surface-400">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </h3>
                
                {ingressesLoading && <div className="text-center py-6 text-xs text-surface-500">Loading ingress routing...</div>}
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {ingresses.map((ing) => (
                    <div key={ing.name} className="bg-surface-850 p-4 rounded-xl border border-surface-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-surface-800 pb-2">
                        <span className="font-semibold text-xs text-surface-200">{ing.name}</span>
                        <code className="text-[10px] text-surface-400">{ing.ips.join(', ') || 'Pending IP'}</code>
                      </div>
                      
                      <div className="space-y-1 text-[10px] text-surface-400">
                        {ing.rules.map((rule, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="font-medium text-surface-300">Host: <code>{rule.host}</code></div>
                            {rule.paths.map((p, pIdx) => (
                              <div key={pIdx} className="pl-3 flex items-center gap-1.5">
                                <span>Path: <code>{p.path}</code></span>
                                <span>➔</span>
                                <span>Service: <code>{p.backend}</code></span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Minikube Controller */}
          {activeView === 'minikube' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Diagnostics details */}
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2 flex items-center justify-between">
                  <span>MINIKUBE DIAGNOSTIC STATUS</span>
                  <button onClick={fetchMinikubeStatus} className="p-1 rounded bg-surface-850 hover:bg-surface-800 text-surface-400">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </h3>
                
                {minikubeLoading && <div className="text-center py-6 text-xs text-surface-500">Checking Minikube VM state...</div>}
                
                {!minikubeInstalled && !minikubeLoading && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>Minikube CLI is not installed locally or not found in Windows system environment %PATH%.</span>
                  </div>
                )}

                {minikubeInstalled && !minikubeLoading && minikubeStatus && (
                  <div className="space-y-4 text-xs">
                    {typeof minikubeStatus === 'object' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-surface-850 p-4 rounded-xl border border-surface-800">
                          <span className="text-[10px] text-surface-500 font-medium">VM HOST STATE</span>
                          <div className="text-lg font-bold text-surface-200 mt-1">{minikubeStatus.Host || 'Stopped'}</div>
                        </div>

                        <div className="bg-surface-850 p-4 rounded-xl border border-surface-800">
                          <span className="text-[10px] text-surface-500 font-medium">API SERVER CONNECTIVITY</span>
                          <div className="text-lg font-bold text-primary-500 mt-1">{minikubeStatus.APIServer || 'Stopped'}</div>
                        </div>

                        <div className="bg-surface-850 p-4 rounded-xl border border-surface-800">
                          <span className="text-[10px] text-surface-500 font-medium">KUBELET SERVICE</span>
                          <div className="text-lg font-bold text-blue-400 mt-1">{minikubeStatus.Kubelet || 'Stopped'}</div>
                        </div>

                        <div className="bg-surface-850 p-4 rounded-xl border border-surface-800">
                          <span className="text-[10px] text-surface-500 font-medium">DISK USAGE</span>
                          <div className="text-lg font-bold text-surface-300 mt-1">{minikubeStatus.DiskSpace || 'N/A'}</div>
                        </div>
                      </div>
                    ) : (
                      <pre className="bg-surface-950 p-4 rounded-xl font-mono text-[10px] overflow-auto text-surface-300">
                        {minikubeStatus}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* VM controls */}
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 shadow-lg space-y-4 h-fit">
                <h3 className="font-semibold text-sm tracking-wider text-surface-300 border-b border-surface-800 pb-2">
                  LIFECYCLE CONTROL PANEL
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (confirm('Start Minikube cluster VM? This takes ~1-2 minutes.')) {
                          controlMinikube('start').then(res => {
                            if (res.success) alert('Minikube start command completed.')
                          })
                        }
                      }}
                      disabled={!minikubeInstalled}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      START CLUSTER
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Stop Minikube cluster VM?')) {
                          controlMinikube('stop').then(res => {
                            if (res.success) alert('Minikube stopped.')
                          })
                        }
                      }}
                      disabled={!minikubeInstalled}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
                    >
                      <Square className="h-4 w-4" />
                      STOP VM
                    </button>
                  </div>

                  <div className="text-[10px] text-surface-500 leading-relaxed bg-surface-950 p-3 rounded-lg border border-surface-800">
                    <div className="font-bold flex items-center gap-1.5 mb-1.5 text-surface-400">
                      <Info className="h-3.5 w-3.5" /> Useful CLI exposure tips:
                    </div>
                    - Expose ingress rules locally: run `minikube tunnel` in your shell.<br />
                    - Connect terminal docker context: run `minikube docker-env`.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* API Docs View */}
          {activeView === 'apidocs' && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl shadow-lg h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-surface-800 bg-surface-850 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs text-surface-400">
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  <span>FastAPI Swagger UI (Port 10811)</span>
                </div>
                <button 
                  onClick={() => window.open(`http://localhost:${WEB_PORT}/docs`, '_blank')}
                  className="text-xs text-primary-500 hover:text-primary-400 font-semibold inline-flex items-center gap-1.5"
                >
                  Open in New Tab <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <iframe 
                src="/docs"
                className="flex-1 w-full border-none"
                title="FastAPI Swagger UI"
              />
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
