const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('./config/database');

connectDatabase()
  .then(() => {
    app.listen(config.port, () => {
      /* eslint-disable no-console */
      console.log(`API Turnapp escuchando en http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error('[startup] Falló la inicialización de la base de datos', error);
    process.exit(1);
  });
