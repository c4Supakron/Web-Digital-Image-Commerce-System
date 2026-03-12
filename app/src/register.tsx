import React, { useState } from 'react';
import './register.css';
import { User, Mail, Lock, ArrowRight, Chrome, Facebook } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. สร้างตัวแปรเก็บค่าที่ผู้ใช้พิมพ์
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // ตัวแปรเก็บข้อความ Error เอาไว้โชว์หน้าเว็บ
  const [errorMessage, setErrorMessage] = useState('');

  // 2. ฟังก์ชันหลักที่จะทำงานตอนกดปุ่ม "สมัครสมาชิก"
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // ห้ามหน้าเว็บรีเฟรช
    setErrorMessage(''); // เคลียร์ข้อความ Error เก่า

    // เช็ครหัสผ่านให้ตรงกันก่อนส่งไปหลังบ้าน
    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน!');
      return;
    }

    try {
      // ยิงข้อมูลไปหาหลังบ้านที่ Port 5000
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('🎉 สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        navigate('/login'); // เด้งไปหน้าเข้าสู่ระบบอัตโนมัติ
      } else {
        setErrorMessage(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }

    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (เช็คว่ารันหลังบ้านหรือยัง)');
    }
  };

  return (
    <div className="clean-layout">
      
      <div className="soft-glow-1"></div>
      <div className="soft-glow-2"></div>

      <div className="clean-card">
        <div className="clean-header">
          <h1>สร้างบัญชีผู้ใช้</h1>
        </div>

        {/* จุดที่เพิ่มมา: ถ้ามี Error ให้โชว์กล่องข้อความสีแดงตรงนี้ */}
        {errorMessage && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        {/* เปลี่ยน onSubmit มาเรียกใช้ฟังก์ชัน handleRegister ของเรา */}
        <form className="clean-form" onSubmit={handleRegister}>
          
          {/* Username */}
          <div className="clean-input-group">
            <label htmlFor="username">ชื่อผู้ใช้งาน (Username)</label>
            <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  id="username" 
                  placeholder="ตั้งชื่อผู้ใช้งานของคุณ" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)} // ผูกค่าเข้ากับ State
                />
            </div>
          </div>

          {/* Email */}
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
                  onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>

          {/* Password */}
          <div className="clean-input-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="password" 
                  placeholder="ตั้งรหัสผ่านของคุณ" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="clean-input-group">
            <label htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="confirm-password" 
                  placeholder="กรอกรหัสผ่านอีกครั้ง" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="clean-options" style={{ justifyContent: 'flex-start' }}>
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="custom-checkmark"></span>
              <span className="checkbox-text">ฉันยอมรับ <a href="#" style={{color: '#3b82f6'}}>ข้อตกลงและเงื่อนไข</a></span>
            </label>
          </div>

          <button type="submit" className="clean-btn-primary">
            สมัครสมาชิก <ArrowRight size={18} />
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
          มีบัญชีผู้ใช้อยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;