/**
 * Ship orchestrator: preflight → typecheck → vite build → verify dist → firebase deploy.
 *
 * Progress, timers, heartbeats, and optional debug logs so a long build does not look "stuck".
 *
 * Usage:
 *   npm run ship | ship:fast | ship:seo | ship:full | ship:debug | build
 *
 * Env: SHIP_DEBUG, SHIP_SKIP_TYPECHECK, SHIP_SKIP_DEPLOY, SHIP_HEAP_MB,
 *      PRERENDER_BLOG, PRERENDER_LANGS, PRERENDER_CONCURRENCY, SITE_HOST
 */
import { spawn } from 'node:child_process';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = process.cwd();
const LOG_DIR = join(ROOT, 'logs');
const MIN_NODE = 20;

const profile = (process.argv[2] || 'default').toLowerCase();
const debug =
  process.env.SHIP_DEBUG === '1' ||
  process.env.SHIP_DEBUG === 'true' ||
  profile === 'debug' ||
  process.argv.includes('--debug');

const profiles = {
  default: {
    label: 'ship',
    typecheck: true,
    deploy: true,
    env: {},
  },
  fast: {
    label: 'ship:fast',
    typecheck: false,
    deploy: true,
    env: {},
  },
  seo: {
    label: 'ship:seo',
    typecheck: true,
    deploy: true,
    env: { PRERENDER_BLOG: '1', PRERENDER_LANGS: 'en' },
  },
  full: {
    label: 'ship:full',
    typecheck: true,
    deploy: true,
    env: { PRERENDER_BLOG: '1', PRERENDER_LANGS: 'en,es,fr,hi' },
  },
  debug: {
    label: 'ship:debug',
    typecheck: true,
    deploy: true,
    env: {},
  },
  'build-only': {
    label: 'ship:build-only',
    typecheck: true,
    deploy: false,
    env: {},
  },
};

const cfg = profiles[profile] || profiles.default;
if (process.env.SHIP_SKIP_TYPECHECK === '1') cfg.typecheck = false;
if (process.env.SHIP_SKIP_DEPLOY === '1') cfg.deploy = false;

// ─── logging ───────────────────────────────────────────────────────────────

mkdirSync(LOG_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logPath = join(LOG_DIR, `ship-${cfg.label.replace(':', '-')}-${stamp}.log`);
const logStream = createWriteStream(logPath, { flags: 'a' });

const t0 = performance.now();
let phaseStart = t0;
let currentPhase = 'init';

function elapsed(ms = performance.now() - t0) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`;
}

function phaseElapsed() {
  return elapsed(performance.now() - phaseStart);
}

function line(kind, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const out = `[${ts}] [${kind}] ${msg}`;
  // eslint-disable-next-line no-console
  console.log(out);
  logStream.write(out + '\n');
}

function info(msg) {
  line('ship', msg);
}
function warn(msg) {
  line('warn', msg);
}
function err(msg) {
  line('error', msg);
}
function dbg(msg) {
  if (debug) line('debug', msg);
}

function banner(title) {
  const bar = '═'.repeat(64);
  info(bar);
  info(title);
  info(bar);
}

function phase(name) {
  if (currentPhase !== 'init') {
    info(`✓ phase "${currentPhase}" finished in ${phaseElapsed()} (total ${elapsed()})`);
  }
  currentPhase = name;
  phaseStart = performance.now();
  info(`→ phase: ${name}`);
}

// ─── node path (fnm) ───────────────────────────────────────────────────────

function findFnmNodeHome() {
  const fnmDir = process.env.FNM_DIR || join(homedir(), '.fnm');
  const versionsDir = join(fnmDir, 'node-versions');
  if (!existsSync(versionsDir)) return null;
  const candidates = readdirSync(versionsDir)
    .filter((n) => /^v\d+\.\d+\.\d+$/.test(n))
    .map((n) => {
      const m = n.match(/^v(\d+)\.(\d+)\.(\d+)$/);
      return {
        major: Number(m[1]),
        minor: Number(m[2]),
        patch: Number(m[3]),
        dir: join(versionsDir, n, 'installation'),
      };
    })
    .filter(
      (v) =>
        v.major >= MIN_NODE &&
        existsSync(join(v.dir, process.platform === 'win32' ? 'node.exe' : 'node'))
    )
    .sort((a, b) => b.major - a.major || b.minor - a.minor || b.patch - a.patch);
  return candidates[0]?.dir ?? null;
}

function ensureNodeEnv(baseEnv) {
  const major = Number(process.versions.node.split('.')[0]);
  const env = { ...baseEnv };
  if (major >= MIN_NODE) {
    info(`Node ${process.version} OK (>= ${MIN_NODE})`);
    return env;
  }
  const home = findFnmNodeHome();
  if (!home) {
    err(`Node ${process.version} is too old and fnm Node >= ${MIN_NODE} was not found.`);
    process.exit(1);
  }
  info(`System Node ${process.version} is too old → using ${home}`);
  env.PATH = `${home}${delimiter}${env.PATH || ''}`;
  env.npm_node_execpath = join(
    home,
    process.platform === 'win32' ? 'node.exe' : 'node'
  );
  return env;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function dirSizeMb(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else total += st.size;
    }
  };
  try {
    walk(dir);
  } catch {
    /* ignore */
  }
  return total / (1024 * 1024);
}

function countFiles(dir, pred = () => true) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (pred(name, p)) n++;
    }
  };
  try {
    walk(dir);
  } catch {
    /* ignore */
  }
  return n;
}

function adaptiveHeapMb() {
  if (process.env.SHIP_HEAP_MB) {
    const n = Number(process.env.SHIP_HEAP_MB);
    if (Number.isFinite(n) && n >= 1024) return Math.floor(n);
  }
  // 8192 OOM-thrashes 16GB Windows boxes with browsers open (~5GB free).
  // 4096 is the safe default; raise only if you have free RAM.
  return 4096;
}

function buildEnv(nodeEnv) {
  const heap = adaptiveHeapMb();
  const prevOpts = String(nodeEnv.NODE_OPTIONS || '')
    .split(/\s+/)
    .filter((t) => t && !t.startsWith('--max-old-space-size'));
  prevOpts.push(`--max-old-space-size=${heap}`);

  const env = {
    ...nodeEnv,
    ...cfg.env,
    NODE_OPTIONS: prevOpts.join(' '),
    // Always enable stage banners + 15s heartbeats inside vite.config.ts
    SHIP_PROGRESS: '1',
    FORCE_COLOR: process.env.FORCE_COLOR || '1',
  };

  if (debug) {
    env.SHIP_DEBUG = '1';
    // Extremely verbose — only with ship:debug
    env.DEBUG = process.env.DEBUG || 'vite:resolve,vite:load,vite:import,vite:transform,nitropack:*';
    env.VITE_CJS_TRACE = process.env.VITE_CJS_TRACE || '1';
    // Nitro log levels: 0 silent … 3 verbose (Analog defaults to 0)
    env.NITRO_LOG_LEVEL = process.env.NITRO_LOG_LEVEL || '3';
  } else {
    env.NITRO_LOG_LEVEL = process.env.NITRO_LOG_LEVEL || '1';
  }

  return { env, heap };
}

function quoteIfNeeded(s) {
  const str = String(s);
  if (process.platform !== 'win32') return str;
  // Paths like F:\My Data\... break when shell:true without quotes
  if (/[\s&()^]/.test(str) && !/^".*"$/.test(str)) return `"${str}"`;
  return str;
}

function run(cmd, args, { env, cwd = ROOT, label, useShell = false }) {
  return new Promise((resolvePromise, reject) => {
    info(`$ ${cmd} ${args.join(' ')}`);
    dbg(`cwd=${cwd}`);

    // Prefer shell:false so paths with spaces (e.g. F:\My Data\...) stay intact.
    // firebase CLI on Windows often needs shell:true (firebase.cmd).
    const child = spawn(cmd, args, {
      cwd,
      env,
      shell: useShell,
      windowsHide: true,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let lastOut = performance.now();
    let lineBuf = { out: '', err: '' };

    const heartbeat = setInterval(() => {
      const idle = Math.round((performance.now() - lastOut) / 1000);
      info(
        `… still running "${label}" | phase ${phaseElapsed()} | total ${elapsed()} | last output ${idle}s ago`
      );
      if (idle >= 120) {
        warn(
          `No output for ${idle}s. If Nitro already printed "successfully built", a leaked timer may be holding the process — pull latest ship-progress fix (interval.unref). Check node CPU; if ~0 for minutes, kill and retry.`
        );
      }
    }, 20_000);
    // Parent must stay alive until child exits, but unref is wrong here.
    // (Child vite timers must unref; this one must ref.)

    const onChunk = (streamName) => (buf) => {
      lastOut = performance.now();
      const text = buf.toString();
      process[streamName].write(text);
      logStream.write(text);
      // track incomplete lines for debug
      lineBuf[streamName === 'stdout' ? 'out' : 'err'] += text;
    };

    child.stdout?.on('data', onChunk('stdout'));
    child.stderr?.on('data', onChunk('stderr'));

    child.on('error', (e) => {
      clearInterval(heartbeat);
      reject(e);
    });

    child.on('close', (code, signal) => {
      clearInterval(heartbeat);
      if (code === 0) resolvePromise();
      else
        reject(
          new Error(
            `"${label}" failed with exit ${code}${signal ? ` signal=${signal}` : ''}`
          )
        );
    });
  });
}

function runNpm(script, env, label) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  // npm.cmd requires shell on Windows
  return run(npm, ['run', script], { env, label, useShell: true });
}

// ─── preflight ─────────────────────────────────────────────────────────────

function preflight(env, heap) {
  phase('preflight');
  banner(`SHIP  profile=${cfg.label}  debug=${debug}`);
  info(`Log file: ${logPath}`);
  info(`Node (orchestrator): ${process.version}  platform=${process.platform}`);
  info(`Heap for vite: ${heap} MB  (override with SHIP_HEAP_MB=)`);
  info(
    `Prerender: BLOG=${env.PRERENDER_BLOG || 'off'} LANGS=${env.PRERENDER_LANGS || '-'} CONCURRENCY=${env.PRERENDER_CONCURRENCY || '4 (vite default)'}`
  );

  const md = countFiles(join(ROOT, 'src', 'content'), (n) => n.endsWith('.md'));
  const images = countFiles(join(ROOT, 'public', 'assets', 'images'));
  info(`Content: ${md} markdown files | ${images} images under public/assets/images`);

  if (md > 500) {
    warn(
      `${md} markdown files means Analog eagerly builds a huge content-file list. ` +
        `Dev is client-only (fast). Production ship must SSR-compile that graph — expect 10–40+ minutes on 16GB Windows machines.`
    );
  }

  if (!cfg.env.PRERENDER_BLOG) {
    info(
      'Shell prerender only (/, /blog, …). Blog HTML is client-hydrated. Use ship:seo for EN post HTML.'
    );
  } else {
    warn(
      'Blog prerender ON — each post is SSR-rendered at build time. Much slower; more memory.'
    );
  }

  // rough free memory via free command is hard on Windows; warn generically
  if (heap >= 8192) {
    warn(
      'SHIP_HEAP_MB>=8192: on machines with ~16GB RAM this often causes thrashing/OOM. Prefer 4096.'
    );
  }

  if (!existsSync(join(ROOT, 'firebase.json'))) {
    err('firebase.json missing');
    process.exit(1);
  }

  const pub = join(ROOT, 'dist', 'analog', 'public');
  if (existsSync(pub)) {
    info(`Existing dist/analog/public: ${dirSizeMb(pub).toFixed(1)} MB (will be replaced)`);
  }

  writeFileSync(
    join(LOG_DIR, 'ship-last-preflight.json'),
    JSON.stringify(
      {
        when: new Date().toISOString(),
        profile: cfg.label,
        debug,
        heap,
        node: process.version,
        md,
        images,
        env: {
          PRERENDER_BLOG: env.PRERENDER_BLOG || null,
          PRERENDER_LANGS: env.PRERENDER_LANGS || null,
          NITRO_LOG_LEVEL: env.NITRO_LOG_LEVEL || null,
        },
      },
      null,
      2
    )
  );
  info('Preflight OK');
}

function verifyDist() {
  phase('verify-dist');
  const pub = join(ROOT, 'dist', 'analog', 'public');
  if (!existsSync(pub)) {
    throw new Error(`Missing ${pub} — vite build did not produce static hosting output`);
  }
  const index = join(pub, 'index.html');
  if (!existsSync(index)) {
    throw new Error(`Missing ${index}`);
  }
  const size = dirSizeMb(pub);
  const html = countFiles(pub, (n) => n.endsWith('.html'));
  const assets = countFiles(join(pub, 'assets'));
  info(`dist/analog/public = ${size.toFixed(1)} MB | ${html} html | ${assets} asset files`);
  if (size < 1) {
    throw new Error('dist/analog/public is suspiciously small');
  }

  // Blog bodies load at runtime from prebuilt JSON (content-cache plugin).
  // If these are missing on Hosting, Firebase SPA rewrite returns index.html
  // and every post page is blank.
  const blogDataA = join(pub, 'assets', 'blog-data', 'posts');
  const blogDataB = join(pub, 'blog-data', 'posts');
  const blogDataRoot = existsSync(blogDataA) ? blogDataA : blogDataB;
  if (!existsSync(blogDataRoot)) {
    throw new Error(
      `Missing ${blogDataA} — run "npm run content:cache" then rebuild. ` +
        `Without these JSON files, production blog posts cannot render.`
    );
  }
  const blogJson = countFiles(blogDataRoot, (n) => n.endsWith('.json'));
  info(`blog-data JSON files: ${blogJson} under ${blogDataRoot.replace(ROOT, '.')}`);
  if (blogJson < 50) {
    throw new Error(
      `Only ${blogJson} blog-data JSON files found (expected hundreds). Aborting deploy.`
    );
  }
  const metaPath = existsSync(join(pub, 'assets', 'blog-data', 'meta.json'))
    ? join(pub, 'assets', 'blog-data', 'meta.json')
    : join(pub, 'blog-data', 'meta.json');
  if (existsSync(metaPath)) {
    info(`blog-data meta present`);
  }

  info('Dist verify OK');
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const nodeEnv = ensureNodeEnv({ ...process.env });
  const { env, heap } = buildEnv(nodeEnv);

  preflight(env, heap);

  if (cfg.typecheck) {
    phase('typecheck');
    await runNpm('typecheck', env, 'typecheck');
  } else {
    info('Skipping typecheck (profile / SHIP_SKIP_TYPECHECK)');
  }

  phase('vite-build');
  info(
    'Vite production build starting. Quiet stretches of 1–5 min are common while Angular/SSR graph loads ~1000 content modules.'
  );
  // Call vite directly so we can pass --debug / logLevel without nesting npm scripts.
  const viteBin = join(
    ROOT,
    'node_modules',
    'vite',
    'bin',
    'vite.js'
  );
  const nodeExec =
    env.npm_node_execpath ||
    process.execPath;
  const viteArgs = [viteBin, 'build', '--mode', 'production'];
  if (debug) {
    viteArgs.push('--debug');
    viteArgs.push('--logLevel', 'info');
  } else {
    viteArgs.push('--logLevel', 'info');
  }

  // shell:false + absolute paths handles "My Data" spaces on Windows
  await run(nodeExec, viteArgs, { env, label: 'vite build', useShell: false });

  verifyDist();

  if (cfg.deploy) {
    phase('firebase-deploy');
    const fbCmd = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
    const fbArgs = ['deploy', '--only', 'hosting', '--non-interactive'];
    if (debug) fbArgs.push('--debug');
    await run(fbCmd, fbArgs, { env, label: 'firebase deploy', useShell: true });
  } else {
    info('Skipping deploy (SHIP_SKIP_DEPLOY or build-only profile)');
  }

  phase('done');
  banner(`SHIP COMPLETE  profile=${cfg.label}  total=${elapsed()}`);
  info(`Full log: ${logPath}`);
  logStream.end();
}

main().catch((e) => {
  err(String(e?.stack || e));
  err(`Failed during phase "${currentPhase}" after ${elapsed()} — see ${logPath}`);
  err(
    'Hints: free RAM, npm run ship:fast, SHIP_HEAP_MB=3072, or npm run ship:debug.'
  );
  logStream.end();
  process.exit(1);
});
