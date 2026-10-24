import React, { useEffect, useState } from 'react';
import './card.css';
import { Menu, Search, Heart, ShoppingBag, User, X, Package, Clock, CheckCircle2, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCarrierTrackingUrl, getOrders, shippingCarrierLabels, uploadPaymentProof, type Order } from '../api';
import ArtworkImage from './ArtworkImage';

const OrdersPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [proofFiles, setProofFiles] = useState<Record<string, File | undefined>>({});
  const [proofFeedback, setProofFeedback] = useState<Record<string, string>>({});
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const needsLogin = message === 'กรุณาเข้าสู่ระบบก่อนใช้งาน';
  const refreshOrders = async () => {
    setLoading(true);
    setMessage('');
    try { setOrders(await getOrders()); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'โหลดประวัติคำสั่งซื้อไม่สำเร็จ'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refreshOrders(); }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH').format(price) + ' บาท';
  };

  const paymentStatusText: Record<Order['payment_status'], string> = {
    AWAITING_PAYMENT: 'รอชำระเงิน',
    PENDING_REVIEW: 'รอตรวจสอบสลิป',
    APPROVED: 'ชำระเงินแล้ว',
    REJECTED: 'สลิปไม่ผ่านการตรวจสอบ',
  };
  const orderStatuses: Order['status'][] = ['PENDING', 'CONFIRMED', 'SHIPPED'];
  const orderStatusText: Record<Order['status'], string> = { PENDING: 'รอดำเนินการ', CONFIRMED: 'ยืนยันคำสั่งซื้อ', SHIPPED: 'จัดส่งแล้ว', DELIVERED: 'ส่งถึงแล้ว' };

  const submitProof = async (order: Order) => {
    const file = proofFiles[order.id];
    if (!file) {
      setProofFeedback((current) => ({ ...current, [order.id]: 'กรุณาเลือกไฟล์หลักฐานก่อนส่ง' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofFeedback((current) => ({ ...current, [order.id]: 'ไฟล์ต้องมีขนาดไม่เกิน 5 MB' }));
      return;
    }
    setUploadingOrderId(order.id);
    setProofFeedback((current) => ({ ...current, [order.id]: '' }));
    try {
      const result = await uploadPaymentProof(order.id, file);
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, payment_status: result.payment_status } : item));
      setProofFiles((current) => ({ ...current, [order.id]: undefined }));
      setProofFeedback((current) => ({ ...current, [order.id]: result.message }));
    } catch (error) {
      setProofFeedback((current) => ({ ...current, [order.id]: error instanceof Error ? error.message : 'ส่งหลักฐานไม่สำเร็จ' }));
    } finally {
      setUploadingOrderId(null);
    }
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
          <Link to="/favorites"><Heart size={22} /></Link>
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
          <li><Link to="/orders" style={{ fontWeight: 'bold' }}>ประวัติการสั่งซื้อ</Link></li>
          <li className="special-menu" style={{ marginTop: '20px' }}>
            <Link to="/register.artist">เปิดร้านศิลปิน</Link>
          </li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="cart-wrapper" style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px' }}>
        <div className="cart-header">
          <h2>ประวัติการสั่งซื้อของคุณ</h2>
          <p>ตรวจสอบสถานะและรายการคำสั่งซื้อทั้งหมด</p>
          {!needsLogin && <button type="button" onClick={() => void refreshOrders()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรชสถานะ'}</button>}
        </div>

        {loading ? <p role="status">กำลังโหลดประวัติคำสั่งซื้อ...</p> : needsLogin ? (
          <div className="empty-cart" role="status">
            <User size={48} color="#777" />
            <p>เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อของคุณ</p>
            <Link to="/login" className="btn-outline-black">เข้าสู่ระบบ</Link>
          </div>
        ) : message ? (
          <p role="alert">{message}</p>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => (
              <div 
                key={order.id} 
                style={{ 
                  background: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>รหัสคำสั่งซื้อ: {order.id}</span>
                    <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '0.9rem' }}>{order.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: order.payment_status === 'APPROVED' ? '#10b981' : '#b45309', fontWeight: 600, fontSize: '0.9rem' }}>
                    {order.payment_status === 'APPROVED' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    <span>{paymentStatusText[order.payment_status]}</span>
                  </div>
                </div>

                {['AWAITING_PAYMENT', 'REJECTED'].includes(order.payment_status) && <section aria-label={`ส่งหลักฐานการชำระเงิน ${order.id}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <label htmlFor={`payment-proof-${order.id}`} style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>แนบหลักฐานการชำระเงิน (JPG, PNG หรือ PDF ไม่เกิน 5 MB)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                    <input id={`payment-proof-${order.id}`} type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => {
                      const selectedFile = event.currentTarget.files?.[0];
                      setProofFiles((current) => ({ ...current, [order.id]: selectedFile }));
                      setProofFeedback((current) => ({ ...current, [order.id]: '' }));
                    }} />
                    <button type="button" onClick={() => void submitProof(order)} disabled={uploadingOrderId === order.id}>
                      {uploadingOrderId === order.id ? 'กำลังส่ง...' : 'ส่งหลักฐาน'}
                    </button>
                  </div>
                </section>}
                {proofFeedback[order.id] && <p role="status" style={{ margin: '8px 0 16px', color: proofFeedback[order.id].includes('ส่งหลักฐานการชำระเงินแล้ว') ? '#15803d' : '#b91c1c' }}>{proofFeedback[order.id]}</p>}

                <div aria-label={`สถานะคำสั่งซื้อ ${order.id}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '18px 0 22px' }}>
                  {orderStatuses.map((status, index) => {
                    const active = orderStatuses.indexOf(order.status) >= index;
                    return <div key={status} style={{ textAlign: 'center', color: active ? '#15803d' : '#94a3b8', borderTop: `3px solid ${active ? '#16a34a' : '#e2e8f0'}`, paddingTop: 8, fontSize: '0.85rem' }}>{orderStatusText[status]}</div>;
                  })}
                </div>

                {order.shipping_carrier && order.tracking_number && <section aria-label={`ติดตามพัสดุ ${order.id}`} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <strong>ข้อมูลจัดส่ง</strong>
                  <p style={{ margin: '6px 0' }}>{shippingCarrierLabels[order.shipping_carrier]} · เลขพัสดุ: <span style={{ userSelect: 'all' }}>{order.tracking_number}</span></p>
                  <a href={getCarrierTrackingUrl(order.shipping_carrier, order.tracking_number)} target="_blank" rel="noopener noreferrer">ติดตามพัสดุบนเว็บไซต์ {shippingCarrierLabels[order.shipping_carrier]} ↗</a>
                </section>}

                {order.shipping_address && <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#475569', fontSize: '0.9rem' }}>
                  <strong>ที่อยู่จัดส่ง:</strong> {order.shipping_address.recipientName} · {order.shipping_address.phone}<br />
                  {order.shipping_address.addressLine} {order.shipping_address.subdistrict} {order.shipping_address.district} {order.shipping_address.province} {order.shipping_address.postalCode}
                  {order.shipping_address.notes && <><br />หมายเหตุ: {order.shipping_address.notes}</>}
                </div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <ArtworkImage 
                        src={item.image} 
                        alt={item.title} 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>จำนวน: {item.quantity} ชิ้น</div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}><div style={{ color: '#64748b' }}>สินค้า {formatPrice(order.subtotal)} + ค่าจัดส่ง {formatPrice(order.shipping_fee)}</div><strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>ยอดรวมสุทธิ: {formatPrice(order.total)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-cart">
            <Package size={64} color="#ddd" />
            <p>ยังไม่มีประวัติการสั่งซื้อ</p>
            <Link to="/shop" className="btn-outline-black">เลือกชมผลงานศิลปะ</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
