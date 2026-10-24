import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../mockData';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('กำลังตรวจสอบการเข้าสู่ระบบ…');

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      const params = new URLSearchParams(window.location.search);
      if (params.has('error')) {
        const reason = params.get('error');
        setError(reason === 'account_required'
          ? 'ยังไม่มีบัญชีนี้ในระบบ กรุณาสมัครสมาชิกด้วยอีเมลนี้ก่อน แล้วจึงเข้าสู่ระบบด้วย Google'
          : reason === 'google_account_mismatch'
            ? 'บัญชี Google นี้ไม่ตรงกับบัญชีที่สมัครไว้ กรุณาใช้อีเมลเดียวกัน'
            : 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง');
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, { credentials: 'include' });
        if (!response.ok) throw new Error('ไม่พบ session');
        const data: { user?: User } = await response.json();
        if (!data.user) throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง');
        if (cancelled) return;

        localStorage.setItem('user', JSON.stringify(data.user));
        const role = data.user.role?.toUpperCase();
        navigate(role === 'ADMIN' ? '/admin' : role === 'ARTIST' || data.user.artist_status === 'PENDING' || data.user.artist_status === 'REJECTED' ? '/artist-dashboard' : '/', { replace: true });
      } catch {
        if (!cancelled) setError('ยืนยันตัวตนไม่สำเร็จ กรุณากลับไปลองเข้าสู่ระบบอีกครั้ง');
      }
    }

    void finishLogin();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="clean-layout">
      <section className="clean-card" aria-live="polite">
        <div className="clean-header"><h1>เข้าสู่ระบบด้วย Google</h1></div>
        <p style={{ textAlign: 'center', color: '#475569' }}>{error}</p>
        {error !== 'กำลังตรวจสอบการเข้าสู่ระบบ…' && (
          <p className="clean-footer">
            {new URLSearchParams(window.location.search).get('error') === 'account_required' && <><Link to="/register">สมัครสมาชิก</Link> · </>}
            <Link to="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
          </p>
        )}
      </section>
    </main>
  );
}
