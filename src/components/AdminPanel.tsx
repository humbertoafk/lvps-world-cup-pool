"use client";

import { ui } from "@/styles/ui";
import type { Group, GroupResults, Player, Team } from "@/types/quiniela";

type AdminPanelProps = {
  players: Player[];
  groups: Group[];
  teamsByGroup: Record<string, Team[]>;
  groupResults: GroupResults;
  isQuinielaOpen: boolean;
  adminSelectedPlayerId: string;
  onAdminSelectedPlayerChange: (playerId: string) => void;
  onToggleQuinielaOpen: () => void | Promise<void>;
  onUnlockPlayerSubmission: () => void | Promise<void>;
  onRefreshRanking: () => void | Promise<void>;
  onUpdateGroupResult: (
    groupId: string,
    position: number,
    teamId: string
  ) => void;
  onSaveGroupResult: (groupId: string) => void | Promise<void>;
};

export function AdminPanel({
  players,
  groups,
  teamsByGroup,
  groupResults,
  isQuinielaOpen,
  adminSelectedPlayerId,
  onAdminSelectedPlayerChange,
  onToggleQuinielaOpen,
  onUnlockPlayerSubmission,
  onRefreshRanking,
  onUpdateGroupResult,
  onSaveGroupResult,
}: AdminPanelProps) {
  return (
    <div className={ui.adminCard}>
      <h2 className="mb-3 font-bold">Panel de administrador</h2>

      <p className="mb-4 text-sm text-neutral-300">
        Captura aquí los resultados oficiales de cada grupo.
      </p>

      <button
        onClick={onToggleQuinielaOpen}
        className={`mb-4 w-full rounded p-2 text-sm font-semibold ${
          isQuinielaOpen ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}
      >
        {isQuinielaOpen ? "Cerrar quiniela" : "Abrir quiniela"}
      </button>

      <div className={ui.innerCardSpaced}>
        <h3 className="mb-2 font-semibold">Desbloquear jugador</h3>

        <p className="mb-3 text-xs text-neutral-400">
          Esto conserva sus picks, pero permite que el jugador vuelva a
          editarlos.
        </p>

        <select
          value={adminSelectedPlayerId}
          onChange={(event) => onAdminSelectedPlayerChange(event.target.value)}
          className={ui.smallSelect}
        >
          <option value="">Selecciona jugador</option>

          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} {player.submitted ? "(enviado)" : "(pendiente)"}
            </option>
          ))}
        </select>

        <button onClick={onUnlockPlayerSubmission} className={ui.buttonOrange}>
          Desbloquear jugador
        </button>
      </div>

      <button
        onClick={onRefreshRanking}
        className="mb-4 w-full rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-100"
      >
        Actualizar ranking
      </button>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className={ui.innerCard}>
            <h3 className="mb-2 font-semibold">{group.name}</h3>

            {[1, 2, 3, 4].map((position) => (
              <select
                key={position}
                className={ui.smallSelect}
                value={groupResults[group.id]?.[position] || ""}
                onChange={(event) =>
                  onUpdateGroupResult(group.id, position, event.target.value)
                }
              >
                <option value="">Resultado posición {position}</option>

                {(teamsByGroup[group.id] || []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.flag_emoji} {team.name}
                  </option>
                ))}
              </select>
            ))}

            <button
              onClick={() => onSaveGroupResult(group.id)}
              className={ui.buttonYellow}
            >
              Guardar resultado oficial
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}