import { Equipment, User, Booking, KnowledgeArticle, WeatherData, EquipmentCategory, SupportComplaint } from '../types';

const API_BASE = '/api';

export async function authenticate(data: { email: string; password: string; role: string }): Promise<{ user: User; token: string } | null> {
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to sign in');
  return res.json();
}

export async function registerAccount(data: Record<string, unknown>): Promise<{ user: User; token: string } | null> {
  const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to create account');
  return res.json();
}

export async function fetchCategories(): Promise<EquipmentCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function createCategory(data: { name: string; description?: string }): Promise<EquipmentCategory | null> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function fetchEquipmentList(params: Record<string, string | number | boolean>): Promise<Equipment[]> {
  try {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/equipment?${query}`);
    if (!res.ok) throw new Error('Failed to fetch equipment');
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function fetchEquipmentById(id: string): Promise<Equipment | null> {
  try {
    const res = await fetch(`${API_BASE}/equipment/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function createEquipment(data: Partial<Equipment>, submitterRole: string): Promise<Equipment | null> {
  try {
    const res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': submitterRole },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create equipment');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment | null> {
  try {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update equipment');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function updateEquipmentOnboarding(id: string, status: 'pending_approval' | 'approved' | 'rejected', actorRole: 'admin'): Promise<Equipment | null> {
  const res = await fetch(`${API_BASE}/equipment/${id}/onboarding`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-role': actorRole }, body: JSON.stringify({ status }) });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/equipment/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function createBooking(data: Record<string, unknown>, requesterRole: string): Promise<Booking | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': requesterRole },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** In mock mode this is the gateway callback surrogate; live gateways send their signed result here. */
export async function payForBooking(bookingId: string): Promise<Booking | null> {
  try {
    const orderRes = await fetch(`${API_BASE}/payments/create-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId }) });
    if (!orderRes.ok) throw new Error('Could not create secure payment order');
    const order = await orderRes.json();
    const verifyRes = await fetch(`${API_BASE}/payments/razorpay/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: order.id, razorpay_payment_id: `mock_pay_${Date.now()}` }) });
    if (!verifyRes.ok) throw new Error('Payment is being verified');
    return (await verifyRes.json()).booking;
  } catch (e) { console.error(e); return null; }
}

export async function fetchFinance(): Promise<any> { const res = await fetch(`${API_BASE}/finance`); return res.ok ? res.json() : { payments: [], payouts: [] }; }
export async function processPayout(id: string, adminId: string): Promise<boolean> { const res = await fetch(`${API_BASE}/payouts/${id}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' }, body: JSON.stringify({ adminId }) }); return res.ok; }

export async function fetchBookings(role?: string, userId?: string): Promise<Booking[]> {
  try {
    const param = role === 'farmer' ? `farmerId=${userId}` : role === 'provider' ? `providerId=${userId}` : '';
    const res = await fetch(`${API_BASE}/bookings?role=${role || ''}&${param}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function updateBookingStatus(id: string, bookingStatus?: string, paymentStatus?: string): Promise<Booking | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingStatus, paymentStatus })
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    const json = await res.json();
    return json.booking;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function fetchKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  try {
    const res = await fetch(`${API_BASE}/knowledge`);
    if (!res.ok) throw new Error('Failed to fetch knowledge articles');
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    const res = await fetch(`${API_BASE}/weather`);
    if (!res.ok) throw new Error('Failed to fetch weather');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export type AiAdvisorSource = { title: string; url: string };
export type AiAdvisorMessage = { sender: 'ai' | 'user'; text: string; sources?: AiAdvisorSource[] };
export type AiAdvisorReply = { response: string; mode: 'gemini-ai' | 'local-guidance'; sources: AiAdvisorSource[] };

export async function queryAiAssistant(query: string, landSize?: number, crop?: string, location?: string, history: AiAdvisorMessage[] = []): Promise<AiAdvisorReply> {
  const res = await fetch(`${API_BASE}/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, landSize, crop, location, history })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'The AI advisor could not answer right now.');
  return {
    response: data.response || 'I could not generate an answer. Please try again.',
    mode: data.mode === 'gemini-ai' ? 'gemini-ai' : 'local-guidance',
    sources: Array.isArray(data.sources) ? data.sources : []
  };
}

export async function fetchAdminAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    return await res.json();
  } catch (e) {
    return {
      totalRevenue: 0,
      platformProfit: 0,
      activeFarmers: 0,
      verifiedProviders: 0,
      totalEquipment: 0,
      totalBookings: 0,
      pendingApprovals: 0
    };
  }
}

export async function fetchUsersList(role?: string): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/users?role=${role || ''}`);
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function updateUserStatus(userId: string, status?: string, isVerified?: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, isVerified })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
