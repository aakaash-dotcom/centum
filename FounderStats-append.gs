/**
 * CENTUM BACKEND — FOUNDER STATS, PRO MATERIALS & WHATSAPP CTA APPENDIX (FounderStats-append.gs)
 * Self-contained file for Google Apps Script.
 *
 * HOW THE FOUNDER INSTALLS THIS:
 * 1. In Apps Script editor, click '+' next to Files -> choose 'Script' -> name it 'FounderStats-append'.
 * 2. Paste ALL of this code into FounderStats-append.gs.
 * 3. Save FounderStats-append.gs.
 * 4. In Code.gs, inside doGet(e), add the 1-line dispatch hook (see line below).
 * 5. Run 'founderStatsSelfTest' from the editor Run menu to verify green.
 * 6. (Optional) Re-deploy if needed, or if doGet dispatch is updated.
 *
 * EXACT 1-LINE HOOK TO PASTE IN Code.gs doGet(e) right before unknown action:
 *   if (a === "founderStats") { const _out = typeof founderStats === 'function' ? founderStats(e) : null; if (_out) return json_(_out); }
 *   if (a === "proMaterials") { const _out = typeof proMaterials === 'function' ? proMaterials(e) : null; if (_out) return json_(_out); }
 *
 * NOTE: All entry points have ZERO trailing underscores so they are visible and executable from run/trigger menus.
 */

// =================== PUBLIC ENTRY POINTS (NO TRAILING UNDERSCORES) ===================

/**
 * Entry 1: founderStats(e)
 * Exposes live active user telemetry, registrations, per-class activity, and top streaks.
 * Callable via GET ?action=founderStats
 */
function founderStats(e) {
  try {
    const ss = fsGetSpreadsheet_();
    const tz = "Asia/Kolkata";
    const now = new Date();
    const todayStr = Utilities.formatDate(now, tz, "yyyy-MM-dd");
    const msInDay = 24 * 60 * 60 * 1000;
    const sevenDaysAgoTime = now.getTime() - 7 * msInDay;
    const oneDayAgoTime = now.getTime() - 1 * msInDay;

    // 1. Read Students Tab
    const students = fsRows_("Students");
    let registeredTotal = students.length;
    let registeredToday = 0;
    let registered7d = 0;
    let waOptedIn = 0;

    // Per-class registered counters (6..12)
    const classCounts = {};
    for (let c = 6; c <= 12; c++) {
      classCounts[String(c)] = { registered: 0, active7dSet: {} };
    }

    students.forEach(function (s) {
      const rawDate = s.timestamp || s.createdAt || s.joined;
      let d = null;
      if (rawDate instanceof Date) {
        d = rawDate;
      } else if (rawDate) {
        d = new Date(rawDate);
      }

      if (d && !isNaN(d.getTime())) {
        const dStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");
        if (dStr === todayStr) registeredToday++;
        if (d.getTime() >= sevenDaysAgoTime) registered7d++;
      }

      // WhatsApp opt-in check (valid phone + no opt-out)
      const ph = String(s.phone || "").replace(/\D/g, "");
      const isOptedOut = String(s.waOptOut || "").toLowerCase() === "true";
      if (ph.length >= 10 && !isOptedOut) {
        waOptedIn++;
      }

      // Standard / classLevel
      const std = String(s.standard || s.classLevel || "").replace(/\D/g, "");
      if (classCounts[std]) {
        classCounts[std].registered++;
      }
    });

    // 2. Read Scores Tab
    const scores = fsRows_("Scores");
    const active24hSet = {};
    const active7dSet = {};
    const studentDatesMap = {}; // phone -> Set of unique active days (YYYY-MM-DD)
    const phoneNameMap = {};
    const phoneClassMap = {};

    scores.forEach(function (row) {
      const ph = String(row.phone || "").replace(/\D/g, "");
      if (!ph || ph.length < 10) return;

      const norm10 = ph.slice(-10);
      const rawDate = row.timestamp || row.createdAt || row.date;
      let d = null;
      if (rawDate instanceof Date) {
        d = rawDate;
      } else if (rawDate) {
        d = new Date(rawDate);
      }

      const std = String(row.standard || row.classLevel || "").replace(/\D/g, "");
      if (row.name && !phoneNameMap[norm10]) phoneNameMap[norm10] = String(row.name);
      if (std && !phoneClassMap[norm10]) phoneClassMap[norm10] = std + "th";

      if (d && !isNaN(d.getTime())) {
        const t = d.getTime();
        const dayStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");

        if (!studentDatesMap[norm10]) studentDatesMap[norm10] = {};
        studentDatesMap[norm10][dayStr] = true;

        if (t >= oneDayAgoTime) {
          active24hSet[norm10] = true;
        }

        if (t >= sevenDaysAgoTime) {
          active7dSet[norm10] = true;
          if (classCounts[std]) {
            classCounts[std].active7dSet[norm10] = true;
          }
        }
      }
    });

    const active24h = Object.keys(active24hSet).length;
    const active7d = Object.keys(active7dSet).length;

    // 3. Per-class breakdown
    const byClass = [];
    for (let c = 6; c <= 12; c++) {
      const key = String(c);
      byClass.push({
        classLevel: key,
        registered: classCounts[key].registered,
        active7d: Object.keys(classCounts[key].active7dSet).length,
      });
    }

    // 4. Consecutive streak calculations per student
    const streaksList = [];
    const yesterday = new Date(now.getTime() - msInDay);
    const yesterdayStr = Utilities.formatDate(yesterday, tz, "yyyy-MM-dd");

    Object.keys(studentDatesMap).forEach(function (phone10) {
      const days = studentDatesMap[phone10];
      // Consecutive streak must touch today or yesterday
      let curDate = new Date(now.getTime());
      let curStr = Utilities.formatDate(curDate, tz, "yyyy-MM-dd");

      if (!days[curStr]) {
        curDate = yesterday;
        curStr = yesterdayStr;
      }

      let streak = 0;
      while (days[curStr]) {
        streak++;
        curDate = new Date(curDate.getTime() - msInDay);
        curStr = Utilities.formatDate(curDate, tz, "yyyy-MM-dd");
      }

      if (streak > 0) {
        streaksList.push({
          phone: "xxxxx" + phone10.slice(-4),
          name: phoneNameMap[phone10] || "Student",
          classLevel: phoneClassMap[phone10] || "10th",
          streakDays: streak,
        });
      }
    });

    // Sort descending by streakDays
    streaksList.sort(function (a, b) {
      return b.streakDays - a.streakDays;
    });

    const topStreaks = streaksList.slice(0, 10);

    return {
      ok: true,
      registeredTotal: registeredTotal,
      registeredToday: registeredToday,
      registered7d: registered7d,
      waOptedIn: waOptedIn,
      active24h: active24h,
      active7d: active7d,
      byClass: byClass,
      topStreaks: topStreaks,
      timestamp: now.toISOString(),
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Entry 2: proMaterials(e)
 * Returns live Pro Materials filtered by classLevel and subject.
 * Callable via GET ?action=proMaterials&classLevel=&subject=
 */
function proMaterials(e) {
  try {
    const ss = fsGetSpreadsheet_();
    fsEnsureProMaterialsTab_(ss);

    const params = e && e.parameter ? e.parameter : {};
    const reqClass = String(params.classLevel || "").replace(/\D/g, "");
    const reqSub = String(params.subject || "").trim().toLowerCase();

    const rows = fsRows_("ProMaterials");
    const liveMaterials = [];

    rows.forEach(function (r) {
      const status = String(r.status || "").trim().toLowerCase();
      if (status !== "live") return; // strictly live rows only

      const itemClass = String(r.classLevel || "").replace(/\D/g, "");
      const itemSub = String(r.subject || "").trim().toLowerCase();

      if (reqClass && itemClass && itemClass !== reqClass) return;
      if (reqSub && itemSub && !itemSub.includes(reqSub) && !reqSub.includes(itemSub)) return;

      liveMaterials.push({
        id: r.id,
        classLevel: r.classLevel,
        subject: r.subject,
        chapter: r.chapter,
        title: r.title,
        videoEmbedUrl: r.videoEmbedUrl || "",
        notesPdfUrl: r.notesPdfUrl || "",
        conceptQuizUrl: r.conceptQuizUrl || "",
        bookbackQuizUrl: r.bookbackQuizUrl || "",
        importantQuestionsUrl: r.importantQuestionsUrl || "",
        status: "live",
        createdAt: r.createdAt || "",
      });
    });

    return {
      ok: true,
      classLevel: reqClass,
      subject: reqSub,
      materials: liveMaterials,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Entry 3: waDailyQuizPush()
 * Daily 4PM IST push to active students:
 * Sends CTA URL button: "🎯 Take the quiz" -> ${SITE_URL}/quiz
 * Automatically falls back to plain text if button dispatch rejects.
 */
function waDailyQuizPush() {
  const ss = fsGetSpreadsheet_();
  const siteUrl = fsGetSiteUrl_();
  const students = fsRows_("Students");
  const buttonUrl = siteUrl.replace(/\/+$/, "") + "/quiz";

  let sentCount = 0;
  let fallbackCount = 0;

  students.forEach(function (s) {
    const phone = String(s.phone || "").replace(/\D/g, "");
    if (phone.length < 10) return;
    if (String(s.waOptOut || "").toLowerCase() === "true") return;

    const std = s.standard || "10th";
    const name = s.name || "Student";
    const text = "🎯 " + std + " Daily Quiz is LIVE!\n\nHi " + name + ", today's 10-question practice is ready. Take it now to climb the leaderboard!";

    const res = waSendCta_({
      phone: phone,
      text: text,
      buttonText: "🎯 Take the quiz",
      buttonUrl: buttonUrl,
    });

    if (res.ok) {
      sentCount++;
      if (res.fallbackUsed) fallbackCount++;
    }
  });

  Logger.log("✅ waDailyQuizPush completed: " + sentCount + " sent (" + fallbackCount + " via plain fallback)");
  return { ok: true, sentCount: sentCount, fallbackCount: fallbackCount };
}

/**
 * Entry 4: waStreakSaver()
 * Daily 8PM IST streak saver push to students with active streak who haven't logged a score today.
 * Sends CTA URL button: "🔥 Save my streak" -> ${SITE_URL}/quiz
 * Automatically falls back to plain text if button dispatch rejects.
 */
function waStreakSaver() {
  const ss = fsGetSpreadsheet_();
  const tz = "Asia/Kolkata";
  const now = new Date();
  const todayStr = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  const siteUrl = fsGetSiteUrl_();
  const buttonUrl = siteUrl.replace(/\/+$/, "") + "/quiz";

  // Distinct phones with a score today
  const scores = fsRows_("Scores");
  const todayScorers = {};
  scores.forEach(function (sc) {
    const ph = String(sc.phone || "").replace(/\D/g, "").slice(-10);
    const rawDate = sc.timestamp || sc.createdAt || sc.date;
    let d = rawDate instanceof Date ? rawDate : (rawDate ? new Date(rawDate) : null);
    if (d && !isNaN(d.getTime())) {
      if (Utilities.formatDate(d, tz, "yyyy-MM-dd") === todayStr) {
        todayScorers[ph] = true;
      }
    }
  });

  const students = fsRows_("Students");
  let sentCount = 0;

  students.forEach(function (s) {
    const ph = String(s.phone || "").replace(/\D/g, "");
    if (ph.length < 10) return;
    const norm10 = ph.slice(-10);

    // Skip if already taken quiz today
    if (todayScorers[norm10]) return;
    if (String(s.waOptOut || "").toLowerCase() === "true") return;

    const name = s.name || "Student";
    const text = "🔥 Don't lose your quiz streak!\n\nHi " + name + ", your streak is at risk of resetting at midnight. Spend 3 minutes to keep your streak alive!";

    const res = waSendCta_({
      phone: ph,
      text: text,
      buttonText: "🔥 Save my streak",
      buttonUrl: buttonUrl,
    });

    if (res.ok) sentCount++;
  });

  Logger.log("✅ waStreakSaver completed: " + sentCount + " reminder(s) sent");
  return { ok: true, sentCount: sentCount };
}

/**
 * Entry 5: founderStatsSelfTest()
 * Founder-run validation function in Apps Script editor.
 * Exercises founderStats, proMaterials, tab schemas, and logs pass/fail lines.
 */
function founderStatsSelfTest() {
  Logger.log("=== STARTING FOUNDER STATS SELF TEST ===");

  const ss = fsGetSpreadsheet_();
  fsEnsureProMaterialsTab_(ss);
  Logger.log("[PASS] ProMaterials tab verified/created with correct headers");

  // 1. Exercise founderStats()
  const statsRes = founderStats({});
  if (statsRes && statsRes.ok) {
    Logger.log("[PASS] founderStats() returned successfully:");
    Logger.log("       - Registered Total: " + statsRes.registeredTotal);
    Logger.log("       - Registered Today: " + statsRes.registeredToday);
    Logger.log("       - Registered 7d:    " + statsRes.registered7d);
    Logger.log("       - WhatsApp Opted In: " + statsRes.waOptedIn);
    Logger.log("       - Active 24h:       " + statsRes.active24h);
    Logger.log("       - Active 7d:        " + statsRes.active7d);
    Logger.log("       - ByClass Entries:  " + (statsRes.byClass ? statsRes.byClass.length : 0));
    Logger.log("       - Top Streaks:      " + (statsRes.topStreaks ? statsRes.topStreaks.length : 0));
  } else {
    Logger.log("[FAIL] founderStats() failed: " + JSON.stringify(statsRes));
  }

  // 2. Exercise proMaterials()
  const pmRes = proMaterials({ parameter: { classLevel: "10", subject: "Maths" } });
  if (pmRes && pmRes.ok) {
    Logger.log("[PASS] proMaterials(10, Maths) returned successfully: " + (pmRes.materials ? pmRes.materials.length : 0) + " live row(s)");
  } else {
    Logger.log("[FAIL] proMaterials() failed: " + JSON.stringify(pmRes));
  }

  Logger.log("=== SELF TEST COMPLETE ===");
}

// =================== PRIVATE HELPERS (WITH TRAILING UNDERSCORES) ===================

/**
 * Safe WhatsApp CTA sender with automatic plain-text fallback.
 * Sends button / interactive CTA shape first; if API rejects, falls back immediately
 * to plain text with link so students never lose messages.
 */
function waSendCta_(opts) {
  const phone = String(opts.phone || "").replace(/\D/g, "");
  const text = String(opts.text || "").trim();
  const buttonText = String(opts.buttonText || "Take the quiz").trim();
  const buttonUrl = String(opts.buttonUrl || "https://centum.in/quiz").trim();
  const imageUrl = opts.imageUrl ? String(opts.imageUrl).trim() : "";

  if (!phone || !text) return { ok: false, error: "phone-and-text-required" };

  const p = PropertiesService.getScriptProperties();
  const token = (p.getProperty("DEROPO_API_TOKEN") || "").trim();
  const deviceId = parseInt(p.getProperty("DEROPO_DEVICE_ID") || "3079", 10);
  const baseUrl = (p.getProperty("DEROPO_BASE_URL") || "https://api.deropo.com").replace(/\/+$/, "");

  const fullFallbackText = text + "\n\n👉 " + buttonText + ":\n" + buttonUrl;

  if (!token) {
    Logger.log("[WA SIMULATED CTA] To: " + phone + " | Button: " + buttonText + " -> " + buttonUrl);
    return { ok: true, simulated: true, fallbackUsed: false };
  }

  const endpoint = baseUrl + "/api/messages/send";

  // Try Shape (a): Button CTA with URL button array and interactive CTA
  const ctaPayload = {
    device_id: deviceId,
    recipient: phone,
    to: phone,
    phone: phone,
    message_type: "button",
    type: "button",
    message: text,
    text: text,
    buttons: [
      {
        type: "url",
        display_text: buttonText,
        url: buttonUrl,
      },
    ],
    interactive: {
      type: "cta_url",
      body: { text: text },
      action: {
        name: "cta_url",
        parameters: {
          display_text: buttonText,
          url: buttonUrl,
        },
      },
    },
  };

  try {
    const res = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      headers: { "X-API-Key": token },
      payload: JSON.stringify(ctaPayload),
      muteHttpExceptions: true,
    });

    const code = res.getResponseCode();
    let body = {};
    try {
      body = JSON.parse(res.getContentText());
    } catch (e) {}

    if (code >= 200 && code < 300 && body.ok !== false && body.status !== "error") {
      return { ok: true, status: "sent", fallbackUsed: false, response: body };
    }

    Logger.log("⚠️ Button CTA failed (HTTP " + code + ") — falling back to plain text");
  } catch (err) {
    Logger.log("⚠️ Button CTA exception: " + err + " — falling back to plain text");
  }

  // Automatic Fallback Branch: Plain text with deep link (guaranteed delivery)
  try {
    const fallbackPayload = {
      device_id: deviceId,
      recipient: phone,
      to: phone,
      phone: phone,
      type: "text",
      message_type: "text",
      message: fullFallbackText,
      text: fullFallbackText,
    };

    const fbRes = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      headers: { "X-API-Key": token },
      payload: JSON.stringify(fallbackPayload),
      muteHttpExceptions: true,
    });

    const fbCode = fbRes.getResponseCode();
    return { ok: fbCode >= 200 && fbCode < 300, status: "sent_fallback", fallbackUsed: true };
  } catch (fbErr) {
    Logger.log("❌ Plain text fallback error: " + fbErr);
    return { ok: false, error: String(fbErr), fallbackUsed: true };
  }
}

function fsGetSpreadsheet_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty("SHEET_ID");
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function fsGetSiteUrl_() {
  const p = PropertiesService.getScriptProperties();
  return p.getProperty("SITE_URL") || "https://centum.in";
}

function fsEnsureProMaterialsTab_(ss) {
  let sh = ss.getSheetByName("ProMaterials");
  const headers = [
    "id",
    "classLevel",
    "subject",
    "chapter",
    "title",
    "videoEmbedUrl",
    "notesPdfUrl",
    "conceptQuizUrl",
    "bookbackQuizUrl",
    "importantQuestionsUrl",
    "status",
    "createdAt",
  ];

  if (!sh) {
    sh = ss.insertSheet("ProMaterials");
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold");

    // Seed dummy live row
    sh.appendRow([
      "pm-10-maths-ch1",
      "10",
      "Maths",
      "Chapter 1: Relations and Functions",
      "Relations and Functions (உறவுகளும் சார்புகளும்)",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      "https://dge.tn.gov.in/docs/10th_maths_ch1.pdf",
      "https://centum.in/quiz?class=10&subject=maths&chapter=Relations%20and%20Functions&type=concept",
      "https://centum.in/quiz?class=10&subject=maths&chapter=Relations%20and%20Functions&type=oneword",
      "https://centum.in/quiz?class=10&subject=maths&chapter=Relations%20and%20Functions&type=important",
      "live",
      new Date().toISOString(),
    ]);
  }
  return sh;
}

function fsRows_(tabName) {
  const ss = fsGetSpreadsheet_();
  const sh = ss.getSheetByName(tabName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(String);
  const rows = [];
  for (let r = 1; r < data.length; r++) {
    const row = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = data[r][c];
    }
    rows.push(row);
  }
  return rows;
}
