import { normalizePhone } from './phone';

// Shared in-memory mock store for local development, previews, and testing
// Keeps credentials and mock sheet state in server memory without logging passwords.

export interface MockUser {
  phone: string;
  name: string;
  district: string;
  standard: string;
  stream?: string;
  medium: 'english' | 'tamil';
  plan: 'free' | 'pro' | 'live';
  password: string | null; // null for pre-v4 users
  isAdmin?: boolean;
  joined: string;
}

interface MockStore {
  users: Map<string, MockUser>;
  adminPhones: Set<string>;
  adminPasswords: Map<string, string>;
  materials: Array<{ tab: string; row: Record<string, unknown>; addedAt: string }>;
}

declare global {
  // eslint-disable-next-line no-var
  var __centum_mock_store__: MockStore | undefined;
}

function initMockStore(): MockStore {
  const users = new Map<string, MockUser>();
  const adminPhones = new Set<string>(['9876543210', '9999999999', '6380444830']);
  const adminPasswords = new Map<string, string>([
    ['9876543210', 'founder123'],
    ['9999999999', 'founder123'],
    ['6380444830', 'founder123'],
  ]);

  // Seed Founder Admin user
  users.set('9876543210', {
    phone: '9876543210',
    name: 'Founder Admin',
    district: 'Chennai',
    standard: '12th',
    stream: 'Science — Maths',
    medium: 'english',
    plan: 'pro',
    password: 'founder123',
    isAdmin: true,
    joined: '2026-09-01',
  });

  users.set('9999999999', {
    phone: '9999999999',
    name: 'Founder Admin',
    district: 'Chennai',
    standard: '12th',
    stream: 'Science — Maths',
    medium: 'english',
    plan: 'pro',
    password: 'founder123',
    isAdmin: true,
    joined: '2026-09-01',
  });

  users.set('6380444830', {
    phone: '6380444830',
    name: 'Founder Admin',
    district: 'Chennai',
    standard: '12th',
    stream: 'Science — Maths',
    medium: 'english',
    plan: 'pro',
    password: 'founder123',
    isAdmin: true,
    joined: '2026-09-01',
  });

  // Seed Pre-v4 student with NO password (to test needs-password-setup)
  users.set('9123456780', {
    phone: '9123456780',
    name: 'Kavitha R',
    district: 'Madurai',
    standard: '10th',
    medium: 'tamil',
    plan: 'free',
    password: null, // Pre-v4 user: no password hash yet
    joined: '2026-09-10',
  });

  // Seed Standard student with password
  users.set('9840123456', {
    phone: '9840123456',
    name: 'Ananya S',
    district: 'Coimbatore',
    standard: '12th',
    stream: 'Science — Maths',
    medium: 'english',
    plan: 'pro',
    password: 'centum2026',
    joined: '2026-09-15',
  });

  // Seed additional sample students
  users.set('9443123456', {
    phone: '9443123456',
    name: 'Karthik V',
    district: 'Salem',
    standard: '10th',
    medium: 'english',
    plan: 'free',
    password: 'password123',
    joined: '2026-09-18',
  });

  return {
    users,
    adminPhones,
    adminPasswords,
    materials: [],
  };
}

const store: MockStore = globalThis.__centum_mock_store__ || (globalThis.__centum_mock_store__ = initMockStore());

export function findMockUser(phone: string): MockUser | undefined {
  const clean = normalizePhone(phone) || phone;
  return store.users.get(clean);
}

export function registerMockUser(data: {
  phone: string;
  name: string;
  district: string;
  standard: string;
  stream?: string;
  medium?: 'english' | 'tamil';
  password?: string;
}): MockUser {
  const cleanPhone = normalizePhone(data.phone) || data.phone;
  const existing = store.users.get(cleanPhone);
  const user: MockUser = {
    phone: cleanPhone,
    name: data.name,
    district: data.district,
    standard: data.standard,
    stream: data.stream,
    medium: data.medium || 'english',
    plan: existing?.plan || 'free',
    password: data.password || existing?.password || null,
    isAdmin: existing?.isAdmin || store.adminPhones.has(cleanPhone),
    joined: existing?.joined || new Date().toISOString().split('T')[0],
  };

  store.users.set(cleanPhone, user);
  return user;
}

export function setMockUserPassword(phone: string, password: string): boolean {
  const clean = normalizePhone(phone) || phone;
  const user = store.users.get(clean);
  if (!user) return false;
  user.password = password;
  store.users.set(clean, user);
  return true;
}

export function verifyMockAdmin(phone: string, password: string): boolean {
  if (!phone || !password) return false;
  const clean = normalizePhone(phone) || phone;
  const cleanPass = password.trim();

  // Founder master passwords for admin verification
  if (store.adminPhones.has(clean)) {
    if (cleanPass === 'centum-admin-2026' || cleanPass === 'founder123') {
      return true;
    }
  }

  const expectedPassword = store.adminPasswords.get(clean);
  if (!expectedPassword) {
    const user = store.users.get(clean);
    return Boolean(user?.isAdmin && (user?.password?.trim() === cleanPass || cleanPass === 'centum-admin-2026'));
  }
  return expectedPassword.trim() === cleanPass || cleanPass === 'centum-admin-2026';
}

export function changeMockAdminPassword(phone: string, oldPassword: string, newPassword: string): boolean {
  const clean = normalizePhone(phone) || phone;
  if (!verifyMockAdmin(clean, oldPassword)) {
    return false;
  }
  store.adminPasswords.set(clean, newPassword);
  const user = store.users.get(clean);
  if (user) {
    user.password = newPassword;
  }
  return true;
}

export function getMockStats() {
  const usersList = Array.from(store.users.values());
  const studentsTotal = usersList.length;
  const proTotal = usersList.filter((u) => u.plan === 'pro').length;
  const liveTotal = usersList.filter((u) => u.plan === 'live').length;

  return {
    studentsTotal,
    proTotal,
    liveTotal,
    testsTaken: 1420,
    revenueTotal: 124600,
    revenueThisMonth: 38400,
    paymentsCount: 156,
    couponsUsed: 84,
  };
}

export function getMockStudents() {
  return Array.from(store.users.values()).map((u) => {
    // Phone already masked server-side: xxxxx4830
    const raw = u.phone;
    const masked = raw.length >= 10 ? 'xxxxx' + raw.slice(-4) : 'xxxxx';
    return {
      joined: u.joined,
      name: u.name,
      phone: masked,
      standard: u.standard,
      stream: u.stream || '—',
      medium: u.medium,
      plan: u.plan,
    };
  });
}

export function addMockMaterial(tab: string, row: Record<string, unknown>) {
  store.materials.push({
    tab,
    row,
    addedAt: new Date().toISOString(),
  });
  return true;
}
