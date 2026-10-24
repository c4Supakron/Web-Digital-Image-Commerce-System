export interface User {
  id: number;
  username: string;
  name?: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'ARTIST' | 'MEMBER' | string;
  artist_status?: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function loginUser(email: string, password: string, rememberMe = false): Promise<{ ok: boolean; message: string; user?: User }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (res.ok) {
      const user = data.user || data;
      return { ok: true, message: data.message || 'เข้าสู่ระบบสำเร็จ!', user };
    } else {
      return { ok: false, message: data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
  } catch {
    return { ok: false, message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์และฐานข้อมูล PostgreSQL กำลังทำงานอยู่' };
  }
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  role: 'ARTIST' | 'MEMBER' = 'MEMBER'
): Promise<{ ok: boolean; message: string; user?: User }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (res.ok) {
      const user = data.user || data;
      return { ok: true, message: data.message || 'สมัครสมาชิกสำเร็จ!', user };
    } else {
      return { ok: false, message: data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
    }
  } catch {
    return { ok: false, message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์และฐานข้อมูล PostgreSQL กำลังทำงานอยู่' };
  }
}
