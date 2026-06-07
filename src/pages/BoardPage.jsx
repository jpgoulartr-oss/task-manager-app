import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

// Configuração das colunas do Kanban
const COLS = [
  { key: 'todo',    label: 'A fazer',      color: '#7878a0' },
  { key: 'doing',   label: 'Em andamento', color: '#fbbf24' },
  { key: 'standby', label: 'Stand By',     color: '#fb923c' },
  { key: 'done',    label: 'Concluído',    color: '#34d399' },
]

function todayStr() { return new Date().toISOString().slice(0, 10) }

function getDateRange(filter) {
  const now = new Date(); now.setHours(0,0,0,0)
  const t = todayStr()
  if (filter === 'today') return { from: t, to: t }
  if (filter === 'tomorrow') {
    const tom = new Date(now); tom.setDate(tom.getDate() + 1)
    const ts = tom.toISOString().slice(0,10)
    return { from: ts, to: ts }
  }
  if (filter === 'week') {
    const day = now.getDay()
    const diffToMon = day === 0 ? -6 : 1 - day
    const mon = new Date(now); mon.setDate(now.getDate() + diffToMon)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { from: mon.toISOString().slice(0,10), to: sun.toISOString().slice(0,10) }
  }
  if (filter === 'month') {
    const y = now.getFullYear(), m = now.getMonth()
    return { from: new Date(y,m,1).toISOString().slice(0,10), to: new Date(y,m+1,0).toISOString().slice(0,10) }
  }
  return null
}

export default function BoardPage({ user, onSignOut }) {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks(user.id)

  // Filtros
  const [search,     setSearch]     = useState('')
  const [prioFilter, setPrioFilter] = useState('all')
  const [ctxFilter,  setCtxFilter]  = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [view,       setView]       = useState('kanban') // 'kanban' ou 'list'

  // Modal
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingTask,    setEditingTask]     = useState(null)   // null = criar novo
  const [defaultStatus,  setDefaultStatus]  = useState('todo')

  // Filtragem reativa — useMemo recalcula só quando as dependências mudam
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const range = dateFilter !== 'all' && dateFilter !== 'overdue' ? getDateRange(dateFilter) : null

    return tasks.filter(t => {
      if (q) {
        const inTitle = t.title.toLowerCase().includes(q)
        const inNotes = t.notes?.toLowerCase().includes(q)
        if (!inTitle && !inNotes) return false
      }
      if (prioFilter !== 'all' && t.prio !== prioFilter) return false
      if (ctxFilter  !== 'all' && t.ctx  !== ctxFilter)  return false
      if (dateFilter === 'overdue') {
        if (!t.date || t.date >= todayStr() || t.done) return false
      } else if (range) {
        if (!t.date || t.date < range.from || t.date > range.to) return false
      }
      return true
    })
  }, [tasks, search, prioFilter, ctxFilter, dateFilter])

  // Progresso geral
  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total ? Math.round(done / total * 100) : 0

  // Abre modal para criar tarefa
  function openCreate(status = 'todo') {
    setEditingTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  // Abre modal para editar tarefa existente
  function openEdit(task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  // Marca/desmarca tarefa como concluída (só pela bolinha)
  async function handleCheck(task) {
    const newDone = !task.done
    await updateTask(task.id, { done: newDone, status: newDone ? 'done' : 'todo' })
  }

  // Salva (criar ou editar)
  async function handleSave(data) {
    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else {
      await createTask(data)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem' }}>
          task<span style={{ color: 'var(--accent2)' }}>flow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Alternar Kanban / Lista */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {['kanban', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                background: view === v ? 'var(--accent)' : 'none',
                color: view === v ? 'white' : 'var(--muted)',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
                cursor: 'pointer', fontWeight: 500,
              }}>
                {v === 'kanban' ? '⊞ Kanban' : '≡ Lista'}
              </button>
            ))}
          </div>

          <button onClick={() => openCreate()} style={{
            background: 'var(--accent)', color: 'white', border: 'none',
            borderRadius: '8px', padding: '8px 16px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
          }}>
            + Nova tarefa
          </button>

          {/* Info do usuário + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{user.email}</span>
            <button onClick={onSignOut} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '6px 12px', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.78rem', cursor: 'pointer',
            }}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── BARRA DE PROGRESSO ── */}
      <div style={{
        padding: '14px 28px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '20px',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--text)' }}>{done}</strong> de <strong style={{ color: 'var(--text)' }}>{total}</strong> concluídas
        </span>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: '99px', transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{pct}%</span>
      </div>

      {/* ── FILTROS ── */}
      <div style={{ padding: '12px 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Buscar tarefas..."
          style={{ ...filterInputStyle, flex: 1, minWidth: '200px', maxWidth: '300px' }}
        />
        <FilterGroup label="Prioridade" value={prioFilter} onChange={setPrioFilter}
          options={[{ v:'all', l:'Todas' },{ v:'high', l:'Alta' },{ v:'mid', l:'Média' },{ v:'low', l:'Baixa' }]}
        />
        <FilterGroup label="Contexto" value={ctxFilter} onChange={setCtxFilter}
          options={[{ v:'all', l:'Todos' },{ v:'work', l:'Trabalho' },{ v:'study', l:'Estudos' },{ v:'personal', l:'Pessoal' },{ v:'home', l:'Casa' }]}
        />
      </div>
      <div style={{ padding: '10px 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <FilterGroup label="📅 Prazo" value={dateFilter} onChange={setDateFilter}
          options={[
            { v:'all', l:'Todos' },{ v:'today', l:'Hoje' },{ v:'tomorrow', l:'Amanhã' },
            { v:'week', l:'Esta semana' },{ v:'month', l:'Este mês' },
            { v:'overdue', l:'Atrasadas', danger: true },
          ]}
        />
      </div>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main style={{ padding: '24px 28px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Carregando tarefas...</div>
        ) : view === 'kanban' ? (
          <KanbanView tasks={filtered} onCardClick={openEdit} onCheck={handleCheck} onAddClick={openCreate} />
        ) : (
          <ListView tasks={filtered} onCardClick={openEdit} onCheck={handleCheck} />
        )}
      </main>

      {/* ── MODAL ── */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onDelete={deleteTask}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── KANBAN ────────────────────────────────────────────────────────────────────
function KanbanView({ tasks, onCardClick, onCheck, onAddClick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minWidth: '800px' }}>
      {COLS.map(col => {
        const items = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} style={{
            background: 'var(--surface)', borderRadius: '12px',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '400px',
          }}>
            {/* Cabeçalho da coluna */}
            <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                {col.label}
              </div>
              <span style={{ background: 'var(--surface2)', color: 'var(--muted)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px' }}>
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {items.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  Nenhuma tarefa
                </div>
              )}
              {items.map(t => (
                <TaskCard key={t.id} task={t} onClick={() => onCardClick(t)} onCheck={onCheck} />
              ))}
            </div>

            {/* Botão adicionar */}
            <button onClick={() => onAddClick(col.key)} style={{
              margin: '0 12px 12px', padding: '8px 12px', borderRadius: '8px',
              border: '1px dashed var(--border)', background: 'none',
              color: 'var(--muted)', fontSize: '0.8rem',
              fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', textAlign: 'left',
            }}>
              + Adicionar
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── LISTA ─────────────────────────────────────────────────────────────────────
function ListView({ tasks, onCardClick, onCheck }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {COLS.map(col => {
        const items = tasks.filter(t => t.status === col.key)
        if (!items.length) return null
        return (
          <div key={col.key} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {col.label} ({items.length})
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            {items.map(t => (
              <div key={t.id} onClick={() => onCardClick(t)} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', marginBottom: '6px', opacity: t.done ? 0.5 : 1,
                transition: 'border-color 0.2s',
              }}>
                <div
                  onClick={e => { e.stopPropagation(); onCheck(t) }}
                  style={{
                    width: '20px', height: '20px', borderRadius: '6px',
                    border: t.done ? '2px solid var(--green)' : '2px solid var(--border)',
                    background: t.done ? 'var(--green)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: 'white', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {t.done ? '✓' : ''}
                </div>
                <div style={{ flex: 1, fontSize: '0.88rem', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--muted)' : 'var(--text)' }}>
                  {t.title}
                </div>
                {t.notes && <span title="Tem detalhes" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>📝</span>}
              </div>
            ))}
          </div>
        )
      })}
      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Nenhuma tarefa encontrada</div>
      )}
    </div>
  )
}

// ── COMPONENTE DE FILTRO ──────────────────────────────────────────────────────
function FilterGroup({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>{label}:</span>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          padding: '5px 11px', borderRadius: '8px', fontSize: '0.78rem',
          fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', fontWeight: 500,
          border: value === o.v
            ? (o.danger ? '1px solid rgba(248,113,113,0.6)' : '1px solid var(--accent)')
            : (o.danger ? '1px solid rgba(248,113,113,0.3)' : '1px solid var(--border)'),
          background: value === o.v
            ? (o.danger ? 'rgba(248,113,113,0.15)' : 'rgba(124,106,247,0.15)')
            : 'var(--surface2)',
          color: value === o.v
            ? (o.danger ? 'var(--red)' : 'var(--accent2)')
            : (o.danger ? 'var(--red)' : 'var(--muted)'),
        }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

const filterInputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '7px 12px',
  color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', outline: 'none',
}
