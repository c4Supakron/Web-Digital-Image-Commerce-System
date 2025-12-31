import React, { useState } from 'react';
import { Menu, Search, Heart, ShoppingCart, X, Facebook, Chrome } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="profile-container-v2">
      
      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="nav-left">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
             <Menu size={32} color="black" strokeWidth={2.5} />
          </button>
        </div>
        <div className="nav-center">
          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <Search size={20} className="search-icon" color="#666" />
          </div>
        </div>
        <div className="nav-right">
           <Heart size={26} className="nav-icon" color="black" />
           <ShoppingCart size={26} className="nav-icon" color="black" />
           <Link to="/login" className="login-pill-btn">LOG IN</Link>
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
            <li><Link to="/profile" className="active-link">PROFILE</Link></li>
            <li><Link to="/address">ADDRESS</Link></li>
            <li><Link to="/contact">CONTACT</Link></li>
            <li><Link to="/orders">ORDER HISTORY</Link></li>
            <li className="special-menu"><Link to="/join-artist">JOIN AS AN ARTIST</Link></li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="profile-content-v2">
        
        <h1 className="profile-heading">Profile</h1>
        <hr className="profile-divider" />

        <form className="profile-grid-form">
            
            {/* Username */}
            <label className="profile-label">Username*</label>
            <input type="text" className="profile-input-box" />

            {/* Email */}
            <label className="profile-label">Email*</label>
            <input type="email" className="profile-input-box" />

            {/* Phone */}
            <label className="profile-label">Phone number*</label>
            <input type="tel" className="profile-input-box short" />

            {/* Address */}
            <label className="profile-label top-aligned">Address*</label>
            <textarea className="profile-input-box tall"></textarea>

            {/* Social */}
            <label className="profile-label">Social</label>
            <div className="profile-input-box social-container">
                <Chrome size={20} className="social-icon google" />
                <Facebook size={20} className="social-icon facebook" />
            </div>

            {/* --- เพิ่มปุ่มบันทึกตรงนี้ครับ --- */}
            <div className="profile-form-actions">
                <button type="button" className="save-btn">บันทึก</button>
            </div>

        </form>
      </div>

    </div>
  );
};

export default ProfilePage;