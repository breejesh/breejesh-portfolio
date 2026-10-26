const http = require('http');
const fs = require('fs');
const path = require('path');

function findAndRequire(modName) {
  try {
    return require(modName);
  } catch (e) {}

  const searchRoots = [
    process.cwd(),
    __dirname,
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../../..'),
    path.resolve('F:\\My Data\\Academic\\GaTech\\AIC\\02-Assignments\\Assignment M2'),
    path.resolve('F:\\My Data\\Academic\\GaTech\\AIC\\02-Assignments\\Assignment M2\\archive'),
    process.env.APPDATA ? path.join(process.env.APPDATA, 'npm', 'node_modules') : null
  ].filter(Boolean);

  for (const root of searchRoots) {
    const candidate = path.join(root, 'node_modules', modName);
    if (fs.existsSync(candidate)) {
      try {
        return require(candidate);
      } catch (e) {}
    }
  }
  return null;
}

const puppeteer = findAndRequire('puppeteer-core') || findAndRequire('puppeteer');
if (!puppeteer) {
  console.error("Puppeteer not found. Please install puppeteer-core or puppeteer (npm i puppeteer-core).");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node export_to_png.js <input.excalidraw> <output.png> [port]");
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);
const PORT = parseInt(args[2], 10) || 8899;

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const scriptDir = __dirname;
const htmlHarness = path.join(scriptDir, 'render_excal.html');

const server = http.createServer((req, res) => {
  let urlClean = req.url.split('?')[0];

  let filePath;
  if (urlClean === '/' || urlClean.startsWith('/render_excal.html')) {
    filePath = htmlHarness;
  } else if (urlClean === '/target.excalidraw') {
    filePath = inputPath;
  } else {
    // Check scriptDir, process.cwd(), or Assignment M2 for node_modules
    filePath = path.join(scriptDir, urlClean);
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(path.join(process.cwd(), urlClean));
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(path.join('F:\\My Data\\Academic\\GaTech\\AIC\\02-Assignments\\Assignment M2', urlClean));
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(path.join('F:\\My Data\\Academic\\GaTech\\AIC\\02-Assignments\\Assignment M2\\archive', urlClean));
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html';
    else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) contentType = 'application/javascript';
    else if (filePath.endsWith('.json') || filePath.endsWith('.excalidraw')) contentType = 'application/json';
    else if (filePath.endsWith('.png')) contentType = 'image/png';
    else if (filePath.endsWith('.woff2')) contentType = 'font/woff2';

    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Render server listening on http://127.0.0.1:${PORT}`);
  
  // Find Chrome executable on Windows/Mac/Linux
  let chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (!fs.existsSync(chromePath) && process.env.CHROME_BIN) {
    chromePath = process.env.CHROME_BIN;
  }

  try {
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 2400, height: 1400, deviceScaleFactor: 3 });

    console.log(`Loading diagram from ${inputPath}...`);
    await page.goto(`http://127.0.0.1:${PORT}/render_excal.html?file=/target.excalidraw`, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#RENDER_COMPLETE', { timeout: 15000 });

    const svgElement = await page.$('svg');
    if (svgElement) {
      await svgElement.screenshot({ path: outputPath });
      const stats = fs.statSync(outputPath);
      console.log(`Successfully exported: ${outputPath} (${stats.size} bytes)`);
    } else {
      console.error("SVG element was not found in rendered DOM.");
    }

    await browser.close();
  } catch (err) {
    console.error("Export error:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});
