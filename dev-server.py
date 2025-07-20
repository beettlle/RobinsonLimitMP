#!/usr/bin/env python3
"""
Development server for RobinsonLimitMP
Automatically loads environment variables from .env file
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import json

def load_env_file(env_path='.env'):
    """Load environment variables from .env file"""
    if not os.path.exists(env_path):
        print(f"⚠️  No .env file found at {env_path}")
        print("   Create one from .env.example if needed")
        return
    
    print(f"📄 Loading environment variables from {env_path}")
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value
                print(f"   ✅ {key} = {'*' * len(value) if 'key' in key.lower() else value}")

def create_config_endpoint():
    """Create a simple endpoint to serve config variables to the frontend"""
    class ConfigHandler(SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/config.js':
                self.send_response(200)
                self.send_header('Content-type', 'application/javascript')
                self.end_headers()
                
                # Create config object with environment variables
                config = {
                    'openWeatherMapApiKey': os.environ.get('OPENWEATHER_API_KEY', ''),
                    'weatherApiKey': os.environ.get('WEATHERAPI_KEY', ''),
                    'environment': 'development'
                }
                
                config_js = f"window.config = {json.dumps(config, indent=2)};"
                self.wfile.write(config_js.encode())
                return
            
            # Serve static files normally
            return SimpleHTTPRequestHandler.do_GET(self)
    
    return ConfigHandler

def main():
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            sys.exit(1)
    
    # Load environment variables
    load_env_file()
    
    # Create server with custom handler
    handler = create_config_endpoint()
    server = HTTPServer(('localhost', port), handler)
    
    print(f"🚀 Starting development server at http://localhost:{port}")
    print("📱 PWA features will work in this environment")
    print("🔧 Environment variables loaded from .env file")
    print("🌐 Press Ctrl+C to stop the server")
    print()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.server_close()

if __name__ == '__main__':
    main() 