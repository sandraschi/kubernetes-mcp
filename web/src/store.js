import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // Navigation & UI
  activeView: 'dashboard',
  sidebarCollapsed: false,
  setActiveView: (view) => set({ activeView: view }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Cluster Metadata
  configLoaded: false,
  activeContext: 'unknown',
  healthStatus: 'checking', // checking, healthy, unhealthy

  // Namespaces
  namespaces: ['default', 'kube-system', 'kube-public', 'kube-node-lease'],
  activeNamespace: 'default',
  setActiveNamespace: (ns) => {
    set({ activeNamespace: ns, pods: [], services: [], ingresses: [], selectedPod: null });
    get().fetchPods();
    get().fetchServices();
    get().fetchIngresses();
  },

  // Cluster Nodes
  nodes: [],
  nodesLoading: false,
  nodesError: null,

  // Pods
  pods: [],
  podsLoading: false,
  podsError: null,
  selectedPod: null,

  // Pod Details & Logs
  podDetail: null,
  podDetailLoading: false,
  podLogs: '',
  podLogsLoading: false,

  // Networking
  services: [],
  servicesLoading: false,
  servicesError: null,
  ingresses: [],
  ingressesLoading: false,
  ingressesError: null,

  // Minikube status
  minikubeStatus: null,
  minikubeLoading: false,
  minikubeError: null,
  minikubeInstalled: true,

  // Local LLM Detection
  localLlmStatus: 'checking', // checking, detected, not_detected
  localLlmUrl: '',
  localLlmModel: '',

  // --- Operations ---
  fetchClusterHealth: async () => {
    set({ healthStatus: 'checking' });
    try {
      const res = await fetch('/health');
      const data = await res.json();
      set({ 
        configLoaded: data.config_loaded, 
        activeContext: data.context || 'unknown',
        healthStatus: data.config_loaded ? 'healthy' : 'unhealthy'
      });
    } catch (err) {
      set({ healthStatus: 'unhealthy' });
    }
  },

  fetchNodes: async () => {
    set({ nodesLoading: true, nodesError: null });
    try {
      const res = await fetch('/api/nodes');
      const data = await res.json();
      if (data.success) {
        set({ nodes: data.data || [], nodesLoading: false });
      } else {
        set({ nodesError: data.error || 'Failed to load nodes', nodesLoading: false });
      }
    } catch (err) {
      set({ nodesError: err.message, nodesLoading: false });
    }
  },

  fetchPods: async () => {
    const ns = get().activeNamespace;
    set({ podsLoading: true, podsError: null });
    try {
      const res = await fetch(`/api/pods?namespace=${ns}`);
      const data = await res.json();
      if (data.success) {
        set({ pods: data.data || [], podsLoading: false });
      } else {
        set({ podsError: data.error || 'Failed to load pods', podsLoading: false });
      }
    } catch (err) {
      set({ podsError: err.message, podsLoading: false });
    }
  },

  selectPod: async (podName) => {
    const ns = get().activeNamespace;
    if (!podName) {
      set({ selectedPod: null, podDetail: null, podLogs: '' });
      return;
    }
    set({ selectedPod: podName, podDetailLoading: true, podLogs: '', podLogsLoading: true });
    
    // Fetch details
    try {
      const detailRes = await fetch(`/api/pod/describe?namespace=${ns}&name=${podName}`);
      const detailData = await detailRes.json();
      if (detailData.success) {
        set({ podDetail: detailData.data, podDetailLoading: false });
      } else {
        set({ podDetailLoading: false });
      }

      // Fetch logs
      const logsRes = await fetch(`/api/pod/logs?namespace=${ns}&name=${podName}&tail_lines=150`);
      const logsData = await logsRes.json();
      if (logsData.success) {
        set({ podLogs: logsData.data, podLogsLoading: false });
      } else {
        set({ podLogs: `Failed to fetch logs: ${logsData.error}`, podLogsLoading: false });
      }
    } catch (err) {
      set({ podDetailLoading: false, podLogsLoading: false, podLogs: `Failed to load data: ${err.message}` });
    }
  },

  scaleDeployment: async (name, replicas) => {
    const ns = get().activeNamespace;
    try {
      const res = await fetch('/api/deployment/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace: ns, name, replicas })
      });
      const data = await res.json();
      if (data.success) {
        get().fetchPods(); // reload pods
        return { success: true };
      }
      return { success: false, error: data.detail || 'Scale failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  restartDeployment: async (name) => {
    const ns = get().activeNamespace;
    try {
      const res = await fetch('/api/deployment/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace: ns, name })
      });
      const data = await res.json();
      if (data.success) {
        get().fetchPods();
        return { success: true };
      }
      return { success: false, error: data.detail || 'Restart failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  applyYaml: async (yamlContent) => {
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml_content: yamlContent })
      });
      const data = await res.json();
      if (data.success) {
        get().fetchPods();
        get().fetchServices();
        get().fetchIngresses();
        return { success: true, summary: data.summary, results: data.results };
      }
      return { success: false, error: data.detail || 'Apply failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  fetchServices: async () => {
    const ns = get().activeNamespace;
    set({ servicesLoading: true, servicesError: null });
    try {
      const res = await fetch(`/api/services?namespace=${ns}`);
      const data = await res.json();
      if (data.success) {
        set({ services: data.data || [], servicesLoading: false });
      } else {
        set({ servicesError: data.error || 'Failed to load services', servicesLoading: false });
      }
    } catch (err) {
      set({ servicesError: err.message, servicesLoading: false });
    }
  },

  fetchIngresses: async () => {
    const ns = get().activeNamespace;
    set({ ingressesLoading: true, ingressesError: null });
    try {
      const res = await fetch(`/api/ingresses?namespace=${ns}`);
      const data = await res.json();
      if (data.success) {
        set({ ingresses: data.data || [], ingressesLoading: false });
      } else {
        set({ ingressesError: data.error || 'Failed to load ingresses', ingressesLoading: false });
      }
    } catch (err) {
      set({ ingressesError: err.message, ingressesLoading: false });
    }
  },

  fetchMinikubeStatus: async () => {
    set({ minikubeLoading: true, minikubeError: null });
    try {
      const res = await fetch('/api/minikube/status');
      const data = await res.json();
      if (data.success) {
        if (data.message && data.message.includes('not found')) {
          set({ minikubeInstalled: false, minikubeLoading: false });
        } else {
          set({ 
            minikubeStatus: data.minikube_status || data.raw_status || null, 
            minikubeInstalled: true, 
            minikubeLoading: false 
          });
        }
      } else {
        set({ minikubeError: data.error || 'Failed to load minikube status', minikubeLoading: false });
      }
    } catch (err) {
      set({ minikubeError: err.message, minikubeLoading: false });
    }
  },

  controlMinikube: async (action) => {
    try {
      const res = await fetch('/api/minikube/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        get().fetchMinikubeStatus();
        return { success: true };
      }
      return { success: false, error: data.detail || 'Minikube control action failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // --- Local LLM Autodiscovery ---
  detectLocalLlm: async () => {
    set({ localLlmStatus: 'checking' });
    const ports = [11434, 1234, 8000];
    
    for (const port of ports) {
      try {
        const url = `http://127.0.0.1:${port}`;
        if (port === 11434) {
          const res = await fetch(`${url}/api/tags`, { mode: 'cors' });
          if (res.ok) {
            const data = await res.json();
            const models = data.models || [];
            const modelName = models.length > 0 ? models[0].name : 'Llama/Gemma';
            set({ 
              localLlmStatus: 'detected', 
              localLlmUrl: url,
              localLlmModel: `Ollama (${modelName})`
            });
            return;
          }
        } else {
          const res = await fetch(url, { mode: 'no-cors' });
          set({ 
            localLlmStatus: 'detected', 
            localLlmUrl: url,
            localLlmModel: port === 1234 ? 'LM Studio' : 'vLLM/Local'
          });
          return;
        }
      } catch (e) {
        // scan next
      }
    }
    set({ localLlmStatus: 'not_detected', localLlmUrl: '', localLlmModel: '' });
  }
}))
