import React, { useState } from 'react';
import './profile.css';
import { Menu, Search, Heart, ShoppingBag, User, X, Facebook, Chrome } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="clean-page">
      
      {/* --- NAVBAR --- */}
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={32} color="#000" strokeWidth={2} />
          </button>
          <Link to="/" className="brand-logo">V-ART</Link>
        </div>
        <div className="nav-icons">
  <Link to="/shop"><Search size={22} /></Link>
  <Link to="/favorites"><Heart size={22} /></Link> {/* หัวใจ -> ไปหน้ารายการโปรด */}
  <Link to="/cart"><ShoppingBag size={22} /></Link>
  <Link to="/login"><User size={22} /></Link> {/* รูปคน -> ไปหน้าโปรไฟล์ */}
</div>
      </nav>

      {/* --- SIDEBAR --- */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
        <ul className="sidebar-menu">
            <li><Link to="/">HOME</Link></li>
            <li><Link to="/shop">SHOP</Link></li>
            <li><Link to="/profile" style={{fontWeight: 'bold'}}>PROFILE</Link></li>
            <li><Link to="/address">ADDRESS</Link></li>
            <li><Link to="/orders">ORDER HISTORY</Link></li>
            <li className="special-menu" style={{ marginTop: '20px' }}>
              <Link to="/register.artist">JOIN AS AN ARTIST</Link>
            </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="form-container">
        <div className="form-header">
          <h2>Profile</h2>
          <p>Manage your personal information and contacts.</p>
        </div>

        <form className="spacious-form">
            <div className="input-group">
              <label>Username</label>
              <input type="text" placeholder="Your username" />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Email</label>
                <input type="email" placeholder="example@email.com" />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="08X-XXX-XXXX" />
              </div>
            </div>

            <div className="input-group">
              <label>Bio / About Me</label>
              <textarea rows={4} placeholder="Tell us a little about yourself..."></textarea>
            </div>

            <div className="input-group">
              <label>Social Connections</label>
              <div className="social-connect">
                <button type="button" className="social-btn-outline"><Chrome size={20} /> Connect Google</button>
                <button type="button" className="social-btn-outline"><Facebook size={20} /> Connect Facebook</button>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-save">Save Changes</button>
            </div>
        </form>
      </div>

    </div>
  );
};

export default ProfilePage;