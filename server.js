const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'spo2admin';

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Uploads directory ─────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ── State file ────────────────────────────────────────────────────────────
const STATE_FILE = path.join(__dirname, 'state.json');
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { photos: {}, schematic: null }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

// ── Multer (memory storage – files written manually with clean names) ─────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Images only – please upload PNG, JPG, or WebP'))
});

// ── Auth middleware ────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.headers['authorization'] === `Bearer ${ADMIN_PASSWORD}`) return next();
  res.status(401).json({ error: 'Unauthorized – wrong password' });
}

// ══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════════════════

// GET current image state (portfolio reads this on load)
app.get('/api/state', (_, res) => res.json(loadState()));
app.get('/api/auth', requireAuth, (_, res) => res.json({ ok: true }));

// ══════════════════════════════════════════════════════════════════════════
//  ADMIN API  (all require Bearer token)
// ══════════════════════════════════════════════════════════════════════════

// POST /api/upload/photo/:index  — upload or replace a project photo (0–5)
app.post('/api/upload/photo/:index', requireAuth, upload.single('photo'), (req, res) => {
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx > 5)
    return res.status(400).json({ error: 'Photo index must be 0–5' });
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const state = loadState();
  const idxStr = String(idx);

  // Remove old file for this slot
  if (state.photos[idxStr]) {
    const old = path.join(UPLOADS_DIR, state.photos[idxStr]);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const ext      = path.extname(req.file.originalname).toLowerCase() || '.jpg';
  const filename = `photo_${idx}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);

  state.photos[idxStr] = filename;
  saveState(state);
  res.json({ success: true, url: `/uploads/${filename}` });
});

// DELETE /api/photo/:index
app.delete('/api/photo/:index', requireAuth, (req, res) => {
  const idx    = String(parseInt(req.params.index, 10));
  const state  = loadState();
  if (state.photos[idx]) {
    const p = path.join(UPLOADS_DIR, state.photos[idx]);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    delete state.photos[idx];
    saveState(state);
  }
  res.json({ success: true });
});

// POST /api/upload/schematic
app.post('/api/upload/schematic', requireAuth, upload.single('schematic'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const state = loadState();
  if (state.schematic) {
    const old = path.join(UPLOADS_DIR, state.schematic);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const ext      = path.extname(req.file.originalname).toLowerCase() || '.png';
  const filename = `schematic${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);

  state.schematic = filename;
  saveState(state);
  res.json({ success: true, url: `/uploads/${filename}` });
});

// DELETE /api/schematic
app.delete('/api/schematic', requireAuth, (req, res) => {
  const state = loadState();
  if (state.schematic) {
    const p = path.join(UPLOADS_DIR, state.schematic);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    state.schematic = null;
    saveState(state);
  }
  res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║     SPO2 Portfolio Server            ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║  Portfolio  →  http://localhost:${PORT}  ║`);
  console.log(`  ║  Admin      →  http://localhost:${PORT}/admin.html  ║`);
  console.log(`  ║  Password   →  ${ADMIN_PASSWORD.padEnd(22)}║`);
  console.log('  ╚══════════════════════════════════════╝\n');
  console.log('  Tip: set ADMIN_PASSWORD env variable to change the password.\n');
});
