"use client";

import { ui } from "@/styles/ui";
import type { Player } from "@/types/quiniela";

type StatusSectionProps = {
  players: Player[];
  onRefresh: () => void | Promise<void>;
};

export function StatusSection({ players, onRefresh }: StatusSectionProps) {
  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <h2 className={ui.sectionTitle}>Estado de entregas</h2>

        <button onClick={onRefresh} className={ui.buttonSmall}>
          Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between text-sm"
          >
            <span>{player.name}</span>

            {player.submitted ? (
              <span className="font-semibold text-green-400">✅ Enviado</span>
            ) : (
              <span className={ui.mutedText}>⏳ Pendiente</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}