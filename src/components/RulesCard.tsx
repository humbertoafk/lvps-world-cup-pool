import { ui } from "@/styles/ui";

export function RulesCard() {
  return (
    <div className={ui.card}>
      <h2 className="mb-2 font-bold">Reglas de puntuación</h2>

      <div className="space-y-1 text-sm text-neutral-300">
        <p>+3 pts por cada posición exacta del grupo.</p>
        <p>
          +1 pt si aciertas un clasificado al Top 2, pero en posición invertida.
        </p>
        <p className="font-semibold text-neutral-100">
          Máximo por grupo: 12 pts.
        </p>
      </div>
    </div>
  );
}