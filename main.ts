// main.ts — the hand-in program for the Dapur Kilat cooking game (Node 22,
// standard library only). It copies the static game and the screenshots from
// beside this file into the output directory and writes dossier.json with
// the vendored make.fun library, exactly as the gate expects.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');
const gameDst = join(outDir, 'game');
const shotsDst = join(outDir, 'screenshots');

// Fail loudly instead of handing in half an entry: the game is nothing
// without its index.html, and screenshots are what the judge sees first.
if (!existsSync(join(gameSrc, 'index.html'))) {
  throw new Error('game/index.html is missing; refusing to hand in an empty game.');
}
if (!existsSync(shotsSrc)) {
  throw new Error('screenshots/ is missing; the judge needs real renders of the game.');
}

// Start from a clean output directory so a second run writes the same bytes
// as the first (the grader runs this program twice and compares them).
mkdirSync(outDir, { recursive: true });
rmSync(gameDst, { recursive: true, force: true });
rmSync(shotsDst, { recursive: true, force: true });
cpSync(gameSrc, gameDst, { recursive: true });
mkdirSync(shotsDst, { recursive: true });
if (existsSync(shotsSrc)) cpSync(shotsSrc, shotsDst, { recursive: true });

// Caps from the gate: at most 4 screenshots of 256 KiB, at most 993 files
// and 48 MiB under game/, paths under game/ at most 1000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('Dapur Kilat handed in: game/ and screenshots/ copied to ' + outDir);
