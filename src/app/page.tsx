"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { MessagesArea } from "@/components/MessagesArea";
import { RankingSection } from "@/components/RankingSection";
import { ResultsSection } from "@/components/ResultsSection";
import { SubmittedPredictionsSection } from "@/components/SubmittedPredictionsSection";
import { RulesCard } from "@/components/RulesCard";
import { StatusSection } from "@/components/StatusSection";
import { ui } from "@/styles/ui";
import type { SectionId } from "@/types/sections";
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

type PositionBreakdown = {
  position: number;
  predicted_team_id: string | null;
  real_team_id: string | null;
  points: number;
  reason: "exact" | "top2_inverted" | "wrong";
};

type RankingDetail = {
  group_id: string;
  group_name: string;
  points: number;
  status: "calculated" | "pending_result";
  positions: PositionBreakdown[];
};

type RankingRow = {
  player_id: string;
  player_name: string;
  total_points: number;
  submitted: boolean;
  details: RankingDetail[];
};

type SubmittedPredictionRow = {
  player_id: string;
  player_name: string;
  group_id: string;
  group_name: string;
  first_team_id: string | null;
  second_team_id: string | null;
  third_team_id: string | null;
  fourth_team_id: string | null;
};

const GROUP_ORDER = [
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

function getGroupOrderIndex(groupName: string) {
  const index = GROUP_ORDER.indexOf(groupName);
  return index === -1 ? 999 : index;
}

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
  const [submittedPredictions, setSubmittedPredictions] = useState<
    SubmittedPredictionRow[]
  >([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isQuinielaOpen, setIsQuinielaOpen] = useState(true);
  const [adminSelectedPlayerId, setAdminSelectedPlayerId] = useState("");
  const [activeSection, setActiveSection] = useState<SectionId>("resumen");

  useEffect(() => {
    loadPlayers();
    loadTeams();
    loadAppSettings();

    Promise.all([loadGroups(), loadGroupResults()]).then(
      ([loadedGroups, loadedResults]) => {
        loadRanking(loadedResults, loadedGroups);
      }
    );
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

      loadPlayerStatus(savedPlayerId).then((status) => {
        if (status?.submitted) {
          loadSubmittedPredictions();
        }
      });
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

  async function loadAppSettings() {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("id", "quiniela_open")
      .single();

    if (error) {
      console.error(error);
      setMessage("Error al cargar configuración de quiniela");
      return;
    }

    setIsQuinielaOpen(data.value);
  }

  async function loadGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setMessage("Error al cargar grupos");
      return [];
    }

    const loadedGroups = (data || []).sort(
      (a, b) => getGroupOrderIndex(a.name) - getGroupOrderIndex(b.name)
    );

    setGroups(loadedGroups);
    return loadedGroups;
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

  async function loadGroupResults(): Promise<GroupResults> {
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

  async function loadPlayerStatus(
    playerId: string
  ): Promise<{ submitted: boolean; is_admin: boolean } | null> {
    const { data, error } = await supabase
      .from("players")
      .select("submitted,is_admin")
      .eq("id", playerId)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    setIsSubmitted(data.submitted);
    setIsAdmin(data.is_admin);
    localStorage.setItem("isAdmin", String(data.is_admin));

    return {
      submitted: data.submitted,
      is_admin: data.is_admin,
    };
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

  function getTeamName(teamId: string | null | undefined) {
    if (!teamId) return "-";

    const allTeams = Object.values(teamsByGroup).flat();
    const team = allTeams.find((item) => item.id === teamId);

    if (!team) return "-";

    return `${team.flag_emoji || ""} ${team.name}`;
  }

  function hasCompleteGroupResult(groupId: string) {
    const result = groupResults[groupId];

    if (!result) return false;

    return Boolean(result[1] && result[2] && result[3] && result[4]);
  }

  function calculateGroupBreakdown(
    prediction: Record<number, string | null | undefined>,
    result: Record<number, string | null | undefined>
  ) {
    let totalPoints = 0;

    const positions = [1, 2, 3, 4];

    const breakdown: PositionBreakdown[] = positions.map((position) => {
      const predictedTeamId = prediction[position] || null;
      const realTeamId = result[position] || null;

      let points = 0;
      let reason: PositionBreakdown["reason"] = "wrong";

      if (predictedTeamId && realTeamId && predictedTeamId === realTeamId) {
        points = 3;
        reason = "exact";
      } else if (
        position === 1 &&
        predictedTeamId &&
        predictedTeamId === result[2]
      ) {
        points = 1;
        reason = "top2_inverted";
      } else if (
        position === 2 &&
        predictedTeamId &&
        predictedTeamId === result[1]
      ) {
        points = 1;
        reason = "top2_inverted";
      }

      totalPoints += points;

      return {
        position,
        predicted_team_id: predictedTeamId,
        real_team_id: realTeamId,
        points,
        reason,
      };
    });

    return {
      totalPoints,
      breakdown,
    };
  }

  async function loadRanking(
    resultsOverride?: GroupResults,
    groupsOverride?: Group[]
  ) {
    const resultsToUse = resultsOverride || groupResults;
    const groupsToUse = groupsOverride || groups;

    const { data: predictionsData, error: predictionsError } = await supabase
      .from("group_predictions")
      .select(`
        player_id,
        group_id,
        first_team_id,
        second_team_id,
        third_team_id,
        fourth_team_id,
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
      const playerData = Array.isArray(prediction.players)
        ? prediction.players[0]
        : prediction.players;

      if (!playerData) return;
      if (!playerData.submitted) return;

      const groupName =
        groupsToUse.find((group) => group.id === prediction.group_id)?.name ||
        "Grupo";

      if (!pointsByPlayer[prediction.player_id]) {
        pointsByPlayer[prediction.player_id] = {
          player_id: prediction.player_id,
          player_name: playerData.name,
          total_points: 0,
          submitted: playerData.submitted,
          details: [],
        };
      }

      const result = resultsToUse[prediction.group_id];

      if (!result || !result[1] || !result[2] || !result[3] || !result[4]) {
        pointsByPlayer[prediction.player_id].details.push({
          group_id: prediction.group_id,
          group_name: groupName,
          points: 0,
          status: "pending_result",
          positions: [],
        });

        return;
      }

      const groupPrediction = {
        1: prediction.first_team_id,
        2: prediction.second_team_id,
        3: prediction.third_team_id,
        4: prediction.fourth_team_id,
      };

      const calculated = calculateGroupBreakdown(groupPrediction, result);

      pointsByPlayer[prediction.player_id].total_points +=
        calculated.totalPoints;

      pointsByPlayer[prediction.player_id].details.push({
        group_id: prediction.group_id,
        group_name: groupName,
        points: calculated.totalPoints,
        status: "calculated",
        positions: calculated.breakdown,
      });
    });

    const rankingRows = Object.values(pointsByPlayer)
      .map((row) => ({
        ...row,
        details: row.details.sort(
          (a, b) =>
            getGroupOrderIndex(a.group_name) - getGroupOrderIndex(b.group_name)
        ),
      }))
      .sort((a, b) => b.total_points - a.total_points);

    setRanking(rankingRows);
  }

  async function loadSubmittedPredictions() {
    const { data, error } = await supabase
      .from("group_predictions")
      .select(`
        player_id,
        group_id,
        first_team_id,
        second_team_id,
        third_team_id,
        fourth_team_id,
        players (
          name,
          submitted
        ),
        groups (
          name
        )
      `);

    if (error) {
      console.error(error);
      setMessage("Error al cargar pronósticos enviados");
      return;
    }

    const rows: SubmittedPredictionRow[] = [];

    data?.forEach((prediction) => {
      const playerData = Array.isArray(prediction.players)
        ? prediction.players[0]
        : prediction.players;

      const groupData = Array.isArray(prediction.groups)
        ? prediction.groups[0]
        : prediction.groups;

      if (!playerData || !groupData) return;
      if (!playerData.submitted) return;

      rows.push({
        player_id: prediction.player_id,
        player_name: playerData.name,
        group_id: prediction.group_id,
        group_name: groupData.name,
        first_team_id: prediction.first_team_id,
        second_team_id: prediction.second_team_id,
        third_team_id: prediction.third_team_id,
        fourth_team_id: prediction.fourth_team_id,
      });
    });

    const orderedRows = rows.sort(
      (a, b) => getGroupOrderIndex(a.group_name) - getGroupOrderIndex(b.group_name)
    );

    setSubmittedPredictions(orderedRows);
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
    setActiveSection("resumen");

    await loadSavedPredictions(player.id);

    if (player.submitted) {
      await loadSubmittedPredictions();
    }

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
    setSubmittedPredictions([]);
    setIsSubmitted(false);
    setIsAdmin(false);
    setActiveSection("resumen");
  }

  async function saveGroupPrediction(groupId: string) {
    if (!loggedPlayerId) {
      setMessage("No hay jugador iniciado");
      return;
    }

    if (!isQuinielaOpen) {
      setMessage("La quiniela ya está cerrada");
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
    await loadRanking(updatedResults, groups);

    setMessage("Resultado oficial guardado correctamente");
  }

  async function toggleQuinielaOpen() {
    if (!isAdmin) {
      setMessage("No tienes permisos de administrador");
      return;
    }

    const nextValue = !isQuinielaOpen;

    const confirmed = window.confirm(
      nextValue
        ? "¿Seguro que quieres abrir la quiniela otra vez?"
        : "¿Seguro que quieres cerrar la quiniela? Nadie podrá guardar ni enviar picks."
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("app_settings")
      .update({
        value: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "quiniela_open");

    if (error) {
      console.error(error);
      setMessage("Error al actualizar estado de quiniela");
      return;
    }

    setIsQuinielaOpen(nextValue);

    setMessage(
      nextValue
        ? "Quiniela abierta correctamente"
        : "Quiniela cerrada correctamente"
    );
  }

  async function unlockPlayerSubmission() {
    if (!isAdmin) {
      setMessage("No tienes permisos de administrador");
      return;
    }

    if (!adminSelectedPlayerId) {
      setMessage("Selecciona un jugador para desbloquear");
      return;
    }

    const selectedPlayerToUnlock = players.find(
      (p) => p.id === adminSelectedPlayerId
    );

    const confirmed = window.confirm(
      `¿Seguro que quieres desbloquear la quiniela de ${
        selectedPlayerToUnlock?.name || "este jugador"
      }? Sus picks se conservarán, pero podrá modificarlos otra vez.`
    );

    if (!confirmed) {
      return;
    }

    const { error: playerError } = await supabase
      .from("players")
      .update({
        submitted: false,
        submitted_at: null,
      })
      .eq("id", adminSelectedPlayerId);

    if (playerError) {
      console.error(playerError);
      setMessage("Error al desbloquear jugador");
      return;
    }

    const { error: predictionsError } = await supabase
      .from("group_predictions")
      .update({
        submitted: false,
        submitted_at: null,
      })
      .eq("player_id", adminSelectedPlayerId);

    if (predictionsError) {
      console.error(predictionsError);
      setMessage("Error al desbloquear pronósticos del jugador");
      return;
    }

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === adminSelectedPlayerId
          ? {
              ...p,
              submitted: false,
              submitted_at: null,
            }
          : p
      )
    );

    if (loggedPlayerId === adminSelectedPlayerId) {
      setIsSubmitted(false);
    }

    await loadSubmittedPredictions();
    await loadRanking(groupResults, groups);

    setMessage(
      `Quiniela de ${
        selectedPlayerToUnlock?.name || "jugador"
      } desbloqueada correctamente`
    );

    setAdminSelectedPlayerId("");
  }

  async function submitFinalPredictions() {
    if (!loggedPlayerId) {
      setMessage("No hay jugador iniciado");
      return;
    }

    if (!isQuinielaOpen) {
      setMessage("La quiniela ya está cerrada");
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

    const confirmed = window.confirm(
      "¿Seguro que quieres enviar tu quiniela final? Después ya no podrás modificarla."
    );

    if (!confirmed) {
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

    await loadRanking(groupResults, groups);
    await loadSubmittedPredictions();

    setMessage("Quiniela enviada correctamente. Ya no puedes modificarla.");
  }

  if (loggedUser) {
    return (
      <main className={ui.page}>
        <div className={ui.container}>
          <AppHeader loggedUser={loggedUser} onLogout={logout} />

          <MessagesArea
            message={message}
            isSubmitted={isSubmitted}
            isQuinielaOpen={isQuinielaOpen}
          />

          <RulesCard />

          {isAdmin && activeSection === "admin" && (
            <div className={ui.adminCard}>
              <h2 className="mb-3 font-bold">Panel de administrador</h2>

              <p className="mb-4 text-sm text-gray-700">
                Captura aquí los resultados oficiales de cada grupo.
              </p>

              <button
                onClick={toggleQuinielaOpen}
                className={`mb-4 w-full rounded p-2 text-sm font-semibold ${
                  isQuinielaOpen
                    ? "bg-red-600 text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {isQuinielaOpen ? "Cerrar quiniela" : "Abrir quiniela"}
              </button>

              <div className={ui.innerCardSpaced}>
                <h3 className="mb-2 font-semibold">Desbloquear jugador</h3>

                <p className="mb-3 text-xs text-gray-600">
                  Esto conserva sus picks, pero permite que el jugador vuelva a
                  editarlos.
                </p>

                <select
                  value={adminSelectedPlayerId}
                  onChange={(e) => setAdminSelectedPlayerId(e.target.value)}
                  className="mb-2 w-full rounded border p-2 text-sm"
                >
                  <option value="">Selecciona jugador</option>

                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.submitted ? "(enviado)" : "(pendiente)"}
                    </option>
                  ))}
                </select>

                <button
                  onClick={unlockPlayerSubmission}
                  className="w-full rounded bg-orange-500 p-2 text-sm font-semibold text-white"
                >
                  Desbloquear jugador
                </button>
              </div>

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
                        className={ui.smallSelect}
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

          {activeSection === "resumen" && (
            <StatusSection players={players} onRefresh={refreshPlayers} />
          )}

          {activeSection === "ranking" && (
            <RankingSection
              ranking={ranking}
              onRefresh={() => loadRanking()}
              getTeamName={getTeamName}
            />
          )}

          {activeSection === "resultados" && (
            <ResultsSection
              groups={groups}
              groupResults={groupResults}
              onRefresh={async () => {
                const loadedResults = await loadGroupResults();
                await loadRanking(loadedResults, groups);
              }}
              hasCompleteGroupResult={hasCompleteGroupResult}
              getTeamName={getTeamName}
            />
          )}

          {activeSection === "pronosticos" && (
            <SubmittedPredictionsSection
              isSubmitted={isSubmitted}
              players={players}
              submittedPredictions={submittedPredictions}
              onRefresh={loadSubmittedPredictions}
              getTeamName={getTeamName}
            />
          )}

          {groups.length === 0 && (
            <p className="text-sm text-gray-600">No hay grupos cargados.</p>
          )}

          {activeSection === "miQuiniela" && (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.id} className={ui.cardPlain}>
                  <h2 className="mb-3 font-bold">{group.name}</h2>

                  {(teamsByGroup[group.id] || []).length === 0 && (
                    <p className="mb-3 text-sm text-red-600">
                      Este grupo no tiene equipos cargados.
                    </p>
                  )}

                  {[1, 2, 3, 4].map((position) => (
                    <select
                      key={position}
                      disabled={isSubmitted || !isQuinielaOpen}
                      className={ui.smallSelect}
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
                    disabled={isSubmitted || !isQuinielaOpen}
                    onClick={() => saveGroupPrediction(group.id)}
                    className={ui.buttonGreen}
                  >
                    Guardar grupo
                  </button>
                </div>
              ))}

              <div className={ui.cardPlain}>
                {isSubmitted ? (
                  <p className="font-semibold text-green-700">
                    Quiniela enviada. Tus picks están bloqueados.
                  </p>
                ) : (
                  <button
                    disabled={!isQuinielaOpen}
                    onClick={submitFinalPredictions}
                    className={ui.buttonSubmit}
                  >
                    Enviar quiniela final
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <BottomNavigation
          activeSection={activeSection}
          isAdmin={isAdmin}
          onSectionChange={(section) => setActiveSection(section)}
        />
      </main>
    );
  }

  return (
    <main className={ui.loginPage}>
      <div className={ui.container}>
        <h1 className={ui.loginTitle}>🏆 LVP&apos;S</h1>

        <select
          className={ui.select}
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
          className={`mt-4 ${ui.buttonPrimary}`}
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
                  className={ui.input}
                />

                <button
                  onClick={login}
                  className={ui.buttonBlue}
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