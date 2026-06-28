"use client";

import { useState } from "react";
import { ui } from "@/styles/ui";
import type { KnockoutRankingRow } from "@/types/knockout";

type KnockoutRankingSectionProps = {
  ranking: KnockoutRankingRow[];
  onRefresh: () => void | Promise<void>;
};

export function KnockoutRankingSection({
  ranking,
  onRefresh,
}: KnockoutRankingSectionProps) {
  const [openPlayerIds, setOpenPlayerIds] = useState<Record<string, boolean>>(
    {}
  );

  function togglePlayer(playerId: string) {
    setOpenPlayerIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }

  const topThree = ranking.slice(0, 3);

  return (
    <div className="space-y-4">
      {topThree.length > 0 && (
        <div className={ui.card}>
          <h2 className="mb-3 font-bold">Podio eliminatoria</h2>

          <div className="space-y-2">
            {topThree.map((row, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              const labels = ["1° lugar", "2° lugar", "3° lugar"];

              return (
                <div
                  key={row.player_id}
                  className={`rounded border p-4 ${
                    index === 0
                      ? "border-yellow-600 bg-yellow-950/20"
                      : "border-neutral-800 bg-neutral-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-neutral-500">
                        {labels[index]}
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {medals[index]} {row.player_name}
                      </p>
                    </div>

                    <p className="text-xl font-black">{row.total_points} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={ui.card}>
        <div className={ui.sectionHeader}>
          <div>
            <h2 className={ui.sectionTitle}>Ranking eliminatoria</h2>

            <p className={ui.mutedTextSmall}>
              Segunda quiniela. Cada acierto vale 5 puntos.
            </p>
          </div>

          <button onClick={onRefresh} className={ui.buttonSmall}>
            Actualizar
          </button>
        </div>

        {ranking.length === 0 ? (
          <p className={ui.mutedTextSmall}>
            Todavía no hay puntos calculados en eliminatoria.
          </p>
        ) : (
          <div className="space-y-2">
            {ranking.map((row, index) => {
              const isOpen = Boolean(openPlayerIds[row.player_id]);

              return (
                <div key={row.player_id} className={`${ui.innerCard} text-sm`}>
                  <button
                    type="button"
                    onClick={() => togglePlayer(row.player_id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <span className="font-semibold">
                        {index + 1}. {row.player_name}
                      </span>

                      <p className="mt-1 text-xs text-neutral-500">
                        {isOpen ? "Ocultar detalle" : "Ver detalle por rondas"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">{row.total_points} pts</p>
                      <p className="text-xs text-neutral-500">
                        {isOpen ? "▲" : "▼"}
                      </p>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3 text-xs text-neutral-400">
                      {row.details.length === 0 ? (
                        <p className={ui.mutedTextSmall}>
                          Todavía no hay detalle por rondas.
                        </p>
                      ) : (
                        row.details.map((detail) => (
                          <div
                            key={detail.round_id}
                            className="flex items-center justify-between rounded border border-neutral-800 p-2"
                          >
                            <span className="font-medium">
                              {detail.round_name}
                            </span>

                            <span className="font-semibold">
                              {detail.points} pts
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}