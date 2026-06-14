import type { PositionBreakdown } from "@/types/quiniela";

export function calculateGroupBreakdown(
  prediction: Record<number, string | null | undefined>,
  result: Record<number, string | null | undefined>
) {
  let totalPoints = 0;

  const positions = [1, 2, 3, 4];

  const breakdown: PositionBreakdown[] = positions.map((position) => {
    const predictedTeamId = prediction[position] || null;
    const realTeamId = result[position] || null;

    let points = 0;
    let reason: PositionBreakdown["reason"] = "wrong";

    if (predictedTeamId && realTeamId && predictedTeamId === realTeamId) {
      points = 3;
      reason = "exact";
    } else if (
      position === 1 &&
      predictedTeamId &&
      predictedTeamId === result[2]
    ) {
      points = 1;
      reason = "top2_inverted";
    } else if (
      position === 2 &&
      predictedTeamId &&
      predictedTeamId === result[1]
    ) {
      points = 1;
      reason = "top2_inverted";
    }

    totalPoints += points;

    return {
      position,
      predicted_team_id: predictedTeamId,
      real_team_id: realTeamId,
      points,
      reason,
    };
  });

  return {
    totalPoints,
    breakdown,
  };
}