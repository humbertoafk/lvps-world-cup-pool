"use client";

import { ui } from "@/styles/ui";

type Group = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  group_id: string;
  flag_emoji: string | null;
};

type Predictions = Record<string, Record<number, string>>;

type MyQuinielaSectionProps = {
  groups: Group[];
  teamsByGroup: Record<string, Team[]>;
  predictions: Predictions;
  isSubmitted: boolean;
  isQuinielaOpen: boolean;
  onUpdatePrediction: (
    groupId: string,
    position: number,
    teamId: string
  ) => void;
  onSaveGroupPrediction: (groupId: string) => void | Promise<void>;
  onSubmitFinalPredictions: () => void | Promise<void>;
};

export function MyQuinielaSection({
  groups,
  teamsByGroup,
  predictions,
  isSubmitted,
  isQuinielaOpen,
  onUpdatePrediction,
  onSaveGroupPrediction,
  onSubmitFinalPredictions,
}: MyQuinielaSectionProps) {
  if (groups.length === 0) {
    return <p className={ui.mutedTextSmall}>No hay grupos cargados.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className={ui.cardPlain}>
          <h2 className="mb-3 font-bold">{group.name}</h2>

          {(teamsByGroup[group.id] || []).length === 0 && (
            <p className="mb-3 text-sm text-red-400">
              Este grupo no tiene equipos cargados.
            </p>
          )}

          {[1, 2, 3, 4].map((position) => (
            <select
              key={position}
              disabled={isSubmitted || !isQuinielaOpen}
              className={ui.smallSelect}
              value={predictions[group.id]?.[position] || ""}
              onChange={(event) =>
                onUpdatePrediction(group.id, position, event.target.value)
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
            disabled={isSubmitted || !isQuinielaOpen}
            onClick={() => onSaveGroupPrediction(group.id)}
            className={ui.buttonGreen}
          >
            Guardar grupo
          </button>
        </div>
      ))}

      <div className={ui.cardPlain}>
        {isSubmitted ? (
          <p className="font-semibold text-green-400">
            Quiniela enviada. Tus picks están bloqueados.
          </p>
        ) : (
          <button
            disabled={!isQuinielaOpen}
            onClick={onSubmitFinalPredictions}
            className={ui.buttonSubmit}
          >
            Enviar quiniela final
          </button>
        )}
      </div>
    </div>
  );
}