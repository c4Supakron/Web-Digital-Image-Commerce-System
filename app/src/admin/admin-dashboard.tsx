import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <h1>👑 ยินดีต้อนรับสู่แผงควบคุมของ Admin</h1>
      <p>หน้านี้เฉพาะแอดมินเท่านั้นที่จะเข้าได้ (เอาไว้ดูออเดอร์ หรือตรวจสอบศิลปิน)</p>

      <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        ออกจากระบบ
      </button>
    </div>
  );
};

export default AdminDashboard;