import React, { useEffect, useState } from 'react';
import './card.css';
import { Menu, Search, Heart, ShoppingBag, User, X, Trash2, ArrowLeft, CheckCircle, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createOrder, getCart, getOrderPaymentQr, removeCartItem, type CartItem, type CreatedOrder, type OrderPaymentQr, type ShippingAddress } from '../api';
import ArtworkImage from './ArtworkImage';

const CartPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [step, setStep] = useState<'cart' | 'address' | 'success'>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [completedOrder, setCompletedOrder] = useState<CreatedOrder | null>(null);
  const [paymentQr, setPaymentQr] = useState<OrderPaymentQr | null>(null);
  const [paymentQrError, setPaymentQrError] = useState('');
  const [loadingPaymentQr, setLoadingPaymentQr] = useState(false);
  const [message, setMessage] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => { getCart().then(setCartItems).catch((error) => setMessage(error.message)); }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 200;
  const total = subtotal + shippingFee;
  const formatPrice = (price: number) => new Intl.NumberFormat('th-TH').format(price) + ' บาท';

  const removeItem = async (id: number) => {
    try {
      await removeCartItem(id);
      setCartItems((items) => items.filter((item) => item.id !== id));
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'นำสินค้าออกไม่สำเร็จ'); }
  };

  const handleAddressSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const shippingAddress: ShippingAddress = {
      recipientName: String(values.get('recipientName') || '').trim(),
      phone: String(values.get('phone') || '').trim(),
      addressLine: String(values.get('addressLine') || '').trim(),
      province: String(values.get('province') || '').trim(),
      district: String(values.get('district') || '').trim(),
      subdistrict: String(values.get('subdistrict') || '').trim(),
      postalCode: String(values.get('postalCode') || '').trim(),
      notes: String(values.get('notes') || '').trim(),
    };
    setMessage('');
    setSavingOrder(true);
    try {
      const { order } = await createOrder({ shippingAddress });
      setCompletedOrder(order);
      setCartItems([]);
      setStep('success');
      setPaymentQr(null);
      setPaymentQrError('');
      setLoadingPaymentQr(true);
      try { setPaymentQr(await getOrderPaymentQr(order.id)); }
      catch (error) { setPaymentQrError(error instanceof Error ? error.message : 'โหลด QR สำหรับชำระเงินไม่สำเร็จ'); }
      finally { setLoadingPaymentQr(false); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'สร้างคำสั่งซื้อไม่สำเร็จ'); }
    finally { setSavingOrder(false); }
  };

  return (
    <div className="clean-page">
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="เปิดเมนู">
            <Menu size={32} color="#000" strokeWidth={2} />
          </button>
          <Link to="/" className="brand-logo">V-ART</Link>
        </div>
        <div className="nav-icons">
          <Link to="/shop" aria-label="ค้นหาผลงาน"><Search size={22} /></Link>
          <Link to="/favorites" aria-label="รายการโปรด"><Heart size={22} /></Link>
          <Link to="/orders" aria-label="ประวัติการสั่งซื้อ" title="ประวัติการสั่งซื้อ"><ClipboardList size={22} /></Link>
          <Link to="/cart" aria-label="ตะกร้าสินค้า"><ShoppingBag size={22} /></Link>
          <Link to={localStorage.getItem('user') ? '/profile' : '/login'} aria-label={localStorage.getItem('user') ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}><User size={22} /></Link>
        </div>
      </nav>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="ปิดเมนู"><X size={28} /></button>
        <ul className="sidebar-menu">
          <li><Link to="/">หน้าหลัก</Link></li><li><Link to="/shop">แกลเลอรี</Link></li>
          <li><Link to="/profile">ข้อมูลส่วนตัว</Link></li><li><Link to="/address">จัดการที่อยู่</Link></li>
          <li><Link to="/orders">ประวัติการสั่งซื้อ</Link></li>
        </ul>
      </div>

      <main className="cart-wrapper">
        {step === 'cart' && <>
          <div className="cart-header"><h2>ตะกร้าสินค้าของคุณ</h2><p>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้นในตะกร้า</p></div>
          {message && <p role="alert">{message}</p>}
          {cartItems.length > 0 ? <div className="cart-layout">
            <div className="cart-items-section">{cartItems.map((item) => <div key={item.id} className="cart-item-card">
              <ArtworkImage src={item.image} alt={item.title} className="cart-item-image" />
              <div className="cart-item-details"><div className="item-title-row"><h3>{item.title}</h3>
                <button className="btn-remove" onClick={() => removeItem(item.id)} aria-label={`นำ ${item.title} ออกจากตะกร้า`}><Trash2 size={18} /></button></div>
                <p className="item-artist">ศิลปิน: {item.artist}</p><p className="item-price">{formatPrice(item.price)} × {item.quantity}</p>
              </div>
            </div>)}</div>
            <div className="cart-summary-section"><h3>สรุปคำสั่งซื้อ</h3>
              <div className="summary-row"><span>ยอดรวมสินค้า</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row"><span>ค่าจัดส่ง</span><span>{formatPrice(shippingFee)}</span></div>
              <hr className="summary-divider" /><div className="summary-row total"><span>ยอดสุทธิ</span><span>{formatPrice(total)}</span></div>
              <button className="btn-checkout" onClick={() => { setMessage(''); setStep('address'); }}>ดำเนินการต่อ</button>
            </div>
          </div> : <div className="empty-cart"><ShoppingBag size={64} color="#ddd" /><p>ตะกร้าสินค้าของคุณว่างเปล่า</p><Link to="/shop" className="btn-outline-black">เลือกชมผลงานศิลปะ</Link></div>}
        </>}

        {step === 'address' && <section className="payment-section" style={{ maxWidth: 720 }}>
          <button className="btn-back" onClick={() => setStep('cart')}><ArrowLeft size={18} /> กลับไปตะกร้าสินค้า</button>
          <div className="payment-card" style={{ textAlign: 'left' }}>
            <h2>ที่อยู่จัดส่ง</h2><p>กรอกข้อมูลผู้รับให้ครบก่อนยืนยันคำสั่งซื้อ</p>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, margin: '20px 0' }}>
              <div className="summary-row"><span>ยอดรวมสินค้า</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row"><span>ค่าจัดส่ง</span><span>{formatPrice(shippingFee)}</span></div>
              <div className="summary-row total" style={{ marginBottom: 0 }}><span>ยอดคำสั่งซื้อ</span><span>{formatPrice(total)}</span></div>
            </div>
            <form onSubmit={handleAddressSubmit}>
              <div className="address-checkout-grid">
                <label>ชื่อผู้รับ *<input name="recipientName" required maxLength={160} autoComplete="name" /></label>
                <label>เบอร์โทรศัพท์ *<input name="phone" required maxLength={30} autoComplete="tel" /></label>
                <label className="address-checkout-wide">บ้านเลขที่/ถนน *<input name="addressLine" required maxLength={250} autoComplete="street-address" /></label>
                <label>จังหวัด *<input name="province" required maxLength={100} /></label>
                <label>อำเภอ/เขต *<input name="district" required maxLength={100} /></label>
                <label>ตำบล/แขวง *<input name="subdistrict" required maxLength={100} /></label>
                <label>รหัสไปรษณีย์ *<input name="postalCode" required maxLength={20} inputMode="numeric" autoComplete="postal-code" /></label>
                <label className="address-checkout-wide">หมายเหตุ<textarea name="notes" maxLength={1000} rows={2} /></label>
              </div>
              {message && <p role="alert">{message}</p>}
              <button className="btn-checkout" type="submit" disabled={savingOrder}>
                {savingOrder ? 'กำลังบันทึกคำสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
              </button>
            </form>
          </div>
        </section>}

        {step === 'success' && <section className="success-section">
          <CheckCircle size={80} color="#10B981" /><h2>ส่งคำสั่งซื้อแล้ว</h2>
          <p>เลขที่คำสั่งซื้อ <strong>{completedOrder?.id}</strong><br />ระบบบันทึกคำสั่งซื้อแล้ว สถานะการชำระเงินคือ “รอชำระเงิน”</p>
          <div className="promptpay-payment" aria-live="polite">
            <h3>ชำระเงินด้วย PromptPay</h3>
            <p>สแกน QR เพื่อชำระยอด {formatPrice(paymentQr?.amount ?? completedOrder?.total ?? 0)}</p>
            {loadingPaymentQr && <p role="status">กำลังสร้าง QR สำหรับคำสั่งซื้อนี้...</p>}
            {paymentQr && <img className="promptpay-qr" src={paymentQr.qrCodeDataUrl} alt={`QR PromptPay ยอด ${formatPrice(paymentQr.amount)}`} />}
            {paymentQrError && <p role="alert">{paymentQrError}</p>}
            <small>การสแกน QR ยังไม่ยืนยันการชำระเงินอัตโนมัติ สถานะจะยังรอชำระเงินจนกว่าร้านค้าจะตรวจสอบ</small>
          </div>
          <div className="success-actions"><Link to="/orders" className="btn-checkout">ดูประวัติการสั่งซื้อ</Link><Link to="/shop" className="btn-outline-black">กลับไปหน้าแกลเลอรี</Link></div>
        </section>}
      </main>
    </div>
  );
};

export default CartPage;
