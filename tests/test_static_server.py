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
            server = create_server(port=0, root=root)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                for path, expected in [('/',200),('/index.html',200),('/.env',404),('/.git/config',404),('/api/config',404),('/assets/../.env',404)]:
                    conn = http.client.HTTPConnection('127.0.0.1', server.server_port)
                    conn.request('GET', path)
                    response = conn.getresponse()
                    self.assertEqual(response.status, expected, path)
                    response.read()
                    conn.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join()
