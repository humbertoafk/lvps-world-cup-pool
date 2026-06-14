import { supabase } from "@/lib/supabase";
import type { Group, GroupResults, RankingRow } from "@/types/quiniela";
import { getGroupOrderIndex } from "@/utils/groups";
import { calculateGroupBreakdown } from "@/utils/scoring";

type RankingPredictionRow = {
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
};

function getSingleRelation<T>(value: T | T[] | null | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value;
}

export async function fetchRankingRows(
  resultsToUse: GroupResults,
  groupsToUse: Group[]
) {
  const { data: predictionsData, error: predictionsError } = await supabase
    .from("group_predictions")
    .select(`
      player_id,
      group_id,
      first_team_id,
      second_team_id,
      third_team_id,
      fourth_team_id,
      players (
        name,
        submitted
      )
    `);

  if (predictionsError) {
    throw predictionsError;
  }

  const pointsByPlayer: Record<string, RankingRow> = {};
  const typedPredictions = (predictionsData || []) as RankingPredictionRow[];

  typedPredictions.forEach((prediction) => {
    const playerData = getSingleRelation(prediction.players);

    if (!playerData) return;
    if (!playerData.submitted) return;

    const groupName =
      groupsToUse.find((group) => group.id === prediction.group_id)?.name ||
      "Grupo";

    if (!pointsByPlayer[prediction.player_id]) {
      pointsByPlayer[prediction.player_id] = {
        player_id: prediction.player_id,
        player_name: playerData.name,
        total_points: 0,
        submitted: playerData.submitted,
        details: [],
      };
    }

    const result = resultsToUse[prediction.group_id];

    if (!result || !result[1] || !result[2] || !result[3] || !result[4]) {
      pointsByPlayer[prediction.player_id].details.push({
        group_id: prediction.group_id,
        group_name: groupName,
        points: 0,
        status: "pending_result",
        positions: [],
      });

      return;
    }

    const groupPrediction = {
      1: prediction.first_team_id,
      2: prediction.second_team_id,
      3: prediction.third_team_id,
      4: prediction.fourth_team_id,
    };

    const calculated = calculateGroupBreakdown(groupPrediction, result);

    pointsByPlayer[prediction.player_id].total_points += calculated.totalPoints;

    pointsByPlayer[prediction.player_id].details.push({
      group_id: prediction.group_id,
      group_name: groupName,
      points: calculated.totalPoints,
      status: "calculated",
      positions: calculated.breakdown,
    });
  });

  return Object.values(pointsByPlayer)
    .map((row) => ({
      ...row,
      details: row.details.sort(
        (a, b) =>
          getGroupOrderIndex(a.group_name) - getGroupOrderIndex(b.group_name)
      ),
    }))
    .sort((a, b) => b.total_points - a.total_points);
}