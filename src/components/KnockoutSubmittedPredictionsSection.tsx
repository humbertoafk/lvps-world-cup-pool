"use client";

import { useState } from "react";
import { ui } from "@/styles/ui";
import type {
  KnockoutMatch,
  KnockoutPrediction,
  KnockoutRound,
} from "@/types/knockout";
import type { Player } from "@/types/quiniela";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type KnockoutSubmittedPredictionsSectionProps = {
  rounds: KnockoutRound[];
  matches: KnockoutMatch[];
  players: Player[];
  predictions: KnockoutPrediction[];
  getTeamName: (teamId: string | null | undefined) => string;
  onRefresh: () => void | Promise<void>;
};

export function KnockoutSubmittedPredictionsSection({
  rounds,
  matches,
  players,
  predictions,
  getTeamName,
  onRefresh,
}: KnockoutSubmittedPredictionsSectionProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [openRoundIds, setOpenRoundIds] = useState<Record<string, boolean>>({});
  const [openPlayerIds, setOpenPlayerIds] = useState<Record<string, boolean>>(
    {}
  );

  const submittedPredictions = predictions.filter(
    (prediction) => prediction.submitted
  );

  function toggleRound(roundId: string) {
    setOpenRoundIds((prev) => ({
      ...prev,
      [roundId]: !prev[roundId],
    }));
  }

  function togglePlayer(roundId: string, playerId: string) {
    const key = `${roundId}-${playerId}`;

    setOpenPlayerIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <div>
          <h2 className={ui.sectionTitle}>Eliminatoria</h2>

          <p className={ui.mutedTextSmall}>
            Picks enviados de la segunda quiniela.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSectionOpen((prev) => !prev)}
          className={ui.buttonSmall}
        >
          {isSectionOpen ? "Ocultar" : "Abrir"}
        </button>
      </div>

      {!isSectionOpen ? (
        <p className={ui.mutedTextSmall}>
          Sección contraída. Abre para ver picks por ronda.
        </p>
      ) : (
        <div className="space-y-3">
          <button onClick={onRefresh} className={ui.buttonSmall}>
            Actualizar
          </button>

          {rounds.length === 0 ? (
            <p className={ui.mutedTextSmall}>
              Todavía no hay rondas de eliminatoria.
            </p>
          ) : (
            rounds.map((round) => {
              const isRoundOpen = Boolean(openRoundIds[round.id]);

              const roundMatches = matches.filter(
                (match) => match.round_id === round.id
              );

              const roundMatchIds = new Set(
                roundMatches.map((match) => match.id)
              );

              const roundPredictions = submittedPredictions.filter(
                (prediction) => roundMatchIds.has(prediction.match_id)
              );

              const playersWithPredictions = players.filter((player) =>
                roundPredictions.some(
                  (prediction) => prediction.player_id === player.id
                )
              );

              return (
                <div key={round.id} className={ui.innerCard}>
                  <button
                    type="button"
                    onClick={() => toggleRound(round.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <h3 className="font-semibold">{round.name}</h3>

                      <p className="mt-1 text-xs text-neutral-500">
                        {getKnockoutStatusLabel(round.status)} ·{" "}
                        {playersWithPredictions.length} jugadores con picks
                      </p>
                    </div>

                    <div className="text-right text-xs text-neutral-500">
                      <p>{isRoundOpen ? "Ocultar" : "Ver"}</p>
                      <p>{isRoundOpen ? "▲" : "▼"}</p>
                    </div>
                  </button>

                  {isRoundOpen && (
                    <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                      {roundMatches.length === 0 ? (
                        <p className={ui.mutedTextSmall}>
                          No hay partidos cargados para esta ronda.
                        </p>
                      ) : playersWithPredictions.length === 0 ? (
                        <p className={ui.mutedTextSmall}>
                          Todavía no hay picks enviados en esta ronda.
                        </p>
                      ) : (
                        playersWithPredictions.map((player) => {
                          const playerKey = `${round.id}-${player.id}`;
                          const isPlayerOpen = Boolean(
                            openPlayerIds[playerKey]
                          );

                          const playerPredictions = roundPredictions.filter(
                            (prediction) => prediction.player_id === player.id
                          );

                          return (
                            <div key={player.id} className={ui.innerCard}>
                              <button
                                type="button"
                                onClick={() =>
                                  togglePlayer(round.id, player.id)
                                }
                                className="flex w-full items-center justify-between text-left"
                              >
                                <div>
                                  <h4 className="font-semibold">
                                    {player.name}
                                  </h4>

                                  <p className="mt-1 text-xs text-neutral-500">
                                    {playerPredictions.length} picks enviados
                                  </p>
                                </div>

                                <div className="text-right text-xs text-neutral-500">
                                  <p>{isPlayerOpen ? "Ocultar" : "Ver picks"}</p>
                                  <p>{isPlayerOpen ? "▲" : "▼"}</p>
                                </div>
                              </button>

                              {isPlayerOpen && (
                                <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
                                  {roundMatches.map((match) => {
                                    const prediction = playerPredictions.find(
                                      (item) => item.match_id === match.id
                                    );

                                    return (
                                      <div
                                        key={match.id}
                                        className="rounded border border-neutral-800 bg-neutral-950 p-3 text-sm"
                                      >
                                        <p className="text-xs text-neutral-500">
                                          Partido {match.match_number}
                                        </p>

                                        <p className="mt-1 font-semibold">
                                          {getTeamName(match.team_a_id)} vs{" "}
                                          {getTeamName(match.team_b_id)}
                                        </p>

                                        <p className="mt-2 text-xs text-neutral-400">
                                          Pick:{" "}
                                          <span className="font-semibold text-neutral-200">
                                            {prediction
                                              ? getTeamName(
                                                  prediction.predicted_winner_team_id
                                                )
                                              : "Sin pick"}
                                          </span>
                                        </p>

                                        {match.played &&
                                          match.winner_team_id && (
                                            <p className="mt-1 text-xs text-green-400">
                                              Ganador real:{" "}
                                              {getTeamName(
                                                match.winner_team_id
                                              )}
                                            </p>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}