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
import { validatePinCreation } from "@/utils/pin";
import { validateGroupSelection } from "@/utils/groupValidation";
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
import {
  clearSession,
  getSavedSession,
  saveIsAdmin,
  saveSession,
} from "@/utils/session";
import {
  groupTeamsByGroup,
  mapGroupResults,
  mapSavedPredictions,
  mapSubmittedPredictions,
} from "@/utils/supabaseMappers";
import {
  fetchGroupResults,
  fetchGroups,
  fetchPlayerStatus,
  fetchPlayers,
  fetchQuinielaOpen,
  fetchSavedPredictions,
  fetchSubmittedPredictions,
  fetchTeamsByGroup,
} from "@/services/quinielaReads";
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
    const savedSession = getSavedSession();

    if (savedSession) {
      setLoggedUser(savedSession.playerName);
      setLoggedPlayerId(savedSession.playerId);
      setIsAdmin(savedSession.isAdmin);

      loadSavedPredictions(savedSession.playerId);

      loadPlayerStatus(savedSession.playerId).then((status) => {
        if (status?.submitted) {
          loadSubmittedPredictions();
        }
      });
    }
  }, []);

  async function loadPlayers() {
    try {
      const loadedPlayers = await fetchPlayers();
      setPlayers(loadedPlayers);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar jugadores");
    }
  }

  async function refreshPlayers() {
    await loadPlayers();
  }

  async function loadAppSettings() {
    try {
      const quinielaOpen = await fetchQuinielaOpen();
      setIsQuinielaOpen(quinielaOpen);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar configuración de quiniela");
    }
  }

  async function loadGroups(): Promise<Group[]> {
    try {
      const loadedGroups = await fetchGroups();
      setGroups(loadedGroups);
      return loadedGroups;
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar grupos");
      return [];
    }
  }

  async function loadTeams() {
    try {
      const groupedTeams = await fetchTeamsByGroup();
      setTeamsByGroup(groupedTeams);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar equipos");
    }
  }

  async function loadGroupResults(): Promise<GroupResults> {
    try {
      const savedResults = await fetchGroupResults();
      setGroupResults(savedResults);
      return savedResults;
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar resultados oficiales");
      return {};
    }
  }

  async function loadSavedPredictions(playerId: string) {
    try {
      const savedPredictions = await fetchSavedPredictions(playerId);
      setPredictions(savedPredictions);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar tus pronósticos");
    }
  }

  async function loadPlayerStatus(
    playerId: string
  ): Promise<{ submitted: boolean; is_admin: boolean } | null> {
    try {
      const status = await fetchPlayerStatus(playerId);

      setIsSubmitted(status.submitted);
      setIsAdmin(status.is_admin);
      saveIsAdmin(status.is_admin);

      return status;
    } catch (error) {
      console.error(error);
      return null;
    }
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
    try {
      const submittedRows = await fetchSubmittedPredictions();
      setSubmittedPredictions(submittedRows);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar pronósticos enviados");
    }
  }

  async function createPin() {
    if (!player) return;

    const pinError = validatePinCreation(pin, confirmPin);

    if (pinError) {
      setMessage(pinError);
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

    saveSession({
      playerId: player.id,
      playerName: player.name,
      isAdmin: player.is_admin,
    });

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
    clearSession();

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

    const validatedGroup = validateGroupSelection({
      selection: predictions[groupId],
      incompleteMessage: "Completa las 4 posiciones del grupo",
      duplicateMessage: "No puedes repetir equipos en el mismo grupo",
    });

    if (validatedGroup.error || !validatedGroup.values) {
      setMessage(validatedGroup.error || "Revisa tus selecciones");
      return;
    }

    const { first, second, third, fourth } = validatedGroup.values;

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

    const validatedResult = validateGroupSelection({
      selection: groupResults[groupId],
      incompleteMessage: "Completa las 4 posiciones del resultado oficial",
      duplicateMessage: "No puedes repetir equipos en el resultado oficial",
    });

    if (validatedResult.error || !validatedResult.values) {
      setMessage(validatedResult.error || "Revisa el resultado oficial");
      return;
    }

    const { first, second, third, fourth } = validatedResult.values;

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
      const validatedGroup = validateGroupSelection({
        selection: predictions[group.id],
        incompleteMessage: `Completa las 4 posiciones de ${group.name}`,
        duplicateMessage: `No puedes repetir equipos en ${group.name}`,
      });

      if (validatedGroup.error) {
        setMessage(validatedGroup.error);
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