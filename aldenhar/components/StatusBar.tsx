/** Barre de statut iOS simulée — reproduction de l'instance Figma (15:20 / antenne / 5G / batterie). */
export default function StatusBar() {
  return (
    <div className="absolute top-0 left-0 z-[3] flex w-full items-start justify-between bg-[var(--color-bg)] px-[32px] py-[16px]">
      <p className="text-center font-semibold leading-[16px] text-[16px] text-[var(--color-ink)] [font-family:var(--font-status)]">
        15:20
      </p>
      <div className="flex items-center justify-center gap-[8px]">
        <div className="flex items-end gap-[2px]" aria-hidden>
          <div className="size-[4px] rounded-[2px] bg-[var(--color-ink)]" />
          <div className="h-[6px] w-[4px] rounded-[2px] bg-[var(--color-ink)]" />
          <div className="h-[9px] w-[4px] rounded-[2px] bg-[var(--color-ink)] opacity-20" />
          <div className="h-[12px] w-[4px] rounded-[2px] bg-[var(--color-ink)] opacity-20" />
        </div>
        <p className="text-center font-semibold leading-[16px] text-[14px] text-[var(--color-ink)] [font-family:var(--font-status)]">
          5G
        </p>
        <div className="flex items-center gap-px" aria-hidden>
          <div className="flex h-[14px] w-[25px] flex-col items-start rounded-[4px] border border-solid border-[var(--color-ink)] p-[3px]">
            <div className="min-h-px w-[11px] flex-1 rounded-[2px] bg-[var(--color-ink)]" />
          </div>
          <div className="h-[4px] w-px rounded-r-[1px] bg-[var(--color-ink)] opacity-40" />
        </div>
      </div>
    </div>
  );
}
