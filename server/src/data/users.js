const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const defaultUsers = [
  {
    id: 'superadmin-1',
    name: 'Fabricio',
    username: 'superadmin',
    email: 'superadmin@peluqueria.com',
    password: bcrypt.hashSync('superadmin', 10),
    role: 'superadmin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'admin-1',
    name: 'Ana López',
    username: 'ana',
    email: 'ana@peluqueria.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

const users = [...defaultUsers];

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const normalized = identifier.toLowerCase();
  return users.find(
    (user) =>
      user.email.toLowerCase() === normalized || user.username.toLowerCase() === normalized
  );
}

function findUserById(id) {
  return users.find((user) => user.id === id);
}

function ensureUniqueCredentials({ email, username }) {
  const emailMatch = email
    ? users.find((user) => user.email.toLowerCase() === email.toLowerCase())
    : null;
  if (emailMatch) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const usernameMatch = username
    ? users.find((user) => user.username.toLowerCase() === username.toLowerCase())
    : null;
  if (usernameMatch) {
    throw new Error('USERNAME_ALREADY_EXISTS');
  }
}

function buildUsernameFromEmail(email) {
  if (!email) {
    return `admin-${users.length + 1}`;
  }
  return email.split('@')[0];
}

function addAdminUser({ name, email, password, username }) {
  const finalUsername = (username || buildUsernameFromEmail(email)).toLowerCase();
  ensureUniqueCredentials({ email, username: finalUsername });

  const newUser = {
    id: randomUUID(),
    name,
    username: finalUsername,
    email,
    password: bcrypt.hashSync(password, 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  return sanitizeUser(newUser);
}

function listAdmins() {
  return users.filter((user) => user.role === 'admin').map(sanitizeUser);
}

module.exports = {
  users,
  sanitizeUser,
  findUserByIdentifier,
  findUserById,
  addAdminUser,
  listAdmins,
};
