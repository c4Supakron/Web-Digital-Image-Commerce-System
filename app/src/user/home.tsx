import React, { useEffect, useState } from 'react';
import './home.css';
import { Menu, Search, Heart, ShoppingBag, User, X, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addCartItem, addFavorite, getProducts, type Product } from '../api';
import ArtworkImage from './ArtworkImage';

const HomePage: React.FC = () => {
  // สร้าง State สำหรับเปิด/ปิดแถบเมนูด้านซ้าย
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [featuredArts, setFeaturedArts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => { getProducts().then(setFeaturedArts).catch((error) => setMessage(error.message)); }, []);

  const galleryGroups = featuredArts.length > 1 ? [0, 1] : [0];

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
  <Link to="/orders" aria-label="ประวัติการสั่งซื้อ" title="ประวัติการสั่งซื้อ"><ClipboardList size={22} /></Link>
  <Link to="/cart"><ShoppingBag size={22} /></Link>
  <Link to={localStorage.getItem('user') ? '/profile' : '/login'} aria-label={localStorage.getItem('user') ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}><User size={22} /></Link>
</div>
      </nav>

      {/* 2. SIDEBAR (แถบเมนูเลื่อนด้านซ้าย) */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
        <ul className="sidebar-menu">
          <li><Link to="/">หน้าหลัก</Link></li>
          <li><Link to="/shop">แกลเลอรี</Link></li>
          <li><Link to="/profile">ข้อมูลส่วนตัว</Link></li>
          <li><Link to="/address">ที่อยู่จัดส่ง</Link></li>
          <li><Link to="/orders">ประวัติการสั่งซื้อ</Link></li>
          <li className="special-menu" style={{ marginTop: '20px' }}>
            <Link to="/register.artist">สมัครเป็นศิลปิน</Link>
          </li>
        </ul>
      </div>

      {/* 3. HERO SECTION (แบนเนอร์รูปใหญ่) */}
      <header className="hero-section">
        <div className="hero-arch" aria-hidden="true"><span className="hero-sun" /></div>
        <div className="hero-content">
          <span className="hero-kicker">V — ART · คลังศิลป์เหนือกาลเวลา</span>
          <h1>ค้นพบงานศิลปะดิจิทัล</h1>
          <p>แรงบันดาลใจจากอารยธรรมตะวันออก สู่คอลเลกชันศิลปะร่วมสมัย</p>
          <Link to="/shop" className="btn-explore">เลือกชมแกลเลอรี</Link>
        </div>
        <span className="hero-caption" aria-hidden="true">ศิลปะ · เรื่องเล่า · อารยธรรม</span>
      </header>

      {/* 4. FEATURED ARTWORKS (รูปผลงานแนะนำ) */}
      <section className="featured-section">
        {featuredArts.length >= 2 && (
          <>
            <div className="side-artwork side-artwork-left" aria-hidden="true">
              <ArtworkImage src={featuredArts[1].image} alt="" />
            </div>
            <div className="side-artwork side-artwork-right" aria-hidden="true">
              <ArtworkImage src={featuredArts[0].image} alt="" />
            </div>
          </>
        )}
        <p className="section-eyebrow">คัดสรรเพื่อคุณ</p>
        <h2 className="section-title">ผลงานแนะนำ</h2>
        {message && <p role="alert">{message}</p>}
        <div className="art-gallery" role="region" aria-label="ผลงานแนะนำ">
          <div className="art-gallery-track" style={{ animationDuration: `${Math.max(18, featuredArts.length * 7)}s` }}>
            {galleryGroups.map((groupIndex) => (
              <div className="art-gallery-group" key={groupIndex}>
                {featuredArts.map((art) => (
                  <div key={`${art.id}-${groupIndex}`} className="art-item">
                    <div className="art-image-box">
                      <Link to={`/product/${art.id}`}><ArtworkImage src={art.image} alt={art.title} /></Link>
                      <div className="art-overlay">
                        <button className="btn-icon" aria-label="บันทึกรายการโปรด" onClick={() => addFavorite(art.id).then(() => setMessage('บันทึกรายการโปรดแล้ว')).catch((error) => setMessage(error.message))}><Heart size={20} /></button>
                        <button className="btn-add-cart" onClick={() => addCartItem(art.id).then(() => setMessage('เพิ่มลงตะกร้าแล้ว')).catch((error) => setMessage(error.message))}>เพิ่มลงตะกร้า</button>
                      </div>
                    </div>
                    <div className="art-text">
                      <h3>{art.title}</h3>
                      <p>฿{new Intl.NumberFormat('th-TH').format(art.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="simple-footer">
        <p>&copy; 2025 V-ART แกลเลอรี สงวนลิขสิทธิ์</p>
      </footer>

    </div>
  );
};

export default HomePage;
