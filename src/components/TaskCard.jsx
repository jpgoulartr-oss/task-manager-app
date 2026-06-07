// Card individual do Kanban — com suporte a drag desktop e touch mobile

const ctxLabel = { work:'Trabalho', study:'Estudos', personal:'Pessoal', home:'Casa' }
const ctxColor  = { work:'#60a5fa', study:'#a78bfa', personal:'#34d399', home:'#fbbf24' }
const prioLabel = { high:'Alta', mid:'Média', low:'Baixa' }
const prioColor = { high:'#f87171', mid:'#fbbf24', low:'#34d399' }
const prioBg    = { high:'rgba(248,113,113,0.15)', mid:'rgba(251,191,36,0.15)', low:'rgba(52,211,153,0.15)' }
const prioLeft  = { high:'#f87171', mid:'#fbbf24', low:'#34d399' }

function formatDate(d) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}
function isOverdue(d) {
  return d ? d < new Date().toISOString().slice(0, 10) : false
}

export default function TaskCard({ task, onClick, onCheck, onDragStart, onDragEnd, dragging }) {
  const overdue = isOverdue(task.date) && !task.done

  function handleCheck(e) {
    e.stopPropagation()
    onCheck(task)
  }

  return (
    <div
      className={`task-card${dragging ? ' dragging' : ''}`}
      style={{ borderLeft: `3px solid ${prioLeft[task.prio] || 'var(--border)'}` }}
      onClick={onClick}
      draggable
      onDragStart={e => onDragStart && onDragStart(e, task.id)}
      onDragEnd={e => onDragEnd && onDragEnd(e)}
      onTouchStart={e => onDragStart && onDragStart(e, task.id)}
      onTouchMove={e => onDragStart && e.preventDefault()}
      onTouchEnd={e => onDragEnd && onDragEnd(e)}
    >
      {/* Título + bolinha */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          flex: 1, fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.4,
          textDecoration: task.done ? 'line-through' : 'none',
          color: task.done ? 'var(--muted)' : 'var(--text)',
        }}>
          {task.title}
        </div>
        <div
          onClick={handleCheck}
          title={task.done ? 'Reabrir' : 'Concluir'}
          style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
            border: task.done ? '2px solid var(--green)' : '2px solid var(--muted)',
            background: task.done ? 'var(--green)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', color: 'white', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {task.done ? '✓' : ''}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 500,
          background: `${ctxColor[task.ctx]}22`, color: ctxColor[task.ctx],
        }}>
          {ctxLabel[task.ctx] || task.ctx}
        </span>
        <span style={{
          padding: '2px 7px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 600,
          background: prioBg[task.prio], color: prioColor[task.prio],
        }}>
          {prioLabel[task.prio]}
        </span>
        {task.date && (
          <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--red)' : 'var(--muted)', marginLeft: 'auto' }}>
            {overdue ? '⚠ ' : '📅 '}{formatDate(task.date)}
          </span>
        )}
        {task.notes && (
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: task.date ? '4px' : 'auto' }}>📝</span>
        )}
      </div>
    </div>
  )
}
