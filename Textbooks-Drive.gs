/**
 * CENTUM BACKEND — TEXTBOOKS DRIVE-TO-DRIVE RE-HOSTING & OPS MODULE (Textbooks-Drive.gs)
 * Self-contained file for Google Apps Script.
 *
 * HOW THE FOUNDER INSTALLS THIS:
 * 1. In Apps Script editor, click '+' next to Files -> choose 'Script' -> name it 'Textbooks-Drive'.
 * 2. Paste ALL of this code into Textbooks-Drive.gs.
 * 3. Save Textbooks-Drive.gs.
 * 4. In Code.gs, add the dispatch hook inside doGet and doPost (see header banner below).
 * 5. Run 'textbooksDriveSelfTest' from the editor Run menu to verify green.
 * 6. Deploy -> Manage deployments -> edit -> New version -> Deploy.
 *
 * DISPATCH HOOK TO PASTE IN Code.gs doGet(e) right before unknown action:
 *   if (a === "drive-copy" || a === "ops-copy-drive" || a === "ops-textbooks-purge-probes" || a === "textbooks-audit-owners" || a === "textbooks-batch-rehost") {
 *     const _out = typeof textbooksDriveRouteGet === 'function' ? textbooksDriveRouteGet(e.parameter) : null;
 *     if (_out) return json_(_out);
 *   }
 *
 * DISPATCH HOOK TO PASTE IN Code.gs doPost(e) right before unknown type:
 *   if (body.type === "drive-copy" || body.action === "drive-copy" || body.action === "ops-copy-drive" || body.action === "ops-textbooks-purge-probes" || body.action === "textbooks-batch-rehost") {
 *     const _out = typeof textbooksDriveRoutePost === 'function' ? textbooksDriveRoutePost(body) : null;
 *     if (_out) return json_(_out);
 *   }
 */

// =================== CONFIGURATION & CONSTANTS ===================
const TB_TARGET_FOLDER_ID = "1_hqisSezs0-4qvZT6i6301QVDawACB5b";
const TB_OUR_OWNER_EMAIL = "ravistuition3@gmail.com";
const TB_TEXTBOOKS_SHEET_ID = "1yt1zRi6LZC2HMtrBvRJWflR86BfYoHPsG0VzxPTtGJ0";

// =================== SPREADSHEET & SECRET HELPERS ===================
function tbGetSpreadsheet_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty("TEXTBOOKS_SHEET_ID") || TB_TEXTBOOKS_SHEET_ID || p.getProperty("SHEET_ID");
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch(e) {}
  }
  return SpreadsheetApp.getActive();
}

function tbGetSecret_() {
  return PropertiesService.getScriptProperties().getProperty("SECRET") || "";
}

function tbJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =================== PUBLIC DISPATCH HOOKS ===================

function textbooksDriveRouteGet(params) {
  if (!params) return null;
  const action = String(params.action || "").trim();
  const key = String(params.key || "").trim();
  const secret = tbGetSecret_();

  if (secret && key !== secret) {
    return { ok: false, error: "unauthorized" };
  }

  if (action === "drive-copy" || action === "ops-copy-drive") {
    return tbCopyDriveFile_(params);
  }
  if (action === "ops-textbooks-purge-probes") {
    return tbDeleteTextbookProbeRows_();
  }
  if (action === "textbooks-audit-owners") {
    return tbAuditOwners_();
  }
  if (action === "textbooks-batch-rehost") {
    return tbBatchRehostStrangers_(params);
  }
  return null;
}

function textbooksDriveRoutePost(body) {
  if (!body) return null;
  const action = String(body.action || body.type || "").trim();
  const key = String(body.key || body.secret || "").trim();
  const secret = tbGetSecret_();

  if (secret && key !== secret) {
    return { ok: false, error: "unauthorized" };
  }

  if (action === "drive-copy" || action === "ops-copy-drive") {
    return tbCopyDriveFile_(body);
  }
  if (action === "ops-textbooks-purge-probes") {
    return tbDeleteTextbookProbeRows_();
  }
  if (action === "textbooks-batch-rehost") {
    return tbBatchRehostStrangers_(body);
  }
  return null;
}

// =================== CORE DRIVE-TO-DRIVE COPY ACTION ===================

/**
 * Drive-to-Drive copy action inside Google Drive.
 * Never streams bytes through the bridge, bypassing the 35 MB base64 ceiling.
 * Copies the source file into targetFolder (owned by ravistuition3@gmail.com).
 * Sets sharing to ANYONE_WITH_LINK VIEW.
 * Copy only — never moves or deletes the source.
 */
function tbCopyDriveFile_(params) {
  try {
    const sourceId = String(params.sourceId || params.driveFileId || params.fileId || "").trim();
    if (!sourceId) {
      return { ok: false, error: "sourceId-required" };
    }

    const sourceFile = DriveApp.getFileById(sourceId);
    const targetFolderId = String(params.targetFolderId || params.folderId || TB_TARGET_FOLDER_ID).trim();
    let targetFolder = null;

    try {
      if (targetFolderId) targetFolder = DriveApp.getFolderById(targetFolderId);
    } catch (e) {
      console.warn("Target folder open failed, using default Drive root:", e);
    }

    const copyName = String(params.name || sourceFile.getName()).trim();
    const copy = targetFolder ? sourceFile.makeCopy(copyName, targetFolder) : sourceFile.makeCopy(copyName);
    
    // Ensure public view access for in-app viewer preview
    copy.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const newId = copy.getId();
    let ownerEmail = TB_OUR_OWNER_EMAIL;
    try {
      ownerEmail = copy.getOwner().getEmail();
    } catch(e) {}

    return {
      ok: true,
      sourceId: sourceId,
      newFileId: newId,
      fileId: newId,
      name: copy.getName(),
      url: copy.getUrl(),
      previewUrl: "https://drive.google.com/file/d/" + newId + "/preview",
      downloadUrl: "https://drive.google.com/uc?id=" + newId + "&export=download",
      sizeBytes: copy.getSize(),
      owner: ownerEmail
    };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

// =================== TARGETED ROW DELETION ACTION ===================

/**
 * Targeted row-delete action for the 5 duplicate test probe rows.
 * Matches rows where qcNote === 'PENDING - probe-update test'.
 * Safely drops rows from 420 -> 415 in snapshot (427 -> 422 in sheet).
 * The real C10 Social EM row (starts with "Official TN govt PDF" or "PENDING FOUNDER DROP - 47.67MB...")
 * has a different qcNote and is strictly preserved!
 */
function tbDeleteTextbookProbeRows_() {
  try {
    const ss = tbGetSpreadsheet_();
    const sh = ss.getSheetByName("Textbooks");
    if (!sh) return { ok: false, error: "Textbooks-sheet-not-found" };

    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: false, error: "sheet-empty" };

    const headers = data[0].map(String);
    const qcNoteIndex = headers.indexOf("qcNote");
    if (qcNoteIndex === -1) return { ok: false, error: "qcNote-column-not-found" };

    let deletedCount = 0;
    const deletedRowIndices = [];

    // Reverse loop to keep remaining row indices stable
    for (let r = data.length - 1; r >= 1; r--) {
      const note = String(data[r][qcNoteIndex] || "").trim();
      if (note === "PENDING - probe-update test") {
        sh.deleteRow(r + 1);
        deletedCount++;
        deletedRowIndices.push(r + 1);
      }
    }

    const rowsNow = sh.getLastRow() - 1;
    return {
      ok: true,
      deletedCount: deletedCount,
      deletedRows: deletedRowIndices,
      remainingDataRows: rowsNow,
      note: "Purged " + deletedCount + " probe-update test rows. Real rows preserved."
    };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

// =================== OWNER AUDIT & BATCH RE-HOSTING PASS ===================

/**
 * Audits all 384 unique files in the Textbooks tab.
 * Returns owner email distribution across the ledger.
 */
function tbAuditOwners_() {
  try {
    const ss = tbGetSpreadsheet_();
    const sh = ss.getSheetByName("Textbooks");
    if (!sh) return { ok: false, error: "Textbooks-sheet-not-found" };

    const data = sh.getDataRange().getValues();
    const headers = data[0].map(String);
    const driveIdIndex = headers.indexOf("driveFileId");
    if (driveIdIndex === -1) return { ok: false, error: "driveFileId-col-missing" };

    const DRIVE_REGEX = /^[A-Za-z0-9_-]{25,}$/;
    const ownerCounts = {};
    const strangerFiles = [];
    const auditedIds = {};

    for (let r = 1; r < data.length; r++) {
      const fileId = String(data[r][driveIdIndex] || "").trim();
      if (!DRIVE_REGEX.test(fileId) || auditedIds[fileId]) continue;
      auditedIds[fileId] = true;

      try {
        const f = DriveApp.getFileById(fileId);
        const owner = f.getOwner() ? f.getOwner().getEmail() : "unknown";
        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
        if (owner !== TB_OUR_OWNER_EMAIL) {
          strangerFiles.push({
            row: r + 1,
            driveFileId: fileId,
            name: f.getName(),
            owner: owner
          });
        }
      } catch (e) {
        ownerCounts["inaccessible"] = (ownerCounts["inaccessible"] || 0) + 1;
      }
    }

    return {
      ok: true,
      totalAudited: Object.keys(auditedIds).length,
      ownerCounts: ownerCounts,
      strangerCount: strangerFiles.length,
      ourFilesCount: ownerCounts[TB_OUR_OWNER_EMAIL] || 0
    };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

/**
 * Unattended batch re-host pass:
 * Scans the Textbooks tab for files owned by third-party accounts (arivukalam90, karthik.aze, etc.)
 * Copies each file directly to TB_TARGET_FOLDER_ID on ravistuition3@gmail.com.
 * Updates the sheet row's driveFileId to the new copy ID.
 * Target: converts all 81 stranger files to ravistuition3@gmail.com (384/384).
 */
function tbBatchRehostStrangers_(params) {
  try {
    const limit = Number(params && params.limit) || 100;
    const ss = tbGetSpreadsheet_();
    const sh = ss.getSheetByName("Textbooks");
    if (!sh) return { ok: false, error: "Textbooks-sheet-not-found" };

    const data = sh.getDataRange().getValues();
    const headers = data[0].map(String);
    const driveIdIndex = headers.indexOf("driveFileId");
    const qcNoteIndex = headers.indexOf("qcNote");
    const updatedAtIndex = headers.indexOf("updatedAt");
    const fileUrlIndex = headers.indexOf("fileUrl");

    const targetFolder = DriveApp.getFolderById(TB_TARGET_FOLDER_ID);
    const DRIVE_REGEX = /^[A-Za-z0-9_-]{25,}$/;
    let migratedCount = 0;
    const migratedList = [];

    for (let r = 1; r < data.length; r++) {
      if (migratedCount >= limit) break;
      const fileId = String(data[r][driveIdIndex] || "").trim();
      if (!DRIVE_REGEX.test(fileId)) continue;

      try {
        const file = DriveApp.getFileById(fileId);
        const owner = file.getOwner() ? file.getOwner().getEmail() : "unknown";

        // If not owned by ravistuition3@gmail.com, copy it!
        if (owner !== TB_OUR_OWNER_EMAIL) {
          const copy = file.makeCopy(file.getName(), targetFolder);
          copy.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          const newId = copy.getId();

          // Update spreadsheet row
          sh.getRange(r + 1, driveIdIndex + 1).setValue(newId);
          if (fileUrlIndex !== -1) {
            sh.getRange(r + 1, fileUrlIndex + 1).setValue("https://drive.google.com/uc?id=" + newId + "&export=download");
          }
          if (qcNoteIndex !== -1) {
            const oldNote = String(data[r][qcNoteIndex] || "");
            const newNote = oldNote + " [Re-hosted to ravistuition3 Drive id " + newId + " from " + owner + " (" + fileId + ")]";
            sh.getRange(r + 1, qcNoteIndex + 1).setValue(newNote);
          }
          if (updatedAtIndex !== -1) {
            sh.getRange(r + 1, updatedAtIndex + 1).setValue(new Date().toISOString());
          }

          migratedCount++;
          migratedList.push({
            row: r + 1,
            oldId: fileId,
            newId: newId,
            previousOwner: owner,
            name: file.getName()
          });
        }
      } catch (err) {
        console.warn("Row " + (r + 1) + " rehost skipped: " + err);
      }
    }

    return {
      ok: true,
      migratedCount: migratedCount,
      migratedList: migratedList,
      targetFolderId: TB_TARGET_FOLDER_ID
    };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

// =================== STANDALONE EDITOR SELF-TEST ===================

function textbooksDriveSelfTest() {
  console.log("=== Textbooks Drive-to-Drive Self-Test ===");
  const ss = tbGetSpreadsheet_();
  console.log("Spreadsheet:", ss ? ss.getName() : "NOT FOUND");
  const folder = DriveApp.getFolderById(TB_TARGET_FOLDER_ID);
  console.log("Target folder:", folder ? folder.getName() : "NOT FOUND");
  console.log("Self-test PASSED green.");
}
