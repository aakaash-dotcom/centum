/**
 * Centum Tamil Nadu Student Portal - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script.
 * 2. Paste this code into Code.gs.
 * 3. Set SCRIPT_SECRET = "YOUR_SECRET_KEY".
 * 4. Create sheets named: "Students", "Scores", "Papers", "News", "Questions", "DailyQuiz", "Leaderboard".
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

  // 1. Question Papers
  if (action === "papers") {
    const sheet = ss.getSheetByName("Papers");
    const data = sheet ? sheet.getDataRange().getValues() : [];
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

  // 2. Student News
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

  // 3. Question Bank
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

  // 4. Daily Quiz (returns null if none scheduled for today)
  if (action === "dailyquiz") {
    const sheet = ss.getSheetByName("DailyQuiz");
    const data = sheet ? sheet.getDataRange().getValues() : [];
    const classLevel = params.classLevel || "";
    const stream = params.stream || "";
    const medium = params.medium || "english";

    let matchedQuiz = null;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClass = String(row[1] || "").toLowerCase();
      const rowStream = String(row[2] || "").toLowerCase();
      const rowMedium = String(row[3] || "").toLowerCase();

      if (rowClass === classLevel.toLowerCase() && rowMedium === medium.toLowerCase()) {
        if (!stream || !rowStream || rowStream === stream.toLowerCase()) {
          let options = [];
          try {
            options = JSON.parse(row[6]);
          } catch (e) {
            options = [row[6], row[7], row[8], row[9]];
          }

          matchedQuiz = {
            id: row[0],
            classLevel: row[1],
            stream: row[2],
            medium: row[3],
            subject: row[4],
            chapter: row[5],
            question: row[6],
            options: options,
            answerIndex: parseInt(row[10] || "0", 10),
            explanation: row[11],
            date: row[12]
          };
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, quiz: matchedQuiz }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 5. Leaderboard (Standard specific, top 5 + user row, names never show phone numbers)
  if (action === "leaderboard") {
    const sheet = ss.getSheetByName("Leaderboard");
    const data = sheet ? sheet.getDataRange().getValues() : [];
    const standard = params.standard || "10th";
    const userPhone = params.phone || "";

    const leaderboard = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowStd = String(row[4] || "").toLowerCase();

      if (!rowStd || rowStd === standard.toLowerCase()) {
        const rawName = String(row[0] || "");
        const firstName = rawName.split(" ")[0].replace(/\d+/g, "").trim() || "Student";
        const rowPhone = String(row[5] || "");

        leaderboard.push({
          name: firstName,
          district: row[1],
          points: parseInt(row[2] || "0", 10),
          tests: parseInt(row[3] || "0", 10),
          me: Boolean(userPhone && rowPhone === userPhone)
        });
      }
    }

    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, leaderboard: leaderboard }))
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Register Student
    if (payload.type === "student") {
      let sheet = ss.getSheetByName("Students");
      if (!sheet) {
        sheet = ss.insertSheet("Students");
        sheet.appendRow(["Timestamp", "Name", "Phone", "District", "Standard", "Stream", "Medium"]);
      }

      sheet.appendRow([
        new Date().toISOString(),
        payload.name,
        payload.phone,
        payload.district,
        payload.standard,
        payload.stream || "",
        payload.medium
      ]);

      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Record Test Score
    if (payload.type === "score") {
      let sheet = ss.getSheetByName("Scores");
      if (!sheet) {
        sheet = ss.insertSheet("Scores");
        sheet.appendRow(["Timestamp", "Phone", "Name", "District", "Standard", "Subject", "Chapter", "TestType", "Score", "Total", "Seconds"]);
      }

      sheet.appendRow([
        new Date().toISOString(),
        payload.phone,
        payload.name,
        payload.district,
        payload.standard,
        payload.subject,
        payload.chapter,
        payload.testType,
        payload.score,
        payload.total,
        payload.seconds
      ]);

      // Update or create Leaderboard entry
      let lbSheet = ss.getSheetByName("Leaderboard");
      if (lbSheet) {
        const lbData = lbSheet.getDataRange().getValues();
        let found = false;
        for (let i = 1; i < lbData.length; i++) {
          if (String(lbData[i][5]) === String(payload.phone)) {
            // Update points and tests
            const currPts = parseInt(lbData[i][2] || "0", 10);
            const currTests = parseInt(lbData[i][3] || "0", 10);
            lbSheet.getRange(i + 1, 3).setValue(currPts + (payload.score * 10));
            lbSheet.getRange(i + 1, 4).setValue(currTests + 1);
            found = true;
            break;
          }
        }
        if (!found) {
          lbSheet.appendRow([payload.name, payload.district, payload.score * 10, 1, payload.standard, payload.phone]);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, scoreRecorded: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unknown payload type" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
