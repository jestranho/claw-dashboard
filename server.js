const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.DASHBOARD_PORT || 8080;
const API_BASE = 'http://100.85.215.13:3001/api';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // Serve static files
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(filePath));
    return;
  }
  
  // Serve static assets
  if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
    const filePath = path.join(__dirname, url.pathname);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    try {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fs.readFileSync(filePath));
    } catch (error) {
      res.writeHead(404);
      res.end('File not found');
    }
    return;
  }
  
  // API proxy endpoints
  if (url.pathname.startsWith('/api/')) {
    const targetUrl = `${API_BASE}${url.pathname}${url.search}`;
    
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
      });
      
      const data = await response.json();
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'API request failed', message: error.message }));
    }
    return;
  }
  
  // 404 for other routes
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Estranho Bot Control Panel running at http://localhost:${PORT}`);
});