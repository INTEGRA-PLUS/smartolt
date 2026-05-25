import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  if (!env.SWAGGER_ENABLED) return;

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'SmartOLT Gateway API',
        description: `
## SmartOLT Gateway

Enterprise-grade API aggregator and middleware for SmartOLT integration.

### Features
- **Multi-tenant**: Isolated environments per ISP/client
- **Intelligent Cache**: Redis-backed with configurable TTL per endpoint
- **Queue System**: All write operations via BullMQ for reliability
- **Circuit Breaker**: Auto-protection against SmartOLT outages
- **Rate Limiting**: Per-tenant configurable limits

### Authentication
Use the \`/api/v1/auth/login\` endpoint to get a JWT token, then include it as:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`
        `,
        version: '1.0.0',
        contact: {
          name: 'IntegraColom bia',
          email: 'dev@integracolombia.online',
        },
      },
      servers: [
        {
          url: `http://${env.SWAGGER_HOST}`,
          description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'System', description: 'Health checks and system info' },
        { name: 'Auth', description: 'Authentication and API key management' },
        { name: 'Tenants', description: 'Tenant management (admin)' },
        { name: 'OLTs', description: 'OLT read operations (cached)' },
        { name: 'ONUs', description: 'ONU read operations (cached)' },
        { name: 'ONU Operations', description: 'ONU write operations (queued)' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      persistAuthorization: true,
    },
    staticCSP: true,
  });
}
