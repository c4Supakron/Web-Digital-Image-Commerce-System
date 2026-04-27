import React, { useState } from 'react';
import './home.css';
import { Menu, Search, Heart, ShoppingBag, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  // สร้าง State สำหรับเปิด/ปิดแถบเมนูด้านซ้าย
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ข้อมูลจำลอง (เน้นรูปภาพเด่นๆ)
  const featuredArts = [
    { id: 1, title: 'Abstract Horizon', price: '12,500', img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600' },
    { id: 2, title: 'Urban Geometry', price: '8,900', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600' },
    { id: 3, title: 'Silent Valley', price: '15,000', img: 'https://images.unsplash.com/photo-1506744626753-1fa44df14c28?w=600' },
  ];

  return (
    <div className="clean-page">
      
      {/* 1. NAVBAR (แถบเมนูบน) */}
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* ปุ่ม 3 ขีด มุมซ้ายบน */}
          <button 
            className="menu-btn" 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Menu size={32} color="#000" strokeWidth={2} />
          </button>
          <Link to="/" className="brand-logo">V-ART</Link>
        </div>

        {/* ไอคอนมุมขวาบน */}
        <div className="nav-icons">
  <Link to="/shop"><Search size={22} /></Link>
  <Link to="/favorites"><Heart size={22} /></Link> {/* หัวใจ -> ไปหน้ารายการโปรด */}
  <Link to="/cart"><ShoppingBag size={22} /></Link>
  <Link to="/login"><User size={22} /></Link> {/* รูปคน -> ไปหน้าโปรไฟล์ */}
</div>
      </nav>

      {/* 2. SIDEBAR (แถบเมนูเลื่อนด้านซ้าย) */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
        <ul className="sidebar-menu">
          <li><Link to="/">HOME</Link></li>
          <li><Link to="/shop">SHOP</Link></li>
          <li><Link to="/profile">PROFILE</Link></li>
          <li><Link to="/address">ADDRESS</Link></li>
          <li><Link to="/orders">ORDER HISTORY</Link></li>
          <li className="special-menu" style={{ marginTop: '20px' }}>
            <Link to="/register.artist">JOIN AS AN ARTIST</Link>
          </li>
        </ul>
      </div>

      {/* 3. HERO SECTION (แบนเนอร์รูปใหญ่) */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>Discover Digital Art</h1>
          <p>Explore unique collections from independent artists.</p>
          <Link to="/shop" className="btn-explore">Explore Gallery</Link>
        </div>
      </header>

      {/* 4. FEATURED ARTWORKS (รูปผลงานแนะนำ) */}
      <section className="featured-section">
        <h2 className="section-title">Featured Artworks</h2>
        <div className="art-gallery">
          {featuredArts.map((art) => (
            <div key={art.id} className="art-item">
              <div className="art-image-box">
                <img src={art.img} alt={art.title} />
                
                {/* ปุ่ม Overlay จะโชว์ตอนเอาเมาส์ไปชี้ */}
                <div className="art-overlay">
                  <button className="btn-icon"><Heart size={20} /></button>
                  <button className="btn-add-cart">Add to Cart</button>
                </div>
              </div>
              <div className="art-text">
                <h3>{art.title}</h3>
                <p>฿{art.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="simple-footer">
        <p>&copy; 2025 V-ART Gallery. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default HomePage;