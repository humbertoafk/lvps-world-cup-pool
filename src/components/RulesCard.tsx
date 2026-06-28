"use client";

import { ui } from "@/styles/ui";

export function RulesCard() {
  return (
    <div className={ui.card}>
      <h2 className={ui.sectionTitle}>Reglas de puntuación</h2>

      <div className="mt-3 rounded border border-green-900/60 bg-green-950/20 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Eliminatoria</p>

          <span className="rounded bg-green-950/60 px-2 py-1 text-xs font-semibold text-green-400">
            Activa
          </span>
        </div>

        <p className="mt-3 text-neutral-300">
          Cada acierto vale{" "}
          <span className="font-bold text-green-400">5 puntos</span>.
        </p>

        <p className="mt-2 text-neutral-400">
          Solo se puede predecir la ronda activa. Los puntos de eliminatoria no
          se suman con la fase de grupos.
        </p>
      </div>
    </div>
  );
}