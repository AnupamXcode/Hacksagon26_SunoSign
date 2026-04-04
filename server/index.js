const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Setup Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    password TEXT,
    image TEXT,
    description TEXT,
    settings_voiceEnabled INTEGER DEFAULT 1,
    settings_emergencyContact TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    gesture TEXT,
    confidence REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API Endpoints ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SunoSign Backend Running' });
});

// --- AUTH ENDPOINTS ---

// Register user
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, phone, email, password, image, description } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const userId = `user_${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (id, name, phone, email, password, image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, name.trim(), phone?.trim() || '', email.trim(), password, image || '', description?.trim() || '');
    
    return res.status(201).json({
      success: true,
      userId,
      name,
      email,
      phone: phone || '',
      image: image || '',
      description: description || ''
    });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email.trim(), password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({
      success: true,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      image: user.image || '',
      description: user.description || ''
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Check if email exists
app.post('/api/auth/check-email', (req, res) => {
  const { email } = req.body;
  
  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get full profile
app.get('/api/auth/profile/:id', (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT id, name, email, phone, image, description FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
app.put('/api/auth/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, description, image } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, description = ?, image = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, phone, description, image, id);
    
    const user = db.prepare('SELECT id, name, email, phone, image, description FROM users WHERE id = ?').get(id);
    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LEGACY API ENDPOINTS ---
app.get('/api/profile/:id', (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    // Format numeric boolean back to standard boolean
    res.json({
        id: user.id,
        name: user.name,
        settings: {
             voiceEnabled: user.settings_voiceEnabled === 1,
             emergencyContact: user.settings_emergencyContact
        }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', (req, res) => {
  const { id, name, settings } = req.body;
  
  if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
  }

  try {
    const voiceEnabled = settings?.voiceEnabled ? 1 : 0;
    const emergencyContact = settings?.emergencyContact || '';

    const stmt = db.prepare(`
      INSERT INTO users (id, name, settings_voiceEnabled, settings_emergencyContact)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        settings_voiceEnabled=excluded.settings_voiceEnabled,
        settings_emergencyContact=excluded.settings_emergencyContact
    `);
    stmt.run(id, name, voiceEnabled, emergencyContact);
    
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', (req, res) => {
   const { userId, gesture, confidence } = req.body;
   try {
       const stmt = db.prepare('INSERT INTO history (userId, gesture, confidence) VALUES (?, ?, ?)');
       stmt.run(userId || 'guest', gesture, confidence);
       res.json({ success: true });
   } catch(err) {
       res.status(500).json({ error: err.message });
   }
});

app.get('/api/history', (req, res) => {
   const { limit = 50 } = req.query;
   try {
       const history = db.prepare('SELECT * FROM history ORDER BY timestamp DESC LIMIT ?').all(limit);
       res.json(history);
   } catch(err) {
       res.status(500).json({ error: err.message });
   }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
