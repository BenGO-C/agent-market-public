'use strict';

const fastify = require('fastify')({
  logger: true,
  bodyLimit: 1024 * 1024 * 55, // 55MB
});
const multipart = require('@fastify/multipart');
const cors = require('@fastify/cors');
require('dotenv').config();

async function start() {
  await fastify.register(cors, { origin: true });
  await fastify.register(multipart, {
    limits: { fileSize: 1024 * 1024 * 50 },
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

  // Routes
  await fastify.register(require('./routes/auth'), { prefix: '/api/v1/auth' });
  await fastify.register(require('./routes/assets'), { prefix: '/api/v1/assets' });

  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';
  await fastify.listen({ port, host });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
