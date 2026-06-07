import { useState, useMemo, useRef, useCallback } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

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
    const tom = new Date(now); tom.setDate(tom.getDate()+1)
    return { from: tom.toISOString().slice(0,10), to: tom.toISOString().slice(0,10) }
  }
  if (filter === 'week') {
    const day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() + (day===0?-6:1-day))
    const sun = new Date(mon); sun.setDate(mon.getDate()+6)
    return { from: mon.toISOString().slice(0,10), to: sun.toISOString().slice(0,10) }
  }
  if (filter === 'month') {
    const y=now.getFullYear(), m=now.getMonth()
    return { from: new Date(y,m,1).toISOString().slice(0,10), to: new Date(y,m+1,0).toISOString().slice(0,10) }
  }
  return null
}

export default function BoardPage({ user, onSignOut }) {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks(user.id)

  const [search,     setSearch]     = useState('')
  const [prioFilter, setPrioFilter] = useState('all')
  const [ctxFilter,  setCtxFilter]  = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [view,       setView]       = useState('kanban')
  const [mobCol,     setMobCol]     = useState('todo')   // coluna ativa no mobile
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editingTask,setEditingTask]= useState(null)
  const [defaultStatus,setDefaultStatus] = useState('todo')

  // ── DRAG STATE ──────────────────────────────────────────────────────────────
  const [draggingId,  setDraggingId]  = useState(null)
  const [overCol,     setOverCol]     = useState(null)
  const ghostRef      = useRef(null)
  const touchDragRef  = useRef({ active: false, taskId: null, timer: null })

  // ── FILTROS ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const range = dateFilter !== 'all' && dateFilter !== 'overdue' ? getDateRange(dateFilter) : null
    return tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.notes?.toLowerCase().includes(q)) return false
      if (prioFilter !== 'all' && t.prio !== prioFilter) return false
      if (ctxFilter  !== 'all' && t.ctx  !== ctxFilter)  return false
      if (dateFilter === 'overdue') { if (!t.date || t.date >= todayStr() || t.done) return false }
      else if (range) { if (!t.date || t.date < range.from || t.date > range.to) return false }
      return true
    })
  }, [tasks, search, prioFilter, ctxFilter, dateFilter])

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total ? Math.round(done/total*100) : 0

  function openCreate(status='todo') { setEditingTask(null); setDefaultStatus(status); setModalOpen(true) }
  function openEdit(task)           { setEditingTask(task); setModalOpen(true) }
  async function handleCheck(task)  { await updateTask(task.id, { done: !task.done, status: !task.done ? 'done' : 'todo' }) }
  async function handleSave(data)   { editingTask ? await updateTask(editingTask.id, data) : await createTask(data) }

  // ── DESKTOP DRAG ─────────────────────────────────────────────────────────────
  function onDragStart(e, taskId) {
    if (e.type === 'touchstart') return  // touch handled separately
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(taskId)
  }
  function onDragEnd() { setDraggingId(null); setOverCol(null) }
  function onDragOver(e, colKey) { e.preventDefault(); setOverCol(colKey) }
  function onDrop(e, colKey) {
    e.preventDefault()
    if (draggingId == null) return
    const t = tasks.find(x => x.id === draggingId)
    if (t && t.status !== colKey) {
      updateTask(draggingId, { status: colKey, done: colKey === 'done' })
    }
    setDraggingId(null); setOverCol(null)
  }

  // ── TOUCH DRAG ───────────────────────────────────────────────────────────────
  const createGhost = useCallback((taskId, touch) => {
    const el = document.getElementById(`card-${taskId}`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ghost = el.cloneNode(true)
    ghost.classList.add('drag-ghost')
    ghost.style.left  = `${rect.left}px`
    ghost.style.top   = `${rect.top}px`
    ghost.style.width = `${rect.width}px`
    document.body.appendChild(ghost)
    ghostRef.current = ghost
  }, [])

  const moveGhost = useCallback((touch) => {
    if (!ghostRef.current) return
    ghostRef.current.style.left = `${touch.clientX - 120}px`
    ghostRef.current.style.top  = `${touch.clientY - 40}px`
  }, [])

  const removeGhost = useCallback(() => {
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null }
  }, [])

  const getColFromPoint = useCallback((x, y) => {
    // Temporarily hide ghost to get element underneath
    if (ghostRef.current) ghostRef.current.style.display = 'none'
    const el = document.elementFromPoint(x, y)
    if (ghostRef.current) ghostRef.current.style.display = ''
    if (!el) return null
    const colEl = el.closest('[data-col]')
    return colEl ? colEl.dataset.col : null
  }, [])

  function onTouchStart(e, taskId) {
    const touch = e.touches[0]
    touchDragRef.current.taskId = taskId
    touchDragRef.current.startX = touch.clientX
    touchDragRef.current.startY = touch.clientY
    touchDragRef.current.active = false

    // Long press 350ms to initiate drag
    touchDragRef.current.timer = setTimeout(() => {
      touchDragRef.current.active = true
      setDraggingId(taskId)
      createGhost(taskId, touch)
      // Vibração sutil para feedback no celular
      if (navigator.vibrate) navigator.vibrate(40)
    }, 350)
  }

  function onTouchMove(e) {
    const touch = e.touches[0]
    const dr = touchDragRef.current

    // Se moveu muito antes do long press, cancela
    if (!dr.active) {
      const dx = Math.abs(touch.clientX - dr.startX)
      const dy = Math.abs(touch.clientY - dr.startY)
      if (dx > 8 || dy > 8) { clearTimeout(dr.timer) }
      return
    }

    e.preventDefault() // impede scroll enquanto arrasta
    moveGhost(touch)
    const col = getColFromPoint(touch.clientX, touch.clientY)
    setOverCol(col)
  }

  function onTouchEnd(e) {
    const dr = touchDragRef.current
    clearTimeout(dr.timer)

    if (dr.active && dr.taskId != null) {
      const touch = e.changedTouches[0]
      const col = getColFromPoint(touch.clientX, touch.clientY)
      if (col) {
        const t = tasks.find(x => x.id === dr.taskId)
        if (t && t.status !== col) {
          updateTask(dr.taskId, { status: col, done: col === 'done' })
        }
      }
    }

    removeGhost()
    setDraggingId(null)
    setOverCol(null)
    dr.active = false
    dr.taskId = null
  }

  const dragHandlers = { onDragStart, onDragEnd, onTouchStart, onTouchMove, onTouchEnd }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">task<span>flow</span></div>
          <div className="view-toggle">
            {['kanban','list'].map(v => (
              <button key={v} className={`view-btn${view===v?' active':''}`} onClick={() => setView(v)}>
                {v === 'kanban' ? '⊞ Kanban' : '≡ Lista'}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button className="btn-add" onClick={() => openCreate()}>+ Nova</button>
          <button className="btn-sair" onClick={onSignOut} style={{
            background:'none', border:'1px solid var(--border)', borderRadius:'8px',
            padding:'6px 10px', color:'var(--muted)', fontFamily:'DM Sans,sans-serif',
            fontSize:'0.75rem', cursor:'pointer',
          }}>Sair</button>
        </div>
      </header>

      {/* ── PROGRESS ── */}
      <div className="progress-strip">
        <span style={{ fontSize:'0.78rem', color:'var(--muted)', whiteSpace:'nowrap' }}>
          <strong style={{color:'var(--text)'}}>{done}</strong>/{total}
        </span>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width:`${pct}%` }} />
        </div>
        <span style={{ fontSize:'0.75rem', color:'var(--muted)', whiteSpace:'nowrap' }}>{pct}%</span>
      </div>

      {/* ── FILTROS ── */}
      <div className="filters-wrap">
        <div className="filter-row">
          <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..." />
        </div>
        <div className="filter-row">
          <span className="filter-label">Prioridade:</span>
          {[{v:'all',l:'Todas'},{v:'high',l:'Alta'},{v:'mid',l:'Média'},{v:'low',l:'Baixa'}].map(o => (
            <button key={o.v} className={`filter-btn${prioFilter===o.v?' active':''}`} onClick={()=>setPrioFilter(o.v)}>{o.l}</button>
          ))}
          <span className="filter-label" style={{marginLeft:4}}>Contexto:</span>
          {[{v:'all',l:'Todos'},{v:'work',l:'Trabalho'},{v:'study',l:'Estudos'},{v:'personal',l:'Pessoal'},{v:'home',l:'Casa'}].map(o => (
            <button key={o.v} className={`filter-btn${ctxFilter===o.v?' active':''}`} onClick={()=>setCtxFilter(o.v)}>{o.l}</button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">📅 Prazo:</span>
          {[{v:'all',l:'Todos'},{v:'today',l:'Hoje'},{v:'tomorrow',l:'Amanhã'},{v:'week',l:'Semana'},{v:'month',l:'Mês'},{v:'overdue',l:'Atrasadas',danger:true}].map(o => (
            <button key={o.v} className={`filter-btn${o.danger?' danger':''}${dateFilter===o.v?' active':''}`} onClick={()=>setDateFilter(o.v)}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* ── MOBILE TABS (kanban) ── */}
      {view === 'kanban' && (
        <div className="mob-col-tabs">
          {COLS.map(col => {
            const cnt = filtered.filter(t => t.status === col.key).length
            return (
              <button key={col.key} className={`mob-tab${mobCol===col.key?' active':''}`} onClick={()=>setMobCol(col.key)}>
                <span style={{width:7,height:7,borderRadius:'50%',background:col.color,display:'inline-block'}}/>
                {col.label}
                <span className="mob-tab-count">{cnt}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── CONTEÚDO ── */}
      {loading ? (
        <div style={{textAlign:'center',padding:'60px',color:'var(--muted)'}}>Carregando...</div>
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={filtered} cols={COLS}
          draggingId={draggingId} overCol={overCol} mobCol={mobCol}
          onCardClick={openEdit} onCheck={handleCheck} onAddClick={openCreate}
          onDragOver={onDragOver} onDrop={onDrop}
          dragHandlers={dragHandlers}
        />
      ) : (
        <ListView tasks={filtered} cols={COLS} onCardClick={openEdit} onCheck={handleCheck} />
      )}

      {/* ── MODAL ── */}
      {modalOpen && (
        <TaskModal
          task={editingTask} defaultStatus={defaultStatus}
          onSave={handleSave} onDelete={deleteTask}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── KANBAN ───────────────────────────────────────────────────────────────────
function KanbanView({ tasks, cols, draggingId, overCol, mobCol, onCardClick, onCheck, onAddClick, onDragOver, onDrop, dragHandlers }) {
  return (
    <>
      {/* Desktop: 4 colunas */}
      <div className="kanban-wrap">
        <div className="kanban-grid">
          {cols.map(col => (
            <div
              key={col.key}
              className={`kanban-col kanban-col-desktop${overCol===col.key?' drag-over':''}`}
              data-col={col.key}
              onDragOver={e => onDragOver(e, col.key)}
              onDragLeave={() => {}}
              onDrop={e => onDrop(e, col.key)}
            >
              <ColHeader col={col} count={tasks.filter(t=>t.status===col.key).length} />
              <div className="col-body">
                {tasks.filter(t=>t.status===col.key).length === 0 && (
                  <div className="col-empty">Nenhuma tarefa</div>
                )}
                {tasks.filter(t=>t.status===col.key).map(t => (
                  <div key={t.id} id={`card-${t.id}`}>
                    <TaskCard
                      task={t}
                      dragging={draggingId === t.id}
                      onClick={() => onCardClick(t)}
                      onCheck={onCheck}
                      onDragStart={(e, id) => dragHandlers.onDragStart(e, id)}
                      onDragEnd={dragHandlers.onDragEnd}
                    />
                  </div>
                ))}
              </div>
              <button className="col-add-btn" onClick={() => onAddClick(col.key)}>+ Adicionar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: 1 coluna por vez */}
      <div className="kanban-wrap mob-kanban-col">
        {cols.filter(col => col.key === mobCol).map(col => (
          <div
            key={col.key}
            className={`kanban-col${overCol===col.key?' drag-over':''}`}
            data-col={col.key}
            onDragOver={e => onDragOver(e, col.key)}
            onDrop={e => onDrop(e, col.key)}
          >
            <ColHeader col={col} count={tasks.filter(t=>t.status===col.key).length} />
            <div className="col-body">
              {tasks.filter(t=>t.status===col.key).length === 0 && (
                <div className="col-empty">Nenhuma tarefa</div>
              )}
              {tasks.filter(t=>t.status===col.key).map(t => (
                <div key={t.id} id={`card-${t.id}`}>
                  <TaskCard
                    task={t}
                    dragging={draggingId === t.id}
                    onClick={() => onCardClick(t)}
                    onCheck={onCheck}
                    onDragStart={(e, id) => { dragHandlers.onTouchStart(e, id) }}
                    onDragEnd={dragHandlers.onTouchEnd}
                  />
                </div>
              ))}
            </div>
            <button className="col-add-btn" onClick={() => onAddClick(col.key)}>+ Adicionar</button>
          </div>
        ))}
      </div>
    </>
  )
}

function ColHeader({ col, count }) {
  return (
    <div className="col-header">
      <div className="col-title">
        <div className="col-dot" style={{ background: col.color }} />
        {col.label}
      </div>
      <span className="col-count">{count}</span>
    </div>
  )
}

// ── LISTA ────────────────────────────────────────────────────────────────────
function ListView({ tasks, cols, onCardClick, onCheck }) {
  return (
    <div className="list-wrap">
      {cols.map(col => {
        const items = tasks.filter(t => t.status === col.key)
        if (!items.length) return null
        return (
          <div key={col.key} className="list-section">
            <div className="list-section-title">
              {col.label} ({items.length})
              <div className="list-section-line" />
            </div>
            {items.map(t => (
              <div key={t.id} className="list-item" onClick={() => onCardClick(t)}>
                <div
                  onClick={e => { e.stopPropagation(); onCheck(t) }}
                  style={{
                    width:20, height:20, borderRadius:6, flexShrink:0,
                    border: t.done ? '2px solid var(--green)' : '2px solid var(--border)',
                    background: t.done ? 'var(--green)' : 'none',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.75rem', color:'white', cursor:'pointer',
                  }}
                >
                  {t.done ? '✓' : ''}
                </div>
                <div style={{ flex:1, fontSize:'0.88rem', textDecoration: t.done?'line-through':'none', color: t.done?'var(--muted)':'var(--text)', opacity: t.done?0.5:1 }}>
                  {t.title}
                </div>
                {t.notes && <span style={{fontSize:'0.75rem',color:'var(--muted)'}}>📝</span>}
              </div>
            ))}
          </div>
        )
      })}
      {tasks.length === 0 && (
        <div style={{textAlign:'center',padding:'60px',color:'var(--muted)'}}>Nenhuma tarefa encontrada</div>
      )}
    </div>
  )
}
