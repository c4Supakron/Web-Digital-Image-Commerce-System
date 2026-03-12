import React, { useState } from 'react';
import './shop.css';
import { Menu, Search, Heart, ShoppingBag, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ShopPage: React.FC = () => {
  // นำ State สำหรับเปิด/ปิดแถบเมนูข้างซ้ายกลับมา
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Abstract', 'Landscape', 'Minimalism', 'Portrait'];

  const products = [
    { id: 1, title: "Abstract Horizon", price: 12500, image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=600" },
    { id: 2, title: "Golden Hour Valley", price: 8900, image: "https://images.unsplash.com/photo-1579783902614-a3fb39279c42?w=600" },
    { id: 3, title: "Urban Geometry", price: 15000, image: "https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=600" },
    { id: 4, title: "Minimalist Lines", price: 4500, image: "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=600" },
    { id: 5, title: "Blue Fluidity", price: 9200, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600" },
    { id: 6, title: "Modern Cubism", price: 7800, image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600" },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH').format(price) + ' THB';
  };

  return (
    <div className="clean-page">
      
      {/* 1. NAVBAR (เอาปุ่ม Menu ซ้ายบนกลับมาแล้ว) */}
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            className="menu-btn" 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
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

      {/* 2. SIDEBAR (แถบเมนูด้านซ้าย) */}
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

      {/* 3. HEADER & FILTERS */}
      <header className="shop-header">
        <h1>The Gallery</h1>
        <div className="filter-pills">
          {filters.map(filter => (
            <button 
              key={filter} 
              className={`pill ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* 4. ART GRID (ส่วนรูปภาพคลีนๆ เหมือนเดิม) */}
      <main className="art-gallery">
        {products.map(product => (
          <div key={product.id} className="art-item">
            <div className="art-image-box">
              {/* เอา Link มาครอบ img ไว้ พอคลิกรูปก็จะเด้งไปหน้า /product */}
              <Link to="/product">
                <img src={product.image} alt={product.title} />
              </Link>
              
              <div className="art-overlay">
                <button className="btn-icon"><Heart size={20} /></button>
                <button className="btn-add-cart">Add to Cart</button>
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

export default ShopPage;