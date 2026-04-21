# SPO2 Portfolio — Backend Setup

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```

The server starts on **http://localhost:3000**

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Public portfolio site |
| `http://localhost:3000/admin.html` | Admin panel (password protected) |

---

## Admin Panel

**Default password:** `spo2admin`

To change it, set the `ADMIN_PASSWORD` environment variable before starting:

```bash
# Windows
set ADMIN_PASSWORD=mysecretpassword && npm start

# Mac / Linux
ADMIN_PASSWORD=mysecretpassword npm start
```

In the admin panel you can:
- Upload / replace the **circuit schematic** (PNG or JPG from KiCad)
- Upload / remove any of the **6 project photo** slots
- All images are saved to the `uploads/` folder and persist across restarts

---

## File Structure

```
spo2-portfolio/
├── server.js          ← Express backend
├── package.json
├── state.json         ← Auto-created: tracks which images exist
├── uploads/           ← Auto-created: stores uploaded images
└── public/
    ├── index.html     ← Portfolio website (read-only, no upload UI)
    └── admin.html     ← Admin panel for managing images
```

## API Reference (Admin Only)

All admin routes require `Authorization: Bearer <password>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/state` | Returns current image state (public) |
| `POST` | `/api/upload/photo/:index` | Upload photo (index 0–5) |
| `DELETE` | `/api/photo/:index` | Remove photo |
| `POST` | `/api/upload/schematic` | Upload schematic image |
| `DELETE` | `/api/schematic` | Remove schematic |
