"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

type Player = {
  id: string;
  name: string;
  pin_hash: string | null;
  submitted: boolean;
  submitted_at: string | null;
};

type Group = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  group_id: string;
  flag_emoji: string | null;
};

type Predictions = Record<string, Record<number, string>>;

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");

  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const [loggedPlayerId, setLoggedPlayerId] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [teamsByGroup, setTeamsByGroup] = useState<Record<string, Team[]>>({});
  const [predictions, setPredictions] = useState<Predictions>({});

  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadPlayers();
    loadGroups();
    loadTeams();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("playerName");
    const savedPlayerId = localStorage.getItem("playerId");

    if (savedUser && savedPlayerId) {
      setLoggedUser(savedUser);
      setLoggedPlayerId(savedPlayerId);
      loadSavedPredictions(savedPlayerId);
      loadPlayerStatus(savedPlayerId);
    }
  }, []);

  async function loadPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("id,name,pin_hash,submitted,submitted_at")
      .order("name");

    if (error) {
      console.error(error);
      setMessage("Error al cargar jugadores");
      return;
    }

    setPlayers(data || []);
  }

  async function refreshPlayers() {
  await loadPlayers();
  }

  async function loadGroups() {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setMessage("Error al cargar grupos");
      return;
    }

    setGroups(data || []);
  }

  async function loadTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setMessage("Error al cargar equipos");
      return;
    }

    const grouped: Record<string, Team[]> = {};

    data?.forEach((team: Team) => {
      if (!grouped[team.group_id]) {
        grouped[team.group_id] = [];
      }

      grouped[team.group_id].push(team);
    });

    setTeamsByGroup(grouped);
  }

  async function loadSavedPredictions(playerId: string) {
    const { data, error } = await supabase
      .from("group_predictions")
      .select("*")
      .eq("player_id", playerId);

    if (error) {
      console.error(error);
      setMessage("Error al cargar tus pronósticos");
      return;
    }

    const saved: Predictions = {};

    data?.forEach((prediction) => {
      saved[prediction.group_id] = {
        1: prediction.first_team_id,
        2: prediction.second_team_id,
        3: prediction.third_team_id,
        4: prediction.fourth_team_id,
      };
    });

    setPredictions(saved);
  }

  async function loadPlayerStatus(playerId: string) {
    const { data, error } = await supabase
      .from("players")
      .select("submitted")
      .eq("id", playerId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setIsSubmitted(data.submitted);
  }

  function updatePrediction(groupId: string, position: number, teamId: string) {
    setPredictions((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [position]: teamId,
      },
    }));
  }

  async function createPin() {
    if (!player) return;

    if (!/^\d{4}$/.test(pin)) {
      setMessage("El PIN debe tener exactamente 4 dígitos");
      return;
    }

    if (pin !== confirmPin) {
      setMessage("Los PIN no coinciden");
      return;
    }

    const hash = await bcrypt.hash(pin, 10);

    const { error } = await supabase
      .from("players")
      .update({ pin_hash: hash })
      .eq("id", player.id);

    if (error) {
      console.error(error);
      setMessage("Error al guardar PIN");
      return;
    }

    const updatedPlayer = {
      ...player,
      pin_hash: hash,
    };

    setPlayer(updatedPlayer);

    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? updatedPlayer : p))
    );

    setPin("");
    setConfirmPin("");
    setMessage("PIN creado correctamente. Ahora inicia sesión.");
  }

  async function login() {
    if (!player) return;

    const isValid = await bcrypt.compare(pin, player.pin_hash || "");

    if (!isValid) {
      setMessage("PIN incorrecto");
      return;
    }

    localStorage.setItem("playerId", player.id);
    localStorage.setItem("playerName", player.name);

    setLoggedUser(player.name);
    setLoggedPlayerId(player.id);
    setIsSubmitted(player.submitted);

    await loadSavedPredictions(player.id);

    setPin("");
    setMessage("");
  }

  function logout() {
    localStorage.removeItem("playerId");
    localStorage.removeItem("playerName");

    setLoggedUser(null);
    setLoggedPlayerId(null);
    setPlayer(null);
    setSelectedPlayer("");
    setPin("");
    setConfirmPin("");
    setMessage("");
    setPredictions({});
    setIsSubmitted(false);
  }

  async function saveGroupPrediction(groupId: string) {
    if (!loggedPlayerId) {
      setMessage("No hay jugador iniciado");
      return;
    }

    if (isSubmitted) {
      setMessage("Tu quiniela ya fue enviada y está bloqueada");
      return;
    }

    const groupPrediction = predictions[groupId];

    if (!groupPrediction) {
      setMessage("Completa las 4 posiciones del grupo");
      return;
    }

    const first = groupPrediction[1];
    const second = groupPrediction[2];
    const third = groupPrediction[3];
    const fourth = groupPrediction[4];

    if (!first || !second || !third || !fourth) {
      setMessage("Completa las 4 posiciones del grupo");
      return;
    }

    const selectedTeams = [first, second, third, fourth];
    const uniqueTeams = new Set(selectedTeams);

    if (uniqueTeams.size !== 4) {
      setMessage("No puedes repetir equipos en el mismo grupo");
      return;
    }

    const { error } = await supabase.from("group_predictions").upsert(
      {
        player_id: loggedPlayerId,
        group_id: groupId,
        first_team_id: first,
        second_team_id: second,
        third_team_id: third,
        fourth_team_id: fourth,
        submitted: false,
        submitted_at: null,
      },
      {
        onConflict: "player_id,group_id",
      }
    );

    if (error) {
      console.error(error);
      setMessage("Error al guardar el grupo");
      return;
    }

    setMessage("Grupo guardado correctamente");
  }

  async function submitFinalPredictions() {
    if (!loggedPlayerId) {
      setMessage("No hay jugador iniciado");
      return;
    }

    if (isSubmitted) {
      setMessage("Tu quiniela ya fue enviada y está bloqueada");
      return;
    }

    if (groups.length === 0) {
      setMessage("No hay grupos cargados");
      return;
    }

    for (const group of groups) {
      const groupPrediction = predictions[group.id];

      if (!groupPrediction) {
        setMessage(`Completa ${group.name}`);
        return;
      }

      const first = groupPrediction[1];
      const second = groupPrediction[2];
      const third = groupPrediction[3];
      const fourth = groupPrediction[4];

      if (!first || !second || !third || !fourth) {
        setMessage(`Completa las 4 posiciones de ${group.name}`);
        return;
      }

      const selectedTeams = [first, second, third, fourth];
      const uniqueTeams = new Set(selectedTeams);

      if (uniqueTeams.size !== 4) {
        setMessage(`No puedes repetir equipos en ${group.name}`);
        return;
      }
    }

    const now = new Date().toISOString();

    for (const group of groups) {
      const groupPrediction = predictions[group.id];

      const { error } = await supabase.from("group_predictions").upsert(
        {
          player_id: loggedPlayerId,
          group_id: group.id,
          first_team_id: groupPrediction[1],
          second_team_id: groupPrediction[2],
          third_team_id: groupPrediction[3],
          fourth_team_id: groupPrediction[4],
          submitted: true,
          submitted_at: now,
        },
        {
          onConflict: "player_id,group_id",
        }
      );

      if (error) {
        console.error(error);
        setMessage("Error al guardar tu quiniela final");
        return;
      }
    }

    const { error: playerError } = await supabase
      .from("players")
      .update({
        submitted: true,
        submitted_at: now,
      })
      .eq("id", loggedPlayerId);

    if (playerError) {
      console.error(playerError);
      setMessage("Error al bloquear tu quiniela");
      return;
    }

    setIsSubmitted(true);

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === loggedPlayerId
          ? {
              ...p,
              submitted: true,
              submitted_at: now,
            }
          : p
      )
    );

    setMessage("Quiniela enviada correctamente. Ya no puedes modificarla.");
  }

  if (loggedUser) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-md p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🏆 LVP&apos;S</h1>
              <p className="text-sm text-gray-600">Bienvenido {loggedUser}</p>
            </div>

            <button
              onClick={logout}
              className="rounded border px-3 py-2 text-sm"
            >
              Salir
            </button>
          </div>

          {message && (
            <p className="mb-4 rounded border p-3 text-sm">{message}</p>
          )}

          {isSubmitted && (
            <p className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm font-semibold text-green-700">
              Quiniela enviada. Tus picks están bloqueados.
            </p>
          )}

          <div className="mb-6 rounded border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Estado de entregas</h2>
                  
              <button
                onClick={refreshPlayers}
                className="rounded border px-3 py-1 text-xs"
              >
                Actualizar
              </button>
            </div>
                  
            <div className="space-y-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{p.name}</span>
              
                  {p.submitted ? (
                    <span className="font-semibold text-green-700">
                      ✅ Enviado
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      ⏳ Pendiente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {groups.length === 0 && (
            <p className="text-sm text-gray-600">No hay grupos cargados.</p>
          )}

          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.id} className="rounded border p-4">
                <h2 className="mb-3 font-bold">{group.name}</h2>

                {(teamsByGroup[group.id] || []).length === 0 && (
                  <p className="mb-3 text-sm text-red-600">
                    Este grupo no tiene equipos cargados.
                  </p>
                )}

                {[1, 2, 3, 4].map((position) => (
                  <select
                    key={position}
                    disabled={isSubmitted}
                    className="mb-2 w-full rounded border p-2 disabled:bg-gray-100"
                    value={predictions[group.id]?.[position] || ""}
                    onChange={(e) =>
                      updatePrediction(group.id, position, e.target.value)
                    }
                  >
                    <option value="">Posición {position}</option>

                    {(teamsByGroup[group.id] || []).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.flag_emoji} {team.name}
                      </option>
                    ))}
                  </select>
                ))}

                <button
                  disabled={isSubmitted}
                  onClick={() => saveGroupPrediction(group.id)}
                  className="mt-2 w-full rounded bg-green-600 p-2 text-white disabled:bg-gray-400"
                >
                  Guardar grupo
                </button>
              </div>
            ))}

            <div className="rounded border p-4">
              {isSubmitted ? (
                <p className="font-semibold text-green-700">
                  Quiniela enviada. Tus picks están bloqueados.
                </p>
              ) : (
                <button
                  onClick={submitFinalPredictions}
                  className="w-full rounded bg-black p-3 text-white"
                >
                  Enviar quiniela final
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-6">
        <h1 className="mb-6 text-3xl font-bold">🏆 LVP&apos;S</h1>

        <select
          className="w-full rounded border p-3"
          value={selectedPlayer}
          onChange={(e) => {
            setSelectedPlayer(e.target.value);
            setPlayer(null);
            setPin("");
            setConfirmPin("");
            setMessage("");
          }}
        >
          <option value="">Selecciona tu nombre</option>

          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          className="mt-4 w-full rounded bg-black p-3 text-white"
          onClick={() => {
            const selected = players.find((p) => p.id === selectedPlayer);

            if (!selected) {
              setMessage("Selecciona un jugador");
              return;
            }

            setPlayer(selected);
            setPin("");
            setConfirmPin("");
            setMessage("");
          }}
        >
          Continuar
        </button>

        {player && (
          <div className="mt-6 rounded border p-4">
            <p className="mb-3 font-semibold">{player.name}</p>

            {player.pin_hash ? (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Ingresa tu PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded border p-3"
                />

                <button
                  onClick={login}
                  className="w-full rounded bg-blue-600 p-3 text-white"
                >
                  Entrar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="PIN de 4 dígitos"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded border p-3"
                />

                <input
                  type="password"
                  placeholder="Confirmar PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full rounded border p-3"
                />

                <button
                  onClick={createPin}
                  className="w-full rounded bg-green-600 p-3 text-white"
                >
                  Crear PIN
                </button>
              </div>
            )}

            {message && <p className="mt-3 text-sm">{message}</p>}
          </div>
        )}
      </div>
    </main>
  );
}