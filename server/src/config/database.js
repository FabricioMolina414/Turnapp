const { PrismaClient } = require('@prisma/client');
const config = require('./env');

const prisma = new PrismaClient();

const connectDatabase = async () => {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno.');
  }

  try {
    await prisma.$connect();
    /* eslint-disable no-console */
    console.log('[database] Conexión a Postgres establecida correctamente');
  } catch (error) {
    console.error('[database] Error al conectar con Postgres', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    /* eslint-disable no-console */
    console.log('[database] Conexión a Postgres cerrada');
  } catch (error) {
    console.error('[database] Error al cerrar la conexión con Postgres', error);
  }
};

const registerShutdownHooks = () => {
  const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];

  signals.forEach((signal) => {
    process.once(signal, async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  });
};

registerShutdownHooks();

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
};
