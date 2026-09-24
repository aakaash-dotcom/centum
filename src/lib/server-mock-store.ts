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
  const adminPhones = new Set<string>(['9876543210', '9999999999']);
  const adminPasswords = new Map<string, string>([
    ['9876543210', 'founder123'],
    ['9999999999', 'founder123'],
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
  return store.users.get(phone);
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
  const existing = store.users.get(data.phone);
  const user: MockUser = {
    phone: data.phone,
    name: data.name,
    district: data.district,
    standard: data.standard,
    stream: data.stream,
    medium: data.medium || 'english',
    plan: existing?.plan || 'free',
    password: data.password || existing?.password || null,
    isAdmin: existing?.isAdmin || store.adminPhones.has(data.phone),
    joined: existing?.joined || new Date().toISOString().split('T')[0],
  };

  store.users.set(data.phone, user);
  return user;
}

export function setMockUserPassword(phone: string, password: string): boolean {
  const user = store.users.get(phone);
  if (!user) return false;
  user.password = password;
  store.users.set(phone, user);
  return true;
}

export function verifyMockAdmin(phone: string, password: string): boolean {
  if (!phone || !password) return false;
  const expectedPassword = store.adminPasswords.get(phone);
  if (!expectedPassword) {
    const user = store.users.get(phone);
    return Boolean(user?.isAdmin && user?.password === password);
  }
  return expectedPassword === password;
}

export function changeMockAdminPassword(phone: string, oldPassword: string, newPassword: string): boolean {
  if (!verifyMockAdmin(phone, oldPassword)) {
    return false;
  }
  store.adminPasswords.set(phone, newPassword);
  const user = store.users.get(phone);
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
