import { createStore } from "./store.js?v=6";
import { ROUND_BANK, getRoundById, roundLabel, selectRounds } from "./rounds.js?v=6";
import { calculateScore, rankPlayers } from "./scoring.js?v=6";
import { isSameMolecule } from "./chemistry.js?v=6";

const $ = (id) => document.getElementById(id);
const views = ["setupView", "lobbyView", "countdownView", "roundView", "resultsView"];
const store = await createStore();
let roomCode = "";
let currentRoom = null;
let unsubscribe = null;
let timerId = null;
let countdownId = null;
let activeCountdownKey = null;
let startingRound = false;
const processed = new Set();

$("modeNotice").textContent = store.mode === "firebase"
  ? "Firebase activo."
  : "Modo local de prueba activo. Pega tus credenciales en js/config.js para usar Firebase.";

$("createRoomBtn").addEventListener("click", createRoom);
$("startGameBtn").addEventListener("click", startGame);
$("dissolveRoomBtn").addEventListener("click", dissolveRoom);
$("dissolveRoomResultsBtn").addEventListener("click", dissolveRoom);
$("endRoundBtn").addEventListener("click", () => finishRound());
$("nextRoundBtn").addEventListener("click", nextRound);
populateRoundPicker();

async function createRoom() {
  unsubscribe?.();
  currentRoom = null;
  $("modeNotice").textContent = store.mode === "firebase" ? "Creando sala en Firebase..." : "Creando sala local...";
  try {
    const roundCount = Number($("roundCount").value || 8);
    const duration = Number($("roundDuration").value || 60);
    const difficultyLimit = Number($("difficultyLimit").value || 3);
    const rounds = selectRounds(roundCount, difficultyLimit);
    roomCode = await store.createRoom({
      roundCount,
      duration,
      difficultyLimit,
      rounds,
      roundDurations: { 0: duration },
      scoreMultipliers: { 0: 1 }
    });
    localStorage.removeItem("quimichoot-host-room");
    watchRoom(roomCode);
  } catch (error) {
    $("modeNotice").textContent = `No se pudo crear la sala: ${error.message}`;
  }
}

function watchRoom(code) {
  unsubscribe?.();
  $("roomPin").textContent = code;
  unsubscribe = store.watchRoom(code, (room) => {
    if (!room) {
      resetHostScreen();
      return;
    }
    currentRoom = room;
    render(room);
    processRound(room);
  });
}

async function dissolveRoom() {
  if (!roomCode || !currentRoom) return;
  const confirmed = window.confirm("¿Seguro que quieres disolver esta sala? Se borrará para todos los jugadores.");
  if (!confirmed) return;
  try {
    await store.deleteRoom(roomCode);
    resetHostScreen();
  } catch (error) {
    window.alert(`No se pudo disolver la sala: ${error.message}`);
  }
}

function resetHostScreen() {
  unsubscribe?.();
  unsubscribe = null;
  currentRoom = null;
  roomCode = "";
  clearInterval(timerId);
  clearInterval(countdownId);
  activeCountdownKey = null;
  startingRound = false;
  processed.clear();
  $("roomPin").textContent = "----";
  $("modeNotice").textContent = store.mode === "firebase" ? "Firebase activo." : "Modo local de prueba activo.";
  show("setupView");
}

async function startGame() {
  if (!currentRoom || Object.keys(currentRoom.players || {}).length === 0) return;
  await startCountdown(0);
}

async function startCountdown(roundIndex) {
  clearInterval(countdownId);
  await store.updateRoom(roomCode, {
    state: "countdown",
    currentRound: roundIndex,
    countdownStartedAt: store.now(),
    roundStartedAt: null
  });
}

async function startRound(roundIndex) {
  processed.clear();
  const players = currentRoom.players || {};
  await Promise.all(Object.keys(players).map((playerId) => store.updatePlayer(roomCode, playerId, {
    finished: false,
    finishedAt: null,
    roundScore: 0
  })));
  const updates = {
    state: "round",
    currentRound: roundIndex,
    roundStartedAt: store.now()
  };
  await store.updateRoom(roomCode, updates);
}

async function finishRound() {
  if (!currentRoom || currentRoom.state !== "round") return;
  await store.updateRoom(roomCode, { state: "results", roundEndedAt: store.now() });
}

async function nextRound() {
  const settings = currentRoom.settings;
  const next = currentRoom.currentRound + 1;
  const roundLimit = getRoundLimit(currentRoom);
  if (next >= roundLimit) {
    await store.updateRoom(roomCode, { state: "final" });
    return;
  }
  const selectedRoundId = $("nextRoundSelect")?.value || "auto";
  const chosenRound = selectedRoundId === "auto" ? null : getRoundById(selectedRoundId);
  const nextDuration = clampNumber(Number($("nextRoundDuration")?.value || settings.duration), 10, 300);
  const nextMultiplier = $("nextRoundDouble")?.checked ? 2 : 1;
  const nextSettings = {
    ...settings,
    roundDurations: {
      ...(settings.roundDurations || {}),
      [next]: nextDuration
    },
    scoreMultipliers: {
      ...(settings.scoreMultipliers || {}),
      [next]: nextMultiplier
    }
  };
  if (chosenRound) {
    const rounds = [...settings.rounds];
    rounds[next] = chosenRound;
    await store.updateRoom(roomCode, {
      settings: {
        ...nextSettings,
        rounds,
        roundCount: roundLimit
      }
    });
    await startCountdown(next);
  } else {
    await store.updateRoom(roomCode, { settings: nextSettings });
    await startCountdown(next);
  }
}

function processRound(room) {
  if (room.state !== "round") return;
  const roundIndex = room.currentRound;
  const target = room.settings.rounds[roundIndex];
  const submissions = room.submissions?.[roundIndex] || {};
  const players = room.players || {};

  Object.entries(submissions).forEach(async ([playerId, submission]) => {
    const key = `${roundIndex}:${playerId}`;
    if (processed.has(key) || players[playerId]?.finished) return;
    if (!submission.correct || !isSameMolecule(submission.graph, target.graph)) return;
    const submittedAt = Number(submission.submittedAt);
    const startedAt = Number(room.roundStartedAt);
    if (!Number.isFinite(submittedAt) || !Number.isFinite(startedAt)) return;
    processed.add(key);
    const elapsed = Math.max(0, (submittedAt - startedAt) / 1000);
    const roundScore = calculateScore(elapsed, getRoundDuration(room)) * getScoreMultiplier(room);
    await store.updatePlayer(roomCode, playerId, {
      finished: true,
      finishedAt: submittedAt,
      roundScore,
      score: (players[playerId]?.score || 0) + roundScore
    });
  });

  const playerIds = Object.keys(players);
  if (playerIds.length > 0 && playerIds.every((id) => players[id].finished)) {
    finishRound();
  }
}

function render(room) {
  show(viewFor(room.state));
  $("roomPin").textContent = room.code;
  renderPlayers(room);
  renderRanking(room);

  if (room.state === "countdown") continueCountdown(room);
  if (room.state === "round") renderRound(room);
  if (room.state === "results" || room.state === "final") renderResults(room);
}

function continueCountdown(room) {
  const key = `${room.code}:${room.currentRound}:${room.countdownStartedAt}`;
  if (activeCountdownKey === key) return;
  activeCountdownKey = key;
  clearInterval(countdownId);
  const tick = async () => {
    const elapsed = Math.floor((Date.now() - resolvedTime(room.countdownStartedAt)) / 1000);
    const remaining = Math.max(0, 3 - elapsed);
    $("countdownNumber").textContent = remaining || 1;
    if (remaining <= 0 && !startingRound) {
      startingRound = true;
      clearInterval(countdownId);
      await startRound(room.currentRound);
      startingRound = false;
      activeCountdownKey = null;
    }
  };
  tick();
  countdownId = setInterval(tick, 250);
}

function viewFor(state) {
  if (state === "lobby") return "lobbyView";
  if (state === "countdown") return "countdownView";
  if (state === "round") return "roundView";
  if (state === "results" || state === "final") return "resultsView";
  return "setupView";
}

function show(active) {
  views.forEach((id) => $(id).classList.toggle("hidden", id !== active));
}

function renderPlayers(room) {
  const players = Object.entries(room.players || {});
  $("playersList").innerHTML = players.length
    ? players.map(([id, player]) => `
      <article class="player-tile">
        <strong>${escapeHtml(player.name)}</strong>
        <span>${player.score || 0} pts</span>
        ${room.state === "lobby" ? `<button class="kick" data-id="${id}">Expulsar</button>` : ""}
      </article>
    `).join("")
    : "<p class='empty'>Aún no hay equipos conectados.</p>";

  $("playersList").querySelectorAll(".kick").forEach((button) => {
    button.addEventListener("click", () => store.removePlayer(roomCode, button.dataset.id));
  });
}

function renderRound(room) {
  const round = room.settings.rounds[room.currentRound];
  const multiplier = getScoreMultiplier(room);
  $("roundProgress").textContent = `Ronda ${room.currentRound + 1} de ${getRoundLimit(room)}${multiplier > 1 ? " · puntos dobles" : ""}`;
  $("moleculeName").textContent = round.name;
  const finished = Object.values(room.players || {}).filter((player) => player.finished).length;
  const total = Object.keys(room.players || {}).length;
  $("answeredCount").textContent = `${finished} de ${total} equipos construyeron correctamente.`;
  startTimer(room);
}

function startTimer(room) {
  clearInterval(timerId);
  const tick = () => {
    const elapsed = Math.floor((Date.now() - resolvedTime(room.roundStartedAt)) / 1000);
    const remaining = Math.max(0, getRoundDuration(room) - elapsed);
    $("timer").textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timerId);
      finishRound();
    }
  };
  tick();
  timerId = setInterval(tick, 100);
}

function resolvedTime(value) {
  const time = Number(value);
  return Number.isFinite(time) ? time : Date.now();
}

function renderRanking(room) {
  const ranking = rankPlayers(room.players || {});
  $("liveRanking").innerHTML = ranking.slice(0, 8).map((player) => (
    `<li><span>${escapeHtml(player.name)}</span><strong>${player.score}</strong></li>`
  )).join("");
}

function renderResults(room) {
  const ranking = rankPlayers(room.players || {});
  const isFinal = room.state === "final";
  $("resultsTitle").textContent = isFinal ? "Ganadores" : "Podio";
  $("nextRoundBtn").textContent = isFinal ? "Partida finalizada" : "Siguiente ronda";
  $("nextRoundBtn").disabled = isFinal;
  $("nextRoundPanel").classList.toggle("hidden", isFinal);
  const correct = Object.values(room.players || {}).filter((player) => player.roundScore > 0).length;
  const total = Object.keys(room.players || {}).length;
  $("roundStats").textContent = isFinal ? "Clasificación final" : `${correct} de ${total} equipos construyeron correctamente la molécula.`;
  $("podium").innerHTML = ranking.slice(0, 3).map((player, index) => (
    `<li class="place-${index + 1}"><span>${medal(index)} ${escapeHtml(player.name)}</span><strong>${player.score}</strong></li>`
  )).join("");
  $("fullRanking").innerHTML = ranking.slice(3).map((player, index) => (
    `<li><span>#${index + 4} ${escapeHtml(player.name)}</span><strong>${player.score}</strong></li>`
  )).join("");
  updateNextRoundPicker(room);
}

function populateRoundPicker() {
  const select = $("nextRoundSelect");
  if (!select) return;
  const grouped = ROUND_BANK
    .slice()
    .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name));
  select.innerHTML = [
    "<option value=\"auto\">Automática según la lista</option>",
    ...grouped.map((round) => `<option value="${round.id}">${escapeHtml(roundLabel(round))}</option>`)
  ].join("");
}

function updateNextRoundPicker(room) {
  const select = $("nextRoundSelect");
  if (!select || room.state === "final") return;
  const next = room.currentRound + 1;
  const roundLimit = getRoundLimit(room);
  const automatic = room.settings.rounds?.[next];
  const autoOption = select.querySelector('option[value="auto"]');
  if (autoOption) {
    autoOption.textContent = next >= roundLimit
      ? "Automática: terminar partida"
      : automatic
      ? `Automática: ${roundLabel(automatic)}`
      : "Automática: terminar partida";
  }
  $("nextRoundBtn").textContent = next >= roundLimit ? "Mostrar final" : "Siguiente ronda";
  if (!select.value) select.value = "auto";
  const durationInput = $("nextRoundDuration");
  const doubleInput = $("nextRoundDouble");
  if (durationInput) durationInput.value = getRoundDuration(room);
  if (doubleInput) doubleInput.checked = false;
}

function getRoundDuration(room) {
  return Number(room.settings.roundDurations?.[room.currentRound] || room.settings.duration || 60);
}

function getScoreMultiplier(room) {
  return Number(room.settings.scoreMultipliers?.[room.currentRound] || 1);
}

function getRoundLimit(room) {
  return Number(room.settings.roundCount || room.settings.rounds?.length || 1);
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function medal(index) {
  return ["🥇", "🥈", "🥉"][index] || "";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}
