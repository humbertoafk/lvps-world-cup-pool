import { supabase } from "@/lib/supabase";

type GroupSelectionValues = {
  first: string;
  second: string;
  third: string;
  fourth: string;
};

type SaveGroupPredictionParams = {
  playerId: string;
  groupId: string;
  values: GroupSelectionValues;
  submitted: boolean;
  submittedAt: string | null;
};

export async function updatePlayerPinHash(playerId: string, pinHash: string) {
  const { error } = await supabase
    .from("players")
    .update({ pin_hash: pinHash })
    .eq("id", playerId);

  if (error) {
    throw error;
  }
}

export async function saveGroupPredictionRow({
  playerId,
  groupId,
  values,
  submitted,
  submittedAt,
}: SaveGroupPredictionParams) {
  const { error } = await supabase.from("group_predictions").upsert(
    {
      player_id: playerId,
      group_id: groupId,
      first_team_id: values.first,
      second_team_id: values.second,
      third_team_id: values.third,
      fourth_team_id: values.fourth,
      submitted,
      submitted_at: submittedAt,
    },
    {
      onConflict: "player_id,group_id",
    }
  );

  if (error) {
    throw error;
  }
}

export async function saveGroupResultRow(
  groupId: string,
  values: GroupSelectionValues
) {
  const { error } = await supabase.from("group_results").upsert(
    {
      group_id: groupId,
      first_team_id: values.first,
      second_team_id: values.second,
      third_team_id: values.third,
      fourth_team_id: values.fourth,
      saved_at: new Date().toISOString(),
    },
    {
      onConflict: "group_id",
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateQuinielaOpenValue(value: boolean) {
  const { error } = await supabase
    .from("app_settings")
    .update({
      value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "quiniela_open");

  if (error) {
    throw error;
  }
}

export async function unlockPlayerRows(playerId: string) {
  const { error: playerError } = await supabase
    .from("players")
    .update({
      submitted: false,
      submitted_at: null,
    })
    .eq("id", playerId);

  if (playerError) {
    throw playerError;
  }

  const { error: predictionsError } = await supabase
    .from("group_predictions")
    .update({
      submitted: false,
      submitted_at: null,
    })
    .eq("player_id", playerId);

  if (predictionsError) {
    throw predictionsError;
  }
}

export async function markPlayerSubmitted(
  playerId: string,
  submittedAt: string
) {
  const { error } = await supabase
    .from("players")
    .update({
      submitted: true,
      submitted_at: submittedAt,
    })
    .eq("id", playerId);

  if (error) {
    throw error;
  }
}