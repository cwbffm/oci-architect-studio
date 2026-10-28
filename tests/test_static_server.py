import http.client
from pathlib import Path
import tempfile
import threading
import unittest
from server import create_server

class StaticServerTest(unittest.TestCase):
    def test_public_files_only(self):
        with tempfile.TemporaryDirectory() as root:
            Path(root, 'index.html').write_text('<h1>Studio</h1>')
            Path(root, '.env').write_text('private')
            assets = Path(root, 'assets')
            assets.mkdir()
            Path(assets, 'app.js').write_text('window.example = true;')
            Path(assets, '.secret.css').write_text('private')
            Path(assets, 'backup.json').write_text('{"private": true}')
            Path(root, 'outside.js').write_text('private')
            Path(assets, 'escape.js').symlink_to(Path(root, 'outside.js'))
            server = create_server(port=0, root=root)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                for path, expected in [
                    ('/', 200), ('/index.html', 200), ('/index.html?v=1', 200),
                    ('/assets/app.js', 200), ('/.env', 404), ('/.git/config', 404),
                    ('/api/config', 404), ('/assets/../.env', 404),
                    ('/assets/%2e%2e/outside.js', 404), ('/assets/.secret.css', 404),
                    ('/assets/%2esecret.css', 404), ('/assets/backup.json', 404),
                    ('/assets/escape.js', 404), ('/assets/%ff.js', 404),
                    ('/assets/%00.js', 404), ('/assets/', 404),
                ]:
                    conn = http.client.HTTPConnection('127.0.0.1', server.server_port)
                    conn.request('GET', path)
                    response = conn.getresponse()
                    self.assertEqual(response.status, expected, path)
                    response.read()
                    conn.close()
                for path, expected in [('/', 200), ('/assets/app.js', 200),
                                       ('/assets/escape.js', 404), ('/api/config', 404)]:
                    with self.subTest(method='HEAD', path=path):
                        conn = http.client.HTTPConnection('127.0.0.1', server.server_port)
                        conn.request('HEAD', path)
                        response = conn.getresponse()
                        self.assertEqual(response.status, expected)
                        self.assertEqual(response.read(), b'')
                        if expected == 200:
                            self.assertEqual(response.getheader('X-Content-Type-Options'), 'nosniff')
                            self.assertGreater(int(response.getheader('Content-Length')), 0)
                        conn.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join()
