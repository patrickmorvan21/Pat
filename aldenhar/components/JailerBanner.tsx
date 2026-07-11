"use client";

import { useEffect, useState } from "react";

/**
 * Bannière du Geôlier — il n'apparaît que de temps en temps, pour narguer
 * l'aventurier (mauvais jet, jalon, ou envie soudaine). Sa réplique s'écrit
 * lettre par lettre, vite, toujours dans sa bannière — jamais dans la narration.
 */
export default function JailerBanner({ line }: { line: string }) {
  // Le parent remonte le composant à chaque nouvelle réplique (prop key),
  // donc le compteur repart naturellement de zéro.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setShown((s) => {
        if (s >= line.length) {
          clearInterval(id);
          return s;
        }
        return s + 1;
      });
    }, 16);
    return () => clearInterval(id);
  }, [line]);

  return (
    <div className="scene-enter absolute bottom-0 left-0 h-[65px] w-full overflow-clip bg-[var(--color-accent)]">
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
        {line.slice(0, shown)}
      </p>
    </div>
  );
}
