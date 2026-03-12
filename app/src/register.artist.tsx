import React, { useState } from 'react';
import './register.css'; // ใช้ CSS ตัวเดิมได้เลยครับ สวยอยู่แล้ว
import { User, Mail, Lock, ArrowRight, Palette, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterArtistPage: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          role: 'ARTIST' // ⭐️ จุดสำคัญ: บังคับส่งสิทธิ์เป็น ศิลปิน
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('🎨 สมัครสมาชิกศิลปินสำเร็จ! ยินดีต้อนรับสู่พื้นที่แสดงผลงานครับ');
        navigate('/login');
      } else {
        setErrorMessage(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

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
            <label htmlFor="username">ชื่อศิลปิน (Username)</label>
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