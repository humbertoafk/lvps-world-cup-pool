"use client";

import { ui } from "@/styles/ui";

type CurrentPhaseSectionProps = {
  onGoToHistory: () => void;
};

export function CurrentPhaseSection({ onGoToHistory }: CurrentPhaseSectionProps) {
  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Quiniela actual
        </p>

        <h2 className="mt-1 text-2xl font-bold">Eliminatoria</h2>

        <p className="mt-2 text-sm text-neutral-400">
          Aquí se jugarán los picks de la ronda activa: 16vos, 8vos, 4tos,
          semifinales, 3er lugar y final.
        </p>
      </div>

      <div className={ui.card}>
        <h3 className="mb-2 font-bold">Próxima fase</h3>

        <p className="text-sm text-neutral-300">
          La fase de grupos ya quedó archivada. La siguiente quiniela será la
          eliminatoria, empezando por 16vos de final.
        </p>

        <div className="mt-4 rounded border border-neutral-800 bg-neutral-950 p-3">
          <p className="text-sm font-semibold">Estado actual</p>
          <p className="mt-1 text-sm text-yellow-400">
            Pendiente de configurar 16vos de final
          </p>
        </div>
      </div>

      <div className={ui.card}>
        <h3 className="mb-2 font-bold">Cómo funcionará</h3>

        <div className="space-y-2 text-sm text-neutral-300">
          <p>1. Solo se podrá predecir la ronda activa.</p>
          <p>2. Cuando terminen 16vos, se abrirán 8vos.</p>
          <p>3. Los puntos de eliminatoria irán separados de grupos.</p>
          <p>4. La fase de grupos seguirá disponible en Historial.</p>
        </div>

        <button onClick={onGoToHistory} className={`mt-4 ${ui.buttonSmall}`}>
          Ver historial
        </button>
      </div>
    </div>
  );
}