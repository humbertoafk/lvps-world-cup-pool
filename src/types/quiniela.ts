export type Player = {
  id: string;
  name: string;
  pin_hash: string | null;
  submitted: boolean;
  submitted_at: string | null;
  is_admin: boolean;
};

export type Group = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  group_id: string;
  flag_emoji: string | null;
};

export type Predictions = Record<string, Record<number, string>>;

export type GroupResults = Record<string, Record<number, string>>;

export type PositionBreakdown = {
  position: number;
  predicted_team_id: string | null;
  real_team_id: string | null;
  points: number;
  reason: "exact" | "top2_inverted" | "wrong";
};

export type RankingDetail = {
  group_id: string;
  group_name: string;
  points: number;
  status: "calculated" | "pending_result";
  positions: PositionBreakdown[];
};

export type RankingRow = {
  player_id: string;
  player_name: string;
  total_points: number;
  submitted: boolean;
  details: RankingDetail[];
};

export type SubmittedPredictionRow = {
  player_id: string;
  player_name: string;
  group_id: string;
  group_name: string;
  first_team_id: string | null;
  second_team_id: string | null;
  third_team_id: string | null;
  fourth_team_id: string | null;
};