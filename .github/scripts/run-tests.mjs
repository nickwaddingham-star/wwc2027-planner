// Serves the site, opens both test pages in a headless browser and fails if any test fails.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright-core";

const root = resolve(process.cwd()) + sep;
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname).replace(/^\//, "") || "index.html";
    const file = resolve(root, path);
    const type = types[extname(file).toLowerCase()];
    if (!file.startsWith(root) || !type) throw new Error("not served");
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome" });
let failed = false;

for (const name of ["tests.html", "screens.html"]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Outside requests (fonts) get an empty reply, so the result never depends on another website.
  await context.route(url => !url.href.startsWith(base) && url.protocol.startsWith("http"),
    route => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });

  console.log(`\n${name}`);
  try {
    await page.goto(base + name);
    await page.waitForFunction(() => window.WWC && window.WWC.testResults, null, { timeout: 180000 });
    const results = await page.evaluate(() => window.WWC.testResults);
    console.log(`${results.passed} of ${results.total} tests passed`);
    results.failures.forEach(f => console.error(`FAIL: ${f.name} (${f.problem})`));
    if (!results.total || results.failures.length) failed = true;
  } catch (error) {
    console.error(`FAIL: the tests did not finish (${error.message})`);
    failed = true;
  }
  if (errors.length) {
    console.error("Errors on the page:\n" + errors.join("\n"));
    failed = true;
  }
  await context.close();
}

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
