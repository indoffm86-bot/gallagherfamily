const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'winland_secret_super_key_2026_xyz',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Static files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Helper DB Read / Write
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return null;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: เฉพาะแอดมินเท่านั้น' });
}

// ================= PUBLIC ROUTES =================

// Public data: site settings & members only (omit admin credentials)
app.get('/api/public/data', (req, res) => {
  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  // Sort members by order
  const sortedMembers = [...(db.members || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  res.json({
    siteSettings: db.siteSettings,
    members: sortedMembers
  });
});

// Check if current visitor has admin session
app.get('/api/auth/status', (req, res) => {
  res.json({
    isAdmin: Boolean(req.session && req.session.isAdmin),
    username: req.session ? req.session.username : null
  });
});

// Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  const db = readDb();
  if (!db || !db.adminUser) {
    return res.status(500).json({ error: 'Admin configuration missing' });
  }

  const isUserMatch = username.trim() === db.adminUser.username;
  const isPassMatch = isUserMatch && bcrypt.compareSync(password, db.adminUser.passwordHash);

  if (isUserMatch && isPassMatch) {
    req.session.isAdmin = true;
    req.session.username = db.adminUser.username;
    return res.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
  } else {
    return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }
});

// Admin Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  });
});

// ================= ADMIN SECURED ROUTES =================

// Get all admin data (including admin profile metadata)
app.get('/api/admin/data', requireAdmin, (req, res) => {
  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const sortedMembers = [...(db.members || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  res.json({
    siteSettings: db.siteSettings,
    members: sortedMembers,
    adminUsername: db.adminUser.username
  });
});

// Update Site Settings
app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  db.siteSettings = {
    ...db.siteSettings,
    ...req.body
  };

  if (writeDb(db)) {
    res.json({ success: true, message: 'บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว', siteSettings: db.siteSettings });
  } else {
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

// Add Member
app.post('/api/admin/members', requireAdmin, (req, res) => {
  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const { name, role, subTitle, description, avatar, instagram, facebook, discord } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อและบทบาทของสมาชิก' });
  }

  const newId = `mem_${Date.now()}`;
  const maxOrder = db.members.reduce((max, m) => Math.max(max, m.order || 0), 0);

  const newMember = {
    id: newId,
    name: name.trim(),
    role: role.trim().toUpperCase(),
    subTitle: (subTitle || '').trim(),
    description: (description || '').trim(),
    avatar: (avatar || '').trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
    instagram: (instagram || '').trim(),
    facebook: (facebook || '').trim(),
    discord: (discord || '').trim(),
    order: maxOrder + 1
  };

  db.members.push(newMember);

  if (writeDb(db)) {
    res.json({ success: true, message: 'เพิ่มสมาชิกสำเร็จ', member: newMember });
  } else {
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

// Update Member
app.put('/api/admin/members/:id', requireAdmin, (req, res) => {
  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const { id } = req.params;
  const index = db.members.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบสมาชิกที่ต้องการแก้ไข' });
  }

  const { name, role, subTitle, description, avatar, instagram, facebook, discord, order } = req.body;

  db.members[index] = {
    ...db.members[index],
    name: name !== undefined ? name.trim() : db.members[index].name,
    role: role !== undefined ? role.trim().toUpperCase() : db.members[index].role,
    subTitle: subTitle !== undefined ? subTitle.trim() : db.members[index].subTitle,
    description: description !== undefined ? description.trim() : db.members[index].description,
    avatar: avatar !== undefined ? avatar.trim() : db.members[index].avatar,
    instagram: instagram !== undefined ? instagram.trim() : db.members[index].instagram,
    facebook: facebook !== undefined ? facebook.trim() : db.members[index].facebook,
    discord: discord !== undefined ? discord.trim() : db.members[index].discord,
    order: order !== undefined ? Number(order) : db.members[index].order
  };

  if (writeDb(db)) {
    res.json({ success: true, message: 'แก้ไขข้อมูลสมาชิกสำเร็จ', member: db.members[index] });
  } else {
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

// Delete Member
app.delete('/api/admin/members/:id', requireAdmin, (req, res) => {
  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  const { id } = req.params;
  const initialCount = db.members.length;
  db.members = db.members.filter(m => m.id !== id);

  if (db.members.length === initialCount) {
    return res.status(404).json({ error: 'ไม่พบสมาชิกที่ต้องการลบ' });
  }

  if (writeDb(db)) {
    res.json({ success: true, message: 'ลบสมาชิกเรียบร้อยแล้ว' });
  } else {
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

// Reorder Members
app.post('/api/admin/members/reorder', requireAdmin, (req, res) => {
  const { memberIds } = req.body;
  if (!Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  }

  const db = readDb();
  if (!db) return res.status(500).json({ error: 'Database error' });

  memberIds.forEach((id, index) => {
    const mem = db.members.find(m => m.id === id);
    if (mem) {
      mem.order = index + 1;
    }
  });

  if (writeDb(db)) {
    res.json({ success: true, message: 'อัปเดตการเรียงลำดับสำเร็จ' });
  } else {
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

// File Upload (Avatar, Background Image, Music)
app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ไม่มีไฟล์ที่ถูกอัปโหลด' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    fileName: req.file.filename,
    originalName: req.file.originalname
  });
});

// Change Admin Credentials (Username and/or Password)
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  if (!currentPassword) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบัน' });
  }

  const db = readDb();
  if (!db || !db.adminUser) {
    return res.status(500).json({ error: 'Database error' });
  }

  const isCurrentPassValid = bcrypt.compareSync(currentPassword, db.adminUser.passwordHash);
  if (!isCurrentPassValid) {
    return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  }

  if (newUsername && newUsername.trim()) {
    db.adminUser.username = newUsername.trim();
    req.session.username = db.adminUser.username;
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }
    db.adminUser.passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
  }

  if (writeDb(db)) {
    res.json({ success: true, message: 'เปลี่ยนข้อมูลแอดมินสำเร็จเรียบร้อย' });
  } else {
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

// Disguised Admin Page Route
// Outsiders visiting /admin without logging in will see a clean locked gateway or can open the hidden modal from front page!
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 WINLAND Server is running on http://localhost:${PORT}`);
  console.log(`🔒 Secret Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`   Default User: admin | Default Pass: admin1234`);
  console.log(`===============================================`);
});
