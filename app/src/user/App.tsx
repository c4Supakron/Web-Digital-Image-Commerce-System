import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. อย่าลืม Import หน้า HomePage เข้ามาด้วย!
import HomePage from './home.tsx'; 
import LoginPage from './login.tsx';
import RegisterPage from './register.tsx';
import ShopPage from './shop.tsx';
import AddressPage from './address.tsx';
import ProfilePage from './profile.tsx';
import ProductDetailPage from './product-detail.tsx';
import CardPage from './card.tsx';
import RegisterArtistPage from './register.artist.tsx';
import OrdersPage from './orders.tsx';
import FavoritesPage from './favorites.tsx';
import AdminDashboard from '../admin/admin-dashboard.tsx';
import ArtistDashboard from '../artist/artist-dashboard.tsx';
import GoogleAuthCallback from './google-auth-callback.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้าแรกสุด (/) */}
        <Route path="/" element={<HomePage />} /> 

        {/* เข้าสู่ระบบ และ สมัครสมาชิก */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register.artist" element={<RegisterArtistPage />} />
        
        {/* แกลเลอรี และ รายละเอียดสินค้า */}
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/product" element={<ProductDetailPage />} />

        {/* ตะกร้าสินค้า (รองรับทั้ง /cart และ /card) */}
        <Route path="/cart" element={<CardPage />} />
        <Route path="/card" element={<CardPage />} />

        {/* รายการโปรด และ ประวัติคำสั่งซื้อ */}
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/orders" element={<OrdersPage />} />

        {/* ที่อยู่ และ โปรไฟล์ */}
        <Route path="/address" element={<AddressPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* แดชบอร์ด */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/artist-dashboard" element={<ArtistDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
