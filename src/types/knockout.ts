export type KnockoutRoundStatus =
  | "locked"
  | "open"
  | "closed"
  | "completed"
  | "archived";

export type KnockoutRoundId =
  | "round_of_32"
  | "round_of_16"
  | "quarterfinals"
  | "semifinals"
  | "third_place"
  | "final";

export type KnockoutRound = {
  id: KnockoutRoundId;
  name: string;
  status: KnockoutRoundStatus;
  sort_order: number;
  opened_at: string | null;
  closed_at: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export type KnockoutMatch = {
  id: string;
  round_id: KnockoutRoundId;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  winner_team_id: string | null;
  played: boolean;
  created_at: string | null;
};

export type KnockoutPrediction = {
  id: string;
  player_id: string;
  match_id: string;
  predicted_winner_team_id: string;
  submitted: boolean;
  submitted_at: string | null;
  created_at: string | null;
};

export type KnockoutMatchWithTeams = KnockoutMatch & {
  team_a_name: string;
  team_b_name: string;
  team_a_flag: string | null;
  team_b_flag: string | null;
};

export type KnockoutRankingDetail = {
  round_id: KnockoutRoundId;
  round_name: string;
  points: number;
};

export type KnockoutRankingRow = {
  player_id: string;
  player_name: string;
  total_points: number;
  details: KnockoutRankingDetail[];
};

export type KnockoutPredictionMap = Record<string, string>;