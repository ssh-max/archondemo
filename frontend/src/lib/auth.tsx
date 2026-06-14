import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type {
  AuthResponse,
  OAuthResponse,
  Session,
  User,
} from '@supabase/supabase-js'
import { supabase } from './supabase'

// Shape of the auth context. This is plumbing only — nothing in the app
// consumes it yet (login UI / routing / guards come in later sub-steps).
interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  workspaceId: string | null
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<OAuthResponse>
  signOut: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    // Restore any existing session on mount.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Keep state in sync with auth changes (sign in/out, token refresh, etc).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Resolve the user's personal workspace id once a user is established. RLS on
  // workspace_members allows a user to read their own membership rows. When
  // multiple memberships exist, pick deterministically: the earliest 'owner'
  // membership (the personal workspace from the sign-up trigger), else the
  // earliest membership. Null until loaded / when logged out.
  useEffect(() => {
    let active = true
    const uid = user?.id

    if (!uid) {
      setWorkspaceId(null)
      return
    }

    supabase
      .from('workspace_members')
      .select('workspace_id, role, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!active) return
        const rows = data ?? []
        const chosen = rows.find(r => r.role === 'owner') ?? rows[0]
        setWorkspaceId(chosen?.workspace_id ?? null)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  const value: AuthContextValue = {
    session,
    user,
    loading,
    workspaceId,
    signInWithPassword: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({ provider: 'google' }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
