"use client";

import { useEffect, useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CurrentPhaseSection } from "@/components/CurrentPhaseSection";
import { DashboardSection } from "@/components/DashboardSection";
import { LoginCard } from "@/components/LoginCard";
import { MessagesArea } from "@/components/MessagesArea";
import { PhaseHistorySection } from "@/components/PhaseHistorySection";
import { RankingSection } from "@/components/RankingSection";
import { ResultsSection } from "@/components/ResultsSection";
import { RulesCard } from "@/components/RulesCard";
import { KnockoutAdminPanel } from "@/components/KnockoutAdminPanel";
import { SubmittedPredictionsSection } from "@/components/SubmittedPredictionsSection";
import { fetchKnockoutPredictionsByPlayer } from "@/services/knockoutReads";
import { KnockoutRankingSection } from "@/components/KnockoutRankingSection";
import { fetchKnockoutRankingRows } from "@/services/knockoutRankingService";
import {
  saveKnockoutMatch,
  saveKnockoutPrediction,
  saveKnockoutWinner,
} from "@/services/knockoutWrites";
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
import {
  markPlayerSubmitted,
  saveGroupPredictionRow,
  saveGroupResultRow,
  unlockPlayerRows,
  updatePlayerPinHash,
  updateQuinielaOpenValue,
} from "@/services/quinielaWrites";
import { fetchRankingRows } from "@/services/rankingService";
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
import { validateGroupSelection } from "@/utils/groupValidation";
import { validatePinCreation } from "@/utils/pin";
import { hasCompleteGroupResult as checkCompleteGroupResult } from "@/utils/results";
import {
  clearSession,
  getSavedSession,
  saveIsAdmin,
  saveSession,
} from "@/utils/session";
import { getTeamNameFromGroups } from "@/utils/teams";
import type {
  KnockoutMatch,
  KnockoutPredictionMap,
  KnockoutRankingRow,
  KnockoutRound,
} from "@/types/knockout";
import {
  fetchActiveKnockoutRound,
  fetchKnockoutMatchesByRound,
} from "@/services/knockoutReads";
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

  const [activeKnockoutRound, setActiveKnockoutRound] =
  useState<KnockoutRound | null>(null);

  const [activeKnockoutMatches, setActiveKnockoutMatches] = useState<
    KnockoutMatch[]
  >([]);

  const [knockoutMatchNumber, setKnockoutMatchNumber] = useState("");
  const [knockoutTeamAId, setKnockoutTeamAId] = useState("");
  const [knockoutTeamBId, setKnockoutTeamBId] = useState("");
  const [knockoutWinnersByMatch, setKnockoutWinnersByMatch] = useState<
    Record<string, string>
  >({});

  const [knockoutPredictions, setKnockoutPredictions] =
    useState<KnockoutPredictionMap>({});

  const [hasSubmittedKnockoutRound, setHasSubmittedKnockoutRound] =
    useState(false);

  const [knockoutRanking, setKnockoutRanking] = useState<KnockoutRankingRow[]>(
    []
  );

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isQuinielaOpen, setIsQuinielaOpen] = useState(true);
  const [adminSelectedPlayerId, setAdminSelectedPlayerId] = useState("");
  const [activeSection, setActiveSection] = useState<SectionId>("inicio");

  useEffect(() => {
    loadPlayers();
    loadTeams();
    loadAppSettings();
    loadActiveKnockoutData();
    loadKnockoutRanking();

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
      loadActiveKnockoutData(savedSession.playerId);

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

  async function loadRanking(
    resultsOverride?: GroupResults,
    groupsOverride?: Group[]
  ) {
    const resultsToUse = resultsOverride || groupResults;
    const groupsToUse = groupsOverride || groups;

    try {
      const rankingRows = await fetchRankingRows(resultsToUse, groupsToUse);
      setRanking(rankingRows);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar ranking");
    }
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

  async function loadActiveKnockoutData(playerIdOverride?: string) {
    try {
      const activeRound = await fetchActiveKnockoutRound();

      setActiveKnockoutRound(activeRound);

      if (!activeRound) {
        setActiveKnockoutMatches([]);
        setKnockoutPredictions({});
        setHasSubmittedKnockoutRound(false);
        return;
      }

      const matches = await fetchKnockoutMatchesByRound(activeRound.id);
      setActiveKnockoutMatches(matches);

      const playerIdToUse = playerIdOverride || loggedPlayerId;

      if (!playerIdToUse) {
        setKnockoutPredictions({});
        setHasSubmittedKnockoutRound(false);
        return;
      }

      const savedPredictions = await fetchKnockoutPredictionsByPlayer(
        playerIdToUse
      );

      const matchIds = new Set(matches.map((match) => match.id));
      const currentRoundPredictions = savedPredictions.filter((prediction) =>
        matchIds.has(prediction.match_id)
      );

      const mappedPredictions: KnockoutPredictionMap = {};

      currentRoundPredictions.forEach((prediction) => {
        mappedPredictions[prediction.match_id] =
          prediction.predicted_winner_team_id;
      });

      setKnockoutPredictions(mappedPredictions);
      setHasSubmittedKnockoutRound(
        currentRoundPredictions.some((prediction) => prediction.submitted)
      );
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar la ronda activa");
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

  async function createPin() {
    if (!player) return;

    const pinError = validatePinCreation(pin, confirmPin);

    if (pinError) {
      setMessage(pinError);
      return;
    }

    const hash = await bcrypt.hash(pin, 10);

    try {
      await updatePlayerPinHash(player.id, hash);
    } catch (error) {
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
    setActiveSection("inicio");

    await loadSavedPredictions(player.id);
    await loadActiveKnockoutData(player.id);

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
    setActiveSection("inicio");
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

    try {
      await saveGroupPredictionRow({
        playerId: loggedPlayerId,
        groupId,
        values: {
          first,
          second,
          third,
          fourth,
        },
        submitted: false,
        submittedAt: null,
      });
    } catch (error) {
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

    try {
      await saveGroupResultRow(groupId, {
        first,
        second,
        third,
        fourth,
      });
    } catch (error) {
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

    try {
      await updateQuinielaOpenValue(nextValue);
    } catch (error) {
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

    try {
      await unlockPlayerRows(adminSelectedPlayerId);
    } catch (error) {
      console.error(error);
      setMessage("Error al desbloquear jugador");
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

      try {
        await saveGroupPredictionRow({
          playerId: loggedPlayerId,
          groupId: group.id,
          values: {
            first: groupPrediction[1],
            second: groupPrediction[2],
            third: groupPrediction[3],
            fourth: groupPrediction[4],
          },
          submitted: true,
          submittedAt: now,
        });
      } catch (error) {
        console.error(error);
        setMessage("Error al guardar tu quiniela final");
        return;
      }
    }

    try {
      await markPlayerSubmitted(loggedPlayerId, now);
    } catch (error) {
      console.error(error);
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

  async function handleSaveKnockoutMatch() {
    if (!isAdmin) {
      setMessage("No tienes permisos de administrador");
      return;
    }
  
    if (!activeKnockoutRound) {
      setMessage("No hay ronda activa de eliminatoria");
      return;
    }
  
    if (!knockoutMatchNumber) {
      setMessage("Escribe el número de partido");
      return;
    }
  
    if (!knockoutTeamAId || !knockoutTeamBId) {
      setMessage("Selecciona los dos equipos del partido");
      return;
    }
  
    if (knockoutTeamAId === knockoutTeamBId) {
      setMessage("No puedes seleccionar el mismo equipo dos veces");
      return;
    }
  
    try {
      await saveKnockoutMatch({
        roundId: activeKnockoutRound.id,
        matchNumber: Number(knockoutMatchNumber),
        teamAId: knockoutTeamAId,
        teamBId: knockoutTeamBId,
      });
    } catch (error) {
      console.error(error);
      setMessage("Error al guardar partido de eliminatoria");
      return;
    }
  
    setKnockoutMatchNumber("");
    setKnockoutTeamAId("");
    setKnockoutTeamBId("");
  
    await loadActiveKnockoutData();
  
    setMessage("Partido de eliminatoria guardado correctamente");
  }

  function updateKnockoutPrediction(matchId: string, teamId: string) {
    setKnockoutPredictions((prev) => ({
      ...prev,
      [matchId]: teamId,
    }));
  }

  async function saveSingleKnockoutPrediction(matchId: string) {
    if (!loggedPlayerId) {
      setMessage("No hay jugador iniciado");
      return;
    }

    if (!activeKnockoutRound) {
      setMessage("No hay ronda activa");
      return;
    }

    if (activeKnockoutRound.status !== "open") {
      setMessage("La ronda no está abierta");
      return;
    }

    if (hasSubmittedKnockoutRound) {
      setMessage("Ya enviaste esta ronda y está bloqueada");
      return;
    }

    const predictedWinnerTeamId = knockoutPredictions[matchId];

    if (!predictedWinnerTeamId) {
      setMessage("Selecciona un ganador para este partido");
      return;
    }

    try {
      await saveKnockoutPrediction({
        playerId: loggedPlayerId,
        matchId,
        predictedWinnerTeamId,
        submitted: false,
        submittedAt: null,
      });
    } catch (error) {
      console.error(error);
      setMessage("Error al guardar pick de eliminatoria");
      return;
    }

    setMessage("Pick guardado correctamente");
  }

  async function submitKnockoutRoundPredictions() {
    if (!loggedPlayerId) {
      setMessage("No hay jugador iniciado");
      return;
    }

    if (!activeKnockoutRound) {
      setMessage("No hay ronda activa");
      return;
    }

    if (activeKnockoutRound.status !== "open") {
      setMessage("La ronda no está abierta");
      return;
    }

    if (hasSubmittedKnockoutRound) {
      setMessage("Ya enviaste esta ronda");
      return;
    }

    if (activeKnockoutMatches.length === 0) {
      setMessage("No hay partidos cargados para esta ronda");
      return;
    }

    const missingMatch = activeKnockoutMatches.find(
      (match) => !knockoutPredictions[match.id]
    );

    if (missingMatch) {
      setMessage(`Falta elegir ganador del partido ${missingMatch.match_number}`);
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres enviar tus picks de ${activeKnockoutRound.name}? Después ya no podrás modificarlos.`
    );

    if (!confirmed) {
      return;
    }

    const now = new Date().toISOString();

    for (const match of activeKnockoutMatches) {
      try {
        await saveKnockoutPrediction({
          playerId: loggedPlayerId,
          matchId: match.id,
          predictedWinnerTeamId: knockoutPredictions[match.id],
          submitted: true,
          submittedAt: now,
        });
      } catch (error) {
        console.error(error);
        setMessage("Error al enviar picks de eliminatoria");
        return;
      }
    }

    setHasSubmittedKnockoutRound(true);
    setMessage(`${activeKnockoutRound.name} enviada correctamente`);
  }

  function updateKnockoutWinner(matchId: string, teamId: string) {
    setKnockoutWinnersByMatch((prev) => ({
      ...prev,
      [matchId]: teamId,
    }));
  }

  async function handleSaveKnockoutWinner(matchId: string) {
    if (!isAdmin) {
      setMessage("No tienes permisos de administrador");
      return;
    }

    const match = activeKnockoutMatches.find((item) => item.id === matchId);

    if (!match) {
      setMessage("No se encontró el partido");
      return;
    }

    const winnerTeamId = knockoutWinnersByMatch[matchId] || match.winner_team_id;

    if (!winnerTeamId) {
      setMessage("Selecciona el ganador real del partido");
      return;
    }

    if (winnerTeamId !== match.team_a_id && winnerTeamId !== match.team_b_id) {
      setMessage("El ganador debe ser uno de los dos equipos del partido");
      return;
    }

    try {
      await saveKnockoutWinner(matchId, winnerTeamId);
    } catch (error) {
      console.error(error);
      setMessage("Error al guardar ganador de eliminatoria");
      return;
    }

    await loadActiveKnockoutData();
    await loadKnockoutRanking();

    setKnockoutWinnersByMatch((prev) => ({
      ...prev,
      [matchId]: winnerTeamId,
    }));

    setMessage("Ganador de eliminatoria guardado correctamente");
  }

  async function loadKnockoutRanking() {
    try {
      const rankingRows = await fetchKnockoutRankingRows();
      setKnockoutRanking(rankingRows);
    } catch (error) {
      console.error(error);
      setMessage("Error al cargar ranking de eliminatoria");
    }
  }

  if (loggedUser) {
    return (
      <main className={ui.page}>
        <div className={ui.container}>
          <AppHeader loggedUser={loggedUser} onLogout={logout} />

          <MessagesArea message={message} />

          <RulesCard />

          {activeSection === "inicio" && (
            <DashboardSection
              players={players}
              ranking={ranking}
              groups={groups}
              groupResults={groupResults}
              isQuinielaOpen={isQuinielaOpen}
              onGoToRanking={() => setActiveSection("ranking")}
              onGoToResults={() => setActiveSection("historial")}
            />
          )}

          {activeSection === "ranking" && (
            <div className="space-y-6">
              <div className={ui.card}>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Rankings separados
                </p>
          
                <h2 className="mt-1 text-2xl font-bold">Ranking</h2>
          
                <p className="mt-2 text-sm text-neutral-400">
                  La fase de grupos y la eliminatoria se calculan por separado. No hay
                  total combinado.
                </p>
              </div>
          
              <RankingSection
                ranking={ranking}
                onRefresh={() => loadRanking()}
                getTeamName={getTeamName}
              />
          
              <KnockoutRankingSection
                ranking={knockoutRanking}
                onRefresh={loadKnockoutRanking}
              />
            </div>
          )}

          {activeSection === "actual" && (
            <CurrentPhaseSection
              activeRound={activeKnockoutRound}
              matches={activeKnockoutMatches}
              predictions={knockoutPredictions}
              hasSubmittedRound={hasSubmittedKnockoutRound}
              onPredictionChange={updateKnockoutPrediction}
              onSavePrediction={saveSingleKnockoutPrediction}
              onSubmitRound={submitKnockoutRoundPredictions}
              onRefresh={() => loadActiveKnockoutData()}
              onGoToHistory={() => setActiveSection("historial")}
              getTeamName={getTeamName}
            />
          )}

          {activeSection === "historial" && (
            <PhaseHistorySection
              onGoToGroupRanking={() => setActiveSection("ranking")}
              onGoToGroupResults={() => setActiveSection("resultados")}
              onGoToGroupPicks={() => setActiveSection("picks")}
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

          {activeSection === "picks" && (
            <SubmittedPredictionsSection
              isSubmitted={isSubmitted}
              players={players}
              submittedPredictions={submittedPredictions}
              onRefresh={loadSubmittedPredictions}
              getTeamName={getTeamName}
            />
          )}

          {isAdmin && activeSection === "admin" && (
            <div className="space-y-6">
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

              <KnockoutAdminPanel
                activeRound={activeKnockoutRound}
                matches={activeKnockoutMatches}
                teamsByGroup={teamsByGroup}
                matchNumber={knockoutMatchNumber}
                teamAId={knockoutTeamAId}
                teamBId={knockoutTeamBId}
                winnersByMatch={knockoutWinnersByMatch}
                onMatchNumberChange={setKnockoutMatchNumber}
                onTeamAChange={setKnockoutTeamAId}
                onTeamBChange={setKnockoutTeamBId}
                onWinnerChange={updateKnockoutWinner}
                onSaveMatch={handleSaveKnockoutMatch}
                onSaveWinner={handleSaveKnockoutWinner}
                onRefresh={loadActiveKnockoutData}
                getTeamName={getTeamName}
              />
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