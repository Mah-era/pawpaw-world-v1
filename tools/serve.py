#!/usr/bin/env python3
"""Dev server for PawPaw-World-3D-v1 — http.server with caching disabled.

Also exposes POST /save?name=<file> which writes the raw request body into
assets/report/images/<file> — used by the in-browser screenshot capture to persist
real game frames to disk (so they can be inlined into the HTML report).
"""
import http.server
import os
import sys
import urllib.parse

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET_DIR = os.path.join(ROOT_DIR, "assets", "report", "images")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/save":
            qs = urllib.parse.parse_qs(parsed.query)
            name = (qs.get("name") or ["frame.jpg"])[0]
            name = os.path.basename(name)  # no path traversal
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            os.makedirs(ASSET_DIR, exist_ok=True)
            with open(os.path.join(ASSET_DIR, name), "wb") as f:
                f.write(data)
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8741
    http.server.ThreadingHTTPServer(("", port), Handler).serve_forever()
