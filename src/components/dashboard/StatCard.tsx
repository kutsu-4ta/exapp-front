type Props = { label: string; value: string; sub?: string }

export function StatCard({ label, value, sub }: Props) {
  return (
    <div className="flex flex-col justify-center px-4 py-4 rounded-lg border border-[var(--nt-border)] bg-white relative min-h-[80px]">
      <p className="text-[11px] text-[var(--nt-text-sub)] font-normal mb-1.5 tracking-[0.02em]">
        {label}
      </p>
      <p className="text-[22px] font-bold text-n-text m-0 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[var(--nt-text-hint)] mt-1.5">{sub}</p>}
    </div>
  )
}
