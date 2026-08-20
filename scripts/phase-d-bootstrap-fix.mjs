import fs from 'node:fs';

const file = 'scripts/phase-d-apply.mjs';
let source = fs.readFileSync(file, 'utf8');

const telegramCompat = `export function telegramAuth(\\n  identity: IdentityService,\\n  options: HybridAuthOptions = {},\\n) {\\n  return async (req: Request, res: Response, next: NextFunction) => {\\n    const existing = (req as Request & { auth?: AuthContext }).auth;\\n    if (existing) return next();\\n\\n    try {\\n      if (env.NODE_ENV !== 'production' && env.DEV_AUTH_BYPASS) {\\n        const telegramUserId = String(\\n          req.header('x-dev-telegram-user-id') || env.DEV_TELEGRAM_USER_ID,\\n        );\\n        const user = await identity.upsertTelegramUser({\\n          telegramUserId,\\n          username: 'dev_' + telegramUserId,\\n          firstName: 'Dev',\\n          lastName: 'HOOMA',\\n        });\\n        (req as AuthenticatedRequest).auth = {\\n          user,\\n          provider: 'dev',\\n          telegramUser: { id: telegramUserId, firstName: 'Dev', lastName: 'HOOMA' },\\n        };\\n        return next();\\n      }\\n\\n      if (!req.header('authorization')) {\\n        if (options.optional) return next();\\n        return authError(res, 'AUTH_REQUIRED', 'Authentication required');\\n      }\\n\\n      (req as AuthenticatedRequest).auth = await authenticateTelegram(req, identity);\\n      return next();\\n    } catch {\\n      return authError(res, 'AUTH_INVALID', 'Invalid or expired authentication credentials');\\n    }\\n  };\\n}\\n\\nexport function hybridAuth(\\n`;

const replacements = [
  [
    '\\\\`http://localhost:\\\\${env.PORT}\\\\`',
    "'http://localhost:' + env.PORT",
  ],
  [
    'username: \\\\`dev_\\\\${telegramUserId}\\\\`,',
    "username: 'dev_' + telegramUserId,",
  ],
  [
    "import { betterAuth } from 'better-auth';\\n",
    "import { betterAuth, type BetterAuthOptions } from 'better-auth';\\n",
  ],
  [
    'export function buildAuth(db: DatabaseClient) {\\n',
    "export type HoomaAuth = ReturnType<typeof betterAuth>;\\n\\nexport function buildAuth(db: DatabaseClient): HoomaAuth {\\n",
  ],
  [
    "    ],\\n  });\\n}\\n\\nexport type HoomaAuth = ReturnType<typeof buildAuth>;\\n`,",
    "    ],\\n  } as BetterAuthOptions);\\n}\\n`,",
  ],
  ['export function hybridAuth(\\n', telegramCompat],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) {
    throw new Error(`Bootstrap syntax target not found: ${before}`);
  }
  source = source.replace(before, after);
}

const ciPatchStart = '// ---------------------------------------------------------------------------\n// CI needs a deterministic non-production auth secret for tests.';
const architectureTestStart = '// ---------------------------------------------------------------------------\n// Architecture regression test: canonical User owns Better Auth state.';
const start = source.indexOf(ciPatchStart);
const end = source.indexOf(architectureTestStart);
if (start < 0 || end < 0 || end <= start) {
  throw new Error('Could not isolate the temporary CI workflow patch block');
}
source = source.slice(0, start) + source.slice(end);

fs.writeFileSync(file, source);
console.log('Normalized Phase D helper, preserved Telegram auth, and removed workflow-file edits.');
