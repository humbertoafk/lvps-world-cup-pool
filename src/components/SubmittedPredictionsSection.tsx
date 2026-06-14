"use client";

import { ui } from "@/styles/ui";

type Player = {
  id: string;
  name: string;
  submitted: boolean;
};

type SubmittedPredictionRow = {
  player_id: string;
  player_name: string;
  group_id: string;
  group_name: string;
  first_team_id: string | null;
  second_team_id: string | null;
  third_team_id: string | null;
  fourth_team_id: string | null;
};

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
        <div className="space-y-4">
          {players
            .filter((player) => player.submitted)
            .map((submittedPlayer) => {
              const playerPredictions = submittedPredictions.filter(
                (prediction) => prediction.player_id === submittedPlayer.id
              );

              return (
                <div key={submittedPlayer.id} className={ui.innerCard}>
                  <h3 className="mb-2 font-semibold">
                    {submittedPlayer.name}
                  </h3>

                  <div className="space-y-3">
                    {playerPredictions.map((prediction) => (
                      <div key={prediction.group_id} className="text-sm">
                        <p className="font-medium">{prediction.group_name}</p>

                        <div className="mt-1 space-y-1 text-xs text-neutral-400">
                          <p>1. {getTeamName(prediction.first_team_id)}</p>
                          <p>2. {getTeamName(prediction.second_team_id)}</p>
                          <p>3. {getTeamName(prediction.third_team_id)}</p>
                          <p>4. {getTeamName(prediction.fourth_team_id)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}