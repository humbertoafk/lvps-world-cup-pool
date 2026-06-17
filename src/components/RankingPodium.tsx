"use client";

import { ui } from "@/styles/ui";
import type { RankingRow } from "@/types/quiniela";

type RankingPodiumProps = {
  ranking: RankingRow[];
};

export function RankingPodium({ ranking }: RankingPodiumProps) {
  const topThree = ranking.slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  const medalByIndex = ["🥇", "🥈", "🥉"];
  const labelByIndex = ["1° lugar", "2° lugar", "3° lugar"];

  return (
    <div className={ui.card}>
      <h2 className="mb-3 font-bold">Podio actual</h2>

      <div className="space-y-2">
        {topThree.map((row, index) => (
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
                <p className="text-xs text-neutral-500">{labelByIndex[index]}</p>

                <p className="mt-1 text-lg font-bold">
                  {medalByIndex[index]} {row.player_name}
                </p>
              </div>

              <p className="text-xl font-black">{row.total_points} pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}