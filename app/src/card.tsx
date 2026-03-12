import React, { useState } from 'react';
import './card.css';
import { Menu, Search, Heart, ShoppingBag, User, X, Trash2, ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // สถานะเพื่อเปลี่ยนหน้าจอระหว่าง ตะกร้า -> ชำระเงิน -> สำเร็จ
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');

  // ข้อมูลจำลองในตะกร้า
  const [cartItems, setCartItems] = useState([
    { id: 1, title: 'Abstract Horizon #4', artist: 'ศุภกร หวันลา', price: 12500, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600' },
    { id: 2, title: 'Urban Geometry', artist: 'ชิษณุกร มาดจินดา', price: 15000, image: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=600' }
  ]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const shippingFee = 200;
  const total = subtotal + shippingFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH').format(price) + ' THB';
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

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
          <Link to="/favorites"><Heart size={22} /></Link>
          <Link to="/cart"><ShoppingBag size={22} /></Link>
          <Link to="/login"><User size={22} /></Link>
        </div>
      </nav>

      {/* --- SIDEBAR --- */}
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
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="cart-wrapper">
        
        {/* ================= STEP 1: ตะกร้าสินค้า ================= */}
        {step === 'cart' && (
          <>
            <div className="cart-header">
              <h2>ตะกร้าสินค้าของคุณ</h2>
              <p>{cartItems.length} รายการในตะกร้า</p>
            </div>

            {cartItems.length > 0 ? (
              <div className="cart-layout">
                {/* ฝั่งซ้าย: รายการสินค้า */}
                <div className="cart-items-section">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item-card">
                      <img src={item.image} alt={item.title} className="cart-item-image" />
                      <div className="cart-item-details">
                        <div className="item-title-row">
                          <h3>{item.title}</h3>
                          <button className="btn-remove" onClick={() => removeItem(item.id)}><Trash2 size={18} /></button>
                        </div>
                        <p className="item-artist">ศิลปิน: {item.artist}</p>
                        <p className="item-price">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ฝั่งขวา: สรุปยอด */}
                <div className="cart-summary-section">
                  <h3>สรุปคำสั่งซื้อ</h3>
                  <div className="summary-row">
                    <span>ยอดรวมสินค้า</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>ค่าจัดส่ง</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  <hr className="summary-divider" />
                  <div className="summary-row total">
                    <span>ยอดสุทธิ</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <button className="btn-checkout" onClick={() => setStep('payment')}>
                    ดำเนินการชำระเงิน
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={64} color="#ddd" />
                <p>ตะกร้าสินค้าของคุณว่างเปล่า</p>
                <Link to="/shop" className="btn-outline-black">เลือกชมผลงานศิลปะ</Link>
              </div>
            )}
          </>
        )}

        {/* ================= STEP 2: ชำระเงิน (QR Code) ================= */}
        {step === 'payment' && (
          <div className="payment-section">
            <button className="btn-back" onClick={() => setStep('cart')}><ArrowLeft size={18} /> กลับไปตะกร้าสินค้า</button>
            <div className="payment-card">
              <h2>ชำระเงินผ่าน QR Code</h2>
              <p>ยอดที่ต้องชำระ: <strong>{formatPrice(total)}</strong></p>
              
              <div className="qr-code-box">
                {/* รูป Mockup QR Code */}
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="PromptPay QR" />
              </div>
              <p className="qr-instruction">สแกน QR Code ด้วยแอปพลิเคชันธนาคารของคุณ<br/>ชื่อบัญชี: บจก. วีอาร์ท แกลเลอรี</p>

              <div className="upload-slip-box">
                <label className="upload-label">
                  <Upload size={24} />
                  <span>คลิกเพื่อแนบสลิปโอนเงิน</span>
                  <input type="file" accept="image/*" style={{display: 'none'}} />
                </label>
              </div>

              <button className="btn-checkout" onClick={() => setStep('success')}>
                ยืนยันการชำระเงิน
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: สั่งซื้อสำเร็จ ================= */}
        {step === 'success' && (
          <div className="success-section">
            <CheckCircle size={80} color="#10B981" />
            <h2>สั่งซื้อและชำระเงินสำเร็จ!</h2>
            <p>ระบบได้รับข้อมูลการสั่งซื้อและสลิปการโอนเงินของคุณแล้ว<br/>ผู้ดูแลระบบจะทำการตรวจสอบและอัปเดตสถานะในประวัติการสั่งซื้อ</p>
            <div className="success-actions">
              <Link to="/orders" className="btn-checkout">ดูประวัติการสั่งซื้อ</Link>
              <Link to="/shop" className="btn-outline-black">กลับไปหน้าแกลเลอรี</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;