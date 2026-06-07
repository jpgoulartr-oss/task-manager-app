// Card individual do Kanban
// Recebe a tarefa e funções de callback para clique e check

const ctxLabel = { work:'Trabalho', study:'Estudos', personal:'Pessoal', home:'Casa' }
const ctxColor = { work:'#60a5fa', study:'#a78bfa', personal:'#34d399', home:'#fbbf24' }
const prioLabel = { high:'Alta', mid:'Média', low:'Baixa' }
const prioColor = { high:'#f87171', mid:'#fbbf24', low:'#34d399' }
const prioBg    = { high:'rgba(248,113,113,0.15)', mid:'rgba(251,191,36,0.15)', low:'rgba(52,211,153,0.15)' }
const prioLeft  = { high:'#f87171', mid:'#fbbf24', low:'#34d399' }

function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}`
}

function isOverdue(d) {
  if (!d) return false
  return d < new Date().toISOString().slice(0, 10)
}

export default function TaskCard({ task, onClick, onCheck }) {
  const overdue = isOverdue(task.date) && !task.done

  function handleCheck(e) {
    e.stopPropagation() // impede de abrir o modal ao clicar na bolinha
    onCheck(task)
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface2)',
        borderRadius: '10px',
        padding: '13px',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        // Barra colorida da esquerda indica prioridade
        borderLeft: `3px solid ${prioLeft[task.prio] || 'var(--border)'}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.borderLeftColor = prioLeft[task.prio]
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Linha superior: título + bolinha de concluir */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          flex: 1,
          fontSize: '0.88rem',
          fontWeight: 500,
          lineHeight: 1.4,
          textDecoration: task.done ? 'line-through' : 'none',
          color: task.done ? 'var(--muted)' : 'var(--text)',
        }}>
          {task.title}
        </div>

        {/* Bolinha de conclusão — única forma de marcar como concluído */}
        <div
          onClick={handleCheck}
          title={task.done ? 'Reabrir tarefa' : 'Marcar como concluída'}
          style={{
            width: '20px', height: '20px',
            borderRadius: '50%',
            border: task.done ? '2px solid var(--green)' : '2px solid var(--muted)',
            background: task.done ? 'var(--green)' : 'none',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', color: 'white', fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {task.done ? '✓' : ''}
        </div>
      </div>

      {/* Linha inferior: tags de contexto, prioridade e data */}
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

        {/* Ícone indicando que tem detalhes */}
        {task.notes && (
          <span title="Tem detalhes" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: task.date ? '4px' : 'auto' }}>
            📝
          </span>
        )}
      </div>
    </div>
  )
}
