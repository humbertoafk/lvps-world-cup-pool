"use client";

import { useState } from "react";
import { RankingPodium } from "@/components/RankingPodium";
import { ui } from "@/styles/ui";
import type { RankingRow } from "@/types/quiniela";

type RankingSectionProps = {
  ranking: RankingRow[];
  onRefresh: () => void | Promise<void>;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function RankingSection({
  ranking,
  onRefresh,
  getTeamName,
}: RankingSectionProps) {
  const [openPlayerIds, setOpenPlayerIds] = useState<Record<string, boolean>>(
    {}
  );

  function togglePlayer(playerId: string) {
    setOpenPlayerIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }

  return (
    <div className="space-y-4">
      <RankingPodium ranking={ranking} />

      <div className={ui.card}>
        <div className={ui.sectionHeader}>
          <h2 className={ui.sectionTitle}>Ranking completo</h2>

          <button onClick={onRefresh} className={ui.buttonSmall}>
            Actualizar
          </button>
        </div>

        {ranking.length === 0 ? (
          <p className={ui.mutedTextSmall}>Todavía no hay puntos calculados.</p>
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
                        {isOpen ? "Ocultar detalle" : "Ver detalle por grupo"}
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
                    <div className="mt-3 space-y-1 border-t border-neutral-800 pt-3 text-xs text-neutral-400">
                      {row.details.map((detail) => (
                        <div
                          key={detail.group_id}
                          className="rounded border border-neutral-800 p-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {detail.group_name}
                            </span>

                            {detail.status === "pending_result" ? (
                              <span className={ui.mutedText}>Pendiente</span>
                            ) : (
                              <span className="font-semibold">
                                {detail.points} pts
                              </span>
                            )}
                          </div>

                          {detail.status === "calculated" && (
                            <div className="mt-2 space-y-1 text-xs text-neutral-400">
                              {detail.positions.map((positionDetail) => (
                                <div
                                  key={positionDetail.position}
                                  className="flex items-start justify-between gap-3"
                                >
                                  <div>
                                    <p>
                                      {positionDetail.position}. Pick:{" "}
                                      {getTeamName(
                                        positionDetail.predicted_team_id
                                      )}
                                    </p>

                                    <p className="text-neutral-500">
                                      Real:{" "}
                                      {getTeamName(
                                        positionDetail.real_team_id
                                      )}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="font-semibold">
                                      +{positionDetail.points}
                                    </p>

                                    {positionDetail.reason === "exact" && (
                                      <p className="text-green-400">Exacto</p>
                                    )}

                                    {positionDetail.reason ===
                                      "top2_inverted" && (
                                      <p className="text-yellow-400">
                                        Clasificado
                                      </p>
                                    )}

                                    {positionDetail.reason === "wrong" && (
                                      <p className="text-neutral-500">
                                        Sin puntos
                                      </p>
                                    )}
                                  </div>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}