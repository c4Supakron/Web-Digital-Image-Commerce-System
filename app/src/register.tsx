import React from 'react';
import './register.css'
import { User, Mail, Lock, ArrowRight, Chrome, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  return (
    <div className="clean-layout">
      
      {/* Background Glow (ใช้เหมือนหน้า Login เพื่อความต่อเนื่อง) */}
      <div className="soft-glow-1"></div>
      <div className="soft-glow-2"></div>

      <div className="clean-card">
        <div className="clean-header">
          <h1>Create Account</h1>
          <p>Join us today! It takes only a few steps.</p>
        </div>

        <form className="clean-form" onSubmit={(e) => e.preventDefault()}>
          
          {/* Username */}
          <div className="clean-input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input type="text" id="username" placeholder="Enter your username" required />
            </div>
          </div>

          {/* Email */}
          <div className="clean-input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" id="email" placeholder="Enter your email" required />
            </div>
          </div>

          {/* Password */}
          <div className="clean-input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type="password" id="password" placeholder="Create a password" required />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="clean-input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type="password" id="confirm-password" placeholder="Confirm your password" required />
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="clean-options" style={{ justifyContent: 'flex-start' }}>
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="custom-checkmark"></span>
              <span className="checkbox-text">I agree to the <a href="#" style={{color: '#3b82f6'}}>Terms & Privacy</a></span>
            </label>
          </div>

          <button type="submit" className="clean-btn-primary">
            Sign Up <ArrowRight size={18} />
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
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;