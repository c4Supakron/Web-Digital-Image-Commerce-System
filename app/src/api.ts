export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  artist: string;
  category: string;
  description?: string;
  owner_user_id?: number | null;
}
export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}
export interface ManagedProduct extends Product {
  active: boolean;
  owner_user_id: number | null;
  owner_email?: string | null;
}
export interface ArtistAccount { id: number; name: string; email: string }
export interface ArtistApplication { id: number; username: string; name: string; email: string; artist_status: 'PENDING' | 'REJECTED'; created_at: string }
export interface AdminUser { id: number; username: string; name: string; email: string; role: 'ADMIN' | 'ARTIST' | 'MEMBER'; artist_status: string; created_at: string }
export interface ArtistSalesData {
  summary: { order_count: number; units_sold: number; gross_sales: number; paid_sales: number };
  products: { id: number; title: string; image: string; active: boolean; units_sold: number; gross_sales: number; paid_sales: number }[];
  sales: { order_id: string; status: Order['status']; payment_status: Order['payment_status']; created_at: string; title: string; unit_price: number; quantity: number; line_total: number; customer_name: string }[];
}
export interface ProductReview { id: number; rating: number; comment: string; created_at: string; reviewer_name: string }
export interface ProductReviewsData {
  averageRating: number;
  reviewCount: number;
  canReview: boolean;
  myReview: { id: number; rating: number; comment: string } | null;
  reviews: ProductReview[];
}
export type ProductInput = Pick<Product, 'title' | 'price' | 'image' | 'category' | 'description'> & { ownerUserId?: number; active?: boolean };

export interface CartItem extends Product { quantity: number }
export type ShippingCarrier = 'THAILAND_POST' | 'KEX' | 'FLASH' | 'JT';
export const shippingCarrierLabels: Record<ShippingCarrier, string> = {
  THAILAND_POST: 'ไปรษณีย์ไทย',
  KEX: 'KEX Express',
  FLASH: 'Flash Express',
  JT: 'J&T Express',
};
export const getCarrierTrackingUrl = (carrier: ShippingCarrier, trackingNumber: string) => {
  const tracking = encodeURIComponent(trackingNumber);
  if (carrier === 'THAILAND_POST') return `https://track.thailandpost.co.th/?trackNumber=${tracking}`;
  if (carrier === 'KEX') return 'https://th.kex-express.com/th/track-parcel';
  if (carrier === 'FLASH') return `https://www.flashexpress.com/tracking/?se=${tracking}`;
  return `https://www.jtexpress.co.th/service/track?waybillNo=${tracking}`;
};
export interface Order {
  id: string;
  date: string;
  items: { title: string; price: number; quantity: number; image: string }[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  payment_status: 'AWAITING_PAYMENT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  shipping_address: ShippingAddress | null;
  shipping_carrier: ShippingCarrier | null;
  tracking_number: string | null;
}
export interface AdminOrder extends Omit<Order, 'date'> {
  customer_name: string;
  customer_email: string;
  payment_proof_mime_type: 'image/jpeg' | 'image/png' | 'application/pdf' | null;
  payment_proof_submitted_at: string | null;
}
export interface CreatedOrder {
  id: string;
  status: Order['status'];
  payment_status: Order['payment_status'];
  subtotal: number;
  shipping_fee: number;
  total: number;
}
export interface OrderPaymentQr { method: 'PROMPTPAY_QR'; amount: number; qrCodeDataUrl: string }

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine: string;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  notes?: string;
}
export interface SavedAddress extends ShippingAddress { id: number }

export interface AccountProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  role: 'ADMIN' | 'ARTIST' | 'MEMBER';
  artist_status: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  google_connected: boolean;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(typeof FormData !== 'undefined' && init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง');
  }
  let data: Record<string, unknown> = {};
  if (response.status !== 204) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      if (response.status === 404) {
      throw new Error(`ไม่พบ API ${path} — กรุณารีสตาร์ตเซิร์ฟเวอร์จากโฟลเดอร์ server ของโปรเจกต์`);
      }
      throw new Error(`เซิร์ฟเวอร์ส่งข้อมูลไม่ถูกต้อง (HTTP ${response.status})`);
    }
    try {
      data = await response.json() as Record<string, unknown>;
    } catch {
      throw new Error('เซิร์ฟเวอร์ส่งข้อมูล JSON ไม่ถูกต้อง กรุณาตรวจสอบและรีสตาร์ตเซิร์ฟเวอร์');
    }
  }
  if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ');
  return data as T;
}

export const getProducts = async (filters: ProductFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, value); });
  const suffix = params.size ? `?${params.toString()}` : '';
  return (await request<{ products: Product[] }>(`/api/products${suffix}`)).products;
};
export const getProductCategories = async () => (await request<{ categories: string[] }>('/api/products/categories')).categories;
export const getCurrentUser = async () => (await request<{ user: AccountProfile }>('/api/auth/me')).user;
export const updateProfile = async (profile: Pick<AccountProfile, 'username' | 'name' | 'phone' | 'bio'>) =>
  (await request<{ user: AccountProfile }>('/api/profile', { method: 'PATCH', body: JSON.stringify(profile) })).user;
export const getAddresses = async () => (await request<{ addresses: SavedAddress[] }>('/api/addresses')).addresses;
export const createAddress = (address: ShippingAddress) => request<{ address: SavedAddress }>('/api/addresses', { method: 'POST', body: JSON.stringify(address) });
export const updateAddress = (id: number, address: ShippingAddress) => request<{ address: SavedAddress }>(`/api/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(address) });
export const deleteAddress = (id: number) => request<{ ok: boolean }>(`/api/addresses/${id}`, { method: 'DELETE' });
export const getManagedProducts = async () => (await request<{ products: ManagedProduct[] }>('/api/manage/products')).products;
export const getArtistAccounts = async () => (await request<{ artists: ArtistAccount[] }>('/api/manage/artists')).artists;
export const getArtistApplications = async () => (await request<{ applications: ArtistApplication[] }>('/api/admin/artist-applications')).applications;
export const reviewArtistApplication = (id: number, decision: 'APPROVED' | 'REJECTED') => request(`/api/admin/artist-applications/${id}`, { method: 'PATCH', body: JSON.stringify({ decision }) });
export const submitArtistApplication = () => request<{ message: string; user: import('./mockData').User }>('/api/artist/application', { method: 'POST' });
export const getAdminOrders = async () => (await request<{ orders: AdminOrder[] }>('/api/admin/orders')).orders;
export const updateAdminOrderStatus = (id: string, status: Order['status']) => request(`/api/admin/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const updateAdminOrderShipping = (id: string, body: { carrier: ShippingCarrier; trackingNumber: string }) => request(`/api/admin/orders/${encodeURIComponent(id)}/shipping`, { method: 'PATCH', body: JSON.stringify(body) });
export const reviewAdminPayment = (id: string, decision: 'APPROVED' | 'REJECTED') => request<{ order: Pick<Order, 'id' | 'payment_status'> }>(`/api/admin/orders/${encodeURIComponent(id)}/payment-review`, { method: 'PATCH', body: JSON.stringify({ decision }) });
export const downloadAdminPaymentProof = async (id: string) => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/admin/orders/${encodeURIComponent(id)}/payment-proof`, { credentials: 'include' });
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง');
  }
  if (!response.ok) {
    let message = 'เปิดหลักฐานการชำระเงินไม่สำเร็จ';
    try {
      const data = await response.json() as { message?: string };
      if (data.message) message = data.message;
    } catch { /* Keep the default message for non-JSON error responses. */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' }[blob.type] || 'file';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `payment-proof-${id}.${extension}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
export const getAdminUsers = async (q = '') => (await request<{ users: AdminUser[] }>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)).users;
export const updateAdminUserRole = (id: number, role: 'MEMBER' | 'ARTIST') => request(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
export const getArtistSales = () => request<ArtistSalesData>('/api/artist/sales');
export const getProductReviews = (productId: number) => request<ProductReviewsData>(`/api/products/${productId}/reviews`);
export const submitProductReview = (productId: number, body: { rating: number; comment: string }) => request<{ review: { id: number; rating: number; comment: string; created_at: string } }>(`/api/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) });
export const createManagedProduct = (body: ProductInput) => request<{ product: ManagedProduct }>('/api/manage/products', { method: 'POST', body: JSON.stringify(body) });
export const updateManagedProduct = (id: number, body: ProductInput) => request<{ product: ManagedProduct }>(`/api/manage/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const archiveManagedProduct = (id: number) => request<{ ok: boolean }>(`/api/manage/products/${id}`, { method: 'DELETE' });
export const getFavorites = async () => (await request<{ products: Product[] }>('/api/favorites')).products;
export const addFavorite = (id: number) => request(`/api/favorites/${id}`, { method: 'POST' });
export const removeFavorite = (id: number) => request(`/api/favorites/${id}`, { method: 'DELETE' });
export const getCart = async () => (await request<{ items: CartItem[] }>('/api/cart')).items;
export const addCartItem = (id: number) => request(`/api/cart/${id}`, { method: 'POST' });
export const removeCartItem = (id: number) => request(`/api/cart/${id}`, { method: 'DELETE' });
export const createOrder = (body: { shippingAddress: ShippingAddress }) => request<{ order: CreatedOrder }>('/api/orders', { method: 'POST', body: JSON.stringify(body) });
export const getOrderPaymentQr = async (id: string) => (await request<{ payment: OrderPaymentQr }>(`/api/orders/${encodeURIComponent(id)}/payment-qr`)).payment;
export const uploadPaymentProof = (id: string, file: File) => {
  const body = new FormData();
  body.append('proof', file);
  return request<{ message: string; payment_status: Order['payment_status']; submitted_at: string }>(`/api/orders/${encodeURIComponent(id)}/payment-proof`, { method: 'POST', body });
};
export const getOrders = async () => (await request<{ orders: Order[] }>('/api/orders')).orders;
export const logoutUser = () => request<{ ok: boolean }>('/api/logout', { method: 'POST' });
