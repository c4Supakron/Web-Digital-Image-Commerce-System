import React, { useEffect, useState } from 'react';
import './address.css';
import { Menu, Search, Heart, ShoppingBag, User, X, Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createAddress, deleteAddress, getAddresses, updateAddress, type SavedAddress, type ShippingAddress } from '../api';

const emptyAddress: ShippingAddress = {
  recipientName: '', phone: '', addressLine: '', province: '', district: '', subdistrict: '', postalCode: '', notes: '',
};

const AddressPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [form, setForm] = useState<ShippingAddress>(emptyAddress);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAddresses = async () => {
    try { setAddresses(await getAddresses()); setError(''); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'โหลดที่อยู่ไม่สำเร็จ'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadAddresses(); }, []);

  const startNewAddress = () => {
    setEditingId(null);
    setForm(emptyAddress);
    setMessage('');
    setError('');
    setFormOpen(true);
  };

  const startEdit = (address: SavedAddress) => {
    setEditingId(address.id);
    setForm({ ...address });
    setMessage('');
    setError('');
    setFormOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = editingId === null
        ? (await createAddress(form)).address
        : (await updateAddress(editingId, form)).address;
      setAddresses((current) => [saved, ...current.filter((address) => address.id !== saved.id)]);
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyAddress);
      setMessage('บันทึกที่อยู่เรียบร้อยแล้ว');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'บันทึกที่อยู่ไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setError('');
    setMessage('');
    try {
      await deleteAddress(id);
      setAddresses((current) => current.filter((address) => address.id !== id));
      if (editingId === id) { setFormOpen(false); setEditingId(null); }
      setMessage('ลบที่อยู่เรียบร้อยแล้ว');
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'ลบที่อยู่ไม่สำเร็จ'); }
  };

  const setField = (field: keyof ShippingAddress, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="clean-page">
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="เปิดเมนู"><Menu size={32} color="#000" strokeWidth={2} /></button>
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
          <li><Link to="/profile">ข้อมูลส่วนตัว</Link></li><li><Link to="/address" style={{ fontWeight: 'bold' }}>ที่อยู่จัดส่ง</Link></li>
          <li><Link to="/orders">ประวัติการสั่งซื้อ</Link></li>
          <li className="special-menu" style={{ marginTop: '20px' }}><Link to="/register.artist">สมัครเป็นศิลปิน</Link></li>
        </ul>
      </div>

      <main className="form-container address-book">
        <div className="form-header address-book-header">
          <div><h2>ที่อยู่จัดส่ง</h2><p>จัดการที่อยู่ที่ใช้ในการจัดส่งผลงาน</p></div>
          <button className="btn-add-new" type="button" onClick={startNewAddress}><Plus size={18} /> เพิ่มที่อยู่ใหม่</button>
        </div>

        {message && <p className="address-feedback" role="status">{message}</p>}
        {error && <p className="address-feedback address-error" role="alert">{error}</p>}
        {loading && <p role="status">กำลังโหลดที่อยู่...</p>}
        {!loading && addresses.length === 0 && !formOpen && <section className="address-empty"><p>ยังไม่มีที่อยู่จัดส่งที่บันทึกไว้</p><button className="btn-add-new" type="button" onClick={startNewAddress}><Plus size={18} /> เพิ่มที่อยู่</button></section>}

        {addresses.length > 0 && <section className="saved-address-list" aria-label="รายการที่อยู่ที่บันทึกไว้">
          {addresses.map((address) => <article className="saved-address-card" key={address.id}>
            <div><h3>{address.recipientName}</h3><p>{address.phone}</p>
              <p>{address.addressLine} ตำบล/แขวง{address.subdistrict} อำเภอ/เขต{address.district} จังหวัด{address.province} {address.postalCode}</p>
              {address.notes && <p>หมายเหตุ: {address.notes}</p>}
            </div>
            <div className="saved-address-actions">
              <button type="button" onClick={() => startEdit(address)} aria-label={`แก้ไขที่อยู่ของ ${address.recipientName}`}><Pencil size={17} /> แก้ไข</button>
              <button type="button" onClick={() => void handleDelete(address.id)} aria-label={`ลบที่อยู่ของ ${address.recipientName}`}><Trash2 size={17} /> ลบ</button>
            </div>
          </article>)}
        </section>}

        {formOpen && <form className="spacious-form address-edit-form" onSubmit={handleSave}>
          <h3>{editingId === null ? 'เพิ่มที่อยู่ใหม่' : 'แก้ไขที่อยู่'}</h3>
          <div className="form-row">
            <div className="input-group"><label htmlFor="address-recipient">ชื่อผู้รับ *</label><input id="address-recipient" required maxLength={160} autoComplete="name" value={form.recipientName} onChange={(event) => setField('recipientName', event.target.value)} /></div>
            <div className="input-group"><label htmlFor="address-phone">เบอร์โทรศัพท์ *</label><input id="address-phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="08X-XXX-XXXX" value={form.phone} onChange={(event) => setField('phone', event.target.value)} /></div>
          </div>
          <div className="input-group"><label htmlFor="address-line">ที่อยู่ (บ้านเลขที่ ถนน) *</label><input id="address-line" required maxLength={250} autoComplete="street-address" value={form.addressLine} onChange={(event) => setField('addressLine', event.target.value)} /></div>
          <div className="form-row">
            <div className="input-group"><label htmlFor="address-province">จังหวัด *</label><input id="address-province" required maxLength={100} value={form.province} onChange={(event) => setField('province', event.target.value)} /></div>
            <div className="input-group"><label htmlFor="address-district">อำเภอ/เขต *</label><input id="address-district" required maxLength={100} value={form.district} onChange={(event) => setField('district', event.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="input-group"><label htmlFor="address-subdistrict">ตำบล/แขวง *</label><input id="address-subdistrict" required maxLength={100} value={form.subdistrict} onChange={(event) => setField('subdistrict', event.target.value)} /></div>
            <div className="input-group"><label htmlFor="address-postal">รหัสไปรษณีย์ *</label><input id="address-postal" required maxLength={20} inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={(event) => setField('postalCode', event.target.value)} /></div>
          </div>
          <div className="input-group"><label htmlFor="address-notes">หมายเหตุเพิ่มเติม</label><textarea id="address-notes" rows={2} maxLength={1000} value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></div>
          <div className="form-actions">
            <button type="button" className="address-cancel" onClick={() => { setFormOpen(false); setEditingId(null); setError(''); }}>ยกเลิก</button>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}</button>
          </div>
        </form>}
      </main>
    </div>
  );
};

export default AddressPage;
