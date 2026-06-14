"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminPanel } from "@/components/AdminPanel";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { LoginCard } from "@/components/LoginCard";
import { MessagesArea } from "@/components/MessagesArea";
import { MyQuinielaSection } from "@/components/MyQuinielaSection";
import { RankingSection } from "@/components/RankingSection";
import { ResultsSection } from "@/components/ResultsSection";
import { SubmittedPredictionsSection } from "@/components/SubmittedPredictionsSection";
import { RulesCard } from "@/components/RulesCard";
import { StatusSection } from "@/components/StatusSection";
import { getGroupOrderIndex } from "@/utils/groups";
import { calculateGroupBreakdown } from "@/utils/scoring";
import { hasCompleteGroupResult as checkCompleteGroupResult } from "@/utils/results";
import { getTeamNameFromGroups } from "@/utils/teams";
import { ui } from "@/styles/ui";
import type {
  Group,
  GroupResults,
  Player,
  Predictions,
  RankingRow,
  SubmittedPredictionRow,
  Team,
} from "@/types/quiniela";
import type { SectionId } from "@/types/sections";
import bcrypt from "bcryptjs";

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
    return getTeamNameFromGroups(teamsByGroup, teamId);
  }

  function hasCompleteGroupResult(groupId: string) {
    return checkCompleteGroupResult(groupResults, groupId);
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
            <AdminPanel
              players={players}
              groups={groups}
              teamsByGroup={teamsByGroup}
              groupResults={groupResults}
              isQuinielaOpen={isQuinielaOpen}
              adminSelectedPlayerId={adminSelectedPlayerId}
              onAdminSelectedPlayerChange={setAdminSelectedPlayerId}
              onToggleQuinielaOpen={toggleQuinielaOpen}
              onUnlockPlayerSubmission={unlockPlayerSubmission}
              onRefreshRanking={() => loadRanking()}
              onUpdateGroupResult={updateGroupResult}
              onSaveGroupResult={saveGroupResult}
            />
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

          {activeSection === "miQuiniela" && (
            <MyQuinielaSection
              groups={groups}
              teamsByGroup={teamsByGroup}
              predictions={predictions}
              isSubmitted={isSubmitted}
              isQuinielaOpen={isQuinielaOpen}
              onUpdatePrediction={updatePrediction}
              onSaveGroupPrediction={saveGroupPrediction}
              onSubmitFinalPredictions={submitFinalPredictions}
            />
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
      <LoginCard
        players={players}
        selectedPlayer={selectedPlayer}
        player={player}
        pin={pin}
        confirmPin={confirmPin}
        message={message}
        onSelectedPlayerChange={setSelectedPlayer}
        onPlayerChange={setPlayer}
        onPinChange={setPin}
        onConfirmPinChange={setConfirmPin}
        onMessageChange={setMessage}
        onLogin={login}
        onCreatePin={createPin}
      />
    </main>
  );
}