import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '632006';
const dbPath = process.env.DB_PATH || path.join(__dirname, 'blog.db');
const jsonDbPath = path.join(__dirname, 'blog-db.json');

console.log('🔐 Server Starting...');
console.log('   PORT:', PORT);
console.log('   Database Path:', dbPath);
console.log('   ADMIN_PASSWORD source:', process.env.ADMIN_PASSWORD ? 'ENV_VAR' : 'HARDCODED');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Helper to find initial seed data
function getSeedPosts() {
  const possiblePaths = [
    path.join(__dirname, 'blogData.json'),
    path.join(__dirname, '..', 'public', 'blogData.json'),
    path.join(__dirname, 'public', 'blogData.json'),
    path.join(process.cwd(), 'public', 'blogData.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error reading seed file at', p, e.message);
      }
    }
  }
  return [];
}

// -------------------------------------------------------------
// Database Adapters: SQLite (Primary) + JSON File (Fallback)
// -------------------------------------------------------------
let dbService = null;

// Try loading native sqlite3 module
let sqlite3 = null;
try {
  const imported = await import('sqlite3');
  sqlite3 = imported.default || imported;
} catch (loadErr) {
  console.warn('⚠️ Native sqlite3 binding unavailable on this OS / libc environment:', loadErr.message);
  console.log('🚀 Seamlessly falling back to persistent JSON storage engine.');
}

if (sqlite3) {
  try {
    const sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite connection error, falling back to JSON engine:', err.message);
        initJsonEngine();
      } else {
        console.log('Connected to SQLite database at:', dbPath);
        initSqliteDatabase(sqliteDb);
      }
    });

    function initSqliteDatabase(db) {
      db.serialize(() => {
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
            comments_count INTEGER DEFAULT 0,
            tags TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run('ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0', () => {});

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

        db.run("UPDATE posts SET author_avatar = '/I%20am.png'");

        db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
          if (!err && row && row.count === 0) {
            const seedPosts = getSeedPosts();
            if (seedPosts.length > 0) {
              console.log(`🌱 Seeding SQLite database with ${seedPosts.length} posts...`);
              const insertStmt = db.prepare(`
                INSERT INTO posts (id, title, category, status, date, author, author_avatar, excerpt, content, image, link, likes, comments_count, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              seedPosts.forEach((post) => {
                insertStmt.run([
                  post.id || `post-${Date.now()}`,
                  post.title || 'Untitled',
                  post.category || 'Life Update',
                  post.status || 'Completed',
                  post.date || 'Aug 2026',
                  post.author || 'Abhishek KR',
                  post.authorAvatar || post.author_avatar || '/I%20am.png',
                  post.excerpt || '',
                  post.content || '',
                  post.image || '',
                  post.link || '',
                  post.likes || 0,
                  post.comments_count || 0,
                  typeof post.tags === 'string' ? post.tags : JSON.stringify(post.tags || [])
                ]);
              });
              insertStmt.finalize();
            }
          }
        });
      });
    }

    dbService = {
      engine: 'sqlite',
      getPosts: () => new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
          if (err) return reject(err);
          const formatted = (rows || []).map((row) => ({
            ...row,
            tags: JSON.parse(row.tags || '[]'),
            authorAvatar: row.author_avatar || row.authorAvatar,
            commentsCount: row.comments_count || 0
          }));
          resolve(formatted);
        });
      }),
      createPost: (data) => new Promise((resolve, reject) => {
        const id = `post-${Date.now()}`;
        const postDate = data.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const postCategory = data.category || 'Life Update';
        const postStatus = data.status || 'Completed';
        const postExcerpt = data.excerpt || (data.content.slice(0, 140) + (data.content.length > 140 ? '...' : ''));
        const postImage = data.image || '';
        const postAuthor = 'Abhishek KR';
        const authorAvatar = '/I%20am.png';
        const tagsJson = JSON.stringify(data.tags || [postCategory]);

        const query = `
          INSERT INTO posts (id, title, category, status, date, author, author_avatar, excerpt, content, image, link, likes, comments_count, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
        `;

        sqliteDb.run(
          query,
          [id, data.title, postCategory, postStatus, postDate, postAuthor, authorAvatar, postExcerpt, data.content, postImage, data.link || '', tagsJson],
          function (err) {
            if (err) return reject(err);
            sqliteDb.get('SELECT * FROM posts WHERE id = ?', [id], (errRow, newPost) => {
              if (errRow) return reject(errRow);
              resolve({
                ...newPost,
                tags: JSON.parse(newPost.tags || '[]'),
                authorAvatar: newPost.author_avatar,
                commentsCount: newPost.comments_count || 0
              });
            });
          }
        );
      }),
      updatePost: (id, data) => new Promise((resolve, reject) => {
        const postExcerpt = data.excerpt || (data.content.slice(0, 140) + (data.content.length > 140 ? '...' : ''));
        const tagsJson = JSON.stringify(data.tags || []);

        const query = `
          UPDATE posts
          SET title = ?, category = ?, status = ?, date = ?, excerpt = ?, content = ?, image = ?, link = ?, tags = ?
          WHERE id = ?
        `;

        sqliteDb.run(
          query,
          [data.title, data.category, data.status, data.date, postExcerpt, data.content, data.image || '', data.link || '', tagsJson, id],
          function (err) {
            if (err) return reject(err);
            sqliteDb.get('SELECT * FROM posts WHERE id = ?', [id], (errRow, updatedPost) => {
              if (errRow || !updatedPost) return resolve(null);
              resolve({
                ...updatedPost,
                tags: JSON.parse(updatedPost.tags || '[]'),
                authorAvatar: updatedPost.author_avatar,
                commentsCount: updatedPost.comments_count || 0
              });
            });
          }
        );
      }),
      updateLikes: (id, delta) => new Promise((resolve, reject) => {
        sqliteDb.run('UPDATE posts SET likes = MAX(0, likes + ?) WHERE id = ?', [delta, id], function (err) {
          if (err) return reject(err);
          sqliteDb.get('SELECT likes FROM posts WHERE id = ?', [id], (errRow, row) => {
            if (errRow || !row) return resolve(null);
            resolve({ id, likes: row.likes });
          });
        });
      }),
      getComments: (postId) => new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [postId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      }),
      addComment: (postId, author, text) => new Promise((resolve, reject) => {
        sqliteDb.run(
          'INSERT INTO comments (post_id, author, text) VALUES (?, ?, ?)',
          [postId, author, text],
          function (err) {
            if (err) return reject(err);
            sqliteDb.run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]);
            sqliteDb.get('SELECT * FROM comments WHERE id = ?', [this.lastID], (errRow, comment) => {
              if (errRow) return reject(errRow);
              resolve(comment);
            });
          }
        );
      }),
      deletePost: (id) => new Promise((resolve, reject) => {
        sqliteDb.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
          if (err) return reject(err);
          resolve(id);
        });
      }),
      clearAll: () => new Promise((resolve, reject) => {
        sqliteDb.run('DELETE FROM posts', [], (err) => {
          if (err) return reject(err);
          sqliteDb.run('DELETE FROM comments', [], () => resolve(true));
        });
      })
    };
  } catch (initErr) {
    console.error('Failed to initialize SQLite, falling back to JSON engine:', initErr);
    initJsonEngine();
  }
} else {
  initJsonEngine();
}

// -------------------------------------------------------------
// Pure JSON Storage Engine Fallback (Zero GLIBC/C++ Dependency)
// -------------------------------------------------------------
function initJsonEngine() {
  console.log('📂 Initializing Persistent JSON Storage Engine at:', jsonDbPath);

  let state = { posts: [], comments: [] };

  if (fs.existsSync(jsonDbPath)) {
    try {
      const raw = fs.readFileSync(jsonDbPath, 'utf8');
      state = JSON.parse(raw);
    } catch (e) {
      console.error('Error loading JSON DB, resetting to defaults:', e.message);
    }
  }

  if (!state.posts || state.posts.length === 0) {
    const seedPosts = getSeedPosts();
    state.posts = seedPosts.map((p) => ({
      ...p,
      likes: p.likes || 0,
      commentsCount: p.commentsCount || 0,
      tags: Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []),
      authorAvatar: '/I%20am.png',
      created_at: p.date || new Date().toISOString()
    }));
    state.comments = state.comments || [];
    try {
      fs.writeFileSync(jsonDbPath, JSON.stringify(state, null, 2), 'utf8');
      console.log(`✅ Seeded JSON database with ${state.posts.length} initial posts`);
    } catch (saveErr) {
      console.error('Error writing seed to JSON DB:', saveErr.message);
    }
  }

  const saveState = () => {
    try {
      fs.writeFileSync(jsonDbPath, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
      console.error('Error persisting JSON DB:', err.message);
    }
  };

  dbService = {
    engine: 'json',
    getPosts: async () => {
      return [...state.posts];
    },
    createPost: async (data) => {
      const id = `post-${Date.now()}`;
      const postDate = data.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const postCategory = data.category || 'Life Update';
      const postStatus = data.status || 'Completed';
      const postExcerpt = data.excerpt || (data.content.slice(0, 140) + (data.content.length > 140 ? '...' : ''));

      const newPost = {
        id,
        title: data.title,
        category: postCategory,
        status: postStatus,
        date: postDate,
        author: 'Abhishek KR',
        authorAvatar: '/I%20am.png',
        excerpt: postExcerpt,
        content: data.content,
        image: data.image || '',
        link: data.link || '',
        likes: 0,
        commentsCount: 0,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [postCategory]),
        created_at: new Date().toISOString()
      };

      state.posts.unshift(newPost);
      saveState();
      return newPost;
    },
    updatePost: async (id, data) => {
      const index = state.posts.findIndex((p) => p.id === id);
      if (index === -1) return null;

      const existing = state.posts[index];
      const updated = {
        ...existing,
        title: data.title || existing.title,
        category: data.category || existing.category,
        status: data.status || existing.status,
        date: data.date || existing.date,
        excerpt: data.excerpt || (data.content ? data.content.slice(0, 140) : existing.excerpt),
        content: data.content || existing.content,
        image: data.image !== undefined ? data.image : existing.image,
        link: data.link !== undefined ? data.link : existing.link,
        tags: Array.isArray(data.tags) ? data.tags : existing.tags
      };

      state.posts[index] = updated;
      saveState();
      return updated;
    },
    updateLikes: async (id, delta) => {
      const post = state.posts.find((p) => p.id === id);
      if (!post) return null;
      post.likes = Math.max(0, (post.likes || 0) + delta);
      saveState();
      return { id, likes: post.likes };
    },
    getComments: async (postId) => {
      return (state.comments || []).filter((c) => c.post_id === postId);
    },
    addComment: async (postId, author, text) => {
      const comment = {
        id: Date.now(),
        post_id: postId,
        author: author || 'You (Visitor)',
        text,
        created_at: new Date().toISOString()
      };
      state.comments = state.comments || [];
      state.comments.push(comment);

      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.commentsCount = (post.commentsCount || 0) + 1;
      }
      saveState();
      return comment;
    },
    deletePost: async (id) => {
      state.posts = state.posts.filter((p) => p.id !== id);
      state.comments = (state.comments || []).filter((c) => c.post_id !== id);
      saveState();
      return id;
    },
    clearAll: async () => {
      state.posts = [];
      state.comments = [];
      saveState();
      return true;
    }
  };
}

// -------------------------------------------------------------
// Middleware & Routes
// -------------------------------------------------------------

function requireAdminAuth(req, res, next) {
  const providedPassword = req.headers['x-admin-password'] || req.body.adminPassword;
  if (providedPassword && String(providedPassword).trim() === String(ADMIN_PASSWORD).trim()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid Admin Password' });
}

// Root route for quick verification when opening backend URL in browser
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Abhishek Portfolio Blog API',
    engine: dbService ? dbService.engine : 'initializing',
    endpoints: {
      health: '/api/health',
      posts: '/api/posts'
    }
  });
});

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Blog Backend database is running smoothly.',
    engine: dbService ? dbService.engine : 'initializing',
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    expectedPassword: ADMIN_PASSWORD
  });
});

// POST /api/verify-password
app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  const received = password ? String(password).trim() : '';
  const expected = String(ADMIN_PASSWORD).trim();
  const isMatch = received === expected;

  console.log('🔐 Password Verification Attempt:');
  console.log('   Received:', received, `(length: ${received.length})`);
  console.log('   Expected:', expected, `(length: ${expected.length})`);
  console.log('   Match:', isMatch);

  if (isMatch) {
    console.log('✅ Password verified successfully!');
    return res.json({ success: true, message: 'Password verified successfully.' });
  }
  console.log('❌ Password verification failed!');
  return res.status(401).json({ success: false, error: 'Incorrect Admin Password.' });
});

// GET /api/posts - Fetch all posts (Public)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await dbService.getPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts - Create a new post (Admin Protected)
app.post('/api/posts', requireAdminAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const newPost = await dbService.createPost(req.body);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id - Edit/Update an existing post (Admin Protected)
app.put('/api/posts/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const updatedPost = await dbService.updatePost(id, req.body);
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/like - Toggle / Update like count (Public)
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;
    const result = await dbService.updateLikes(id, delta || 1);
    if (!result) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/comments - Fetch comments (Public)
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await dbService.getComments(id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/comments - Add a comment (Public)
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }
    const comment = await dbService.addComment(id, author || 'You (Visitor)', text);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id - Delete a post (Admin Protected)
app.delete('/api/posts/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deletePost(id);
    res.json({ message: 'Post deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts - Clear all posts (Admin Protected)
app.delete('/api/posts', requireAdminAuth, async (req, res) => {
  try {
    await dbService.clearAll();
    res.json({ message: 'All posts cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Blog API Backend server running at http://localhost:${PORT}`);
});
