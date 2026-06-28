import { supabase } from "@/lib/supabase";
import type {
  KnockoutMatch,
  KnockoutPrediction,
  KnockoutRound,
} from "@/types/knockout";

export async function fetchKnockoutRounds() {
  const { data, error } = await supabase
    .from("knockout_rounds")
    .select("*")
    .order("sort_order");

  if (error) {
    throw error;
  }

  return (data || []) as KnockoutRound[];
}

export async function fetchActiveKnockoutRound() {
  const { data, error } = await supabase
    .from("knockout_rounds")
    .select("*")
    .in("status", ["open", "closed", "completed"])
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as KnockoutRound | null;
}

export async function fetchKnockoutMatchesByRound(roundId: string) {
  const { data, error } = await supabase
    .from("knockout_matches")
    .select("*")
    .eq("round_id", roundId)
    .order("match_number");

  if (error) {
    throw error;
  }

  return (data || []) as KnockoutMatch[];
}

export async function fetchKnockoutPredictionsByPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("knockout_predictions")
    .select("*")
    .eq("player_id", playerId);

  if (error) {
    throw error;
  }

  return (data || []) as KnockoutPrediction[];
}

export async function fetchKnockoutPredictionsByRound(roundId: string) {
  const { data, error } = await supabase
    .from("knockout_predictions")
    .select(`
      id,
      player_id,
      match_id,
      predicted_winner_team_id,
      submitted,
      submitted_at,
      created_at,
      knockout_matches!inner (
        round_id
      )
    `)
    .eq("knockout_matches.round_id", roundId);

  if (error) {
    throw error;
  }

  return (data || []) as unknown as KnockoutPrediction[];
}

export async function fetchAllKnockoutMatches() {
  const { data, error } = await supabase
    .from("knockout_matches")
    .select("*")
    .order("round_id")
    .order("match_number");

  if (error) {
    throw error;
  }

  return (data || []) as KnockoutMatch[];
}

export async function fetchAllKnockoutPredictions() {
  const { data, error } = await supabase
    .from("knockout_predictions")
    .select("*")
    .order("submitted_at");

  if (error) {
    throw error;
  }

  return (data || []) as KnockoutPrediction[];
}