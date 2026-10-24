import React, { useState } from 'react';
import './login.css'
import { ArrowRight, Mail, Lock, Chrome, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../mockData.ts';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. สร้าง State เก็บค่าอีเมล รหัสผ่าน และข้อความ Error
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    window.location.assign(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/google`);
  };

  // 2. ฟังก์ชันหลักที่จะทำงานตอนกดปุ่ม "เข้าสู่ระบบ"
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // เคลียร์ข้อความ Error เก่า

    const result = await loginUser(email, password, rememberMe);

    if (result.ok && result.user) {
      // เก็บข้อมูล User (ชื่อ, อีเมล, สิทธิ์) ไว้ในเครื่อง
      localStorage.setItem('user', JSON.stringify(result.user));

      alert(result.message || '✅ เข้าสู่ระบบสำเร็จ!');

      // 🌟 เช็ค Role เพื่อเด้งไปหน้าที่ถูกต้อง
      const role = result.user.role?.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin'); // ถ้าเป็นแอดมิน ไปหน้าแดชบอร์ดแอดมิน
      } else if (role === 'ARTIST') {
        navigate('/artist-dashboard'); // ถ้าเป็นศิลปิน ไปหน้าจัดการผลงาน
      } else if (result.user.artist_status === 'PENDING' || result.user.artist_status === 'REJECTED') {
        navigate('/artist-dashboard');
      } else {
        navigate('/'); // ถ้าเป็นลูกค้า (MEMBER) กลับไปหน้าแรกเพื่อเลือกซื้อของ
      }
    } else {
      setErrorMessage(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  return (
    <div className="clean-layout"> 
      
      {/* ปุ่มหน้าหลัก มุมซ้ายบน */}
      <Link to="/" className="home-link">
        <Home size={28} /> หน้าหลัก
      </Link>

      <div className="soft-glow-1"></div>
      <div className="soft-glow-2"></div>

      <div className="clean-card">
        <div className="clean-header">
          <h1>เข้าสู่ระบบ</h1>
        </div>

        {/* จุดที่เพิ่มมา: โชว์ข้อความ Error สีแดง ถ้าล็อกอินไม่ผ่าน */}
        {errorMessage && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        {/* เรียกใช้ฟังก์ชัน handleLogin ของเรา */}
        <form className="clean-form" onSubmit={handleLogin}>
          
          <div className="clean-input-group">
            <label htmlFor="email">อีเมล</label>
            <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  id="email" 
                  placeholder="กรอกอีเมลของคุณ" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // ผูกค่า
                />
            </div>
          </div>

          <div className="clean-input-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // ผูกค่า
                />
            </div>
          </div>

          <div className="clean-options">
            <label className="checkbox-container">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span className="custom-checkmark"></span>
              <span className="checkbox-text">จดจำการเข้าสู่ระบบ 7 วัน</span>
            </label>
            <span className="password-help">ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ</span>
          </div>

          <button type="submit" className="clean-btn-primary">
            เข้าสู่ระบบ <ArrowRight size={18} />
          </button>
        </form>

        <div className="clean-divider"><span>หรือ</span></div>

        <div className="social-buttons">
          <button type="button" className="social-btn" onClick={handleGoogleLogin}>
            <Chrome size={20} className="google-icon" /> Google
          </button>
        </div>
        <p className="password-help" style={{ textAlign: 'center', marginTop: '10px' }}>
          ผู้ใช้ใหม่ต้องสมัครสมาชิกก่อน และใช้ Google ด้วยอีเมลเดียวกัน
        </p>

        <p className="clean-footer">
          ยังไม่มีบัญชีผู้ใช้? <Link to="/register">สมัครสมาชิกฟรี</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
