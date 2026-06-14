import type { Team } from "@/types/quiniela";

export function getTeamNameFromGroups(
  teamsByGroup: Record<string, Team[]>,
  teamId: string | null | undefined
) {
  if (!teamId) return "-";

  const allTeams = Object.values(teamsByGroup).flat();
  const team = allTeams.find((item) => item.id === teamId);

  if (!team) return "-";

  return `${team.flag_emoji || ""} ${team.name}`;
}