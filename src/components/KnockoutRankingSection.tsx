"use client";

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
  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <div>
          <h2 className={ui.sectionTitle}>Ranking eliminatoria</h2>

          <p className={ui.mutedTextSmall}>
            Puntos de la segunda quiniela. No se suman con fase de grupos.
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
          {ranking.map((row, index) => (
            <div key={row.player_id} className={ui.innerCard}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {index + 1}. {row.player_name}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Eliminatoria
                  </p>
                </div>

                <p className="font-bold">{row.total_points} pts</p>
              </div>

              {row.details.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-neutral-800 pt-3 text-xs text-neutral-400">
                  {row.details.map((detail) => (
                    <div
                      key={detail.round_id}
                      className="flex items-center justify-between"
                    >
                      <span>{detail.round_name}</span>
                      <span className="font-semibold">{detail.points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}