"use client";

import { ui } from "@/styles/ui";
import type { KnockoutMatch, KnockoutRound } from "@/types/knockout";
import type { Team } from "@/types/quiniela";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type KnockoutAdminPanelProps = {
  activeRound: KnockoutRound | null;
  matches: KnockoutMatch[];
  teamsByGroup: Record<string, Team[]>;
  matchNumber: string;
  teamAId: string;
  teamBId: string;
  winnersByMatch: Record<string, string>;
  onMatchNumberChange: (value: string) => void;
  onTeamAChange: (value: string) => void;
  onTeamBChange: (value: string) => void;
  onWinnerChange: (matchId: string, teamId: string) => void;
  onSaveMatch: () => void | Promise<void>;
  onSaveWinner: (matchId: string) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function KnockoutAdminPanel({
  activeRound,
  matches,
  teamsByGroup,
  matchNumber,
  teamAId,
  teamBId,
  winnersByMatch,
  onMatchNumberChange,
  onTeamAChange,
  onTeamBChange,
  onWinnerChange,
  onSaveMatch,
  onSaveWinner,
  onRefresh,
  getTeamName,
}: KnockoutAdminPanelProps) {
  const allTeams = Object.values(teamsByGroup).flat();

  if (!activeRound) {
    return (
      <div className={ui.card}>
        <h2 className="mb-2 font-bold">Eliminatoria</h2>

        <p className={ui.mutedTextSmall}>
          No hay una ronda activa de eliminatoria.
        </p>

        <button onClick={onRefresh} className={`mt-4 ${ui.buttonSmall}`}>
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <div>
          <h2 className={ui.sectionTitle}>Eliminatoria</h2>

          <p className={ui.mutedTextSmall}>
            Ronda activa: {activeRound.name}
          </p>
        </div>

        <button onClick={onRefresh} className={ui.buttonSmall}>
          Actualizar
        </button>
      </div>

      <div className="mb-4 rounded border border-neutral-800 bg-neutral-950 p-3">
        <p className="text-xs text-neutral-500">Estado</p>
        <p className="mt-1 text-sm font-semibold text-green-400">
          {getKnockoutStatusLabel(activeRound.status)}
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <h3 className="font-bold">Crear / actualizar partido</h3>

        <input
          type="number"
          min="1"
          placeholder="Número de partido"
          value={matchNumber}
          onChange={(event) =>
            onMatchNumberChange(event.target.value.replace(/\D/g, ""))
          }
          className={ui.input}
        />

        <select
          value={teamAId}
          onChange={(event) => onTeamAChange(event.target.value)}
          className={ui.select}
        >
          <option value="">Selecciona Equipo A</option>

          {allTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.flag_emoji} {team.name}
            </option>
          ))}
        </select>

        <select
          value={teamBId}
          onChange={(event) => onTeamBChange(event.target.value)}
          className={ui.select}
        >
          <option value="">Selecciona Equipo B</option>

          {allTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.flag_emoji} {team.name}
            </option>
          ))}
        </select>

        <button onClick={onSaveMatch} className={ui.buttonBlue}>
          Guardar partido
        </button>
      </div>

      <div>
        <h3 className="mb-3 font-bold">Partidos cargados</h3>

        {matches.length === 0 ? (
          <p className={ui.mutedTextSmall}>
            Todavía no hay partidos cargados para esta ronda.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const selectedWinner =
                winnersByMatch[match.id] || match.winner_team_id || "";

              return (
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
                      Ganador guardado: {getTeamName(match.winner_team_id)}
                    </p>
                  )}

                  <div className="mt-3 space-y-2">
                    <select
                      value={selectedWinner}
                      onChange={(event) =>
                        onWinnerChange(match.id, event.target.value)
                      }
                      className={ui.select}
                    >
                      <option value="">Selecciona ganador real</option>

                      {match.team_a_id && (
                        <option value={match.team_a_id}>
                          {getTeamName(match.team_a_id)}
                        </option>
                      )}

                      {match.team_b_id && (
                        <option value={match.team_b_id}>
                          {getTeamName(match.team_b_id)}
                        </option>
                      )}
                    </select>

                    <button
                      onClick={() => onSaveWinner(match.id)}
                      className={ui.buttonGreen}
                    >
                      Guardar ganador
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}