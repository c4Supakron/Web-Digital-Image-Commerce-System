import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import generatePromptPayPayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { pool, query } from './db.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const PgSession = connectPgSimple(session);
const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required');

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await query('SELECT id, username, name, email, phone, bio, role, artist_status FROM users WHERE id = $1', [id]);
    done(null, rows[0] || false);
  } catch (error) { done(error); }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    scope: ['openid', 'email', 'profile'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email || profile._json?.email_verified !== true) return done(null, false);
      const { rows } = await query(
        'SELECT id, username, name, email, phone, bio, role, artist_status, google_id FROM users WHERE LOWER(email) = $1',
        [email],
      );
      const account = rows[0];
      if (!account) return done(null, false, { code: 'account_required' });
      if (account.google_id && account.google_id !== profile.id) return done(null, false, { code: 'google_account_mismatch' });

      if (!account.google_id) {
        const linked = await query(
          `UPDATE users SET google_id = $1, updated_at = NOW()
           WHERE id = $2 AND google_id IS NULL
           RETURNING id, username, name, email, phone, bio, role, artist_status, google_id`,
          [profile.id, account.id],
        );
        if (!linked.rows[0]) return done(null, false, { code: 'google_account_mismatch' });
        return done(null, linked.rows[0]);
      }

      done(null, account);
    } catch (error) {
      if (error.code === '23505') return done(null, false, { code: 'google_account_mismatch' });
      done(error);
    }
  }));
}

const publicUser = (user) => ({ id: Number(user.id), username: user.username, name: user.name, email: user.email, phone: user.phone || '', bio: user.bio || '', role: user.role, artist_status: user.artist_status || 'NOT_APPLIED', google_connected: Boolean(user.google_id) });
const requireUser = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  next();
};
const requireRole = (...roles) => async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  try {
    const { rows } = await query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (!rows[0] || !roles.includes(rows[0].role)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์จัดการผลงาน' });
    req.userRole = rows[0].role;
    next();
  } catch (error) { console.error(error); res.status(500).json({ message: 'ตรวจสอบสิทธิ์ไม่สำเร็จ' }); }
};
const validId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;
const getPromptPayId = () => String(process.env.PROMPTPAY_ID || '').replace(/[\s-]/g, '');
const validPromptPayId = (value) => /^(0\d{9}|\d{13}|\d{15})$/.test(value);
const validateAddress = (address) => {
  const required = ['recipientName', 'phone', 'addressLine', 'province', 'district', 'subdistrict', 'postalCode'];
  if (!address || typeof address !== 'object' || required.some((key) => typeof address[key] !== 'string' || !address[key].trim())) return false;
  return required.every((key) => address[key].trim().length <= 250)
    && (!address.notes || (typeof address.notes === 'string' && address.notes.length <= 1000));
};
const validImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) return false;
  const imageUrl = value.trim();
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) return true;
  try { return ['http:', 'https:'].includes(new URL(imageUrl).protocol); }
  catch { return false; }
};
const validateProductInput = (body) => {
  const { title, price, image, category, description = '' } = body || {};
  const numericPrice = Number(price);
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 180) return { error: 'กรุณาระบุชื่อผลงานไม่เกิน 180 ตัวอักษร' };
  if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 9999999999.99) return { error: 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' };
  if (!validImageUrl(image)) return { error: 'กรุณาระบุ URL รูปภาพที่ถูกต้อง (HTTP/HTTPS หรือ path ภายในเว็บ)' };
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 80) return { error: 'กรุณาระบุหมวดหมู่ไม่เกิน 80 ตัวอักษร' };
  if (typeof description !== 'string' || description.length > 5000) return { error: 'คำอธิบายต้องมีความยาวไม่เกิน 5,000 ตัวอักษร' };
  return { value: { title: title.trim(), price: numericPrice, image: image.trim(), category: category.trim(), description: description.trim() } };
};
const resolveProductOwner = async (req, ownerUserId) => {
  const id = req.userRole === 'ARTIST' ? req.session.userId : ownerUserId;
  if (!validId(id)) return null;
  const { rows } = await query("SELECT id, name FROM users WHERE id = $1 AND role = 'ARTIST'", [id]);
  return rows[0] || null;
};

app.get('/api/admin/artist-applications', requireRole('ADMIN'), async (_req, res) => {
  try {
    const { rows } = await query("SELECT id, username, name, email, artist_status, created_at FROM users WHERE artist_status IN ('PENDING', 'REJECTED') ORDER BY created_at");
    res.json({ applications: rows.map((row) => ({ ...row, id: Number(row.id) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดคำขอสมัครศิลปินไม่สำเร็จ' }); }
});

app.patch('/api/admin/artist-applications/:userId', requireRole('ADMIN'), async (req, res) => {
  if (!validId(req.params.userId) || !['APPROVED', 'REJECTED'].includes(req.body?.decision)) return res.status(400).json({ message: 'ข้อมูลการพิจารณาไม่ถูกต้อง' });
  try {
    const decision = req.body.decision;
    const role = decision === 'APPROVED' ? 'ARTIST' : 'MEMBER';
    const { rows } = await query(
      "UPDATE users SET role = $1, artist_status = $2, updated_at = NOW() WHERE id = $3 AND artist_status IN ('PENDING', 'REJECTED') RETURNING id, username, name, email, role, artist_status, google_id",
      [role, decision, req.params.userId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบคำขอสมัครศิลปินนี้' });
    res.json({ user: publicUser(rows[0]) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'บันทึกผลพิจารณาไม่สำเร็จ' }); }
});

app.post('/api/artist/application', requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      "UPDATE users SET artist_status = 'PENDING', updated_at = NOW() WHERE id = $1 AND role = 'MEMBER' AND artist_status IN ('NOT_APPLIED', 'REJECTED') RETURNING id, username, name, email, role, artist_status, google_id",
      [req.session.userId],
    );
    if (!rows[0]) return res.status(409).json({ message: 'บัญชีนี้ส่งคำขอสมัครศิลปินไม่ได้ หรือมีคำขอที่กำลังพิจารณาอยู่แล้ว' });
    res.status(202).json({ message: 'ส่งคำขอสมัครศิลปินแล้ว รอแอดมินอนุมัติ', user: publicUser(rows[0]) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ส่งคำขอสมัครศิลปินไม่สำเร็จ' }); }
});

app.get('/api/admin/orders', requireRole('ADMIN'), async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT o.id, o.user_id, o.status, o.payment_status, o.subtotal, o.shipping_fee, o.total, o.shipping_address,
        o.shipping_carrier, o.tracking_number, o.created_at,
        u.name AS customer_name, u.email AS customer_email,
        latest_proof.mime_type AS payment_proof_mime_type, latest_proof.submitted_at AS payment_proof_submitted_at,
        COALESCE(json_agg(json_build_object('title', i.title, 'price', i.unit_price, 'quantity', i.quantity, 'image', i.image)) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN order_items i ON i.order_id = o.id
       LEFT JOIN LATERAL (
         SELECT mime_type, submitted_at FROM payment_proofs WHERE order_id = o.id ORDER BY submitted_at DESC, id DESC LIMIT 1
       ) latest_proof ON TRUE
       GROUP BY o.id, u.name, u.email, latest_proof.mime_type, latest_proof.submitted_at ORDER BY o.created_at DESC`
    );
    res.json({ orders: rows.map((order) => ({ ...order, id: `ORD-${String(order.id).padStart(6, '0')}`, subtotal: Number(order.subtotal), shipping_fee: Number(order.shipping_fee), total: Number(order.total) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดคำสั่งซื้อไม่สำเร็จ' }); }
});

app.get('/api/admin/orders/:orderId/payment-proof', requireRole('ADMIN'), async (req, res) => {
  const rawId = String(req.params.orderId).replace(/^ORD-/, '').replace(/^0+/, '') || '0';
  if (!validId(rawId)) return res.status(400).json({ message: 'เลขที่คำสั่งซื้อไม่ถูกต้อง' });
  try {
    const { rows } = await query(
      `SELECT mime_type, proof_data FROM payment_proofs WHERE order_id = $1
       ORDER BY submitted_at DESC, id DESC LIMIT 1`,
      [rawId],
    );
    const proof = rows[0];
    if (!proof) return res.status(404).json({ message: 'ไม่พบหลักฐานการชำระเงินของคำสั่งซื้อนี้' });
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' }[proof.mime_type];
    res.set({
      'Content-Type': proof.mime_type,
      'Content-Disposition': `attachment; filename="payment-proof-ORD-${String(rawId).padStart(6, '0')}.${extension}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    }).send(proof.proof_data);
  } catch (error) { console.error(error); res.status(500).json({ message: 'เปิดหลักฐานการชำระเงินไม่สำเร็จ' }); }
});

app.patch('/api/admin/orders/:orderId/payment-review', requireRole('ADMIN'), async (req, res) => {
  const rawId = String(req.params.orderId).replace(/^ORD-/, '').replace(/^0+/, '') || '0';
  const decision = req.body?.decision;
  if (!validId(rawId) || !['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ message: 'ผลตรวจสอบการชำระเงินไม่ถูกต้อง' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, payment_status FROM orders WHERE id = $1 FOR UPDATE', [rawId]);
    const order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
    }
    if (order.payment_status !== 'PENDING_REVIEW') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'คำสั่งซื้อนี้ไม่มีหลักฐานที่รอการตรวจสอบ' });
    }
    const proof = await client.query('SELECT 1 FROM payment_proofs WHERE order_id = $1 LIMIT 1', [order.id]);
    if (!proof.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'ไม่พบไฟล์หลักฐานสำหรับตรวจสอบ' });
    }
    const { rows: updated } = await client.query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING id, payment_status',
      [decision, order.id],
    );
    await client.query('COMMIT');
    return res.json({ order: { ...updated[0], id: `ORD-${String(updated[0].id).padStart(6, '0')}` } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'บันทึกผลตรวจสอบการชำระเงินไม่สำเร็จ' });
  } finally { client.release(); }
});

const shippingCarriers = new Set(['THAILAND_POST', 'KEX', 'FLASH', 'JT']);
app.patch('/api/admin/orders/:orderId/shipping', requireRole('ADMIN'), async (req, res) => {
  const rawId = String(req.params.orderId).replace(/^ORD-/, '').replace(/^0+/, '') || '0';
  const carrier = req.body?.carrier;
  const trackingNumber = typeof req.body?.trackingNumber === 'string' ? req.body.trackingNumber.trim() : '';
  if (!validId(rawId) || !shippingCarriers.has(carrier) || !/^[A-Za-z0-9-]{4,80}$/.test(trackingNumber)) {
    return res.status(400).json({ message: 'กรุณาเลือกบริษัทขนส่งและกรอกเลขพัสดุให้ถูกต้อง' });
  }
  try {
    const { rows } = await query(
      `UPDATE orders SET shipping_carrier = $1, tracking_number = $2, status = 'SHIPPED'
       WHERE id = $3 AND payment_status = 'APPROVED' AND status IN ('PENDING', 'CONFIRMED', 'SHIPPED')
       RETURNING id, status, payment_status, shipping_carrier, tracking_number`,
      [carrier, trackingNumber, rawId],
    );
    if (!rows[0]) {
      const existing = await query('SELECT status, payment_status FROM orders WHERE id = $1', [rawId]);
      if (!existing.rows[0]) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
      if (existing.rows[0].payment_status !== 'APPROVED') return res.status(409).json({ message: 'ต้องอนุมัติการชำระเงินก่อนบันทึกข้อมูลจัดส่ง' });
      return res.status(409).json({ message: 'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่บันทึกข้อมูลจัดส่งได้' });
    }
    return res.json({ order: { ...rows[0], id: `ORD-${String(rows[0].id).padStart(6, '0')}` } });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'บันทึกข้อมูลจัดส่งไม่สำเร็จ' }); }
});

app.patch('/api/admin/orders/:orderId/status', requireRole('ADMIN'), async (req, res) => {
  const rawId = String(req.params.orderId).replace(/^ORD-/, '').replace(/^0+/, '') || '0';
  const nextStatus = req.body?.status;
  if (!validId(rawId) || !['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(nextStatus)) return res.status(400).json({ message: 'ข้อมูลสถานะคำสั่งซื้อไม่ถูกต้อง' });
  try {
    const { rows } = await query(
      `UPDATE orders SET status = $1 WHERE id = $2
       AND ($1 NOT IN ('SHIPPED', 'DELIVERED') OR payment_status = 'APPROVED')
       RETURNING id, status, payment_status`,
      [nextStatus, rawId],
    );
    if (!rows[0]) {
      const existing = await query('SELECT id FROM orders WHERE id = $1', [rawId]);
      if (!existing.rows[0]) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
      return res.status(409).json({ message: 'ต้องอนุมัติการชำระเงินก่อนเปลี่ยนสถานะเป็นจัดส่งหรือส่งถึงแล้ว' });
    }
    res.json({ order: { ...rows[0], id: `ORD-${String(rows[0].id).padStart(6, '0')}` } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'แก้ไขสถานะคำสั่งซื้อไม่สำเร็จ' }); }
});

app.get('/api/admin/users', requireRole('ADMIN'), async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length > 100) return res.status(400).json({ message: 'คำค้นหายาวเกินกำหนด' });
  try {
    const { rows } = await query(
      `SELECT id, username, name, email, role, artist_status, created_at
       FROM users WHERE ($1 = '' OR username ILIKE $2 OR name ILIKE $2 OR email ILIKE $2)
       ORDER BY CASE role WHEN 'ADMIN' THEN 0 WHEN 'ARTIST' THEN 1 ELSE 2 END, created_at DESC`,
      [q, `%${q}%`],
    );
    res.json({ users: rows.map((row) => ({ ...row, id: Number(row.id) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ' }); }
});

app.patch('/api/admin/users/:userId/role', requireRole('ADMIN'), async (req, res) => {
  if (!validId(req.params.userId) || !['MEMBER', 'ARTIST'].includes(req.body?.role)) return res.status(400).json({ message: 'บทบาทผู้ใช้ไม่ถูกต้อง' });
  if (Number(req.params.userId) === Number(req.session.userId)) return res.status(400).json({ message: 'ไม่สามารถเปลี่ยนบทบาทบัญชีแอดมินที่กำลังใช้งานได้' });
  try {
    const role = req.body.role;
    const artistStatus = role === 'ARTIST' ? 'APPROVED' : 'NOT_APPLIED';
    const { rows } = await query(
      "UPDATE users SET role = $1, artist_status = $2, updated_at = NOW() WHERE id = $3 AND role <> 'ADMIN' RETURNING id, username, name, email, role, artist_status, created_at",
      [role, artistStatus, req.params.userId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบผู้ใช้ หรือไม่สามารถแก้ไขบัญชีแอดมินได้' });
    res.json({ user: { ...rows[0], id: Number(rows[0].id) } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'เปลี่ยนบทบาทผู้ใช้ไม่สำเร็จ' }); }
});

app.get('/api/artist/sales', requireRole('ARTIST'), async (req, res) => {
  try {
    const [summaryResult, productResult, saleResult] = await Promise.all([
      query(
        `SELECT COUNT(DISTINCT o.id)::int AS order_count, COALESCE(SUM(i.quantity), 0)::int AS units_sold,
          COALESCE(SUM(i.unit_price * i.quantity), 0)::numeric AS gross_sales,
          COALESCE(SUM(i.unit_price * i.quantity) FILTER (WHERE o.payment_status = 'APPROVED'), 0)::numeric AS paid_sales
         FROM products p JOIN order_items i ON i.product_id = p.id JOIN orders o ON o.id = i.order_id
         WHERE p.owner_user_id = $1`, [req.session.userId],
      ),
      query(
        `SELECT p.id, p.title, p.image, p.active, COALESCE(SUM(i.quantity), 0)::int AS units_sold,
          COALESCE(SUM(i.unit_price * i.quantity), 0)::numeric AS gross_sales,
          COALESCE(SUM(i.unit_price * i.quantity) FILTER (WHERE o.payment_status = 'APPROVED'), 0)::numeric AS paid_sales
         FROM products p LEFT JOIN order_items i ON i.product_id = p.id LEFT JOIN orders o ON o.id = i.order_id
         WHERE p.owner_user_id = $1 GROUP BY p.id ORDER BY gross_sales DESC, p.id`, [req.session.userId],
      ),
      query(
        `SELECT o.id AS order_id, o.status, o.payment_status, o.created_at, i.title, i.unit_price, i.quantity,
          (i.unit_price * i.quantity)::numeric AS line_total, u.name AS customer_name
         FROM products p JOIN order_items i ON i.product_id = p.id JOIN orders o ON o.id = i.order_id
         JOIN users u ON u.id = o.user_id WHERE p.owner_user_id = $1
         ORDER BY o.created_at DESC, i.id DESC LIMIT 100`, [req.session.userId],
      ),
    ]);
    const numeric = (row) => ({ ...row, gross_sales: Number(row.gross_sales), paid_sales: Number(row.paid_sales) });
    res.json({
      summary: numeric(summaryResult.rows[0]),
      products: productResult.rows.map((row) => ({ ...numeric(row), id: Number(row.id), units_sold: Number(row.units_sold) })),
      sales: saleResult.rows.map((row) => ({ ...row, order_id: `ORD-${String(row.order_id).padStart(6, '0')}`, unit_price: Number(row.unit_price), quantity: Number(row.quantity), line_total: Number(row.line_total) })),
    });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดข้อมูลยอดขายไม่สำเร็จ' }); }
});

app.get('/api/products/categories', async (_req, res) => {
  try {
    const { rows } = await query('SELECT DISTINCT category FROM products WHERE active = TRUE ORDER BY category');
    res.json({ categories: rows.map((row) => row.category) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดหมวดหมู่ไม่สำเร็จ' }); }
});

app.get('/api/products', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  if (q.length > 100 || category.length > 80) return res.status(400).json({ message: 'คำค้นหาหรือหมวดหมู่ยาวเกินกำหนด' });
  const minPrice = req.query.minPrice === undefined || req.query.minPrice === '' ? null : Number(req.query.minPrice);
  const maxPrice = req.query.maxPrice === undefined || req.query.maxPrice === '' ? null : Number(req.query.maxPrice);
  if ((minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0))
    || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0))
    || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) {
    return res.status(400).json({ message: 'ช่วงราคาไม่ถูกต้อง' });
  }
  try {
    const { rows } = await query(
      `SELECT p.id, p.title, p.price, p.image, COALESCE(u.name, p.artist) AS artist,
         p.category, p.description, p.owner_user_id
       FROM products p LEFT JOIN users u ON u.id = p.owner_user_id
       WHERE p.active = TRUE
         AND ($1 = '' OR p.title ILIKE $2 OR COALESCE(u.name, p.artist) ILIKE $2)
         AND ($3 = '' OR p.category = $3)
         AND ($4::numeric IS NULL OR p.price >= $4)
         AND ($5::numeric IS NULL OR p.price <= $5)
       ORDER BY p.id`,
      [q, `%${q}%`, category, minPrice, maxPrice],
    );
    res.json({ products: rows.map((product) => ({ ...product, id: Number(product.id), owner_user_id: product.owner_user_id === null ? null : Number(product.owner_user_id), price: Number(product.price) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดสินค้าไม่สำเร็จ' }); }
});

app.get('/api/products/:productId/reviews', async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสผลงานไม่ถูกต้อง' });
  const userId = req.session.userId || null;
  try {
    const { rows: [product] } = await query('SELECT id FROM products WHERE id = $1 AND active = TRUE', [req.params.productId]);
    if (!product) return res.status(404).json({ message: 'ไม่พบผลงานนี้' });
    const [reviewResult, summaryResult, eligibilityResult, ownResult] = await Promise.all([
      query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
         FROM product_reviews r JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 100`, [req.params.productId],
      ),
      query('SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::numeric AS average_rating, COUNT(*)::int AS review_count FROM product_reviews WHERE product_id = $1', [req.params.productId]),
      userId ? query(
        `SELECT EXISTS(SELECT 1 FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE i.product_id = $1 AND o.user_id = $2 AND o.status = 'DELIVERED') AS eligible`, [req.params.productId, userId],
      ) : Promise.resolve({ rows: [{ eligible: false }] }),
      userId ? query('SELECT id, rating, comment FROM product_reviews WHERE product_id = $1 AND user_id = $2', [req.params.productId, userId]) : Promise.resolve({ rows: [] }),
    ]);
    res.json({
      averageRating: Number(summaryResult.rows[0].average_rating),
      reviewCount: Number(summaryResult.rows[0].review_count),
      canReview: Boolean(eligibilityResult.rows[0].eligible),
      myReview: ownResult.rows[0] || null,
      reviews: reviewResult.rows.map((row) => ({ ...row, id: Number(row.id), rating: Number(row.rating) })),
    });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดรีวิวไม่สำเร็จ' }); }
});

app.post('/api/products/:productId/reviews', requireUser, async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสผลงานไม่ถูกต้อง' });
  const rating = Number(req.body?.rating);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 1000) return res.status(400).json({ message: 'คะแนนต้องอยู่ระหว่าง 1–5 และรีวิวต้องไม่เกิน 1,000 ตัวอักษร' });
  try {
    const { rows } = await query(
      `INSERT INTO product_reviews (product_id, user_id, rating, comment)
       SELECT $1, $2, $3, $4 WHERE EXISTS (
         SELECT 1 FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE i.product_id = $1 AND o.user_id = $2 AND o.status = 'DELIVERED'
       )
       ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING id, rating, comment, created_at`,
      [req.params.productId, req.session.userId, rating, comment],
    );
    if (!rows[0]) return res.status(403).json({ message: 'รีวิวได้เมื่อมีคำสั่งซื้อผลงานนี้ที่จัดส่งแล้วเท่านั้น' });
    res.status(201).json({ review: { ...rows[0], id: Number(rows[0].id), rating: Number(rows[0].rating) } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'บันทึกรีวิวไม่สำเร็จ' }); }
});

app.get('/api/manage/products', requireRole('ADMIN', 'ARTIST'), async (req, res) => {
  try {
    const params = req.userRole === 'ADMIN' ? [] : [req.session.userId];
    const ownerFilter = req.userRole === 'ADMIN' ? '' : 'WHERE p.owner_user_id = $1';
    const { rows } = await query(
      `SELECT p.id, p.title, p.price, p.image, COALESCE(u.name, p.artist) AS artist,
         p.category, p.description, p.active, p.owner_user_id, u.email AS owner_email
       FROM products p LEFT JOIN users u ON u.id = p.owner_user_id ${ownerFilter}
       ORDER BY p.created_at DESC, p.id DESC`,
      params,
    );
    res.json({ products: rows.map((product) => ({ ...product, id: Number(product.id), owner_user_id: product.owner_user_id === null ? null : Number(product.owner_user_id), price: Number(product.price) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดผลงานที่จัดการไม่สำเร็จ' }); }
});

app.get('/api/manage/artists', requireRole('ADMIN'), async (_req, res) => {
  try {
    const { rows } = await query("SELECT id, name, email FROM users WHERE role = 'ARTIST' ORDER BY name, id");
    res.json({ artists: rows.map((artist) => ({ ...artist, id: Number(artist.id) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดรายชื่อศิลปินไม่สำเร็จ' }); }
});

app.post('/api/manage/products', requireRole('ADMIN', 'ARTIST'), async (req, res) => {
  const { value, error } = validateProductInput(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const owner = await resolveProductOwner(req, req.body?.ownerUserId);
    if (!owner) return res.status(400).json({ message: 'กรุณาเลือกบัญชีศิลปินที่เป็นเจ้าของผลงาน' });
    const { rows } = await query(
      `INSERT INTO products (title, price, image, artist, category, description, owner_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, price, image, artist, category, description, active, owner_user_id`,
      [value.title, value.price, value.image, owner.name, value.category, value.description, owner.id],
    );
    const product = rows[0];
    res.status(201).json({ product: { ...product, id: Number(product.id), owner_user_id: Number(product.owner_user_id), price: Number(product.price) } });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผลงานนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น' });
    console.error(error); res.status(500).json({ message: 'เพิ่มผลงานไม่สำเร็จ' });
  }
});

app.put('/api/manage/products/:productId', requireRole('ADMIN', 'ARTIST'), async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสผลงานไม่ถูกต้อง' });
  const { value, error } = validateProductInput(req.body);
  if (error) return res.status(400).json({ message: error });
  const active = req.body?.active === undefined ? true : req.body.active;
  if (typeof active !== 'boolean') return res.status(400).json({ message: 'สถานะผลงานไม่ถูกต้อง' });
  try {
    const owner = await resolveProductOwner(req, req.body?.ownerUserId);
    if (!owner) return res.status(400).json({ message: 'กรุณาเลือกบัญชีศิลปินที่เป็นเจ้าของผลงาน' });
    const ownerScope = req.userRole === 'ADMIN' ? '' : 'AND owner_user_id = $10';
    const params = [value.title, value.price, value.image, owner.name, value.category, value.description, owner.id, active, req.params.productId];
    const { rows } = await query(
      `UPDATE products SET title = $1, price = $2, image = $3, artist = $4, category = $5,
         description = $6, owner_user_id = $7, active = $8
       WHERE id = $9 ${ownerScope}
       RETURNING id, title, price, image, artist, category, description, active, owner_user_id`,
      req.userRole === 'ADMIN' ? params : [...params, req.session.userId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบผลงานหรือคุณไม่มีสิทธิ์แก้ไขผลงานนี้' });
    const product = rows[0];
    res.json({ product: { ...product, id: Number(product.id), owner_user_id: Number(product.owner_user_id), price: Number(product.price) } });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผลงานนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น' });
    console.error(error); res.status(500).json({ message: 'แก้ไขผลงานไม่สำเร็จ' });
  }
});

app.delete('/api/manage/products/:productId', requireRole('ADMIN', 'ARTIST'), async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสผลงานไม่ถูกต้อง' });
  try {
    const ownerScope = req.userRole === 'ADMIN' ? '' : 'AND owner_user_id = $2';
    const params = req.userRole === 'ADMIN' ? [req.params.productId] : [req.params.productId, req.session.userId];
    const { rowCount } = await query(`UPDATE products SET active = FALSE WHERE id = $1 ${ownerScope}`, params);
    if (!rowCount) return res.status(404).json({ message: 'ไม่พบผลงานหรือคุณไม่มีสิทธิ์จัดการผลงานนี้' });
    res.json({ ok: true });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ปิดการขายผลงานไม่สำเร็จ' }); }
});

app.get('/api/favorites', requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.id, p.title, p.price, p.image, COALESCE(u.name, p.artist) AS artist, p.category
       FROM favorites f JOIN products p ON p.id = f.product_id
       LEFT JOIN users u ON u.id = p.owner_user_id
       WHERE f.user_id = $1 AND p.active = TRUE ORDER BY f.created_at DESC`,
      [req.session.userId],
    );
    res.json({ products: rows.map((product) => ({ ...product, id: Number(product.id), price: Number(product.price) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดรายการโปรดไม่สำเร็จ' }); }
});

app.post('/api/favorites/:productId', requireUser, async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' });
  try {
    const { rowCount } = await query(
      `INSERT INTO favorites (user_id, product_id)
       SELECT $1, id FROM products WHERE id = $2 AND active = TRUE
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.session.userId, req.params.productId],
    );
    const exists = await query('SELECT 1 FROM products WHERE id = $1 AND active = TRUE', [req.params.productId]);
    if (!exists.rowCount) return res.status(404).json({ message: 'ไม่พบสินค้า' });
    res.status(rowCount ? 201 : 200).json({ ok: true });
  } catch (error) { console.error(error); res.status(500).json({ message: 'บันทึกรายการโปรดไม่สำเร็จ' }); }
});

app.delete('/api/favorites/:productId', requireUser, async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' });
  try {
    await query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [req.session.userId, req.params.productId]);
    res.json({ ok: true });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ลบรายการโปรดไม่สำเร็จ' }); }
});

app.get('/api/cart', requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.id, p.title, p.price, p.image, COALESCE(u.name, p.artist) AS artist, c.quantity
       FROM cart_items c JOIN products p ON p.id = c.product_id
       LEFT JOIN users u ON u.id = p.owner_user_id
       WHERE c.user_id = $1 AND p.active = TRUE ORDER BY c.created_at`,
      [req.session.userId],
    );
    res.json({ items: rows.map((item) => ({ ...item, id: Number(item.id), price: Number(item.price), quantity: Number(item.quantity) })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดตะกร้าไม่สำเร็จ' }); }
});

app.post('/api/cart/:productId', requireUser, async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' });
  try {
    const { rowCount } = await query(
      `INSERT INTO cart_items (user_id, product_id) SELECT $1, id FROM products WHERE id = $2 AND active = TRUE
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + 1`,
      [req.session.userId, req.params.productId],
    );
    if (!rowCount) return res.status(404).json({ message: 'ไม่พบสินค้า' });
    res.json({ ok: true });
  } catch (error) { console.error(error); res.status(500).json({ message: 'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ' }); }
});

app.delete('/api/cart/:productId', requireUser, async (req, res) => {
  if (!validId(req.params.productId)) return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' });
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.session.userId, req.params.productId]);
    res.json({ ok: true });
  } catch (error) { console.error(error); res.status(500).json({ message: 'นำสินค้าออกจากตะกร้าไม่สำเร็จ' }); }
});

app.post('/api/orders', requireUser, async (req, res) => {
  if (!validPromptPayId(getPromptPayId())) return res.status(503).json({ message: 'ร้านค้ายังไม่ได้ตั้งค่า PromptPay ID จึงยังรับคำสั่งซื้อไม่ได้' });
  const { shippingAddress } = req.body || {};
  if (!validateAddress(shippingAddress)) return res.status(400).json({ message: 'กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: items } = await client.query(
      `SELECT p.id, p.title, p.image, p.price, c.quantity
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1 AND p.active = TRUE FOR UPDATE OF c`,
      [req.session.userId],
    );
    if (!items.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'ตะกร้าสินค้าว่างเปล่า' });
    }
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const shippingFee = 200;
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, subtotal, shipping_fee, total, shipping_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, status, subtotal, shipping_fee, total, shipping_address, created_at`,
      [req.session.userId, subtotal, shippingFee, subtotal + shippingFee, JSON.stringify(shippingAddress)],
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, title, image, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.id, item.title, item.image, item.price, item.quantity],
      );
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.session.userId]);
    await client.query('COMMIT');
    res.status(201).json({ order: {
      ...order,
      id: `ORD-${String(order.id).padStart(6, '0')}`,
      subtotal: Number(order.subtotal), shipping_fee: Number(order.shipping_fee), total: Number(order.total),
      payment_status: 'AWAITING_PAYMENT',
    } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error); res.status(500).json({ message: 'สร้างคำสั่งซื้อไม่สำเร็จ' });
  } finally { client.release(); }
});

app.get('/api/orders', requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT o.id, o.status, o.payment_status, o.subtotal, o.shipping_fee, o.total, o.shipping_address,
         o.shipping_carrier, o.tracking_number, o.created_at,
         COALESCE(json_agg(json_build_object('title', i.title, 'price', i.unit_price, 'quantity', i.quantity, 'image', i.image))
           FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
       WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.session.userId],
    );
    res.json({ orders: rows.map((order) => ({
      ...order,
      id: `ORD-${String(order.id).padStart(6, '0')}`,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shipping_fee: Number(order.shipping_fee),
      shipping_address: order.shipping_address,
      payment_status: order.payment_status,
      date: new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: order.items.map((item) => ({ ...item, price: Number(item.price), quantity: Number(item.quantity) })),
    })) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดประวัติการสั่งซื้อไม่สำเร็จ' }); }
});

app.get('/api/orders/:orderId/payment-qr', requireUser, async (req, res) => {
  const rawId = String(req.params.orderId).replace(/^ORD-/, '').replace(/^0+/, '') || '0';
  if (!validId(rawId)) return res.status(400).json({ message: 'เลขที่คำสั่งซื้อไม่ถูกต้อง' });
  const promptPayId = getPromptPayId();
  if (!validPromptPayId(promptPayId)) {
    return res.status(503).json({ message: 'ร้านค้ายังไม่ได้ตั้งค่า PromptPay ID กรุณาติดต่อผู้ดูแลระบบ' });
  }
  try {
    const { rows } = await query(
      'SELECT total, payment_status FROM orders WHERE id = $1 AND user_id = $2',
      [rawId, req.session.userId],
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
    if (order.payment_status === 'APPROVED') return res.status(409).json({ message: 'คำสั่งซื้อนี้ชำระเงินแล้ว' });
    const amount = Number(order.total);
    const payload = generatePromptPayPayload(promptPayId, { amount });
    const qrCodeDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
    res.json({ payment: { method: 'PROMPTPAY_QR', amount, qrCodeDataUrl } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'สร้าง QR สำหรับชำระเงินไม่สำเร็จ' }); }
});

app.post('/api/orders/:orderId/payment-proof', requireUser, (req, res, next) => {
  paymentProofUpload.single('proof')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'ไฟล์หลักฐานต้องมีขนาดไม่เกิน 5 MB' });
    }
    return res.status(400).json({ message: 'รับไฟล์หลักฐานไม่สำเร็จ กรุณาเลือกไฟล์ JPG, PNG หรือ PDF' });
  });
}, async (req, res) => {
  const rawId = String(req.params.orderId).replace(/^ORD-/, '').replace(/^0+/, '') || '0';
  if (!validId(rawId)) return res.status(400).json({ message: 'เลขที่คำสั่งซื้อไม่ถูกต้อง' });
  if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์หลักฐานการชำระเงิน' });

  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
  const file = req.file;
  const isJpeg = file.buffer.length >= 3 && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  const isPng = file.buffer.length >= 8 && file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isPdf = file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (!allowedMimeTypes.has(file.mimetype) || !(
    (file.mimetype === 'image/jpeg' && isJpeg)
    || (file.mimetype === 'image/png' && isPng)
    || (file.mimetype === 'application/pdf' && isPdf)
  )) return res.status(400).json({ message: 'ชนิดไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ PDF ที่มีขนาดไม่เกิน 5 MB' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id, payment_status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [rawId, req.session.userId],
    );
    const order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
    }
    if (!['AWAITING_PAYMENT', 'REJECTED'].includes(order.payment_status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่ส่งหลักฐานการชำระเงินได้' });
    }
    const { rows: proofs } = await client.query(
      `INSERT INTO payment_proofs (order_id, user_id, mime_type, file_size, proof_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, submitted_at`,
      [order.id, req.session.userId, file.mimetype, file.size, file.buffer],
    );
    await client.query("UPDATE orders SET payment_status = 'PENDING_REVIEW' WHERE id = $1", [order.id]);
    await client.query('COMMIT');
    return res.status(201).json({
      message: 'ส่งหลักฐานการชำระเงินแล้ว รอผู้ดูแลตรวจสอบ',
      payment_status: 'PENDING_REVIEW',
      submitted_at: proofs[0].submitted_at,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'บันทึกหลักฐานการชำระเงินไม่สำเร็จ' });
  } finally { client.release(); }
});

app.get('/api/health', async (_req, res) => {
  try { await query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch { res.status(503).json({ ok: false, database: 'unavailable' }); }
});

app.post('/api/register', async (req, res) => {
  const { username, email, password, role = 'MEMBER' } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน' });
  if (!['MEMBER', 'ARTIST'].includes(role)) return res.status(400).json({ message: 'ประเภทบัญชีไม่ถูกต้อง' });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const isArtistApplication = role === 'ARTIST';
    const { rows } = await query(
      "INSERT INTO users (username, name, email, password_hash, role, artist_status) VALUES ($1, $1, LOWER($2), $3, 'MEMBER', $4) RETURNING id, username, name, email, phone, bio, role, artist_status, google_id",
      [username, email, passwordHash, isArtistApplication ? 'PENDING' : 'NOT_APPLIED'],
    );
    res.status(201).json({ message: isArtistApplication ? 'ส่งคำขอสมัครศิลปินแล้ว รอแอดมินอนุมัติ' : 'สมัครสมาชิกสำเร็จ', user: publicUser(rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้มีผู้ใช้งานแล้ว' });
    console.error(error); res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe = false } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  if (typeof rememberMe !== 'boolean') return res.status(400).json({ message: 'ค่าการจดจำการเข้าสู่ระบบไม่ถูกต้อง' });
  try {
    const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = rows[0];
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    req.session.cookie.maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : null;
    req.session.userId = user.id;
    res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: publicUser(user) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'เข้าสู่ระบบไม่สำเร็จ' }); }
});

app.get('/api/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return res.status(503).send('ระบบเข้าสู่ระบบด้วย Google ยังตั้งค่าไม่ครบ');
  passport.authenticate('google', { scope: ['openid', 'email', 'profile'], state: true, prompt: 'select_account' })(req, res, next);
});

app.get('/api/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (error, user, info) => {
    if (error || !user) {
      const reason = info?.code === 'account_required' || info?.code === 'google_account_mismatch'
        ? info.code
        : 'google_login_failed';
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${reason}`);
    }
    req.logIn(user, (loginError) => {
      if (loginError) return res.redirect(`${frontendUrl}/auth/google/callback?error=session_failed`);
      req.session.userId = user.id;
      req.session.save((saveError) => {
        if (saveError) return res.redirect(`${frontendUrl}/auth/google/callback?error=session_failed`);
        res.redirect(`${frontendUrl}/auth/google/callback`);
      });
    });
  })(req, res, next);
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'ยังไม่ได้เข้าสู่ระบบ' });
  try {
    const { rows } = await query('SELECT id, username, name, email, phone, bio, role, artist_status, google_id FROM users WHERE id = $1', [req.session.userId]);
    if (!rows[0]) return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    res.json({ user: publicUser(rows[0]) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ตรวจสอบ session ไม่สำเร็จ' }); }
});

const addressFields = ['recipientName', 'phone', 'addressLine', 'province', 'district', 'subdistrict', 'postalCode'];
const addressFromRow = (row) => ({
  id: Number(row.id), recipientName: row.recipient_name, phone: row.phone, addressLine: row.address_line,
  province: row.province, district: row.district, subdistrict: row.subdistrict,
  postalCode: row.postal_code, notes: row.notes || '',
});
const validateSavedAddress = (body) => {
  if (!body || addressFields.some((field) => typeof body[field] !== 'string' || !body[field].trim())) return false;
  const limits = { recipientName: 160, phone: 30, addressLine: 250, province: 100, district: 100, subdistrict: 100, postalCode: 20 };
  return addressFields.every((field) => body[field].trim().length <= limits[field])
    && (body.notes === undefined || (typeof body.notes === 'string' && body.notes.length <= 1000));
};

app.get('/api/addresses', requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, recipient_name, phone, address_line, province, district, subdistrict, postal_code, notes FROM user_addresses WHERE user_id = $1 ORDER BY updated_at DESC, id DESC',
      [req.session.userId],
    );
    res.json({ addresses: rows.map(addressFromRow) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'โหลดที่อยู่จัดส่งไม่สำเร็จ' }); }
});

app.post('/api/addresses', requireUser, async (req, res) => {
  if (!validateSavedAddress(req.body)) return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่อยู่ให้ครบและถูกต้อง' });
  const address = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, province, district, subdistrict, postal_code, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, recipient_name, phone, address_line, province, district, subdistrict, postal_code, notes`,
      [req.session.userId, ...addressFields.map((field) => address[field].trim()), (address.notes || '').trim()],
    );
    res.status(201).json({ address: addressFromRow(rows[0]) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'บันทึกที่อยู่ไม่สำเร็จ' }); }
});

app.patch('/api/addresses/:addressId', requireUser, async (req, res) => {
  if (!validId(req.params.addressId)) return res.status(400).json({ message: 'รหัสที่อยู่ไม่ถูกต้อง' });
  if (!validateSavedAddress(req.body)) return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่อยู่ให้ครบและถูกต้อง' });
  const address = req.body;
  try {
    const { rows } = await query(
      `UPDATE user_addresses SET recipient_name = $1, phone = $2, address_line = $3, province = $4, district = $5,
         subdistrict = $6, postal_code = $7, notes = $8, updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING id, recipient_name, phone, address_line, province, district, subdistrict, postal_code, notes`,
      [...addressFields.map((field) => address[field].trim()), (address.notes || '').trim(), req.params.addressId, req.session.userId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบที่อยู่นี้' });
    res.json({ address: addressFromRow(rows[0]) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'แก้ไขที่อยู่ไม่สำเร็จ' }); }
});

app.delete('/api/addresses/:addressId', requireUser, async (req, res) => {
  if (!validId(req.params.addressId)) return res.status(400).json({ message: 'รหัสที่อยู่ไม่ถูกต้อง' });
  try {
    const { rowCount } = await query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [req.params.addressId, req.session.userId]);
    if (!rowCount) return res.status(404).json({ message: 'ไม่พบที่อยู่นี้' });
    res.json({ ok: true });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ลบที่อยู่ไม่สำเร็จ' }); }
});

app.patch('/api/profile', requireUser, async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim() : '';
  if (!username || username.length > 80) return res.status(400).json({ message: 'ชื่อผู้ใช้ต้องมีความยาว 1–80 ตัวอักษร' });
  if (!name || name.length > 160) return res.status(400).json({ message: 'ชื่อต้องมีความยาว 1–160 ตัวอักษร' });
  if (phone.length > 30) return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องไม่เกิน 30 ตัวอักษร' });
  if (bio.length > 2000) return res.status(400).json({ message: 'Bio ต้องไม่เกิน 2,000 ตัวอักษร' });
  try {
    const { rows } = await query(
      `UPDATE users SET username = $1, name = $2, phone = $3, bio = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, username, name, email, phone, bio, role, artist_status, google_id`,
      [username, name, phone || null, bio, req.session.userId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'ชื่อผู้ใช้งานนี้มีผู้ใช้แล้ว' });
    console.error(error); res.status(500).json({ message: 'บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ' });
  }
});

app.post('/api/logout', (req, res) => req.logout((error) => {
  if (error) return res.status(500).json({ message: 'ออกจากระบบไม่สำเร็จ' });
  req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ ok: true }); });
}));

app.use('/api', (_req, res) => res.status(404).json({ message: 'ไม่พบ API เส้นทางนี้ กรุณาตรวจสอบเวอร์ชัน Backend' }));

await query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
const server = app.listen(port, () => console.log(`V-ART API listening on http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
