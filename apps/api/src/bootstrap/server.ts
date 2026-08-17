import { env } from '../config/env.js';
import { buildContainer } from './container.js';
import { buildApp } from './app.js';

const container = buildContainer();
const app = buildApp(container);
const server = app.listen(env.PORT, () => console.log(`HOOMA API listening on :${env.PORT}`));

async function shutdown(signal: string) {
  console.log(`HOOMA API received ${signal}; shutting down.`);
  server.close(async () => {
    await container.db.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
