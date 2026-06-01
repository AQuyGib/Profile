export function createAppState(initial = {}) {
  const state = {
    loaded: false,
    language: 'vi',
    activeZoneId: 'home',
    targetPosition: null,
    zones: [],
    isLoadingAI: false,
    chatHistory: [],
    isChatOpen: false,
    is3DActive: false,
    threeInstance: null,
    ui: {
      loading: {
        status: 'booting',
        progress: 0,
        message: '',
        error: null
      },
      assets: {
        loading: false,
        error: null,
        failures: []
      },
      api: {
        loading: false,
        error: null,
        lastResponseAt: null
      },
      mobile: {
        dpadVisible: false,
        chatCompact: false
      },
      three: {
        readiness: 'booting',
        diagnosticMode: true,
        sceneMode: 'overview'
      }
    },
    app: {
      initialized: false,
      modulesReady: false,
      lastError: null
    },
    ...initial
  };

  const listeners = new Set();

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('State listener failed:', err);
      }
    });
  };

  const mergeDeep = (target, patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
    const next = { ...target };
    Object.keys(patch).forEach((key) => {
      const value = patch[key];
      if (value && typeof value === 'object' && !Array.isArray(value) && target && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        next[key] = mergeDeep(target[key], value);
      } else {
        next[key] = value;
      }
    });
    return next;
  };

  return {
    getState() {
      return state;
    },
    setState(patch = {}) {
      Object.assign(state, mergeDeep(state, patch));
      notify();
      return state;
    },
    update(mutator) {
      const next = mutator(state) || state;
      Object.assign(state, next);
      notify();
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset(nextState = {}) {
      Object.keys(state).forEach((key) => delete state[key]);
      Object.assign(state, createAppState(nextState).getState());
      notify();
      return state;
    }
  };
}
