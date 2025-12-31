import React, { useState, useEffect } from 'react';
import './home.css'
import { Menu, Search, Heart, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- ข้อมูลรูปภาพสำหรับ Slider ---
  const slides = [
    { id: 1, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop", title: "Classic Oil Paintings" },
    { id: 2, image: "https://images.unsplash.com/photo-1579783902614-a3fb39279c42?q=80&w=2072&auto=format&fit=crop", title: "Modern Abstract Art" },
    { id: 3, image: "https://images.unsplash.com/photo-1580136608260-4eb11f4b64fe?q=80&w=2076&auto=format&fit=crop", title: "Digital Masterpieces" }
  ];

  const products = [
    { id: 1, name: "Painting Name", price: "2,500 THB", img: "https://images.unsplash.com/photo-1578301978693-85ea9ec2a14c?w=500" },
    { id: 2, name: "Abstract Soul", price: "4,200 THB", img: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=500" },
    { id: 3, name: "Renaissance", price: "3,800 THB", img: "https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=500" },
    { id: 4, name: "Nature Sketch", price: "1,900 THB", img: "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=500" },
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  return (
    <div className="home-container">
      
      {/* =========================================
          NAVBAR (แก้ไขใหม่ตามดีไซน์)
         ========================================= */}
      <nav className="navbar">
        <div className="nav-left">
          {/* ใส่สีดำ (color: 'black') ให้ไอคอน Menu โดยตรง กันพลาด */}
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
           <Heart size={26} className="nav-icon" color="black" strokeWidth={2} />
           <ShoppingCart size={26} className="nav-icon" color="black" strokeWidth={2} />
           
           {/* ปุ่ม LOG IN แบบแคปซูลสีดำ */}
           <Link to="/login" className="login-pill-btn">LOG IN</Link>
        </div>
      </nav>
      {/* ========================================= */}


      {/* --- Sidebar (Menu ด้านข้าง) --- */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
       <ul className="sidebar-menu">
    <li><Link to="/">HOME</Link></li>
    
  
    <li><Link to="/shop">SHOP</Link></li> 
    {/* -------------------------------------- */}

    <li><Link to="/profile">Profile</Link></li>
    <li><Link to="/address">Address</Link></li>
    <li><Link to="/contact">CONTACT</Link></li>
    <li><Link to="/orders">ORDER HISTORY</Link></li>
    <li className="special-menu"><Link to="/join-artist">JOIN AS AN ARTIST</Link></li>
</ul>
      </div>

      {/* Hero Slider */}
      <header className="hero-slider">
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide-content">
              <h2>{slide.title}</h2>
            </div>
          </div>
        ))}
        <div className="dots-container">
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                ></div>
            ))}
        </div>
      </header>

      {/* Featured Section */}
      <section className="featured-section">
        <h2 className="section-title">FEATURED ONLINE EXHIBITS</h2>
        <div className="product-grid">
            {products.map((product) => (
                <div key={product.id} className="product-card">
                    <div className="product-img-wrapper">
                        <img src={product.img} alt={product.name} />
                        <button className="wishlist-btn"><Heart size={18} /></button>
                    </div>
                    <div className="product-info">
                        <h3>{product.name}</h3>
                        <p>{product.price}</p>
                        <button className="add-to-cart-btn">ADD TO CART</button>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
            <div className="about-text">
                <h2>ABOUT ART</h2>
                <p>Art is a significant form of human expression that has existed since ancient times. It serves as a medium for culture, thought, belief, and emotion.</p>
                <br />
                <h3>FINE ART</h3>
                <p>Fine art refers to works created primarily for aesthetic value and intellectual purpose.</p>
            </div>
            <div className="about-image">
                <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800" alt="Neon Art" />
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="simple-footer">
        <p>&copy; 2025 V-ART Gallery. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;