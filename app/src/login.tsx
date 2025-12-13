import React from 'react';
import './login.css'
import { ArrowRight, Mail, Lock, Chrome, Facebook, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // จำลองการ Login สำเร็จ -> ให้เด้งไปหน้าแรก (/)
    navigate('/');
  };

  return (
    <div className="clean-layout"> 
      
      {/* ปุ่ม HOME มุมซ้ายบน (กดแล้วกลับหน้าหลัก) */}
      <Link to="/" className="home-link">
        <Home size={28} /> HOME
      </Link>

      <div className="soft-glow-1"></div>
      <div className="soft-glow-2"></div>

      <div className="clean-card">
        <div className="clean-header">
          <h1>Artist Login</h1>
          <p>Welcome back! Please enter your details.</p>
        </div>

        {/* เรียกใช้ handleLogin เมื่อกดปุ่ม Sign In */}
        <form className="clean-form" onSubmit={handleLogin}>
          
          <div className="clean-input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" id="email" placeholder="Enter your email" required />
            </div>
          </div>

          <div className="clean-input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type="password" id="password" placeholder="••••••••" required />
            </div>
          </div>

          <div className="clean-options">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="custom-checkmark"></span>
              <span className="checkbox-text">Stay signed in</span>
            </label>
            
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="clean-btn-primary">
            Sign In <ArrowRight size={18} />
          </button>
        </form>

        <div className="clean-divider"><span>OR</span></div>

        <div className="social-buttons">
          <button type="button" className="social-btn">
            <Chrome size={20} className="google-icon" /> Google
          </button>
          <button type="button" className="social-btn">
            <Facebook size={20} className="fb-icon" /> Facebook
          </button>
        </div>

        <p className="clean-footer">
          Don't have an account? <Link to="/register">Sign up for free</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;