const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/database');

const ROLE_TO_API = {
  SUPERADMIN: 'superadmin',
  BUSINESS_ADMIN: 'admin',
  STAFF: 'staff',
};

const ROLE_FROM_API = {
  superadmin: 'SUPERADMIN',
  admin: 'BUSINESS_ADMIN',
  staff: 'STAFF',
};

function mapRoleToApi(role) {
  return ROLE_TO_API[role] || 'staff';
}

function mapRoleFromApi(role) {
  return ROLE_FROM_API[role] || 'STAFF';
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return { ...rest, role: mapRoleToApi(user.role) };
}

async function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const normalized = identifier.toLowerCase();
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalized, mode: 'insensitive' } },
        { username: { equals: normalized, mode: 'insensitive' } },
      ],
    },
  });
}

async function findUserById(id) {
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

async function ensureUniqueCredentials({ email, username }) {
  if (email) {
    const emailMatch = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (emailMatch) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
  }

  if (username) {
    const usernameMatch = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    if (usernameMatch) {
      throw new Error('USERNAME_ALREADY_EXISTS');
    }
  }
}

function buildUsernameFromEmail(email) {
  if (!email) {
    return `admin-${Date.now()}`;
  }
  return email.split('@')[0];
}

async function buildUniqueUsernameFromEmail(email) {
  const base = buildUsernameFromEmail(email).toLowerCase();
  let candidate = base;
  let counter = 1;

  // Ensure uniqueness with a simple suffix strategy.
  while (
    await prisma.user.findFirst({
      where: { username: { equals: candidate, mode: 'insensitive' } },
    })
  ) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function addAdminUser({ name, email, password, username, role }) {
  const finalUsername = (username || buildUsernameFromEmail(email)).toLowerCase();
  await ensureUniqueCredentials({ email, username: finalUsername });

  const normalizedRole = role ? mapRoleFromApi(role) : mapRoleFromApi('admin');
  const newUser = await prisma.user.create({
    data: {
      name,
      username: finalUsername,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: normalizedRole,
    },
  });

  return sanitizeUser(newUser);
}

async function findOrCreateGoogleUser({ email, name, avatarUrl, googleSub }) {
  if (!email) {
    throw new Error('EMAIL_REQUIRED');
  }

  const normalizedEmail = email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  if (!user) {
    const username = await buildUniqueUsernameFromEmail(normalizedEmail);
    const passwordHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
    user = await prisma.user.create({
      data: {
        name: name || username,
        username,
        email: normalizedEmail,
        passwordHash,
        role: mapRoleFromApi('staff'),
        avatarUrl: avatarUrl || null,
        metadata: {
          authProvider: 'google',
          googleSub: googleSub || null,
        },
      },
    });
  } else {
    const metadata = user.metadata ?? {};
    const nextMetadata =
      googleSub && metadata.googleSub !== googleSub
        ? { ...metadata, authProvider: metadata.authProvider || 'google', googleSub }
        : metadata;

    const updateData = {};
    if (!user.avatarUrl && avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }
    if (!user.name && name) {
      updateData.name = name;
    }
    if (nextMetadata !== metadata) {
      updateData.metadata = nextMetadata;
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }
  }

  return sanitizeUser(user);
}

async function updateUserRole({ userId, role }) {
  if (!userId) {
    throw new Error('USER_NOT_FOUND');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  if (user.role === 'SUPERADMIN') {
    throw new Error('ROLE_NOT_ALLOWED');
  }

  const normalizedRole = mapRoleFromApi(role);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: normalizedRole },
  });
  return sanitizeUser(updated);
}

async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: { in: [mapRoleFromApi('admin'), mapRoleFromApi('staff')] } },
    orderBy: { createdAt: 'desc' },
  });
  return admins.map(sanitizeUser);
}

async function resetUserPassword({ userId, newPassword, actorId }) {
  if (!userId) {
    throw new Error('USER_NOT_FOUND');
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    throw new Error('PASSWORD_INVALID');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  if (user.role === 'SUPERADMIN') {
    throw new Error('ROLE_NOT_ALLOWED');
  }
  if (actorId && actorId === userId) {
    throw new Error('SELF_ACTION_NOT_ALLOWED');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: bcrypt.hashSync(newPassword.trim(), 10),
    },
  });

  return sanitizeUser(updated);
}

async function removeAdminUser({ userId, actorId }) {
  if (!userId) {
    throw new Error('USER_NOT_FOUND');
  }
  if (actorId && actorId === userId) {
    throw new Error('SELF_ACTION_NOT_ALLOWED');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  if (user.role === 'SUPERADMIN') {
    throw new Error('ROLE_NOT_ALLOWED');
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return true;
  } catch (error) {
    if (error?.code === 'P2003') {
      throw new Error('USER_HAS_DEPENDENCIES');
    }
    throw error;
  }
}

module.exports = {
  sanitizeUser,
  findUserByIdentifier,
  findUserById,
  addAdminUser,
  findOrCreateGoogleUser,
  updateUserRole,
  listAdmins,
  resetUserPassword,
  removeAdminUser,
  mapRoleToApi,
};
