import React, { useEffect, useState } from 'react';
import './shop.css';
import { Menu, Search, Heart, ShoppingBag, User, X, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addCartItem, addFavorite, getProductCategories, getProducts, type Product, type ProductFilters } from '../api';
import ArtworkImage from './ArtworkImage';

const ShopPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({ q: '', category: '', minPrice: '', maxPrice: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProductCategories().then(setCategories).catch((error) => setMessage(error.message));
    getProducts().then(setProducts).catch((error) => setMessage(error.message)).finally(() => setIsLoading(false));
  }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat('th-TH').format(price) + ' บาท';
  const updateFilter = (key: keyof ProductFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsLoading(true);
    try { setProducts(await getProducts(filters)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'ค้นหาผลงานไม่สำเร็จ'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="clean-page">
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="เปิดเมนู" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Menu size={32} color="#000" strokeWidth={2} /></button>
          <Link to="/" className="brand-logo">V-ART</Link>
        </div>
        <div className="nav-icons">
          <Link to="/shop" aria-label="ค้นหาผลงาน"><Search size={22} /></Link>
          <Link to="/favorites" aria-label="รายการโปรด"><Heart size={22} /></Link>
          <Link to="/orders" aria-label="ประวัติการสั่งซื้อ" title="ประวัติการสั่งซื้อ"><ClipboardList size={22} /></Link>
          <Link to="/cart" aria-label="ตะกร้า"><ShoppingBag size={22} /></Link>
          <Link to={localStorage.getItem('user') ? '/profile' : '/login'} aria-label={localStorage.getItem('user') ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}><User size={22} /></Link>
        </div>
      </nav>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="ปิดเมนู"><X size={28} /></button>
        <ul className="sidebar-menu">
          <li><Link to="/">หน้าหลัก</Link></li><li><Link to="/shop">แกลเลอรี</Link></li>
          <li><Link to="/profile">ข้อมูลส่วนตัว</Link></li><li><Link to="/address">ที่อยู่จัดส่ง</Link></li>
          <li><Link to="/orders">ประวัติการสั่งซื้อ</Link></li>
          <li className="special-menu" style={{ marginTop: 20 }}><Link to="/register.artist">สมัครเป็นศิลปิน</Link></li>
        </ul>
      </div>

      <header className="shop-header">
        <h1>แกลเลอรีผลงาน</h1>
        <form className="shop-filters" onSubmit={handleSearch}>
          <input aria-label="ค้นหาชื่อผลงานหรือศิลปิน" placeholder="ชื่อผลงานหรือศิลปิน" value={filters.q || ''} onChange={(event) => updateFilter('q', event.target.value)} />
          <select aria-label="หมวดหมู่" value={filters.category || ''} onChange={(event) => updateFilter('category', event.target.value)}>
            <option value="">ทุกหมวดหมู่</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input aria-label="ราคาต่ำสุด" type="number" min="0" placeholder="ราคาต่ำสุด" value={filters.minPrice || ''} onChange={(event) => updateFilter('minPrice', event.target.value)} />
          <input aria-label="ราคาสูงสุด" type="number" min="0" placeholder="ราคาสูงสุด" value={filters.maxPrice || ''} onChange={(event) => updateFilter('maxPrice', event.target.value)} />
          <button type="submit" className="pill active">ค้นหา</button>
        </form>
      </header>
      {message && <p role="alert" style={{ textAlign: 'center' }}>{message}</p>}
      {isLoading ? <p role="status" style={{ textAlign: 'center' }}>กำลังโหลดผลงาน...</p> : products.length ? <main className="art-gallery">
        {products.map((product) => <article key={product.id} className="art-item">
          <div className="art-image-box">
            <Link to={`/product/${product.id}`}><ArtworkImage src={product.image} alt={product.title} /></Link>
            <div className="art-overlay">
              <button className="btn-icon" aria-label="บันทึกรายการโปรด" onClick={() => addFavorite(product.id).then(() => setMessage('บันทึกรายการโปรดแล้ว')).catch((error) => setMessage(error.message))}><Heart size={20} /></button>
              <button className="btn-add-cart" onClick={() => addCartItem(product.id).then(() => setMessage('เพิ่มลงตะกร้าแล้ว')).catch((error) => setMessage(error.message))}>เพิ่มลงตะกร้า</button>
            </div>
          </div>
          <div className="art-text"><h3>{product.title}</h3><p>โดย {product.artist}</p><p>{formatPrice(product.price)}</p><small>{product.category}</small></div>
        </article>)}
      </main> : <p role="status" style={{ textAlign: 'center', padding: 40 }}>ไม่พบผลงานที่ตรงกับตัวกรอง</p>}
    </div>
  );
};

export default ShopPage;
