import React, { useState } from 'react';
import './address.css'; 
import { Menu, Search, Heart, ShoppingBag, User, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const AddressPage: React.FC = () => {
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
            <li><Link to="/profile">PROFILE</Link></li>
            <li><Link to="/address" style={{fontWeight: 'bold'}}>ADDRESS</Link></li>
            <li><Link to="/orders">ORDER HISTORY</Link></li>
            <li className="special-menu" style={{ marginTop: '20px' }}>
              <Link to="/register.artist">JOIN AS AN ARTIST</Link>
            </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="form-container">
        
        <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2>Address</h2>
            <p>Shipping information for your art deliveries.</p>
          </div>
          <button className="btn-add-new"><Plus size={18} /> Add New Address</button>
        </div>

        <form className="spacious-form">
            <div className="form-row">
              <div className="input-group">
                <label>First Name *</label>
                <input type="text" placeholder="First Name" />
              </div>
              <div className="input-group">
                <label>Last Name *</label>
                <input type="text" placeholder="Last Name" />
              </div>
            </div>

            <div className="input-group">
              <label>Phone Number *</label>
              <input type="tel" placeholder="08X-XXX-XXXX" />
            </div>

            <div className="input-group">
              <label>Address (House No., Street) *</label>
              <input type="text" placeholder="Enter your full address" />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Province *</label>
                <select className="clean-select">
                    <option>Bangkok</option>
                    <option>Chiang Mai</option>
                    <option>Khon Kaen</option>
                    <option>Phuket</option>
                </select>
              </div>
              <div className="input-group">
                <label>District *</label>
                <input type="text" placeholder="District" />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Sub-district *</label>
                <input type="text" placeholder="Sub-district" />
              </div>
              <div className="input-group">
                <label>Postal Code *</label>
                <input type="text" placeholder="10000" />
              </div>
            </div>

            <div className="input-group">
              <label>Additional Notes</label>
              <textarea rows={2} placeholder="E.g., Near the post office, leave at front desk"></textarea>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-save">Save Address</button>
            </div>
        </form>
      </div>

    </div>
  );
};

export default AddressPage;