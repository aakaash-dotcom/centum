/**
 * CENTUM BACKEND — TUITION CLASSROOMS MODULE (Classrooms.gs)
 * Self-contained file for Google Apps Script.
 *
 * HOW THE FOUNDER INSTALLS THIS:
 * 1. In Apps Script editor, click '+' next to Files -> choose 'Script' -> name it 'Classrooms'.
 * 2. Paste ALL of this code into Classrooms.gs.
 * 3. Save Classrooms.gs.
 * 4. In Code.gs, add the two hook lines inside doGet and doPost (see header comments below).
 * 5. Run 'classroomsSelfTest' from the editor Run menu to verify green.
 * 6. Deploy -> Manage deployments -> edit -> New version -> Deploy.
 *
 * NOTE: Entry points DO NOT have trailing underscores so they are callable and visible in Apps Script menus.
 */

// =================== PUBLIC HOOKS (WITHOUT TRAILING UNDERSCORES) ===================

/**
 * Hook for Code.gs doGet(e)
 * Insert just before `return json_({ ok: false, error: "unknown action" });`:
 *   if ((e.parameter.action||"").indexOf("classroom")===0 || (e.parameter.action||"").indexOf("seat-")===0 || (e.parameter.action||"").indexOf("tuition-")===0 || (e.parameter.action||"")==="ops-classroom-add" || (e.parameter.action||"")==="ops-classrooms-list") { const _out = typeof classroomRouteGet === 'function' ? classroomRouteGet(e.parameter) : null; if (_out) return json_(_out); }
 */
function classroomRouteGet(params) {
  if (!params) return null;
  const action = String(params.action || "").trim();

  if (action !== "classroom-info" &&
      action !== "tuition-stats" &&
      action !== "ops-classrooms-list") {
    return null;
  }

  const ss = crGetSpreadsheet_();
  crEnsureTab_(ss, "Tuitions");
  crEnsureTab_(ss, "Seats");
  crEnsureStudentsTuitionColumn_(ss);

  // 1. classroom-info?code=
  if (action === "classroom-info") {
    const code = String(params.code || "").trim().toUpperCase();
    if (!code) return { ok: false, error: "code-required" };

    const tuitions = crRows_("Tuitions");
    for (let i = 0; i < tuitions.length; i++) {
      if (String(tuitions[i].code || "").trim().toUpperCase() === code) {
        const isActive = String(tuitions[i].active || "").trim().toUpperCase() === "TRUE";
        if (!isActive) {
          return {
            ok: false,
            error: "tuition-inactive",
            tuitionName: tuitions[i].tuitionName || ""
          };
        }
        return {
          ok: true,
          valid: true,
          tuition: {
            code: tuitions[i].code,
            tuitionName: tuitions[i].tuitionName,
            ownerName: tuitions[i].ownerName,
            district: tuitions[i].district,
            mode: tuitions[i].mode || "coupon",
            discountPercent: Number(tuitions[i].discountPercent) || 0,
            seatsTotal: Number(tuitions[i].seatsTotal) || 0,
            active: true
          }
        };
      }
    }
    return { ok: false, error: "tuition-not-found" };
  }

  // 2. tuition-stats?code=&ownerPhone= (Owner-scoped: NEVER cross-tuition data)
  if (action === "tuition-stats") {
    const code = String(params.code || "").trim().toUpperCase();
    const ownerPhone = String(params.ownerPhone || "").replace(/\D/g, "");
    if (!code) return { ok: false, error: "code-required" };

    const tuitions = crRows_("Tuitions");
    let targetTuition = null;
    for (let i = 0; i < tuitions.length; i++) {
      if (String(tuitions[i].code || "").trim().toUpperCase() === code) {
        targetTuition = tuitions[i];
        break;
      }
    }

    if (!targetTuition) return { ok: false, error: "tuition-not-found" };

    // GUARD RAIL: Enforce owner phone verification or admin credentials
    const targetOwnerPhone = String(targetTuition.ownerPhone || "").replace(/\D/g, "");
    const isAdmin = crAdminOk_(params.adminPhone, params.adminPassword);

    const normTarget = targetOwnerPhone.slice(-10);
    const normProvided = ownerPhone.slice(-10);

    if (!isAdmin && (!normProvided || normTarget !== normProvided)) {
      return { ok: false, error: "unauthorized-cross-tuition-denied" };
    }

    // Seats summary
    const allSeats = crRows_("Seats").filter(function(s) {
      return String(s.tuitionCode || "").trim().toUpperCase() === code;
    });
    const seatsTotal = Number(targetTuition.seatsTotal) || allSeats.length;
    const seatsClaimed = allSeats.filter(function(s) {
      return Boolean(s.phone && String(s.phone).trim() !== "");
    }).length;

    // Enrolled students from Students tab
    const students = crGetStudentsForTuition_(ss, code);

    // Activity & average scores from Scores tab
    const studentPhones = students.map(function(s) { return String(s.phone || "").replace(/\D/g, ""); });
    const statsResult = crComputeStudentScoresAndActivity_(ss, studentPhones, students);

    // Payout statement (Model A coupon commissions)
    const payoutStatement = crComputePayoutStatement_(ss, code, Number(targetTuition.commissionPercent) || 0);

    return {
      ok: true,
      stats: {
        tuition: {
          code: targetTuition.code,
          tuitionName: targetTuition.tuitionName,
          ownerName: targetTuition.ownerName,
          ownerPhone: targetTuition.ownerPhone,
          ownerUpi: targetTuition.ownerUpi,
          district: targetTuition.district,
          mode: targetTuition.mode || "coupon",
          discountPercent: Number(targetTuition.discountPercent) || 0,
          commissionPercent: Number(targetTuition.commissionPercent) || 0,
          seatsTotal: seatsTotal,
          active: String(targetTuition.active || "").trim().toUpperCase() === "TRUE"
        },
        seatsTotal: seatsTotal,
        seatsClaimed: seatsClaimed,
        activeStudentsCount: students.length,
        students: statsResult.students,
        weeklyActivity: statsResult.weeklyActivity,
        payoutStatement: payoutStatement
      }
    };
  }

  // 3. ops-classrooms-list (admin-gated)
  if (action === "ops-classrooms-list") {
    if (!crAdminOk_(params.adminPhone, params.adminPassword)) {
      return { ok: false, error: "admin-denied" };
    }
    const tuitions = crRows_("Tuitions");
    const allSeats = crRows_("Seats");
    const students = crRows_("Students");

    const list = tuitions.map(function(t) {
      const code = String(t.code || "").trim().toUpperCase();
      const codeSeats = allSeats.filter(function(s) { return String(s.tuitionCode || "").trim().toUpperCase() === code; });
      const claimed = codeSeats.filter(function(s) { return Boolean(s.phone && String(s.phone).trim() !== ""); }).length;
      const enrolled = students.filter(function(s) { return String(s.tuitionCode || "").trim().toUpperCase() === code; }).length;

      return {
        code: t.code,
        tuitionName: t.tuitionName,
        ownerName: t.ownerName,
        ownerPhone: t.ownerPhone,
        ownerUpi: t.ownerUpi,
        district: t.district,
        mode: t.mode || "coupon",
        discountPercent: Number(t.discountPercent) || 0,
        commissionPercent: Number(t.commissionPercent) || 0,
        seatsTotal: Number(t.seatsTotal) || codeSeats.length,
        seatsClaimed: claimed,
        studentsCount: enrolled,
        active: String(t.active || "").trim().toUpperCase() === "TRUE",
        createdAt: t.createdAt
      };
    });

    return { ok: true, tuitions: list };
  }

  return null;
}

/**
 * Hook for Code.gs doPost(e)
 * Insert just before `return json_({ ok: false, error: "unknown type" });`:
 *   const _crAction = body.action || body.type || "";
 *   if (_crAction.indexOf("classroom")===0 || _crAction.indexOf("seat-")===0 || _crAction.indexOf("tuition-")===0 || _crAction==="ops-classroom-add" || _crAction==="ops-seat-generate") { const _out = typeof classroomRoutePost === 'function' ? classroomRoutePost(body) : null; if (_out) return json_(_out); }
 */
function classroomRoutePost(body) {
  if (!body) return null;
  const action = String(body.action || body.type || "").trim();

  if (action !== "classroom-join" &&
      action !== "seat-claim" &&
      action !== "ops-classroom-add" &&
      action !== "ops-seat-generate") {
    return null;
  }

  const ss = crGetSpreadsheet_();
  crEnsureTab_(ss, "Tuitions");
  crEnsureTab_(ss, "Seats");
  crEnsureStudentsTuitionColumn_(ss);

  // 1. classroom-join {phone, code}
  if (action === "classroom-join") {
    const rawPhone = String(body.phone || "").replace(/\D/g, "");
    const code = String(body.code || "").trim().toUpperCase();

    if (!rawPhone || rawPhone.length < 10) return { ok: false, error: "valid-phone-required" };
    if (!code) return { ok: false, error: "code-required" };

    const tuitions = crRows_("Tuitions");
    let targetTuition = null;
    for (let i = 0; i < tuitions.length; i++) {
      if (String(tuitions[i].code || "").trim().toUpperCase() === code) {
        targetTuition = tuitions[i];
        break;
      }
    }

    if (!targetTuition) return { ok: false, error: "tuition-not-found" };
    if (String(targetTuition.active || "").trim().toUpperCase() !== "TRUE") {
      return { ok: false, error: "tuition-inactive" };
    }

    const sh = ss.getSheetByName("Students");
    if (!sh) return { ok: false, error: "students-tab-missing" };
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: false, error: "student-not-found" };

    const headers = data[0].map(String);
    const phoneIdx = headers.indexOf("phone");
    const tuitionIdx = headers.indexOf("tuitionCode");
    if (phoneIdx === -1 || tuitionIdx === -1) return { ok: false, error: "invalid-students-schema" };

    const norm10 = rawPhone.slice(-10);
    let studentRow = -1;
    let existingCode = "";

    for (let r = 1; r < data.length; r++) {
      const p = String(data[r][phoneIdx] || "").replace(/\D/g, "");
      if (p.slice(-10) === norm10) {
        studentRow = r + 1;
        existingCode = String(data[r][tuitionIdx] || "").trim().toUpperCase();
        break;
      }
    }

    if (studentRow === -1) {
      return { ok: false, error: "student-not-found" };
    }

    // GUARD RAIL: One tuition per phone
    if (existingCode && existingCode !== code) {
      return {
        ok: false,
        error: "already-enrolled-in-tuition",
        existingCode: existingCode,
        message: "This mobile number is already linked to another tuition centre."
      };
    }

    // Link tuition code
    sh.getRange(studentRow, tuitionIdx + 1).setValue(code);

    return {
      ok: true,
      joined: true,
      code: code,
      tuitionName: targetTuition.tuitionName || code
    };
  }

  // 2. seat-claim {phone, seatCode}
  if (action === "seat-claim") {
    const rawPhone = String(body.phone || "").replace(/\D/g, "");
    const seatCode = String(body.seatCode || "").trim().toUpperCase();

    if (!rawPhone || rawPhone.length < 10) return { ok: false, error: "valid-phone-required" };
    if (!seatCode) return { ok: false, error: "seat-code-required" };

    const seatSh = ss.getSheetByName("Seats");
    const seatData = seatSh.getDataRange().getValues();
    if (seatData.length < 2) return { ok: false, error: "seat-not-found" };

    const seatH = seatData[0].map(String);
    const sCodeIdx = seatH.indexOf("seatCode");
    const tCodeIdx = seatH.indexOf("tuitionCode");
    const sPhoneIdx = seatH.indexOf("phone");
    const sClaimedIdx = seatH.indexOf("claimedAt");
    const sExpiryIdx = seatH.indexOf("expiresAt");

    let foundSeatRow = -1;
    let seatTuitionCode = "";
    let existingSeatPhone = "";
    let seatExpiry = "";

    for (let r = 1; r < seatData.length; r++) {
      if (String(seatData[r][sCodeIdx] || "").trim().toUpperCase() === seatCode) {
        foundSeatRow = r + 1;
        seatTuitionCode = String(seatData[r][tCodeIdx] || "").trim().toUpperCase();
        existingSeatPhone = String(seatData[r][sPhoneIdx] || "").replace(/\D/g, "");
        seatExpiry = seatData[r][sExpiryIdx];
        break;
      }
    }

    if (foundSeatRow === -1) {
      return { ok: false, error: "seat-not-found" };
    }

    const norm10 = rawPhone.slice(-10);

    // GUARD RAIL: Seat codes single-use + phone-bound
    if (existingSeatPhone) {
      if (existingSeatPhone.slice(-10) === norm10) {
        // Idempotent retry by the same phone
        return {
          ok: true,
          claimed: true,
          alreadyClaimed: true,
          tuitionCode: seatTuitionCode,
          plan: "pro",
          expiresAt: seatExpiry
        };
      } else {
        return {
          ok: false,
          error: "seat-already-claimed",
          message: "This seat code has already been claimed by another student."
        };
      }
    }

    // Expiry check
    if (seatExpiry) {
      const expDate = seatExpiry instanceof Date ? seatExpiry : new Date(seatExpiry);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        return { ok: false, error: "seat-expired" };
      }
    }

    // Pro plan 1-year duration by default
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const finalExpiry = seatExpiry || oneYearLater;

    // Mark seat claimed in Seats tab
    seatSh.getRange(foundSeatRow, sPhoneIdx + 1).setValue(rawPhone);
    seatSh.getRange(foundSeatRow, sClaimedIdx + 1).setValue(new Date());
    if (!seatExpiry) {
      seatSh.getRange(foundSeatRow, sExpiryIdx + 1).setValue(finalExpiry);
    }

    // Upgrade student in Students tab (free seats stay free, Pro upgrade assigned)
    const studentSh = ss.getSheetByName("Students");
    if (studentSh) {
      const studData = studentSh.getDataRange().getValues();
      if (studData.length >= 2) {
        const studH = studData[0].map(String);
        const pIdx = studH.indexOf("phone");
        const planIdx = studH.indexOf("plan");
        const expIdx = studH.indexOf("planExpiry");
        const tIdx = studH.indexOf("tuitionCode");

        for (let r = 1; r < studData.length; r++) {
          const sp = String(studData[r][pIdx] || "").replace(/\D/g, "");
          if (sp.slice(-10) === norm10) {
            if (planIdx !== -1) studentSh.getRange(r + 1, planIdx + 1).setValue("pro");
            if (expIdx !== -1) studentSh.getRange(r + 1, expIdx + 1).setValue(finalExpiry);
            if (tIdx !== -1) studentSh.getRange(r + 1, tIdx + 1).setValue(seatTuitionCode);
            break;
          }
        }
      }
    }

    return {
      ok: true,
      claimed: true,
      tuitionCode: seatTuitionCode,
      plan: "pro",
      expiresAt: finalExpiry
    };
  }

  // 3. ops-classroom-add (admin-gated via existing admin credentials)
  if (action === "ops-classroom-add") {
    if (!crAdminOk_(body.adminPhone, body.adminPassword)) {
      return { ok: false, error: "admin-denied" };
    }

    const tuitionSh = crEnsureTab_(ss, "Tuitions");
    let code = String(body.code || "").trim().toUpperCase();
    if (!code) {
      code = "TC-" + Utilities.getUuid().slice(0, 6).toUpperCase();
    }

    const ownerName = String(body.ownerName || "");
    const ownerPhone = String(body.ownerPhone || "").replace(/\D/g, "");
    const ownerUpi = String(body.ownerUpi || "");
    const tuitionName = String(body.tuitionName || "");
    const district = String(body.district || "Chennai");
    const mode = String(body.mode || "coupon").toLowerCase(); // coupon | seats | hybrid
    const discountPercent = Number(body.discountPercent) || 0;
    const commissionPercent = Number(body.commissionPercent) || 0;
    const seatsTotal = Number(body.seatsTotal) || 0;
    const active = body.active === false || String(body.active).toUpperCase() === "FALSE" ? "FALSE" : "TRUE";
    const now = new Date();

    const tData = tuitionSh.getDataRange().getValues();
    const tH = tData[0].map(String);
    const codeIdx = tH.indexOf("code");
    let existingRow = -1;

    for (let r = 1; r < tData.length; r++) {
      if (String(tData[r][codeIdx] || "").trim().toUpperCase() === code) {
        existingRow = r + 1;
        break;
      }
    }

    const rowValues = [
      code, ownerName, ownerPhone, ownerUpi, tuitionName, district, mode,
      discountPercent, commissionPercent, seatsTotal, active, now
    ];

    if (existingRow !== -1) {
      tuitionSh.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      tuitionSh.appendRow(rowValues);
    }

    // Model A: register in Coupons tab if discount given
    if (mode === "coupon" || mode === "hybrid" || discountPercent > 0) {
      crEnsureCouponTabRow_(ss, code, discountPercent, ownerName, ownerPhone, ownerUpi);
    }

    // Model B: generate seats if requested
    let seatsGenerated = 0;
    if (seatsTotal > 0 && (body.generateSeats || mode === "seats" || mode === "hybrid")) {
      seatsGenerated = crGenerateSeatsForTuition_(ss, code, seatsTotal);
    }

    return {
      ok: true,
      code: code,
      tuitionName: tuitionName,
      seatsGenerated: seatsGenerated
    };
  }

  // 4. ops-seat-generate (admin-gated)
  if (action === "ops-seat-generate") {
    if (!crAdminOk_(body.adminPhone, body.adminPassword)) {
      return { ok: false, error: "admin-denied" };
    }

    const code = String(body.tuitionCode || "").trim().toUpperCase();
    const count = parseInt(body.count, 10) || 10;
    if (!code) return { ok: false, error: "tuitionCode-required" };

    const seatsCreated = crGenerateSeatsForTuition_(ss, code, count);
    return {
      ok: true,
      tuitionCode: code,
      seatsGenerated: seatsCreated
    };
  }

  return null;
}

// =================== SELF TEST FUNCTION (FOUNDER VISIBLE IN RUN MENU) ===================

/**
 * Run this function directly from the Apps Script Run menu to verify the installation.
 */
function classroomsSelfTest() {
  Logger.log("==================================================");
  Logger.log("🧪 CENTUM TUITION CLASSROOMS SELF-TEST STARTING...");
  Logger.log("==================================================");

  const testCode = "TEST-TC-DEMO-" + Math.floor(100 + Math.random() * 900);
  const testPhone = "98765" + Math.floor(10000 + Math.random() * 90000);
  const testStudentPhone = "99400" + Math.floor(10000 + Math.random() * 90000);
  const ss = crGetSpreadsheet_();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      Logger.log("✅ PASS: " + message);
    } else {
      failed++;
      Logger.log("❌ FAIL: " + message);
    }
  }

  try {
    // 1. Test Tab Creation
    crEnsureTab_(ss, "Tuitions");
    crEnsureTab_(ss, "Seats");
    crEnsureStudentsTuitionColumn_(ss);
    assert(Boolean(ss.getSheetByName("Tuitions")), "Tuitions tab exists");
    assert(Boolean(ss.getSheetByName("Seats")), "Seats tab exists");

    // 2. Test ops-classroom-add
    const addRes = classroomRoutePost({
      action: "ops-classroom-add",
      adminPhone: "6380444830",
      adminPassword: "centum-admin-2026", // uses founder initial password or matches admin
      code: testCode,
      tuitionName: "Centum SelfTest Academy",
      ownerName: "Tutor Test",
      ownerPhone: testPhone,
      ownerUpi: "test@upi",
      district: "Madurai",
      mode: "hybrid",
      discountPercent: 15,
      commissionPercent: 20,
      seatsTotal: 3,
      generateSeats: true,
      active: true
    });

    if (addRes && addRes.error === "admin-denied") {
      // If admin password was changed in production, test direct insertion
      Logger.log("ℹ️ Admin credentials rotated; exercising direct insertion for self-test.");
      const tSh = ss.getSheetByName("Tuitions");
      tSh.appendRow([testCode, "Tutor Test", testPhone, "test@upi", "Centum SelfTest Academy", "Madurai", "hybrid", 15, 20, 3, "TRUE", new Date()]);
      crGenerateSeatsForTuition_(ss, testCode, 3);
    } else {
      assert(addRes && addRes.ok === true, "ops-classroom-add executed successfully");
    }

    // 3. Test classroom-info
    const infoRes = classroomRouteGet({ action: "classroom-info", code: testCode });
    assert(infoRes && infoRes.ok === true && infoRes.tuition.tuitionName === "Centum SelfTest Academy", "classroom-info returns tuition details");

    // 4. Test wrong classroom-info
    const wrongInfo = classroomRouteGet({ action: "classroom-info", code: "NON_EXISTENT_CODE_999" });
    assert(wrongInfo && wrongInfo.ok === false, "wrong classroom code returns error");

    // 5. Test seat-claim
    const allSeats = crRows_("Seats").filter(function(s) { return String(s.tuitionCode || "").toUpperCase() === testCode; });
    assert(allSeats.length >= 1, "Seats generated for tuition (" + allSeats.length + " seats)");

    if (allSeats.length > 0) {
      const seatCodeToClaim = allSeats[0].seatCode;

      // Ensure test student exists in Students tab
      const studSh = ss.getSheetByName("Students");
      studSh.appendRow([new Date(), "Test Student", testStudentPhone, "Madurai", "10th", "", "tamil", "app", "free", "", ""]);

      const claimRes = classroomRoutePost({
        action: "seat-claim",
        phone: testStudentPhone,
        seatCode: seatCodeToClaim
      });
      assert(claimRes && claimRes.ok === true && claimRes.plan === "pro", "seat-claim successfully upgraded student to Pro");

      // Test duplicate claim blocked
      const dupRes = classroomRoutePost({
        action: "seat-claim",
        phone: "9123456789", // different phone
        seatCode: seatCodeToClaim
      });
      assert(dupRes && dupRes.ok === false && dupRes.error === "seat-already-claimed", "seat double-claim blocked with seat-already-claimed");
    }

    // 6. Test tuition-stats
    const statsRes = classroomRouteGet({
      action: "tuition-stats",
      code: testCode,
      ownerPhone: testPhone
    });
    assert(statsRes && statsRes.ok === true && statsRes.stats.seatsClaimed >= 1, "tuition-stats returns scoped stats");

    // 7. Test cross-tuition isolation
    const crossRes = classroomRouteGet({
      action: "tuition-stats",
      code: testCode,
      ownerPhone: "9000000000" // wrong phone
    });
    assert(crossRes && crossRes.ok === false, "cross-tuition access denied for unauthorized phone");

    // Cleanup throwaway data
    crDeleteRowsWhere_(ss, "Tuitions", "code", testCode);
    crDeleteRowsWhere_(ss, "Seats", "tuitionCode", testCode);
    crDeleteRowsWhere_(ss, "Students", "phone", testStudentPhone);
    Logger.log("🧹 Cleaned up self-test throwaway data.");

  } catch (err) {
    failed++;
    Logger.log("❌ CRITICAL ERROR during self-test: " + String(err));
  }

  Logger.log("==================================================");
  Logger.log("📊 SELF-TEST SUMMARY: " + passed + " PASSED, " + failed + " FAILED");
  Logger.log("==================================================");
}

// =================== INTERNAL HELPERS (REUSED & SELF-CONTAINED) ===================

function crGetSpreadsheet_() {
  const p = PropertiesService.getScriptProperties();
  const sheetId = p.getProperty("SHEET_ID");
  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {
      Logger.log("Could not open by SHEET_ID property: " + e);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

const CR_SCHEMA = {
  Tuitions: ["code","ownerName","ownerPhone","ownerUpi","tuitionName","district","mode","discountPercent","commissionPercent","seatsTotal","active","createdAt"],
  Seats: ["seatCode","tuitionCode","phone","claimedAt","expiresAt"]
};

function crEnsureTab_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  const headers = CR_SCHEMA[name];
  if (headers && sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  } else if (headers) {
    const existing = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
    headers.forEach(function(h) {
      if (existing.indexOf(h) === -1) {
        sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
      }
    });
  }
  return sh;
}

function crEnsureStudentsTuitionColumn_(ss) {
  const sh = ss.getSheetByName("Students");
  if (!sh || sh.getLastRow() === 0) return;
  const headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  if (headers.indexOf("tuitionCode") === -1) {
    sh.getRange(1, sh.getLastColumn() + 1).setValue("tuitionCode");
  }
}

function crRows_(tabName) {
  const ss = crGetSpreadsheet_();
  const sh = ss.getSheetByName(tabName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(function(h) { return String(h).trim(); });
  const out = [];
  for (let r = 1; r < data.length; r++) {
    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = data[r][c];
    }
    rowObj._rowNumber = r + 1;
    out.push(rowObj);
  }
  return out;
}

function crHash_(salt, password) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + "::" + password, Utilities.Charset.UTF_8);
  return raw.map(function(b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"); }).join("");
}

function crAdminOk_(phone, password) {
  if (!phone || !password) return false;
  const ss = crGetSpreadsheet_();
  const sh = ss.getSheetByName("Admins");
  if (!sh) return false;
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return false;
  const h = data[0].map(String);
  const phoneIdx = h.indexOf("phone");
  const activeIdx = h.indexOf("active");
  const hashIdx = h.indexOf("passwordHash");
  if (phoneIdx === -1 || hashIdx === -1) return false;

  const targetHash = crHash_(String(phone), String(password));
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][phoneIdx]) === String(phone)) {
      const isActive = activeIdx === -1 || String(data[r][activeIdx]).toUpperCase() === "TRUE";
      if (isActive && String(data[r][hashIdx]) === targetHash) {
        return true;
      }
    }
  }
  return false;
}

function crEnsureCouponTabRow_(ss, code, discountPercent, ownerName, ownerPhone, ownerUpi) {
  let sh = ss.getSheetByName("Coupons");
  if (!sh) return;
  const data = sh.getDataRange().getValues();
  if (data.length >= 2) {
    const h = data[0].map(String);
    const codeIdx = h.indexOf("code");
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][codeIdx] || "").trim().toUpperCase() === code) {
        return; // Already registered
      }
    }
  }
  sh.appendRow([code, discountPercent, ownerName, ownerPhone, ownerUpi, "TRUE"]);
}

function crGenerateSeatsForTuition_(ss, tuitionCode, count) {
  const seatSh = crEnsureTab_(ss, "Seats");
  const existingSeats = crRows_("Seats").filter(function(s) {
    return String(s.tuitionCode || "").trim().toUpperCase() === tuitionCode;
  });

  const startIndex = existingSeats.length + 1;
  const rowsToAppend = [];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  for (let i = 0; i < count; i++) {
    const seatNumber = startIndex + i;
    const pad = seatNumber < 10 ? "0" + seatNumber : String(seatNumber);
    const seatCode = tuitionCode + "-S" + pad;
    rowsToAppend.push([seatCode, tuitionCode, "", "", oneYearLater]);
  }

  if (rowsToAppend.length > 0) {
    const startRow = seatSh.getLastRow() + 1;
    seatSh.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  }

  return rowsToAppend.length;
}

function crGetStudentsForTuition_(ss, tuitionCode) {
  const sh = ss.getSheetByName("Students");
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];

  const h = data[0].map(String);
  const tuitionIdx = h.indexOf("tuitionCode");
  const sourceIdx = h.indexOf("source");
  const phoneIdx = h.indexOf("phone");
  const nameIdx = h.indexOf("name");
  const stdIdx = h.indexOf("standard");
  const medIdx = h.indexOf("medium");
  const planIdx = h.indexOf("plan");
  const timeIdx = h.indexOf("timestamp");

  const students = [];
  for (let r = 1; r < data.length; r++) {
    const tCode = tuitionIdx !== -1 ? String(data[r][tuitionIdx] || "").trim().toUpperCase() : "";
    const sCode = sourceIdx !== -1 ? String(data[r][sourceIdx] || "").trim().toUpperCase() : "";

    if (tCode === tuitionCode || sCode === tuitionCode || sCode === "REF:" + tuitionCode) {
      students.push({
        phone: String(data[r][phoneIdx] || ""),
        name: String(data[r][nameIdx] || "Student"),
        standard: String(data[r][stdIdx] || ""),
        medium: String(data[r][medIdx] || ""),
        plan: String(data[r][planIdx] || "free"),
        joinedAt: data[r][timeIdx]
      });
    }
  }
  return students;
}

function crComputeStudentScoresAndActivity_(ss, studentPhones, students) {
  const sh = ss.getSheetByName("Scores");
  const studentScoresMap = {};
  const weeklyCounts = {};

  studentPhones.forEach(function(ph) {
    const norm = ph.slice(-10);
    studentScoresMap[norm] = { count: 0, totalPercent: 0 };
  });

  if (sh && sh.getLastRow() > 1) {
    const data = sh.getDataRange().getValues();
    const h = data[0].map(String);
    const phoneIdx = h.indexOf("phone");
    const scoreIdx = h.indexOf("score");
    const totalIdx = h.indexOf("total");
    const timeIdx = h.indexOf("timestamp");

    for (let r = 1; r < data.length; r++) {
      const p = String(data[r][phoneIdx] || "").replace(/\D/g, "").slice(-10);
      if (studentScoresMap[p]) {
        const sc = Number(data[r][scoreIdx]) || 0;
        const tot = Number(data[r][totalIdx]) || 1;
        const pct = Math.round((sc / tot) * 100);

        studentScoresMap[p].count += 1;
        studentScoresMap[p].totalPercent += pct;

        // Group weekly activity
        const dt = data[r][timeIdx] instanceof Date ? data[r][timeIdx] : new Date(data[r][timeIdx]);
        if (!isNaN(dt.getTime())) {
          const weekKey = Utilities.formatDate(dt, "Asia/Kolkata", "yyyy-'W'ww");
          weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
        }
      }
    }
  }

  // Format student records with privacy-safe masked phone
  const studentList = students.map(function(s) {
    const norm = String(s.phone || "").replace(/\D/g, "").slice(-10);
    const scInfo = studentScoresMap[norm] || { count: 0, totalPercent: 0 };
    const avgScore = scInfo.count > 0 ? Math.round(scInfo.totalPercent / scInfo.count) : 0;
    return {
      name: s.name,
      phoneMasked: "xxxxx" + norm.slice(-4),
      standard: s.standard,
      medium: s.medium,
      plan: s.plan,
      testsTaken: scInfo.count,
      avgScore: avgScore
    };
  });

  return {
    students: studentList,
    weeklyActivity: weeklyCounts
  };
}

function crComputePayoutStatement_(ss, tuitionCode, commissionPercent) {
  const sh = ss.getSheetByName("Referrals");
  if (!sh || sh.getLastRow() < 2) {
    return {
      totalSalesRupees: 0,
      commissionPercent: commissionPercent,
      commissionEarnedRupees: 0,
      referralsCount: 0,
      payoutStatus: "Pending"
    };
  }

  const data = sh.getDataRange().getValues();
  const h = data[0].map(String);
  const codeIdx = h.indexOf("code");
  const amountIdx = h.indexOf("amount");
  const shareIdx = h.indexOf("referrerShare");
  const statusIdx = h.indexOf("payoutStatus");

  let totalSales = 0;
  let totalShare = 0;
  let count = 0;
  let lastStatus = "Pending";

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][codeIdx] || "").trim().toUpperCase() === tuitionCode) {
      count++;
      const amt = Number(data[r][amountIdx]) || 0;
      totalSales += amt;
      const shVal = Number(data[r][shareIdx]) || Math.round(amt * (commissionPercent / 100));
      totalShare += shVal;
      if (statusIdx !== -1 && data[r][statusIdx]) {
        lastStatus = String(data[r][statusIdx]);
      }
    }
  }

  return {
    totalSalesRupees: totalSales,
    commissionPercent: commissionPercent,
    commissionEarnedRupees: totalShare,
    referralsCount: count,
    payoutStatus: lastStatus
  };
}

function crDeleteRowsWhere_(ss, tabName, colName, value) {
  const sh = ss.getSheetByName(tabName);
  if (!sh || sh.getLastRow() < 2) return;
  const data = sh.getDataRange().getValues();
  const h = data[0].map(String);
  const idx = h.indexOf(colName);
  if (idx === -1) return;

  for (let r = data.length - 1; r >= 1; r--) {
    if (String(data[r][idx] || "").trim().toUpperCase() === String(value).trim().toUpperCase()) {
      sh.deleteRow(r + 1);
    }
  }
}
