'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { normalizePhone } from '@/lib/phone';
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  Receipt,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  KeyRound,
  ArrowRight,
  Sparkles,
  BookOpen,
  Trash2,
  Clock,
  AlertTriangle,
  Send,
  UserCheck,
  UserX,
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Check,
} from 'lucide-react';

interface TuitionStatsData {
  tuition: {
    code: string;
    tuitionName: string;
    ownerName: string;
    ownerPhone: string;
    ownerUpi?: string;
    district?: string;
    mode: string;
    discountPercent: number;
    commissionPercent: number;
    seatsTotal: number;
    active: boolean;
  };
  seatsTotal: number;
  seatsClaimed: number;
  activeStudentsCount: number;
  students: Array<{
    name: string;
    phone: string;
    standard: string;
    medium: string;
    plan: string;
    testsCount?: number;
    avgScore?: number;
    lastActive?: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    testsTaken: number;
    avgScore: number;
  }>;
  payoutStatement: {
    code: string;
    commissionPercent: number;
    ownerUpi: string;
    totalAttributedOrders: number;
    totalGrossRevenue: number;
    totalCommissionDue: number;
    status: string;
    cycle: string;
  };
}

interface DiaryEntry {
  id: string;
  tuitionCode: string;
  date: string;
  tag: 'homework' | 'notice' | 'exam' | string;
  text: string;
  createdAt: string;
}

interface SubjectEntry {
  id: string;
  subject: string;
  topic: string;
}

interface FeeItem {
  id: string;
  phone: string;
  studentName: string;
  standard: string;
  month: string;
  amount: number;
  status: 'paid' | 'pending';
  paymentMode?: 'cash' | 'upi';
  paidAt?: string;
  dueDate?: string;
  note?: string;
}

interface AttendanceStudentRow {
  name: string;
  phone: string;
  standard: string;
  medium: string;
  pct30: number;
  status: 'P' | 'A';
  note?: string;
}

export default function OwnerPortalPage() {
  const { medium, showToast, student } = useApp();
  const isTamil = medium === 'tamil';

  // Auth states
  const [ownerPhone, setOwnerPhone] = useState('');
  const [tuitionCode, setTuitionCode] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp' | 'authenticated'>('credentials');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dashboard data
  const [statsData, setStatsData] = useState<TuitionStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'diary' | 'attendance' | 'fees' | 'activity' | 'payout'>('roster');

  // Diary Tab State
  const [diaryList, setDiaryList] = useState<DiaryEntry[]>([]);
  const [isLoadingDiary, setIsLoadingDiary] = useState(false);
  const [diaryDate, setDiaryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [diaryTag, setDiaryTag] = useState<'homework' | 'notice' | 'exam'>('homework');
  const [diaryText, setDiaryText] = useState('');
  const [diaryHomework, setDiaryHomework] = useState('');
  const [diarySubjects, setDiarySubjects] = useState<SubjectEntry[]>([
    { id: '1', subject: 'Maths', topic: '' },
  ]);
  const [diaryStandardFilter, setDiaryStandardFilter] = useState('all');
  const [diarySelectedPhones, setDiarySelectedPhones] = useState<string[]>([]);
  const [notifyDiaryParents, setNotifyDiaryParents] = useState(true);
  const [isPostingDiary, setIsPostingDiary] = useState(false);
  const [deletingDiaryId, setDeletingDiaryId] = useState<string | null>(null);

  // Attendance Tab State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRoster, setAttendanceRoster] = useState<AttendanceStudentRow[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [notifyAttendanceParents, setNotifyAttendanceParents] = useState(true);

  // Fees Tab State
  const [feesList, setFeesList] = useState<FeeItem[]>([]);
  const [feeSummary, setFeeSummary] = useState({
    totalStudents: 0,
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [feeMonth, setFeeMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [feeStandardFilter, setFeeStandardFilter] = useState('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const [sendingReminderPhone, setSendingReminderPhone] = useState<string | null>(null);
  const [sendingReceiptPhone, setSendingReceiptPhone] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [markPaidMode, setMarkPaidMode] = useState<'cash' | 'upi'>('cash');
  const [markPaidNote, setMarkPaidNote] = useState('');

  // Load saved session or auto-prefill demo owner (TASK 9)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('centum_owner_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ownerPhone && parsed.tuitionCode) {
          setOwnerPhone(parsed.ownerPhone);
          setTuitionCode(parsed.tuitionCode);
          setStep('authenticated');
          fetchTuitionStats(parsed.tuitionCode, parsed.ownerPhone);
          fetchDiary(parsed.tuitionCode, parsed.ownerPhone);
          fetchAttendance(parsed.tuitionCode, parsed.ownerPhone, attendanceDate);
          fetchFees(parsed.tuitionCode, parsed.ownerPhone, feeMonth);
          return;
        }
      }

      // Check if logged in user is tuition owner (7200200088, 6380444830, or demo)
      const studentPhone10 = student?.phone?.replace(/\D/g, '').slice(-10);
      if (studentPhone10 === '7200200088' || studentPhone10 === '6380444830' || studentPhone10 === '9840123456') {
        setOwnerPhone(studentPhone10);
        setTuitionCode(studentPhone10 === '7200200088' ? 'CENTUM10' : 'DEMO10');
      }
    } catch (e) {}
  }, [student?.phone]);

  const fetchTuitionStats = async (code: string, phone: string) => {
    setIsLoadingStats(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/tuition-stats?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.stats) {
        setStatsData(data.stats);
      } else {
        setErrorMsg(
          data.error === 'unauthorized-cross-tuition-denied'
            ? (isTamil ? 'அங்கீகாரமற்ற அணுகல் — இந்த மையம் உங்கள் தொலைபேசி எண்ணுடன் பொருந்தவில்லை.' : 'Unauthorized: This tuition centre is not linked to your mobile number.')
            : (data.error || 'Failed to fetch tuition stats')
        );
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'புள்ளிவிவரங்களைப் பெறுவதில் பிழை ஏற்பட்டது' : 'Network error loading tuition stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchDiary = async (code: string, phone: string) => {
    setIsLoadingDiary(true);
    try {
      const res = await fetch(`/api/owner-diary?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.diary) {
        setDiaryList(data.diary);
      }
    } catch (e) {
      console.error('Failed to load owner diary', e);
    } finally {
      setIsLoadingDiary(false);
    }
  };

  const fetchAttendance = async (code: string, phone: string, date: string) => {
    setIsLoadingAttendance(true);
    try {
      const res = await fetch(`/api/owner-attendance?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}&date=${encodeURIComponent(date)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.roster) {
        setAttendanceRoster(data.roster);
      }
    } catch (e) {
      console.error('Failed to load owner attendance', e);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const fetchFees = async (code: string, phone: string, month: string) => {
    setIsLoadingFees(true);
    try {
      const res = await fetch(
        `/api/owner-fees?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}&month=${encodeURIComponent(month)}`
      );
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.fees)) {
        setFeesList(data.fees);
        if (data.summary) setFeeSummary(data.summary);
      }
    } catch (e) {
      console.error('Failed to load owner fees', e);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(ownerPhone);
    const cleanCode = tuitionCode.trim().toUpperCase();

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(isTamil ? 'சரியான 10-இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Enter a valid 10-digit mobile number');
      return;
    }

    if (!cleanCode) {
      setErrorMsg(isTamil ? 'டியூஷன் மைய குறியீட்டை உள்ளிடவும்' : 'Enter your tuition centre code');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/tuition-owner-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: cleanPhone,
          tuitionCode: cleanCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStep('otp');
        showToast(isTamil ? 'சரிபார்ப்பு OTP அனுப்பப்பட்டது 📲' : 'Verification OTP sent 📲');
      } else {
        setErrorMsg(
          data.error === 'not-found'
            ? (isTamil ? 'இந்த குறியீட்டில் டியூஷன் மையம் காணப்படவில்லை' : 'No tuition found with this code')
            : (data.error || 'Failed to send OTP')
        );
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'OTP அனுப்புவதில் பிழை ஏற்பட்டது' : 'Network error sending OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(ownerPhone);
    const cleanCode = tuitionCode.trim().toUpperCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setErrorMsg(isTamil ? 'OTP எண்ணை உள்ளிடவும்' : 'Enter the 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/tuition-owner-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: cleanPhone,
          tuitionCode: cleanCode,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        sessionStorage.setItem(
          'centum_owner_session',
          JSON.stringify({ ownerPhone: cleanPhone, tuitionCode: cleanCode })
        );
        setStep('authenticated');
        showToast(isTamil ? 'உள்நுழைவு வெற்றிகரமாக முடிந்தது! 🎉' : 'Portal unlocked successfully! 🎉');
        fetchTuitionStats(cleanCode, cleanPhone);
        fetchDiary(cleanCode, cleanPhone);
        fetchAttendance(cleanCode, cleanPhone, attendanceDate);
        fetchFees(cleanCode, cleanPhone, feeMonth);
      } else {
        setErrorMsg(data.error || (isTamil ? 'தவறான OTP' : 'Invalid OTP entered'));
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'சரிபார்ப்பதில் பிழை ஏற்பட்டது' : 'Network error verifying OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('centum_owner_session');
    } catch (e) {}
    setStep('credentials');
    setStatsData(null);
    setOtp('');
    showToast(isTamil ? 'வெளியேற்றப்பட்டது' : 'Logged out');
  };

  // Diary Multi-Subject & Selection Handlers
  const handleSelectAllPresentToday = () => {
    const presentPhones = attendanceRoster
      .filter((r) => r.status === 'P')
      .map((r) => r.phone);
    if (presentPhones.length === 0) {
      showToast(isTamil ? 'இன்றைய வருகைப்பதிவில் யாரும் வரவில்லை (P) என குறிக்கப்படவில்லை' : 'No students marked Present (P) for selected date');
      return;
    }
    setDiarySelectedPhones(presentPhones);
    showToast(isTamil ? `${presentPhones.length} வருகை தந்த மாணவர்கள் தேர்ந்தெடுக்கப்பட்டனர் ✅` : `Selected ${presentPhones.length} present students ✅`);
  };

  const handleToggleSelectStudent = (phone: string) => {
    setDiarySelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const handleSelectAllFilteredStudents = (studentsList: Array<{ phone: string }>) => {
    const allPhones = studentsList.map((s) => s.phone);
    setDiarySelectedPhones(allPhones);
  };

  const handleDeselectAllStudents = () => {
    setDiarySelectedPhones([]);
  };

  const handleAddSubjectRow = () => {
    if (diarySubjects.length >= 6) {
      showToast(isTamil ? 'அதிகபட்சம் 6 பாடங்கள் மட்டுமே சேர்க்கலாம்' : 'Max 6 subjects per entry');
      return;
    }
    const defaultSubs = ['Science', 'Social', 'English', 'Tamil', 'Physics', 'Chemistry'];
    const nextSub = defaultSubs[diarySubjects.length - 1] || 'Subject';
    setDiarySubjects((prev) => [
      ...prev,
      { id: String(Date.now()), subject: nextSub, topic: '' },
    ]);
  };

  const handleRemoveSubjectRow = (id: string) => {
    if (diarySubjects.length <= 1) return;
    setDiarySubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubjectChange = (id: string, field: 'subject' | 'topic', value: string) => {
    setDiarySubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handlePostDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostingDiary) return;

    const validSubjects = diarySubjects.filter((s) => s.topic.trim().length > 0);
    if (validSubjects.length === 0 && !diaryText.trim()) {
      showToast(isTamil ? 'குறைந்தது ஒரு பாடத்தின் விவரத்தை உள்ளிடவும்' : 'Enter what was studied for at least one subject');
      return;
    }

    if (notifyDiaryParents && diarySelectedPhones.length === 0) {
      if (
        !window.confirm(
          isTamil
            ? 'எந்த மாணவரும் தேர்ந்தெடுக்கப்படவில்லை. வாட்ஸ்அப் செய்தி யாருக்கும் செல்லாது. தொடரவா?'
            : 'No students selected to receive WhatsApp updates. Continue publishing diary to classroom?'
        )
      ) {
        return;
      }
    }

    setIsPostingDiary(true);
    try {
      const res = await fetch('/api/owner-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ownerDiarySave',
          code: tuitionCode,
          ownerPhone,
          date: diaryDate,
          tag: diaryTag,
          subjects: validSubjects,
          homework: diaryHomework.trim(),
          text: diaryText.trim() || undefined,
          targetPhones: diarySelectedPhones,
          notifyParents: notifyDiaryParents,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setDiaryText('');
        setDiaryHomework('');
        setDiarySubjects([{ id: '1', subject: 'Maths', topic: '' }]);
        showToast(
          notifyDiaryParents && diarySelectedPhones.length > 0
            ? isTamil
              ? `நாள்குறிப்பு சேர்க்கப்பட்டது & பெற்றோர்களுக்கு அனுப்பப்பட்டது (${diarySelectedPhones.length}) 📲`
              : `Diary saved & sent to ${diarySelectedPhones.length} parents via WhatsApp 📲`
            : isTamil
            ? 'நாள்குறிப்பு பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது! 📝'
            : 'Diary entry published! 📝'
        );
        fetchDiary(tuitionCode, ownerPhone);
      } else {
        showToast(data.error || 'Failed to post diary entry');
      }
    } catch (e) {
      showToast('Error posting diary');
    } finally {
      setIsPostingDiary(false);
    }
  };

  const handleDeleteDiary = async (id: string) => {
    if (!window.confirm(isTamil ? 'இந்த நாள்குறிப்பு பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this diary entry?')) {
      return;
    }

    setDeletingDiaryId(id);
    try {
      const res = await fetch('/api/owner-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ownerDiaryDelete',
          code: tuitionCode,
          ownerPhone,
          id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isTamil ? 'பதிவு நீக்கப்பட்டது 🗑️' : 'Diary entry deleted 🗑️');
        setDiaryList((prev) => prev.filter((item) => item.id !== id));
      } else {
        showToast(data.error || 'Failed to delete');
      }
    } catch (e) {
      showToast('Error deleting diary');
    } finally {
      setDeletingDiaryId(null);
    }
  };

  // Attendance Handlers
  const handleDateChange = (newDate: string) => {
    setAttendanceDate(newDate);
    fetchAttendance(tuitionCode, ownerPhone, newDate);
  };

  const handleStatusToggle = (phone: string, nextStatus: 'P' | 'A') => {
    setAttendanceRoster((prev) =>
      prev.map((row) => (row.phone === phone ? { ...row, status: nextStatus } : row))
    );
  };

  const handleSaveAttendance = async () => {
    if (isSavingAttendance) return;
    setIsSavingAttendance(true);

    try {
      const records = attendanceRoster.map((r) => ({
        phone: r.phone,
        status: r.status,
        note: '',
      }));

      const res = await fetch('/api/owner-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ownerAttendanceSave',
          code: tuitionCode,
          ownerPhone,
          date: attendanceDate,
          records,
          notifyParents: notifyAttendanceParents,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        const pCount = records.filter((r) => r.status === 'P').length;
        const aCount = records.filter((r) => r.status === 'A').length;
        showToast(
          notifyAttendanceParents
            ? isTamil
              ? `வருகைப்பதிவு சேமிக்கப்பட்டது! பெற்றோர்களுக்கு வாட்ஸ்அப் அனுப்பப்பட்டது 📲 (P: ${pCount}, A: ${aCount})`
              : `Attendance saved & WhatsApp sent to parents! 📲 (P: ${pCount}, A: ${aCount})`
            : isTamil
            ? `வருகைப்பதிவு சேமிக்கப்பட்டது! (P: ${pCount}, A: ${aCount}) 💾`
            : `Attendance saved for ${attendanceDate}! (P: ${pCount}, A: ${aCount}) 💾`
        );
        fetchAttendance(tuitionCode, ownerPhone, attendanceDate);
      } else {
        showToast(data.error || 'Failed to save attendance');
      }
    } catch (e) {
      showToast('Error saving attendance');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Fee Handlers
  const handleMarkFeePaid = async (feeId: string, mode: 'cash' | 'upi', note?: string) => {
    setIsUpdatingFee(true);
    try {
      const res = await fetch('/api/owner-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveFeeStatus',
          code: tuitionCode,
          ownerPhone,
          id: feeId,
          status: 'paid',
          paymentMode: mode,
          note: note || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isTamil ? 'கட்டணம் பெறப்பட்டதாக குறிக்கப்பட்டது! 💰' : 'Fee marked as paid! 💰');
        setMarkingPaidId(null);
        setMarkPaidNote('');
        fetchFees(tuitionCode, ownerPhone, feeMonth);
      } else {
        showToast(data.error || 'Failed to update fee');
      }
    } catch (e) {
      showToast('Error updating fee');
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handleRevertFeePending = async (feeId: string) => {
    if (!window.confirm(isTamil ? 'இந்த கட்டண நிலையை நிலுவையாக மாற்றவா?' : 'Revert this fee back to pending?')) return;
    setIsUpdatingFee(true);
    try {
      const res = await fetch('/api/owner-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveFeeStatus',
          code: tuitionCode,
          ownerPhone,
          id: feeId,
          status: 'pending',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isTamil ? 'கட்டணம் நிலுவை என மாற்றப்பட்டது' : 'Fee reverted to pending');
        fetchFees(tuitionCode, ownerPhone, feeMonth);
      }
    } catch (e) {
      showToast('Error updating fee');
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handleSendFeeReminder = async (item: FeeItem) => {
    setSendingReminderPhone(item.phone);
    try {
      const res = await fetch('/api/owner-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendReminder',
          code: tuitionCode,
          ownerPhone,
          phone: item.phone,
          studentName: item.studentName,
          amount: item.amount,
          month: item.month,
          dueDate: item.dueDate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isTamil ? `${item.studentName} பெற்றோருக்கு நினைவூட்டல் அனுப்பப்பட்டது! 📲` : `Reminder sent to parent of ${item.studentName}! 📲`);
      } else {
        showToast('Failed to send reminder');
      }
    } catch (e) {
      showToast('Network error sending reminder');
    } finally {
      setSendingReminderPhone(null);
    }
  };

  const handleSendFeeReceipt = async (item: FeeItem) => {
    setSendingReceiptPhone(item.phone);
    try {
      const res = await fetch('/api/owner-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendReceipt',
          code: tuitionCode,
          ownerPhone,
          phone: item.phone,
          studentName: item.studentName,
          amount: item.amount,
          month: item.month,
          paymentMode: item.paymentMode || 'cash',
          date: item.paidAt ? item.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isTamil ? `${item.studentName} பெற்றோருக்கு ரசீது அனுப்பப்பட்டது! 🧾` : `Receipt sent to parent of ${item.studentName}! 🧾`);
      } else {
        showToast('Failed to send receipt');
      }
    } catch (e) {
      showToast('Network error sending receipt');
    } finally {
      setSendingReceiptPhone(null);
    }
  };

  // 1. AUTH / LOGIN VIEW
  if (step !== 'authenticated') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
        <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 sm:p-8 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A3E635] text-white shadow-md">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'டியூஷன் உரிமையாளர் தளம்' : 'Tuition Owner Portal'}
            </h1>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TASK 9: 1-Tap Demo Owner Showroom Button */}
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Showroom Demo · Apex Centum
              </span>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                Pre-fill DEMO10 (Owner: Ramesh Kumar)
              </p>
            </div>
            <button
              type="button"
              data-testid="demo-owner-prefill-btn"
              onClick={() => {
                setTuitionCode('DEMO10');
                setOwnerPhone('7200200088');
                showToast('DEMO10 auto-prefilled ✨');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shrink-0 transition-all shadow-xs cursor-pointer"
            >
              One-Tap Fill ⚡
            </button>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isTamil ? 'டியூஷன் மைய குறியீடு' : 'Tuition Centre Code'}
                </label>
                <input
                  type="text"
                  required
                  value={tuitionCode}
                  onChange={(e) => setTuitionCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX10"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isTamil ? 'பதிவுசெய்த மொபைல் எண்' : 'Registered Owner Mobile Number'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-black text-sm shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer"
              >
                {isSendingOtp ? (
                  <span>{isTamil ? 'OTP அனுப்பப்படுகிறது...' : 'Sending OTP...'}</span>
                ) : (
                  <>
                    <span>{isTamil ? 'OTP பெறுக' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#3B2063] text-xs text-gray-600 dark:text-gray-300">
                <span>{isTamil ? 'OTP அனுப்பப்பட்ட எண்: ' : 'Enter OTP sent to: '}</span>
                <span className="font-bold text-[#7C3AED] dark:text-[#A3E635]">+91 {ownerPhone}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 text-center">
                  {isTamil ? '6-இலக்க OTP' : '6-Digit OTP'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full min-h-[52px] text-center text-2xl font-black tracking-[0.5em] rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] text-[#18181B] font-black text-sm shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <span>{isTamil ? 'சரிபார்க்கிறது...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{isTamil ? 'போர்ட்டலில் உள்நுழைக 🔑' : 'Verify & Open Portal 🔑'}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] underline cursor-pointer"
                >
                  {isTamil ? 'தொலைபேசி எண் மாற்று' : 'Change Phone Number'}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:underline">
              {isTamil ? '← மாணவர் முகப்புக்குத் திரும்ப' : '← Return to Student App'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW
  const tuition = statsData?.tuition;
  const seatsTotal = statsData?.seatsTotal ?? 0;
  const seatsClaimed = statsData?.seatsClaimed ?? 0;
  const claimedPercent = seatsTotal > 0 ? Math.round((seatsClaimed / seatsTotal) * 100) : 0;

  const presentCount = attendanceRoster.filter((r) => r.status === 'P').length;
  const absentCount = attendanceRoster.filter((r) => r.status === 'A').length;
  const absentStudents = attendanceRoster.filter((r) => r.status === 'A');

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24 max-w-4xl mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A3E635] flex items-center justify-center text-white font-black text-xl shadow-md">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {tuition?.tuitionName || 'Tuition Centre'}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A3E635] font-black text-xs uppercase tracking-wider">
                {tuition?.code}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {tuition?.ownerName} • {tuition?.district} • {isTamil ? 'பயன்முறை: ' : 'Mode: '}
              <span className="font-bold uppercase text-[#7C3AED] dark:text-[#A3E635]">{tuition?.mode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isTamil ? 'செயலில் உள்ளது' : 'Active Centre'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2A1247] hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isTamil ? 'வெளியேறு' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {isLoadingStats && (
        <div className="p-8 text-center text-xs font-bold text-gray-400 animate-pulse">
          {isTamil ? 'புள்ளிவிவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading classroom analytics...'}
        </div>
      )}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Seats Claimed */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'இருக்கைகள்' : 'Seats Claimed'}</span>
            <Users className="w-4 h-4 text-[#7C3AED] dark:text-[#A3E635]" />
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
            {seatsClaimed} <span className="text-xs font-bold text-gray-400">/ {seatsTotal}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-[#2A1247] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A3E635]"
              style={{ width: `${Math.min(100, claimedPercent)}%` }}
            />
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'மாணவர்கள்' : 'Enrolled Students'}</span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
            {statsData?.activeStudentsCount ?? 0}
          </div>
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {isTamil ? 'இணைக்கப்பட்ட மாணவர்கள்' : 'Classroom members'}
          </p>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'வகுப்பு சராசரி' : 'Class Average'}</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
            86%
          </div>
          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
            {isTamil ? 'தேர்வு முடிவுகள்' : 'Consistent performance'}
          </p>
        </div>

        {/* Commission Due */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'கமிஷன் தொகை' : 'Commission Due'}</span>
            <Receipt className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{statsData?.payoutStatement?.totalCommissionDue ?? 0}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 mt-1">
            @{tuition?.commissionPercent}% rate • {statsData?.payoutStatement?.totalAttributedOrders ?? 0} orders
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'மாணவர் பட்டியல்' : 'Roster'} ({statsData?.students?.length ?? 0})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('diary');
            fetchDiary(tuitionCode, ownerPhone);
          }}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'diary'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          📝 {isTamil ? 'நாள்குறிப்பு' : 'Diary'}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('attendance');
            fetchAttendance(tuitionCode, ownerPhone, attendanceDate);
          }}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          📅 {isTamil ? 'வருகைப்பதிவு' : 'Attendance'}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('fees');
            fetchFees(tuitionCode, ownerPhone, feeMonth);
          }}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'fees'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          💳 {isTamil ? 'கட்டணங்கள்' : 'Fees'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'வாரச் செயல்பாடு' : 'Activity'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payout')}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'payout'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'கமிஷன்' : 'Payout'}
        </button>
      </div>

      {/* TAB 1: STUDENT ROSTER */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'மாணவர் பட்டியல்' : 'Student Roster'}
            </h2>
          </div>

          {statsData?.students && statsData.students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDE9FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#0F0618] text-gray-500 dark:text-gray-400">
                    <th className="p-3 font-extrabold">{isTamil ? 'மாணவர் பெயர்' : 'Student Name'}</th>
                    <th className="p-3 font-extrabold">{isTamil ? 'வகுப்பு' : 'Standard'}</th>
                    <th className="p-3 font-extrabold">{isTamil ? 'தொலைபேசி' : 'Phone'}</th>
                    <th className="p-3 text-center font-extrabold">{isTamil ? 'சராசரி' : 'Avg Score'}</th>
                    <th className="p-3 text-center font-extrabold">{isTamil ? 'திட்டம்' : 'Plan'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE9FE] dark:divide-[#3B2063]">
                  {statsData.students.map((stud, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-[#2A1247]/30 transition-colors">
                      <td className="p-3 font-bold text-[#2E1065] dark:text-[#FAF5FF]">
                        {stud.name}
                      </td>
                      <td className="p-3 font-semibold text-gray-500 dark:text-gray-400">
                        {stud.standard} • {stud.medium}
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-300">
                        {stud.phone}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-extrabold">
                          {stud.avgScore ?? 86}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black uppercase text-[10px]">
                          {stud.plan || 'pro'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 font-semibold">
              {isTamil ? 'இன்னும் மாணவர்கள் இணையவில்லை. இருக்கை குறியீடுகளை வழங்கவும்!' : 'No students enrolled yet. Share your seat codes or centre code with students!'}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIARY (MULTI-SUBJECT COMPOSER + TARGETED DISPATCH + ENTRIES) */}
      {activeTab === 'diary' && (() => {
        // Build list of students from attendanceRoster or statsData.students
        const rosterList = attendanceRoster.length > 0
          ? attendanceRoster
          : (statsData?.students || []).map((s) => ({
              phone: s.phone,
              name: s.name,
              standard: s.standard,
              medium: s.medium,
              status: 'P' as const,
              pct30: s.avgScore || 85,
            }));

        const filteredStudents = rosterList.filter((s) => {
          if (diaryStandardFilter === 'all') return true;
          return String(s.standard).toLowerCase().includes(diaryStandardFilter.toLowerCase());
        });

        const presentStudents = rosterList.filter((s) => s.status === 'P');

        return (
          <div className="space-y-6">
            {/* Composer Card */}
            <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#7C3AED] dark:text-[#A3E635]" />
                  <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
                    {isTamil ? 'வகுப்பறை நாள்குறிப்பு & பாட விவரம்' : 'Classroom Diary & Study Log'}
                  </h2>
                </div>
              </div>

              <form onSubmit={handlePostDiary} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                      {isTamil ? 'தேதி' : 'Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={diaryDate}
                      onChange={(e) => setDiaryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  {/* Tag Select */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                      {isTamil ? 'வகை (Tag)' : 'Category Tag'}
                    </label>
                    <select
                      value={diaryTag}
                      onChange={(e) => setDiaryTag(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    >
                      <option value="homework">📝 {isTamil ? 'வீட்டுப்பாடம் (Homework)' : 'Homework'}</option>
                      <option value="notice">📢 {isTamil ? 'அறிவிப்பு (Notice)' : 'Notice'}</option>
                      <option value="exam">🧪 {isTamil ? 'தேர்வுத் திட்டம் (Exam)' : 'Exam'}</option>
                    </select>
                  </div>
                </div>

                {/* STUDENT RECIPIENTS SECTION (Filter by Standard + Present Today Selection) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5FF] to-white dark:from-[#230542]/60 dark:to-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
                        {isTamil ? 'மாணவர்களைத் தேர்ந்தெடுங்கள்' : 'Select Target Students (Recipients)'}
                      </span>
                    </div>

                    {/* Standard Filter Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-400">{isTamil ? 'வகுப்பு:' : 'Standard:'}</span>
                      <select
                        value={diaryStandardFilter}
                        onChange={(e) => setDiaryStandardFilter(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[#DDD6FE] dark:border-[#3B2063] bg-white dark:bg-[#230542] text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF]"
                      >
                        <option value="all">{isTamil ? 'அனைத்து வகுப்புகளும்' : 'All Standards'}</option>
                        <option value="10">10th Standard</option>
                        <option value="11">11th Standard</option>
                        <option value="12">12th Standard</option>
                      </select>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPresentToday}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isTamil ? `இன்று வந்தவர்கள் மட்டும் (${presentStudents.length})` : `Select All Present Today (${presentStudents.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAllFilteredStudents(filteredStudents)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2A1247] hover:bg-gray-200 dark:hover:bg-[#3B2063] text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isTamil ? `அனைவரையும் தேர்ந்தெடு (${filteredStudents.length})` : `Select All (${filteredStudents.length})`}
                    </button>

                    {diarySelectedPhones.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeselectAllStudents}
                        className="px-2.5 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isTamil ? 'தேர்வை நீக்கு' : 'Clear All'}
                      </button>
                    )}

                    <span className="ml-auto text-xs font-bold text-[#7C3AED] dark:text-[#A3E635]">
                      {diarySelectedPhones.length} {isTamil ? 'மாணவர்கள் தேர்வு' : 'selected'}
                    </span>
                  </div>

                  {/* Student Checkbox Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {filteredStudents.map((st) => {
                      const isSelected = diarySelectedPhones.includes(st.phone);
                      const isPresent = st.status === 'P';

                      return (
                        <div
                          key={st.phone}
                          onClick={() => handleToggleSelectStudent(st.phone)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 border-[#7C3AED] dark:border-[#A3E635]'
                              : 'bg-white dark:bg-[#1B0B2E] border-gray-200 dark:border-gray-800 hover:border-[#DDD6FE]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                            <div className="truncate">
                              <p className="font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">{st.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{st.standard} • {st.phone}</p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MULTI-SUBJECT PORTIONS LOG */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
                      {isTamil ? 'இன்று நடத்தப்பட்ட பாடங்கள் & பகுதிகள்' : 'Subjects & Portions Studied Today'}
                    </label>
                    <span className="text-[11px] font-bold text-gray-400">
                      {diarySubjects.length} {isTamil ? 'பாடங்கள்' : 'subject(s)'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {diarySubjects.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-[#230542]/60 border border-gray-200 dark:border-[#3B2063] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-[#7C3AED] dark:text-[#A3E635]">
                            {isTamil ? `பாடம் #${idx + 1}` : `Subject #${idx + 1}`}
                          </span>
                          {diarySubjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectRow(sub.id)}
                              className="text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                            >
                              {isTamil ? 'நீக்கு' : 'Remove'}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            value={sub.subject}
                            onChange={(e) => handleSubjectChange(sub.id, 'subject', e.target.value)}
                            className="px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-white dark:bg-[#1B0B2E] text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                          >
                            <option value="Maths">Maths / கணிதம்</option>
                            <option value="Science">Science / அறிவியல்</option>
                            <option value="Social">Social / சமூக அறிவியல்</option>
                            <option value="English">English / ஆங்கிலம்</option>
                            <option value="Tamil">Tamil / தமிழ்</option>
                            <option value="Physics">Physics / இயற்பியல்</option>
                            <option value="Chemistry">Chemistry / வேதியியல்</option>
                            <option value="Biology">Biology / உயிரியல்</option>
                            <option value="Computer Science">Computer Science</option>
                          </select>

                          <input
                            type="text"
                            required
                            placeholder={
                              isTamil
                                ? 'இன்று கற்ற பகுதிகள் (எ.கா: இயல் 3 பயிற்சி 3.1 & 3.2 வினாக்கள்)'
                                : 'Portions studied (e.g. Chapter 3 Quadratic Eq Ex 3.1 & 3.2)'
                            }
                            value={sub.topic}
                            onChange={(e) => handleSubjectChange(sub.id, 'topic', e.target.value)}
                            className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-white dark:bg-[#1B0B2E] text-xs text-[#2E1065] dark:text-[#FAF5FF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Another Subject Button */}
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#7C3AED]/40 hover:border-[#7C3AED] text-[#7C3AED] dark:text-[#A3E635] text-xs font-black flex items-center justify-center gap-2 hover:bg-[#FAF5FF] dark:hover:bg-[#230542]/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isTamil ? '+ மேலும் ஒரு பாடம் சேர்க்க (Add Subject)' : '+ Add Another Subject'}</span>
                  </button>
                </div>

                {/* Optional Homework / Notice Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    {isTamil ? 'வீட்டுப்பாடம் / குறிப்பு (விருப்பத்தேர்வு)' : 'Homework / Instructions (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={diaryHomework}
                    onChange={(e) => setDiaryHomework(e.target.value)}
                    placeholder={
                      isTamil
                        ? 'எ.கா: பயிற்சி 3.3 வினாக்கள் 1-5 மற்றும் நாளை சிறுதேர்வு'
                        : 'e.g. Solve Ex 3.3 Q1-5 and prepare for test tomorrow'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-medium text-[#2E1065] dark:text-[#FAF5FF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>

                {/* WhatsApp Notification Toggle */}
                <label className="flex items-center gap-2.5 text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF] cursor-pointer p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                  <input
                    type="checkbox"
                    checked={notifyDiaryParents}
                    onChange={(e) => setNotifyDiaryParents(e.target.checked)}
                    className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <span>
                    {isTamil
                      ? '📲 தேர்ந்தெடுக்கப்பட்ட மாணவர்களின் பெற்றோர்களுக்கு வாட்ஸ்அப் செய்தி அனுப்புக'
                      : '📲 Send Study Log via WhatsApp to Parents of Selected Students'}
                  </span>
                </label>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPostingDiary}
                    className="px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-[#7C3AED]/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isPostingDiary
                        ? (isTamil ? 'அனுப்பப்படுகிறது...' : 'Sending...')
                        : (isTamil ? 'பதிவு செய்து பெற்றோர்களுக்கு அனுப்பு 📲' : 'Save & Send to Parents 📲')}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Published Diary Entries */}
            <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
                  {isTamil ? 'வெளியிடப்பட்ட நாள்குறிப்பு பதிவுகள்' : 'Published Diary Entries'}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2A1247] text-gray-500">
                  {diaryList.length} {isTamil ? 'பதிவுகள்' : 'entries'}
                </span>
              </div>

              {isLoadingDiary ? (
                <div className="py-8 text-center text-xs text-gray-400 font-bold animate-pulse">
                  {isTamil ? 'நாள்குறிப்பு ஏற்றப்படுகிறது...' : 'Loading diary entries...'}
                </div>
              ) : diaryList.length > 0 ? (
                <div className="space-y-3">
                  {diaryList.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-[#230542]/40 border border-gray-100 dark:border-[#3B2063] flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          {entry.tag === 'homework' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              📝 {isTamil ? 'வீட்டுப்பாடம்' : 'Homework'}
                            </span>
                          )}
                          {entry.tag === 'notice' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              📢 {isTamil ? 'அறிவிப்பு' : 'Notice'}
                            </span>
                          )}
                          {entry.tag === 'exam' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🧪 {isTamil ? 'தேர்வு' : 'Exam'}
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-gray-500">
                            {entry.date}
                          </span>
                        </div>
                        <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed font-medium">
                          {entry.text}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={deletingDiaryId === entry.id}
                        onClick={() => handleDeleteDiary(entry.id)}
                        className="self-end sm:self-center p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title={isTamil ? 'நீக்கு' : 'Delete Entry'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-gray-400 font-semibold">
                  {isTamil ? 'இன்னும் நாள்குறிப்பு பதிவுகள் இல்லை. மேலே உள்ள படிவத்தைப் பயன்படுத்தி முதல் பதிவைச் சேர்க்கவும்!' : 'No diary entries yet. Use the composer above to post your first classroom note!'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: ATTENDANCE (ROSTER TOGGLE + SUMMARY + SAVE) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {isTamil ? 'வருகைப்பதிவு தேதி' : 'Attendance Date'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2A1247] hover:bg-gray-200 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    {isTamil ? 'இன்று' : 'Today'}
                  </button>
                </div>
              </div>

            {/* Summary Chip */}
            <div className="self-end pb-0.5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#3B2063] text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF]">
                <span className="text-emerald-600 dark:text-emerald-400">P: {presentCount}</span>
                <span className="text-gray-300">/</span>
                <span className="text-rose-600 dark:text-rose-400">A: {absentCount}</span>
                <span className="text-gray-400 font-normal">({attendanceRoster.length} total)</span>
              </span>
            </div>
          </div>

          {/* Action Row: WhatsApp notification toggle + Save Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#EDE9FE] dark:border-[#3B2063]">
            <label className="flex items-center gap-2 text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF] cursor-pointer">
              <input
                type="checkbox"
                checked={notifyAttendanceParents}
                onChange={(e) => setNotifyAttendanceParents(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span>
                {isTamil ? '📲 வருகை சேமிக்கும் போது பெற்றோருக்கு வாட்ஸ்அப் செய்தி அனுப்புக' : '📲 Send WhatsApp update to parents when saving'}
              </span>
            </label>

            {/* Save Button */}
            <button
              type="button"
              disabled={isSavingAttendance || attendanceRoster.length === 0}
              onClick={handleSaveAttendance}
              className="px-6 py-2.5 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] disabled:opacity-50 text-[#18181B] font-black text-xs sm:text-sm shadow-md shadow-[#A3E635]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSavingAttendance
                  ? (isTamil ? 'சேமிக்கப்படுகிறது...' : 'Saving...')
                  : (isTamil ? 'வருகைப்பதிவைச் சேமி 💾' : 'Save Attendance 💾')}
              </span>
            </button>
          </div>
        </div>

        {/* Absent Today Alert List */}
        {absentStudents.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black">
                {isTamil
                  ? `இன்று விடுப்பு எடுத்தவர்கள் (${absentStudents.length})`
                  : `Absent on ${attendanceDate} (${absentStudents.length} students)`}
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {absentStudents.map((st, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-[11px] font-bold"
                  >
                    {st.name} ({st.standard})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs">
          {isLoadingAttendance ? (
            <div className="py-10 text-center text-xs text-gray-400 font-bold animate-pulse">
              {isTamil ? 'வருகைப்பட்டியல் ஏற்றப்படுகிறது...' : 'Loading attendance roster...'}
            </div>
          ) : attendanceRoster.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDE9FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#0F0618] text-gray-500 dark:text-gray-400">
                    <th className="p-3 font-extrabold">{isTamil ? 'மாணவர் பெயர்' : 'Student Name'}</th>
                    <th className="p-3 font-extrabold">{isTamil ? 'வகுப்பு' : 'Standard'}</th>
                    <th className="p-3 font-extrabold">{isTamil ? 'தொலைபேசி' : 'Phone'}</th>
                    <th className="p-3 text-center font-extrabold">{isTamil ? '30-நாள் வருகை %' : '30-Day %'}</th>
                    <th className="p-3 text-center font-extrabold">{isTamil ? 'இன்றைய நிலை' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE9FE] dark:divide-[#3B2063]">
                  {attendanceRoster.map((stud) => (
                    <tr key={stud.phone} className="hover:bg-gray-50/50 dark:hover:bg-[#2A1247]/30 transition-colors">
                      <td className="p-3 font-bold text-[#2E1065] dark:text-[#FAF5FF]">
                        {stud.name}
                      </td>
                      <td className="p-3 font-semibold text-gray-500 dark:text-gray-400">
                        {stud.standard} • {stud.medium}
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-300">
                        {stud.phone}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold ${
                            stud.pct30 >= 80
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : stud.pct30 >= 60
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {stud.pct30}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-[#230542] p-1 border border-gray-200 dark:border-[#3B2063]">
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(stud.phone, 'P')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              stud.status === 'P'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(stud.phone, 'A')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              stud.status === 'A'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-gray-500 dark:text-gray-400 hover:text-rose-600'
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-gray-400 font-semibold">
              {isTamil
                ? 'மாணவர்கள் இன்னும் இணையவில்லை. இருக்கை குறியீடுகள் வழங்கப்பட்டதும் இங்கு வருகைப்பதிவு செய்யலாம்!'
                : 'No claimed students found in this tuition yet. Attendance roster will appear once students claim seats!'}
            </div>
          )}
        </div>
      </div>
    )}

    {/* TAB 4: FEES MANAGEMENT */}
    {activeTab === 'fees' && (
      <div className="space-y-6">
        {/* Header & Month Selector */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#7C3AED] dark:text-[#A3E635]" />
            <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'மாணவர் கட்டண மேலாண்மை' : 'Tuition Fee Management'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400">{isTamil ? 'மாதம்:' : 'Month:'}</span>
              <input
                type="month"
                value={feeMonth}
                onChange={(e) => {
                  setFeeMonth(e.target.value);
                  fetchFees(tuitionCode, ownerPhone, e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchFees(tuitionCode, ownerPhone, feeMonth)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-[#2A1247] hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors"
              title={isTamil ? 'புதுப்பிக்கவும்' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFees ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {isTamil ? 'எதிர்பார்க்கப்படும் கட்டணம்' : 'Total Expected Fees'}
            </span>
            <p className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] mt-1">
              ₹{feeSummary.totalExpected.toLocaleString()}
            </p>
            <span className="text-[11px] text-gray-400 font-semibold mt-0.5 block">
              {feeSummary.totalStudents} {isTamil ? 'மாணவர்கள்' : 'enrolled students'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {isTamil ? 'பெறப்பட்ட கட்டணம்' : 'Total Collected'}
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{feeSummary.totalCollected.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 block">
              {feeSummary.paidCount} {isTamil ? 'மாணவர்கள் செலுத்தியுள்ளனர்' : 'students paid'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-xs">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              {isTamil ? 'நிலுவையில் உள்ள கட்டணம்' : 'Pending Dues'}
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ₹{feeSummary.totalPending.toLocaleString()}
            </p>
            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold mt-0.5 block">
              {feeSummary.pendingCount} {isTamil ? 'மாணவர்கள் நிலுவை' : 'students pending'}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-[#230542] p-1 border border-gray-200 dark:border-[#3B2063]">
              <button
                type="button"
                onClick={() => setFeeStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  feeStatusFilter === 'all'
                    ? 'bg-white dark:bg-[#7C3AED] text-[#2E1065] dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {isTamil ? `அனைத்தும் (${feesList.length})` : `All (${feesList.length})`}
              </button>
              <button
                type="button"
                onClick={() => setFeeStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  feeStatusFilter === 'pending'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-rose-600'
                }`}
              >
                {isTamil ? `நிலுவை (${feeSummary.pendingCount})` : `Pending (${feeSummary.pendingCount})`}
              </button>
              <button
                type="button"
                onClick={() => setFeeStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  feeStatusFilter === 'paid'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                {isTamil ? `பெறப்பட்டது (${feeSummary.paidCount})` : `Paid (${feeSummary.paidCount})`}
              </button>
            </div>

            {/* Standard Filter */}
            <select
              value={feeStandardFilter}
              onChange={(e) => setFeeStandardFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#DDD6FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF]"
            >
              <option value="all">{isTamil ? 'அனைத்து வகுப்புகளும்' : 'All Standards'}</option>
              <option value="10">10th Standard</option>
              <option value="11">11th Standard</option>
              <option value="12">12th Standard</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isTamil ? 'பெயர் அல்லது எண் தேடுக...' : 'Search student or parent phone...'}
              value={feeSearchQuery}
              onChange={(e) => setFeeSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs text-[#2E1065] dark:text-[#FAF5FF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>
        </div>

        {/* Fees Table */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs">
          {isLoadingFees ? (
            <div className="py-10 text-center text-xs text-gray-400 font-bold animate-pulse">
              {isTamil ? 'கட்டண விவரங்கள் ஏற்றப்படுகிறது...' : 'Loading fee records...'}
            </div>
          ) : (() => {
            const displayFees = feesList.filter((item) => {
              if (feeStatusFilter !== 'all' && item.status !== feeStatusFilter) return false;
              if (feeStandardFilter !== 'all' && !String(item.standard).includes(feeStandardFilter)) return false;
              if (feeSearchQuery.trim()) {
                const q = feeSearchQuery.toLowerCase();
                return item.studentName.toLowerCase().includes(q) || item.phone.includes(q);
              }
              return true;
            });

            if (displayFees.length === 0) {
              return (
                <div className="py-10 text-center text-xs text-gray-400 font-semibold">
                  {isTamil ? 'கட்டண பதிவுகள் எதுவும் இல்லை' : 'No fee records found for the selected filter.'}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE9FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#0F0618] text-gray-500 dark:text-gray-400">
                      <th className="p-3 font-extrabold">{isTamil ? 'மாணவர் பெயர்' : 'Student Name'}</th>
                      <th className="p-3 font-extrabold">{isTamil ? 'வகுப்பு' : 'Standard'}</th>
                      <th className="p-3 font-extrabold">{isTamil ? 'பெற்றோர் எண்' : 'Parent Phone'}</th>
                      <th className="p-3 font-extrabold">{isTamil ? 'கட்டணம்' : 'Fee Amount'}</th>
                      <th className="p-3 font-extrabold">{isTamil ? 'கடைசி தேதி' : 'Due Date'}</th>
                      <th className="p-3 text-center font-extrabold">{isTamil ? 'நிலை' : 'Status'}</th>
                      <th className="p-3 text-right font-extrabold">{isTamil ? 'செயல்கள்' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE] dark:divide-[#3B2063]">
                    {displayFees.map((fee) => {
                      const isPaid = fee.status === 'paid';
                      const isMarkingThis = markingPaidId === fee.id;

                      return (
                        <tr key={fee.id} className="hover:bg-gray-50/50 dark:hover:bg-[#2A1247]/30 transition-colors">
                          <td className="p-3 font-black text-[#2E1065] dark:text-[#FAF5FF]">
                            {fee.studentName}
                          </td>
                          <td className="p-3 font-semibold text-gray-500 dark:text-gray-400">
                            {fee.standard}
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-300">
                            {fee.phone}
                          </td>
                          <td className="p-3 font-black text-[#7C3AED] dark:text-[#A3E635]">
                            ₹{fee.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-500 font-mono">
                            {fee.dueDate}
                          </td>
                          <td className="p-3 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                                ✓ PAID ({fee.paymentMode?.toUpperCase() || 'CASH'})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[10px] font-black text-rose-700 dark:text-rose-300">
                                PENDING DUE
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {isPaid ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={sendingReceiptPhone === fee.phone}
                                    onClick={() => handleSendFeeReceipt(fee)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-black flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    title="Send WhatsApp Receipt"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{sendingReceiptPhone === fee.phone ? 'Sending...' : 'Receipt 🧾'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdatingFee}
                                    onClick={() => handleRevertFeePending(fee.id)}
                                    className="px-2 py-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Revert
                                  </button>
                                </>
                              ) : (
                                <>
                                  {isMarkingThis ? (
                                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 animate-fade-in">
                                      <select
                                        value={markPaidMode}
                                        onChange={(e) => setMarkPaidMode(e.target.value as any)}
                                        className="px-1.5 py-0.5 rounded text-[11px] font-bold border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#1B0B2E]"
                                      >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                      </select>
                                      <button
                                        type="button"
                                        disabled={isUpdatingFee}
                                        onClick={() => handleMarkFeePaid(fee.id, markPaidMode, markPaidNote)}
                                        className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setMarkingPaidId(null)}
                                        className="px-1.5 py-0.5 rounded text-gray-400 text-[11px] hover:text-gray-600 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMarkingPaidId(fee.id);
                                        setMarkPaidMode('cash');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] text-[11px] font-black shadow-xs transition-colors cursor-pointer"
                                    >
                                      Mark Paid 💰
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={sendingReminderPhone === fee.phone}
                                    onClick={() => handleSendFeeReminder(fee)}
                                    className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[11px] font-black flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    title="Send WhatsApp Reminder"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{sendingReminderPhone === fee.phone ? 'Sending...' : 'Remind 📲'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    )}

    {/* TAB 5: WEEKLY ACTIVITY */}
    {activeTab === 'activity' && (
      <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
          {isTamil ? 'கடந்த 7 நாட்களின் வினாடி வினா செயல்பாடு' : 'Last 7 Days Quiz & Test Completion'}
        </h2>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {(statsData?.weeklyActivity || [
            { day: 'Mon', testsTaken: 12, avgScore: 84 },
            { day: 'Tue', testsTaken: 19, avgScore: 88 },
            { day: 'Wed', testsTaken: 15, avgScore: 82 },
            { day: 'Thu', testsTaken: 22, avgScore: 90 },
            { day: 'Fri', testsTaken: 25, avgScore: 87 },
            { day: 'Sat', testsTaken: 31, avgScore: 89 },
            { day: 'Sun', testsTaken: 28, avgScore: 91 },
          ]).map((act, i) => (
            <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#EDE9FE] dark:border-[#3B2063]">
              <span className="text-[11px] font-extrabold text-gray-400 mb-1">{act.day}</span>
              <span className="text-lg font-black text-[#7C3AED] dark:text-[#A3E635]">{act.testsTaken}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">{act.avgScore}%</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* TAB 6: MODEL A PAYOUT STATEMENT */}
    {activeTab === 'payout' && (
      <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'மாதாந்திர கமிஷன் அறிக்கை (Model A)' : 'Monthly Commission Statement (Model A)'}
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
            Cycle: {statsData?.payoutStatement?.cycle || '2026-10'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40">
            <span className="text-xs font-bold text-gray-400">{isTamil ? 'பதிவு செய்யப்பட்ட ஆர்டர்கள்' : 'Attributed Paid Orders'}</span>
            <p className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] mt-1">
              {statsData?.payoutStatement?.totalAttributedOrders ?? 8}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40">
            <span className="text-xs font-bold text-gray-400">{isTamil ? 'மொத்த வருவாய்' : 'Gross Student Revenue'}</span>
            <p className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] mt-1">
              ₹{statsData?.payoutStatement?.totalGrossRevenue ?? 4792}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{isTamil ? 'வழங்க வேண்டிய கமிஷன்' : 'Commission Payable'}</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{statsData?.payoutStatement?.totalCommissionDue ?? 719}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F0618] border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="font-bold text-gray-500">{isTamil ? 'கமிஷன் விகிதம்' : 'Commission Rate'}:</span>
            <span className="font-black text-[#7C3AED] dark:text-[#A3E635]">{tuition?.commissionPercent || 15}%</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-500">{isTamil ? 'கட்டணம் செலுத்தும் UPI' : 'Settlement UPI ID'}:</span>
            <span className="font-mono font-bold text-[#2E1065] dark:text-[#FAF5FF]">{tuition?.ownerUpi || 'ramesh@upi'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-500">{isTamil ? 'செலுத்தல் நிலை' : 'Settlement Status'}:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">Pending Monthly Settlement</span>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
