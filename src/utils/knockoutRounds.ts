import type { KnockoutRoundId } from "@/types/knockout";

export const KNOCKOUT_ROUND_ORDER: KnockoutRoundId[] = [
  "round_of_32",
  "round_of_16",
  "quarterfinals",
  "semifinals",
  "third_place",
  "final",
];

export const KNOCKOUT_ROUND_POINTS: Record<KnockoutRoundId, number> = {
  round_of_32: 2,
  round_of_16: 3,
  quarterfinals: 5,
  semifinals: 7,
  third_place: 5,
  final: 10,
};

export function getKnockoutRoundOrderIndex(roundId: KnockoutRoundId) {
  const index = KNOCKOUT_ROUND_ORDER.indexOf(roundId);
  return index === -1 ? 999 : index;
}

export function getKnockoutRoundPoints(roundId: KnockoutRoundId) {
  return KNOCKOUT_ROUND_POINTS[roundId] || 0;
}