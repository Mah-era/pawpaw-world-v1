#!/usr/bin/env python3
"""Tiny one-off receiver: accepts POSTed data-URL JPEGs and writes them into
assets/report/images/. Used only to re-capture report screenshots from the
running game; safe to delete afterwards."""
import base64
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_OUT = os.path.join(ROOT, "assets", "report", "images")
VID_OUT = os.path.join(ROOT, "assets", "report", "videos")


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        q = parse_qs(urlparse(self.path).query)
        name = (q.get("name", ["shot"])[0]).replace("/", "_")
        kind = q.get("kind", ["img"])[0]
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", "ignore")
        if "," in body:
            body = body.split(",", 1)[1]
        data = base64.b64decode(body)
        if kind == "video":
            path = os.path.join(VID_OUT, name + ".webm")
        else:
            path = os.path.join(IMG_OUT, name + ".jpg")
        with open(path, "wb") as f:
            f.write(data)
        print("wrote", path, len(data), "bytes")
        self.send_response(200)
        self._cors()
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8799
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
