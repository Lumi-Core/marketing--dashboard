"""
Simple development server for the Marketing Campaign Agent Dashboard.
Serves static files with CORS headers for local development.

Usage:
    python dashboard/serve.py [--port 3001]
"""
import http.server
import os
import sys
import argparse

PORT = 3001
DASHBOARD_DIR = os.path.dirname(os.path.abspath(__file__))


class CORSHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that adds CORS headers for local dev."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DASHBOARD_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # Colour-coded logging
        status = args[1] if len(args) > 1 else ""
        colour = "\033[32m" if str(status).startswith("2") else "\033[33m"
        reset = "\033[0m"
        sys.stderr.write(f"{colour}[dashboard]{reset} {args[0]}\n")


def main():
    parser = argparse.ArgumentParser(description="Marketing Dashboard Dev Server")
    parser.add_argument("--port", type=int, default=PORT, help=f"Port to serve on (default {PORT})")
    args = parser.parse_args()

    with http.server.HTTPServer(("0.0.0.0", args.port), CORSHandler) as httpd:
        url = f"http://localhost:{args.port}"
        print(f"\n  \033[1;32m✓ Marketing Dashboard running at {url}\033[0m\n")
        print(f"  Serving files from: {DASHBOARD_DIR}")
        print(f"  Press Ctrl+C to stop.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Dashboard server stopped.")


if __name__ == "__main__":
    main()
