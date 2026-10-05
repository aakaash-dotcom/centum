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

export interface MockTuition {
  code: string;
  ownerName: string;
  ownerPhone: string;
  ownerUpi?: string;
  tuitionName: string;
  district?: string;
  mode: 'coupon' | 'seats';
  discountPercent: number;
  commissionPercent: number;
  seatsTotal: number;
  active: boolean;
  createdAt: string;
}

export interface MockSeat {
  seatCode: string;
  tuitionCode: string;
  phone: string | null;
  claimedAt: string | null;
  expiresAt: string | null;
}

interface MockStore {
  users: Map<string, MockUser>;
  adminPhones: Set<string>;
  adminPasswords: Map<string, string>;
  materials: Array<{ tab: string; row: Record<string, unknown>; addedAt: string }>;
  coins: Map<string, { balance: number; recent: Array<{ reason: string; amount: number; timestamp: string; ref: string }> }>;
  referralCodes: Map<string, string>;
  tuitions: Map<string, MockTuition>;
  seats: Map<string, MockSeat>;
  studentTuitions: Map<string, string>; // phone -> tuitionCode
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

  const tuitions = new Map<string, MockTuition>();
  const seats = new Map<string, MockSeat>();
  const studentTuitions = new Map<string, string>();

  // Seed Tuitions
  tuitions.set('DEMO10', {
    code: 'DEMO10',
    ownerName: 'Ramesh Kumar',
    ownerPhone: '9840123456',
    ownerUpi: 'ramesh@oksbi',
    tuitionName: 'Apex Centum Academy',
    district: 'Chennai',
    mode: 'coupon',
    discountPercent: 10,
    commissionPercent: 15,
    seatsTotal: 20,
    active: true,
    createdAt: '2026-09-01T10:00:00.000Z',
  });

  tuitions.set('APEX20', {
    code: 'APEX20',
    ownerName: 'Senthil Nathan',
    ownerPhone: '9443123456',
    ownerUpi: 'senthil@okhdfc',
    tuitionName: 'Bright Stars Tuition Centre',
    district: 'Coimbatore',
    mode: 'seats',
    discountPercent: 15,
    commissionPercent: 20,
    seatsTotal: 10,
    active: true,
    createdAt: '2026-09-15T12:00:00.000Z',
  });

  // Seed sample seats for DEMO10
  for (let i = 1; i <= 20; i++) {
    const num = String(i).padStart(2, '0');
    const seatCode = `DEMO10-S${num}`;
    const isClaimed = i === 1;
    seats.set(seatCode, {
      seatCode,
      tuitionCode: 'DEMO10',
      phone: isClaimed ? '9123456780' : null,
      claimedAt: isClaimed ? '2026-09-20T10:00:00.000Z' : null,
      expiresAt: isClaimed ? '2027-09-20T10:00:00.000Z' : null,
    });
  }

  // Seed sample seats for APEX20
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const seatCode = `APEX20-S${num}`;
    seats.set(seatCode, {
      seatCode,
      tuitionCode: 'APEX20',
      phone: null,
      claimedAt: null,
      expiresAt: null,
    });
  }

  studentTuitions.set('9123456780', 'DEMO10');

  return {
    users,
    adminPhones,
    adminPasswords,
    materials: [],
    coins: new Map(),
    referralCodes: new Map(),
    tuitions,
    seats,
    studentTuitions,
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

export function getMockCoins(phone: string) {
  const clean = normalizePhone(phone) || phone;
  if (!clean) return { balance: 0, recent: [] };
  const entry = store.coins.get(clean);
  if (!entry) {
    return { balance: 20, recent: [{ reason: 'welcome', amount: 20, timestamp: new Date().toISOString(), ref: 'welcome' }] };
  }
  return { balance: entry.balance, recent: entry.recent };
}

export function earnMockCoins(phone: string, reason: string, ref: string) {
  const clean = normalizePhone(phone) || phone;
  if (!clean) return { ok: false, error: 'phone required' };

  let entry = store.coins.get(clean);
  if (!entry) {
    entry = { balance: 20, recent: [{ reason: 'welcome', amount: 20, timestamp: new Date().toISOString(), ref: 'welcome' }] };
    store.coins.set(clean, entry);
  }

  // Check if already credited for this ref
  const existing = entry.recent.find((r) => r.reason === reason && r.ref === ref);
  if (existing) {
    return { ok: true, balance: entry.balance, earned: 0, duplicate: true };
  }

  const rewardMap: Record<string, number> = {
    'daily-quiz': 5,
    'test-complete': 2,
    'test-perfect': 3,
    'streak-7': 20,
    'streak-30': 100,
    'referral-signup': 20,
    'referral-qualify': 80,
    'welcome': 20,
  };
  const amount = rewardMap[reason] || 2;
  entry.balance += amount;
  entry.recent.unshift({
    reason,
    amount,
    timestamp: new Date().toISOString(),
    ref,
  });

  return { ok: true, balance: entry.balance, earned: amount };
}

export function spendMockCoins(phone: string, reason: string, ref: string, amount: number) {
  const clean = normalizePhone(phone) || phone;
  if (!clean) return { ok: false, error: 'phone required' };

  let entry = store.coins.get(clean);
  if (!entry) {
    entry = { balance: 20, recent: [] };
    store.coins.set(clean, entry);
  }

  if (entry.balance < amount) {
    return { ok: false, error: 'insufficient coins', balance: entry.balance };
  }

  entry.balance -= amount;
  entry.recent.unshift({
    reason,
    amount: -amount,
    timestamp: new Date().toISOString(),
    ref,
  });

  return { ok: true, balance: entry.balance };
}

export function getOrCreateMockReferralCode(phone: string, name?: string) {
  const clean = normalizePhone(phone) || phone;
  if (!clean) return { ok: false, error: 'phone required' };

  let code = store.referralCodes.get(clean);
  if (!code) {
    const prefix = (name ? name.replace(/[^a-zA-Z]/g, '').slice(0, 4) : 'CENT').toUpperCase() || 'CENT';
    const suffix = clean.slice(-4);
    code = `${prefix}${suffix}`;
    store.referralCodes.set(clean, code);
  }

  return { ok: true, code };
}

export function getMockTuition(code: string): MockTuition | undefined {
  if (!code) return undefined;
  return store.tuitions.get(code.trim().toUpperCase());
}

export function joinMockTuition(phone: string, code: string) {
  const clean = normalizePhone(phone) || phone;
  const upperCode = (code || '').trim().toUpperCase();

  if (!clean || clean.length < 10) return { ok: false, error: 'valid-phone-required' };
  if (!upperCode) return { ok: false, error: 'code-required' };

  const tuition = store.tuitions.get(upperCode);
  if (!tuition) return { ok: false, error: 'tuition-not-found' };
  if (!tuition.active) return { ok: false, error: 'tuition-inactive' };

  // GUARD RAIL: One tuition per phone
  const existingCode = store.studentTuitions.get(clean);
  if (existingCode && existingCode !== upperCode) {
    return {
      ok: false,
      error: 'already-enrolled-in-tuition',
      existingCode,
      message: 'This mobile number is already linked to another tuition centre.',
    };
  }

  store.studentTuitions.set(clean, upperCode);
  return {
    ok: true,
    joined: true,
    code: upperCode,
    tuitionName: tuition.tuitionName || upperCode,
  };
}

export function claimMockSeat(phone: string, seatCode: string) {
  const clean = normalizePhone(phone) || phone;
  const upperSeat = (seatCode || '').trim().toUpperCase();

  if (!clean || clean.length < 10) return { ok: false, error: 'valid-phone-required' };
  if (!upperSeat) return { ok: false, error: 'seat-code-required' };

  const seat = store.seats.get(upperSeat);
  if (!seat) return { ok: false, error: 'seat-not-found' };

  // GUARD RAIL: Single-use + phone-bound
  if (seat.phone) {
    const seatPhone = normalizePhone(seat.phone) || seat.phone;
    if (seatPhone === clean) {
      return {
        ok: true,
        claimed: true,
        alreadyClaimed: true,
        tuitionCode: seat.tuitionCode,
        plan: 'pro',
        expiresAt: seat.expiresAt,
      };
    } else {
      return {
        ok: false,
        error: 'seat-already-claimed',
        message: 'This seat code has already been claimed by another student.',
      };
    }
  }

  if (seat.expiresAt) {
    const exp = new Date(seat.expiresAt).getTime();
    if (!isNaN(exp) && exp < Date.now()) {
      return { ok: false, error: 'seat-expired' };
    }
  }

  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const finalExpiry = seat.expiresAt || oneYearLater.toISOString();

  seat.phone = clean;
  seat.claimedAt = new Date().toISOString();
  seat.expiresAt = finalExpiry;

  // Upgrade student plan to Pro in memory
  const user = store.users.get(clean);
  if (user) {
    user.plan = 'pro';
  }
  store.studentTuitions.set(clean, seat.tuitionCode);

  return {
    ok: true,
    claimed: true,
    tuitionCode: seat.tuitionCode,
    plan: 'pro',
    expiresAt: finalExpiry,
  };
}

export function getMockTuitionStats(code: string, ownerPhone: string, isAdmin = false) {
  const upperCode = (code || '').trim().toUpperCase();
  if (!upperCode) return { ok: false, error: 'code-required' };

  const tuition = store.tuitions.get(upperCode);
  if (!tuition) return { ok: false, error: 'tuition-not-found' };

  const cleanOwner = normalizePhone(ownerPhone) || ownerPhone;
  const tuitionOwner = normalizePhone(tuition.ownerPhone) || tuition.ownerPhone;

  // GUARD RAIL: Enforce owner phone verification or admin credentials (NEVER cross-tuition data)
  if (!isAdmin && (!cleanOwner || cleanOwner !== tuitionOwner)) {
    return { ok: false, error: 'unauthorized-cross-tuition-denied' };
  }

  const seatsForTuition = Array.from(store.seats.values()).filter((s) => s.tuitionCode === upperCode);
  const seatsClaimed = seatsForTuition.filter((s) => Boolean(s.phone)).length;
  const seatsTotal = Math.max(tuition.seatsTotal, seatsForTuition.length);

  // Enrolled students
  const enrolledPhones = Array.from(store.studentTuitions.entries())
    .filter(([_, tCode]) => tCode === upperCode)
    .map(([p]) => p);

  // Include any student who claimed a seat
  seatsForTuition.forEach((s) => {
    if (s.phone && !enrolledPhones.includes(s.phone)) {
      enrolledPhones.push(s.phone);
    }
  });

  const students = enrolledPhones.map((p) => {
    const u = store.users.get(p);
    const masked = p.length >= 10 ? 'xxxxx' + p.slice(-4) : 'xxxxx';
    return {
      name: u?.name || 'Student',
      phone: masked,
      standard: u?.standard || '10th',
      medium: u?.medium || 'english',
      plan: u?.plan || 'pro',
      testsCount: 14,
      avgScore: 86,
      lastActive: '2026-10-04',
    };
  });

  // Weekly activity
  const weeklyActivity = [
    { day: 'Mon', testsTaken: 12, avgScore: 84 },
    { day: 'Tue', testsTaken: 19, avgScore: 88 },
    { day: 'Wed', testsTaken: 15, avgScore: 82 },
    { day: 'Thu', testsTaken: 22, avgScore: 90 },
    { day: 'Fri', testsTaken: 25, avgScore: 87 },
    { day: 'Sat', testsTaken: 31, avgScore: 89 },
    { day: 'Sun', testsTaken: 28, avgScore: 91 },
  ];

  // Payout statement (Model A coupon commissions)
  const rate = tuition.commissionPercent || 15;
  const paidOrdersCount = 8;
  const totalAmount = paidOrdersCount * 599;
  const totalCommission = Math.round(totalAmount * (rate / 100));

  const payoutStatement = {
    code: upperCode,
    commissionPercent: rate,
    ownerUpi: tuition.ownerUpi || '—',
    totalAttributedOrders: paidOrdersCount,
    totalGrossRevenue: totalAmount,
    totalCommissionDue: totalCommission,
    status: 'pending_monthly_settlement',
    cycle: '2026-10',
  };

  return {
    ok: true,
    stats: {
      tuition: {
        code: tuition.code,
        tuitionName: tuition.tuitionName,
        ownerName: tuition.ownerName,
        ownerPhone: tuition.ownerPhone,
        ownerUpi: tuition.ownerUpi || '—',
        district: tuition.district || '—',
        mode: tuition.mode,
        discountPercent: tuition.discountPercent,
        commissionPercent: tuition.commissionPercent,
        seatsTotal: seatsTotal,
        active: tuition.active,
      },
      seatsTotal,
      seatsClaimed,
      activeStudentsCount: students.length,
      students,
      weeklyActivity,
      payoutStatement,
    },
  };
}

export function listMockTuitions(isAdmin = false) {
  if (!isAdmin) return [];
  return Array.from(store.tuitions.values()).map((t) => {
    const seats = Array.from(store.seats.values()).filter((s) => s.tuitionCode === t.code);
    const seatsClaimed = seats.filter((s) => Boolean(s.phone)).length;
    const studentsCount = Array.from(store.studentTuitions.values()).filter((code) => code === t.code).length;

    return {
      code: t.code,
      tuitionName: t.tuitionName,
      ownerName: t.ownerName,
      ownerPhone: t.ownerPhone,
      ownerUpi: t.ownerUpi || '',
      district: t.district || '',
      mode: t.mode,
      discountPercent: t.discountPercent,
      commissionPercent: t.commissionPercent,
      seatsTotal: Math.max(t.seatsTotal, seats.length),
      seatsClaimed,
      studentsCount: Math.max(studentsCount, seatsClaimed),
      active: t.active,
      createdAt: t.createdAt,
    };
  });
}

export function addMockTuition(data: Partial<MockTuition>) {
  const code = (data.code || `TC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`).trim().toUpperCase();
  const cleanPhone = normalizePhone(data.ownerPhone || '') || data.ownerPhone || '';

  const tuition: MockTuition = {
    code,
    ownerName: data.ownerName || 'Tuition Owner',
    ownerPhone: cleanPhone,
    ownerUpi: data.ownerUpi || '',
    tuitionName: data.tuitionName || 'Tuition Centre',
    district: data.district || '',
    mode: (data.mode as 'coupon' | 'seats') || 'coupon',
    discountPercent: Number(data.discountPercent) || 10,
    commissionPercent: Number(data.commissionPercent) || 15,
    seatsTotal: Number(data.seatsTotal) || 0,
    active: data.active !== false,
    createdAt: new Date().toISOString(),
  };

  store.tuitions.set(code, tuition);

  // If seatsTotal > 0, generate initial seats
  if (tuition.seatsTotal > 0) {
    generateMockSeats(code, tuition.seatsTotal);
  }

  return { ok: true, tuition };
}

export function generateMockSeats(tuitionCode: string, count: number) {
  const upper = (tuitionCode || '').trim().toUpperCase();
  const tuition = store.tuitions.get(upper);
  if (!tuition) return { ok: false, error: 'tuition-not-found' };

  const existingSeats = Array.from(store.seats.values()).filter((s) => s.tuitionCode === upper);
  const startNum = existingSeats.length + 1;
  const newSeats: MockSeat[] = [];

  for (let i = 0; i < count; i++) {
    const num = String(startNum + i).padStart(2, '0');
    const seatCode = `${upper}-S${num}`;
    const seat: MockSeat = {
      seatCode,
      tuitionCode: upper,
      phone: null,
      claimedAt: null,
      expiresAt: null,
    };
    store.seats.set(seatCode, seat);
    newSeats.push(seat);
  }

  tuition.seatsTotal = existingSeats.length + count;

  return { ok: true, seats: newSeats, seatsTotal: tuition.seatsTotal };
}

export function getMockFounderStats() {
  const usersList = Array.from(store.users.values());
  const registeredTotal = Math.max(usersList.length * 156, 1420);
  const registeredToday = 28;
  const registered7d = 194;
  const waOptedIn = Math.round(registeredTotal * 0.83); // 83% opt-in rate
  const active24h = 312;
  const active7d = 845;

  const byClass = [
    { classLevel: '6', registered: 45, active7d: 18 },
    { classLevel: '7', registered: 62, active7d: 29 },
    { classLevel: '8', registered: 98, active7d: 54 },
    { classLevel: '9', registered: 184, active7d: 112 },
    { classLevel: '10', registered: 520, active7d: 348 },
    { classLevel: '11', registered: 196, active7d: 105 },
    { classLevel: '12', registered: 315, active7d: 179 },
  ];

  const topStreaks = [
    { name: 'Karthik Raja', phone: 'xxxxx5352', classLevel: '10th', streakDays: 24 },
    { name: 'Ananya Srinivasan', phone: 'xxxxx3456', classLevel: '12th', streakDays: 21 },
    { name: 'Dinesh Kumar', phone: 'xxxxx8821', classLevel: '10th', streakDays: 18 },
    { name: 'Kavitha R', phone: 'xxxxx6780', classLevel: '10th', streakDays: 16 },
    { name: 'Sanjay V', phone: 'xxxxx1190', classLevel: '11th', streakDays: 14 },
    { name: 'Priya Dharshini', phone: 'xxxxx4423', classLevel: '12th', streakDays: 12 },
    { name: 'Muthu Selvan', phone: 'xxxxx7654', classLevel: '9th', streakDays: 11 },
    { name: 'Deepika M', phone: 'xxxxx9012', classLevel: '10th', streakDays: 10 },
    { name: 'Saravanan T', phone: 'xxxxx3341', classLevel: '8th', streakDays: 9 },
    { name: 'Naveen Prakash', phone: 'xxxxx2289', classLevel: '10th', streakDays: 8 },
  ];

  return {
    ok: true,
    registeredTotal,
    registeredToday,
    registered7d,
    waOptedIn,
    active24h,
    active7d,
    byClass,
    topStreaks,
  };
}

export interface MockProMaterial {
  id: string;
  classLevel: string;
  subject: string;
  chapter: string;
  title: string;
  videoEmbedUrl?: string;
  notesPdfUrl?: string;
  conceptQuizUrl?: string;
  bookbackQuizUrl?: string;
  importantQuestionsUrl?: string;
  status: 'live' | 'draft';
  createdAt: string;
}

const mockProMaterials: MockProMaterial[] = [
  {
    id: 'pm-10-maths-ch1',
    classLevel: '10',
    subject: 'maths',
    chapter: 'Chapter 1: Relations and Functions',
    title: 'Relations and Functions (உறவுகளும் சார்புகளும்)',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    notesPdfUrl: 'https://dge.tn.gov.in/docs/10th_maths_ch1.pdf',
    conceptQuizUrl: '/test-runner?class=10&subject=maths&chapter=Relations%20and%20Functions&type=concept',
    bookbackQuizUrl: '/test-runner?class=10&subject=maths&chapter=Relations%20and%20Functions&type=oneword',
    importantQuestionsUrl: '/test-runner?class=10&subject=maths&chapter=Relations%20and%20Functions&type=important',
    status: 'live',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'pm-10-maths-ch2',
    classLevel: '10',
    subject: 'maths',
    chapter: 'Chapter 2: Numbers and Sequences',
    title: 'Numbers and Sequences (எண்களும் தொடர்வரிசைகளும்)',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    notesPdfUrl: 'https://dge.tn.gov.in/docs/10th_maths_ch2.pdf',
    conceptQuizUrl: '/test-runner?class=10&subject=maths&chapter=Numbers%20and%20Sequences&type=concept',
    bookbackQuizUrl: '/test-runner?class=10&subject=maths&chapter=Numbers%20and%20Sequences&type=oneword',
    importantQuestionsUrl: '/test-runner?class=10&subject=maths&chapter=Numbers%20and%20Sequences&type=important',
    status: 'live',
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'pm-10-maths-ch3',
    classLevel: '10',
    subject: 'maths',
    chapter: 'Chapter 3: Algebra',
    title: 'Algebra (இயற்கணிதம்)',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    notesPdfUrl: 'https://dge.tn.gov.in/docs/10th_maths_ch3.pdf',
    conceptQuizUrl: '/test-runner?class=10&subject=maths&chapter=Algebra&type=concept',
    bookbackQuizUrl: '/test-runner?class=10&subject=maths&chapter=Algebra&type=oneword',
    importantQuestionsUrl: '/test-runner?class=10&subject=maths&chapter=Algebra&type=important',
    status: 'live',
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'pm-10-maths-ch4',
    classLevel: '10',
    subject: 'maths',
    chapter: 'Chapter 4: Geometry',
    title: 'Geometry (வடிவியல்)',
    status: 'draft',
    createdAt: '2026-10-04T10:00:00Z',
  },
];

export function listMockProMaterials(classLevel?: string, subject?: string) {
  const normClass = classLevel ? String(classLevel).replace(/\D/g, '') : '';
  const normSub = subject ? String(subject).trim().toLowerCase() : '';

  return mockProMaterials.filter((m) => {
    if (m.status !== 'live') return false;
    if (normClass && m.classLevel !== normClass) return false;
    if (normSub && !m.subject.toLowerCase().includes(normSub) && !normSub.includes(m.subject.toLowerCase())) return false;
    return true;
  });
}
