"""Serve the public Studio files locally using only Python's standard library."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
PUBLIC_EXTENSIONS = {'.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico',
                     '.woff', '.woff2', '.css', '.js'}


def create_server(host='127.0.0.1', port=8000, root=ROOT):
    """Expose only index.html and public assets, never the project directory."""
    public_root = Path(root).resolve()
    assets_root = public_root / 'assets'

    class StudioHandler(BaseHTTPRequestHandler):
        def public_file(self):
            try:
                path = unquote(urlsplit(self.path).path, errors='strict')
                if path in ('/', '/index.html'):
                    return public_root / 'index.html'
                relative = Path(path.lstrip('/'))
                if (not path.startswith('/assets/') or
                        any(part.startswith('.') for part in relative.parts) or
                        relative.suffix.lower() not in PUBLIC_EXTENSIONS):
                    return None
                candidate = (public_root / relative).resolve()
                if not candidate.is_relative_to(assets_root):
                    return None
                return candidate
            except (ValueError, OSError, UnicodeError):
                return None

        def serve_public(self, head=False):
            target = self.public_file()
            if target is None:
                self.send_error(404)
                return
            try:
                # Read before writing headers, including for HEAD, to report
                # missing/inaccessible files consistently and avoid directory lists.
                content = target.read_bytes()
            except OSError:
                self.send_error(404)
                return
            content_type = mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
            if content_type.startswith('text/') or content_type in ('application/javascript', 'image/svg+xml'):
                content_type += '; charset=utf-8'
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            if not head:
                self.wfile.write(content)

        def do_GET(self):
            self.serve_public()

        def do_HEAD(self):
            self.serve_public(head=True)

    return ThreadingHTTPServer((host, port), StudioHandler)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1', help='Bind address (default: local access only)')
    parser.add_argument('--port', default=8000, type=int)
    args = parser.parse_args()
    with create_server(args.host, args.port) as server:
        print(f'Studio: http://{args.host}:{server.server_port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
