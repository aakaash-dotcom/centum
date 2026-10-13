import assert from 'assert';
import { listMockProVideos } from '../src/lib/server-mock-store.js';
import { isValidLiveVideoMeta, filterValidLiveVideos } from '../src/lib/video-verifier.js';

console.log('=== TEST: PRO-VIDEOS CLEANUP & GUARD VERIFICATION ===\n');

// 1. Verify default listMockProVideos returns 0 without ENABLE_FIXTURE_VIDEOS flag
delete process.env.ENABLE_FIXTURE_VIDEOS;
const defaultVids = listMockProVideos('10', 'maths');
console.log(`1. listMockProVideos without ENABLE_FIXTURE_VIDEOS: count = ${defaultVids.length}`);
assert.strictEqual(defaultVids.length, 0, 'Must return 0 videos when ENABLE_FIXTURE_VIDEOS is not set');

// 2. Even if ENABLE_FIXTURE_VIDEOS is enabled, status=draft means 0 live videos
process.env.ENABLE_FIXTURE_VIDEOS = 'true';
const enabledVids = listMockProVideos('10', 'maths');
console.log(`2. listMockProVideos with ENABLE_FIXTURE_VIDEOS=true (all draft): count = ${enabledVids.length}`);
assert.strictEqual(enabledVids.length, 0, 'Must return 0 videos because all fixture rows are status=draft');

// 3. Test video-verifier guard against Rickroll and dummy IDs
const dummyRogueVideos = [
  {
    id: 'test-1',
    status: 'live',
    ytUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    driveFileId: '1s_Sample_CCBY_BigBuckBunny_Drive_Vid1',
  },
  {
    id: 'test-2',
    status: 'live',
    ytUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    driveFileId: '',
  },
  {
    id: 'test-3',
    status: 'live',
    ytUrl: '',
    driveFileId: '1invalid_drive_file_id_to_trigger_fallback',
  },
  {
    id: 'test-4',
    status: 'draft',
    ytUrl: 'https://www.youtube.com/watch?v=real_valid_id123',
    driveFileId: '1real_valid_drive_file_id_long_enough',
  },
  {
    id: 'real-valid',
    status: 'live',
    ytUrl: 'https://www.youtube.com/watch?v=real_valid_id123',
    driveFileId: '1real_valid_drive_file_id_long_enough_abcdef',
  },
];

console.log('\n3. Testing isValidLiveVideoMeta guard against rogue test inputs...');
assert.strictEqual(isValidLiveVideoMeta(dummyRogueVideos[0]), false, 'Must reject BigBuckBunny & Rickroll');
assert.strictEqual(isValidLiveVideoMeta(dummyRogueVideos[1]), false, 'Must reject Rickroll ytUrl');
assert.strictEqual(isValidLiveVideoMeta(dummyRogueVideos[2]), false, 'Must reject invalid dummy drive id');
assert.strictEqual(isValidLiveVideoMeta(dummyRogueVideos[3]), false, 'Must reject draft video');
assert.strictEqual(isValidLiveVideoMeta(dummyRogueVideos[4]), true, 'Must accept clean live video');

const filtered = filterValidLiveVideos(dummyRogueVideos);
console.log(`Filter result: ${filtered.length} out of ${dummyRogueVideos.length} passed.`);
assert.strictEqual(filtered.length, 1);
assert.strictEqual(filtered[0].id, 'real-valid');

console.log('\n✅ ALL PRO-VIDEOS VERIFICATION CHECKS PASSED GREEN!\n');
