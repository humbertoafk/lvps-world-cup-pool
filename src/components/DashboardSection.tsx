"use client";

import { ui } from "@/styles/ui";
import type { Group, GroupResults, Player, RankingRow } from "@/types/quiniela";

type DashboardSectionProps = {
  players: Player[];
  ranking: RankingRow[];
  groups: Group[];
  groupResults: GroupResults;
  isQuinielaOpen: boolean;
  onGoToRanking: () => void;
  onGoToResults: () => void;
};

export function DashboardSection({
  players,
  ranking,
  groups,
  groupResults,
  isQuinielaOpen,
  onGoToRanking,
  onGoToResults,
}: DashboardSectionProps) {
  const submittedPlayers = players.filter((player) => player.submitted);
  const capturedResults = groups.filter((group) => {
    const result = groupResults[group.id];

    return Boolean(result?.[1] && result?.[2] && result?.[3] && result?.[4]);
  });

  const leader = ranking[0] || null;
  const secondPlace = ranking[1] || null;

  const leaderDifference =
    leader && secondPlace ? leader.total_points - secondPlace.total_points : 0;

  const totalPossiblePoints = groups.length * 12;
  const capturedPercentage =
    groups.length > 0 ? Math.round((capturedResults.length / groups.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Inicio
        </p>

        <h2 className="mt-1 text-2xl font-bold">Panel de la quiniela</h2>

        <p className="mt-2 text-sm text-neutral-400">
          Estado general de la competencia entre LVP&apos;S.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={ui.cardPlain}>
          <p className="text-xs text-neutral-500">Estado</p>
          <p
            className={`mt-1 text-lg font-bold ${
              isQuinielaOpen ? "text-green-400" : "text-red-400"
            }`}
          >
            {isQuinielaOpen ? "Abierta" : "Cerrada"}
          </p>
        </div>

        <div className={ui.cardPlain}>
          <p className="text-xs text-neutral-500">Entregas</p>
          <p className="mt-1 text-lg font-bold">
            {submittedPlayers.length}/{players.length}
          </p>
        </div>

        <div className={ui.cardPlain}>
          <p className="text-xs text-neutral-500">Resultados</p>
          <p className="mt-1 text-lg font-bold">
            {capturedResults.length}/{groups.length}
          </p>
        </div>

        <div className={ui.cardPlain}>
          <p className="text-xs text-neutral-500">Avance</p>
          <p className="mt-1 text-lg font-bold">{capturedPercentage}%</p>
        </div>
      </div>

      <div className={ui.card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-500">
              Líder actual
            </p>

            {leader ? (
              <>
                <h3 className="mt-1 text-2xl font-bold">
                  🥇 {leader.player_name}
                </h3>

                <p className="mt-1 text-sm text-neutral-400">
                  {leader.total_points} puntos de {totalPossiblePoints} posibles.
                </p>

                {secondPlace && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Ventaja sobre 2° lugar: {leaderDifference} pts.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">
                Todavía no hay ranking calculado.
              </p>
            )}
          </div>

          <button onClick={onGoToRanking} className={ui.buttonSmall}>
            Ver ranking
          </button>
        </div>
      </div>

      <div className={ui.card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Progreso de resultados</h3>

          <button onClick={onGoToResults} className={ui.buttonSmall}>
            Ver resultados
          </button>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${capturedPercentage}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {capturedResults.length} de {groups.length} grupos tienen resultado oficial capturado.
        </p>
      </div>

      <div className={ui.card}>
        <h3 className="mb-3 font-bold">Top actual</h3>

        {ranking.length === 0 ? (
          <p className={ui.mutedTextSmall}>Todavía no hay puntos calculados.</p>
        ) : (
          <div className="space-y-2">
            {ranking.slice(0, 3).map((row, index) => {
              const medals = ["🥇", "🥈", "🥉"];

              return (
                <div
                  key={row.player_id}
                  className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-950 p-3 text-sm"
                >
                  <span className="font-semibold">
                    {medals[index]} {row.player_name}
                  </span>

                  <span className="font-bold">{row.total_points} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}