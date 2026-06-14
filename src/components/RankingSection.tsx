"use client";

import { ui } from "@/styles/ui";

type PositionBreakdown = {
  position: number;
  predicted_team_id: string | null;
  real_team_id: string | null;
  points: number;
  reason: "exact" | "top2_inverted" | "wrong";
};

type RankingDetail = {
  group_id: string;
  group_name: string;
  points: number;
  status: "calculated" | "pending_result";
  positions: PositionBreakdown[];
};

type RankingRow = {
  player_id: string;
  player_name: string;
  total_points: number;
  submitted: boolean;
  details: RankingDetail[];
};

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
  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <h2 className={ui.sectionTitle}>Ranking</h2>

        <button onClick={onRefresh} className={ui.buttonSmall}>
          Actualizar
        </button>
      </div>

      {ranking.length === 0 ? (
        <p className={ui.mutedTextSmall}>Todavía no hay puntos calculados.</p>
      ) : (
        <div className="space-y-2">
          {ranking.map((row, index) => (
            <div key={row.player_id} className={`${ui.innerCard} text-sm`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {index + 1}. {row.player_name}
                </span>

                <span className="font-bold">{row.total_points} pts</span>
              </div>

              <div className="mt-2 space-y-1 border-t border-neutral-800 pt-2 text-xs text-neutral-400">
                {row.details.map((detail) => (
                  <div
                    key={detail.group_id}
                    className="rounded border border-neutral-800 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{detail.group_name}</span>

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
                                {getTeamName(positionDetail.real_team_id)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold">
                                +{positionDetail.points}
                              </p>

                              {positionDetail.reason === "exact" && (
                                <p className="text-green-400">Exacto</p>
                              )}

                              {positionDetail.reason === "top2_inverted" && (
                                <p className="text-yellow-400">Clasificado</p>
                              )}

                              {positionDetail.reason === "wrong" && (
                                <p className="text-neutral-500">Sin puntos</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}