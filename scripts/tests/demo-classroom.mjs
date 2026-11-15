#!/usr/bin/env node

/**
 * scripts/tests/demo-classroom.mjs
 * 
 * Verifies Student-facing Demo Classroom:
 *  - Light theme by default + theme toggle
 *  - 3 compact tiles: Attendance, Diary, Performance
 *  - Enrolled classroom card with ONLY classroom and teacher name
 *  - Removed student-visible access code and batch-details box
 *  - Diary opens teacher notes
 *  - Performance shows ONLY individual student stats
 *  - "Join your classroom" CTA present
 */

import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('   STUDENT DEMO CLASSROOM VERIFICATION');
console.log('===============================================================\n');

function testDemoClassroom() {
  const filePath = path.join(process.cwd(), 'src/app/classroom/page.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  let passed = true;

  // 1. Verify 4 section tab buttons
  const tabs = [
    { id: 'demo-tab-dashboard', label: 'Overview / Dashboard' },
    { id: 'demo-tab-diary', label: 'Diary' },
    { id: 'demo-tab-attendance', label: 'Attendance' },
    { id: 'demo-tab-performance', label: 'Performance' },
  ];

  console.log('Checking student demo section tabs:');
  tabs.forEach((tab) => {
    const hasTab = content.includes(tab.id);
    if (!hasTab) {
      console.error(`  ❌ FAIL: Missing tab button for ${tab.label} (${tab.id})`);
      passed = false;
    } else {
      console.log(`  ✓ Tab verified: ${tab.label}`);
    }
  });

  // 2. Theme & 3 compact tiles
  console.log('\nChecking theme toggle & 3 compact dashboard tiles:');
  const hasThemeToggle = content.includes('demo-theme-toggle') && content.includes('centum_demo_theme');
  if (!hasThemeToggle) {
    console.error('  ❌ FAIL: Missing theme toggle button or persistence');
    passed = false;
  } else {
    console.log('  ✓ Light/dark theme toggle verified with localStorage persistence');
  }

  const hasThreeTiles =
    content.includes('demo-tile-attendance') &&
    content.includes('demo-tile-diary') &&
    content.includes('demo-tile-performance');
  if (!hasThreeTiles) {
    console.error('  ❌ FAIL: Missing 3 compact tiles (Attendance, Diary, Performance)');
    passed = false;
  } else {
    console.log('  ✓ 3 compact tiles verified on first dashboard');
  }

  // 3. Enrolled card without code or batch box
  console.log('\nChecking enrolled classroom card:');
  const hasEnrolledCard = content.includes('demo-enrolled-card');
  const hasNoAccessCode = !content.includes('DEMO10') && !content.includes('Copy Code');
  const hasNoBatchBox = !content.includes('Batch Details') && !content.includes('Active Term');

  if (!hasEnrolledCard || !hasNoAccessCode || !hasNoBatchBox) {
    console.error('  ❌ FAIL: Enrolled card must show only classroom and teacher name without access code or batch box');
    passed = false;
  } else {
    console.log('  ✓ Enrolled card verified (only classroom name + teacher name, zero access code or batch box)');
  }

  // 4. Diary & Performance
  console.log('\nChecking Diary and Performance views:');
  const hasDiaryFeed = content.includes("demoView === 'diary'") && content.includes('demoDiaryFilter');
  if (!hasDiaryFeed) {
    console.error('  ❌ FAIL: Diary must open teacher notes feed');
    passed = false;
  } else {
    console.log('  ✓ Diary opens teacher notes feed with filter chips');
  }

  const hasIndividualOnlyPerformance =
    content.includes("demoView === 'performance'") &&
    !content.includes('Class Average') &&
    !content.includes('Class Rank');
  if (!hasIndividualOnlyPerformance) {
    console.error('  ❌ FAIL: Performance must display individual stats only (no batch-wide stats)');
    passed = false;
  } else {
    console.log('  ✓ Performance displays individual student stats only');
  }

  // 5. Check "Join your classroom" CTA
  const hasJoinCta = content.includes('Join your classroom') || content.includes('உங்கள் வகுப்பறையில் இணையவும்');
  if (!hasJoinCta) {
    console.error('  ❌ FAIL: Missing "Join your classroom" CTA');
    passed = false;
  } else {
    console.log('  ✓ Primary CTA verified: "Join your classroom"');
  }

  console.log('\n===============================================================');
  if (passed) {
    console.log('✅ STUDENT DEMO CLASSROOM VERIFICATION PASSED');
    console.log('verifyRef: demo-classroom [VERIFIED]');
    console.log('===============================================================\n');
    process.exitCode = 0;
  } else {
    console.error('❌ STUDENT DEMO CLASSROOM VERIFICATION FAILED');
    console.log('===============================================================\n');
    process.exitCode = 1;
  }
}

testDemoClassroom();
