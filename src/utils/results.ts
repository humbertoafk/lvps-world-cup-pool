import type { GroupResults } from "@/types/quiniela";

export function hasCompleteGroupResult(
  groupResults: GroupResults,
  groupId: string
) {
  const result = groupResults[groupId];

  if (!result) return false;

  return Boolean(result[1] && result[2] && result[3] && result[4]);
}