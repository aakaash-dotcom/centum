/**
 * Centum Tamil Nadu Student Portal - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script.
 * 2. Paste this code into Code.gs.
 * 3. Set SCRIPT_SECRET = "YOUR_SECRET_KEY".
 * 4. Create sheets named: "Students", "Scores", "Papers", "News", "Questions", "DailyQuiz", "Leaderboard", "Subscriptions", "Coupons", "Referrals".
 * 5. Deploy -> New Deployment -> Web App (Execute as: Me, Who has access: Anyone).
 * 6. Copy Web App URL to APPS_SCRIPT_URL in your Vercel project environment variables.
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
        featured: row[9] === true || row[9] === "TRUE",
        plan: (row[10] || "free").toString().toLowerCase() === "pro" ? "pro" : "free"
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
        medium: row[11],
        plan: (row[12] || "free").toString().toLowerCase() === "pro" ? "pro" : "free"
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

  // 6. Plan helper: action=plan&phone=...
  if (action === "plan") {
    const phone = params.phone || "";
    if (!phone) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, plan: "free" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Check Subscriptions sheet first
    const subSheet = ss.getSheetByName("Subscriptions");
    if (subSheet) {
      const subData = subSheet.getDataRange().getValues();
      for (let i = 1; i < subData.length; i++) {
        if (String(subData[i][1]) === String(phone)) {
          const subPlan = (subData[i][2] || "pro").toString().toLowerCase();
          return ContentService.createTextOutput(JSON.stringify({ ok: true, plan: subPlan }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Check Students sheet
    const studentSheet = ss.getSheetByName("Students");
    if (studentSheet) {
      const data = studentSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][2]) === String(phone)) {
          const plan = (data[i][7] || "free").toString().toLowerCase();
          return ContentService.createTextOutput(JSON.stringify({ ok: true, plan: plan }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, plan: "free" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 7. Coupon helper: action=coupon&code=...
  if (action === "coupon") {
    const code = (params.code || "").toUpperCase().trim();
    const couponSheet = ss.getSheetByName("Coupons");
    if (couponSheet) {
      const data = couponSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const rowCode = String(data[i][0] || "").toUpperCase().trim();
        const active = data[i][4] !== false && String(data[i][4]).toUpperCase() !== "FALSE";
        if (rowCode === code && active) {
          const discountPercent = parseInt(data[i][1] || "20", 10);
          return ContentService.createTextOutput(JSON.stringify({ ok: true, valid: true, discountPercent: discountPercent }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Fallback standard coupon
    if (code === "FRIEND20") {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, valid: true, discountPercent: 20 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, valid: false, discountPercent: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 8. Referrals helper: action=referrals&phone=...
  if (action === "referrals") {
    const phone = params.phone || "";
    let studentCoupon = null;
    let discountPercent = 20;
    let shareAmount = 150;

    // Look up coupon assigned to this phone
    const couponSheet = ss.getSheetByName("Coupons");
    if (couponSheet) {
      const data = couponSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const assignedPhone = String(data[i][5] || "");
        if (assignedPhone === phone) {
          studentCoupon = String(data[i][0] || "");
          discountPercent = parseInt(data[i][1] || "20", 10);
          shareAmount = parseInt(data[i][6] || "150", 10);
          break;
        }
      }
    }

    // Look up earnings in Referrals sheet
    let total = 0;
    let pending = 0;
    let paid = 0;
    const referralsList = [];

    const refSheet = ss.getSheetByName("Referrals");
    if (refSheet && studentCoupon) {
      const data = refSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]) === String(phone) || String(data[i][2]).toUpperCase() === studentCoupon.toUpperCase()) {
          const amount = parseInt(data[i][3] || "639", 10);
          const share = parseInt(data[i][4] || String(shareAmount), 10);
          const status = String(data[i][5] || "pending").toLowerCase();
          const rawBuyerPhone = String(data[i][6] || "");
          const maskedPhone = rawBuyerPhone.length >= 10
            ? rawBuyerPhone.slice(0, 2) + "****" + rawBuyerPhone.slice(-4)
            : "98****3210";

          total += share;
          if (status === "paid") {
            paid += share;
          } else {
            pending += share;
          }

          referralsList.push({
            id: `ref-${i}`,
            date: data[i][0] ? new Date(data[i][0]).toLocaleDateString() : "Recent",
            maskedPhone: maskedPhone,
            amount: amount,
            share: share,
            status: status === "paid" ? "paid" : "pending"
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      couponCode: studentCoupon,
      discountPercent: discountPercent,
      share: shareAmount,
      earnings: { total, pending, paid },
      referrals: referralsList
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 9. Student & Founder Login: action=login&phone=...&password=...
  if (action === "login") {
    const phone = String(params.phone || "").trim();
    const password = String(params.password || "");

    const studentSheet = ss.getSheetByName("Students");
    if (!studentSheet) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "no-account" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = studentSheet.getDataRange().getValues();
    let foundRow = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2]).trim() === phone) {
        foundRow = data[i];
        break;
      }
    }

    if (!foundRow) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "no-account" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const storedHash = String(foundRow[8] || "").trim();
    if (!storedHash) {
      // Pre-v4 user: needs password setup once
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "needs-password-setup" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const inputHash = computeHash(password);
    if (storedHash !== inputHash && storedHash !== password) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "wrong-password" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const isAdmin = Boolean(foundRow[9] === true || String(foundRow[9]).toLowerCase() === "true");

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      student: {
        name: foundRow[1],
        phone: foundRow[2],
        district: foundRow[3],
        standard: foundRow[4],
        stream: foundRow[5] || "",
        medium: foundRow[6] || "english",
        plan: (foundRow[7] || "free").toString().toLowerCase(),
        isAdmin: isAdmin
      }
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 10. Admin Telemetry Stats: action=stats&phone=...&password=...
  if (action === "stats") {
    const adminPhone = String(params.phone || params.adminPhone || "").trim();
    const adminPass = String(params.password || params.adminPassword || "");

    if (!verifyAdmin(ss, adminPhone, adminPass)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Compute stats
    let studentsTotal = 0;
    let proTotal = 0;
    let liveTotal = 0;
    const studentSheet = ss.getSheetByName("Students");
    if (studentSheet) {
      const sData = studentSheet.getDataRange().getValues();
      studentsTotal = Math.max(0, sData.length - 1);
      for (let i = 1; i < sData.length; i++) {
        const p = String(sData[i][7] || "").toLowerCase();
        if (p === "pro") proTotal++;
        if (p === "live") liveTotal++;
      }
    }

    let testsTaken = 0;
    const scoresSheet = ss.getSheetByName("Scores");
    if (scoresSheet) {
      testsTaken = Math.max(0, scoresSheet.getDataRange().getValues().length - 1);
    }

    let revenueTotal = 0;
    let revenueThisMonth = 0;
    let paymentsCount = 0;
    let couponsUsed = 0;

    const subSheet = ss.getSheetByName("Subscriptions");
    if (subSheet) {
      const subData = subSheet.getDataRange().getValues();
      paymentsCount = Math.max(0, subData.length - 1);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      for (let i = 1; i < subData.length; i++) {
        const amt = parseInt(subData[i][3] || "0", 10) || 0;
        revenueTotal += amt;
        const rowDate = subData[i][0] ? new Date(subData[i][0]) : null;
        if (rowDate && rowDate.getFullYear() === currentYear && rowDate.getMonth() === currentMonth) {
          revenueThisMonth += amt;
        }
        if (subData[i][6]) {
          couponsUsed++;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      stats: {
        studentsTotal: studentsTotal,
        proTotal: proTotal,
        liveTotal: liveTotal,
        testsTaken: testsTaken,
        revenueTotal: revenueTotal,
        revenueThisMonth: revenueThisMonth,
        paymentsCount: paymentsCount,
        couponsUsed: couponsUsed
      }
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 11. Admin Students List: action=adminstudents&phone=...&password=...
  if (action === "adminstudents") {
    const adminPhone = String(params.phone || params.adminPhone || "").trim();
    const adminPass = String(params.password || params.adminPassword || "");

    if (!verifyAdmin(ss, adminPhone, adminPass)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const studentSheet = ss.getSheetByName("Students");
    const studentsList = [];
    if (studentSheet) {
      const data = studentSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const rawPhone = String(data[i][2] || "").trim();
        // Mask phone server-side: xxxxx4830
        const masked = rawPhone.length >= 10
          ? "xxxxx" + rawPhone.slice(-4)
          : "xxxxx";

        studentsList.push({
          joined: data[i][0] ? new Date(data[i][0]).toISOString().split("T")[0] : "Recent",
          name: data[i][1],
          phone: masked,
          standard: data[i][4],
          stream: data[i][5] || "—",
          medium: data[i][6] || "english",
          plan: (data[i][7] || "free").toString().toLowerCase()
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      students: studentsList
    })).setMimeType(ContentService.MimeType.JSON);
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

    // 1. Register Student (v4: with password hash)
    if (payload.type === "student") {
      let sheet = ss.getSheetByName("Students");
      if (!sheet) {
        sheet = ss.insertSheet("Students");
        sheet.appendRow(["Timestamp", "Name", "Phone", "District", "Standard", "Stream", "Medium", "Plan", "PasswordHash", "IsAdmin"]);
      }

      const passHash = payload.password ? computeHash(payload.password) : "";

      sheet.appendRow([
        new Date().toISOString(),
        payload.name,
        payload.phone,
        payload.district,
        payload.standard,
        payload.stream || "",
        payload.medium,
        "free",
        passHash,
        false
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

    // 3. Record Verified Payment & Subscription
    if (payload.type === "payment") {
      let subSheet = ss.getSheetByName("Subscriptions");
      if (!subSheet) {
        subSheet = ss.insertSheet("Subscriptions");
        subSheet.appendRow(["Timestamp", "Phone", "Plan", "Amount", "PaymentId", "OrderId", "CouponCode", "Status"]);
      }

      subSheet.appendRow([
        new Date().toISOString(),
        payload.phone,
        payload.plan || "pro",
        payload.amount,
        payload.paymentId,
        payload.orderId || "",
        payload.couponCode || "",
        "active"
      ]);

      // Update Student's plan in Students sheet
      let stSheet = ss.getSheetByName("Students");
      if (stSheet) {
        const stData = stSheet.getDataRange().getValues();
        for (let i = 1; i < stData.length; i++) {
          if (String(stData[i][2]) === String(payload.phone)) {
            stSheet.getRange(i + 1, 8).setValue(payload.plan || "pro");
            break;
          }
        }
      }

      // If coupon used, record referral share in Referrals sheet
      if (payload.couponCode) {
        let refSheet = ss.getSheetByName("Referrals");
        if (!refSheet) {
          refSheet = ss.insertSheet("Referrals");
          refSheet.appendRow(["Timestamp", "ReferrerPhone", "CouponCode", "Amount", "ShareAmount", "Status", "BuyerPhone"]);
        }

        // Look up referrer phone from coupon
        let referrerPhone = "";
        let shareAmount = 150;
        const couponSheet = ss.getSheetByName("Coupons");
        if (couponSheet) {
          const cData = couponSheet.getDataRange().getValues();
          for (let i = 1; i < cData.length; i++) {
            if (String(cData[i][0]).toUpperCase() === payload.couponCode.toUpperCase()) {
              referrerPhone = String(cData[i][5] || "");
              shareAmount = parseInt(cData[i][6] || "150", 10);
              break;
            }
          }
        }

        refSheet.appendRow([
          new Date().toISOString(),
          referrerPhone,
          payload.couponCode,
          payload.amount,
          shareAmount,
          "pending",
          payload.phone
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, subscriptionRecorded: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Waitlist Entry
    if (payload.type === "waitlist") {
      let sheet = ss.getSheetByName("Waitlist");
      if (!sheet) {
        sheet = ss.insertSheet("Waitlist");
        sheet.appendRow(["Timestamp", "Name", "Phone", "Plan"]);
      }

      sheet.appendRow([
        new Date().toISOString(),
        payload.name || "",
        payload.phone || "",
        payload.plan || "Pro"
      ]);

      return ContentService.createTextOutput(JSON.stringify({ ok: true, waitlistRecorded: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Set Student Password: type=set-password
    if (payload.type === "set-password") {
      const studentSheet = ss.getSheetByName("Students");
      if (!studentSheet) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "no-account" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = studentSheet.getDataRange().getValues();
      const phone = String(payload.phone || "").trim();
      const newHash = computeHash(payload.password);
      let updated = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][2]).trim() === phone) {
          studentSheet.getRange(i + 1, 9).setValue(newHash);
          updated = true;
          break;
        }
      }

      if (!updated) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "no-account" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Change Admin Password: type=admin-password
    if (payload.type === "admin-password") {
      const adminPhone = String(payload.adminPhone || "").trim();
      const oldPassword = String(payload.oldPassword || "");
      const newPassword = String(payload.newPassword || "");

      if (!verifyAdmin(ss, adminPhone, oldPassword)) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const studentSheet = ss.getSheetByName("Students");
      const newHash = computeHash(newPassword);

      if (studentSheet) {
        const data = studentSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][2]).trim() === adminPhone) {
            studentSheet.getRange(i + 1, 9).setValue(newHash);
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 7. Add Material from Founder Console: type=admin-material
    if (payload.type === "admin-material") {
      const adminPhone = String(payload.adminPhone || "").trim();
      const adminPass = String(payload.adminPassword || "");

      if (!verifyAdmin(ss, adminPhone, adminPass)) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const tab = payload.tab;
      const row = payload.row || {};

      if (tab === "Papers") {
        let sheet = ss.getSheetByName("Papers");
        if (!sheet) {
          sheet = ss.insertSheet("Papers");
          sheet.appendRow(["ID", "ClassLevel", "Category", "Subject", "Exam", "Year", "Medium", "Title", "DriveFileId", "Featured", "Plan"]);
        }
        const id = `paper-${Date.now()}`;
        sheet.appendRow([
          id,
          row.classLevel,
          row.category,
          row.subject,
          row.exam || "Public",
          row.year || "2024",
          row.medium || "tamil",
          row.title,
          row.driveFileId,
          false,
          row.plan || "free"
        ]);
        return ContentService.createTextOutput(JSON.stringify({ ok: true, id: id }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      if (tab === "News") {
        let sheet = ss.getSheetByName("News");
        if (!sheet) {
          sheet = ss.insertSheet("News");
          sheet.appendRow(["ID", "Title", "Date", "Category", "Summary", "Body", "SourceUrl", "ImageUrl", "Pinned"]);
        }
        const id = `news-${Date.now()}`;
        sheet.appendRow([
          id,
          row.title,
          row.date || new Date().toISOString().split("T")[0],
          row.category || "General",
          row.summary,
          row.body || "",
          row.sourceUrl || "",
          row.imageUrl || "",
          Boolean(row.pinned)
        ]);
        return ContentService.createTextOutput(JSON.stringify({ ok: true, id: id }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      if (tab === "Questions") {
        let sheet = ss.getSheetByName("Questions");
        if (!sheet) {
          sheet = ss.insertSheet("Questions");
          sheet.appendRow(["ID", "ClassLevel", "Subject", "Chapter", "Type", "Options", "Ans1", "Ans2", "Ans3", "AnswerIndex", "Explanation", "Medium", "Plan"]);
        }
        const id = `q-${Date.now()}`;
        const optionsStr = JSON.stringify(row.options || []);
        sheet.appendRow([
          id,
          row.classLevel,
          row.subject,
          row.chapter || "",
          row.type || "oneword",
          optionsStr,
          "",
          "",
          "",
          row.answerIndex || 0,
          row.explanation || "",
          row.medium || "tamil",
          row.plan || "free"
        ]);
        return ContentService.createTextOutput(JSON.stringify({ ok: true, id: id }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Invalid tab" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unknown payload type" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * SHA-256 password hash utility for Google Apps Script
 */
function computeHash(input) {
  if (!input) return "";
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input), Utilities.Charset.UTF_8);
  let hashStr = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let hex = byteVal.toString(16);
    if (hex.length === 1) hex = "0" + hex;
    hashStr += hex;
  }
  return hashStr;
}

/**
 * Verify founder admin credentials from Students sheet
 */
function verifyAdmin(ss, phone, password) {
  if (!phone || !password) return false;
  const sheet = ss.getSheetByName("Students");
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  const inputHash = computeHash(password);

  for (let i = 1; i < data.length; i++) {
    const rowPhone = String(data[i][2]).trim();
    if (rowPhone === phone) {
      const storedHash = String(data[i][8] || "").trim();
      const isAdmin = data[i][9] === true || String(data[i][9]).toLowerCase() === "true";
      if (isAdmin && (storedHash === inputHash || storedHash === password)) {
        return true;
      }
    }
  }
  return false;
}
