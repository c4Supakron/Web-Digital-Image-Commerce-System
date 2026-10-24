import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductManager from '../management/product-manager';
import { getArtistSales, logoutUser, submitArtistApplication, type ArtistSalesData } from '../api';
import type { User } from '../mockData';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const paymentStatusText: Record<ArtistSalesData['sales'][number]['payment_status'], string> = { AWAITING_PAYMENT: 'รอชำระเงิน', PENDING_REVIEW: 'รอตรวจสอบการชำระเงิน', APPROVED: 'ชำระเงินแล้ว', REJECTED: 'การชำระเงินไม่ผ่านการตรวจสอบ' };

const ArtistDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('กำลังตรวจสอบสถานะบัญชี...');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.user) throw new Error(data.message || 'กรุณาเข้าสู่ระบบก่อน');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setMessage('');
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'ตรวจสอบสถานะบัญชีไม่สำเร็จ'));
  }, []);

  if (user?.role === 'ARTIST' && user.artist_status === 'APPROVED') return <ArtistWorkspace />;

  const apply = async () => {
    setBusy(true);
    try {
      const result = await submitArtistApplication();
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
      setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ส่งคำขอไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  return <main style={{ maxWidth: 720, margin: '64px auto', padding: 24, color: '#1e293b' }}>
    <section style={{ padding: 32, border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', textAlign: 'center' }}>
      <h1>สถานะการสมัครศิลปิน</h1>
      <p role="status">{message || (user?.artist_status === 'PENDING' ? 'คำขอของคุณกำลังรอแอดมินอนุมัติ' : user?.artist_status === 'REJECTED' ? 'คำขอก่อนหน้าถูกปฏิเสธ คุณสามารถส่งคำขอใหม่ได้' : 'บัญชีนี้ยังไม่ได้สมัครเป็นศิลปิน')}</p>
      {user?.role === 'MEMBER' && user.artist_status !== 'PENDING' && <button type="button" disabled={busy} onClick={() => void apply()}>{busy ? 'กำลังส่ง...' : user.artist_status === 'REJECTED' ? 'ส่งคำขอใหม่' : 'สมัครเป็นศิลปิน'}</button>}
      <p><Link to="/">กลับหน้าร้าน</Link></p>
    </section>
  </main>;
};

type ArtistTab = 'works' | 'sales';
const ArtistWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ArtistTab>('works');
  const [sales, setSales] = useState<ArtistSalesData | null>(null);
  const [message, setMessage] = useState('กำลังโหลดข้อมูลยอดขาย...');

  useEffect(() => {
    getArtistSales().then((data) => { setSales(data); setMessage(''); })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'โหลดข้อมูลยอดขายไม่สำเร็จ'));
  }, []);

  const logout = async () => {
    try { await logoutUser(); } catch { /* Clear local state even if the API is offline. */ }
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };
  const money = (value: number) => `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value)} บาท`;

  return <div style={{ maxWidth: 1180, margin: '28px auto', padding: '0 20px 48px', color: '#1e293b' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div><h1>แดชบอร์ดศิลปิน</h1><p>จัดการผลงานและติดตามยอดขายของคุณ</p></div>
      <button type="button" onClick={() => void logout()}>ออกจากระบบ</button>
    </header>
    <nav aria-label="เมนูศิลปิน" style={{ display: 'flex', gap: 10, margin: '18px 0' }}>
      <button type="button" aria-pressed={tab === 'works'} onClick={() => setTab('works')}>ผลงานของฉัน</button>
      <button type="button" aria-pressed={tab === 'sales'} onClick={() => setTab('sales')}>ข้อมูลการขาย</button>
    </nav>
    {tab === 'works' ? <ProductManager mode="artist" /> : <section>
      <h2>ข้อมูลการขาย</h2>
      {message && <p role="status">{message}</p>}
      {sales && <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, margin: '18px 0' }}>
          <SummaryCard label="คำสั่งซื้อที่มีผลงานของคุณ" value={String(sales.summary.order_count)} />
          <SummaryCard label="จำนวนชิ้นที่ขายตามคำสั่งซื้อ" value={String(sales.summary.units_sold)} />
          <SummaryCard label="ยอดรวมคำสั่งซื้อ" value={money(sales.summary.gross_sales)} />
          <SummaryCard label="ยอดชำระที่อนุมัติแล้ว" value={money(sales.summary.paid_sales)} />
        </div>
        <h3>ยอดขายแยกตามผลงาน</h3>
        {sales.products.length === 0 ? <p>ยังไม่มีผลงานหรือรายการขาย</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead><tr><th style={tableCell}>ผลงาน</th><th style={tableCell}>สถานะ</th><th style={tableCell}>จำนวนที่ขาย</th><th style={tableCell}>ยอดคำสั่งซื้อ</th><th style={tableCell}>ยอดชำระอนุมัติ</th></tr></thead>
          <tbody>{sales.products.map((product) => <tr key={product.id}><td style={tableCell}>{product.title}</td><td style={tableCell}>{product.active ? 'เปิดขาย' : 'ปิดขาย'}</td><td style={tableCell}>{product.units_sold}</td><td style={tableCell}>{money(product.gross_sales)}</td><td style={tableCell}>{money(product.paid_sales)}</td></tr>)}</tbody>
        </table></div>}
        <h3 style={{ marginTop: 28 }}>รายการขายล่าสุด</h3>
        {sales.sales.length === 0 ? <p>ยังไม่มีคำสั่งซื้อผลงานของคุณ</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead><tr><th style={tableCell}>คำสั่งซื้อ</th><th style={tableCell}>วันที่</th><th style={tableCell}>ผลงาน</th><th style={tableCell}>ลูกค้า</th><th style={tableCell}>จำนวน</th><th style={tableCell}>ยอด</th><th style={tableCell}>การชำระเงิน</th></tr></thead>
          <tbody>{sales.sales.map((sale, index) => <tr key={`${sale.order_id}-${index}`}><td style={tableCell}>{sale.order_id}</td><td style={tableCell}>{new Date(sale.created_at).toLocaleDateString('th-TH')}</td><td style={tableCell}>{sale.title}</td><td style={tableCell}>{sale.customer_name}</td><td style={tableCell}>{sale.quantity}</td><td style={tableCell}>{money(sale.line_total)}</td><td style={tableCell}>{paymentStatusText[sale.payment_status]}</td></tr>)}</tbody>
        </table></div>}
      </>}
    </section>}
  </div>;
};

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => <article style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, background: '#fff' }}><p style={{ margin: '0 0 8px', color: '#64748b' }}>{label}</p><strong style={{ fontSize: 20 }}>{value}</strong></article>;
const tableCell: React.CSSProperties = { textAlign: 'left', padding: 12, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };

export default ArtistDashboard;
