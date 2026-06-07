import { useState, useEffect } from 'react'

// Modal de criar e editar tarefas
// Recebe: task (null = criar novo, objeto = editar), onSave, onDelete, onClose
export default function TaskModal({ task, defaultStatus, onSave, onDelete, onClose }) {
  // Estado local do formulário
  const [title,  setTitle]  = useState('')
  const [status, setStatus] = useState('todo')
  const [prio,   setPrio]   = useState('mid')
  const [ctx,    setCtx]    = useState('work')
  const [date,   setDate]   = useState('')
  const [notes,  setNotes]  = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Quando o modal abre, preenche os campos se for edição
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setStatus(task.status || 'todo')
      setPrio(task.prio || 'mid')
      setCtx(task.ctx || 'work')
      setDate(task.date || '')
      setNotes(task.notes || '')
    } else {
      setStatus(defaultStatus || 'todo')
    }
  }, [task, defaultStatus])

  async function handleSave() {
    if (!title.trim()) { setError('Digite um título para a tarefa.'); return }
    setSaving(true)
    await onSave({
      title: title.trim(),
      status,
      prio,
      ctx,
      date: date || null,
      notes: notes.trim(),
      done: status === 'done',
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Excluir esta tarefa?')) return
    await onDelete(task.id)
    onClose()
  }

  // Fecha ao clicar fora do modal
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div onClick={handleOverlayClick} style={overlayStyle}>
      <div style={modalStyle}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {task && (
              <button onClick={handleDelete} style={btnDeleteStyle}>Excluir</button>
            )}
            <button onClick={onClose} style={{ ...btnDeleteStyle, borderColor: 'var(--border)', color: 'var(--muted)' }}>✕</button>
          </div>
        </div>

        {/* Título */}
        <div style={fgStyle}>
          <label style={labelStyle}>Título *</label>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setError('') }}
            placeholder="O que precisa ser feito?"
            style={{ ...inputStyle, borderColor: error ? 'var(--red)' : 'var(--border)' }}
            autoFocus
          />
          {error && <span style={{ color: 'var(--red)', fontSize: '0.75rem' }}>{error}</span>}
        </div>

        {/* Grid 2 colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={fgStyle}>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              <option value="todo">A fazer</option>
              <option value="doing">Em andamento</option>
              <option value="standby">Stand By</option>
              <option value="done">Concluído</option>
            </select>
          </div>
          <div style={fgStyle}>
            <label style={labelStyle}>Prioridade</label>
            <select value={prio} onChange={e => setPrio(e.target.value)} style={inputStyle}>
              <option value="high">Alta</option>
              <option value="mid">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div style={fgStyle}>
            <label style={labelStyle}>Contexto</label>
            <select value={ctx} onChange={e => setCtx(e.target.value)} style={inputStyle}>
              <option value="work">Trabalho</option>
              <option value="study">Estudos</option>
              <option value="personal">Pessoal</option>
              <option value="home">Casa</option>
            </select>
          </div>
          <div style={fgStyle}>
            <label style={labelStyle}>Prazo</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Detalhes */}
        <div style={{ ...fgStyle, marginTop: '12px' }}>
          <label style={labelStyle}>Detalhes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Adicione detalhes, observações ou contexto..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={btnCancelStyle}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnSaveStyle}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(4px)',
  zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px',
}
const modalStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '28px',
  width: '100%',
  maxWidth: '480px',
  maxHeight: '90vh',
  overflowY: 'auto',
}
const fgStyle = { marginBottom: '14px' }
const labelStyle = { display: 'block', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500, marginBottom: '6px' }
const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '8px',
  padding: '9px 12px', color: 'var(--text)',
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', outline: 'none',
}
const btnDeleteStyle = {
  background: 'none', border: '1px solid rgba(248,113,113,0.3)',
  color: 'var(--red)', borderRadius: '8px', padding: '6px 12px',
  fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
}
const btnCancelStyle = {
  padding: '9px 18px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'none',
  color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', fontSize: '0.85rem',
}
const btnSaveStyle = {
  padding: '9px 18px', borderRadius: '8px',
  background: 'var(--accent)', color: 'white', border: 'none',
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
}
