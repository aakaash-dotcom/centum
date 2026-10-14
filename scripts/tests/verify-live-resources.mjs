#!/usr/bin/env node

/**
 * scripts/tests/verify-live-resources.mjs
 * 
 * Verifies standing gate across all content lanes:
 *  - verifyRef: verify-live-resources
 */

import { spawn } from 'child_process';
import path from 'path';

const scriptPath = path.join(process.cwd(), 'scripts', 'verify-live-resources.mjs');

const child = spawn(process.execPath, [scriptPath], {
  stdio: 'inherit',
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('verifyRef: verify-live-resources [VERIFIED]');
    process.exit(0);
  } else {
    console.error('verifyRef: verify-live-resources [FAILED]');
    process.exit(code || 1);
  }
});
