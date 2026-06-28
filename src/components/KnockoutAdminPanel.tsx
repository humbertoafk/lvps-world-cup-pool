"use client";

import { ui } from "@/styles/ui";
import type { KnockoutMatch, KnockoutRound } from "@/types/knockout";
import type { Player, Team } from "@/types/quiniela";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type KnockoutAdminPanelProps = {
  activeRound: KnockoutRound | null;
  rounds: KnockoutRound[];
  matches: KnockoutMatch[];
  players: Player[];
  teamsByGroup: Record<string, Team[]>;
  matchNumber: string;
  teamAId: string;
  teamBId: string;
  winnersByMatch: Record<string, string>;
  unlockPlayerId: string;
  unlockRoundId: string;
  onMatchNumberChange: (value: string) => void;
  onTeamAChange: (value: string) => void;
  onTeamBChange: (value: string) => void;
  onWinnerChange: (matchId: string, teamId: string) => void;
  onUnlockPlayerChange: (playerId: string) => void;
  onUnlockRoundChange: (roundId: string) => void;
  onSaveMatch: () => void | Promise<void>;
  onSaveWinner: (matchId: string) => void | Promise<void>;
  onCloseRound: () => void | Promise<void>;
  onCompleteRound: () => void | Promise<void>;
  onOpenNextRound: () => void | Promise<void>;
  onUnlockPlayerRound: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function KnockoutAdminPanel({
  activeRound,
  rounds,
  matches,
  players,
  teamsByGroup,
  matchNumber,
  teamAId,
  teamBId,
  winnersByMatch,
  unlockPlayerId,
  unlockRoundId,
  onMatchNumberChange,
  onTeamAChange,
  onTeamBChange,
  onWinnerChange,
  onUnlockPlayerChange,
  onUnlockRoundChange,
  onSaveMatch,
  onSaveWinner,
  onCloseRound,
  onCompleteRound,
  onOpenNextRound,
  onUnlockPlayerRound,
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

  const allMatchesHaveWinner =
    matches.length > 0 &&
    matches.every((match) => match.played && match.winner_team_id);

  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <div>
          <h2 className={ui.sectionTitle}>Eliminatoria</h2>

          <p className={ui.mutedTextSmall}>
            Ronda actual: {activeRound.name}
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

      <div className="mb-6 rounded border border-neutral-800 bg-neutral-950 p-3">
        <h3 className="mb-2 font-bold">Control de ronda</h3>

        <p className="mb-3 text-sm text-neutral-400">
          Usa estos controles para cerrar la ronda actual, marcarla como
          completada y abrir la siguiente.
        </p>

        <div className="space-y-2">
          <button
            onClick={onCloseRound}
            disabled={activeRound.status !== "open"}
            className="w-full rounded bg-orange-500 p-2 text-sm font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Cerrar ronda
          </button>

          <button
            onClick={onCompleteRound}
            disabled={activeRound.status !== "closed" || !allMatchesHaveWinner}
            className="w-full rounded bg-green-600 p-2 text-sm font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Marcar ronda como completada
          </button>

          <button
            onClick={onOpenNextRound}
            disabled={activeRound.status !== "completed"}
            className={ui.buttonBlue}
          >
            Abrir siguiente ronda
          </button>
        </div>

        {matches.length === 0 && (
          <p className="mt-3 text-xs text-yellow-400">
            Para cerrar la ronda, primero carga al menos un partido.
          </p>
        )}

        {!allMatchesHaveWinner && matches.length > 0 && (
          <p className="mt-3 text-xs text-yellow-400">
            Para completar la ronda, primero captura todos los ganadores reales.
          </p>
        )}
      </div>

      <div className="mb-6 rounded border border-neutral-800 bg-neutral-950 p-3">
        <h3 className="mb-2 font-bold">Desbloquear picks de eliminatoria</h3>

        <p className="mb-3 text-sm text-neutral-400">
          Usa esta opción si un jugador necesita corregir sus picks de una ronda
          de eliminatoria.
        </p>

        <div className="space-y-3">
          <select
            value={unlockPlayerId}
            onChange={(event) => onUnlockPlayerChange(event.target.value)}
            className={ui.select}
          >
            <option value="">Selecciona jugador</option>

            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>

          <select
            value={unlockRoundId}
            onChange={(event) => onUnlockRoundChange(event.target.value)}
            className={ui.select}
          >
            <option value="">Selecciona ronda</option>

            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name} — {getKnockoutStatusLabel(round.status)}
              </option>
            ))}
          </select>

          <button onClick={onUnlockPlayerRound} className={ui.buttonOrange}>
            Desbloquear picks de ronda
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Si la ronda está cerrada, el jugador seguirá sin poder editar aunque
          sus picks estén desbloqueados. Para editar, la ronda debe estar
          abierta.
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