const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 8000;
const COMMENTS_FILE = 'comments.json';

// Load comments from file at startup
let comments = {};
try {
  if (fs.existsSync(COMMENTS_FILE)) {
    const fileContent = fs.readFileSync(COMMENTS_FILE, 'utf8');
    comments = fileContent.trim() ? JSON.parse(fileContent) : {};
  }
} catch (err) {
  console.error('Failed to load comments:', err);
  comments = {};
}

// Helper to save comments to file
function saveComments() {
  fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), err => {
    if (err) console.error('Failed to save comments:', err);
  });
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (origin === 'http://https://voluble-babka-32e318.netlify.app' || origin === 'http://127.0.0.1:8000') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // --- COMMENTS API ---
  if (pathname === '/comments') {
    if (req.method === 'GET') {
      const page = parsedUrl.query.page || 1;
      const pageComments = comments[page] || [];
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ comments: pageComments }));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const newComment = JSON.parse(body);
          const page = newComment.page || 1;
          if (!comments[page]) {
            comments[page] = [];
          }
          comments[page].push(newComment);
          saveComments(); // Save to file
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Comment added successfully' }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Invalid JSON in request body' }));
          console.error('Error parsing JSON:', error);
        }
      });
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  } else if (pathname === '/comments/reset' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { password, page } = data;
        if (password !== 'Admin123') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Incorrect password' }));
          return;
        }
        if (page) {
          comments[page] = [];
        } else {
          comments = {};
        }
        saveComments(); // Save to file
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Comments reset' }));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Invalid JSON in request body' }));
      }
    });
  } else {
    // --- STATIC FILE SERVING ---
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, decodeURIComponent(filePath));

    // Prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not Found.');
      } else {
        // Set content-type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon'
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.end(data);
      }
    });
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});