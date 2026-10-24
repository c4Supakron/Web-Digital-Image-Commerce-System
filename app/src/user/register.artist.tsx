import React, { useEffect, useState } from 'react';
import './register.css'; // ใช้ CSS ตัวเดิมได้เลยครับ สวยอยู่แล้ว
import { User, Mail, Lock, ArrowRight, Palette, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../mockData.ts';
import { submitArtistApplication } from '../api';
import type { User as AppUser } from '../mockData';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const RegisterArtistPage: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [signedInUser, setSignedInUser] = useState<AppUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) setSignedInUser(data.user);
      })
      .catch(() => undefined)
      .finally(() => setCheckingSession(false));
  }, []);

  const handleApply = async () => {
    setSubmittingApplication(true);
    setErrorMessage('');
    try {
      const result = await submitArtistApplication();
      setSignedInUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
      setErrorMessage(result.message);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'ส่งคำขอไม่สำเร็จ'); }
    finally { setSubmittingApplication(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน!');
      return;
    }

    const result = await registerUser(username, email, password, 'ARTIST');

    if (result.ok) {
      if (result.user) localStorage.setItem('user', JSON.stringify(result.user));
      alert(result.message || 'ส่งคำขอสมัครศิลปินแล้ว รอแอดมินอนุมัติ');
      navigate('/artist-dashboard');
    } else {
      setErrorMessage(result.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  if (checkingSession) return <main className="clean-layout"><section className="clean-card"><p>กำลังตรวจสอบบัญชี...</p></section></main>;
  if (signedInUser) return <div className="clean-layout">
    <Link to="/" className="home-link"><Home size={28} /> หน้าหลัก</Link>
    <section className="clean-card" style={{ borderTop: '4px solid #a855f7', textAlign: 'center' }}>
      <Palette size={40} color="#a855f7" />
      <h1>สมัครเป็นศิลปิน</h1>
      <p>{signedInUser.role === 'ADMIN' ? 'บัญชีนี้เป็นแอดมิน' : signedInUser.role === 'ARTIST' ? 'บัญชีนี้ได้รับอนุมัติเป็นศิลปินแล้ว' : signedInUser.artist_status === 'PENDING' ? 'คำขอของคุณกำลังรอแอดมินอนุมัติ' : signedInUser.artist_status === 'REJECTED' ? 'คำขอก่อนหน้าถูกปฏิเสธ คุณสามารถส่งคำขอใหม่ได้' : 'ส่งคำขอจากบัญชีที่เข้าสู่ระบบอยู่'}</p>
      {errorMessage && <p role="status">{errorMessage}</p>}
      {signedInUser.role === 'ADMIN' ? <button type="button" className="clean-btn-primary" onClick={() => navigate('/admin')}>ไปหน้าแอดมิน</button> : signedInUser.role === 'ARTIST' ? <button type="button" className="clean-btn-primary" onClick={() => navigate('/artist-dashboard')}>ไปหน้าแดชบอร์ดศิลปิน</button> : signedInUser.artist_status !== 'PENDING' && <button type="button" className="clean-btn-primary" disabled={submittingApplication} onClick={() => void handleApply()}>{submittingApplication ? 'กำลังส่งคำขอ...' : signedInUser.artist_status === 'REJECTED' ? 'ส่งคำขอใหม่' : 'ส่งคำขอสมัครศิลปิน'}</button>}
    </section>
  </div>;

  return (
    <div className="clean-layout">
      
      <Link to="/" className="home-link">
        <Home size={28} /> หน้าหลัก
      </Link>

      <div className="soft-glow-1" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)'}}></div>
      <div className="soft-glow-2"></div>

      <div className="clean-card" style={{ borderTop: '4px solid #a855f7' }}>
        <div className="clean-header">
          <Palette size={40} color="#a855f7" style={{ marginBottom: '10px' }} />
          <h1>สมัครเป็นศิลปิน</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '5px' }}>
            สร้างบัญชีเพื่อลงขายและจัดแสดงผลงานศิลปะของคุณ
          </p>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        <form className="clean-form" onSubmit={handleRegister}>
          
          <div className="clean-input-group">
            <label htmlFor="username">ชื่อศิลปิน</label>
            <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" id="username" placeholder="นามปากกา หรือ ชื่อผู้ใช้งาน" required 
                  value={username} onChange={(e) => setUsername(e.target.value)}
                />
            </div>
          </div>

          <div className="clean-input-group">
            <label htmlFor="email">อีเมลสำหรับติดต่อ</label>
            <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" id="email" placeholder="กรอกอีเมลของคุณ" required 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>

          <div className="clean-input-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" id="password" placeholder="ตั้งรหัสผ่านของคุณ" required 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
            </div>
          </div>

          <div className="clean-input-group">
            <label htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" id="confirm-password" placeholder="กรอกรหัสผ่านอีกครั้ง" required 
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
          </div>

          <button type="submit" className="clean-btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}>
            เปิดร้านศิลปิน <ArrowRight size={18} />
          </button>
        </form>

        <p className="clean-footer" style={{ marginTop: '20px' }}>
          เป็นสมาชิกทั่วไปใช่ไหม? <Link to="/register" style={{ color: '#a855f7' }}>สมัครสมาชิกปกติ</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterArtistPage;
