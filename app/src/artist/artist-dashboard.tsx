import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ArtistDashboard: React.FC = () => {
  const navigate = useNavigate();

  // ดึงข้อมูลศิลปินจาก LocalStorage มาแสดงชื่อ
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#faf5ff', minHeight: '100vh', color: '#4c1d95' }}>
      <h1>🎨 พื้นที่สำหรับศิลปิน: {userData.name || 'คุณศิลปิน'}</h1>
      <p>ที่นี่คือหลังบ้านของคุณ! ในอนาคตเราจะทำปุ่ม "อัปโหลดภาพวาด" และ "ดูยอดขาย" ตรงนี้ครับ</p>

      <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        ออกจากระบบ
      </button>
    </div>
  );
};

export default ArtistDashboard;