import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import prisma from './db';

const app = express();
app.use(cors());
app.use(express.json());

// API: สมัครสมาชิก
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("📥 มีข้อมูลส่งเข้ามาจากหน้าเว็บ:", req.body);
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: "อีเมลหรือชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ!", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เซิร์ฟเวอร์มีปัญหา" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 เซิร์ฟเวอร์รันแล้วที่ http://localhost:${PORT}`);
});

// ==========================================
// API 2: เข้าสู่ระบบ (Login)
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. ค้นหาผู้ใช้จากอีเมลในฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    // ถ้าหาอีเมลไม่เจอ
    if (!user) {
      return res.status(400).json({ message: "ไม่พบอีเมลนี้ในระบบ หรือยังไม่ได้สมัครสมาชิก" });
    }

    // 2. ถ้าระบบเจออีเมล จะเอาเอาท์พุตที่ลูกค้าพิมพ์ มาเทียบกับรหัสที่เข้ารหัสไว้ใน Database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // ถ้ารหัสผ่านไม่ตรงกัน
    if (!isPasswordValid) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" });
    }

    // 3. ถ้าอีเมลถูกและรหัสผ่านถูก (เข้าสู่ระบบสำเร็จ!)
    res.status(200).json({ 
      message: "เข้าสู่ระบบสำเร็จ!", 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ==========================================
// API 1: สมัครสมาชิก (ฉบับอัปเกรด: รองรับการเปลี่ยน Member เป็น Artist)
// ==========================================
app.post('/api/register.artist', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. เช็คก่อนว่ามี "อีเมล" นี้ในระบบไหม?
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUserByEmail) {
      if (role === 'ARTIST') {
        const isPasswordValid = await bcrypt.compare(password, existingUserByEmail.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง กรุณาใส่รหัสผ่านเดิมเพื่ออัปเกรดเป็นศิลปิน" });
        }
        if (existingUserByEmail.role === 'ARTIST') {
          return res.status(400).json({ message: "บัญชีนี้เป็นศิลปินอยู่แล้วครับ" });
        }

        const updatedUser = await prisma.user.update({
          where: { email: email },
          data: { role: 'ARTIST', username: username }
        });
        return res.status(200).json({ message: "อัปเกรดบัญชีเป็นศิลปินสำเร็จ!", user: updatedUser });
      }
      return res.status(400).json({ message: "อีเมลนี้มีคนใช้แล้วครับ" });
    }

    // 2. เช็คชื่อ Username ซ้ำ
    const existingUserByName = await prisma.user.findUnique({
      where: { username: username }
    });
    if (existingUserByName) {
      return res.status(400).json({ message: "ชื่อผู้ใช้งานนี้มีคนใช้แล้ว กรุณาตั้งชื่อใหม่ครับ" });
    }

    // 3. สมัครใหม่
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, role: role || "MEMBER" }
    });
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ!", user: newUser });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});