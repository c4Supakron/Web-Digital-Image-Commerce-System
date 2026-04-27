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
import RegisterArtistPage from './register.artist';
import AdminDashboard from '../admin/admin-dashboard.tsx';
import ArtistDashboard from '../artist/artist-dashboard.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- จุดที่ต้องแก้คือตรงนี้ครับ --- */}
        
        {/* กฎข้อที่ 1: หน้าแรกสุด (/) ต้องให้แสดง HomePage ไม่ใช่ LoginPage */}
        <Route path="/" element={<HomePage />} /> 

        {/* กฎข้อที่ 2: ถ้าจะไปหน้า Login ต้องเข้าผ่าน /login เท่านั้น */}
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/shop" element={<ShopPage />} />

        <Route path="/address" element={<AddressPage />} />

         <Route path="/profile" element={<ProfilePage />} />
        {/* ------------------------------- */}

        <Route path="/product" element={<ProductDetailPage />} />

        <Route path="/card" element={<CardPage />} />

        <Route path="/register.artist" element={<RegisterArtistPage />} />

        <Route path="/admin" element={<AdminDashboard />} />
        
        <Route path="/artist-dashboard" element={<ArtistDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;