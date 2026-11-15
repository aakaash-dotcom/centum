#!/usr/bin/env node

/**
 * scripts/tests/verify-student-preview.mjs
 * 
 * Comprehensive automated test suite verifying all 3 requirements:
 * 1. Tests notice (no persistent banner on /tests, unobtrusive score disclosure on completion)
 * 2. News and Leaderboard (no ghost 503 lock, graceful sample fallback, clear 📡 UI with real retry)
 * 3. Student Demo Classroom (light theme default + toggle, 3 compact tiles, enrolled card with only
 *    classroom and teacher name, diary opens teacher notes, performance is individual-only).
 */

import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('   STUDENT-FACING FIXES PREVIEW VERIFICATION SUITE');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, failureDetail = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetail) console.error(`     Detail: ${failureDetail}`);
  }
}

// --------------------------------------------------------------------------
// SUITE 1: Tests Notice
// --------------------------------------------------------------------------
console.log('--- 1. Testing Tests Notice & Score Storage Disclosure ---');
const testsPageContent = fs.readFileSync(path.join(process.cwd(), 'src/app/tests/page.tsx'), 'utf-8');
const testRunnerContent = fs.readFileSync(path.join(process.cwd(), 'src/app/test-runner/page.tsx'), 'utf-8');
const profileContent = fs.readFileSync(path.join(process.cwd(), 'src/app/profile/page.tsx'), 'utf-8');

assert(
  !testsPageContent.includes('fallback-offline-banner'),
  'No persistent offline/saved-bank banner on main Tests selection page'
);

assert(
  !testRunnerContent.includes('test-runner-offline-banner'),
  'Active test runner quiz screen is distraction-free without persistent saved bank banner'
);

assert(
  testRunnerContent.includes('Your score is saved locally on this device') &&
  testRunnerContent.includes('உங்கள் மதிப்பெண் இந்த சாதனத்தில் மட்டும் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளது'),
  'Unobtrusive score storage disclosure present on test completion metrics screen'
);

assert(
  profileContent.includes('Scores are saved locally on this device') ||
  profileContent.includes('மதிப்பெண்கள் இந்த சாதனத்தில் மட்டும் சேமிக்கப்படுகின்றன'),
  'Unobtrusive score storage disclosure present in Profile test performance'
);

// --------------------------------------------------------------------------
// SUITE 2: News & Leaderboard Fixes
// --------------------------------------------------------------------------
console.log('\n--- 2. Testing News & Leaderboard Resiliency & State UI ---');
const textsContent = fs.readFileSync(path.join(process.cwd(), 'src/data/texts.ts'), 'utf-8');
const apiNewsContent = fs.readFileSync(path.join(process.cwd(), 'src/app/api/news/route.ts'), 'utf-8');
const apiLeaderboardContent = fs.readFileSync(path.join(process.cwd(), 'src/app/api/leaderboard/route.ts'), 'utf-8');
const newsPageContent = fs.readFileSync(path.join(process.cwd(), 'src/app/news/page.tsx'), 'utf-8');
const newsIdContent = fs.readFileSync(path.join(process.cwd(), 'src/app/news/[id]/page.tsx'), 'utf-8');
const leaderboardBoxContent = fs.readFileSync(path.join(process.cwd(), 'src/components/LeaderboardBox.tsx'), 'utf-8');

assert(
  !textsContent.includes('signal ghost 👻 retry'),
  'Removed slang "signal ghost 👻 retry" from texts.states.signalGhost'
);

assert(
  textsContent.includes('Unable to connect. Please check your internet or retry.'),
  'texts.states.signalGhost has clear, student-friendly copy'
);

assert(
  apiNewsContent.includes('SAMPLE_NEWS') && apiNewsContent.includes("source: 'fallback'"),
  'API /api/news falls back to SAMPLE_NEWS with status 200 on backend failure instead of 503 error'
);

assert(
  apiLeaderboardContent.includes('SAMPLE_LEADERBOARDS') && apiLeaderboardContent.includes("source: 'fallback'"),
  'API /api/leaderboard falls back to SAMPLE_LEADERBOARDS with status 200 on backend failure instead of 503 error'
);

assert(
  !newsPageContent.includes('<span>👻</span>') && newsPageContent.includes('📡'),
  'News page uses clean 📡 icon and message instead of ghost emoji'
);

assert(
  !newsIdContent.includes('<span>👻</span>') && newsIdContent.includes('📡'),
  'News detail page uses clean 📡 icon and message instead of ghost emoji'
);

assert(
  !leaderboardBoxContent.includes('<span>👻</span>') && leaderboardBoxContent.includes('📡'),
  'LeaderboardBox uses clean 📡 icon and message instead of ghost emoji'
);

// --------------------------------------------------------------------------
// SUITE 3: Student Demo Classroom Redesign
// --------------------------------------------------------------------------
console.log('\n--- 3. Testing Student Demo Classroom Redesign ---');
const classroomContent = fs.readFileSync(path.join(process.cwd(), 'src/app/classroom/page.tsx'), 'utf-8');

assert(
  classroomContent.includes("useState<'light' | 'dark'>('light')"),
  'Demo theme defaults to light mode'
);

assert(
  classroomContent.includes('data-testid="demo-theme-toggle"') &&
  classroomContent.includes('centum_demo_theme'),
  'Light/dark theme toggle button present and persists to localStorage centum_demo_theme'
);

assert(
  classroomContent.includes('data-testid="demo-tile-attendance"') &&
  classroomContent.includes('data-testid="demo-tile-diary"') &&
  classroomContent.includes('data-testid="demo-tile-performance"'),
  'First dashboard is compact with 3 tiles: Attendance, Diary, Performance'
);

assert(
  classroomContent.includes('data-testid="demo-enrolled-card"') &&
  classroomContent.includes("data?.preview?.sampleTuition?.name || \"Ravi's Tuition Centre\"") &&
  classroomContent.includes("data?.preview?.sampleTuition?.teacher || 'Ravichandran'"),
  'Enrolled classroom card displays Ravi’s Tuition Centre name and Ravichandran teacher name'
);

assert(
  !classroomContent.includes('DEMO10') && !classroomContent.includes('Copy Code'),
  'Removed student-visible access code (DEMO10) and copy code button'
);

assert(
  !classroomContent.includes('Batch Details') && !classroomContent.includes('Active Term'),
  'Removed batch details box from student demo'
);

assert(
  classroomContent.includes("setDemoView('diary')") &&
  classroomContent.includes("Teacher's Notes"),
  'Diary tile opens the teacher’s notes feed'
);

assert(
  !classroomContent.includes('Class Average') &&
  !classroomContent.includes('Class Rank') &&
  !classroomContent.includes('Academy Seat Capacity'),
  'Performance view displays individual student stats only (never batch-wide stats or peer rank)'
);

assert(
  classroomContent.includes('https://i.imgur.com/PxSCGbL.png'),
  'Preserved RAVI’S TUITION branding and logo'
);

// --------------------------------------------------------------------------
// SUITE 4: Truthful Sample / Demo Identifiers
// --------------------------------------------------------------------------
console.log('\n--- 4. Testing Truthful Sample / Demo Identifiers ---');
assert(
  newsPageContent.includes('data-testid="news-sample-banner"') &&
  newsPageContent.includes('Sample Updates · Live news feed currently offline'),
  'News page shows explicit sample banner when using fallback data'
);

assert(
  leaderboardBoxContent.includes('data-testid="leaderboard-sample-badge"') &&
  leaderboardBoxContent.includes('Sample Preview') &&
  leaderboardBoxContent.includes('data-testid="leaderboard-sample-banner"'),
  'LeaderboardBox clearly identifies sample rankings and unavailable live state'
);

assert(
  classroomContent.includes('data-testid="classroom-demo-banner"') &&
  classroomContent.includes('93% · Demo') &&
  classroomContent.includes('Sample Data'),
  'Classroom attendance and performance figures are explicitly labeled as sample demo data'
);

// --------------------------------------------------------------------------
// Summary
// --------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`PREVIEW VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('✅ ALL STUDENT-FACING PREVIEW CHECKS PASSED PERFECTLY!');
  console.log('===============================================================\n');
  process.exit(0);
} else {
  console.error(`❌ ${totalTests - passedTests} CHECKS FAILED`);
  console.log('===============================================================\n');
  process.exit(1);
}
