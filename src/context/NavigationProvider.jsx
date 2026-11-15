import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const handlers = useRef(new Map())
  const historyEntryAdded = useRef(false)
  const [canGoBack, setCanGoBack] = useState(false)

  const refreshAvailability = useCallback(() => {
    setCanGoBack(
      [...handlers.current.values()].some(item => item.enabled)
    )
  }, [])

  const register = useCallback((id, handler, enabled, priority) => {
    handlers.current.set(id, {
      handler,
      enabled,
      priority
    })
    refreshAvailability()
  }, [refreshAvailability])

  const unregister = useCallback((id) => {
    handlers.current.delete(id)
    refreshAvailability()
  }, [refreshAvailability])

  const goBack = useCallback(() => {
    const activeHandlers = [...handlers.current.values()]
      .filter(item => item.enabled)
      .sort((a, b) => b.priority - a.priority)

    for (const item of activeHandlers) {
      const handled = item.handler()
      if (handled !== false) return true
    }

    return false
  }, [])

  useEffect(() => {
    if (!historyEntryAdded.current) {
      window.history.pushState({ periakNavigation: true }, '')
      historyEntryAdded.current = true
    }

    function handleBrowserBack() {
      if (goBack()) {
        window.history.pushState({ periakNavigation: true }, '')
      }
    }

    window.addEventListener('popstate', handleBrowserBack)
    return () => window.removeEventListener('popstate', handleBrowserBack)
  }, [goBack])

  const value = { canGoBack, goBack, register, unregister }

  return (
    <NavigationContext.Provider value={value}>
      {canGoBack && (
        <button
          type="button"
          className="periak-global-back"
          aria-label="Go back"
          title="Go back"
          onClick={goBack}
          style={{
            position: 'fixed',
            top: 'max(76px, calc(env(safe-area-inset-top) + 72px))',
            left: '16px',
            zIndex: 9999,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid var(--border-color, #dbe3e8)',
            background: 'var(--card-bg, #ffffff)',
            color: 'var(--text-color, #173b32)',
            boxShadow: '0 3px 12px rgba(0,0,0,0.14)',
            fontSize: '25px',
            lineHeight: 1,
            cursor: 'pointer'
          }}
        >
          ←
        </button>
      )}
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)

  if (!context) {
    throw new Error('useNavigation must be used inside NavigationProvider')
  }

  return context
}

export function useBackHandler(handler, enabled = true, priority = 0) {
  const { register, unregister } = useNavigation()
  const id = useId()
  const handlerRef = useRef(handler)

  handlerRef.current = handler

  useEffect(() => {
    register(id, () => handlerRef.current(), enabled, priority)
    return () => unregister(id)
  }, [id, enabled, priority, register, unregister])
}
