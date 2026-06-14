"use client";

import { ui } from "@/styles/ui";

type AppHeaderProps = {
  loggedUser: string;
  onLogout: () => void;
};

export function AppHeader({ loggedUser, onLogout }: AppHeaderProps) {
  return (
    <div className={ui.appHeader}>
      <div>
        <h1 className={ui.title}>🏆 LVP&apos;S</h1>
        <p className={ui.subtitle}>Bienvenido {loggedUser}</p>
      </div>

      <button onClick={onLogout} className={ui.buttonLogout}>
        Salir
      </button>
    </div>
  );
}