import React, { useEffect, useState } from 'react';
import './profile.css';
import { Menu, Search, Heart, ShoppingBag, User, X, Chrome, LogOut, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser, updateProfile, type AccountProfile } from '../api';

const readCachedProfile = (): AccountProfile | null => {
  try {
    const value = localStorage.getItem('user');
    if (!value) return null;
    const user = JSON.parse(value) as Partial<AccountProfile>;
    if (!user.id || !user.username || !user.email) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      role: user.role || 'MEMBER',
      artist_status: user.artist_status || 'NOT_APPLIED',
      google_connected: Boolean(user.google_connected),
    };
  } catch {
    return null;
  }
};

const toProfileForm = (user: AccountProfile) => ({
  username: user.username,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
});

const ProfilePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [profile, setProfile] = useState<AccountProfile | null>(readCachedProfile);
  const [form, setForm] = useState(() => {
    const cached = readCachedProfile();
    return cached ? toProfileForm(cached) : { username: '', name: '', email: '', phone: '', bio: '' };
  });
  const [profileError, setProfileError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setProfile(user);
        setForm(toProfileForm(user));
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '';
        if (message === 'ยังไม่ได้เข้าสู่ระบบ' || message === 'ไม่พบบัญชีผู้ใช้') {
          navigate('/login', { replace: true });
          return;
        }
        setProfileError(message === 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง'
          ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กำลังแสดงข้อมูลโปรไฟล์ที่บันทึกไว้ในเบราว์เซอร์'
          : message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
      });
    return () => { cancelled = true; };
  }, [navigate]);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      const user = await updateProfile({ username: form.username, name: form.name, phone: form.phone, bio: form.bio });
      setProfile(user);
      setForm(toProfileForm(user));
      localStorage.setItem('user', JSON.stringify(user));
      setSaveMessage('บันทึกข้อมูลโปรไฟล์แล้ว');
      setProfileError('');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      await logoutUser();
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="clean-page">
      
      {/* --- NAVBAR --- */}
      <nav className="clean-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={32} color="#000" strokeWidth={2} />
          </button>
          <Link to="/" className="brand-logo">V-ART</Link>
        </div>
        <div className="nav-icons">
  <Link to="/shop"><Search size={22} /></Link>
  <Link to="/favorites"><Heart size={22} /></Link> {/* หัวใจ -> ไปหน้ารายการโปรด */}
  <Link to="/orders" aria-label="ประวัติการสั่งซื้อ" title="ประวัติการสั่งซื้อ"><ClipboardList size={22} /></Link>
  <Link to="/cart"><ShoppingBag size={22} /></Link>
  <Link to={localStorage.getItem('user') ? '/profile' : '/login'} aria-label={localStorage.getItem('user') ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}><User size={22} /></Link>
</div>
      </nav>

      {/* --- SIDEBAR --- */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={28} />
        </button>
        <ul className="sidebar-menu">
            <li><Link to="/">หน้าหลัก</Link></li>
            <li><Link to="/shop">แกลเลอรี</Link></li>
            <li><Link to="/profile" style={{fontWeight: 'bold'}}>ข้อมูลส่วนตัว</Link></li>
            <li><Link to="/address">ที่อยู่จัดส่ง</Link></li>
            <li><Link to="/orders">ประวัติการสั่งซื้อ</Link></li>
            <li className="special-menu" style={{ marginTop: '20px' }}>
              <Link to="/register.artist">สมัครเป็นศิลปิน</Link>
            </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="form-container">
        <div className="form-header">
          <h2>ข้อมูลส่วนตัว</h2>
          <p>จัดการข้อมูลส่วนตัวและช่องทางติดต่อของคุณ</p>
        </div>

        <form className="spacious-form" onSubmit={handleSaveProfile}>
            {profileError && <p role="alert">{profileError}</p>}
            {!profile && !profileError && <p role="status">กำลังโหลดข้อมูลโปรไฟล์...</p>}
            <div className="input-group">
              <label htmlFor="profile-username">ชื่อผู้ใช้งาน</label>
              <input id="profile-username" type="text" maxLength={80} required value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="profile-name">ชื่อในบัญชี</label>
                <input id="profile-name" type="text" maxLength={160} required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="input-group">
                <label htmlFor="profile-email">อีเมล</label>
                <input id="profile-email" type="email" value={form.email} readOnly aria-describedby="profile-email-help" />
                <small id="profile-email-help">อีเมลใช้ผูกบัญชีและเข้าสู่ระบบ จึงแก้ไขไม่ได้</small>
              </div>
              <div className="input-group">
                <label htmlFor="profile-phone">เบอร์โทรศัพท์</label>
                <input id="profile-phone" type="tel" maxLength={30} autoComplete="tel" placeholder="08X-XXX-XXXX" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="profile-bio">เกี่ยวกับฉัน</label>
              <textarea id="profile-bio" rows={4} maxLength={2000} placeholder="เล่าเกี่ยวกับตัวคุณ..." value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}></textarea>
            </div>

            <div className="input-group">
              <label>บัญชีที่เชื่อมต่อ</label>
              <div className="social-connect">
                <div className="social-btn-outline" role="status" aria-label={profile?.google_connected ? 'เชื่อมต่อ Google แล้ว' : 'ยังไม่ได้เชื่อมต่อ Google'} style={{ cursor: 'default', color: profile?.google_connected ? '#15803d' : '#64748b' }}>
                  <Chrome size={20} /> {profile?.google_connected ? 'เชื่อมต่อ Google แล้ว' : 'ยังไม่ได้เชื่อมต่อ Google'}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
              <button type="button" className="btn-logout" onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut size={18} /> {isLoggingOut ? 'กำลังออกจากระบบ…' : 'ออกจากระบบ'}
              </button>
            </div>
            {logoutError && <p className="logout-error" role="alert">{logoutError}</p>}
            {saveMessage && <p role={saveMessage === 'บันทึกข้อมูลโปรไฟล์แล้ว' ? 'status' : 'alert'}>{saveMessage}</p>}
        </form>
      </div>

    </div>
  );
};

export default ProfilePage;
