const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

let state = null;
let writeTimer = null;

function defaultState() {
  return {
    version: 3,
    configs: {},
    levels: {},
    premiumUsers: [],
    warnings: {},
    modNotes: {},
    ownerProfile: null,
    ownerDelegates: {},
    ownerCoOwners: {},
    ownerControls: {
      directive: "",
      activity: {
        mode: "rotate",
        type: null,
        text: null,
      },
    },
  };
}

function ensureLoaded() {
  if (state) return state;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    state = defaultState();
  }
  state = {
    ...defaultState(),
    ...state,
    configs: state.configs && typeof state.configs === "object" ? state.configs : {},
    levels: state.levels && typeof state.levels === "object" ? state.levels : {},
    premiumUsers: Array.isArray(state.premiumUsers) ? state.premiumUsers : [],
    warnings: state.warnings && typeof state.warnings === "object" ? state.warnings : {},
    modNotes: state.modNotes && typeof state.modNotes === "object" ? state.modNotes : {},
    ownerProfile: state.ownerProfile && typeof state.ownerProfile === "object" ? state.ownerProfile : null,
    ownerDelegates: state.ownerDelegates && typeof state.ownerDelegates === "object" ? state.ownerDelegates : {},
    ownerCoOwners: state.ownerCoOwners && typeof state.ownerCoOwners === "object" ? state.ownerCoOwners : {},
    ownerControls: {
      ...defaultState().ownerControls,
      ...(state.ownerControls && typeof state.ownerControls === "object" ? state.ownerControls : {}),
      activity: {
        ...defaultState().ownerControls.activity,
        ...(state.ownerControls?.activity && typeof state.ownerControls.activity === "object"
          ? state.ownerControls.activity
          : {}),
      },
    },
  };
  return state;
}

function saveNow() {
  const current = ensureLoaded();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(current, null, 2));
  fs.renameSync(tempFile, STATE_FILE);
}

function save() {
  ensureLoaded();
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      saveNow();
    } catch (err) {
      console.error("[storage] Could not save state:", err?.message || err);
    }
  }, 250);
}

function flush() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = null;
  saveNow();
}

module.exports = {
  get state() {
    return ensureLoaded();
  },
  save,
  flush,
  file: STATE_FILE,
};