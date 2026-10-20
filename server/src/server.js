import { app } from './app.js';
import { env } from './config/env.js';
import { pool, checkDbConnection } from './config/db.js';

const startServer = async () => {
  // Verify database connectivity prior to listening
  console.log('Connecting to PostgreSQL database...');
  const dbStatus = await checkDbConnection();
  if (!dbStatus.connected) {
    console.error('Failed to connect to database at startup:', dbStatus.error);
    process.exit(1);
  }
  console.log(`Database connected successfully to [${dbStatus.database}] at ${dbStatus.time}`);

  const server = app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(` Multi-Tenant SaaS Server running in [${env.NODE_ENV}] mode`);
    console.log(` Listening on port: ${env.PORT}`);
    console.log(` Health check: http://localhost:${env.PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await pool.end();
        console.log('PostgreSQL connection pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database pool:', err);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if hanging
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
