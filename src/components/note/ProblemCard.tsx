import type {Problem} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import {MarkdownContent} from "@/components/common/MarkdownContent.tsx";
import {PROF_COLORS, subjectBadgeText, subjectPalette} from "@/styles/subjectUI.ts";
import {useSettingsStore} from "@/lib/store/settings.ts";

type Props = {
  problem: Problem
  onClick?: () => void
}

export function ProblemCard({ problem, onClick }: Props) {
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const profColor = PROF_COLORS[problem.proficiency] ?? c.textSub
  const badgeText = subjectBadgeText(problem.subject)
  const palette = subjectPalette(problem.subject, subjectColors[problem.subject])

  return (
    <div style={card} onClick={onClick}>
      {/* Header: avatar | subCategory | @material_ref | · | date | prof ★ */}
      <div style={topRow}>
        <div style={{ ...avatar, backgroundColor: palette.bg, color: palette.color }}>
          {badgeText}
        </div>
        <span style={userName}>{problem.subCategory || '全般'}</span>
        <span style={userHandle}>@{problem.material}_{problem.questionRef}</span>
        <span style={dotSeparator}>·</span>
        <span style={dateText}>{problem.solvedAt.replace(/-/g, '/')}</span>
        <span style={{ ...profBadge, color: profColor }}>{problem.proficiency}</span>
        {problem.isGoodQuestion && <span style={starText}>★</span>}
      </div>

      {/* Note content */}
      <MarkdownContent>{problem.note}</MarkdownContent>

      {/* Hashtags */}
      <div style={tagRow}>
        {problem.failureTypes.map((ft) => (
          <span key={ft} style={hashtag}>#{ft}</span>
        ))}
        {problem.material && <span style={hashtag}>#{problem.material}</span>}
        <span style={hashtag}>#{problem.questionRef}</span>
      </div>

      {/* Fade-out overlay for clipped content */}
      <div style={fadeOverlay} />
    </div>
  )
}

// --- Styles ---

const card: React.CSSProperties = {
  position: 'relative',
  height: '35vh',
  overflow: 'hidden',
  padding: '12px 16px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const topRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}

const avatar: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 800,
  flexShrink: 0,
}

const userName: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  color: c.text,
}

const userHandle: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const dotSeparator: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  flexShrink: 0,
}

const dateText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  flexShrink: 0,
}

const profBadge: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 900,
  flexShrink: 0,
  marginLeft: 'auto',
}

const starText: React.CSSProperties = {
  fontSize: '12px',
  color: '#f2ab26',
  flexShrink: 0,
}

const tagRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: '10px',
  rowGap: '2px',
}

const hashtag: React.CSSProperties = {
  fontSize: font.sm,
  color: '#1d9bf0',
  fontWeight: 400,
}

const fadeOverlay: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '36px',
  background: 'linear-gradient(to bottom, transparent, #fff)',
  pointerEvents: 'none',
}
