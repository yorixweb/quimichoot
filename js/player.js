import { createStore } from "./store.js?v=6";
import { MoleculeEditor } from "./editor.js?v=6";
import { isSameMolecule, validateCarbonValence } from "./chemistry.js?v=6";
import { playerPlacement } from "./scoring.js?v=6";

const $ = (id) => document.getElementById(id);
const views = ["joinView", "waitingView", "playView", "playerResultsView"];
const store = await createStore();
let roomCode = localStorage.getItem("quimichoot-room") || "";
let playerId = sessionStorage.getItem("quimichoot-player-id") || "";
let currentRoom = null;
let unsubscribe = null;
let editor = null;
let timerId = null;
let submittedRound = null;
let editorRound = null;
let pendingCorrectRound = null;

$("pinInput").value = roomCode;
$("joinBtn").addEventListener("click", joinRoom);
$("checkBtn").addEventListener("click", checkMolecule);
$("resetBtn").addEventListener("click", () => {
  editor?.reset();
  $("feedback").textContent = "";
});

async function joinRoom() {
  const code = $("pinInput").value.trim();
  const name = $("nameInput").value.trim();
  $("joinError").textContent = "";
  if (!/^\d{6}$/.test(code)) {
    $("joinError").textContent = "Escribe un PIN de 6 dígitos.";
    return;
  }
  if (name.length < 2) {
    $("joinError").textContent = "Escribe el nombre del equipo.";
    return;
  }

  try {
    playerId = await store.joinRoom(code, name, playerId || null);
    roomCode = code;
    localStorage.setItem("quimichoot-room", roomCode);
    sessionStorage.setItem("quimichoot-player-id", playerId);
    watchRoom();
  } catch (error) {
    $("joinError").textContent = error.message;
  }
}

function watchRoom() {
  unsubscribe?.();
  unsubscribe = store.watchRoom(roomCode, (room) => {
    if (!room || !room.players?.[playerId]) {
      show("joinView");
      return;
    }
    currentRoom = room;
    render(room);
  });
}

if (roomCode && playerId) watchRoom();

function render(room) {
  const player = room.players[playerId];
  $("playerScore").textContent = `${player.score || 0} pts`;

  if (room.state === "lobby" || room.state === "countdown") {
    show("waitingView");
    $("waitingTitle").textContent = room.state === "countdown" ? "La ronda empieza ahora..." : "Esperando al profesor...";
    $("waitingRoom").textContent = `Sala ${room.code}`;
  }

  if (room.state === "round") {
    const alreadyCorrect = player.finished || pendingCorrectRound === room.currentRound;
    if (alreadyCorrect || hasRoundExpired(room)) {
      show("playerResultsView");
      renderPlayerResults(room);
      return;
    }
    show("playView");
    setupEditorForRound(room);
    updatePlayHeader(room);
  }

  if (room.state === "results" || room.state === "final") {
    show("playerResultsView");
    renderPlayerResults(room);
  }
}

function setupEditorForRound(room) {
  if (editorRound !== room.currentRound) {
    submittedRound = null;
    pendingCorrectRound = null;
    editorRound = room.currentRound;
    editor = new MoleculeEditor($("editorMount"));
    $("feedback").textContent = "";
  }
  const player = room.players[playerId];
  editor?.lock(Boolean(player.finished));
  startTimer(room);
}

function updatePlayHeader(room) {
  const round = room.settings.rounds[room.currentRound];
  $("playProgress").textContent = `Ronda ${room.currentRound + 1} de ${getRoundLimit(room)}`;
  $("targetName").textContent = round.name;
}

async function checkMolecule() {
  if (!currentRoom || currentRoom.state !== "round" || !editor) return;
  if (hasRoundExpired(currentRoom)) {
    editor.lock(true);
    show("playerResultsView");
    renderPlayerResults(currentRoom);
    return;
  }
  const graph = editor.getGraph();
  const validation = validateCarbonValence(graph);
  if (!validation.ok) {
    $("feedback").textContent = validation.message;
    $("feedback").className = "feedback error";
    return;
  }

  const target = currentRoom.settings.rounds[currentRoom.currentRound];
  const correct = isSameMolecule(graph, target.graph);
  if (!correct) {
    $("feedback").textContent = "Molécula incorrecta. Puedes seguir intentando.";
    $("feedback").className = "feedback error";
    return;
  }

  $("feedback").textContent = "¡Molécula correcta!";
  $("feedback").className = "feedback success";
  submittedRound = currentRoom.currentRound;
  pendingCorrectRound = currentRoom.currentRound;
  editor.lock(true);
  show("playerResultsView");
  renderPlayerResults(currentRoom);
  await store.setSubmission(roomCode, currentRoom.currentRound, playerId, {
    correct: true,
    graph,
    submittedAt: store.now()
  });
}

function startTimer(room) {
  clearInterval(timerId);
  const tick = () => {
    const elapsed = Math.floor((Date.now() - resolvedTime(room.roundStartedAt)) / 1000);
    const remaining = Math.max(0, getRoundDuration(room) - elapsed);
    $("playerTimer").textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timerId);
      editor?.lock(true);
      show("playerResultsView");
      renderPlayerResults(room);
    }
  };
  tick();
  timerId = setInterval(tick, 100);
}

function resolvedTime(value) {
  const time = Number(value);
  return Number.isFinite(time) ? time : Date.now();
}

function renderPlayerResults(room) {
  const player = room.players[playerId];
  const score = player.roundScore || 0;
  const placement = playerPlacement(room.players, playerId);
  const ranking = Object.entries(room.players || {})
    .map(([id, item]) => ({ id, ...item, score: item.score || 0 }))
    .sort((a, b) => b.score - a.score || (a.name || "").localeCompare(b.name || ""));
  const playerIndex = ranking.findIndex((item) => item.id === playerId);
  const playerRank = playerIndex >= 0 ? playerIndex + 1 : placement;
  const previousPlayer = playerIndex > 0 ? ranking[playerIndex - 1] : null;
  const isPendingCorrect = room.state === "round" && pendingCorrectRound === room.currentRound && !player.finished;
  const wasCorrect = score > 0 || player.finished || pendingCorrectRound === room.currentRound;

  $("playerResultTitle").textContent = wasCorrect ? "¡Molécula correcta!" : "Molécula incorrecta";
  $("playerRoundScore").textContent = isPendingCorrect ? "Calculando puntos..." : `+${score} puntos`;
  if (playerRank && playerRank <= 5 && !isPendingCorrect) {
    $("playerStanding").textContent = "ESTÁS EN EL PODIO";
  } else if (isPendingCorrect) {
    $("playerStanding").textContent = "Esperando al profesor...";
  } else {
    const total = Object.keys(room.players || {}).length;
    const gap = previousPlayer ? Math.max(0, (previousPlayer.score || 0) - (player.score || 0)) : 0;
    $("playerStanding").textContent = playerRank && previousPlayer
      ? `Estás en la posición #${playerRank} de ${total}, detrás de ${previousPlayer.name} por ${gap} puntos.`
      : "Esperando la siguiente ronda...";
  }
}

function hasRoundExpired(room) {
  if (!room.roundStartedAt) return false;
  const elapsed = Math.floor((Date.now() - resolvedTime(room.roundStartedAt)) / 1000);
  return elapsed >= getRoundDuration(room);
}

function getRoundDuration(room) {
  return Number(room.settings.roundDurations?.[room.currentRound] || room.settings.duration || 60);
}

function getRoundLimit(room) {
  return Number(room.settings.roundCount || room.settings.rounds?.length || 1);
}

function show(active) {
  views.forEach((id) => $(id).classList.toggle("hidden", id !== active));
}
