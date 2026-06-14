"use client";

import { ui } from "@/styles/ui";
import type { Player } from "@/types/quiniela";

type LoginCardProps = {
  players: Player[];
  selectedPlayer: string;
  player: Player | null;
  pin: string;
  confirmPin: string;
  message: string;
  onSelectedPlayerChange: (playerId: string) => void;
  onPlayerChange: (player: Player | null) => void;
  onPinChange: (pin: string) => void;
  onConfirmPinChange: (pin: string) => void;
  onMessageChange: (message: string) => void;
  onLogin: () => void | Promise<void>;
  onCreatePin: () => void | Promise<void>;
};

export function LoginCard({
  players,
  selectedPlayer,
  player,
  pin,
  confirmPin,
  message,
  onSelectedPlayerChange,
  onPlayerChange,
  onPinChange,
  onConfirmPinChange,
  onMessageChange,
  onLogin,
  onCreatePin,
}: LoginCardProps) {
  return (
    <div className={ui.container}>
      <h1 className={ui.loginTitle}>🏆 LVP&apos;S</h1>

      <select
        className={ui.select}
        value={selectedPlayer}
        onChange={(event) => {
          onSelectedPlayerChange(event.target.value);
          onPlayerChange(null);
          onPinChange("");
          onConfirmPinChange("");
          onMessageChange("");
        }}
      >
        <option value="">Selecciona tu nombre</option>

        {players.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <button
        className={`mt-4 ${ui.buttonPrimary}`}
        onClick={() => {
          const selected = players.find((item) => item.id === selectedPlayer);

          if (!selected) {
            onMessageChange("Selecciona un jugador");
            return;
          }

          onPlayerChange(selected);
          onPinChange("");
          onConfirmPinChange("");
          onMessageChange("");
        }}
      >
        Continuar
      </button>

      {player && (
        <div className={`mt-6 ${ui.cardPlain}`}>
          <p className="mb-3 font-semibold">{player.name}</p>

          {player.pin_hash ? (
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Ingresa tu PIN"
                value={pin}
                onChange={(event) => onPinChange(event.target.value)}
                className={ui.input}
              />

              <button onClick={onLogin} className={ui.buttonBlue}>
                Entrar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                placeholder="PIN de 4 dígitos"
                value={pin}
                onChange={(event) => onPinChange(event.target.value)}
                className={ui.input}
              />

              <input
                type="password"
                placeholder="Confirmar PIN"
                value={confirmPin}
                onChange={(event) => onConfirmPinChange(event.target.value)}
                className={ui.input}
              />

              <button
                onClick={onCreatePin}
                className="w-full rounded bg-green-600 p-3 text-white"
              >
                Crear PIN
              </button>
            </div>
          )}

          {message && <p className="mt-3 text-sm text-neutral-300">{message}</p>}
        </div>
      )}
    </div>
  );
}