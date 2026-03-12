import React, { useState } from 'react';
import './product-detail.css'; // สร้างไฟล์นี้ด้วยนะครับ
import { Heart, ShoppingBag, Star, ArrowLeft, Share2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductDetailPage: React.FC = () => {
  const [rating, setRating] = useState(5);

  return (
    <div className="clean-page">
      
      {/* NAVBAR แบบย่อ */}
      <nav className="clean-navbar">
        <div className="nav-left">
          <Link to="/shop" className="back-link"><ArrowLeft size={20} /> กลับไปหน้าแกลเลอรี</Link>
        </div>
        <Link to="/" className="brand-logo">V-ART</Link>
        <div className="nav-icons">
          <Link to="/cart"><ShoppingBag size={22} /></Link>
          <Link to="/profile"><User size={22} /></Link>
        </div>
      </nav>

      {/* ส่วนเนื้อหาหลัก */}
      <main className="product-container">
        
        {/* ฝั่งซ้าย: รูปภาพขนาดใหญ่ */}
        <div className="product-image-section">
          <img src="https://images.unsplash.com/photo-1549887534-1541e9326642?w=800" alt="Abstract Horizon" className="main-image" />
        </div>

        {/* ฝั่งขวา: ข้อมูลภาพวาดและการสั่งซื้อ */}
        <div className="product-info-section">
          <div className="artist-info">
            <div className="artist-avatar"></div>
            <span>โดย <strong>ศุภกร หวันลา</strong></span>
          </div>

          <h1 className="product-title">Abstract Horizon #4</h1>
          <p className="product-price">12,500 THB</p>

          <div className="product-stats">
            <span className="rating"><Star size={16} fill="#000" /> 4.8 (12 รีวิว)</span>
            <span className="dot">•</span>
            <span>ขายแล้ว 3 ชิ้น</span>
          </div>

          <p className="product-desc">
            ผลงานศิลปะแนวนามธรรมที่สื่อถึงขอบฟ้าในยามเช้า ใช้เทคนิคสีอะคริลิกบนแคนวาส 
            เหมาะสำหรับการตกแต่งห้องนั่งเล่นหรือพื้นที่ที่ต้องการความสงบและมีพลัง
          </p>

          <div className="product-details-list">
            <p><strong>ขนาด:</strong> 80 x 120 ซม.</p>
            <p><strong>เทคนิค:</strong> สีอะคริลิก (Acrylic on Canvas)</p>
            <p><strong>ปีที่สร้าง:</strong> 2024</p>
          </div>

          <div className="product-actions">
            <button className="btn-add-to-cart">
              <ShoppingBag size={20} /> เพิ่มลงตะกร้า
            </button>
            <button className="btn-wishlist">
              <Heart size={20} />
            </button>
            <button className="btn-wishlist">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* ส่วนรีวิวและให้คะแนนดาว */}
      <section className="reviews-section">
        <h2>รีวิวจากผู้ซื้อ (12)</h2>
        
        {/* ฟอร์มเขียนรีวิว */}
        <div className="write-review-box">
          <h3>เขียนรีวิวของคุณ</h3>
          <div className="star-rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={24} 
                className={star <= rating ? "star-active" : "star-inactive"} 
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <textarea placeholder="แบ่งปันความประทับใจเกี่ยวกับผลงานชิ้นนี้..." rows={3}></textarea>
          <button className="btn-submit-review">ส่งรีวิว</button>
        </div>

        {/* รายการรีวิว */}
        <div className="review-list">
          <div className="review-card">
            <div className="review-header">
              <div className="reviewer-name">ชิษณุกร ม.</div>
              <div className="review-stars">
                <Star size={14} fill="#000" /><Star size={14} fill="#000" /><Star size={14} fill="#000" /><Star size={14} fill="#000" /><Star size={14} fill="#000" />
              </div>
            </div>
            <p className="review-text">ภาพสวยมากครับ สีสดกว่าในรูป การแพ็คของจัดส่งจากศิลปินทำได้ดีเยี่ยม ปลอดภัยไร้รอยขีดข่วน</p>
            <span className="review-date">12 มี.ค. 2024</span>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProductDetailPage;