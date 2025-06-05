const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 8000;
const COMMENTS_FILE = 'comments.json';

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iwzzrkvbdpzkxuiyvnrh.supabase.co'; // Replace with your URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3enpya3ZiZHB6a3h1aXl2bnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjM1ODQsImV4cCI6MjA2NDczOTU4NH0.RWfvuIn-ITSGLo1MyARW6lPLSePXhVnKKSgKa9rzdY8'; // Replace with your anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    supabase
      .from('comments')
      .select('*')
      .eq('page', page)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: 'Failed to fetch comments' }));
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ comments: data }));
        }
      });
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const newComment = JSON.parse(body);
        const { user, text, page } = newComment;
        const { error } = await supabase
          .from('comments')
          .insert([{ user, text, page }]);
        if (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: 'Failed to add comment' }));
        } else {
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Comment added successfully' }));
        }
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Invalid JSON in request body' }));
      }
    });
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
        (async () => {
  let error;
  if (page) {
    // Delete comments for a specific page
    ({ error } = await supabase
      .from('comments')
      .delete()
      .eq('page', page));
  } else {
    // Delete all comments
    ({ error } = await supabase
      .from('comments')
      .delete()
      .neq('id', 0)); // deletes all rows
  }
  if (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Failed to reset comments' }));
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Comments reset' }));
  }
})();
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