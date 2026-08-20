import fs from 'node:fs';
import path from 'node:path';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function replaceOnce(file, before, after) {
  const current = read(file);
  if (!current.includes(before)) {
    throw new Error(`Expected source block not found in ${file}: ${before.slice(0, 80)}`);
  }
  write(file, current.replace(before, after));
}

// ---------------------------------------------------------------------------
// Prisma canonical User + Better Auth tables
// ---------------------------------------------------------------------------
const schemaFile = 'packages/database/prisma/schema.prisma';
replaceOnce(
  schemaFile,
  `  telegramUserId String?   @unique @db.VarChar(32)\n  username       String?   @db.VarChar(64)\n  firstName      String?   @db.VarChar(120)`,
  `  telegramUserId      String?   @unique @db.VarChar(32)\n  username            String?   @db.VarChar(64)\n  authName            String?   @db.VarChar(120)\n  email               String?   @unique @db.VarChar(320)\n  emailVerified       Boolean   @default(false)\n  authUsername        String?   @unique @db.VarChar(64)\n  displayAuthUsername String?   @db.VarChar(64)\n  firstName           String?   @db.VarChar(120)`,
);

replaceOnce(
  schemaFile,
  `  platformRoleAssignments PlatformRoleAssignment[]\n\n  @@index([createdAt])`,
  `  platformRoleAssignments PlatformRoleAssignment[]\n  authSessions            AuthSession[]\n  authAccounts            AuthAccount[]\n\n  @@index([createdAt])`,
);

const authModels = `\nmodel AuthSession {\n  id        String   @id\n  expiresAt DateTime\n  token     String   @unique @db.VarChar(255)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?  @db.VarChar(64)\n  userAgent String?  @db.VarChar(500)\n  userId    String\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([expiresAt])\n}\n\nmodel AuthAccount {\n  id                    String    @id\n  accountId             String    @db.VarChar(255)\n  providerId            String    @db.VarChar(120)\n  userId                String\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([providerId, accountId])\n  @@index([userId])\n}\n\nmodel AuthVerification {\n  id         String   @id\n  identifier String   @db.VarChar(320)\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@index([expiresAt])\n}\n`;
const schema = read(schemaFile);
if (schema.includes('model AuthSession {')) throw new Error('Auth models already exist unexpectedly');
write(schemaFile, `${schema.trimEnd()}\n${authModels}`);

const migration = `-- Phase D: add Better Auth credential/session storage without replacing canonical User.id.\n\nALTER TABLE \"User\"\n  ADD COLUMN \"authName\" VARCHAR(120),\n  ADD COLUMN \"email\" VARCHAR(320),\n  ADD COLUMN \"emailVerified\" BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN \"authUsername\" VARCHAR(64),\n  ADD COLUMN \"displayAuthUsername\" VARCHAR(64);\n\nCREATE UNIQUE INDEX \"User_email_key\" ON \"User\"(\"email\");\nCREATE UNIQUE INDEX \"User_authUsername_key\" ON \"User\"(\"authUsername\");\n\nCREATE TABLE \"AuthSession\" (\n  \"id\" TEXT NOT NULL,\n  \"expiresAt\" TIMESTAMP(3) NOT NULL,\n  \"token\" VARCHAR(255) NOT NULL,\n  \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  \"updatedAt\" TIMESTAMP(3) NOT NULL,\n  \"ipAddress\" VARCHAR(64),\n  \"userAgent\" VARCHAR(500),\n  \"userId\" TEXT NOT NULL,\n  CONSTRAINT \"AuthSession_pkey\" PRIMARY KEY (\"id\")\n);\n\nCREATE UNIQUE INDEX \"AuthSession_token_key\" ON \"AuthSession\"(\"token\");\nCREATE INDEX \"AuthSession_userId_idx\" ON \"AuthSession\"(\"userId\");\nCREATE INDEX \"AuthSession_expiresAt_idx\" ON \"AuthSession\"(\"expiresAt\");\n\nCREATE TABLE \"AuthAccount\" (\n  \"id\" TEXT NOT NULL,\n  \"accountId\" VARCHAR(255) NOT NULL,\n  \"providerId\" VARCHAR(120) NOT NULL,\n  \"userId\" TEXT NOT NULL,\n  \"accessToken\" TEXT,\n  \"refreshToken\" TEXT,\n  \"idToken\" TEXT,\n  \"accessTokenExpiresAt\" TIMESTAMP(3),\n  \"refreshTokenExpiresAt\" TIMESTAMP(3),\n  \"scope\" TEXT,\n  \"password\" TEXT,\n  \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  \"updatedAt\" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT \"AuthAccount_pkey\" PRIMARY KEY (\"id\")\n);\n\nCREATE UNIQUE INDEX \"AuthAccount_providerId_accountId_key\" ON \"AuthAccount\"(\"providerId\", \"accountId\");\nCREATE INDEX \"AuthAccount_userId_idx\" ON \"AuthAccount\"(\"userId\");\n\nCREATE TABLE \"AuthVerification\" (\n  \"id\" TEXT NOT NULL,\n  \"identifier\" VARCHAR(320) NOT NULL,\n  \"value\" TEXT NOT NULL,\n  \"expiresAt\" TIMESTAMP(3) NOT NULL,\n  \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  \"updatedAt\" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT \"AuthVerification_pkey\" PRIMARY KEY (\"id\")\n);\n\nCREATE INDEX \"AuthVerification_identifier_idx\" ON \"AuthVerification\"(\"identifier\");\nCREATE INDEX \"AuthVerification_expiresAt_idx\" ON \"AuthVerification\"(\"expiresAt\");\n\nALTER TABLE \"AuthSession\"\n  ADD CONSTRAINT \"AuthSession_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;\n\nALTER TABLE \"AuthAccount\"\n  ADD CONSTRAINT \"AuthAccount_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
write('packages/database/prisma/migrations/20260820140500_add_email_password_auth/migration.sql', migration);

// ---------------------------------------------------------------------------
// Better Auth server configuration
// ---------------------------------------------------------------------------
write(
  'apps/api/src/auth/better-auth.ts',
  `import { betterAuth } from 'better-auth';\nimport { prismaAdapter } from 'better-auth/adapters/prisma';\nimport { username } from 'better-auth/plugins';\nimport type { DatabaseClient } from '../infrastructure/database/prisma.js';\nimport { env } from '../config/env.js';\n\nfunction resolveSecret() {\n  if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET;\n  if (env.NODE_ENV === 'production') {\n    throw new Error('BETTER_AUTH_SECRET is required in production');\n  }\n  return 'hooma-local-only-better-auth-secret-change-before-production';\n}\n\nfunction resolveBaseUrl() {\n  return env.AUTH_BASE_URL || env.APP_BASE_URL || \\`http://localhost:\\${env.PORT}\\`;\n}\n\nexport function buildAuth(db: DatabaseClient) {\n  return betterAuth({\n    appName: 'HOOMA',\n    baseURL: resolveBaseUrl(),\n    secret: resolveSecret(),\n    database: prismaAdapter(db, { provider: 'postgresql' }),\n    emailAndPassword: {\n      enabled: true,\n      minPasswordLength: 8,\n      maxPasswordLength: 128,\n    },\n    user: {\n      modelName: 'User',\n      fields: {\n        name: 'authName',\n        email: 'email',\n        emailVerified: 'emailVerified',\n        image: 'photoUrl',\n        createdAt: 'createdAt',\n        updatedAt: 'updatedAt',\n      },\n    },\n    session: { modelName: 'AuthSession' },\n    account: { modelName: 'AuthAccount' },\n    verification: { modelName: 'AuthVerification' },\n    trustedOrigins: env.APP_BASE_URL ? [env.APP_BASE_URL] : [],\n    plugins: [\n      username({\n        minUsernameLength: 3,\n        maxUsernameLength: 30,\n        schema: {\n          user: {\n            fields: {\n              username: 'authUsername',\n              displayUsername: 'displayAuthUsername',\n            },\n          },\n        },\n      }),\n    ],\n  });\n}\n\nexport type HoomaAuth = ReturnType<typeof buildAuth>;\n`,
);

// ---------------------------------------------------------------------------
// Environment: no Google/OAuth variables in Phase D.
// ---------------------------------------------------------------------------
replaceOnce(
  'apps/api/src/config/env.ts',
  `  APP_BASE_URL: z.string().url().optional(),\n  DATABASE_URL: z.string().min(1),`,
  `  APP_BASE_URL: z.string().url().optional(),\n  AUTH_BASE_URL: z.string().url().optional(),\n  BETTER_AUTH_SECRET: z.string().min(32).optional(),\n  DATABASE_URL: z.string().min(1),`,
);

// ---------------------------------------------------------------------------
// Identity repository gets a canonical identity lookup for cookie sessions.
// ---------------------------------------------------------------------------
replaceOnce(
  'apps/api/src/modules/identity/application/identity-repository.ts',
  `  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;\n  getMe(userId: string): Promise<unknown>;`,
  `  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;\n  getIdentityUser(userId: string): Promise<IdentityUser | null>;\n  getMe(userId: string): Promise<unknown>;`,
);

replaceOnce(
  'apps/api/src/modules/identity/application/identity.service.ts',
  `  getMe(userId: string) {\n    return this.repo.getMe(userId);\n  }`,
  `  getIdentityUser(userId: string) {\n    return this.repo.getIdentityUser(userId);\n  }\n  getMe(userId: string) {\n    return this.repo.getMe(userId);\n  }`,
);

replaceOnce(
  'apps/api/src/modules/identity/infrastructure/prisma-identity.repository.ts',
  `  getMe(userId: string) {\n    return this.db.user.findUniqueOrThrow({`,
  `  getIdentityUser(userId: string) {\n    return this.db.user.findUnique({\n      where: { id: userId, deletedAt: null },\n      select: {\n        id: true,\n        telegramUserId: true,\n        username: true,\n        firstName: true,\n        lastName: true,\n        photoUrl: true,\n        languageCode: true,\n        isPremium: true,\n      },\n    });\n  }\n\n  getMe(userId: string) {\n    return this.db.user.findUniqueOrThrow({`,
);

// ---------------------------------------------------------------------------
// Build auth once in the application container so handler and middleware share it.
// ---------------------------------------------------------------------------
replaceOnce(
  'apps/api/src/bootstrap/container.ts',
  `import { buildDatabase } from '../infrastructure/database/prisma.js';`,
  `import { buildDatabase } from '../infrastructure/database/prisma.js';\nimport { buildAuth } from '../auth/better-auth.js';`,
);
replaceOnce(
  'apps/api/src/bootstrap/container.ts',
  `  const db = buildDatabase();\n  const uow = new PrismaUnitOfWork(db);`,
  `  const db = buildDatabase();\n  const auth = buildAuth(db);\n  const uow = new PrismaUnitOfWork(db);`,
);
replaceOnce(
  'apps/api/src/bootstrap/container.ts',
  `  return {\n    db,\n    uow,`,
  `  return {\n    db,\n    auth,\n    uow,`,
);

// ---------------------------------------------------------------------------
// Hybrid request authentication: Telegram header first; otherwise cookie session.
// ---------------------------------------------------------------------------
write(
  'apps/api/src/http/middleware/auth.ts',
  `import { deepSnakeToCamelObjKeys, parse, validate } from '@tma.js/init-data-node';\nimport { fromNodeHeaders } from 'better-auth/node';\nimport type { NextFunction, Request, Response } from 'express';\nimport { env } from '../../config/env.js';\nimport { AppError } from '../errors/app-error.js';\nimport type { HoomaAuth } from '../../auth/better-auth.js';\nimport type { IdentityService } from '../../modules/identity/application/identity.service.js';\nimport type { IdentityUser, TelegramIdentityInput } from '../../modules/identity/domain/types.js';\n\nexport interface AuthContext {\n  user: IdentityUser;\n  provider: 'telegram' | 'session' | 'dev';\n  rawInitData?: string;\n  telegramUser?: {\n    id: string;\n    username?: string;\n    firstName?: string;\n    lastName?: string;\n  };\n}\n\nexport interface AuthenticatedRequest extends Request {\n  auth: AuthContext;\n}\n\nexport interface HybridAuthOptions {\n  optional?: boolean;\n}\n\nexport function getAuth(req: Request): AuthContext {\n  const auth = (req as Request & { auth?: AuthContext }).auth;\n  if (!auth) {\n    throw new AppError(401, 'AUTH_REQUIRED', 'Authentication required');\n  }\n  return auth;\n}\n\ninterface TelegramIdentityFields {\n  username?: string | undefined;\n  firstName?: string | undefined;\n  lastName?: string | undefined;\n  photoUrl?: string | undefined;\n  languageCode?: string | undefined;\n  isPremium?: boolean | undefined;\n}\n\nfunction telegramIdentityInput(\n  telegramUserId: string,\n  user: TelegramIdentityFields,\n): TelegramIdentityInput {\n  return {\n    telegramUserId,\n    ...(user.username !== undefined ? { username: user.username } : {}),\n    ...(user.firstName !== undefined ? { firstName: user.firstName } : {}),\n    ...(user.lastName !== undefined ? { lastName: user.lastName } : {}),\n    ...(user.photoUrl !== undefined ? { photoUrl: user.photoUrl } : {}),\n    ...(user.languageCode !== undefined ? { languageCode: user.languageCode } : {}),\n    ...(user.isPremium !== undefined ? { isPremium: user.isPremium } : {}),\n  };\n}\n\nfunction telegramUserContext(\n  telegramUserId: string,\n  user: Pick<TelegramIdentityFields, 'username' | 'firstName' | 'lastName'>,\n): NonNullable<AuthContext['telegramUser']> {\n  return {\n    id: telegramUserId,\n    ...(user.username !== undefined ? { username: user.username } : {}),\n    ...(user.firstName !== undefined ? { firstName: user.firstName } : {}),\n    ...(user.lastName !== undefined ? { lastName: user.lastName } : {}),\n  };\n}\n\nfunction authError(res: Response, code: 'AUTH_REQUIRED' | 'AUTH_INVALID', message: string) {\n  return res.status(401).json({\n    error: {\n      code,\n      message,\n      requestId: String(res.locals.requestId || 'unknown'),\n    },\n  });\n}\n\nasync function authenticateTelegram(req: Request, identity: IdentityService) {\n  const authorization = req.header('authorization') || '';\n  const [scheme = '', rawInitData = ''] = authorization.split(' ', 2);\n  if (scheme.toLowerCase() !== 'tma' || !rawInitData) {\n    throw new Error('Invalid Telegram authentication credentials');\n  }\n\n  validate(rawInitData, env.TELEGRAM_BOT_TOKEN, {\n    expiresIn: env.INIT_DATA_MAX_AGE_SECONDS,\n  });\n  const initData = deepSnakeToCamelObjKeys(parse(rawInitData));\n  const tgUser = initData.user;\n  if (!tgUser) throw new Error('Telegram user missing from initData');\n\n  const telegramUserId = String(tgUser.id);\n  const user = await identity.upsertTelegramUser(telegramIdentityInput(telegramUserId, tgUser));\n  return {\n    user,\n    provider: 'telegram' as const,\n    rawInitData,\n    telegramUser: telegramUserContext(telegramUserId, tgUser),\n  };\n}\n\nexport function hybridAuth(\n  identity: IdentityService,\n  auth: HoomaAuth,\n  options: HybridAuthOptions = {},\n) {\n  return async (req: Request, res: Response, next: NextFunction) => {\n    try {\n      if (env.NODE_ENV !== 'production' && env.DEV_AUTH_BYPASS) {\n        const telegramUserId = String(\n          req.header('x-dev-telegram-user-id') || env.DEV_TELEGRAM_USER_ID,\n        );\n        const user = await identity.upsertTelegramUser({\n          telegramUserId,\n          username: \\`dev_\\${telegramUserId}\\`,\n          firstName: 'Dev',\n          lastName: 'HOOMA',\n        });\n        (req as AuthenticatedRequest).auth = {\n          user,\n          provider: 'dev',\n          telegramUser: { id: telegramUserId, firstName: 'Dev', lastName: 'HOOMA' },\n        };\n        return next();\n      }\n\n      // Preserve Phase B behavior: if an Authorization header is supplied it must\n      // be valid Telegram initData. Never silently fall back to a web cookie.\n      if (req.header('authorization')) {\n        (req as AuthenticatedRequest).auth = await authenticateTelegram(req, identity);\n        return next();\n      }\n\n      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });\n      if (session?.user?.id) {\n        const user = await identity.getIdentityUser(session.user.id);\n        if (!user) return authError(res, 'AUTH_INVALID', 'Invalid authentication session');\n        (req as AuthenticatedRequest).auth = { user, provider: 'session' };\n        return next();\n      }\n\n      if (options.optional) return next();\n      return authError(res, 'AUTH_REQUIRED', 'Authentication required');\n    } catch {\n      return authError(res, 'AUTH_INVALID', 'Invalid or expired authentication credentials');\n    }\n  };\n}\n`,
);

// ---------------------------------------------------------------------------
// Express 5: Better Auth handler before express.json(); cookies require CORS creds.
// ---------------------------------------------------------------------------
write(
  'apps/api/src/bootstrap/app.ts',
  `import express from 'express';\nimport cors, { type CorsOptions } from 'cors';\nimport helmet from 'helmet';\nimport { toNodeHandler } from 'better-auth/node';\nimport type { AppContainer } from './container.js';\nimport { env } from '../config/env.js';\nimport { requestId } from '../http/middleware/request-id.js';\nimport { errorHandler } from '../http/middleware/error-handler.js';\nimport { hybridAuth } from '../http/middleware/auth.js';\nimport { rateLimit } from '../http/middleware/rate-limit.js';\nimport { v1Router } from '../http/v1/router.js';\nimport { telegramWebhookRouter } from '../modules/payments/http/telegram-webhook.controller.js';\n\nfunction corsOptions(): CorsOptions {\n  if (env.NODE_ENV !== 'production') return { origin: true, credentials: true };\n\n  return {\n    credentials: true,\n    origin(origin, callback) {\n      if (!origin) return callback(null, true);\n      if (!env.APP_BASE_URL) return callback(null, false);\n      return callback(null, origin === env.APP_BASE_URL);\n    },\n  };\n}\n\nexport function buildApp(container: AppContainer) {\n  const app = express();\n  app.disable('x-powered-by');\n  app.set('json replacer', (_key: string, value: unknown) =>\n    typeof value === 'bigint' ? value.toString() : value,\n  );\n  app.use(helmet());\n  app.use(cors(corsOptions()));\n\n  // Express 5 catch-all. Better Auth must receive the raw request before JSON parsing.\n  app.all('/api/auth/*splat', toNodeHandler(container.auth));\n\n  app.use(express.json({ limit: '256kb' }));\n  app.use(requestId);\n  app.get('/health', (_req, res) => res.json({ ok: true, service: 'hooma-api' }));\n  app.use(\n    '/webhooks/telegram',\n    telegramWebhookRouter(container.services.payments, container.telegram),\n  );\n  app.use(\n    '/api/v1',\n    rateLimit(container.rateLimitStore, { scope: 'api', windowMs: 60_000, max: 180 }),\n    hybridAuth(container.services.identity, container.auth, { optional: true }),\n    v1Router(container),\n  );\n  app.use(errorHandler);\n  return app;\n}\n`,
);

// ---------------------------------------------------------------------------
// CI needs a deterministic non-production auth secret for tests.
// ---------------------------------------------------------------------------
replaceOnce(
  '.github/workflows/ci.yml',
  `      TELEGRAM_WEBHOOK_SECRET: ci-placeholder\n      DEV_AUTH_BYPASS: 'false'`,
  `      TELEGRAM_WEBHOOK_SECRET: ci-placeholder\n      BETTER_AUTH_SECRET: ci-better-auth-secret-at-least-thirty-two-characters\n      AUTH_BASE_URL: http://localhost:3000\n      DEV_AUTH_BYPASS: 'false'`,
);

// ---------------------------------------------------------------------------
// Architecture regression test: canonical User owns Better Auth state.
// ---------------------------------------------------------------------------
write(
  'tests/hybrid-auth-schema.test.ts',
  `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport test from 'node:test';\n\nconst schema = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');\nconst authSource = fs.readFileSync('apps/api/src/auth/better-auth.ts', 'utf8');\n\ntest('Better Auth extends canonical User instead of creating a duplicate auth user', () => {\n  assert.match(schema, /model User \\{/);\n  assert.doesNotMatch(schema, /model (AuthUser|WebUser|TelegramUser) \\{/);\n  assert.match(schema, /authUsername\\s+String\\?/);\n  assert.match(schema, /authSessions\\s+AuthSession\\[\\]/);\n  assert.match(schema, /authAccounts\\s+AuthAccount\\[\\]/);\n  assert.match(authSource, /modelName: 'User'/);\n  assert.match(authSource, /emailAndPassword:\\s*\\{/);\n  assert.doesNotMatch(authSource, /socialProviders/);\n});\n`,
);

console.log('Phase D source changes applied.');
