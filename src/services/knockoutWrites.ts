import { supabase } from "@/lib/supabase";
import type { KnockoutRoundStatus } from "@/types/knockout";

type SaveKnockoutMatchParams = {
  roundId: string;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
};

type SaveKnockoutPredictionParams = {
  playerId: string;
  matchId: string;
  predictedWinnerTeamId: string;
  submitted: boolean;
  submittedAt: string | null;
};

export async function saveKnockoutMatch({
  roundId,
  matchNumber,
  teamAId,
  teamBId,
}: SaveKnockoutMatchParams) {
  const { error } = await supabase.from("knockout_matches").upsert(
    {
      round_id: roundId,
      match_number: matchNumber,
      team_a_id: teamAId,
      team_b_id: teamBId,
    },
    {
      onConflict: "round_id,match_number",
    }
  );

  if (error) {
    throw error;
  }
}

export async function saveKnockoutPrediction({
  playerId,
  matchId,
  predictedWinnerTeamId,
  submitted,
  submittedAt,
}: SaveKnockoutPredictionParams) {
  const { error } = await supabase.from("knockout_predictions").upsert(
    {
      player_id: playerId,
      match_id: matchId,
      predicted_winner_team_id: predictedWinnerTeamId,
      submitted,
      submitted_at: submittedAt,
    },
    {
      onConflict: "player_id,match_id",
    }
  );

  if (error) {
    throw error;
  }
}

export async function saveKnockoutWinner(
  matchId: string,
  winnerTeamId: string
) {
  const { error } = await supabase
    .from("knockout_matches")
    .update({
      winner_team_id: winnerTeamId,
      played: true,
    })
    .eq("id", matchId);

  if (error) {
    throw error;
  }
}

export async function updateKnockoutRoundStatus(
  roundId: string,
  status: KnockoutRoundStatus
) {
  const payload: Record<string, string | null> = {
    status,
  };

  if (status === "open") {
    payload.opened_at = new Date().toISOString();
  }

  if (status === "closed") {
    payload.closed_at = new Date().toISOString();
  }

  if (status === "completed" || status === "archived") {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("knockout_rounds")
    .update(payload)
    .eq("id", roundId);

  if (error) {
    throw error;
  }
}

export async function unlockKnockoutPredictionsByPlayerAndRound(
  playerId: string,
  roundId: string
) {
  const { data: matches, error: matchesError } = await supabase
    .from("knockout_matches")
    .select("id")
    .eq("round_id", roundId);

  if (matchesError) {
    throw matchesError;
  }

  const matchIds = (matches || []).map((match) => match.id);

  if (matchIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("knockout_predictions")
    .update({
      submitted: false,
      submitted_at: null,
    })
    .eq("player_id", playerId)
    .in("match_id", matchIds);

  if (error) {
    throw error;
  }
}