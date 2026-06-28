"use client";

import { ui } from "@/styles/ui";
import type { KnockoutMatch, KnockoutRound } from "@/types/knockout";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type CurrentPhaseSectionProps = {
  activeRound: KnockoutRound | null;
  matches: KnockoutMatch[];
  onRefresh: () => void | Promise<void>;
  onGoToHistory: () => void;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function CurrentPhaseSection({
  activeRound,
  matches,
  onRefresh,
  onGoToHistory,
  getTeamName,
}: CurrentPhaseSectionProps) {
  if (!activeRound) {
    return (
      <div className="space-y-4">
        <div className={ui.card}>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Quiniela actual
          </p>

          <h2 className="mt-1 text-2xl font-bold">Sin ronda activa</h2>

          <p className="mt-2 text-sm text-neutral-400">
            No hay ninguna ronda de eliminatoria abierta por ahora.
          </p>

          <button onClick={onRefresh} className={`mt-4 ${ui.buttonSmall}`}>
            Actualizar
          </button>
        </div>

        <div className={ui.card}>
          <h3 className="mb-2 font-bold">Fase de grupos archivada</h3>

          <p className="text-sm text-neutral-300">
            Puedes consultar la fase anterior desde Historial.
          </p>

          <button onClick={onGoToHistory} className={`mt-4 ${ui.buttonSmall}`}>
            Ver historial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Quiniela actual
            </p>

            <h2 className="mt-1 text-2xl font-bold">{activeRound.name}</h2>

            <p className="mt-2 text-sm text-neutral-400">
              Los jugadores solo podrán predecir la ronda activa. Cuando esta
              ronda termine, se abrirá la siguiente.
            </p>
          </div>

          <span className="rounded bg-green-950/40 px-2 py-1 text-xs font-semibold text-green-400">
            {getKnockoutStatusLabel(activeRound.status)}
          </span>
        </div>

        <button onClick={onRefresh} className={`mt-4 ${ui.buttonSmall}`}>
          Actualizar
        </button>
      </div>

      <div className={ui.card}>
        <h3 className="mb-2 font-bold">Estado de la ronda</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className={ui.innerCard}>
            <p className="text-xs text-neutral-500">Partidos</p>
            <p className="mt-1 text-lg font-bold">{matches.length}</p>
          </div>

          <div className={ui.innerCard}>
            <p className="text-xs text-neutral-500">Estado</p>
            <p className="mt-1 text-lg font-bold text-green-400">
              {getKnockoutStatusLabel(activeRound.status)}
            </p>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className={ui.card}>
          <h3 className="mb-2 font-bold">Pendiente de configurar partidos</h3>

          <p className="text-sm text-neutral-300">
            Todavía no hay partidos cargados para {activeRound.name}. El
            siguiente paso será agregarlos desde el panel de administrador.
          </p>
        </div>
      ) : (
        <div className={ui.card}>
          <h3 className="mb-3 font-bold">Partidos configurados</h3>

          <div className="space-y-2">
            {matches.map((match) => (
              <div key={match.id} className={ui.innerCard}>
                <p className="text-xs text-neutral-500">
                  Partido {match.match_number}
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {getTeamName(match.team_a_id)} vs{" "}
                  {getTeamName(match.team_b_id)}
                </p>

                {match.played && (
                  <p className="mt-2 text-xs text-green-400">
                    Ganador: {getTeamName(match.winner_team_id)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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