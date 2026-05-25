import {useRef, useState} from 'react'
import type {Sprint} from '../../types/sprint'
import {c, font} from '../../styles/notion'

type Props = {
  sprints: Sprint[]
  currentId: number | null
  onSelect: (id: number) => void
  onNew: () => void
  onEdit: (sprint: Sprint) => void
  onDelete: (sprint: Sprint) => void
  onComplete: (sprint: Sprint) => void
  onCopyStatus: (sprint: Sprint) => void
}

type MenuState = { sprint: Sprint; x: number; y: number } | null

export function SprintBar({
  sprints,
  currentId,
  onSelect,
  onNew,
  onEdit,
  onDelete,
  onComplete,
  onCopyStatus,
}: Props) {
  const [menu, setMenu] = useState<MenuState>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const openMenu = (e: React.MouseEvent, sprint: Sprint) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenu({ sprint, x: rect.left, y: rect.bottom + 4 })
  }

  const backlog = sprints.find((sp) => sp.type === 'backlog')
  const nonBacklog = sprints.filter((sp) => sp.type !== 'backlog')
  const backlogSelected = backlog?.id === currentId

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 38,
          zIndex: 100,
          backgroundColor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Left: scrollable sprint list */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 12px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            minWidth: 0,
          }}
        >
          {nonBacklog.map((sp) => {
            const selected = sp.id === currentId
            const isDone = sp.status === 'completed'
            return (
              <div
                key={sp.id}
                style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
              >
                <button
                  onClick={() => onSelect(sp.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '16px',
                    border: selected ? 'none' : `1px solid ${isDone ? 'rgba(55,53,47,0.1)' : c.border}`,
                    backgroundColor: selected ? c.blue : isDone ? 'rgba(55,53,47,0.03)' : 'transparent',
                    color: selected ? '#fff' : isDone ? c.textHint : c.textSub,
                    fontSize: font.sm,
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  {sp.name}
                  {isDone && ' ✓'}
                </button>
                <button
                  onClick={(e) => openMenu(e, sp)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: c.textHint,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ···
                </button>
              </div>
            )
          })}

          <button
            onClick={onNew}
            style={{
              padding: '5px 10px',
              borderRadius: '16px',
              border: `1px dashed rgba(55,53,47,0.2)`,
              backgroundColor: 'transparent',
              color: c.textHint,
              fontSize: font.sm,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            + 新規
          </button>
        </div>

        {/* Divider */}
        {backlog && (
          <div style={{ width: 1, height: 24, backgroundColor: c.border, flexShrink: 0 }} />
        )}

        {/* Right: Backlog (fixed) */}
        {backlog && (
          <div style={{ flexShrink: 0, padding: '8px 12px 8px 10px' }}>
            <button
              onClick={() => onSelect(backlog.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: '16px',
                border: backlogSelected ? 'none' : `1px solid ${c.border}`,
                backgroundColor: backlogSelected ? 'rgba(55,53,47,0.12)' : 'transparent',
                color: backlogSelected ? c.text : c.textSub,
                fontSize: font.sm,
                fontWeight: backlogSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Backlog
            </button>
          </div>
        )}
      </div>

      {/* Dropdown menu */}
      {menu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 500 }}
          onClick={() => setMenu(null)}
        >
          <div
            style={{
              position: 'fixed',
              top: menu.y,
              left: Math.min(menu.x, window.innerWidth - 160),
              width: 152,
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              border: `1px solid ${c.border}`,
              overflow: 'hidden',
              zIndex: 501,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: '編集', action: () => { onEdit(menu.sprint); setMenu(null) }, show: true },
              { label: 'スプリント完了', action: () => { onComplete(menu.sprint); setMenu(null) }, show: menu.sprint.status === 'active' },
              { label: 'ステータスをコピー', action: () => { onCopyStatus(menu.sprint); setMenu(null) }, show: true },
              { label: '削除', action: () => { onDelete(menu.sprint); setMenu(null) }, show: true, danger: true },
            ]
              .filter((item) => item.show)
              .map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: font.base,
                    color: item.danger ? c.red : c.text,
                    fontWeight: 500,
                    display: 'block',
                  }}
                >
                  {item.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </>
  )
}
