const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dest = (sub) => {
  const dir = path.join(__dirname, '..', '..', 'uploads', sub);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = (sub) => multer.diskStorage({
  destination: (_r, _f, cb) => cb(null, dest(sub)),
  filename: (_r, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const avatarUpload = multer({
  storage: storage('avatars'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => (/^image\//.test(f.mimetype) ? cb(null, true) : cb(new Error('Only image files allowed'))),
});

const resumeUpload = multer({
  storage: storage('resumes'),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => {
    const ok = /pdf|msword|officedocument|text|plain/.test(f.mimetype) || /\.(pdf|docx?|txt|md)$/i.test(f.originalname);
    cb(ok ? null : new Error('Upload a PDF, DOC, DOCX or TXT resume'), ok);
  },
});

module.exports = { avatarUpload, resumeUpload };
