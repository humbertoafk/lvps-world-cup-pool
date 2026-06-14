import type {
  GroupResults,
  Predictions,
  SubmittedPredictionRow,
  Team,
} from "@/types/quiniela";
import { getGroupOrderIndex } from "@/utils/groups";

type GroupSelectionRow = {
  group_id: string;
  first_team_id: string | null;
  second_team_id: string | null;
  third_team_id: string | null;
  fourth_team_id: string | null;
};

type SubmittedPredictionSourceRow = {
  player_id: string;
  group_id: string;
  first_team_id: string | null;
  second_team_id: string | null;
  third_team_id: string | null;
  fourth_team_id: string | null;
  players:
    | {
        name: string;
        submitted: boolean;
      }
    | {
        name: string;
        submitted: boolean;
      }[]
    | null;
  groups:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function getSingleRelation<T>(value: T | T[] | null | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value;
}

export function groupTeamsByGroup(teams: Team[] | null | undefined) {
  const grouped: Record<string, Team[]> = {};

  teams?.forEach((team) => {
    if (!grouped[team.group_id]) {
      grouped[team.group_id] = [];
    }

    grouped[team.group_id].push(team);
  });

  return grouped;
}

export function mapGroupResults(rows: unknown[] | null | undefined) {
  const saved: GroupResults = {};

  const typedRows = (rows || []) as GroupSelectionRow[];

  typedRows.forEach((result) => {
    saved[result.group_id] = {
      1: result.first_team_id || "",
      2: result.second_team_id || "",
      3: result.third_team_id || "",
      4: result.fourth_team_id || "",
    };
  });

  return saved;
}

export function mapSavedPredictions(rows: unknown[] | null | undefined) {
  const saved: Predictions = {};

  const typedRows = (rows || []) as GroupSelectionRow[];

  typedRows.forEach((prediction) => {
    saved[prediction.group_id] = {
      1: prediction.first_team_id || "",
      2: prediction.second_team_id || "",
      3: prediction.third_team_id || "",
      4: prediction.fourth_team_id || "",
    };
  });

  return saved;
}

export function mapSubmittedPredictions(rows: unknown[] | null | undefined) {
  const mappedRows: SubmittedPredictionRow[] = [];

  const typedRows = (rows || []) as SubmittedPredictionSourceRow[];

  typedRows.forEach((prediction) => {
    const playerData = getSingleRelation(prediction.players);
    const groupData = getSingleRelation(prediction.groups);

    if (!playerData || !groupData) return;
    if (!playerData.submitted) return;

    mappedRows.push({
      player_id: prediction.player_id,
      player_name: playerData.name,
      group_id: prediction.group_id,
      group_name: groupData.name,
      first_team_id: prediction.first_team_id,
      second_team_id: prediction.second_team_id,
      third_team_id: prediction.third_team_id,
      fourth_team_id: prediction.fourth_team_id,
    });
  });

  return mappedRows.sort(
    (a, b) => getGroupOrderIndex(a.group_name) - getGroupOrderIndex(b.group_name)
  );
}