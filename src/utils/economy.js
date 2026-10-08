const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const filePath = path.join(dataDir, 'economy.json');
const configPath = path.join(dataDir, 'economyConfig.json');

const DEFAULT_STATS = {
  workCount: 0,
  dailyCount: 0,
  weeklyCount: 0,
  monthlyCount: 0,
  robSuccess: 0,
  robFailed: 0,
  successfulRobberies: 0,
  failedRobberies: 0,
  timesRobbed: 0,
  slotsWins: 0,
  slotsLosses: 0,
  coinflipWins: 0,
  coinflipLosses: 0,
  bankRobSuccess: 0,
  bankRobFailed: 0,
  job: 'unemployed',
};

const DEFAULT_USER = {
  cash: 0,
  bank: 0,
  totalEarned: 0,

  lastDaily: 0,
  lastWeekly: 0,
  lastMonthly: 0,
  lastWork: 0,
  lastRob: 0,

  dailyStreak: 0,
  weeklyStreak: 0,
  monthlyStreak: 0,

  inventory: [],

  stats: {
    ...DEFAULT_STATS
  }
};

const DEFAULT_CONFIG = {
  rewards: {
    daily: { min: 100, max: 2000 },
    weekly: { min: 1000, max: 10000 },
    monthly: { min: 5000, max: 50000 }
  },
  roles: {},
  managers: {},
  blacklist: {},
  companies: {}
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function ensureFile(file, defaultData) {
  ensureDataDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function readJSON(file, fallback = {}) {
  ensureFile(file, fallback);
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.trim()) return clone(fallback);
    const data = JSON.parse(content);
    return data && typeof data === 'object' ? data : clone(fallback);
  } catch (error) {
    console.error(`Impossible de lire ${path.basename(file)} :`, error);
    return clone(fallback);
  }
}

function writeJSON(file, data) {
  ensureDataDir();
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Impossible de sauvegarder ${path.basename(file)} :`, error);
    return false;
  }
}

function normalizeUser(user) {
  const normalized = {
    ...clone(DEFAULT_USER),
    ...(user || {})
  };

  normalized.cash = typeof normalized.cash === 'number' ? normalized.cash : 0;
  normalized.bank = typeof normalized.bank === 'number' ? normalized.bank : 0;
  normalized.totalEarned = typeof normalized.totalEarned === 'number' ? normalized.totalEarned : 0;

  if (!Array.isArray(normalized.inventory)) normalized.inventory = [];

  if (!normalized.stats || typeof normalized.stats !== 'object' || Array.isArray(normalized.stats)) {
    normalized.stats = {};
  }

  normalized.stats = {
    ...clone(DEFAULT_STATS),
    ...normalized.stats
  };

  return normalized;
}


function loadData() {
  const data = readJSON(filePath, {});
  const normalizedData = {};

  for (const [key, userData] of Object.entries(data)) {
    normalizedData[key] = normalizeUser(userData);
  }

  return normalizedData;
}

function saveData(data) {
  if (!data || typeof data !== 'object') return false;
  const normalizedData = {};

  for (const [key, userData] of Object.entries(data)) {
    normalizedData[key] = normalizeUser(userData);
  }

  return writeJSON(filePath, normalizedData);
}

function loadConfig() {
  const config = readJSON(configPath, DEFAULT_CONFIG);
  if (!config.rewards) config.rewards = {};
  if (!config.roles) config.roles = {};
  if (!config.managers) config.managers = {};
  if (!config.blacklist) config.blacklist = {};
  if (!config.companies) config.companies = {};
  return config;
}

function saveConfig(config) {
  return writeJSON(configPath, config);
}


function getKey(guildId, userId) {
  return `${guildId}_${userId}`;
}

function getUser(guildId, userId) {
  const data = loadData();
  const key = getKey(guildId, userId);

  if (!data[key]) {
    data[key] = normalizeUser(DEFAULT_USER);
    saveData(data);
  }

  return clone(data[key]);
}

function updateUser(guildId, userId, changes) {
  const data = loadData();
  const key = getKey(guildId, userId);
  const current = normalizeUser(data[key]);

  const updated = normalizeUser({
    ...current,
    ...(changes || {})
  });

  data[key] = updated;
  saveData(data);
  return clone(updated);
}


function addBalance(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  user.cash += amount;
  if (amount > 0) user.totalEarned += amount;
  updateUser(guildId, userId, user);
  return user.cash;
}

function removeBalance(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  user.cash = Math.max(0, user.cash - amount);
  updateUser(guildId, userId, user);
  return user.cash;
}

function setBalance(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  user.cash = amount;
  updateUser(guildId, userId, user);
  return user.cash;
}

function addBalanceToAll(guildId, amount) {
  const data = loadData();
  let count = 0;

  for (const key of Object.keys(data)) {
    if (key.startsWith(`${guildId}_`)) {
      data[key].cash += amount;
      if (amount > 0) data[key].totalEarned += amount;
      count++;
    }
  }

  saveData(data);
  return count;
}

function resetServerEconomy(guildId) {
  const data = loadData();
  let count = 0;

  for (const key of Object.keys(data)) {
    if (key.startsWith(`${guildId}_`)) {
      data[key] = normalizeUser(DEFAULT_USER);
      count++;
    }
  }

  saveData(data);
  return count;
}


function addManagerRole(guildId, roleId) {
  const config = loadConfig();
  if (!config.managers[guildId]) config.managers[guildId] = [];

  if (!config.managers[guildId].includes(roleId)) {
    config.managers[guildId].push(roleId);
    saveConfig(config);
  }
  return true;
}

function removeManagerRole(guildId, roleId) {
  const config = loadConfig();
  if (!config.managers?.[guildId]) return false;

  const index = config.managers[guildId].indexOf(roleId);
  if (index === -1) return false;

  config.managers[guildId].splice(index, 1);
  saveConfig(config);
  return true;
}

function getManagerRoles(guildId) {
  const config = loadConfig();
  return config.managers?.[guildId] || [];
}


function blacklistUser(guildId, userId) {
  const config = loadConfig();
  if (!config.blacklist[guildId]) config.blacklist[guildId] = {};

  config.blacklist[guildId][userId] = true;
  saveConfig(config);
  return true;
}

function unblacklistUser(guildId, userId) {
  const config = loadConfig();
  if (!config.blacklist?.[guildId]?.[userId]) return false;

  delete config.blacklist[guildId][userId];
  saveConfig(config);
  return true;
}

function isBlacklisted(guildId, userId) {
  const config = loadConfig();
  return config.blacklist?.[guildId]?.[userId] === true;
}

function createCompany(guildId, ownerId, name) {
  const config = loadConfig();

  const key = `${guildId}_${ownerId}`;

  if (config.companies[key]) {
    return false;
  }

  config.companies[key] = {
    name: name,
    owner: ownerId,
    balance: 0,
    employees: []
  };

  saveConfig(config);

  return config.companies[key];
}

function getCompany(guildId, ownerId) {
  const config = loadConfig();

  const key = `${guildId}_${ownerId}`;

  return config.companies[key] || null;
}

function addEmployee(guildId, ownerId, employeeId) {
    const config = loadConfig();
    const key = `${guildId}_${ownerId}`;

    if (!config.companies[key]) {
        return false;
    }

    config.companies[key].employees.push(employeeId);

    saveConfig(config);

    return true;
}

function removeEmployee(guildId, ownerId, employeeId) {
    const config = loadConfig();
    const key = `${guildId}_${ownerId}`;

    if (!config.companies[key]) {
        return false;
    }

    const employees = config.companies[key].employees;
    const index = employees.indexOf(employeeId);

    if (index === -1) {
        return false;
    }

    employees.splice(index, 1);

    saveConfig(config);

    return true;
}

function addCompanyBalance(guildId, ownerId, amount) {
    const config = loadConfig();
    const key = `${guildId}_${ownerId}`;

    if (!config.companies[key]) {
        return false;
    }

    config.companies[key].balance += amount;

    saveConfig(config);

    return true;
}

function removeCompanyBalance(guildId, ownerId, amount) {
    const config = loadConfig();
    const key = `${guildId}_${ownerId}`;

    if (!config.companies[key]) {
        return false;
    }

    if (config.companies[key].balance < amount) {
        return false;
    }

    config.companies[key].balance -= amount;

    saveConfig(config);

    return true;
}

function renameCompany(guildId, ownerId, name) {
    const config = loadConfig();
    const key = `${guildId}_${ownerId}`;

    if (!config.companies[key]) {
        return false;
    }

    config.companies[key].name = name;

    saveConfig(config);

    return config.companies[key];
}

module.exports = {
  getUser,
  updateUser,

  addBalance,
  removeBalance,
  setBalance,
  addBalanceToAll,
  resetServerEconomy,

  addManagerRole,
  removeManagerRole,
  getManagerRoles,

  blacklistUser,
  unblacklistUser,
  isBlacklisted,

  loadData,
  saveData,
  loadConfig,
  saveConfig,

  createCompany,
  getCompany,
  addEmployee,
  removeEmployee,
  addCompanyBalance,
  removeCompanyBalance,
  renameCompany,
};