import React, { useState } from 'react';
import './shop.css'
import { Menu, Search, Heart, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ShopPage: React.FC = () => {
  // 1. เพิ่มตัวแปรสำหรับคุมการเปิด/ปิดเมนู
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Mock Data ---
  const products = [
    { id: 1, title: "Abstract Horizon #4", price: 12500, image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=600" },
    { id: 2, title: "Golden Hour Valley", price: 8900, image: "https://images.unsplash.com/photo-1579783902614-a3fb39279c42?w=600" },
    { id: 3, title: "Urban Geometry", price: 15000, image: "https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=600" },
    { id: 4, title: "Minimalist Lines", price: 4500, image: "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=600" },
    { id: 5, title: "Renaissance Study", price: 25000, image: "https://images.unsplash.com/photo-1578301978693-85ea9ec2a14c?w=600" },
    { id: 6, title: "Blue Fluidity", price: 9200, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600" },
    { id: 7, title: "Modern Cubism", price: 7800, image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600" },
    { id: 8, title: "Portrait in Red", price: 18000, image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600" },
    { id: 9, title: "Nature's Texture", price: 5600, image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600" },
  ];

  const priceFilters = [
    { label: "0 - 5,000 THB", count: 4 },
    { label: "5,001 - 10,000 THB", count: 8 },
    { label: "10,001 - 20,000 THB", count: 2 },
    { label: "20,001+ THB", count: 5 },
  ];

  const styleFilters = [
    { label: "Abstract", count: 12 },
    { label: "Landscape", count: 8 },
    { label: "Minimalism", count: 6 },
    { label: "Portrait", count: 4 },
    { label: "Pop Art", count: 3 },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="shop-container">
      
      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="nav-left">
          {/* 2. แก้ตรงนี้: เปลี่ยนจาก Link เป็นปุ่มธรรมดา และใส่ onClick */}
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
             <Menu size={32} color="black" strokeWidth={2.5} />
          </button>
        </div>
        <div className="nav-center">
          <div className="search-bar">
            <input type="text" placeholder="Search artworks..." />
            <Search size={20} className="search-icon" color="#666" />
          </div>
        </div>
        <div className="nav-right">
           <Heart size={26} className="nav-icon" color="black" />
           <ShoppingCart size={26} className="nav-icon" color="black" />
        </div>
      </nav>

      {/* --- 3. เพิ่มส่วน SIDEBAR (เมนูเลื่อน) เข้ามาในนี้ --- */}
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
          <li><Link to="/contact">CONTACT</Link></li>
          <li><Link to="/orders">ORDER HISTORY</Link></li>
          <li className="special-menu"><Link to="/join-artist">JOIN AS AN ARTIST</Link></li>
        </ul>
      </div>
      {/* ----------------------------------------------- */}

      {/* --- MAIN SHOP LAYOUT --- */}
      <div className="shop-layout">
        
        {/* SIDEBAR (ตัวกรองด้านซ้าย) */}
        <aside className="shop-sidebar">
            <h1 className="sidebar-title">SHOP</h1>

            <div className="filter-group">
                <h3>FILTER BY RANGE</h3>
                <ul>
                    {priceFilters.map((item, idx) => (
                        <li key={idx}>
                            <span>{item.label}</span>
                            <span className="count">({item.count})</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="filter-group">
                <h3>ARTWORKS BY STYLE</h3>
                <ul>
                    {styleFilters.map((item, idx) => (
                        <li key={idx}>
                            <span>{item.label}</span>
                            <span className="count">({item.count})</span>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>

        {/* MAIN CONTENT (สินค้า) */}
        <main className="shop-main">
            <div className="product-grid">
                {products.map(product => (
                    <div key={product.id} className="shop-card">
                        <div className="image-container">
                            <img src={product.image} alt={product.title} />
                            <button className="card-heart-btn"><Heart size={18} /></button>
                        </div>
                        <div className="card-details">
                            <h3 className="product-title">{product.title}</h3>
                            <div className="price-block">
                                <span className="price-label">PRICE</span>
                                <span className="price-value">{formatPrice(product.price)}</span>
                            </div>
                            <button className="add-to-cart-black">
                                ADD TO CART <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pagination-container">
                <button className="page-box disabled"><ChevronLeft size={20} /></button>
                <button className="page-box active">1</button>
                <button className="page-box">2</button>
                <button className="page-box">3</button>
                <span className="page-dots">...</span>
                <button className="page-box">12</button>
                <button className="page-box"><ChevronRight size={20} /></button>
            </div>
        </main>
      </div>
      
      <footer className="simple-footer" style={{marginTop: '60px', borderTop: '1px solid #eee'}}>
        <p>&copy; 2025 V-ART Gallery.</p>
      </footer>
    </div>
  );
};

export default ShopPage;