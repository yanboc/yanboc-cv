#!/usr/bin/env node
/**
 * 将 web/index.html 的每一页 A4 打成矢量 PDF（Chromium 打印通道，保留文字与超链接）。
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "web");
const BEGIN = "<!-- CV_PAGES_BEGIN -->";
const END = "<!-- CV_PAGES_END -->";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

function mapUrl(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  if (clean === "/" || clean === "/index.html") return path.join(WEB, "index.html");
  const rel = clean.replace(/^\//, "");
  const inWeb = path.resolve(WEB, rel);
  if (inWeb.startsWith(path.resolve(WEB)) && fs.existsSync(inWeb) && fs.statSync(inWeb).isFile()) {
    return inWeb;
  }
  if (clean.startsWith("/fonts/")) {
    const target = path.resolve(path.join(ROOT, "fonts"), clean.slice("/fonts/".length));
    if (target.startsWith(path.resolve(path.join(ROOT, "fonts")))) return target;
  }
  if (inWeb.startsWith(path.resolve(WEB))) return inWeb;
  return null;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const target = mapUrl(req.url || "/");
      if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(target).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function loadChromium() {
  try {
    const { chromium } = await import("playwright");
    return chromium;
  } catch {
    console.error("未安装 Playwright。请先在仓库根目录执行：");
    console.error("  npm install");
    console.error("  npx playwright install chromium");
    process.exit(1);
  }
}

function countPages() {
  const html = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
  const inner = html.split(BEGIN)[1]?.split(END)[0] || "";
  return (inner.match(/class="page(?:\s|")/g) || []).length;
}

async function main() {
  const outDir = path.join(ROOT, "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "cv.pdf");
  const expected = countPages();
  const chromium = await loadChromium();
  const { server, port } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () => document.documentElement.dataset.packed === "1",
      { timeout: 15000 }
    );
    const livePages = await page.$$eval(".page", (els) => els.length);
    console.log(`DOM .page 个数：${livePages}`);
    await page.addStyleTag({
      content: `.hud{display:none !important} .page{transform:none !important;display:block !important;}`,
    });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: outPath,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await browser.close();
    server.close();
  }
  const stat = fs.statSync(outPath);
  console.log(`PDF: ${outPath} (${stat.size} bytes)`);
  console.log(`HTML .page：${expected}（DOM：见上方 live 计数）`);
  console.log("引擎：Chromium 打印，文字为矢量；<a href> 会保留为 PDF 链接。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
