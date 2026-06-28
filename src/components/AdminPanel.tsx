"use client";

import { useState } from "react";
import { GROUP_POSITIONS } from "@/constants/groupPositions";
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
  const [showGroupArchive, setShowGroupArchive] = useState(false);
  const [showGroupResults, setShowGroupResults] = useState(false);

  return (
    <div className="space-y-6">
      <div className={ui.adminCard}>
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-500">
          Panel de administrador
        </p>

        <h2 className="mt-1 text-2xl font-bold">Control general</h2>

        <p className="mt-2 text-sm text-neutral-300">
          La fase de grupos quedó archivada. La administración principal ahora
          debe enfocarse en la eliminatoria.
        </p>
      </div>

      <div className={ui.card}>
        <div className={ui.sectionHeader}>
          <div>
            <h3 className={ui.sectionTitle}>Jugadores</h3>

            <p className={ui.mutedTextSmall}>
              Desbloquea a un jugador si necesita corregir algo.
            </p>
          </div>
        </div>

        <select
          value={adminSelectedPlayerId}
          onChange={(event) => onAdminSelectedPlayerChange(event.target.value)}
          className={ui.select}
        >
          <option value="">Selecciona jugador</option>

          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>

        <button onClick={onUnlockPlayerSubmission} className={ui.buttonOrange}>
          Desbloquear jugador
        </button>
      </div>

      <div className={ui.card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-500">
              Archivada
            </p>

            <h3 className="mt-1 text-xl font-bold">Fase de grupos</h3>

            <p className="mt-2 text-sm text-neutral-400">
              Los controles anteriores siguen disponibles, pero quedan ocultos
              para no estorbar durante la eliminatoria.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGroupArchive((prev) => !prev)}
            className={ui.buttonSmall}
          >
            {showGroupArchive ? "Ocultar" : "Ver"}
          </button>
        </div>

        {showGroupArchive && (
          <div className="mt-4 space-y-4 border-t border-neutral-800 pt-4">
            <div className={ui.innerCard}>
              <p className="text-xs text-neutral-500">Estado de grupos</p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isQuinielaOpen ? "text-green-400" : "text-red-400"
                }`}
              >
                {isQuinielaOpen ? "Abierta" : "Cerrada"}
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                Este control corresponde a la quiniela de fase de grupos.
              </p>

              <button
                onClick={onToggleQuinielaOpen}
                className={`mt-3 ${
                  isQuinielaOpen ? ui.buttonOrange : ui.buttonGreen
                }`}
              >
                {isQuinielaOpen
                  ? "Cerrar quiniela de grupos"
                  : "Abrir quiniela de grupos"}
              </button>
            </div>

            <div className={ui.innerCard}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold">Resultados oficiales</h4>

                  <p className={ui.mutedTextSmall}>
                    Captura o corrige resultados de fase de grupos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGroupResults((prev) => !prev)}
                  className={ui.buttonSmall}
                >
                  {showGroupResults ? "Ocultar" : "Abrir"}
                </button>
              </div>
            </div>

            {showGroupResults && (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className={ui.innerCard}>
                    <h4 className="mb-3 font-semibold">{group.name}</h4>

                    {GROUP_POSITIONS.map((position) => (
                      <select
                        key={position}
                        className={ui.smallSelect}
                        value={groupResults[group.id]?.[position] || ""}
                        onChange={(event) =>
                          onUpdateGroupResult(
                            group.id,
                            position,
                            event.target.value
                          )
                        }
                      >
                        <option value="">Posición {position}</option>

                        {(teamsByGroup[group.id] || []).map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.flag_emoji} {team.name}
                          </option>
                        ))}
                      </select>
                    ))}

                    <button
                      onClick={() => onSaveGroupResult(group.id)}
                      className={ui.buttonGreen}
                    >
                      Guardar resultado
                    </button>
                  </div>
                ))}

                <button onClick={onRefreshRanking} className={ui.buttonBlue}>
                  Actualizar ranking de grupos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}