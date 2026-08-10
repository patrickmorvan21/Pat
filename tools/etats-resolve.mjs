/** Résolution TypeScript pour exécuter du code du jeu depuis Node :
    alias `@/…` → aldenhar/, et extensions omises complétées. */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as presolve } from "node:path";
const RACINE = presolve(dirname(fileURLToPath(import.meta.url)), "..", "aldenhar");
export async function resolve(spec, ctx, next) {
  let s = spec;
  if (s.startsWith("@/")) s = pathToFileURL(presolve(RACINE, s.slice(2))).href;
  const base = s.startsWith("file:") ? new URL(s) : ctx.parentURL ? new URL(s, ctx.parentURL) : null;
  if (base && base.protocol === "file:" && !existsSync(fileURLToPath(base))) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      if (existsSync(fileURLToPath(new URL(base.href + ext)))) return next(base.href + ext, ctx);
    }
  }
  return next(base ? base.href : s, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".ts") || url.endsWith(".tsx"))
    return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}
