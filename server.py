import http.server
import os
from urllib.parse import urlparse, parse_qs

PORT = 8002

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Parse the URL and query parameters
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Serve the appropriate version based on the path
        if path == '/' or path == '/index.html' or path == '':
            self.path = '/index.html'
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        elif path == '/ai' or path == '/ai/':
            self.path = '/index_ai.html'
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        # For all other paths, serve files normally
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def find_available_port(start_port, max_attempts=10):
    import socket
    current_port = start_port
    for _ in range(max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', current_port))
                return current_port
        except OSError:
            current_port += 1
    raise OSError(f"No available ports in range {start_port}-{start_port + max_attempts}")

if __name__ == '__main__':
    # Change to the directory containing the web files
    web_dir = os.path.join(os.path.dirname(__file__))
    os.chdir(web_dir)
    
    # Find an available port
    port = find_available_port(8001)
    
    # Start the server
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, CORSRequestHandler)
    
    print("4-Way Corner Chess Server")
    print("=========================")
    print(f"Original version: http://localhost:{port}")
    print(f"AI version:        http://localhost:{port}/ai")
    print("\nPress Ctrl+C to stop the server")
    httpd.serve_forever()
