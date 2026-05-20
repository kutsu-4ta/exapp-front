import {useEffect, useRef, useState} from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom'
import {ChevronLeft} from 'lucide-react'
import type {Problem} from '../types/workspace'
import {fetchProblem} from '../lib/api/problem'
import {fetchRelated} from '../lib/problems/related'
import {useSettingsStore} from '../lib/store/settings'
import {subjectPalette} from '../styles/subjectUI'
import {c} from '../styles/notion'

// ── 定数 ─────────────────────────────────────────────────────────────────────

const CENTER_W = 140
const CENTER_H = 56
const L1_W = 120
const L1_H = 48
const L2_W = 96
const L2_H = 38

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
  // 横: ノード幅の半分 + 余白 を引いた最大値に収める
  const l1rx = Math.min(175, Math.max(105, w / 2 - L1_W / 2 - 14))
  // 縦: 画面の半分から余白を引いた値 → 縦長ほど大きくなる
  const l1ry = Math.min(260, Math.max(140, h / 2 - L1_H / 2 - 50))
  const l2 = Math.min(110, Math.max(70, Math.min(w, h) * 0.20))
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

  // 中心が変わったら L1 → L2 の順にフェッチしてフェードイン
  useEffect(() => {
    if (!center || !dimsRef.current) return
    const {w, h} = dimsRef.current
    const cx = w / 2
    const cy = h / 2
    const {l1rx, l1ry, l2: l2R} = calcRadii(w, h)

    // 中心ノードだけ先に配置（同 key で DOM 維持）
    setNodes([{problem: center, x: cx, y: cy, opacity: 1, layer: 0}])

    setLoading(true)
    fetchRelated(center)
      .then((l1Related) => {
        const backProblem = historyRef.current.length > 0
          ? historyRef.current[historyRef.current.length - 1]
          : null
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
            setNodes((prev) =>
              prev.map((n) => (n.layer === 1 ? {...n, opacity: 1} : n)),
            )
            setPhase('idle')

            // L1 フェードイン開始直後に L2 をフェッチ（並列）
            const existingIds = new Set([center.id, ...l1Related.map((p) => p.id)])
            if (backProblem) existingIds.add(backProblem.id)

            Promise.all(
              l1Related.map((l1p, i) =>
                fetchRelated(l1p, L2_MAX_PER_PARENT).then((results) => ({
                  parentId: l1p.id,
                  parentPos: l1Pos[i],
                  // 既出の Problem を除外し重複を防ぐ
                  filtered: results.filter((p) => {
                    if (existingIds.has(p.id)) return false
                    existingIds.add(p.id)
                    return true
                  }),
                })),
              ),
            ).then((groups) => {
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
                  setNodes((prev) =>
                    prev.map((n) => (n.layer === 2 ? {...n, opacity: 1} : n)),
                  )
                })
              })
            })
          })
        })
      })
      .finally(() => setLoading(false))
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

  function handleBack() {
    navigate(-1)
  }

  // ── レンダリング ─────────────────────────────────────────────────────────────

  const w = dims?.w ?? 0
  const h = dims?.h ?? 0
  const cx = w / 2
  const cy = h / 2
  const displayCenter = nodes.find((n) => n.layer === 0)?.problem ?? center

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

      {/* グラフキャンバス */}
      <div ref={containerRef} style={canvasStyle}>
        {(!dims || (loading && nodes.length === 0)) && (
          <div style={overlayTextStyle}>読み込み中…</div>
        )}

        {dims && (
          <svg width={w} height={h} style={{display: 'block'}}>
            {/* L1 エッジ: 中心 → L1 */}
            {nodes
              .filter((n) => n.layer === 1)
              .map((n) => (
                <line
                  key={`edge-l1-${n.problem.id}`}
                  x1={cx} y1={cy}
                  x2={n.x} y2={n.y}
                  stroke={n.isBack ? 'rgba(55,53,47,0.12)' : 'rgba(55,53,47,0.10)'}
                  strokeWidth={1.5}
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
                    stroke="rgba(55,53,47,0.07)"
                    strokeWidth={1}
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
              const nw = isCenter ? CENTER_W : isL2 ? L2_W : L1_W
              const nh = isCenter ? CENTER_H : isL2 ? L2_H : L1_H
              const fontSize = isCenter ? 13 : isL2 ? 10 : 11
              const metaFontSize = isCenter ? 11 : 9
              const maxLen = isCenter ? 11 : isL2 ? 7 : 9
              const rx = isCenter ? 13 : isL2 ? 8 : 10

              return (
                <g
                  key={`p-${n.problem.id}`}
                  onClick={() => !isCenter && phase === 'idle' && handleNodeClick(n)}
                  style={{
                    transform: `translate(${n.x}px, ${n.y}px)`,
                    opacity: n.opacity,
                    cursor: isCenter ? 'default' : 'pointer',
                    transition: [
                      `transform ${SLIDE_MS}ms cubic-bezier(0.4,0,0.2,1)`,
                      `opacity ${isCenter ? FADE_IN_MS : SLIDE_MS}ms ease`,
                    ].join(', '),
                  }}
                >
                  <rect
                    x={-nw / 2} y={-nh / 2}
                    width={nw} height={nh}
                    rx={rx}
                    fill={isCenter ? pal.bg : isBack ? 'rgba(55,53,47,0.06)' : '#fff'}
                    stroke={isBack ? 'rgba(55,53,47,0.25)' : pal.color}
                    strokeWidth={isCenter ? 2 : isL2 ? 0.75 : 1}
                    strokeDasharray={isBack ? '4,2' : undefined}
                    opacity={isL2 ? 0.85 : 1}
                  />
                  <text
                    x={0} y={isL2 ? -6 : -8}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={700}
                    fill={isCenter ? pal.color : (isL2 || isBack) ? 'rgba(55,53,47,0.5)' : c.text}
                    fontFamily="system-ui, sans-serif"
                  >
                    {trunc((isBack ? '← ' : '') + (n.problem.subCategory ?? n.problem.subject), maxLen + (isBack ? 2 : 0))}
                  </text>
                  <text
                    x={0} y={isL2 ? 8 : 10}
                    textAnchor="middle"
                    fontSize={metaFontSize}
                    fill={isCenter ? pal.color : isBack ? 'rgba(55,53,47,0.3)' : 'rgba(55,53,47,0.38)'}
                    opacity={isCenter ? 0.8 : 1}
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
                fontSize={12}
                fill="rgba(55,53,47,0.35)"
                fontFamily="system-ui, sans-serif"
              >
                関連問題を検索中…
              </text>
            )}
            {!loading && nodes.length === 1 && (
              <text
                x={cx} y={h - 20}
                textAnchor="middle"
                fontSize={12}
                fill="rgba(55,53,47,0.35)"
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
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
  backgroundColor: '#f7f6f3',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 52,
  padding: '0 12px',
  backgroundColor: '#fff',
  borderBottom: `1px solid ${c.border}`,
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
  color: 'rgba(55,53,47,0.6)',
  padding: '6px 4px',
  minWidth: 72,
}

const headerTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.7)',
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
  color: 'rgba(55,53,47,0.4)',
}
