"use client";

import { useState } from "react";
import { ui } from "@/styles/ui";
import type { Player, SubmittedPredictionRow } from "@/types/quiniela";

type SubmittedPredictionsSectionProps = {
  isSubmitted: boolean;
  players: Player[];
  submittedPredictions: SubmittedPredictionRow[];
  onRefresh: () => void | Promise<void>;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function SubmittedPredictionsSection({
  isSubmitted,
  players,
  submittedPredictions,
  onRefresh,
  getTeamName,
}: SubmittedPredictionsSectionProps) {
  const [openPlayerIds, setOpenPlayerIds] = useState<Record<string, boolean>>(
    {}
  );

  function togglePlayer(playerId: string) {
    setOpenPlayerIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }

  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <h2 className={ui.sectionTitle}>Pronósticos enviados</h2>

        <button onClick={onRefresh} className={ui.buttonSmall}>
          Actualizar
        </button>
      </div>

      {!isSubmitted ? (
        <p className={ui.mutedTextSmall}>
          Envía tu quiniela final para poder ver los pronósticos enviados.
        </p>
      ) : submittedPredictions.length === 0 ? (
        <p className={ui.mutedTextSmall}>
          Todavía no hay pronósticos enviados.
        </p>
      ) : (
        <div className="space-y-3">
          {players
            .filter((player) => player.submitted)
            .map((submittedPlayer) => {
              const isOpen = Boolean(openPlayerIds[submittedPlayer.id]);

              const playerPredictions = submittedPredictions.filter(
                (prediction) => prediction.player_id === submittedPlayer.id
              );

              return (
                <div key={submittedPlayer.id} className={ui.innerCard}>
                  <button
                    type="button"
                    onClick={() => togglePlayer(submittedPlayer.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <h3 className="font-semibold">{submittedPlayer.name}</h3>

                      <p className="mt-1 text-xs text-neutral-500">
                        {playerPredictions.length} grupos enviados
                      </p>
                    </div>

                    <div className="text-right text-xs text-neutral-500">
                      <p>{isOpen ? "Ocultar" : "Ver picks"}</p>
                      <p>{isOpen ? "▲" : "▼"}</p>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                      {playerPredictions.map((prediction) => (
                        <div
                          key={prediction.group_id}
                          className="rounded border border-neutral-800 bg-neutral-950 p-3 text-sm"
                        >
                          <p className="font-medium">{prediction.group_name}</p>

                          <div className="mt-2 space-y-1 text-xs text-neutral-400">
                            <p>1. {getTeamName(prediction.first_team_id)}</p>
                            <p>2. {getTeamName(prediction.second_team_id)}</p>
                            <p>3. {getTeamName(prediction.third_team_id)}</p>
                            <p>4. {getTeamName(prediction.fourth_team_id)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}