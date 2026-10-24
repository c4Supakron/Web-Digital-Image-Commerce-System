import React, { useEffect, useState } from 'react';
import './shop.css';
import { Menu, Search, Heart, ShoppingBag, User, X, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite, type Product } from '../api';
import ArtworkImage from './ArtworkImage';

const FavoritesPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => { getFavorites().then(setFavorites).catch((error) => setMessage(error.message)); }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH').format(price) + ' บาท';
  };

  return (
    <div className="clean-page">
      {/* NAVBAR */}
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={32} color="#000" strokeWidth={2} />
          </button>
          <Link to="/" className="brand-logo">V-ART</Link>
        </div>
        <div className="nav-icons">
          <Link to="/shop"><Search size={22} /></Link>
          <Link to="/favorites"><Heart size={22} color="#ef4444" fill="#ef4444" /></Link>
          <Link to="/orders" aria-label="ประวัติการสั่งซื้อ" title="ประวัติการสั่งซื้อ"><ClipboardList size={22} /></Link>
          <Link to="/cart"><ShoppingBag size={22} /></Link>
          <Link to={localStorage.getItem('user') ? '/profile' : '/login'} aria-label={localStorage.getItem('user') ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}><User size={22} /></Link>
        </div>
      </nav>

      {/* SIDEBAR */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
        <ul className="sidebar-menu">
          <li><Link to="/">หน้าหลัก</Link></li>
          <li><Link to="/shop">แกลเลอรี</Link></li>
          <li><Link to="/profile">ข้อมูลส่วนตัว</Link></li>
          <li><Link to="/address">จัดการที่อยู่</Link></li>
          <li><Link to="/orders">ประวัติการสั่งซื้อ</Link></li>
          <li className="special-menu" style={{ marginTop: '20px' }}>
            <Link to="/register.artist">เปิดร้านศิลปิน</Link>
          </li>
        </ul>
      </div>

      {/* HEADER */}
      <header className="shop-header">
        <h1>รายการโปรดของคุณ</h1>
        <p style={{ color: '#64748b', marginTop: '8px' }}>ผลงานศิลปะที่คุณบันทึกไว้ในรายการโปรด</p>
      </header>
      {message && <p role="alert" style={{ textAlign: 'center' }}>{message}</p>}

      {/* FAVORITES GRID */}
      <main className="art-gallery">
        {favorites.map((product) => (
          <div key={product.id} className="art-item">
            <div className="art-image-box">
              <Link to={`/product/${product.id}`}>
                <ArtworkImage src={product.image} alt={product.title} />
              </Link>
              <div className="art-overlay">
                <button className="btn-icon" aria-label="นำออกจากรายการโปรด" onClick={() => removeFavorite(product.id).then(() => setFavorites((current) => current.filter((item) => item.id !== product.id))).catch((error) => setMessage(error.message))}><Heart size={20} color="#ef4444" fill="#ef4444" /></button>
                <Link to="/cart" className="btn-add-cart" style={{ textDecoration: 'none', textAlign: 'center' }}>
                  ไปที่ตะกร้า
                </Link>
              </div>
            </div>
            <div className="art-text">
              <h3>{product.title}</h3>
              <p>{formatPrice(product.price)}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default FavoritesPage;
