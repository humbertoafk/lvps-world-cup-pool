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
  is_admin: boolean;
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
type GroupResults = Record<string, Record<number, string>>;

type RankingRow = {
  player_id: string;
  player_name: string;
  total_points: number;
  submitted: boolean;
};

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
  const [groupResults, setGroupResults] = useState<GroupResults>({});
  const [ranking, setRanking] = useState<RankingRow[]>([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadPlayers();
    loadGroups();
    loadTeams();

    loadGroupResults().then((loadedResults) => {
      loadRanking(loadedResults);
    });
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("playerName");
    const savedPlayerId = localStorage.getItem("playerId");
    const savedIsAdmin = localStorage.getItem("isAdmin");

    if (savedUser && savedPlayerId) {
      setLoggedUser(savedUser);
      setLoggedPlayerId(savedPlayerId);
      setIsAdmin(savedIsAdmin === "true");

      loadSavedPredictions(savedPlayerId);
      loadPlayerStatus(savedPlayerId);
    }
  }, []);

  async function loadPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("id,name,pin_hash,submitted,submitted_at,is_admin")
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

  async function loadGroupResults() {
    const { data, error } = await supabase.from("group_results").select("*");

    if (error) {
      console.error(error);
      setMessage("Error al cargar resultados oficiales");
      return {};
    }

    const saved: GroupResults = {};

    data?.forEach((result) => {
      saved[result.group_id] = {
        1: result.first_team_id,
        2: result.second_team_id,
        3: result.third_team_id,
        4: result.fourth_team_id,
      };
    });

    setGroupResults(saved);
    return saved;
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
      .select("submitted,is_admin")
      .eq("id", playerId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setIsSubmitted(data.submitted);
    setIsAdmin(data.is_admin);
    localStorage.setItem("isAdmin", String(data.is_admin));
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

  function updateGroupResult(groupId: string, position: number, teamId: string) {
    setGroupResults((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [position]: teamId,
      },
    }));
  }

  function calculateGroupPoints(
    prediction: Record<number, string | null | undefined>,
    result: Record<number, string | null | undefined>
  ) {
    let points = 0;

    const predictedFirst = prediction[1];
    const predictedSecond = prediction[2];

    const realFirst = result[1];
    const realSecond = result[2];

    if (!predictedFirst || !predictedSecond || !realFirst || !realSecond) {
      return 0;
    }

    if (predictedFirst === realFirst) {
      points += 3;
    } else if (predictedFirst === realSecond) {
      points += 1;
    }

    if (predictedSecond === realSecond) {
      points += 3;
    } else if (predictedSecond === realFirst) {
      points += 1;
    }

    return points;
  }

  async function loadRanking(resultsOverride?: GroupResults) {
    const resultsToUse = resultsOverride || groupResults;

    const { data: predictionsData, error: predictionsError } = await supabase
      .from("group_predictions")
      .select(`
        player_id,
        group_id,
        first_team_id,
        second_team_id,
        players (
          name,
          submitted
        )
      `);

    if (predictionsError) {
      console.error(predictionsError);
      setMessage("Error al cargar ranking");
      return;
    }

    const pointsByPlayer: Record<string, RankingRow> = {};

    predictionsData?.forEach((prediction) => {
      const result = resultsToUse[prediction.group_id];

      if (!result) return;

      const playerData = Array.isArray(prediction.players)
        ? prediction.players[0]
        : prediction.players;

      if (!playerData) return;
      if (!playerData.submitted) return;

      const groupPrediction = {
        1: prediction.first_team_id,
        2: prediction.second_team_id,
      };

      const points = calculateGroupPoints(groupPrediction, result);

      if (!pointsByPlayer[prediction.player_id]) {
        pointsByPlayer[prediction.player_id] = {
          player_id: prediction.player_id,
          player_name: playerData.name,
          total_points: 0,
          submitted: playerData.submitted,
        };
      }

      pointsByPlayer[prediction.player_id].total_points += points;
    });

    const rankingRows = Object.values(pointsByPlayer).sort(
      (a, b) => b.total_points - a.total_points
    );

    setRanking(rankingRows);
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
    localStorage.setItem("isAdmin", String(player.is_admin));

    setLoggedUser(player.name);
    setLoggedPlayerId(player.id);
    setIsSubmitted(player.submitted);
    setIsAdmin(player.is_admin);

    await loadSavedPredictions(player.id);

    setPin("");
    setMessage("");
  }

  function logout() {
    localStorage.removeItem("playerId");
    localStorage.removeItem("playerName");
    localStorage.removeItem("isAdmin");

    setLoggedUser(null);
    setLoggedPlayerId(null);
    setPlayer(null);
    setSelectedPlayer("");
    setPin("");
    setConfirmPin("");
    setMessage("");
    setPredictions({});
    setIsSubmitted(false);
    setIsAdmin(false);
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

  async function saveGroupResult(groupId: string) {
    if (!isAdmin) {
      setMessage("No tienes permisos de administrador");
      return;
    }

    const result = groupResults[groupId];

    if (!result) {
      setMessage("Completa las 4 posiciones del resultado oficial");
      return;
    }

    const first = result[1];
    const second = result[2];
    const third = result[3];
    const fourth = result[4];

    if (!first || !second || !third || !fourth) {
      setMessage("Completa las 4 posiciones del resultado oficial");
      return;
    }

    const selectedTeams = [first, second, third, fourth];
    const uniqueTeams = new Set(selectedTeams);

    if (uniqueTeams.size !== 4) {
      setMessage("No puedes repetir equipos en el resultado oficial");
      return;
    }

    const updatedResults: GroupResults = {
      ...groupResults,
      [groupId]: {
        1: first,
        2: second,
        3: third,
        4: fourth,
      },
    };

    const { error } = await supabase.from("group_results").upsert(
      {
        group_id: groupId,
        first_team_id: first,
        second_team_id: second,
        third_team_id: third,
        fourth_team_id: fourth,
        saved_at: new Date().toISOString(),
      },
      {
        onConflict: "group_id",
      }
    );

    if (error) {
      console.error(error);
      setMessage("Error al guardar resultado oficial");
      return;
    }

    setGroupResults(updatedResults);
    await loadRanking(updatedResults);

    setMessage("Resultado oficial guardado correctamente");
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

    await loadRanking(groupResults);

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

          {isAdmin && (
            <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 p-4">
              <h2 className="mb-3 font-bold">Panel de administrador</h2>

              <p className="mb-4 text-sm text-gray-700">
                Captura aquí los resultados oficiales de cada grupo.
              </p>

              <button
                onClick={() => loadRanking()}
                className="mb-4 w-full rounded bg-black p-2 text-sm text-white"
              >
                Actualizar ranking
              </button>

              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="rounded border bg-white p-3">
                    <h3 className="mb-2 font-semibold">{group.name}</h3>

                    {[1, 2, 3, 4].map((position) => (
                      <select
                        key={position}
                        className="mb-2 w-full rounded border p-2"
                        value={groupResults[group.id]?.[position] || ""}
                        onChange={(e) =>
                          updateGroupResult(
                            group.id,
                            position,
                            e.target.value
                          )
                        }
                      >
                        <option value="">Resultado posición {position}</option>

                        {(teamsByGroup[group.id] || []).map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.flag_emoji} {team.name}
                          </option>
                        ))}
                      </select>
                    ))}

                    <button
                      onClick={() => saveGroupResult(group.id)}
                      className="mt-2 w-full rounded bg-yellow-500 p-2 text-black"
                    >
                      Guardar resultado oficial
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
                    <span className="text-gray-500">⏳ Pendiente</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Ranking</h2>

              <button
                onClick={() => loadRanking()}
                className="rounded border px-3 py-1 text-xs"
              >
                Actualizar
              </button>
            </div>

            {ranking.length === 0 ? (
              <p className="text-sm text-gray-500">
                Todavía no hay puntos calculados.
              </p>
            ) : (
              <div className="space-y-2">
                {ranking.map((row, index) => (
                  <div
                    key={row.player_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {index + 1}. {row.player_name}
                    </span>

                    <span className="font-semibold">
                      {row.total_points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
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