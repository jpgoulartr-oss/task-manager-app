import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import BoardPage from './pages/BoardPage'

// Componente raiz da aplicação
// Decide o que mostrar: tela de loading, login ou o board
export default function App() {
  const { user, loading, signOut } = useAuth()

  // Enquanto verifica se há sessão ativa, mostra loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700,
      }}>
        task<span style={{ color: 'var(--accent2)' }}>flow</span>
      </div>
    )
  }

  // Não está logado → mostra login/cadastro
  if (!user) return <AuthPage />

  // Está logado → mostra o board
  return <BoardPage user={user} onSignOut={signOut} />
}
