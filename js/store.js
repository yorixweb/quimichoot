import { firebaseConfig, hasFirebaseConfig, MAX_PLAYERS } from "./config.js?v=6";

const ROOT_KEY = "quimichoot-db";
const channel = "BroadcastChannel" in window ? new BroadcastChannel("quimichoot") : null;
const localWatchers = new Map();

export async function createStore() {
  if (hasFirebaseConfig()) {
    return createFirebaseStore();
  }
  return createLocalStore();
}

async function createFirebaseStore() {
  const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const dbModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");
  const authModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  const app = appModule.initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  if (!auth.currentUser) {
    await authModule.signInAnonymously(auth);
  }
  const db = dbModule.getDatabase(app);
  const uid = auth.currentUser.uid;

  return {
    mode: "firebase",
    uid,
    now: () => dbModule.serverTimestamp(),
    async createRoom(settings) {
      const code = await uniqueCode(async (pin) => !(await this.getRoom(pin)));
      await dbModule.set(dbModule.ref(db, `rooms/${code}`), freshRoom(code, settings, uid));
      return code;
    },
    async getRoom(code) {
      const snap = await dbModule.get(dbModule.ref(db, `rooms/${code}`));
      return snap.exists() ? snap.val() : null;
    },
    watchRoom(code, callback) {
      const roomRef = dbModule.ref(db, `rooms/${code}`);
      return dbModule.onValue(roomRef, (snap) => callback(snap.exists() ? snap.val() : null));
    },
    updateRoom(code, patch) {
      return dbModule.update(dbModule.ref(db, `rooms/${code}`), patch);
    },
    deleteRoom(code) {
      return dbModule.remove(dbModule.ref(db, `rooms/${code}`));
    },
    updatePlayer(code, playerId, patch) {
      return dbModule.update(dbModule.ref(db, `rooms/${code}/players/${playerId}`), patch);
    },
    removePlayer(code, playerId) {
      return dbModule.remove(dbModule.ref(db, `rooms/${code}/players/${playerId}`));
    },
    setSubmission(code, roundIndex, playerId, submission) {
      return dbModule.set(dbModule.ref(db, `rooms/${code}/submissions/${roundIndex}/${playerId}`), submission);
    },
    async joinRoom(code, name, existingId) {
      const room = await this.getRoom(code);
      if (!room) throw new Error("No existe una sala con ese PIN.");
      const players = room.players || {};
      const playerId = existingId || uid;
      if (!players[playerId] && Object.keys(players).length >= MAX_PLAYERS) {
        throw new Error("La sala ya tiene 50 jugadores.");
      }
      await this.updatePlayer(code, playerId, {
        name,
        score: players[playerId]?.score || 0,
        connected: true,
        finished: false,
        roundScore: 0,
        joinedAt: dbModule.serverTimestamp()
      });
      return playerId;
    }
  };
}

function createLocalStore() {
  return {
    mode: "local",
    now: () => Date.now(),
    async createRoom(settings) {
      const code = await uniqueCode(async (pin) => !readDb().rooms?.[pin]);
      mutate((db) => {
        db.rooms[code] = freshRoom(code, settings);
      });
      return code;
    },
    async getRoom(code) {
      return clone(readDb().rooms?.[code] || null);
    },
    watchRoom(code, callback) {
      const send = () => callback(clone(readDb().rooms?.[code] || null));
      const watchers = localWatchers.get(code) || new Set();
      watchers.add(send);
      localWatchers.set(code, watchers);
      send();
      const listener = (event) => {
        if (event.data === code) send();
      };
      channel?.addEventListener("message", listener);
      window.addEventListener("storage", send);
      return () => {
        watchers.delete(send);
        channel?.removeEventListener("message", listener);
        window.removeEventListener("storage", send);
      };
    },
    async updateRoom(code, patch) {
      mutate((db) => {
        db.rooms[code] = { ...(db.rooms[code] || {}), ...patch };
      }, code);
    },
    async deleteRoom(code) {
      mutate((db) => {
        delete db.rooms[code];
      }, code);
    },
    async updatePlayer(code, playerId, patch) {
      mutate((db) => {
        const room = db.rooms[code];
        room.players = room.players || {};
        room.players[playerId] = { ...(room.players[playerId] || {}), ...patch };
      }, code);
    },
    async removePlayer(code, playerId) {
      mutate((db) => {
        delete db.rooms[code]?.players?.[playerId];
      }, code);
    },
    async setSubmission(code, roundIndex, playerId, submission) {
      mutate((db) => {
        const room = db.rooms[code];
        room.submissions = room.submissions || {};
        room.submissions[roundIndex] = room.submissions[roundIndex] || {};
        room.submissions[roundIndex][playerId] = submission;
      }, code);
    },
    async joinRoom(code, name, existingId) {
      const room = readDb().rooms?.[code];
      if (!room) throw new Error("No existe una sala con ese PIN.");
      const players = room.players || {};
      const playerId = existingId || crypto.randomUUID();
      if (!players[playerId] && Object.keys(players).length >= MAX_PLAYERS) {
        throw new Error("La sala ya tiene 50 jugadores.");
      }
      await this.updatePlayer(code, playerId, {
        name,
        score: players[playerId]?.score || 0,
        connected: true,
        finished: false,
        roundScore: 0,
        joinedAt: Date.now()
      });
      return playerId;
    }
  };
}

function freshRoom(code, settings, hostUid = "local-host") {
  return {
    code,
    state: "lobby",
    host: { connected: true, uid: hostUid },
    settings,
    currentRound: -1,
    roundStartedAt: null,
    players: {},
    submissions: {},
    createdAt: Date.now()
  };
}

function readDb() {
  const db = JSON.parse(localStorage.getItem(ROOT_KEY) || "{\"rooms\":{}}");
  db.rooms = db.rooms || {};
  return db;
}

function mutate(mutator, code) {
  const db = readDb();
  mutator(db);
  localStorage.setItem(ROOT_KEY, JSON.stringify(db));
  if (code) channel?.postMessage(code);
  if (code) {
    for (const callback of localWatchers.get(code) || []) callback();
  }
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

async function uniqueCode(isAvailable) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (await isAvailable(code)) return code;
  }
  throw new Error("No se pudo crear un PIN único.");
}
