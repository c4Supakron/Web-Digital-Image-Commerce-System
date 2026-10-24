import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductManager from '../management/product-manager';
import { downloadAdminPaymentProof, getAdminOrders, getAdminUsers, getArtistApplications, logoutUser, reviewAdminPayment, reviewArtistApplication, shippingCarrierLabels, updateAdminOrderShipping, updateAdminUserRole, type AdminOrder, type AdminUser, type ArtistApplication, type Order, type ShippingCarrier } from '../api';

type Tab = 'products' | 'artists' | 'payments' | 'orders' | 'users';
const statusText: Record<Order['status'], string> = { PENDING: 'รอดำเนินการ', CONFIRMED: 'ยืนยันคำสั่งซื้อ', SHIPPED: 'จัดส่งแล้ว', DELIVERED: 'ส่งถึงแล้ว' };
const paymentStatusText: Record<Order['payment_status'], string> = { AWAITING_PAYMENT: 'รอชำระเงิน', PENDING_REVIEW: 'รอตรวจสอบการชำระเงิน', APPROVED: 'ชำระเงินแล้ว', REJECTED: 'การชำระเงินไม่ผ่านการตรวจสอบ' };
const roleText: Record<AdminUser['role'], string> = { ADMIN: 'ผู้ดูแลระบบ', ARTIST: 'ศิลปิน', MEMBER: 'สมาชิก' };
const artistStatusText: Record<string, string> = { NOT_APPLIED: 'ยังไม่ได้สมัคร', PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' };

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('products');
  const [applications, setApplications] = useState<ArtistApplication[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [appliedUserSearch, setAppliedUserSearch] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<number | string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [applicationList, orderList, userList] = await Promise.all([getArtistApplications(), getAdminOrders(), getAdminUsers(appliedUserSearch)]);
      setApplications(applicationList);
      setOrders(orderList);
      setUsers(userList);
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'โหลดข้อมูลแอดมินไม่สำเร็จ'); }
  }, [appliedUserSearch]);
  useEffect(() => { void refresh(); }, [refresh]);

  const review = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
    setBusyId(id); setMessage('');
    try { await reviewArtistApplication(id, decision); await refresh(); setMessage(decision === 'APPROVED' ? 'อนุมัติศิลปินแล้ว' : 'ปฏิเสธคำขอแล้ว'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'บันทึกผลไม่สำเร็จ'); }
    finally { setBusyId(null); }
  };

  const saveShipment = async (order: AdminOrder, carrier: ShippingCarrier, trackingNumber: string) => {
    setBusyId(order.id); setMessage('');
    try {
      await updateAdminOrderShipping(order.id, { carrier, trackingNumber });
      await refresh();
      setMessage(`บันทึกข้อมูลจัดส่ง ${order.id} และเปลี่ยนสถานะเป็นจัดส่งแล้ว`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'บันทึกข้อมูลจัดส่งไม่สำเร็จ'); }
    finally { setBusyId(null); }
  };

  const decidePayment = async (order: AdminOrder, decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !window.confirm(`ยืนยันปฏิเสธหลักฐานของ ${order.id}? ลูกค้าจะส่งหลักฐานใหม่ได้`)) return;
    setBusyId(order.id); setMessage('');
    try {
      await reviewAdminPayment(order.id, decision);
      await refresh();
      setMessage(decision === 'APPROVED' ? `อนุมัติการชำระเงิน ${order.id} แล้ว` : `ปฏิเสธหลักฐาน ${order.id} แล้ว`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'บันทึกผลตรวจสอบการชำระเงินไม่สำเร็จ'); }
    finally { setBusyId(null); }
  };

  const downloadProof = async (order: AdminOrder) => {
    setBusyId(order.id); setMessage('');
    try { await downloadAdminPaymentProof(order.id); setMessage(`ดาวน์โหลดหลักฐาน ${order.id} แล้ว`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'ดาวน์โหลดหลักฐานไม่สำเร็จ'); }
    finally { setBusyId(null); }
  };

  const changeUserRole = async (user: AdminUser, role: 'MEMBER' | 'ARTIST') => {
    if (role === user.role || !window.confirm(`เปลี่ยนบทบาทของ ${user.name} เป็น ${role === 'ARTIST' ? 'ศิลปินที่อนุมัติแล้ว' : 'สมาชิก'} ใช่ไหม?`)) return;
    setBusyId(user.id); setMessage('');
    try { await updateAdminUserRole(user.id, role); await refresh(); setMessage('ปรับบทบาทผู้ใช้แล้ว'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'เปลี่ยนบทบาทไม่สำเร็จ'); }
    finally { setBusyId(null); }
  };

  const logout = async () => {
    try { await logoutUser(); } catch { /* Clear local state even if the API is offline. */ }
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return <div style={{ maxWidth: 1180, margin: '32px auto', padding: '0 20px 48px', color: '#1e293b' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}><div><h1>แผงควบคุมแอดมิน</h1><p>จัดการผลงาน คำขอสมัครศิลปิน และคำสั่งซื้อ</p></div><button type="button" onClick={() => void logout()}>ออกจากระบบ</button></header>
    <nav aria-label="เมนูแอดมิน" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
      {([['products', 'จัดการผลงาน'], ['artists', `สมัครศิลปิน (${applications.filter((a) => a.artist_status === 'PENDING').length})`], ['payments', `ตรวจสอบการชำระเงิน (${orders.filter((order) => order.payment_status === 'PENDING_REVIEW').length})`], ['orders', `คำสั่งซื้อ (${orders.length})`], ['users', `ผู้ใช้ (${users.length})`]] as [Tab, string][]).map(([value, label]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}
    </nav>
    {message && <p role="status" style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>{message}</p>}
    {tab === 'products' && <ProductManager mode="admin" />}
    {tab === 'artists' && <section>
      <h2>คำขอสมัครศิลปิน</h2>
      {applications.filter((application) => application.artist_status === 'PENDING').length === 0 ? <p>ไม่มีคำขอที่รอพิจารณา</p> : applications.filter((application) => application.artist_status === 'PENDING').map((application) => <article key={application.id} style={cardStyle}>
        <strong>{application.name}</strong><p>{application.email} · @{application.username}</p><p>ส่งคำขอ: {new Date(application.created_at).toLocaleString('th-TH')}</p>
        <div style={{ display: 'flex', gap: 8 }}><button type="button" disabled={busyId === application.id} onClick={() => void review(application.id, 'APPROVED')}>อนุมัติ</button><button type="button" disabled={busyId === application.id} onClick={() => void review(application.id, 'REJECTED')}>ปฏิเสธ</button></div>
      </article>)}
    </section>}
    {tab === 'payments' && <section>
      <h2>ตรวจสอบการชำระเงิน</h2>
      {orders.filter((order) => order.payment_status === 'PENDING_REVIEW').length === 0 ? <p>ไม่มีหลักฐานการชำระเงินที่รอตรวจสอบ</p> : orders.filter((order) => order.payment_status === 'PENDING_REVIEW').map((order) => <article key={order.id} style={cardStyle}>
        <h3>คำสั่งซื้อ {order.id}</h3><p>ลูกค้า: {order.customer_name} ({order.customer_email})</p><p>ยอดชำระ {new Intl.NumberFormat('th-TH').format(order.total)} บาท · ส่งเมื่อ {order.payment_proof_submitted_at ? new Date(order.payment_proof_submitted_at).toLocaleString('th-TH') : 'ไม่ทราบเวลา'}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {order.payment_proof_mime_type && <button type="button" disabled={busyId === order.id} onClick={() => void downloadProof(order)}>{busyId === order.id ? 'กำลังโหลด...' : 'ดาวน์โหลดหลักฐาน'}</button>}
          <button type="button" disabled={busyId === order.id || !order.payment_proof_mime_type} onClick={() => void decidePayment(order, 'APPROVED')}>อนุมัติการชำระเงิน</button>
          <button type="button" disabled={busyId === order.id || !order.payment_proof_mime_type} onClick={() => void decidePayment(order, 'REJECTED')}>ปฏิเสธหลักฐาน</button>
        </div>
        {!order.payment_proof_mime_type && <p role="alert" style={{ color: '#b91c1c' }}>ไม่พบไฟล์หลักฐานสำหรับตรวจสอบ</p>}
      </article>)}
    </section>}
    {tab === 'orders' && <section>
      <h2>คำสั่งซื้อ</h2>
      {orders.length === 0 ? <p>ยังไม่มีคำสั่งซื้อ</p> : orders.map((order) => <article key={order.id} style={cardStyle}>
        <h3>{order.id} · {statusText[order.status]}</h3><p>ลูกค้า: {order.customer_name} ({order.customer_email})</p><p>ยอดรวม {new Intl.NumberFormat('th-TH').format(order.total)} บาท · สถานะชำระเงิน: {paymentStatusText[order.payment_status]}</p>
        {order.payment_status === 'PENDING_REVIEW' && <section aria-label={`ตรวจหลักฐานการชำระเงิน ${order.id}`} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, margin: '12px 0', background: '#f8fafc' }}>
          <h4 style={{ margin: '0 0 8px' }}>หลักฐานการชำระเงิน</h4>
          {order.payment_proof_submitted_at && <p style={{ margin: '0 0 10px' }}>ส่งเมื่อ {new Date(order.payment_proof_submitted_at).toLocaleString('th-TH')} · {order.payment_proof_mime_type}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {order.payment_proof_mime_type && <button type="button" disabled={busyId === order.id} onClick={() => void downloadProof(order)}>{busyId === order.id ? 'กำลังโหลด...' : 'ดาวน์โหลดหลักฐาน'}</button>}
            <button type="button" disabled={busyId === order.id || !order.payment_proof_mime_type} onClick={() => void decidePayment(order, 'APPROVED')}>อนุมัติการชำระเงิน</button>
            <button type="button" disabled={busyId === order.id || !order.payment_proof_mime_type} onClick={() => void decidePayment(order, 'REJECTED')}>ปฏิเสธหลักฐาน</button>
          </div>
          {!order.payment_proof_mime_type && <p role="alert" style={{ color: '#b91c1c' }}>ไม่พบไฟล์หลักฐานสำหรับตรวจสอบ</p>}
        </section>}
        {order.shipping_address && <p>จัดส่งถึง: {order.shipping_address.recipientName}, {order.shipping_address.addressLine}, {order.shipping_address.subdistrict} {order.shipping_address.district} {order.shipping_address.province} {order.shipping_address.postalCode} · โทร. {order.shipping_address.phone}</p>}
        <ul>{order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.title} × {item.quantity}</li>)}</ul>
        {order.payment_status === 'APPROVED' && ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status) && <ShipmentEditor order={order} busy={busyId === order.id} onSave={(carrier, trackingNumber) => void saveShipment(order, carrier, trackingNumber)} />}
      </article>)}
    </section>}
    {tab === 'users' && <section>
      <h2>จัดการผู้ใช้</h2>
      <form onSubmit={(event) => { event.preventDefault(); setAppliedUserSearch(userSearch.trim()); }} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input aria-label="ค้นหาผู้ใช้" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="ค้นหาชื่อ อีเมล หรือชื่อผู้ใช้" style={{ flex: 1, minWidth: 180, padding: 10 }} />
        <button type="submit">ค้นหา</button>
      </form>
      {users.length === 0 ? <p>ไม่พบผู้ใช้</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead><tr><th style={cellStyle}>ผู้ใช้</th><th style={cellStyle}>อีเมล</th><th style={cellStyle}>บทบาท</th><th style={cellStyle}>สถานะสมัครศิลปิน</th><th style={cellStyle}>จัดการบทบาท</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user.id}>
          <td style={cellStyle}>{user.name}<br /><small>@{user.username}</small></td><td style={cellStyle}>{user.email}</td><td style={cellStyle}>{roleText[user.role]}</td><td style={cellStyle}>{artistStatusText[user.artist_status] || user.artist_status}</td>
          <td style={cellStyle}>{user.role === 'ADMIN' ? 'บัญชีแอดมิน' : <select aria-label={`เปลี่ยนบทบาท ${user.name}`} value={user.role} disabled={busyId === user.id} onChange={(event) => void changeUserRole(user, event.target.value as 'MEMBER' | 'ARTIST')}><option value="MEMBER">สมาชิก</option><option value="ARTIST">ศิลปินที่อนุมัติแล้ว</option></select>}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>}
  </div>;
};

const cardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 14, background: '#fff' };
const cellStyle: React.CSSProperties = { textAlign: 'left', padding: 12, borderBottom: '1px solid #e2e8f0' };

const ShipmentEditor: React.FC<{ order: AdminOrder; busy: boolean; onSave: (carrier: ShippingCarrier, trackingNumber: string) => void }> = ({ order, busy, onSave }) => {
  const [carrier, setCarrier] = useState<ShippingCarrier | ''>(order.shipping_carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  return <form onSubmit={(event) => { event.preventDefault(); if (carrier) onSave(carrier, trackingNumber.trim()); }} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 10, marginTop: 14, padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
    <label style={{ display: 'grid', gap: 5 }}>บริษัทขนส่ง
      <select required value={carrier} onChange={(event) => setCarrier(event.target.value as ShippingCarrier | '')} style={{ minWidth: 180, padding: 9 }}>
        <option value="">เลือกบริษัทขนส่ง</option>
        {Object.entries(shippingCarrierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <label style={{ display: 'grid', gap: 5, flex: '1 1 220px' }}>เลขพัสดุ
      <input required minLength={4} maxLength={80} pattern="[A-Za-z0-9-]+" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="กรอกเลขติดตามพัสดุ" style={{ padding: 9 }} />
    </label>
    <button type="submit" disabled={busy || !carrier || trackingNumber.trim().length < 4}>{busy ? 'กำลังบันทึก...' : order.tracking_number ? 'บันทึกข้อมูลจัดส่ง' : 'บันทึกเลขพัสดุและแจ้งจัดส่ง'}</button>
  </form>;
};

export default AdminDashboard;
