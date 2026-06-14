export const GROUP_POSITIONS = [1, 2, 3, 4] as const;

export type GroupPosition = (typeof GROUP_POSITIONS)[number];