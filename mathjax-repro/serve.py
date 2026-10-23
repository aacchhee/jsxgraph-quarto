#!/usr/bin/env python3
"""Serve this folder. /isolated.html gets COOP/COEP (cross-origin isolation);
/plain.html is served without them. Usage: python3 serve.py [port]"""
import http.server, sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.split('?')[0] == '/isolated.html':
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
            self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # Lets the opaque frame (origin null) load and fetch files from this server.
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
