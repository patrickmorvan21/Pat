/**
 * Bannière du Geôlier — bas de la frame Figma :
 * fond accent, bord supérieur tramé pixel par pixel (bande extraite du design),
 * démon à gauche, réplique statistique en ton transactionnel.
 * Le Geôlier parle toujours ici, jamais dans la narration.
 */
export default function JailerBanner({ line }: { line: string }) {
  return (
    <div className="absolute bottom-0 left-0 h-[65px] w-full overflow-clip bg-[var(--color-accent)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src="assets/dithering-demon.jpg"
        className="pointer-events-none absolute top-[-8px] left-[-5px] h-[103px] w-[87px] -scale-x-100 object-cover"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src="assets/banner-edge.png"
        className="pointer-events-none absolute top-0 left-0 h-[9px] w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="absolute top-0 left-[93px] flex h-full w-[230px] items-center font-bold leading-[1.2] text-[11px] text-[var(--color-bg)]">
        {line}
      </p>
    </div>
  );
}
