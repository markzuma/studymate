import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'periak_appearance_v1'

export const DEFAULT_APPEARANCE = {
  mode: 'system',
  accent: 'ocean',
  density: 'comfortable',
  corners: 'rounded',
  fontSize: 'normal',
  reducedMotion: false,
}

export const ACCENTS = {
  ocean: { name: 'Ocean Blue', color: '#2878d0', soft: '#eaf3ff' },
  emerald: { name: 'Emerald', color: '#078575', soft: '#e7f6f0' },
  purple: { name: 'Purple', color: '#8b5cf6', soft: '#f1eaff' },
  rose: { name: 'Rose', color: '#e05278', soft: '#fff0f3' },
  sunset: { name: 'Sunset', color: '#ea762e', soft: '#fff2e8' },
  teal: { name: 'Teal', color: '#0d9488', soft: '#e6f7f5' },
  gold: { name: 'Royal Gold', color: '#b68a24', soft: '#fbf5e5' },
  crimson: { name: 'Crimson', color: '#c73545', soft: '#fff0f1' },
  slate: { name: 'Slate', color: '#64748b', soft: '#eef2f6' },
}

function readStoredAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { ...DEFAULT_APPEARANCE, ...(saved || {}) }
  } catch {
    return DEFAULT_APPEARANCE
  }
}

export function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(readStoredAppearance)
  const [userId, setUserId] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    let active = true

    const loadUser = async (session) => {
      const id = session?.user?.id || null
      setUserId(id)

      if (id) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('appearance')
          .eq('user_id', id)
          .maybeSingle()

        if (!active) return

        if (!error && data?.appearance) {
          const merged = { ...DEFAULT_APPEARANCE, ...data.appearance }
          setAppearance(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        }
      }

      if (active) setLoaded(true)
    }

    supabase.auth.getSession().then(({ data }) => loadUser(data?.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoaded(false)
        loadUser(session)
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const dark = appearance.mode === 'dark' ||
      (appearance.mode === 'system' && systemDark)

    const accent = ACCENTS[appearance.accent] || ACCENTS.ocean
    const root = document.documentElement

    root.dataset.theme = dark ? 'dark' : 'light'
    root.dataset.density = appearance.density
    root.dataset.fontSize = appearance.fontSize
    root.dataset.corners = appearance.corners
    root.dataset.reducedMotion = String(appearance.reducedMotion)

    root.style.setProperty('--accent', accent.color)
    // PERIAK OBSIDIAN DARK V1
    root.style.setProperty(
      '--accent-soft',
      dark
        ? `rgba(${accent.color.match(/\w\w/g).map(
            v => parseInt(v, 16)
          ).join(', ')}, .16)`
        : accent.soft
    )
    root.style.setProperty('--accent-rgb',
      accent.color.match(/\w\w/g).map(v => parseInt(v, 16)).join(', '))

    root.style.colorScheme = dark ? 'dark' : 'light'
  }, [appearance, systemDark])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))

    if (!loaded || !userId) return

    const save = async () => {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: userId,
        appearance,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (error) console.error('Appearance preference sync failed:', error.message)
    }

    save()
  }, [appearance, loaded, userId])

  const updateAppearance = (key, value) => {
    setAppearance(current => ({ ...current, [key]: value }))
  }

  const resetAppearance = () => setAppearance({ ...DEFAULT_APPEARANCE })

  const value = useMemo(() => ({
    appearance,
    updateAppearance,
    resetAppearance,
    isDark: appearance.mode === 'dark' ||
      (appearance.mode === 'system' && systemDark),
  }), [appearance, systemDark])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppearance() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useAppearance must be used inside ThemeProvider')
  return context
}
