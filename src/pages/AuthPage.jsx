import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

// Página de login e cadastro
// Alterna entre os dois modos com o botão no rodapé
export default function AuthPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode]       = useState('login')   // 'login' ou 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()  // impede a página de recarregar (comportamento padrão do form)
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('E-mail ou senha incorretos.')
      // Se deu certo, o useAuth vai detectar a sessão e o App.jsx redireciona automaticamente
    } else {
      const { error } = await signUp(email, password)
      if (error) setError('Erro ao criar conta. Tente outro e-mail.')
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px' }}>
          task<span style={{ color: 'var(--accent2)' }}>flow</span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '32px' }}>
          {mode === 'login' ? 'Bem-vindo de volta.' : 'Crie sua conta gratuita.'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Campo e-mail */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={inputStyle}
            />
          </div>

          {/* Campo senha */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px 14px', color: 'var(--red)', fontSize: '0.82rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Mensagem de sucesso (cadastro) */}
          {success && (
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '10px 14px', color: 'var(--green)', fontSize: '0.82rem', marginBottom: '16px' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {/* Alternar modo */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.83rem', color: 'var(--muted)' }}>
          {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}

// Estilos reutilizados (objetos JavaScript viram CSS inline no React)
const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  color: 'var(--muted)',
  fontWeight: 500,
  marginBottom: '6px',
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '10px 12px',
  color: 'var(--text)',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.88rem',
  outline: 'none',
}

const btnStyle = {
  width: '100%',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '11px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.9rem',
  fontWeight: 500,
  cursor: 'pointer',
}
