import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  archiveManagedProduct, createManagedProduct, getArtistAccounts, getManagedProducts,
  logoutUser, updateManagedProduct, type ArtistAccount, type ManagedProduct, type ProductInput,
} from '../api';
import ArtworkImage from '../user/ArtworkImage';

type ProductManagerProps = { mode: 'admin' | 'artist' };
type ProductForm = { title: string; price: string; image: string; category: string; description: string; ownerUserId: string; active: boolean };

const blankForm: ProductForm = { title: '', price: '', image: '', category: '', description: '', ownerUserId: '', active: true };

const ProductManager: React.FC<ProductManagerProps> = ({ mode }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [artists, setArtists] = useState<ArtistAccount[]>([]);
  const [form, setForm] = useState<ProductForm>(blankForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('กำลังโหลดข้อมูล...');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [managedProducts, artistAccounts] = await Promise.all([
        getManagedProducts(),
        mode === 'admin' ? getArtistAccounts() : Promise.resolve([]),
      ]);
      setProducts(managedProducts);
      setArtists(artistAccounts);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลดข้อมูลผลงานไม่สำเร็จ');
    }
  }, [mode]);

  useEffect(() => { void refresh(); }, [refresh]);

  const updateField = <K extends keyof ProductForm,>(key: K, value: ProductForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startEdit = (product: ManagedProduct) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      price: String(product.price),
      image: product.image,
      category: product.category,
      description: product.description || '',
      ownerUserId: product.owner_user_id ? String(product.owner_user_id) : '',
      active: product.active,
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { setEditingId(null); setForm(blankForm); setMessage(''); };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'admin' && !form.ownerUserId) {
      setMessage('กรุณาเลือกศิลปินเจ้าของผลงาน');
      return;
    }
    const input: ProductInput = {
      title: form.title.trim(),
      price: Number(form.price),
      image: form.image.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      active: form.active,
      ...(mode === 'admin' ? { ownerUserId: Number(form.ownerUserId) } : {}),
    };
    setBusy(true);
    setMessage('');
    try {
      if (editingId === null) await createManagedProduct(input);
      else await updateManagedProduct(editingId, input);
      resetForm();
      await refresh();
      setMessage(editingId === null ? 'เพิ่มผลงานแล้ว' : 'บันทึกการแก้ไขแล้ว');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'บันทึกผลงานไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  const handleArchive = async (product: ManagedProduct) => {
    if (!window.confirm(`ปิดการขาย “${product.title}” ใช่ไหม?`)) return;
    setBusy(true);
    setMessage('');
    try {
      await archiveManagedProduct(product.id);
      await refresh();
      setMessage('ปิดการขายผลงานแล้ว');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ปิดการขายไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* Clear local display state even if the API is offline. */ }
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('th-TH').format(price) + ' บาท';

  return (
    <main style={{ maxWidth: 1180, margin: '32px auto', padding: '0 20px 48px', color: '#1e293b' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{mode === 'admin' ? 'จัดการผลงานทั้งหมด' : 'ผลงานของฉัน'}</h1>
          <p style={{ marginTop: 0 }}>{mode === 'admin' ? 'เพิ่ม แก้ไข และกำหนดเจ้าของผลงาน' : 'เพิ่มและจัดการผลงานที่คุณเป็นเจ้าของ'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/">กลับหน้าร้าน</Link>
          <button type="button" onClick={() => void handleLogout()}>ออกจากระบบ</button>
        </div>
      </header>

      {message && <p role="status" style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>{message}</p>}

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 32, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>{editingId === null ? 'เพิ่มผลงาน' : `แก้ไขผลงาน #${editingId}`}</h2>
        {mode === 'admin' && artists.length === 0 && <p role="alert">ยังไม่มีบัญชีที่มีบทบาทศิลปิน จึงยังเพิ่มหรือกำหนดเจ้าของผลงานไม่ได้</p>}
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <label style={labelStyle}>ชื่อผลงาน *<input style={inputStyle} required maxLength={180} value={form.title} onChange={(event) => updateField('title', event.target.value)} /></label>
          <label style={labelStyle}>ราคา (บาท) *<input style={inputStyle} required type="number" min="0" max="9999999999.99" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} /></label>
          <label style={labelStyle}>หมวดหมู่ *<input style={inputStyle} required maxLength={80} value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="เช่น ภาพนามธรรม" /></label>
          <label style={labelStyle}>ลิงก์หรือที่อยู่ไฟล์รูปภาพ *<input style={inputStyle} required type="text" maxLength={2048} value={form.image} onChange={(event) => updateField('image', event.target.value)} placeholder="https://... หรือ /artworks/..." /></label>
          {mode === 'admin' && <label style={labelStyle}>ศิลปินเจ้าของผลงาน *<select style={inputStyle} required value={form.ownerUserId} onChange={(event) => updateField('ownerUserId', event.target.value)}>
            <option value="">เลือกศิลปิน</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name} ({artist.email})</option>)}
          </select></label>}
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>คำอธิบาย<textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} maxLength={5000} value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
          {editingId !== null && <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />เปิดขาย</label>}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
            <button type="submit" disabled={busy || (mode === 'admin' && artists.length === 0)}>{busy ? 'กำลังบันทึก...' : editingId === null ? 'เพิ่มผลงาน' : 'บันทึกการแก้ไข'}</button>
            {editingId !== null && <button type="button" onClick={resetForm}>ยกเลิก</button>}
          </div>
        </form>
      </section>

      <section>
        <h2>รายการผลงาน ({products.length})</h2>
        {products.length === 0 ? <p>ยังไม่มีผลงานที่จัดการได้</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {products.map((product) => <article key={product.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', opacity: product.active ? 1 : 0.65 }}>
            <ArtworkImage src={product.image} alt={product.title} style={{ width: '100%', height: 200, objectFit: 'cover', background: '#f1f5f9' }} />
            <div style={{ padding: 16 }}>
              <h3 style={{ margin: '0 0 8px' }}>{product.title}</h3>
              <p style={{ margin: '4px 0' }}>{formatPrice(product.price)} · {product.category}</p>
              <p style={{ margin: '4px 0', color: '#64748b' }}>เจ้าของ: {product.artist}{product.owner_email ? ` (${product.owner_email})` : ' (ยังไม่ผูกบัญชีศิลปิน)'}</p>
              <p style={{ margin: '4px 0 14px', color: product.active ? '#15803d' : '#b91c1c' }}>{product.active ? 'เปิดขาย' : 'ปิดขาย'}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => startEdit(product)}>แก้ไข</button>
                {product.active && <button type="button" disabled={busy} onClick={() => void handleArchive(product)}>ปิดการขาย</button>}
              </div>
            </div>
          </article>)}
        </div>}
      </section>
    </main>
  );
};

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit', fontWeight: 400 };

export default ProductManager;
