import {useEffect, useRef, useState} from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom'
import {ChevronLeft, ScrollText} from 'lucide-react'
import type {Problem} from '../types/workspace'
import {fetchProblem} from '../lib/api/problem'
import {fetchRelated} from '../lib/problems/related'
import {useSettingsStore} from '../lib/store/settings'
import {subjectPalette} from '../styles/subjectUI'
import {ProblemQuickModal} from '../components/note/ProblemQuickModal'

// ── 定数 ─────────────────────────────────────────────────────────────────────

const CENTER_R = 24
const L1_R = 15
const L2_R = 9

const L2_MAX_PER_PARENT = 3

const SLIDE_MS = 380
const FADE_IN_MS = 280

// ── 型 ───────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'animating'

interface NodeData {
  problem: Problem
  x: number
  y: number
  opacity: number
  layer: 0 | 1 | 2
  parentId?: number  // layer 2 のみ: 親 layer 1 の problem.id
  isBack?: boolean   // 前の起点ノード
}

// ── ヘルパー ──────────────────────────────────────────────────────────────────

/**
 * 画面サイズから L1 の楕円半径 (rx/ry) と L2 の円半径を計算。
 * 縦長画面では水平を画面幅に収めつつ垂直方向を大きく使う。
 */
function calcRadii(w: number, h: number) {
  const l1rx = Math.min(190, Math.max(120, w / 2 - L1_R - 22))
  const l1ry = Math.min(270, Math.max(155, h / 2 - L1_R - 62))
  const l2 = Math.min(100, Math.max(65, Math.min(w, h) * 0.18))
  return {l1rx, l1ry, l2}
}

/** L1 ノードの楕円ラジアル配置 */
function radialPositions(
  count: number, cx: number, cy: number,
  rx: number, ry: number,
  startAngle = -Math.PI / 2,
) {
  return Array.from({length: count}, (_, i) => {
    const angle = startAngle + (2 * Math.PI * i) / count
    return {x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle)}
  })
}

/**
 * L2 ノードの扇形配置。
 * 親 L1 の「中心からの方向」を基準に ±spread でファン状に並べる。
 */
function layer2Positions(
  parentX: number,
  parentY: number,
  cx: number,
  cy: number,
  count: number,
  r: number,
): Array<{x: number; y: number}> {
  const base = Math.atan2(parentY - cy, parentX - cx)
  const spread = count > 1 ? Math.PI / 3.5 : 0
  return Array.from({length: count}, (_, i) => {
    const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * spread
    const angle = base + offset
    return {x: parentX + r * Math.cos(angle), y: parentY + r * Math.sin(angle)}
  })
}

function trunc(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ── プリフェッチキャッシュ ────────────────────────────────────────────────────
// Promise ごとキャッシュすることで並行フェッチを防ぎ、解決済みなら即座に返る

const relatedCache = new Map<number, Promise<Problem[]>>()

function getCachedRelated(problem: Problem): Promise<Problem[]> {
  if (!relatedCache.has(problem.id)) {
    relatedCache.set(problem.id, fetchRelated(problem))
  }
  return relatedCache.get(problem.id)!
}

/** note から #Definition の内容を抽出 */
function extractDefinition(note: string | null): string | null {
  if (!note) return null
  const m = note.match(/#Definition[^\S\n]*([\s\S]*?)(?=\n#|$)/)
  if (!m) return null
  return m[1].trim() || null
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function ProblemGraphPage() {
  const {id} = useParams<{id: string}>()
  const {state} = useLocation()
  const navigate = useNavigate()
  const subjectColors = useSettingsStore((s) => s.subjectColors)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{w: number; h: number} | null>(null)
  const dimsRef = useRef<{w: number; h: number} | null>(null)
  dimsRef.current = dims

  const [center, setCenter] = useState<Problem | null>(
    (state as {problem?: Problem} | null)?.problem ?? null,
  )
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [history, setHistory] = useState<Problem[]>([])
  const [loading, setLoading] = useState(false)
  const [defOpen, setDefOpen] = useState(false)
  const [modalProblem, setModalProblem] = useState<Problem | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const historyRef = useRef<Problem[]>([])
  historyRef.current = history

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // コンテナサイズ監視
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect
      if (width > 0 && height > 0) setDims({w: width, h: height})
    })
    obs.observe(el)
    return () => {
      obs.disconnect()
      clearTimer()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // URL の id から Problem を取得（state がない場合）
  useEffect(() => {
    const numId = Number(id)
    if (!numId || center?.id === numId) return
    setLoading(true)
    fetchProblem(numId)
      .then(setCenter)
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // center が変わったら定義パネルを閉じる
  useEffect(() => { setDefOpen(false) }, [center?.id])

  // 中心が変わったら L1 → L2 の順にフェッチしてフェードイン
  useEffect(() => {
    if (!center || !dimsRef.current) return
    let cancelled = false  // ② 古いコールバック無視フラグ
    const {w, h} = dimsRef.current
    const cx = w / 2
    const cy = h / 2
    const {l1rx, l1ry, l2: l2R} = calcRadii(w, h)

    // 中心ノードだけ先に配置（同 key で DOM 維持）
    setNodes([{problem: center, x: cx, y: cy, opacity: 1, layer: 0}])

    setLoading(true)
    getCachedRelated(center)
      .then((rawL1Related) => {
        if (cancelled) return

        const backProblem = historyRef.current.length > 0
          ? historyRef.current[historyRef.current.length - 1]
          : null
        // ① back node と同じ problem が L1 に含まれると key が衝突するため除外
        const l1Related = backProblem
          ? rawL1Related.filter((p) => p.id !== backProblem.id)
          : rawL1Related

        const l1StartAngle = backProblem && l1Related.length > 0
          ? -Math.PI / 2 + Math.PI / l1Related.length
          : -Math.PI / 2
        const l1Pos = radialPositions(l1Related.length, cx, cy, l1rx, l1ry, l1StartAngle)

        const backNodeData: NodeData | null = backProblem
          ? {problem: backProblem, x: cx, y: cy - l1ry, opacity: 0, layer: 1, isBack: true}
          : null

        // L1（＋back node）を opacity:0 で追加
        setNodes((prev) => [
          ...prev,
          ...(backNodeData ? [backNodeData] : []),
          ...l1Related.map((p, i) => ({
            problem: p,
            x: l1Pos[i].x,
            y: l1Pos[i].y,
            opacity: 0,
            layer: 1 as const,
          })),
        ])

        // double-rAF: L1 フェードイン
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return
            setNodes((prev) =>
              prev.map((n) => (n.layer === 1 ? {...n, opacity: 1} : n)),
            )
            setPhase('idle')

            // L1 フェードイン開始直後に L2 をフェッチ（並列）
            const existingIds = new Set([center.id, ...l1Related.map((p) => p.id)])
            if (backProblem) existingIds.add(backProblem.id)

            Promise.all(
              l1Related.map((l1p, i) =>
                getCachedRelated(l1p).then((results) => ({
                  parentId: l1p.id,
                  parentPos: l1Pos[i],
                  // 既出の Problem を除外し上限を適用
                  filtered: results.slice(0, L2_MAX_PER_PARENT).filter((p) => {
                    if (existingIds.has(p.id)) return false
                    existingIds.add(p.id)
                    return true
                  }),
                })),
              ),
            ).then((groups) => {
              if (cancelled) return
              const l2Nodes: NodeData[] = []
              for (const {parentId, parentPos, filtered} of groups) {
                const positions = layer2Positions(
                  parentPos.x,
                  parentPos.y,
                  cx,
                  cy,
                  filtered.length,
                  l2R,
                )
                filtered.forEach((p, i) => {
                  l2Nodes.push({
                    problem: p,
                    x: positions[i].x,
                    y: positions[i].y,
                    opacity: 0,
                    layer: 2,
                    parentId,
                  })
                })
              }

              if (l2Nodes.length === 0) return
              setNodes((prev) => [...prev, ...l2Nodes])

              // L2 フェードイン
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (cancelled) return
                  setNodes((prev) =>
                    prev.map((n) => (n.layer === 2 ? {...n, opacity: 1} : n)),
                  )
                })
              })
            })
          })
        })
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [center?.id, !!dims]) // eslint-disable-line react-hooks/exhaustive-deps

  // 画面サイズ変化時にノード位置を再計算（または初回計測時にグラフを起動）
  useEffect(() => {
    if (!center || !dims) return
    // dims が初めて設定されたとき（nodes がまだ空）はグラフ構築 effect を再トリガー
    if (nodes.length === 0) return
    const {w, h} = dims
    const cx = w / 2
    const cy = h / 2
    const {l1rx, l1ry, l2: l2R} = calcRadii(w, h)

    const hasBack = nodes.some((n) => n.isBack)
    const l1Nodes = nodes.filter((n) => n.layer === 1 && !n.isBack)
    const l1StartAngle = hasBack && l1Nodes.length > 0
      ? -Math.PI / 2 + Math.PI / l1Nodes.length
      : -Math.PI / 2
    const l1Pos = radialPositions(l1Nodes.length, cx, cy, l1rx, l1ry, l1StartAngle)

    setNodes((prev) =>
      prev.map((n) => {
        if (n.layer === 0) return {...n, x: cx, y: cy}

        if (n.isBack) return {...n, x: cx, y: cy - l1ry}

        if (n.layer === 1) {
          const idx = l1Nodes.findIndex((p) => p.problem.id === n.problem.id)
          return idx !== -1 ? {...n, x: l1Pos[idx].x, y: l1Pos[idx].y} : n
        }

        if (n.layer === 2 && n.parentId !== undefined) {
          const parentIdx = l1Nodes.findIndex((p) => p.problem.id === n.parentId)
          if (parentIdx === -1) return n
          const parentPos = l1Pos[parentIdx]
          const siblings = prev.filter(
            (x) => x.layer === 2 && x.parentId === n.parentId,
          )
          const sibIdx = siblings.findIndex((x) => x.problem.id === n.problem.id)
          const positions = layer2Positions(
            parentPos.x,
            parentPos.y,
            cx,
            cy,
            siblings.length,
            l2R,
          )
          return sibIdx !== -1 ? {...n, x: positions[sibIdx].x, y: positions[sibIdx].y} : n
        }

        return n
      }),
    )
  }, [dims]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── イベントハンドラ ─────────────────────────────────────────────────────────

  function handleNodeClick(node: NodeData) {
    if (phase !== 'idle') return
    setDefOpen(false)
    const {w, h} = dimsRef.current!
    const cx = w / 2
    const cy = h / 2

    setPhase('animating')

    // タップしたノードを中心へスライド、他はフェードアウト
    setNodes((prev) =>
      prev.map((n) => {
        if (n.problem.id === node.problem.id) return {...n, x: cx, y: cy}
        return {...n, opacity: 0}
      }),
    )

    clearTimer()
    timerRef.current = setTimeout(() => {
      if (node.isBack) {
        setHistory((h) => h.slice(0, -1))
      } else {
        setHistory((h) => [...h, center!])
      }
      setCenter(node.problem)
    }, SLIDE_MS)
  }

  function navigateToCenter(problem: Problem) {
    if (phase !== 'idle') return
    const {w, h} = dimsRef.current!
    const cx = w / 2, cy = h / 2

    setPhase('animating')

    const existingNode = nodes.find((n) => n.problem.id === problem.id && n.layer !== 0)
    if (existingNode) {
      // グラフ内のノードならスライドアニメーション
      setNodes((prev) => prev.map((n) => {
        if (n.problem.id === problem.id) return {...n, x: cx, y: cy}
        return {...n, opacity: 0}
      }))
    } else {
      // グラフ外の問題はフェードアウトのみ
      setNodes((prev) => prev.map((n) => ({...n, opacity: 0})))
    }

    clearTimer()
    timerRef.current = setTimeout(() => {
      setHistory((h) => [...h, center!])
      setCenter(problem)
    }, SLIDE_MS)
  }

  function handleBack() {
    navigate(-1)
  }

  // ── レンダリング ─────────────────────────────────────────────────────────────

  const w = dims?.w ?? 0
  const h = dims?.h ?? 0
  const cx = w / 2
  const cy = h / 2
  const displayCenter = nodes.find((n) => n.layer === 0)?.problem ?? center
  const definition = extractDefinition(center?.note ?? null)

  // 中心ノードを最後に描画して L1/L2 の前面に来るようにする
  const sortedNodes = [
    ...nodes.filter((n) => n.layer !== 0),
    ...nodes.filter((n) => n.layer === 0),
  ]

  // L2 エッジ用: parentId → L1ノード位置のマップ
  const l1PosMap = new Map(
    nodes.filter((n) => n.layer === 1).map((n) => [n.problem.id, {x: n.x, y: n.y}]),
  )

  return (
    <div style={pageStyle}>
      {/* ヘッダー */}
      <div style={headerStyle}>
        <button onClick={handleBack} style={backBtnStyle}>
          <ChevronLeft size={18} />
          <span>戻る</span>
        </button>
        <span style={headerTitleStyle}>
          {displayCenter
            ? trunc(displayCenter.subCategory ?? displayCenter.subject, 14)
            : '問題グラフ'}
        </span>
        <div style={{width: 72}} />
      </div>

      {/* 定義パネル */}
      <div style={{...defPanelStyle, transform: defOpen ? 'translateY(0)' : 'translateY(100%)'}} onClick={() => setDefOpen(false)}>
        <div style={defHandleStyle} />
        <div style={defHeaderRowStyle}>
          <p style={defLabelStyle}>
            {displayCenter?.subCategory ?? displayCenter?.subject ?? ''}
          </p>
          <button
            style={defNotesBtnStyle}
            onClick={(e) => { e.stopPropagation(); setModalProblem(center) }}
          >
            <ScrollText size={12} />
            <span>ノートを見る</span>
          </button>
        </div>
        <p style={definition ? defTextStyle : defEmptyStyle}>
          {definition ?? '定義が登録されていません'}
        </p>
      </div>

      {/* ノートモーダル */}
      {modalProblem && (
        <ProblemQuickModal
          problem={modalProblem}
          zIndex={40}
          onClose={() => setModalProblem(null)}
          onUpdate={(updated) => {
            relatedCache.delete(updated.id)
            if (updated.id === center?.id) setCenter(updated)
            setModalProblem(updated)
          }}
          onDelete={(id) => {
            relatedCache.delete(id)
            setModalProblem(null)
            setDefOpen(false)
            if (id === center?.id) navigate(-1)
          }}
          onNavigate={(p) => {
            setModalProblem(null)
            setDefOpen(false)
            navigateToCenter(p)
          }}
          hideGraph
        />
      )}

      {/* グラフキャンバス */}
      <div ref={containerRef} style={canvasStyle}>
        {(!dims || (loading && nodes.length === 0)) && (
          <div style={overlayTextStyle}>読み込み中…</div>
        )}

        {dims && (
          <svg width={w} height={h} style={{display: 'block'}}>
            <defs>
              <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* L1 エッジ: 中心 → L1 */}
            {nodes
              .filter((n) => n.layer === 1)
              .map((n) => (
                <line
                  key={`edge-l1-${n.problem.id}`}
                  x1={cx} y1={cy}
                  x2={n.x} y2={n.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={0.75}
                  strokeDasharray={n.isBack ? '5,3' : undefined}
                  opacity={n.opacity}
                  style={{transition: `opacity ${FADE_IN_MS}ms ease`}}
                />
              ))}

            {/* L2 エッジ: L1 → L2 */}
            {nodes
              .filter((n) => n.layer === 2 && n.parentId !== undefined)
              .map((n) => {
                const p = l1PosMap.get(n.parentId!)
                if (!p) return null
                return (
                  <line
                    key={`edge-l2-${n.problem.id}`}
                    x1={p.x} y1={p.y}
                    x2={n.x} y2={n.y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={0.5}
                    opacity={n.opacity}
                    style={{transition: `opacity ${FADE_IN_MS}ms ease`}}
                  />
                )
              })}

            {/* ノード群（key = p-{id} で DOM 維持、center は最前面） */}
            {sortedNodes.map((n) => {
              const pal = subjectPalette(n.problem.subject, subjectColors[n.problem.subject])
              const isCenter = n.layer === 0
              const isL2 = n.layer === 2
              const isBack = n.isBack ?? false
              const r = isCenter ? CENTER_R : isL2 ? L2_R : L1_R
              const titleY = r + (isL2 ? 12 : 15)
              const metaY = r + (isL2 ? 21 : 26)
              const fontSize = isCenter ? 12 : isL2 ? 9 : 10
              const metaFontSize = isCenter ? 10 : 8
              const maxLen = isCenter ? 12 : isL2 ? 8 : 10

              return (
                <g
                  key={`p-${n.problem.id}`}
                  onClick={() => isCenter ? setDefOpen((v) => !v) : phase === 'idle' && handleNodeClick(n)}
                  style={{
                    transform: `translate(${n.x}px, ${n.y}px)`,
                    opacity: n.opacity,
                    cursor: 'pointer',
                    transition: [
                      `transform ${SLIDE_MS}ms cubic-bezier(0.4,0,0.2,1)`,
                      `opacity ${isCenter ? FADE_IN_MS : SLIDE_MS}ms ease`,
                    ].join(', '),
                  }}
                >
                  <circle
                    r={r}
                    fill={
                      isCenter ? pal.color
                      : isBack  ? 'rgba(255,255,255,0.04)'
                      : isL2   ? 'rgba(255,255,255,0.03)'
                      :          'rgba(255,255,255,0.06)'
                    }
                    stroke={
                      isCenter ? 'none'
                      : isBack  ? 'rgba(255,255,255,0.2)'
                      : isL2   ? 'rgba(255,255,255,0.18)'
                      :          pal.color
                    }
                    strokeWidth={isCenter ? 0 : isL2 ? 0.75 : 1}
                    strokeDasharray={isBack ? '3,2' : undefined}
                    strokeOpacity={isL2 ? 1 : 0.55}
                    filter={isCenter ? 'url(#node-glow)' : undefined}
                  />
                  <text
                    x={0} y={titleY}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={600}
                    fill={
                      isCenter ? 'rgba(255,255,255,0.92)'
                      : isBack  ? 'rgba(255,255,255,0.38)'
                      : isL2   ? 'rgba(255,255,255,0.38)'
                      :          'rgba(255,255,255,0.72)'
                    }
                    fontFamily="system-ui, sans-serif"
                  >
                    {trunc((isBack ? '← ' : '') + (n.problem.subCategory ?? n.problem.subject), maxLen + (isBack ? 2 : 0))}
                  </text>
                  <text
                    x={0} y={metaY}
                    textAnchor="middle"
                    fontSize={metaFontSize}
                    fill={
                      isCenter ? 'rgba(255,255,255,0.55)'
                      : isBack  ? 'rgba(255,255,255,0.22)'
                      : isL2   ? 'rgba(255,255,255,0.22)'
                      :          'rgba(255,255,255,0.38)'
                    }
                    fontFamily="system-ui, sans-serif"
                  >
                    {n.problem.questionRef}
                  </text>
                </g>
              )
            })}

            {/* ステータステキスト */}
            {loading && nodes.length > 0 && (
              <text
                x={cx} y={h - 20}
                textAnchor="middle"
                fontSize={11}
                fill="rgba(255,255,255,0.25)"
                fontFamily="system-ui, sans-serif"
              >
                関連問題を検索中…
              </text>
            )}
            {!loading && nodes.length === 1 && (
              <text
                x={cx} y={h - 20}
                textAnchor="middle"
                fontSize={11}
                fill="rgba(255,255,255,0.25)"
                fontFamily="system-ui, sans-serif"
              >
                関連問題が見つかりませんでした
              </text>
            )}
          </svg>
        )}
      </div>
    </div>
  )
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  overflow: 'hidden',
  backgroundColor: '#0d1117',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 52,
  padding: '0 12px',
  backgroundColor: '#0a0c12',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  flexShrink: 0,
}

const backBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  color: 'rgba(255,255,255,0.45)',
  padding: '6px 4px',
  minWidth: 72,
}

const headerTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.55)',
  flex: 1,
  textAlign: 'center',
}

const canvasStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
}

const overlayTextStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.25)',
}

const defPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '48%',
  backgroundColor: '#10151e',
  borderTop: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '20px 20px 0 0',
  padding: '16px 28px 32px',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 20,
  transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1)',
}

const defHandleStyle: React.CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: 'rgba(255,255,255,0.12)',
  margin: '0 auto 20px',
  flexShrink: 0,
}

const defHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
  flexShrink: 0,
}

const defLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.3)',
  margin: 0,
}

const defNotesBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '5px 10px',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 11,
  fontWeight: 600,
}

const defTextStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.75,
  fontWeight: 400,
  color: 'rgba(255,255,255,0.85)',
  margin: 0,
  overflowY: 'auto',
  flex: 1,
}

const defEmptyStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  fontStyle: 'italic',
  color: 'rgba(255,255,255,0.2)',
  margin: 0,
  flex: 1,
}
