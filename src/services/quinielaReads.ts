import { supabase } from "@/lib/supabase";
import type { Group, Player, Team } from "@/types/quiniela";
import { getGroupOrderIndex } from "@/utils/groups";
import {
  groupTeamsByGroup,
  mapGroupResults,
  mapSavedPredictions,
  mapSubmittedPredictions,
} from "@/utils/supabaseMappers";

export async function fetchPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("id,name,pin_hash,submitted,submitted_at,is_admin")
    .order("name");

  if (error) {
    throw error;
  }

  return (data || []) as Player[];
}

export async function fetchQuinielaOpen() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("id", "quiniela_open")
    .single();

  if (error) {
    throw error;
  }

  return Boolean(data.value);
}

export async function fetchGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("name");

  if (error) {
    throw error;
  }

  return ((data || []) as Group[]).sort(
    (a, b) => getGroupOrderIndex(a.name) - getGroupOrderIndex(b.name)
  );
}

export async function fetchTeamsByGroup() {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  if (error) {
    throw error;
  }

  return groupTeamsByGroup((data || []) as Team[]);
}

export async function fetchGroupResults() {
  const { data, error } = await supabase.from("group_results").select("*");

  if (error) {
    throw error;
  }

  return mapGroupResults(data);
}

export async function fetchSavedPredictions(playerId: string) {
  const { data, error } = await supabase
    .from("group_predictions")
    .select("*")
    .eq("player_id", playerId);

  if (error) {
    throw error;
  }

  return mapSavedPredictions(data);
}

export async function fetchPlayerStatus(playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("submitted,is_admin")
    .eq("id", playerId)
    .single();

  if (error) {
    throw error;
  }

  return {
    submitted: Boolean(data.submitted),
    is_admin: Boolean(data.is_admin),
  };
}

export async function fetchSubmittedPredictions() {
  const { data, error } = await supabase
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
      ),
      groups (
        name
      )
    `);

  if (error) {
    throw error;
  }

  return mapSubmittedPredictions(data);
}