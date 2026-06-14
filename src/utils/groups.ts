export const GROUP_ORDER = [
  "Grupo A",
  "Grupo B",
  "Grupo C",
  "Grupo D",
  "Grupo E",
  "Grupo F",
  "Grupo G",
  "Grupo H",
  "Grupo I",
  "Grupo J",
  "Grupo K",
  "Grupo L",
];

export function getGroupOrderIndex(groupName: string) {
  const index = GROUP_ORDER.indexOf(groupName);
  return index === -1 ? 999 : index;
}