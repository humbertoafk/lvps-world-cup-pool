type SavedSession = {
  playerId: string;
  playerName: string;
  isAdmin: boolean;
};

export function getSavedSession(): SavedSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const playerId = localStorage.getItem("playerId");
  const playerName = localStorage.getItem("playerName");
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!playerId || !playerName) {
    return null;
  }

  return {
    playerId,
    playerName,
    isAdmin,
  };
}

export function saveSession(session: SavedSession) {
  localStorage.setItem("playerId", session.playerId);
  localStorage.setItem("playerName", session.playerName);
  localStorage.setItem("isAdmin", String(session.isAdmin));
}

export function saveIsAdmin(isAdmin: boolean) {
  localStorage.setItem("isAdmin", String(isAdmin));
}

export function clearSession() {
  localStorage.removeItem("playerId");
  localStorage.removeItem("playerName");
  localStorage.removeItem("isAdmin");
}