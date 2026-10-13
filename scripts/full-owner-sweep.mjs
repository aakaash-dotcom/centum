import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/textbooks-served-ids.json', 'utf8'));
console.log(`Starting owner sweep across all ${data.length} unique files...`);

const KNOWN_OWNERS = [
  'ravistuition3@gmail.com',
  'arivukalam90@gmail.com',
  'karthik.aze@gmail.com',
  'twinpenguinssoft@gmail.com',
  'intamil24web1@gmail.com',
  'materials@queensms.in'
];

async function checkFileOwner(row) {
  const id = row.driveFileId;
  try {
    const res = await fetch(`https://drive.google.com/file/d/${id}/view`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    for (const owner of KNOWN_OWNERS) {
      if (html.includes(owner)) {
        return owner;
      }
    }
    // Fallback regex search
    const matches = html.match(/[a-zA-Z0-9._%+-]+@(gmail\.com|queensms\.in)/g) || [];
    if (matches.length > 0) {
      return matches[0];
    }
    return 'unknown';
  } catch (err) {
    return 'error';
  }
}

async function runSweep() {
  const results = [];
  const ownerCounts = {};
  const strangerFilesByClass = {};

  // Run in chunks of 15 concurrency
  const CHUNK_SIZE = 15;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (row) => {
        const owner = await checkFileOwner(row);
        return {
          classLevel: row.classLevel,
          subject: row.subject,
          medium: row.medium,
          unitNo: row.unitNo,
          unitTitle: row.unitTitle,
          driveFileId: row.driveFileId,
          owner: owner
        };
      })
    );
    for (const res of chunkResults) {
      results.push(res);
      ownerCounts[res.owner] = (ownerCounts[res.owner] || 0) + 1;
      if (res.owner !== 'ravistuition3@gmail.com') {
        const cls = 'C' + (res.classLevel.replace(/\D/g, '') || res.classLevel);
        strangerFilesByClass[cls] = (strangerFilesByClass[cls] || 0) + 1;
      }
    }
    process.stdout.write(`Processed ${results.length}/${data.length} files...\r`);
  }

  console.log('\n\n=== DRIVE OWNER SWEEP COMPLETE ===');
  console.log('Owner Counts:', ownerCounts);
  console.log('Stranger Files by Class:', strangerFilesByClass);

  fs.writeFileSync('scripts/drive-owner-audit.json', JSON.stringify({
    total: results.length,
    ownerCounts,
    strangerFilesByClass,
    files: results
  }, null, 2), 'utf8');
  console.log('Saved audit to scripts/drive-owner-audit.json');
}

runSweep();
