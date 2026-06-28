import type { KnockoutRoundStatus } from "@/types/knockout";

export function getKnockoutStatusLabel(status: KnockoutRoundStatus) {
  const labels: Record<KnockoutRoundStatus, string> = {
    locked: "Bloqueada",
    open: "Abierta",
    closed: "Cerrada",
    completed: "Completada",
    archived: "Archivada",
  };

  return labels[status] || status;
}