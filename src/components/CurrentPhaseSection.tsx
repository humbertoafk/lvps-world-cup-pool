"use client";

import { ui } from "@/styles/ui";
import type {
  KnockoutMatch,
  KnockoutPredictionMap,
  KnockoutRound,
} from "@/types/knockout";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type CurrentPhaseSectionProps = {
  activeRound: KnockoutRound | null;
  matches: KnockoutMatch[];
  predictions: KnockoutPredictionMap;
  hasSubmittedRound: boolean;
  onPredictionChange: (matchId: string, teamId: string) => void;
  onSavePrediction: (matchId: string) => void | Promise<void>;
  onSubmitRound: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onGoToHistory: () => void;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function CurrentPhaseSection({
  activeRound,
  matches,
  predictions,
  hasSubmittedRound,
  onPredictionChange,
  onSavePrediction,
  onSubmitRound,
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

  const isRoundOpen = activeRound.status === "open";

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
              Elige el ganador de cada partido. Solo se puede jugar la ronda
              activa.
            </p>
          </div>

          <span className="rounded bg-green-950/40 px-2 py-1 text-xs font-semibold text-green-400">
            {getKnockoutStatusLabel(activeRound.status)}
          </span>
        </div>

        {hasSubmittedRound && (
          <div className="mt-4 rounded border border-green-700 bg-green-950/30 p-3 text-sm text-green-400">
            Ya enviaste tus picks de esta ronda. No puedes modificarlos.
          </div>
        )}

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
            administrador debe agregarlos antes de que se puedan hacer picks.
          </p>
        </div>
      ) : (
        <div className={ui.card}>
          <h3 className="mb-3 font-bold">Partidos</h3>

          <div className="space-y-3">
            {matches.map((match) => {
              const selectedWinnerId = predictions[match.id] || "";

              return (
                <div key={match.id} className={ui.innerCard}>
                  <p className="text-xs text-neutral-500">
                    Partido {match.match_number}
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {getTeamName(match.team_a_id)} vs{" "}
                    {getTeamName(match.team_b_id)}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={
                        !isRoundOpen || hasSubmittedRound || !match.team_a_id
                      }
                      onClick={() =>
                        match.team_a_id &&
                        onPredictionChange(match.id, match.team_a_id)
                      }
                      className={`rounded border p-3 text-left text-sm disabled:opacity-50 ${
                        selectedWinnerId === match.team_a_id
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 bg-neutral-950 text-neutral-200"
                      }`}
                    >
                      {getTeamName(match.team_a_id)}
                    </button>

                    <button
                      type="button"
                      disabled={
                        !isRoundOpen || hasSubmittedRound || !match.team_b_id
                      }
                      onClick={() =>
                        match.team_b_id &&
                        onPredictionChange(match.id, match.team_b_id)
                      }
                      className={`rounded border p-3 text-left text-sm disabled:opacity-50 ${
                        selectedWinnerId === match.team_b_id
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 bg-neutral-950 text-neutral-200"
                      }`}
                    >
                      {getTeamName(match.team_b_id)}
                    </button>
                  </div>

                  <button
                    disabled={!isRoundOpen || hasSubmittedRound}
                    onClick={() => onSavePrediction(match.id)}
                    className="mt-3 w-full rounded bg-green-600 p-2 text-sm font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-400"
                  >
                    Guardar partido
                  </button>

                  {match.played && (
                    <p className="mt-2 text-xs text-green-400">
                      Ganador real: {getTeamName(match.winner_team_id)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div className={ui.card}>
          <button
            disabled={!isRoundOpen || hasSubmittedRound}
            onClick={onSubmitRound}
            className={ui.buttonSubmit}
          >
            Enviar {activeRound.name}
          </button>

          <p className="mt-2 text-xs text-neutral-500">
            Después de enviar esta ronda, tus picks quedarán bloqueados.
          </p>
        </div>
      )}

      <div className={ui.card}>
        <h3 className="mb-2 font-bold">Cómo funcionará</h3>

        <div className="space-y-2 text-sm text-neutral-300">
          <p>1. Solo se puede predecir la ronda activa.</p>
          <p>2. Cuando terminen 16vos, se abrirán 8vos.</p>
          <p>3. Los puntos de eliminatoria van separados de grupos.</p>
          <p>4. La fase de grupos sigue disponible en Historial.</p>
        </div>

        <button onClick={onGoToHistory} className={`mt-4 ${ui.buttonSmall}`}>
          Ver historial
        </button>
      </div>
    </div>
  );
}