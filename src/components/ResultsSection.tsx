"use client";

import { ui } from "@/styles/ui";

type Group = {
  id: string;
  name: string;
};

type GroupResults = Record<string, Record<number, string>>;

type ResultsSectionProps = {
  groups: Group[];
  groupResults: GroupResults;
  onRefresh: () => void | Promise<void>;
  hasCompleteGroupResult: (groupId: string) => boolean;
  getTeamName: (teamId: string | null | undefined) => string;
};

export function ResultsSection({
  groups,
  groupResults,
  onRefresh,
  hasCompleteGroupResult,
  getTeamName,
}: ResultsSectionProps) {
  return (
    <div className={ui.card}>
      <div className={ui.sectionHeader}>
        <h2 className={ui.sectionTitle}>Resultados oficiales</h2>

        <button onClick={onRefresh} className={ui.buttonSmall}>
          Actualizar
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const result = groupResults[group.id];

          return (
            <div key={group.id} className={`${ui.innerCard} text-sm`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{group.name}</h3>

                {hasCompleteGroupResult(group.id) ? (
                  <span className="text-xs font-semibold text-green-400">
                    Capturado
                  </span>
                ) : (
                  <span className={ui.mutedTextXs}>Pendiente</span>
                )}
              </div>

              {hasCompleteGroupResult(group.id) && result ? (
                <div className="space-y-1 text-xs text-neutral-400">
                  <p>1. {getTeamName(result[1])}</p>
                  <p>2. {getTeamName(result[2])}</p>
                  <p>3. {getTeamName(result[3])}</p>
                  <p>4. {getTeamName(result[4])}</p>
                </div>
              ) : (
                <p className={ui.mutedTextXs}>
                  Resultado oficial todavía no capturado.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}