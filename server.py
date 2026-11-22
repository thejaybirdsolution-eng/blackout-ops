#!/usr/bin/env python3
"""
BLACKOUT OPS — Offline Local HTTP Launcher
Serves the game locally with zero external dependencies and clean caching headers.
Usage:
    python server.py            # Starts server and opens browser
    python server.py --no-open  # Starts server without launching a browser window
    python server.py --port 8765
"""
import argparse
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress noisy routine asset request logs unless error status
        if args and len(args) >= 2 and str(args[1]).startswith(("4", "5")):
            super().log_message(format, *args)


class ReusableThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def find_free_port(preferred_port: int) -> int:
    for p in range(preferred_port, preferred_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    parser = argparse.ArgumentParser(description="BLACKOUT OPS offline local server")
    parser.add_argument("--port", type=int, default=8765, help="Preferred starting port")
    parser.add_argument("--no-open", action="store_true", help="Do not open browser automatically")
    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.abspath(__file__))
    port = find_free_port(args.port)
    url = f"http://127.0.0.1:{port}/index.html"

    def handler(*h_args, **h_kwargs):
        return NoCacheHandler(*h_args, directory=root_dir, **h_kwargs)

    with ReusableThreadingTCPServer(("127.0.0.1", port), handler) as httpd:
        print(f"[BLACKOUT OPS] Offline server running at {url}")
        print("[BLACKOUT OPS] Press Ctrl+C to stop.")
        if not args.no_open:
            threading.Timer(0.45, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[BLACKOUT OPS] Shutting down.")
            sys.exit(0)


if __name__ == "__main__":
    main()
