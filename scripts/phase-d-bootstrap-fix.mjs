import fs from 'node:fs';

const file = 'scripts/phase-d-apply.mjs';
let source = fs.readFileSync(file, 'utf8');

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
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) {
    throw new Error(`Bootstrap syntax target not found: ${before}`);
  }
  source = source.replace(before, after);
}

fs.writeFileSync(file, source);
console.log('Normalized Phase D helper syntax and Better Auth public option typing.');
