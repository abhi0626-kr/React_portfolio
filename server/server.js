import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '632006';

console.log('🔐 Admin Password Initialized:', ADMIN_PASSWORD === '632006' ? 'DEFAULT (632006)' : 'FROM ENV VAR');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const dbPath = path.join(__dirname, 'blog.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Create Posts table
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'Completed',
        date TEXT NOT NULL,
        author TEXT DEFAULT 'Abhishek KR',
        author_avatar TEXT,
        excerpt TEXT,
        content TEXT NOT NULL,
        image TEXT,
        link TEXT,
        likes INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Comments table
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    // Ensure all posts use updated avatar
    db.run("UPDATE posts SET author_avatar = '/I%20am.png'");
  });
}

// Middleware to verify admin password for mutations (Post, Edit, Delete)
function requireAdminAuth(req, res, next) {
  const providedPassword = req.headers['x-admin-password'] || req.body.adminPassword;
  if (providedPassword && String(providedPassword).trim() === String(ADMIN_PASSWORD).trim()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid Admin Password' });
}

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Blog Backend database is running smoothly.',
    passwordMode: ADMIN_PASSWORD === '632006' ? 'DEFAULT (632006)' : 'ENV_VAR_SET'
  });
});

// POST /api/verify-password - Verify password endpoint
app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  const providedPassword = password ? String(password).trim() : '';
  const expectedPassword = String(ADMIN_PASSWORD).trim();
  
  console.log('🔐 Password Verification Attempt:');
  console.log(`   Provided: "${providedPassword}" (length: ${providedPassword.length})`);
  console.log(`   Expected: "${expectedPassword}" (length: ${expectedPassword.length})`);
  console.log(`   Match: ${providedPassword === expectedPassword}`);
  
  if (providedPassword === expectedPassword) {
    return res.json({ success: true, message: 'Password verified successfully.' });
  }
  return res.status(401).json({ success: false, error: 'Incorrect Admin Password.' });
});

// GET /api/posts - Fetch all posts (Public)
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const formatted = rows.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      authorAvatar: row.author_avatar || row.authorAvatar
    }));
    res.json(formatted);
  });
});

// POST /api/posts - Create a new post (Admin Protected)
app.post('/api/posts', requireAdminAuth, (req, res) => {
  const {
    title,
    category,
    status,
    date,
    excerpt,
    content,
    image,
    link,
    tags
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const id = `post-${Date.now()}`;
  const postDate = date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const postCategory = category || 'Life Update';
  const postStatus = status || 'Completed';
  const postExcerpt = excerpt || (content.slice(0, 140) + (content.length > 140 ? '...' : ''));
  const postImage = image || '';
  const postAuthor = 'Abhishek KR';
  const authorAvatar = '/I%20am.png';
  const tagsJson = JSON.stringify(tags || [postCategory]);

  const query = `
    INSERT INTO posts (id, title, category, status, date, author, author_avatar, excerpt, content, image, link, likes, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `;

  db.run(
    query,
    [id, title, postCategory, postStatus, postDate, postAuthor, authorAvatar, postExcerpt, content, postImage, link || '', tagsJson],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT * FROM posts WHERE id = ?', [id], (errRow, newPost) => {
        if (errRow) {
          return res.status(500).json({ error: errRow.message });
        }
        res.status(201).json({
          ...newPost,
          tags: JSON.parse(newPost.tags || '[]'),
          authorAvatar: newPost.author_avatar
        });
      });
    }
  );
});

// PUT /api/posts/:id - Edit/Update an existing post (Admin Protected)
app.put('/api/posts/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const {
    title,
    category,
    status,
    date,
    excerpt,
    content,
    image,
    link,
    tags
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const postExcerpt = excerpt || (content.slice(0, 140) + (content.length > 140 ? '...' : ''));
  const tagsJson = JSON.stringify(tags || []);

  const query = `
    UPDATE posts
    SET title = ?, category = ?, status = ?, date = ?, excerpt = ?, content = ?, image = ?, link = ?, tags = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [title, category, status, date, postExcerpt, content, image || '', link || '', tagsJson, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT * FROM posts WHERE id = ?', [id], (errRow, updatedPost) => {
        if (errRow || !updatedPost) {
          return res.status(404).json({ error: 'Post not found.' });
        }
        res.json({
          ...updatedPost,
          tags: JSON.parse(updatedPost.tags || '[]'),
          authorAvatar: updatedPost.author_avatar
        });
      });
    }
  );
});

// POST /api/posts/:id/like - Toggle / Update like count (Public)
app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;
  const change = delta || 1;

  db.run('UPDATE posts SET likes = MAX(0, likes + ?) WHERE id = ?', [change, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get('SELECT likes FROM posts WHERE id = ?', [id], (errRow, row) => {
      if (errRow || !row) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json({ id, likes: row.likes });
    });
  });
});

// GET /api/posts/:id/comments - Fetch comments (Public)
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST /api/posts/:id/comments - Add a comment (Public)
app.post('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const commentAuthor = author || 'You (Visitor)';

  db.run(
    'INSERT INTO comments (post_id, author, text) VALUES (?, ?, ?)',
    [id, commentAuthor, text],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [id]);

      db.get('SELECT * FROM comments WHERE id = ?', [this.lastID], (errRow, comment) => {
        if (errRow) {
          return res.status(500).json({ error: errRow.message });
        }
        res.status(201).json(comment);
      });
    }
  );
});

// DELETE /api/posts/:id - Delete a post (Admin Protected)
app.delete('/api/posts/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Post deleted successfully', id });
  });
});

// DELETE /api/posts - Clear all posts (Admin Protected)
app.delete('/api/posts', requireAdminAuth, (req, res) => {
  db.run('DELETE FROM posts', [], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.run('DELETE FROM comments', [], () => {
      res.json({ message: 'All posts cleared successfully' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Blog API Backend server running at http://localhost:${PORT}`);
});
