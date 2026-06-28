import { supabase } from "@/lib/supabase";
import type {
  KnockoutRankingRow,
  KnockoutRoundId,
} from "@/types/knockout";
import {
  getKnockoutRoundOrderIndex,
  getKnockoutRoundPoints,
} from "@/utils/knockoutRounds";

type KnockoutRankingPredictionRow = {
  player_id: string;
  predicted_winner_team_id: string;
  submitted: boolean;
  players:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  knockout_matches:
    | {
        round_id: KnockoutRoundId;
        winner_team_id: string | null;
        played: boolean;
        knockout_rounds:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
      }
    | {
        round_id: KnockoutRoundId;
        winner_team_id: string | null;
        played: boolean;
        knockout_rounds:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
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

export async function fetchKnockoutRankingRows() {
  const { data, error } = await supabase
    .from("knockout_predictions")
    .select(`
      player_id,
      predicted_winner_team_id,
      submitted,
      players (
        name
      ),
      knockout_matches (
        round_id,
        winner_team_id,
        played,
        knockout_rounds (
          name
        )
      )
    `);

  if (error) {
    throw error;
  }

  const typedRows = (data || []) as unknown as KnockoutRankingPredictionRow[];
  const pointsByPlayer: Record<string, KnockoutRankingRow> = {};

  typedRows.forEach((prediction) => {
    if (!prediction.submitted) return;

    const playerData = getSingleRelation(prediction.players);
    const matchData = getSingleRelation(prediction.knockout_matches);

    if (!playerData || !matchData) return;
    if (!matchData.played || !matchData.winner_team_id) return;

    const roundData = getSingleRelation(matchData.knockout_rounds);
    const roundName = roundData?.name || "Ronda";

    if (!pointsByPlayer[prediction.player_id]) {
      pointsByPlayer[prediction.player_id] = {
        player_id: prediction.player_id,
        player_name: playerData.name,
        total_points: 0,
        details: [],
      };
    }

    const points =
      prediction.predicted_winner_team_id === matchData.winner_team_id
        ? getKnockoutRoundPoints(matchData.round_id)
        : 0;

    pointsByPlayer[prediction.player_id].total_points += points;

    const existingRoundDetail = pointsByPlayer[
      prediction.player_id
    ].details.find((detail) => detail.round_id === matchData.round_id);

    if (existingRoundDetail) {
      existingRoundDetail.points += points;
    } else {
      pointsByPlayer[prediction.player_id].details.push({
        round_id: matchData.round_id,
        round_name: roundName,
        points,
      });
    }
  });

  return Object.values(pointsByPlayer)
    .map((row) => ({
      ...row,
      details: row.details.sort(
        (a, b) =>
          getKnockoutRoundOrderIndex(a.round_id) -
          getKnockoutRoundOrderIndex(b.round_id)
      ),
    }))
    .sort((a, b) => b.total_points - a.total_points);
}