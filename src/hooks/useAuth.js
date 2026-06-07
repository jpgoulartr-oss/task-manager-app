import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Hook que cuida de toda a lógica de autenticação
// Qualquer componente que precisar saber se o usuário está logado usa este hook
export function useAuth() {
  const [user, setUser]       = useState(null)   // dados do usuário logado
  const [loading, setLoading] = useState(true)   // ainda verificando sessão?

  useEffect(() => {
    // Verifica se já existe uma sessão ativa (usuário que não fez logout)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Fica "ouvindo" mudanças: login, logout, token expirado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Cancela o listener quando o componente for desmontado
    return () => subscription.unsubscribe()
  }, [])

  // Funções que os componentes vão chamar
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () =>
    supabase.auth.signOut()

  return { user, loading, signIn, signUp, signOut }
}
