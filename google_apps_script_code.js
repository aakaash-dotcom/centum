/**
 * CENTUM Backend v5.2 — founder-scheduled home quiz + today-quiz (includes v5.1 fully)
 * Paste ALL over v5.1 → Deploy → Manage deployments → edit (✏️) → New version → Deploy.
 *
 * New in v5.2:
 *  - GET action=today-quiz&classLevel=10th&medium=english[&date=YYYY-MM-DD] (public read, no key)
 *    Reads QuizSchedule tab (date | classLevel | medium | subject | chapter | type | count)
 *    Returns { ok: true, quiz: {...} } or { ok: true, quiz: null }
 *  - QuizSchedule tab added to SCHEMA (auto-whitelisted for ops-schema, ops-rows, ops-add, ops-add_many, ops-set, ops-delete)
 *    Created idempotently if missing.
 *
 * Previous v5.1 notes:
 * Paste ALL over v5 → Deploy → Manage deployments → edit → New version → Deploy.
 * Then OPTIONALLY run `installCentumTriggers` ONCE to arm the 6AM auto daily-quiz.
 * (NO setupCentum re-run — no new tabs.)
 *
 * New in v5.1:
 *  - GET action=ops-import&tab=Questions&rows=<urlenc JSON array, ≤50> → validated + deduped
 *    bulk add (same rules as the menu importer), returns per-row added/skipped reasons
 *  - dailyQuizAuto_(): daily 6AM IST trigger seeds DailyQuiz per classLevel×medium from the
 *    Questions bank (random, not repeated in the last 60)
 *
 * Previous v5 notes:
 * Paste ALL of this over v4.2, RUN `setupCentum` ONCE (adds the NEW "CoinLedger" tab — safe,
 * never deletes), then Deploy → Manage deployments → edit → New version → Deploy.
 *
 * New in v5:
 *  - CoinLedger tab: single source of truth for every coin movement (walking balance)
 *  - GET  action=coins&phone                → balance + recent activity
 *  - POST type=coin-earn {phone,reason,ref} → server-enforced caps (see COIN_RULES)
 *  - POST type=coin-spend {phone,reason,ref,amount} → balance-checked spend (avatars)
 *  - POST type=referral-code {phone,name}   → idempotent auto-generated code in Coupons
 *      · registration with source=<code> credits owner 20 coins ("referral-signup")
 *      · when that friend logs ≥3 quizzes across ≥2 days → owner gets 80 coins ("referral-qualified")
 *  - couponGuard: referral codes (0% discount) are NOT valid checkout discounts
 *
 * Previous v4.2 notes:
 * Paste ALL of this over v4.1, then Deploy → Manage deployments → edit → New version → Deploy.
 * (NO setupCentum re-run needed — no new tabs/columns.)
 *
 * New in v4.2: write-ops ALSO via GET (some networks block POST to Google Apps Script):
 *  - GET action=ops-add&tab=X&row=<urlencoded JSON object>
 *  - GET action=ops-delete&tab=X&col=Y&value=Z[&all=1][&confirm=yes-admin-change]
 *  - GET action=ops-set&tab=X&col=Y&value=Z&setCol=A&setValue=B[&all=1][&confirm=...]
 * (POST versions from v4.1 still work for browser/app traffic.)
 *
 * Previous v4.1 notes:
 *
 * New in v4.1 (key-guarded, for the Arena agent to manage sheet data directly):
 *  - GET  action=ops-schema                      → every tab: headers + row counts
 *  - GET  action=ops-rows&tab=X                  → raw rows of any tab
 *  - POST type=ops-add    {tab, row:{col:val}}   → append a row (mapped to headers)
 *  - POST type=ops-delete {tab, col, value, all} → delete matching row(s) — reversed loop, safe
 *  - POST type=ops-set    {tab, col, value, setCol, setValue, all} → update matching row(s)
 *  - Admins tab is guarded: ops-delete/ops-set need confirm:"yes-admin-change"
 *
 * Previous v4 notes:
 * Replaces Code.gs entirely. Paste ALL of this (replacing v3), Run `setupCentum` ONCE
 * (SAFE: only adds columns/tabs/seeds — never deletes), then Deploy → Manage deployments
 * → edit → New version → Deploy.
 *
 * New in v4:
 *  - Students.passwordHash (salted SHA-256; existing students have EMPTY hash → app prompts set-password)
 *  - Admins tab (founder seeded: phone 6380444830, TEMP password "centum-admin-2026" — change it from /admin!)
 *  - ?action=login · ?action=stats · ?action=adminstudents (admin endpoints require phone+password)
 *  - POST type=set-password · type=admin-password · type=admin-material
 *  - Import tab + spreadsheet menu "CENTUM ▸ Import questions from Import tab" (paste AI JSON)
 */

const TZ = "Asia/Kolkata";
const APP_NAME = "CENTUM DB";
const DRIVE_FOLDER_NAME = "CENTUM Papers";

const SCHEMA = {
  Papers:        ["id","classLevel","category","subject","exam","year","medium","title","driveFileId","featured","plan"],
  News:          ["id","title","date","category","summary","body","sourceUrl","imageUrl","pinned"],
  Questions:     ["id","classLevel","subject","chapter","type","question","options","answerIndex","explanation","medium","plan"],
  DailyQuiz:     ["date","classLevel","stream","subject","chapter","question","options","answerIndex","explanation","medium"],
  Students:      ["timestamp","name","phone","district","standard","stream","medium","source","plan","planExpiry","passwordHash"],
  Scores:        ["timestamp","phone","name","district","standard","subject","chapter","testType","score","total","seconds"],
  Waitlist:      ["timestamp","name","phone","plan","notes"],
  Coupons:       ["code","discountPercent","referrerName","referrerPhone","referrerUpi","active"],
  Referrals:     ["timestamp","code","buyerPhone","plan","amount","discountGiven","referrerShare","payoutStatus"],
  Subscriptions: ["timestamp","phone","plan","amount","paymentId","couponCode","status"],
  Admins:        ["phone","name","passwordHash","active"],
  CoinLedger:    ["timestamp","phone","delta","balance","reason","ref","note"],
  QuizSchedule:  ["date","classLevel","medium","subject","chapter","type","count"],
  Import:        ["help","json"]
};

function setupCentum() {
  const p = PropertiesService.getScriptProperties();
  let ss = p.getProperty("SHEET_ID") ? SpreadsheetApp.openById(p.getProperty("SHEET_ID")) : SpreadsheetApp.create(APP_NAME);
  if (!p.getProperty("SHEET_ID")) p.setProperty("SHEET_ID", ss.getId());

  Object.keys(SCHEMA).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    ensureHeaders_(sh, SCHEMA[name]);
    sh.setFrozenRows(1);
  });
  const def = ss.getSheetByName("Sheet1") || ss.getSheetByName("Sheet 1");
  if (def && def.getDataRange().getValues().flat().join("") === "") ss.deleteSheet(def);

  if (!p.getProperty("SECRET")) p.setProperty("SECRET", "centum-" + Utilities.getUuid().split("-").join("").slice(0, 20));
  if (!p.getProperty("DRIVE_FOLDER_ID")) {
    const folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    p.setProperty("DRIVE_FOLDER_ID", folder.getId());
    p.setProperty("DRIVE_FOLDER_URL", folder.getUrl());
  }

  backfill_(ss, "Students", "plan", "free");

  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  seedIfEmpty_(ss, "Papers", [["sslc-maths-2026-annual-em",10,"pyq","Mathematics","annual",2026,"English","REPLACE me — paste a real Drive ID","REPLACE_DRIVE_ID","TRUE","free"]]);
  seedIfEmpty_(ss, "News", [["n-demo-1","Welcome to Centum 💜",today,"general","Your news feed is live.","Body text here.","https://dge.tn.gov.in","","TRUE"]]);
  seedIfEmpty_(ss, "Questions", [["q-demo-1",10,"Mathematics","Numbers and Sequences","oneword","The LCM of 12 and 18 is","6|12|36|72","2","LCM = 2²×3² = 36","English","free"]]);
  seedIfEmpty_(ss, "DailyQuiz", [[today,10,"","Mathematics","Numbers and Sequences","The mean of the first 10 natural numbers is","5|5.5|6|10","1","Sum = 55 → mean = 5.5.","English"]]);
  seedIfEmpty_(ss, "Coupons", [["FRIEND20",20,"friend name","friend phone","friend upi id","TRUE"]]);
  seedIfEmpty_(ss, "Admins", [["6380444830","Founder", hash_("6380444830","centum-admin-2026"), "TRUE"]]);
  const imp = ss.getSheetByName("Import");
  if (imp && imp.getRange("A2").getValue() === "") {
    imp.getRange("A2").setValue("paste your AI JSON array here, then menu CENTUM ▸ Import questions");
    imp.setColumnWidths(1, 2, 420);
  }

  let rb = ss.getSheetByName("CONFIG_README"); if (!rb) rb = ss.insertSheet("CONFIG_README", 99);
  rb.clear();
  rb.getRange("A1:B10").setValues([
    ["🟣 CENTUM HANDBOOK (v4 — accounts+admin)",""],
    ["Script /exec URL = APPS_SCRIPT_URL","paste here for safe-keeping"],
    ["SECRET = APPS_SCRIPT_SECRET", p.getProperty("SECRET")],
    ["Your spreadsheet", ss.getUrl()],
    ["PDFs Drive folder", p.getProperty("DRIVE_FOLDER_URL")],
    ["Admin login","phone 6380444830 + password you set (starts as centum-admin-2026 — CHANGE IT in /admin)"],
    ["You edit","Papers · News · Questions · DailyQuiz · Coupons(payout status) · Import(for quiz JSON)"],
    ["App fills","Students · Scores · Waitlist · Subscriptions · Referrals"],
    ["Never edit hashes manually","Students.passwordHash + Admins.passwordHash are salted; use /admin or registration to change"],
    ["Plan columns","free|pro — Pro rows show 🔒 to free students"]
  ]);
  rb.getRange("A1:B1").setFontWeight("bold"); rb.setColumnWidths(1,2,400);
  Logger.log("✅ v4 ready. Secret: " + p.getProperty("SECRET"));
}

// =================== auth helpers ===================
function hash_(salt, password) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + "::" + password, Utilities.Charset.UTF_8);
  return raw.map(function (b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"); }).join("");
}
function adminOk_(phone, password) {
  const rows = rows_("Admins");
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].phone) === String(phone) && String(rows[i].active).toUpperCase() === "TRUE"
        && String(rows[i].passwordHash) === hash_(String(phone), String(password))) return true;
  }
  return false;
}
function findStudent_(phone) {
  const data = sheet_("Students").getDataRange().getValues();
  if (data.length < 2) return null;
  const h = data[0].map(String);
  for (let r = data.length - 1; r >= 1; r--) {
    if (String(data[r][h.indexOf("phone")]) === String(phone)) {
      return { row: r + 1, name: data[r][h.indexOf("name")], district: data[r][h.indexOf("district")],
        standard: data[r][h.indexOf("standard")], stream: data[r][h.indexOf("stream")] || "",
        medium: data[r][h.indexOf("medium")] || "english", plan: data[r][h.indexOf("plan")] || "free",
        passwordHash: String(data[r][h.indexOf("passwordHash")] || "") };
    }
  }
  return null;
}

// =================== endpoints ===================
function doGet(e) {
  autoSetup_();
  try {
    const a = e.parameter.action;
    // v5.2: public read action (key not required)
    if (a === "today-quiz") {
      return json_(todayQuiz_(e.parameter.classLevel, e.parameter.medium, e.parameter.date));
    }

    if ((e.parameter.key || "") !== getSecret_()) return json_({ ok: false, error: "unauthorized" });
    if (a === "papers")      return json_({ ok: true, papers: rows_("Papers") });
    if (a === "news")        return json_({ ok: true, news: rows_("News") });
    if (a === "questions")   return json_({ ok: true, questions: questionRows_() });
    if (a === "dailyquiz")   return json_({ ok: true, quiz: dailyQuiz_(e.parameter.classLevel, e.parameter.stream, e.parameter.medium) });
    if (a === "leaderboard") return json_(leaderboard_(e.parameter.standard, e.parameter.phone));
    if (a === "plan")        return json_(planFor_(e.parameter.phone));
    if (a === "coupon")      return json_(couponCheck_(e.parameter.code));
    if (a === "referrals")   return json_(referralsFor_(e.parameter.phone));

    if (a === "login") {
      const s = findStudent_(e.parameter.phone);
      if (!s) return json_({ ok: false, error: "no-account" });
      if (!s.passwordHash) return json_({ ok: false, error: "needs-password-setup" });
      if (s.passwordHash !== hash_(String(e.parameter.phone), String(e.parameter.password || "")))
        return json_({ ok: false, error: "wrong-password" });
      return json_({ ok: true, student: publicStudent_(s, e.parameter.phone), isAdmin: adminOk_(e.parameter.phone, e.parameter.password) });
    }

    if (a === "stats" || a === "adminstudents") {
      if (!adminOk_(e.parameter.adminPhone, e.parameter.adminPassword)) return json_({ ok: false, error: "admin-denied" });
      if (a === "adminstudents") {
        const out = rows_("Students").map(function (s) {
          const t = s.timestamp instanceof Date ? Utilities.formatDate(s.timestamp, TZ, "yyyy-MM-dd") : String(s.timestamp);
          const ph = String(s.phone || "");
          return { joined: t, name: s.name, phone: "xxxxx" + ph.slice(-4), standard: s.standard, stream: s.stream || "", medium: s.medium || "", plan: s.plan || "free" };
        }).reverse();
        return json_({ ok: true, students: out.slice(0, 500) });
      }
      const subs = rows_("Subscriptions").filter(function (s) { return String(s.status) !== "refunded"; });
      const now = new Date();
      const thisMonth = subs.filter(function (s) { const t = s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp); return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear(); });
      const students = rows_("Students");
      const sum = function (arr) { return arr.reduce(function (s, r) { return s + (Number(r.amount) || 0); }, 0); };
      return json_({ ok: true, stats: {
        studentsTotal: students.length,
        studentsPro: students.filter(function (s) { return s.plan === "pro"; }).length,
        studentsLive: students.filter(function (s) { return s.plan === "live"; }).length,
        scoresLogged: sheet_("Scores").getLastRow() - 1,
        revenueTotal: sum(subs), revenueMonth: sum(thisMonth), payments: subs.length,
        couponsUsed: sheet_("Referrals").getLastRow() - 1
      }});
    }
    // ---- v4.1 agent ops (key-guarded) ----
    if (a === "ops-schema") {
      ensureQuizSchedule_();
      const out = {};
      Object.keys(SCHEMA).forEach(function (t) {
        try { out[t] = { headers: SCHEMA[t], rows: Math.max(sheet_(t).getLastRow() - 1, 0) }; }
        catch (e) { out[t] = { headers: SCHEMA[t], rows: 0, note: "missing" }; }
      });
      return json_({ ok: true, tabs: out });
    }
    if (a === "ops-rows") {
      const tab = e.parameter.tab;
      if (!SCHEMA[tab]) return json_({ ok: false, error: "unknown-tab" });
      if (tab === "QuizSchedule") ensureQuizSchedule_();
      return json_({ ok: true, tab: tab, rows: rows_(tab) });
    }
    // ---- v4.2: GET write-ops (params mirror the POST bodies) ----
    if (a === "ops-add") {
      let rowObj; try { rowObj = JSON.parse(e.parameter.row || "{}"); } catch (err) { return json_({ ok: false, error: "row-json-parse" }); }
      return opsAdd_({ tab: e.parameter.tab, row: rowObj });
    }
    if (a === "ops-add_many") {
      let rowsArr; try { rowsArr = JSON.parse(e.parameter.rows || "[]"); } catch (err) { return json_({ ok: false, error: "rows-json-parse" }); }
      return opsAddMany_({ tab: e.parameter.tab, rows: rowsArr });
    }
    if (a === "ops-delete") {
      return opsDelete_({ tab: e.parameter.tab, col: e.parameter.col, value: e.parameter.value,
        all: String(e.parameter.all || "") === "1" || String(e.parameter.all || "").toLowerCase() === "true",
        confirm: e.parameter.confirm });
    }
    if (a === "ops-set") {
      return opsSet_({ tab: e.parameter.tab, col: e.parameter.col, value: e.parameter.value,
        setCol: e.parameter.setCol, setValue: e.parameter.setValue,
        all: String(e.parameter.all || "") === "1" || String(e.parameter.all || "").toLowerCase() === "true",
        confirm: e.parameter.confirm });
    }

    if (a === "coins") return json_(coinsFor_(e.parameter.phone));
    // ---- v5.1 bulk import (agent content factory) ----
    if (a === "ops-import") {
      let arr; try { arr = JSON.parse(e.parameter.rows || "[]"); } catch (err) { return json_({ ok: false, error: "rows-json-parse" }); }
      if (!Array.isArray(arr)) return json_({ ok: false, error: "rows-not-array" });
      if (arr.length > 50) return json_({ ok: false, error: "max-50-per-call" });
      return json_(importQuestionsValidated_(e.parameter.tab, arr));
    }

    return json_({ ok: false, error: "unknown action" });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}

function doPost(e) {
  autoSetup_();
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.key !== getSecret_()) return json_({ ok: false, error: "unauthorized" });

    if (body.type === "student") {
      append_("Students", [new Date(), body.name, body.phone, body.district, body.standard, body.stream || "", body.medium || "", body.source || "", "free", "",
        body.password ? hash_(String(body.phone), String(body.password)) : ""]);
      try { // v5: referral-signup credit (20 coins) when joining with a friend's code
        const owner = findCouponOwner_(String(body.source || ""));
        if (owner && String(owner.phone) !== String(body.phone)) creditCoins_(owner.phone, 20, "referral-signup", String(body.phone), "friend joined");
      } catch (e) {}
    } else if (body.type === "set-password") {
      // for pre-v4 accounts (empty hash) + verified owner sessions
      const s = findStudent_(body.phone);
      if (!s) return json_({ ok: false, error: "no-account" });
      if (s.passwordHash) return json_({ ok: false, error: "password-already-set" });
      sheet_("Students").getRange(s.row, SCHEMA.Students.indexOf("passwordHash") + 1).setValue(hash_(String(body.phone), String(body.password)));
    } else if (body.type === "admin-password") {
      if (!adminOk_(body.phone, body.oldPassword)) return json_({ ok: false, error: "admin-denied" });
      const rows = sheet_("Admins").getDataRange().getValues();
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === String(body.phone)) {
          const newHash = hash_(String(body.phone), String(body.newPassword));
          sheet_("Admins").getRange(r + 1, 3).setValue(newHash);
          const s = findStudent_(body.phone); // keeps founder student password in sync with admin password
          if (s) sheet_("Students").getRange(s.row, SCHEMA.Students.indexOf("passwordHash") + 1).setValue(newHash);
          break;
        }
      }
    } else if (body.type === "admin-material") {
      if (!adminOk_(body.adminPhone, body.adminPassword)) return json_({ ok: false, error: "admin-denied" });
      const tab = body.tab; // Papers | News | Questions
      if (!SCHEMA[tab] || ["Students","Admins","Scores","Subscriptions","Referrals","Waitlist","Import"].indexOf(tab) !== -1)
        return json_({ ok: false, error: "tab-not-allowed" });
      const row = SCHEMA[tab].map(function (col) { return body.row && body.row[col] !== undefined ? body.row[col] : ""; });
      append_(tab, row);
    } else if (body.type === "score" || body.type === "waitlist" || body.type === "payment") {
      if (body.type === "score") append_("Scores", [new Date(), body.phone, body.name || "", body.district || "", body.standard, body.subject, body.chapter || "", body.testType, body.score, body.total, body.seconds || 0]);
      try { if (body.type === "score") maybeQualifyReferral_(body.phone); } catch (e) {}
      if (body.type === "waitlist") append_("Waitlist", [new Date(), body.name, body.phone, body.plan || "Pro", ""]);
      if (body.type === "payment") {
        const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
        append_("Subscriptions", [new Date(), body.phone, body.plan, body.amount || "", body.paymentId || "", body.couponCode || "", "active"]);
        const s = findStudent_(body.phone);
        if (s) {
          const sh = sheet_("Students");
          sh.getRange(s.row, SCHEMA.Students.indexOf("plan") + 1).setValue(body.plan);
          sh.getRange(s.row, SCHEMA.Students.indexOf("planExpiry") + 1).setValue(expiry);
        }
      }
    } else if (body.type === "ops-add") {
      return opsAdd_(body);
    } else if (body.type === "ops-add_many") {
      return opsAddMany_(body);
    } else if (body.type === "ops-delete") {
      return opsDelete_(body);
    } else if (body.type === "ops-set") {
      return opsSet_(body);
    } else if (body.type === "referral-code") {
      // v5 — idempotent: one auto-generated share code per student, stored in Coupons
      return json_(referralCodeFor_(String(body.phone || ""), String(body.name || "student")));
    } else if (body.type === "coin-earn") {
      // v5 — server-side rule enforcement; client can't self-award beyond caps
      return json_(creditCoins_(String(body.phone || ""), 0, String(body.reason || ""), String(body.ref || ""), String(body.note || "")));
    } else if (body.type === "coin-spend") {
      // v5 — balance-checked spend (avatar store etc.)
      return json_(spendCoins_(String(body.phone || ""), Number(body.amount) || 0, String(body.reason || "spend"), String(body.ref || "")));
    } else {
      return json_({ ok: false, error: "unknown type" });
    }
    return json_({ ok: true });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}

// =================== bulk import menu ===================
function onOpen() {
  SpreadsheetApp.getUi().createMenu("CENTUM")
    .addItem("📥 Import questions from Import tab", "importQuestions")
    .addItem("🔧 Re-run setup", "setupCentum")
    .addToUi();
}
function importQuestions() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  autoSetup_();
  const imp = ss.getSheetByName("Import");
  const raw = imp.getRange("A2").getValue();
  let arr;
  try { arr = JSON.parse(raw); if (!Array.isArray(arr)) throw new Error("not an array"); }
  catch (err) { ui.alert("❌ Import!A2 must contain a JSON ARRAY like [{...},{...}] — see ops/quiz-bulk-import.md"); return; }
  let added = 0, skipped = [];
  arr.forEach(function (q, i) {
    try {
      const opts = Array.isArray(q.options) ? q.options.join("|") : String(q.options);
      if (!q.question || opts.split("|").length !== 4) throw new Error("needs question + 4 options");
      const ai = Number(q.answerIndex);
      if (!(ai >= 0 && ai <= 3)) throw new Error("answerIndex must be 0-3");
      append_("Questions", [q.id || ("q-" + new Date().getTime() + "-" + i), q.classLevel || 10, q.subject || "", q.chapter || "",
        q.type || "oneword", q.question, opts, String(ai), q.explanation || "", q.medium || "English", q.plan || "free"]);
      added++;
    } catch (e) { skipped.push("row " + (i + 1) + ": " + e.message); }
  });
  imp.getRange("A2").setValue(JSON.stringify([{ note: "✅ " + added + " questions added " + new Date().toLocaleString() + (skipped.length ? " — skipped: " + skipped.join("; ") : "") }], null, 2));
  ui.alert("✅ Added " + added + " questions." + (skipped.length ? "\nSkipped:\n" + skipped.join("\n") : ""));
}

// =================== v4.1/v4.2 ops implementations (shared by GET + POST) ===================
function opsAdd_(body) {
  const tab = body.tab;
  if (!SCHEMA[tab]) return json_({ ok: false, error: "unknown-tab" });
  if (tab === "QuizSchedule") ensureQuizSchedule_();
  const row = SCHEMA[tab].map(function (c) { return body.row && body.row[c] !== undefined ? body.row[c] : ""; });
  append_(tab, row);
  return json_({ ok: true, added: tab, rowsNow: sheet_(tab).getLastRow() - 1 });
}
function opsAddMany_(body) {
  const tab = body.tab;
  if (!SCHEMA[tab]) return json_({ ok: false, error: "unknown-tab" });
  if (tab === "QuizSchedule") ensureQuizSchedule_();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  rows.forEach(function (r) {
    const row = SCHEMA[tab].map(function (c) { return r && r[c] !== undefined ? r[c] : ""; });
    append_(tab, row);
  });
  return json_({ ok: true, added: rows.length, rowsNow: sheet_(tab).getLastRow() - 1 });
}
function opsDelete_(body) {
  const tab = body.tab;
  if (!SCHEMA[tab]) return json_({ ok: false, error: "unknown-tab" });
  if (tab === "Admins" && body.confirm !== "yes-admin-change") return json_({ ok: false, error: "admins-tab-needs-confirm" });
  const sh = sheet_(tab); const data = sh.getDataRange().getValues();
  const h = data[0].map(String); const ci = h.indexOf(body.col);
  if (ci === -1) return json_({ ok: false, error: "unknown-col" });
  let deleted = 0;
  for (let r = data.length - 1; r >= 1; r--) {
    if (String(data[r][ci]) === String(body.value)) {
      sh.deleteRow(r + 1); deleted++;
      if (!body.all) break;
    }
  }
  return json_({ ok: true, deleted: deleted, rowsNow: sheet_(tab).getLastRow() - 1 });
}
function opsSet_(body) {
  const tab = body.tab;
  if (!SCHEMA[tab]) return json_({ ok: false, error: "unknown-tab" });
  if (tab === "Admins" && body.confirm !== "yes-admin-change") return json_({ ok: false, error: "admins-tab-needs-confirm" });
  const sh = sheet_(tab); const data = sh.getDataRange().getValues();
  const h = data[0].map(String); const ci = h.indexOf(body.col); const si = h.indexOf(body.setCol);
  if (ci === -1 || si === -1) return json_({ ok: false, error: "unknown-col" });
  let updated = 0;
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][ci]) === String(body.value)) {
      sh.getRange(r + 1, si + 1).setValue(body.setValue); updated++;
      if (!body.all) break;
    }
  }
  return json_({ ok: true, updated: updated });
}

// =================== v5 coins + referral codes ===================
const COIN_RULES = {
  "welcome":              { pts: 25,  once: true },
  "daily-quiz":           { pts: 5,   perDay: 1 },
  "test-complete":        { pts: 2,   perDay: 5 },
  "test-perfect":         { pts: 3,   perDay: 5 },
  "streak-7":             { pts: 20,  once: true, verifyStreakDays: 7 },
  "streak-30":            { pts: 100, once: true, verifyStreakDays: 30 },
  "referral-signup":      { pts: 20,  once: true },   // ref = friend phone
  "referral-qualified":   { pts: 80,  once: true },   // ref = friend phone
  "admin-grant":          { pts: 0,   adminOnly: true }
};

function ledgerRows_() { return rows_("CoinLedger"); }
function coinBalance_(phone) {
  let bal = 0;
  ledgerRows_().forEach(function (l) { if (String(l.phone) === String(phone)) bal += Number(l.delta) || 0; });
  return bal;
}
function ledgerAdd_(phone, delta, reason, ref, note) {
  const nb = coinBalance_(phone) + delta;
  append_("CoinLedger", [new Date(), String(phone), delta, nb, reason || "", ref || "", note || ""]);
  return nb;
}
function creditCoins_(phone, _pts, reason, ref, note) {
  const rule = COIN_RULES[reason];
  if (!rule) return { ok: false, error: "unknown-reason" };
  if (!phone) return { ok: false, error: "no-phone" };
  const rows = ledgerRows_();
  if (rule.once) {
    for (let i = 0; i < rows.length; i++)
      if (String(rows[i].phone) === phone && String(rows[i].reason) === reason && (!ref || String(rows[i].ref) === ref))
        return { ok: false, error: "already-credited", balance: coinBalance_(phone) };
  }
  if (rule.perDay) {
    const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
    let n = 0;
    rows.forEach(function (l) {
      if (String(l.phone) === phone && String(l.reason) === reason) {
        const d = l.timestamp instanceof Date ? Utilities.formatDate(l.timestamp, TZ, "yyyy-MM-dd") : String(l.timestamp).slice(0, 10);
        if (d === today) n++;
      }
    });
    if (n >= rule.perDay) return { ok: false, error: "daily-cap", balance: coinBalance_(phone) };
  }
  if (rule.verifyStreakDays) {
    if (recentScoreDays_(phone, rule.verifyStreakDays) < rule.verifyStreakDays)
      return { ok: false, error: "streak-not-verified", balance: coinBalance_(phone) };
  }
  const bal = ledgerAdd_(phone, rule.pts, reason, ref || "", note || "");
  return { ok: true, credited: rule.pts, balance: bal };
}
function spendCoins_(phone, amount, reason, ref) {
  if (!phone) return { ok: false, error: "no-phone" };
  if (!(amount > 0)) return { ok: false, error: "bad-amount" };
  const rows = ledgerRows_();   // idempotent: same ref can't be bought twice
  for (let i = 0; i < rows.length; i++)
    if (String(rows[i].phone) === phone && String(rows[i].reason) === reason && String(rows[i].ref) === String(ref))
      return { ok: false, error: "already-owned", balance: coinBalance_(phone) };
  const bal = coinBalance_(phone);
  if (bal < amount) return { ok: false, error: "insufficient", balance: bal };
  const nb = ledgerAdd_(phone, -amount, reason, ref, "");
  return { ok: true, spent: amount, balance: nb };
}
function coinsFor_(phone) {
  if (!phone) return { ok: true, balance: 0, recent: [] };
  const all = ledgerRows_().filter(function (l) { return String(l.phone) === String(phone); });
  const recent = all.slice(-20).reverse().map(function (l) {
    const d = l.timestamp instanceof Date ? Utilities.formatDate(l.timestamp, TZ, "yyyy-MM-dd") : String(l.timestamp);
    return { date: d, delta: Number(l.delta) || 0, balance: Number(l.balance) || 0, reason: l.reason };
  });
  return { ok: true, balance: coinBalance_(phone), recent: recent };
}
function recentScoreDays_(phone, days) {
  const since = new Date(); since.setDate(since.getDate() - days + 1); since.setHours(0, 0, 0, 0);
  const set = {};
  rows_("Scores").forEach(function (s) {
    if (String(s.phone) !== String(phone)) return;
    const t = s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp);
    if (t >= since) set[Utilities.formatDate(t, TZ, "yyyy-MM-dd")] = true;
  });
  return Object.keys(set).length;
}
function findCouponOwner_(code) {
  if (!code) return null;
  const rows = rows_("Coupons");
  for (let i = 0; i < rows.length; i++)
    if (String(rows[i].code).toUpperCase() === String(code).toUpperCase() && String(rows[i].active).toUpperCase() === "TRUE")
      return { phone: String(rows[i].referrerPhone), name: rows[i].referrerName, code: String(rows[i].code).toUpperCase() };
  return null;
}
function maybeQualifyReferral_(friendPhone) {
  // friend qualifies = ≥3 quizzes across ≥2 distinct days → referrer gets 80 coins once
  const s = findStudent_(friendPhone);
  if (!s) return;
  const data = sheet_("Students").getDataRange().getValues(); const h = data[0].map(String);
  const src = String(data[s.row - 1][h.indexOf("source")] || "");
  const owner = findCouponOwner_(src);
  if (!owner) return;
  const rows = ledgerRows_();
  for (let i = 0; i < rows.length; i++)
    if (String(rows[i].phone) === owner.phone && String(rows[i].reason) === "referral-qualified" && String(rows[i].ref) === String(friendPhone)) return;
  let total = 0; const days = {};
  rows_("Scores").forEach(function (sc) {
    if (String(sc.phone) !== String(friendPhone)) return;
    total++;
    const t = sc.timestamp instanceof Date ? sc.timestamp : new Date(sc.timestamp);
    days[Utilities.formatDate(t, TZ, "yyyy-MM-dd")] = true;
  });
  if (total >= 3 && Object.keys(days).length >= 2) creditCoins_(owner.phone, 80, "referral-qualified", String(friendPhone), "friend qualified");
}
function referralCodeFor_(phone, name) {
  if (!phone) return { ok: false, error: "no-phone" };
  const rows = rows_("Coupons");
  for (let i = 0; i < rows.length; i++)
    if (String(rows[i].referrerPhone) === phone && String(rows[i].active).toUpperCase() === "TRUE")
      return { ok: true, code: String(rows[i].code).toUpperCase(), existing: true };
  const base = String(name || "centum").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "CENT";
  let code;
  do { code = base + Math.floor(1000 + Math.random() * 9000); }
  while (rows.some(function (c) { return String(c.code).toUpperCase() === code; }));
  append_("Coupons", [code, 0, name, phone, "", "TRUE"]);
  return { ok: true, code: code, existing: false };
}

// =================== v5.1 bulk import + auto daily quiz ===================
function importQuestionsValidated_(tab, arr) {
  if (tab !== "Questions") return { ok: false, error: "only-Questions-allowed" };
  const existing = new Set();
  rows_("Questions").forEach(function (q) {
    existing.add(String(q.classLevel) + "|" + String(q.subject).toLowerCase() + "|" + String(q.chapter).toLowerCase() + "|" + String(q.type) + "|" + String(q.question).trim().toLowerCase());
  });
  let added = 0; const skipped = [];
  arr.forEach(function (q, i) {
    const label = "row " + (i + 1);
    const opts = Array.isArray(q.options) ? q.options.map(function (o) { return String(o).trim(); }) : String(q.options || "").split("|").map(function (o) { return o.trim(); });
    if (!q.question || !String(q.question).trim()) { skipped.push(label + ": empty question"); return; }
    if (opts.length !== 4) { skipped.push(label + ": needs exactly 4 options"); return; }
    const ai = Number(q.answerIndex);
    if (!(ai >= 0 && ai <= 3)) { skipped.push(label + ": answerIndex must be 0-3"); return; }
    if (!q.subject || !q.chapter) { skipped.push(label + ": needs subject + chapter"); return; }
    const medium = String(q.medium || "english").trim().toLowerCase();
    const key = String(q.classLevel || 10) + "|" + String(q.subject).toLowerCase() + "|" + String(q.chapter).toLowerCase() + "|" + (q.type || "oneword") + "|" + String(q.question).trim().toLowerCase();
    if (existing.has(key)) { skipped.push(label + ": duplicate"); return; }
    existing.add(key);
    append_("Questions", [q.id || ("q-" + Date.now() + "-" + i), q.classLevel || 10, q.subject, q.chapter,
      q.type || "oneword", String(q.question).trim(), opts.join("|"), String(ai), q.explanation || "", medium, "free"]);
    added++;
  });
  return { ok: true, added: added, skipped: skipped.length ? skipped : undefined, totalNow: sheet_("Questions").getLastRow() - 1 };
}

function dailyQuizAuto_() {
  // runs daily ~6AM IST (installed via installCentumTriggers); seeds one quiz per classLevel × medium
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const existing = rows_("DailyQuiz");
  if (existing.some(function (r) { const d = r.date instanceof Date ? Utilities.formatDate(r.date, TZ, "yyyy-MM-dd") : String(r.date); return d === today; })) return;
  const recentQ = new Set(existing.slice(-60).map(function (r) { return String(r.question).trim().toLowerCase(); }));
  const qs = rows_("Questions").filter(function (q) { return !recentQ.has(String(q.question).trim().toLowerCase()); });
  [10, 12].forEach(function (cl) {
    ["english", "tamil"].forEach(function (m) {
      const pool = qs.filter(function (q) { return String(q.classLevel) === String(cl) && String(q.medium || "english").toLowerCase() === m; });
      if (!pool.length) return;
      const q = pool[Math.floor(Math.random() * pool.length)];
      append_("DailyQuiz", [today, cl, "", q.subject, q.chapter, q.question, q.options, q.answerIndex, q.explanation || "", q.medium || m]);
    });
  });
}
function installCentumTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "dailyQuizAuto_") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("dailyQuizAuto_").timeBased().everyDays(1).atHour(6).inTimezone("Asia/Kolkata").create();
  Logger.log("✅ daily-quiz trigger armed for ~6AM IST");
}

// =================== shared helpers ===================
function ensureHeaders_(sh, wanted) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  if (!existing[0]) { sh.getRange(1, 1, 1, wanted.length).setValues([wanted]).setFontWeight("bold"); return; }
  let col = existing.length;
  wanted.forEach(function (h) { if (existing.indexOf(h) === -1) { col += 1; sh.getRange(1, col).setValue(h).setFontWeight("bold"); existing.push(h); } });
}
function backfill_(ss, tab, col, val) {
  const sh = ss.getSheetByName(tab); const data = sh.getDataRange().getValues();
  if (data.length < 2) return;
  const h = data[0].map(String); const idx = h.indexOf(col); if (idx === -1) return;
  for (let r = 1; r < data.length; r++) if (!data[r][idx]) sh.getRange(r + 1, idx + 1).setValue(val);
}
function seedIfEmpty_(ss, name, rowsToAdd) { const sh = ss.getSheetByName(name); if (sh.getLastRow() <= 1 && rowsToAdd.length) sh.getRange(2, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd); }
function autoSetup_() { if (!PropertiesService.getScriptProperties().getProperty("SHEET_ID")) setupCentum(); }
function getSecret_() { return PropertiesService.getScriptProperties().getProperty("SECRET"); }
function sheet_(name) { const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID"); const sh = SpreadsheetApp.openById(id).getSheetByName(name); if (!sh) throw new Error("Missing tab: " + name); return sh; }
function rows_(name) {
  const values = sheet_(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const h = values[0].map(function (x) { return String(x).trim(); });
  return values.slice(1).filter(function (r) { return r.some(function (c) { return c !== ""; }); }).map(function (r) { const o = {}; h.forEach(function (hh, i) { o[hh] = r[i]; }); return o; });
}
function append_(name, row) { sheet_(name).appendRow(row); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function splitOptions_(c) { return String(c).split("|").map(function (s) { return s.trim(); }); }
function publicStudent_(s, phone) { return { name: s.name, phone: String(phone || ""), district: s.district, standard: s.standard, stream: s.stream, medium: s.medium, plan: s.plan }; }
function questionRows_() {
  return rows_("Questions").map(function (q) {
    return { id: q.id, classLevel: String(q.classLevel), subject: q.subject, chapter: q.chapter, type: q.type,
      question: q.question, options: splitOptions_(q.options), answerIndex: Number(q.answerIndex),
      explanation: q.explanation || "", medium: q.medium || "English", plan: q.plan || "free" };
  });
}
function dailyQuiz_(classLevel, stream, medium) {
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const all = rows_("DailyQuiz");
  for (let i = 0; i < all.length; i++) {
    const q = all[i]; const d = q.date instanceof Date ? Utilities.formatDate(q.date, TZ, "yyyy-MM-dd") : String(q.date);
    if (d !== today) continue;
    if (classLevel && String(q.classLevel) !== String(classLevel)) continue;
    if (stream && q.stream && String(q.stream) !== String(stream)) continue;
    if (medium && q.medium && String(q.medium).toLowerCase() !== String(medium).toLowerCase()) continue;
    return { question: q.question, options: splitOptions_(q.options), answerIndex: Number(q.answerIndex),
      explanation: q.explanation || "", subject: q.subject, chapter: q.chapter, classLevel: q.classLevel, medium: q.medium };
  }
  return null;
}

// =================== v5.2 today-quiz + QuizSchedule ===================
function ensureQuizSchedule_() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!id) return null;
  const ss = SpreadsheetApp.openById(id);
  let sh = ss.getSheetByName("QuizSchedule");
  if (!sh) {
    sh = ss.insertSheet("QuizSchedule");
    ensureHeaders_(sh, SCHEMA.QuizSchedule);
    sh.setFrozenRows(1);
  }
  return sh;
}

function todayQuiz_(classLevel, medium, dateParam) {
  ensureQuizSchedule_();
  const targetDate = String(dateParam || Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd")).trim();
  const targetClass = String(classLevel || "10th").trim().toLowerCase().replace("th", "");
  const targetMed = String(medium || "english").trim().toLowerCase();

  const all = rows_("QuizSchedule");
  for (let i = 0; i < all.length; i++) {
    const r = all[i];
    const d = r.date instanceof Date ? Utilities.formatDate(r.date, TZ, "yyyy-MM-dd") : String(r.date || "").trim().slice(0, 10);
    if (d !== targetDate) continue;
    const cl = String(r.classLevel || "").trim().toLowerCase().replace("th", "");
    if (targetClass && cl !== targetClass) continue;
    const m = String(r.medium || "").trim().toLowerCase();
    if (targetMed && m !== targetMed) continue;

    return {
      ok: true,
      quiz: {
        date: d,
        classLevel: String(r.classLevel || "10th").trim(),
        medium: String(r.medium || "english").trim(),
        subject: String(r.subject || "").trim(),
        chapter: String(r.chapter || "").trim(),
        type: String(r.type || "oneword").trim(),
        count: Number(r.count) || 10
      }
    };
  }
  return { ok: true, quiz: null };
}

function leaderboard_(standard, viewerPhone) {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const totals = {};
  rows_("Scores").forEach(function (s) {
    const t = s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp);
    if (!(t >= weekAgo)) return;
    if (standard && String(s.standard) !== String(standard)) return;
    const key = String(s.phone);
    if (!totals[key]) totals[key] = { name: String(s.name || "student").split(" ")[0], district: s.district || "", points: 0, tests: 0 };
    totals[key].points += Number(s.score) || 0; totals[key].tests += 1;
  });
  const board = Object.keys(totals).map(function (phone) { const t = totals[phone]; return { name: t.name, district: t.district, points: t.points, tests: t.tests, me: String(phone) === String(viewerPhone) }; })
    .sort(function (a, b) { return b.points - a.points; }).slice(0, 10);
  return { ok: true, leaderboard: board, window: "last-7-days" };
}
function planFor_(phone) {
  if (!phone) return { ok: true, plan: "free" };
  const s = findStudent_(phone);
  if (!s) return { ok: true, plan: "free" };
  const sh = sheet_("Students"); const data = sh.getDataRange().getValues(); const h = data[0].map(String);
  const ei = h.indexOf("planExpiry");
  const exp = data[s.row - 1][ei] ? new Date(data[s.row - 1][ei]) : null;
  const plan = String(s.plan || "free");
  if (plan !== "free" && exp && exp < new Date()) return { ok: true, plan: "free", expired: true };
  return { ok: true, plan: plan, planExpiry: exp ? Utilities.formatDate(exp, TZ, "yyyy-MM-dd") : "" };
}
function couponCheck_(code) {
  if (!code) return { ok: true, valid: false };
  const rows = rows_("Coupons");
  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    if (String(c.code).toLowerCase() === String(code).toLowerCase() && String(c.active).toUpperCase() === "TRUE" && (Number(c.discountPercent) || 0) > 0)
      return { ok: true, valid: true, code: String(c.code).toUpperCase(), discountPercent: Number(c.discountPercent) || 0 };
  }
  return { ok: true, valid: false };
}
function referralsFor_(phone) {
  const myCodes = rows_("Coupons").filter(function (c) { return String(c.referrerPhone) === String(phone); }).map(function (c) { return String(c.code).toUpperCase(); });
  const out = rows_("Referrals").filter(function (r) { return myCodes.indexOf(String(r.code).toUpperCase()) !== -1; }).map(function (r) {
    const d = r.timestamp instanceof Date ? Utilities.formatDate(r.timestamp, TZ, "yyyy-MM-dd") : String(r.timestamp);
    const buyer = String(r.buyerPhone || "");
    return { date: d, code: r.code, buyerPhone: buyer ? "xxxxx" + buyer.slice(-4) : "", plan: r.plan, referrerShare: Number(r.referrerShare) || 0, payoutStatus: r.payoutStatus || "pending" };
  });
  const total = out.reduce(function (s, r) { return s + r.referrerShare; }, 0);
  const pending = out.filter(function (r) { return String(r.payoutStatus) !== "paid"; }).reduce(function (s, r) { return s + r.referrerShare; }, 0);
  return { ok: true, referrals: out, totalEarned: total, pendingPayout: pending };
}
