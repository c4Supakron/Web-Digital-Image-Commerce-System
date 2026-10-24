import React, { useEffect, useState } from 'react';
import './product-detail.css';
import { Heart, ShoppingBag, Star, ArrowLeft, Share2, User, ClipboardList } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { addCartItem, addFavorite, getProductReviews, getProducts, submitProductReview, type Product, type ProductReviewsData } from '../api';
import ArtworkImage from './ArtworkImage';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReviewsData | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingReview, setSavingReview] = useState(false);

  const refreshReviews = async (id: number) => setReviews(await getProductReviews(id));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts().then(async (products) => {
      const selected = productId ? products.find((item) => item.id === Number(productId)) : products[0];
      if (!selected) throw new Error('ไม่พบผลงานนี้');
      if (cancelled) return;
      setProduct(selected);
      try {
        const data = await getProductReviews(selected.id);
        if (!cancelled) {
          setReviews(data);
          if (data.myReview) { setRating(data.myReview.rating); setComment(data.myReview.comment); }
        }
      } catch (error) { if (!cancelled) setMessage(error instanceof Error ? error.message : 'โหลดรีวิวไม่สำเร็จ'); }
    }).catch((error: unknown) => { if (!cancelled) setMessage(error instanceof Error ? error.message : 'โหลดผลงานไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const handleReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    setSavingReview(true); setMessage('');
    try {
      await submitProductReview(product.id, { rating, comment });
      await refreshReviews(product.id);
      setMessage('บันทึกคะแนนและรีวิวแล้ว');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'บันทึกรีวิวไม่สำเร็จ'); }
    finally { setSavingReview(false); }
  };

  if (loading) return <main className="product-container"><p role="status">กำลังโหลดผลงาน...</p></main>;
  if (!product) return <main className="product-container"><p role="alert">{message || 'ไม่พบผลงานนี้'}</p><Link to="/shop">กลับไปแกลเลอรี</Link></main>;

  return <div className="clean-page">
    <nav className="clean-navbar">
      <div className="nav-left"><Link to="/shop" className="back-link"><ArrowLeft size={20} /> กลับไปหน้าแกลเลอรี</Link></div>
      <Link to="/" className="brand-logo">V-ART</Link>
      <div className="nav-icons"><Link to="/orders" aria-label="ประวัติการสั่งซื้อ" title="ประวัติการสั่งซื้อ"><ClipboardList size={22} /></Link><Link to="/cart" aria-label="ตะกร้าสินค้า"><ShoppingBag size={22} /></Link><Link to={localStorage.getItem('user') ? '/profile' : '/login'} aria-label="โปรไฟล์"><User size={22} /></Link></div>
    </nav>

    <main className="product-container">
      <div className="product-image-section"><ArtworkImage src={product.image} alt={product.title} className="main-image" /></div>
      <div className="product-info-section">
        <div className="artist-info"><div className="artist-avatar" /><span>โดย <strong>{product.artist}</strong></span></div>
        <h1 className="product-title">{product.title}</h1>
        <p className="product-price">{new Intl.NumberFormat('th-TH').format(product.price)} บาท</p>
        <div className="product-stats"><span className="rating"><Star size={16} fill="#000" /> {reviews?.reviewCount ? reviews.averageRating.toFixed(1) : 'ยังไม่มีคะแนน'} ({reviews?.reviewCount || 0} รีวิว)</span><span className="dot">•</span><span>{product.category}</span></div>
        <p className="product-desc">{product.description || 'ยังไม่มีคำอธิบายผลงาน'}</p>
        <div className="product-actions">
          <button className="btn-add-to-cart" onClick={() => addCartItem(product.id).then(() => setMessage('เพิ่มลงตะกร้าแล้ว')).catch((error) => setMessage(error.message))}><ShoppingBag size={20} /> เพิ่มลงตะกร้า</button>
          <button className="btn-wishlist" aria-label="บันทึกรายการโปรด" onClick={() => addFavorite(product.id).then(() => setMessage('บันทึกรายการโปรดแล้ว')).catch((error) => setMessage(error.message))}><Heart size={20} /></button>
          <button className="btn-wishlist" aria-label="แชร์ผลงาน" onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => setMessage('คัดลอกลิงก์ผลงานแล้ว')).catch(() => setMessage('คัดลอกลิงก์ไม่สำเร็จ'))}><Share2 size={20} /></button>
        </div>
        {message && <p role="status">{message}</p>}
      </div>
    </main>

    <section className="reviews-section">
      <h2>รีวิวจากผู้ซื้อ ({reviews?.reviewCount || 0})</h2>
      {reviews?.canReview ? <form className="write-review-box" onSubmit={handleReview}>
        <h3>{reviews.myReview ? 'แก้ไขคะแนนและรีวิวของคุณ' : 'ให้คะแนนผลงานที่ได้รับแล้ว'}</h3>
        <div className="star-rating-input" role="group" aria-label="เลือกคะแนน 1 ถึง 5 ดาว">
          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} ดาว`} aria-pressed={rating === value} onClick={() => setRating(value)} style={{ border: 0, background: 'transparent', padding: 2, cursor: 'pointer' }}><Star size={24} className={value <= rating ? 'star-active' : 'star-inactive'} /></button>)}
        </div>
        <textarea aria-label="ข้อความรีวิว" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="แบ่งปันความประทับใจเกี่ยวกับผลงานชิ้นนี้..." rows={3} />
        <button className="btn-submit-review" type="submit" disabled={savingReview}>{savingReview ? 'กำลังบันทึก...' : 'ส่งรีวิว'}</button>
      </form> : <p className="write-review-box">เขียนรีวิวได้เมื่อมีคำสั่งซื้อผลงานนี้ที่จัดส่งแล้ว {localStorage.getItem('user') ? '' : <><Link to="/login">เข้าสู่ระบบ</Link> เพื่อดูสิทธิ์การรีวิว</>}</p>}
      {reviews?.reviews.length ? <div className="review-list">{reviews.reviews.map((review) => <article className="review-card" key={review.id}>
        <div className="review-header"><div className="reviewer-name">{review.reviewer_name} · ผู้ซื้อที่ได้รับสินค้าแล้ว</div><div className="review-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.rating ? '#000' : 'none'} color={index < review.rating ? '#000' : '#ccc'} />)}</div></div>
        {review.comment && <p className="review-text">{review.comment}</p>}<span className="review-date">{new Date(review.created_at).toLocaleDateString('th-TH')}</span>
      </article>)}</div> : <p>ยังไม่มีรีวิวสำหรับผลงานนี้</p>}
    </section>
  </div>;
};

export default ProductDetailPage;
