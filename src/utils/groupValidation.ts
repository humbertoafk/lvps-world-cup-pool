import { GROUP_POSITIONS } from "@/constants/groupPositions";

type GroupSelection = Record<number, string | null | undefined>;

type ValidateGroupSelectionParams = {
  selection: GroupSelection | undefined;
  incompleteMessage: string;
  duplicateMessage: string;
};

export function validateGroupSelection({
  selection,
  incompleteMessage,
  duplicateMessage,
}: ValidateGroupSelectionParams) {
  if (!selection) {
    return {
      error: incompleteMessage,
      values: null,
    };
  }

  const values = GROUP_POSITIONS.map((position) => selection[position]);

  const hasEmptyValue = values.some((value) => !value);

  if (hasEmptyValue) {
    return {
      error: incompleteMessage,
      values: null,
    };
  }

  const teamIds = values as string[];
  const uniqueTeams = new Set(teamIds);

  if (uniqueTeams.size !== GROUP_POSITIONS.length) {
    return {
      error: duplicateMessage,
      values: null,
    };
  }

  return {
    error: null,
    values: {
      first: teamIds[0],
      second: teamIds[1],
      third: teamIds[2],
      fourth: teamIds[3],
    },
  };
}