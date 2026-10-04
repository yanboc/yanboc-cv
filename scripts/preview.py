#!/usr/bin/env python3
"""本地预览服务：A4 翻页 + 所见即所得编辑保存。"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import posixpath
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
BEGIN = "<!-- CV_PAGES_BEGIN -->"
END = "<!-- CV_PAGES_END -->"

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}


def safe_join(base: Path, rel: str) -> Path | None:
    rel = unquote(rel).lstrip("/")
    if not rel or rel.endswith("/"):
        return None
    target = (base / rel).resolve()
    try:
        target.relative_to(base.resolve())
    except ValueError:
        return None
    return target if target.is_file() else None


def resolve(url_path: str) -> Path | None:
    path = posixpath.normpath(unquote(url_path))
    if path in ("/", "/index.html"):
        return WEB / "index.html"
    if path.startswith("/fonts/"):
        return safe_join(WEB, path.lstrip("/")) or safe_join(
            ROOT / "fonts", path[len("/fonts/") :]
        )
    return safe_join(WEB, path.lstrip("/"))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        target = resolve(parsed.path)
        if target is None or not target.exists():
            self.send_error(404, "Not Found")
            return
        data = target.read_bytes()
        mime = MIME.get(target.suffix.lower()) or mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/save-config":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("object required")
            except (ValueError, UnicodeDecodeError):
                self.send_error(400, "Invalid JSON object")
                return
            cfg_path = WEB / "cv-config.json"
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
            allowed = {"rhythm", "space"}
            for k, v in payload.items():
                if k in allowed:
                    cfg[k] = v
            cfg_path.write_text(
                json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            body = b'{"ok": true}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path != "/api/save-pages":
            self.send_error(404, "Not Found")
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
            html = payload["html"]
        except (ValueError, KeyError, UnicodeDecodeError):
            self.send_error(400, "Invalid JSON, expect {html: string}")
            return
        index = WEB / "index.html"
        text = index.read_text(encoding="utf-8")
        if BEGIN not in text or END not in text:
            self.send_error(500, "index.html missing page markers")
            return
        before, rest = text.split(BEGIN, 1)
        _, after = rest.split(END, 1)
        inner = (
            html.replace("<!-- CV_PAGES_BEGIN -->", "")
            .replace("<!-- CV_PAGES_END -->", "")
            .strip("\n")
        )
        new = f"{before}{BEGIN}\n{inner}\n{END}{after}"
        index.write_text(new, encoding="utf-8")
        body = b'{"ok": true}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    parser = argparse.ArgumentParser(description="yanboc-cv 本地预览")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-open", action="store_true", help="不自动打开浏览器")
    parser.add_argument("--edit", action="store_true", help="以编辑模式打开")
    args = parser.parse_args()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}/"
    if args.edit:
        url += "?edit=1"
    print(f"预览服务：{url}")
    print("左右方向键翻页；E 进入编辑；⌘S / Ctrl+S 保存")
    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        httpd.server_close()


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
