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
}: Props) {
  const [menu, setMenu] = useState<MenuState>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const openMenu = (e: React.MouseEvent, sprint: Sprint) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenu({ sprint, x: rect.left, y: rect.bottom + 4 })
  }

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 38,
          zIndex: 100,
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 12px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {sprints.map((sp) => {
            const selected = sp.id === currentId
            const isBacklog = sp.type === 'backlog'
            const isDone = sp.status === 'completed'
            return (
              <div
                key={sp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => onSelect(sp.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '16px',
                    border: selected
                      ? 'none'
                      : `1px solid ${isDone ? 'rgba(55,53,47,0.1)' : c.border}`,
                    backgroundColor: selected
                      ? isBacklog
                        ? 'rgba(55,53,47,0.12)'
                        : c.blue
                      : isDone
                        ? 'rgba(55,53,47,0.03)'
                        : 'transparent',
                    color: selected ? (isBacklog ? c.text : '#fff') : isDone ? c.textHint : c.textSub,
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
                  {isBacklog ? `☰ ${sp.name}` : sp.name}
                  {isDone && ' ✓'}
                </button>

                {/* "..." menu for non-backlog sprints */}
                {!isBacklog && (
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
                    aria-label="メニュー"
                  >
                    ···
                  </button>
                )}
              </div>
            )
          })}

          {/* New sprint button */}
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
              {
                label: '編集',
                action: () => { onEdit(menu.sprint); setMenu(null) },
                show: true,
              },
              {
                label: 'スプリント完了',
                action: () => { onComplete(menu.sprint); setMenu(null) },
                show: menu.sprint.status === 'active',
              },
              {
                label: '削除',
                action: () => { onDelete(menu.sprint); setMenu(null) },
                show: true,
                danger: true,
              },
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
