/**
 * Centum Tamil Nadu Student Portal - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script.
 * 2. Paste this code into Code.gs.
 * 3. Set SCRIPT_SECRET = "YOUR_SECRET_KEY".
 * 4. Create sheets named: "Students", "Papers", "News", "Questions".
 * 5. Deploy -> New Deployment -> Web App (Execute as: Me, Who has access: Anyone).
 * 6. Copy Web App URL to NEXT_PUBLIC_APPS_SCRIPT_URL in your Vercel project environment variables.
 */

const SCRIPT_SECRET = "YOUR_APPS_SCRIPT_SECRET_KEY";

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action;
  const key = params.key;

  // Validate Secret Key
  if (key !== SCRIPT_SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "papers") {
    const sheet = ss.getSheetByName("Papers");
    const data = sheet ? sheet.getDataRange().getValues() : [];
    const headers = data[0] || [];
    const papers = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      papers.push({
        id: row[0],
        classLevel: row[1],
        category: row[2],
        subject: row[3],
        exam: row[4],
        year: row[5],
        medium: row[6],
        title: row[7],
        driveFileId: row[8],
        featured: row[9] === true || row[9] === "TRUE"
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, papers: papers }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "news") {
    const sheet = ss.getSheetByName("News");
    const data = sheet ? sheet.getDataRange().getValues() : [];
    const news = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      news.push({
        id: row[0],
        title: row[1],
        date: row[2],
        category: row[3],
        summary: row[4],
        body: row[5],
        sourceUrl: row[6],
        imageUrl: row[7],
        pinned: row[8] === true || row[8] === "TRUE"
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, news: news }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "questions") {
    const sheet = ss.getSheetByName("Questions");
    const data = sheet ? sheet.getDataRange().getValues() : [];
    const questions = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let options = [];
      try {
        options = JSON.parse(row[5]);
      } catch (err) {
        options = [row[5], row[6], row[7], row[8]];
      }

      questions.push({
        id: row[0],
        classLevel: row[1],
        subject: row[2],
        chapter: row[3],
        type: row[4],
        options: options,
        answerIndex: parseInt(row[9] || "0", 10),
        explanation: row[10],
        medium: row[11]
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, questions: questions }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const key = payload.key;

    if (key !== SCRIPT_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.type === "student") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Students");
      if (!sheet) {
        sheet = ss.insertSheet("Students");
        sheet.appendRow(["Timestamp", "Name", "Phone", "District", "Standard", "Medium"]);
      }

      sheet.appendRow([
        new Date().toISOString(),
        payload.name,
        payload.phone,
        payload.district,
        payload.standard,
        payload.medium
      ]);

      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unknown payload type" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
