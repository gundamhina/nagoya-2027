"""本地預覽伺服器：跟 python -m http.server 一樣，只多送 Cache-Control: no-store。

手機瀏覽器（尤其 iOS Safari）會把 assets/ 下的檔案依 Last-Modified 推算新鮮度快取起來，
改了 app.js、style.css 之後重整仍拿到舊檔，看起來像沒修好。no-store 讓每次重整都重抓。
用法：python tools/serve.py   （預設 8777，可加埠號）
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
handler = partial(NoCacheHandler, directory=".")
print(f"http://localhost:{port}/index.html  (Cache-Control: no-store)")
ThreadingHTTPServer(("", port), handler).serve_forever()
