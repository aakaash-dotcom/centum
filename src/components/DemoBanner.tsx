'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

export function DemoBanner() {
  const { student } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [isDemoSession, setIsDemoSession] = useState(false);

  useEffect(() => {
    // Check if current user phone is a demo account or owner demo
    const phone = student?.phone?.replace(/\D/g, '').slice(-10) || '';
    const isStudentDemo = phone === '9123456780';
    const isOwnerDemo = phone === '9840123456';

    let hasOwnerSessionDemo = false;
    try {
      const ownerSession = sessionStorage.getItem('centum_owner_session');
      if (ownerSession && ownerSession.includes('9840123456')) {
        hasOwnerSessionDemo = true;
      }
    } catch (e) {}

    const hasDemoParam = typeof window !== 'undefined' && window.location.search.includes('demo=true');

    if (isStudentDemo || isOwnerDemo || hasOwnerSessionDemo || hasDemoParam) {
      setIsDemoSession(true);
    } else {
      setIsDemoSession(false);
    }
  }, [student?.phone]);

  if (!isDemoSession) return null;

  return (
    <aside
      aria-label="Demo Account Notice"
      data-testid="demo-account-banner"
      className="sticky top-0 z-[100] w-full bg-amber-500 text-amber-950 px-3 py-1.5 shadow-sm border-b border-amber-600/30 text-xs font-bold transition-all"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-950 shrink-0" />
          <span className="font-black uppercase tracking-wider text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded-sm shrink-0">
            DEMO ACCOUNT
          </span>
          {!collapsed && (
            <span className="text-[11px] truncate">
              Sample showroom data · Real user accounts untouched
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 hover:bg-amber-600/30 rounded text-amber-950 shrink-0 cursor-pointer"
          aria-label={collapsed ? 'Expand demo banner' : 'Collapse demo banner'}
        >
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
}
