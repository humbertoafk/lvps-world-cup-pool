"use client";

import { ui } from "@/styles/ui";

type PhaseHistorySectionProps = {
  onGoToGroupRanking: () => void;
  onGoToGroupResults: () => void;
  onGoToGroupPicks: () => void;
};

export function PhaseHistorySection({
  onGoToGroupRanking,
  onGoToGroupResults,
  onGoToGroupPicks,
}: PhaseHistorySectionProps) {
  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Historial
        </p>

        <h2 className="mt-1 text-2xl font-bold">Fases anteriores</h2>

        <p className="mt-2 text-sm text-neutral-400">
          Aquí estarán las quinielas que ya pasaron, sin mezclarse con la fase
          activa.
        </p>
      </div>

      <div className={ui.card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-500">
              Archivada
            </p>

            <h3 className="mt-1 text-xl font-bold">Fase de grupos</h3>

            <p className="mt-2 text-sm text-neutral-400">
              La primera quiniela queda guardada para consultar ranking,
              resultados y picks enviados.
            </p>
          </div>

          <span className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
            Finalizada
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button onClick={onGoToGroupRanking} className={ui.buttonSmall}>
            Ver ranking de grupos
          </button>

          <button onClick={onGoToGroupResults} className={ui.buttonSmall}>
            Ver resultados de grupos
          </button>

          <button onClick={onGoToGroupPicks} className={ui.buttonSmall}>
            Ver picks de grupos
          </button>
        </div>
      </div>

      <div className={ui.card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Próximamente
        </p>

        <h3 className="mt-1 font-bold">Eliminatoria</h3>

        <div className="mt-3 space-y-2 text-sm text-neutral-400">
          <p>⏳ 16vos de final</p>
          <p>⏳ 8vos de final</p>
          <p>⏳ 4tos de final</p>
          <p>⏳ Semifinales</p>
          <p>⏳ 3er lugar</p>
          <p>⏳ Final</p>
        </div>
      </div>
    </div>
  );
}