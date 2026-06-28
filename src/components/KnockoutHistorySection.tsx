"use client";

import { ui } from "@/styles/ui";
import type { KnockoutMatch, KnockoutRound } from "@/types/knockout";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type KnockoutHistorySectionProps = {
  rounds: KnockoutRound[];
  matches: KnockoutMatch[];
  getTeamName: (teamId: string | null | undefined) => string;
};

export function KnockoutHistorySection({
  rounds,
  matches,
  getTeamName,
}: KnockoutHistorySectionProps) {
  if (rounds.length === 0) {
    return (
      <div className={ui.card}>
        <h3 className="font-bold">Eliminatoria</h3>

        <p className="mt-2 text-sm text-neutral-400">
          Todavía no hay rondas de eliminatoria cargadas.
        </p>
      </div>
    );
  }

  return (
    <div className={ui.card}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Segunda quiniela
      </p>

      <h3 className="mt-1 text-xl font-bold">Eliminatoria</h3>

      <p className="mt-2 text-sm text-neutral-400">
        Consulta el avance de 16avos, 8vos, 4tos, semifinales, 3er lugar y
        final.
      </p>

      <div className="mt-4 space-y-3">
        {rounds.map((round) => {
          const roundMatches = matches.filter(
            (match) => match.round_id === round.id
          );

          const completedMatches = roundMatches.filter(
            (match) => match.played && match.winner_team_id
          );

          return (
            <div key={round.id} className={ui.innerCard}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{round.name}</h4>

                  <p className="mt-1 text-xs text-neutral-500">
                    {roundMatches.length} partidos cargados ·{" "}
                    {completedMatches.length} con ganador
                  </p>
                </div>

                <span className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                  {getKnockoutStatusLabel(round.status)}
                </span>
              </div>

              {roundMatches.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-500">
                  Todavía no hay partidos cargados para esta ronda.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {roundMatches.map((match) => (
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

                      {match.played && match.winner_team_id ? (
                        <p className="mt-2 text-xs text-green-400">
                          Ganador: {getTeamName(match.winner_team_id)}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500">
                          Sin ganador capturado
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}