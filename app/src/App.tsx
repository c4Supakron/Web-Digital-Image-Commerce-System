import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. อย่าลืม Import หน้า HomePage เข้ามาด้วย!
import HomePage from './home.tsx'; 
import LoginPage from './login.tsx';
import RegisterPage from './register.tsx';

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
        
        {/* ------------------------------- */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;