const storage = require("./storage");

const GRANTABLE_SCOPES = [
  "overview",
  "stats",
  "status",
  "directive",
  "ownerinfo",
  "chaos",
  "guilds",
  "config",
  "clearai",
];

const SCOPE_LABELS = {
  overview: "control center",
  stats: "bot stats",
  status: "bot status",
  directive: "AI directive",
  ownerinfo: "owner profile",
  chaos: "chaos events",
  guilds: "server list",
  config: "server config inspection",
  clearai: "AI history clearing",
};

function clean() {
  const delegates = storage.state.ownerDelegates;
  const now = Date.now();
  let changed = false;
  for (const [userId, grant] of Object.entries(delegates)) {
    if (!grant || grant.expiresAt <= now) {
      delete delegates[userId];
      changed = true;
    }
  }
  if (changed) storage.save();
  return delegates;
}

function normalizeScopes(scopes) {
  const requested = Array.isArray(scopes) ? scopes : [];
  if (requested.some(scope => scope.toLowerCase() === "all")) return [...GRANTABLE_SCOPES];
  return [...new Set(requested.map(scope => scope.toLowerCase()).filter(scope => GRANTABLE_SCOPES.includes(scope)))];
}

function grant(userId, durationMs, scopes, grantedBy, profile = {}) {
  const selected = normalizeScopes(scopes);
  if (!selected.length) return { ok: false, reason: "Choose at least one grantable scope." };
  const duration = Math.max(60_000, Math.min(30 * 86_400_000, durationMs));
  const expiresAt = Date.now() + duration;
  storage.state.ownerDelegates[userId] = {
    userId,
    username: profile.username || null,
    tag: profile.tag || null,
    scopes: selected,
    grantedBy,
    grantedAt: new Date().toISOString(),
    expiresAt,
  };
  storage.save();
  return { ok: true, grant: storage.state.ownerDelegates[userId] };
}

function revoke(userId) {
  const existed = Boolean(clean()[userId]);
  delete storage.state.ownerDelegates[userId];
  storage.save();
  return existed;
}

function get(userId) {
  const grant = clean()[userId];
  if (!grant) return null;
  return grant;
}

function hasScope(userId, scope) {
  const grant = get(userId);
  return Boolean(grant && (grant.scopes.includes(scope) || grant.scopes.includes("all")));
}

function list() {
  return Object.values(clean());
}

function formatDuration(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

function parseDuration(value) {
  const match = String(value || "").toLowerCase().match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = { m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  const ms = amount * unit;
  if (!Number.isFinite(ms) || ms < 60_000 || ms > 30 * 86_400_000) return null;
  return ms;
}

module.exports = {
  GRANTABLE_SCOPES,
  SCOPE_LABELS,
  grant,
  revoke,
  get,
  hasScope,
  list,
  normalizeScopes,
  formatDuration,
  parseDuration,
};