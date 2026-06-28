"use client";

import { ui } from "@/styles/ui";
import type {
  KnockoutMatch,
  KnockoutRankingRow,
  KnockoutRound,
} from "@/types/knockout";
import type { Group, GroupResults, Player, RankingRow } from "@/types/quiniela";
import { getKnockoutStatusLabel } from "@/utils/knockoutStatus";

type DashboardSectionProps = {
  players: Player[];
  ranking: RankingRow[];
  groups: Group[];
  groupResults: GroupResults;
  activeKnockoutRound: KnockoutRound | null;
  activeKnockoutMatches: KnockoutMatch[];
  knockoutRanking: KnockoutRankingRow[];
  onGoToRanking: () => void;
  onGoToHistory: () => void;
};

export function DashboardSection({
  activeKnockoutRound,
  activeKnockoutMatches,
  knockoutRanking,
  onGoToRanking,
}: DashboardSectionProps) {
  const knockoutLeader = knockoutRanking[0] || null;
  const knockoutTopThree = knockoutRanking.slice(0, 3);

  const activeRoundStatus = activeKnockoutRound
    ? getKnockoutStatusLabel(activeKnockoutRound.status)
    : "Sin ronda activa";

  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Inicio
        </p>

        <h2 className="mt-1 text-2xl font-bold">LVP&apos;S Mundial 2026</h2>

        <p className="mt-2 text-sm text-neutral-400">
          La fase de grupos quedó archivada. La quiniela activa ahora es la
          eliminatoria.
        </p>
      </div>

      <div className={ui.card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-500">
              Quiniela actual
            </p>

            <h3 className="mt-1 text-2xl font-bold">
              {activeKnockoutRound?.name || "Eliminatoria"}
            </h3>

            <p className="mt-2 text-sm text-neutral-400">
              {activeKnockoutRound
                ? "Predice únicamente la ronda activa. Cuando termine, se abrirá la siguiente."
                : "Todavía no hay una ronda activa configurada."}
            </p>
          </div>

          <span className="rounded bg-green-950/40 px-2 py-1 text-xs font-semibold text-green-400">
            {activeRoundStatus}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className={ui.innerCard}>
            <p className="text-xs text-neutral-500">Partidos</p>
            <p className="mt-1 text-lg font-bold">
              {activeKnockoutMatches.length}
            </p>
          </div>

          <div className={ui.innerCard}>
            <p className="text-xs text-neutral-500">Puntuación</p>
            <p className="mt-1 text-lg font-bold">5 pts</p>
            <p className="mt-1 text-xs text-neutral-500">por acierto</p>
          </div>
        </div>
      </div>

      <div className={ui.card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-500">
              Líder eliminatoria
            </p>

            {knockoutLeader ? (
              <>
                <h3 className="mt-1 text-2xl font-bold">
                  🥇 {knockoutLeader.player_name}
                </h3>

                <p className="mt-1 text-sm text-neutral-400">
                  {knockoutLeader.total_points} pts en la segunda quiniela.
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-1 text-xl font-bold">Sin líder todavía</h3>

                <p className="mt-1 text-sm text-neutral-400">
                  El ranking aparecerá cuando haya resultados capturados.
                </p>
              </>
            )}
          </div>

          <button onClick={onGoToRanking} className={ui.buttonSmall}>
            Ver ranking
          </button>
        </div>
      </div>

      <div className={ui.card}>
        <h3 className="mb-3 font-bold">Podio eliminatoria</h3>

        {knockoutTopThree.length === 0 ? (
          <p className={ui.mutedTextSmall}>
            Todavía no hay puntos en eliminatoria.
          </p>
        ) : (
          <div className="space-y-2">
            {knockoutTopThree.map((row, index) => {
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