import React, { useState } from 'react';
import './login.css'
import { ArrowRight, Mail, Lock, Chrome, Facebook, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. สร้าง State เก็บค่าอีเมล รหัสผ่าน และข้อความ Error
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 2. ฟังก์ชันหลักที่จะทำงานตอนกดปุ่ม "เข้าสู่ระบบ"
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // เคลียร์ข้อความ Error เก่า

    try {
      // ส่งข้อมูลไปถามหลังบ้านว่า อีเมลและรหัสผ่านนี้มีจริงไหม?
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // ถ้าเข้าสู่ระบบสำเร็จ!
        // เก็บข้อมูล User (ชื่อ, อีเมล, สิทธิ์) ไว้ในเครื่อง (localStorage) เพื่อเอาไปใช้หน้าอื่น
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('✅ ' + data.message);
        navigate('/'); // เด้งไปหน้าแรก
      } else {
        // ถ้ารหัสผิด หรือไม่มีอีเมลนี้ ให้โชว์ Error
        setErrorMessage(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (เช็คว่ารันหลังบ้านหรือยัง)');
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
              <input type="checkbox" />
              <span className="custom-checkmark"></span>
              <span className="checkbox-text">จดจำการเข้าสู่ระบบ</span>
            </label>
            
            <a href="/forgot-password">ลืมรหัสผ่าน?</a>
          </div>

          <button type="submit" className="clean-btn-primary">
            เข้าสู่ระบบ <ArrowRight size={18} />
          </button>
        </form>

        <div className="clean-divider"><span>หรือ</span></div>

        <div className="social-buttons">
          <button type="button" className="social-btn">
            <Chrome size={20} className="google-icon" /> Google
          </button>
          <button type="button" className="social-btn">
            <Facebook size={20} className="fb-icon" /> Facebook
          </button>
        </div>

        <p className="clean-footer">
          ยังไม่มีบัญชีผู้ใช้? <Link to="/register">สมัครสมาชิกฟรี</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;