import React, { useState } from 'react';
import './address.css'
import { Menu, Search, Heart, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const AddressPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="address-container">
      
      {/* --- NAVBAR (เหมือนหน้าอื่นๆ) --- */}
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

      {/* --- SIDEBAR MENU --- */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
        <ul className="sidebar-menu">
            <li><Link to="/">HOME</Link></li>
            <li><Link to="/shop">SHOP</Link></li>
            <li><Link to="/profile">PROFILE</Link></li>
            <li><Link to="/address" className="active-link">ADDRESS</Link></li>
            <li><Link to="/contact">CONTACT</Link></li>
            <li><Link to="/orders">ORDER HISTORY</Link></li>
            <li className="special-menu"><Link to="/join-artist">JOIN AS AN ARTIST</Link></li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="address-content">
        
        {/* หัวข้อใหญ่ */}
        <h1 className="page-title">Address</h1>
        <hr className="divider" />

        <div className="address-layout">
            
            {/* ฝั่งซ้าย: ฟอร์มกรอกข้อมูล */}
            <div className="address-form-section">
                <h3 className="form-heading">ข้อมูลผู้ซื้อ</h3>
                
                <form className="address-form">
                    {/* แถว 1: ชื่อ - นามสกุล */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>ชื่อจริง *</label>
                            <input type="text" className="input-field" />
                        </div>
                        <div className="form-group">
                            <label>นามสกุล *</label>
                            <input type="text" className="input-field" />
                        </div>
                    </div>

                    {/* แถว 2: บริษัท */}
                    <div className="form-group">
                        <label>บริษัท (ถ้ามี)</label>
                        <input type="text" className="input-field" />
                    </div>

                    {/* แถว 3: ประเทศ */}
                    <div className="form-group">
                        <label>ประเทศ *</label>
                        <select className="input-field">
                            <option>Thai</option>
                            <option>Other</option>
                        </select>
                    </div>

                    {/* แถว 4: ที่อยู่ (บ้านเลขที่ / ถนน) */}
                    <div className="form-group">
                        <label>ที่อยู่ *</label>
                        <div className="form-row">
                             <input type="text" className="input-field" placeholder="บ้านเลขที่ / ซอย" />
                             <input type="text" className="input-field" placeholder="ถนน / ตำบล" />
                        </div>
                    </div>

                    {/* แถว 5: แขวง/ตำบล */}
                    <div className="form-group">
                        <label>แขวง / ตำบล *</label>
                        <input type="text" className="input-field" />
                    </div>

                     {/* แถว 6: จังหวัด */}
                     <div className="form-group">
                        <label>จังหวัด *</label>
                       <input type="text" className="input-field" />
                    </div>

                    {/* แถว 7: รหัสไปรษณีย์ */}
                    <div className="form-group">
                        <label>รหัสไปรษณีย์ *</label>
                        <input type="text" className="input-field" />
                    </div>

                    {/* แถว 8: โทรศัพท์ */}
                    <div className="form-group">
                        <label>โทรศัพท์ *</label>
                        <input type="tel" className="input-field" />
                    </div>

                    {/* แถว 9: อีเมล */}
                    <div className="form-group">
                        <label>อีเมล *</label>
                        <input type="email" className="input-field" />
                    </div>

                    {/* แถว 10: บันทึกเพิ่มเติม */}
                    <div className="form-group">
                        <label>บันทึกเพิ่มเติม (ถ้ามี)</label>
                        <textarea className="input-field textarea" placeholder="หมายเหตุต่างๆ เช่น รายละเอียดการจัดส่ง"></textarea>
                    </div>

                    {/* ปุ่มบันทึก */}
                    <div className="form-action">
                        <button type="button" className="save-btn">บันทึก</button>
                    </div>

                </form>
            </div>

            {/* ฝั่งขวา: ปุ่มเพิ่มที่อยู่ */}
            <aside className="address-sidebar-right">
                <button className="add-address-btn">เพิ่มที่อยู่</button>
            </aside>

        </div>
      </div>
    </div>
  );
};

export default AddressPage;