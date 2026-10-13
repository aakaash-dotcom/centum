import fs from 'fs';

async function main() {
  const audit = JSON.parse(fs.readFileSync('scripts/drive-owner-audit.json', 'utf8'));
  const strangers = audit.files.filter(f => f.owner !== 'ravistuition3@gmail.com');
  console.log(`Found ${strangers.length} stranger-owned files needing re-hosting to ravistuition3@gmail.com...`);

  const bridgeUrl = process.env.APPS_SCRIPT_URL;
  const bridgeSecret = process.env.APPS_SCRIPT_SECRET;

  console.log('Bridge URL:', bridgeUrl ? 'Configured' : 'Missing (local simulation / manual pass)');

  const migrationMap = [];

  for (let i = 0; i < strangers.length; i++) {
    const item = strangers[i];
    console.log(`[${i + 1}/${strangers.length}] ${item.classLevel} ${item.subject} (${item.medium}) - ${item.driveFileId} (Owner: ${item.owner})`);
    
    // If bridge is live with credentials
    if (bridgeUrl && bridgeSecret) {
      try {
        const res = await fetch(bridgeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'drive-copy',
            key: bridgeSecret,
            sourceId: item.driveFileId,
            name: `${item.classLevel}_${item.subject}_${item.medium}_${item.unitTitle}.pdf`,
            targetFolderId: '1_hqisSezs0-4qvZT6i6301QVDawACB5b'
          })
        });
        const data = await res.json();
        if (data.ok && data.newFileId) {
          migrationMap.push({
            ...item,
            newDriveFileId: data.newFileId,
            status: 'rehosted'
          });
        } else {
          migrationMap.push({
            ...item,
            status: 'failed',
            error: data.error
          });
        }
      } catch (err) {
        migrationMap.push({
          ...item,
          status: 'error',
          error: err.message
        });
      }
    } else {
      migrationMap.push({
        ...item,
        status: 'pending-bridge-exec'
      });
    }
  }

  fs.writeFileSync('scripts/stranger-files-migration-plan.json', JSON.stringify({
    totalStrangers: strangers.length,
    targetOwner: 'ravistuition3@gmail.com',
    targetFolderId: '1_hqisSezs0-4qvZT6i6301QVDawACB5b',
    files: migrationMap
  }, null, 2), 'utf8');

  console.log('\nMigration plan written to scripts/stranger-files-migration-plan.json');
}

main().catch(console.error);
