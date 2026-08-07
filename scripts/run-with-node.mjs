/**
 * Run a command on Node >= 20. Auto-switches to fnm Node 20+ if the shell
 * still resolves system Node 16.
 *
 * Usage:
 *   node scripts/run-with-node.mjs -- node scripts/ship.mjs fast
 *   node scripts/run-with-node.mjs -- npm run typecheck
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

const MIN_MAJOR = 20;
const raw = process.argv.slice(2);
const argv = raw[0] === '--' ? raw.slice(1) : raw;

if (!argv.length) {
  console.error(
    '[node] Usage: node scripts/run-with-node.mjs -- <command> [args...]\n' +
      '  example: node scripts/run-with-node.mjs -- node scripts/ship.mjs fast'
  );
  process.exit(1);
}

function findFnmNodeInstallDir() {
  const fnmDir = process.env.FNM_DIR || join(homedir(), '.fnm');
  const versionsDir = join(fnmDir, 'node-versions');
  if (!existsSync(versionsDir)) return null;

  const candidates = readdirSync(versionsDir)
    .filter((name) => /^v\d+\.\d+\.\d+$/.test(name))
    .map((name) => {
      const m = name.match(/^v(\d+)\.(\d+)\.(\d+)$/);
      return {
        major: Number(m[1]),
        minor: Number(m[2]),
        patch: Number(m[3]),
        dir: join(versionsDir, name, 'installation'),
      };
    })
    .filter(
      (v) =>
        v.major >= MIN_MAJOR &&
        existsSync(join(v.dir, process.platform === 'win32' ? 'node.exe' : 'node'))
    )
    .sort((a, b) => b.major - a.major || b.minor - a.minor || b.patch - a.patch);

  return candidates[0]?.dir ?? null;
}

function run(env) {
  const [cmd, ...args] = argv;
  // Resolve "node" to the env's node when we switched via fnm
  const resolvedCmd =
    cmd === 'node' && env.npm_node_execpath ? env.npm_node_execpath : cmd;

  const result = spawnSync(resolvedCmd, args, {
    stdio: 'inherit',
    env,
    cwd: process.cwd(),
    shell: process.platform === 'win32' && cmd !== 'node',
  });
  process.exit(result.status ?? 1);
}

const major = Number(process.versions.node.split('.')[0]);
const label = argv.join(' ');

if (major >= MIN_MAJOR) {
  console.log(`[node] ${process.version} OK — ${label}`);
  run(process.env);
}

const nodeHome = findFnmNodeInstallDir();
if (nodeHome) {
  console.log(
    `[node] System Node is ${process.version} (too old). Auto-switching to:\n  ${nodeHome}\n`
  );
  const env = { ...process.env };
  env.PATH = `${nodeHome}${delimiter}${env.PATH || ''}`;
  env.npm_node_execpath = join(
    nodeHome,
    process.platform === 'win32' ? 'node.exe' : 'node'
  );
  run(env);
}

console.error(`
[node] Node ${process.version} is too old, and no Node >= ${MIN_MAJOR} was found via fnm.
  Install: fnm install 20 && fnm use 20
`);
process.exit(1);
