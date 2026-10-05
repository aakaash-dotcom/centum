/**
 * CENTUM BACKEND — CLASSROOMS COMPANION MODULE (Classrooms-Companion.gs)
 * Self-contained additive file for Google Apps Script.
 * Supports Student Classroom View, Teacher Daily Diary & Attendance Roster.
 *
 * HOW THE FOUNDER INSTALLS THIS:
 * 1. Open Google Sheets -> Extensions -> Apps Script.
 * 2. Click '+' next to Files -> choose 'Script' -> name it 'Classrooms-Companion'.
 * 3. Paste ALL of this code into Classrooms-Companion.gs.
 * 4. In Code.gs, inside doGet(e), add the 3 GET dispatch lines (see banner below).
 * 5. In Code.gs, inside doPost(e), add the 3 POST dispatch lines (see banner below).
 * 6. Run 'classroomCompanionSelfTest' from the editor Run menu to verify green.
 * 7. Deploy -> Manage deployments -> edit -> New version -> Deploy.
 *
 * NOTE: Entry points DO NOT have trailing underscores so they are visible and callable.
 * Helpers keep trailing underscore '_'.
 *
 * =========================================================================================
 * EXACT DISPATCH LINES TO PASTE IN Code.gs:
 * =========================================================================================
 *
 * [IN doGet(e) - right before unknown action]:
 * // ==== CLASSROOMS COMPANION (DIARY & ATTENDANCE) GET DISPATCH ====
 * if (a === "classroom") { const _out = typeof classroomView === 'function' ? classroomView(e) : null; if (_out) return json_(_out); }
 * if (a === "ownerDiary") { const _out = typeof ownerDiary === 'function' ? ownerDiary(e) : null; if (_out) return json_(_out); }
 * if (a === "ownerAttendance") { const _out = typeof ownerAttendance === 'function' ? ownerAttendance(e) : null; if (_out) return json_(_out); }
 *
 * [IN doPost(e) - right before unknown type]:
 * // ==== CLASSROOMS COMPANION (DIARY & ATTENDANCE) POST DISPATCH ====
 * if (body.type === "ownerDiarySave" || body.action === "ownerDiarySave") { const _out = typeof ownerDiarySave === 'function' ? ownerDiarySave(body) : null; if (_out) return json_(_out); }
 * if (body.type === "ownerDiaryDelete" || body.action === "ownerDiaryDelete") { const _out = typeof ownerDiaryDelete === 'function' ? ownerDiaryDelete(body) : null; if (_out) return json_(_out); }
 * if (body.type === "ownerAttendanceSave" || body.action === "ownerAttendanceSave") { const _out = typeof ownerAttendanceSave === 'function' ? ownerAttendanceSave(body) : null; if (_out) return json_(_out); }
 * =========================================================================================
 */

// =================== PUBLIC ENTRY POINTS (WITHOUT UNDERSCORES) ===================

/**
 * GET ?action=classroom&phone=
 * Returns student's tuition card, diary feed (latest 20), and 30-day attendance %.
 * If phone has not claimed/joined a tuition, returns joined=false with teaser preview.
 */
function classroomView(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const rawPhone = String(params.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";

    const ss = ccGetSpreadsheet_();
    ccEnsureTabs_(ss);

    if (!cleanPhone) {
      return ccUnjoinedPreview_();
    }

    // 1. Locate student's tuition code via Seats or Students
    const tuitionCode = ccGetStudentTuition_(ss, cleanPhone);
    if (!tuitionCode) {
      return ccUnjoinedPreview_();
    }

    // 2. Fetch tuition details
    const tuition = ccFindTuition_(ss, tuitionCode);
    if (!tuition) {
      return ccUnjoinedPreview_();
    }

    // 3. Fetch diary entries for this tuition (latest 20, newest first)
    const allDiary = ccRows_(ss, "TuitionDiary")
      .filter(function(row) {
        return String(row.tuitionCode || "").trim().toUpperCase() === tuitionCode.toUpperCase();
      })
      .sort(function(a, b) {
        const da = new Date(a.date || a.createdAt).getTime() || 0;
        const db = new Date(b.date || b.createdAt).getTime() || 0;
        return db - da;
      })
      .slice(0, 20)
      .map(function(d) {
        return {
          id: String(d.id || ""),
          tuitionCode: String(d.tuitionCode || ""),
          date: d.date instanceof Date ? Utilities.formatDate(d.date, "Asia/Kolkata", "yyyy-MM-dd") : String(d.date || ""),
          tag: String(d.tag || "homework").toLowerCase(),
          text: String(d.text || "").slice(0, 500),
          createdAt: d.createdAt instanceof Date ? Utilities.formatDate(d.createdAt, "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm:ss'Z'") : String(d.createdAt || "")
        };
      });

    // 4. Calculate student's 30-day attendance %
    const attendanceStats = ccComputeStudentAttendance_(ss, tuitionCode, cleanPhone);

    return {
      ok: true,
      joined: true,
      tuition: {
        name: tuition.tuitionName || "Tuition Centre",
        teacher: tuition.ownerName || "Tuition Teacher",
        code: tuition.code
      },
      diary: allDiary,
      myAttendance: {
        pct30: attendanceStats.pct30,
        lastDate: attendanceStats.lastDate || "No records yet"
      }
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * GET ?action=ownerDiary&code=&ownerPhone=
 * Returns diary entries for the authorized owner's tuition.
 */
function ownerDiary(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const code = String(params.code || "").trim().toUpperCase();
    const ownerPhone = String(params.ownerPhone || "").replace(/\D/g, "");

    const ss = ccGetSpreadsheet_();
    ccEnsureTabs_(ss);

    if (!code || !ownerPhone) {
      return { ok: false, error: "code-and-ownerPhone-required" };
    }

    if (!ccVerifyOwner_(ss, code, ownerPhone)) {
      return { ok: false, error: "unauthorized-cross-tuition-denied" };
    }

    const entries = ccRows_(ss, "TuitionDiary")
      .filter(function(row) {
        return String(row.tuitionCode || "").trim().toUpperCase() === code;
      })
      .sort(function(a, b) {
        const da = new Date(a.date || a.createdAt).getTime() || 0;
        const db = new Date(b.date || b.createdAt).getTime() || 0;
        return db - da;
      })
      .map(function(d) {
        return {
          id: String(d.id || ""),
          tuitionCode: String(d.tuitionCode || ""),
          date: d.date instanceof Date ? Utilities.formatDate(d.date, "Asia/Kolkata", "yyyy-MM-dd") : String(d.date || ""),
          tag: String(d.tag || "homework").toLowerCase(),
          text: String(d.text || "").slice(0, 500),
          createdAt: d.createdAt instanceof Date ? Utilities.formatDate(d.createdAt, "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm:ss'Z'") : String(d.createdAt || "")
        };
      });

    return { ok: true, code: code, diary: entries };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * GET ?action=ownerAttendance&code=&ownerPhone=&date=
 * Returns student roster with attendance status for given date + 30-day % per student.
 */
function ownerAttendance(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const code = String(params.code || "").trim().toUpperCase();
    const ownerPhone = String(params.ownerPhone || "").replace(/\D/g, "");
    const dateStr = String(params.date || Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd")).slice(0, 10);

    const ss = ccGetSpreadsheet_();
    ccEnsureTabs_(ss);

    if (!code || !ownerPhone) {
      return { ok: false, error: "code-and-ownerPhone-required" };
    }

    if (!ccVerifyOwner_(ss, code, ownerPhone)) {
      return { ok: false, error: "unauthorized-cross-tuition-denied" };
    }

    const roster = ccGetTuitionRoster_(ss, code, dateStr);
    const presentCount = roster.filter(function(r) { return r.status === "P"; }).length;
    const absentCount = roster.filter(function(r) { return r.status === "A"; }).length;

    return {
      ok: true,
      code: code,
      date: dateStr,
      roster: roster,
      summary: {
        present: presentCount,
        absent: absentCount,
        unmarked: roster.length - presentCount - absentCount,
        total: roster.length
      }
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * POST {type:"ownerDiarySave", code, ownerPhone, date, tag, text}
 */
function ownerDiarySave(body) {
  try {
    const code = String(body.code || "").trim().toUpperCase();
    const ownerPhone = String(body.ownerPhone || "").replace(/\D/g, "");
    const text = String(body.text || "").trim().slice(0, 500);
    const dateStr = String(body.date || Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd")).slice(0, 10);
    const tag = String(body.tag || "homework").toLowerCase();

    if (!code || !ownerPhone) return { ok: false, error: "code-and-ownerPhone-required" };
    if (!text) return { ok: false, error: "text-required" };

    const ss = ccGetSpreadsheet_();
    ccEnsureTabs_(ss);

    if (!ccVerifyOwner_(ss, code, ownerPhone)) {
      return { ok: false, error: "unauthorized-cross-tuition-denied" };
    }

    const id = "d_" + new Date().getTime() + "_" + Math.random().toString(36).slice(2, 6);
    const sh = ss.getSheetByName("TuitionDiary");
    sh.appendRow([id, code, dateStr, tag, text, new Date()]);

    return {
      ok: true,
      id: id,
      entry: {
        id: id,
        tuitionCode: code,
        date: dateStr,
        tag: tag,
        text: text,
        createdAt: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm:ss'Z'")
      }
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * POST {type:"ownerDiaryDelete", code, ownerPhone, id}
 */
function ownerDiaryDelete(body) {
  try {
    const code = String(body.code || "").trim().toUpperCase();
    const ownerPhone = String(body.ownerPhone || "").replace(/\D/g, "");
    const id = String(body.id || "").trim();

    if (!code || !ownerPhone || !id) return { ok: false, error: "code-ownerPhone-and-id-required" };

    const ss = ccGetSpreadsheet_();
    ccEnsureTabs_(ss);

    if (!ccVerifyOwner_(ss, code, ownerPhone)) {
      return { ok: false, error: "unauthorized-cross-tuition-denied" };
    }

    const sh = ss.getSheetByName("TuitionDiary");
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, deleted: false };

    const h = data[0].map(String);
    const idCol = h.indexOf("id");
    const codeCol = h.indexOf("tuitionCode");

    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idCol]) === id && String(data[r][codeCol]).trim().toUpperCase() === code) {
        sh.deleteRow(r + 1);
        return { ok: true, deleted: true };
      }
    }

    return { ok: true, deleted: false };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * POST {type:"ownerAttendanceSave", code, ownerPhone, date, records:[{phone, status, note}]}
 * Idempotent overwrite per date + phone.
 */
function ownerAttendanceSave(body) {
  try {
    const code = String(body.code || "").trim().toUpperCase();
    const ownerPhone = String(body.ownerPhone || "").replace(/\D/g, "");
    const dateStr = String(body.date || Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd")).slice(0, 10);
    const records = Array.isArray(body.records) ? body.records : [];

    if (!code || !ownerPhone) return { ok: false, error: "code-and-ownerPhone-required" };

    const ss = ccGetSpreadsheet_();
    ccEnsureTabs_(ss);

    if (!ccVerifyOwner_(ss, code, ownerPhone)) {
      return { ok: false, error: "unauthorized-cross-tuition-denied" };
    }

    const sh = ss.getSheetByName("TuitionAttendance");
    const data = sh.getDataRange().getValues();
    const h = data[0].map(String);
    const codeCol = h.indexOf("tuitionCode");
    const dateCol = h.indexOf("date");
    const phoneCol = h.indexOf("phone");
    const statusCol = h.indexOf("status");
    const noteCol = h.indexOf("note");

    // Validate that student phone belongs to this tuition
    const claimedPhones = new Set();
    const seats = ccRows_(ss, "Seats").filter(function(s) {
      return String(s.tuitionCode || "").trim().toUpperCase() === code;
    });
    seats.forEach(function(s) {
      const ph = String(s.phone || "").replace(/\D/g, "");
      if (ph.length >= 10) claimedPhones.add(ph.slice(-10));
    });
    const students = ccRows_(ss, "Students").filter(function(st) {
      return String(st.tuitionCode || "").trim().toUpperCase() === code;
    });
    students.forEach(function(st) {
      const ph = String(st.phone || "").replace(/\D/g, "");
      if (ph.length >= 10) claimedPhones.add(ph.slice(-10));
    });

    let savedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      const ph = String(item.phone || "").replace(/\D/g, "");
      const cleanPh = ph.length >= 10 ? ph.slice(-10) : ph;
      const status = String(item.status || "P").toUpperCase() === "A" ? "A" : "P";
      const note = String(item.note || "").slice(0, 200);

      if (!cleanPh || !claimedPhones.has(cleanPh)) continue;

      let foundRow = -1;
      for (let r = 1; r < data.length; r++) {
        const rowD = data[r][dateCol] instanceof Date
          ? Utilities.formatDate(data[r][dateCol], "Asia/Kolkata", "yyyy-MM-dd")
          : String(data[r][dateCol]).slice(0, 10);
        const rowPh = String(data[r][phoneCol] || "").replace(/\D/g, "");
        const cleanRowPh = rowPh.length >= 10 ? rowPh.slice(-10) : rowPh;

        if (String(data[r][codeCol]).trim().toUpperCase() === code &&
            rowD === dateStr &&
            cleanRowPh === cleanPh) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow !== -1) {
        // Idempotent overwrite
        sh.getRange(foundRow, statusCol + 1).setValue(status);
        if (noteCol !== -1) sh.getRange(foundRow, noteCol + 1).setValue(note);
      } else {
        // Append new record
        const id = "att_" + new Date().getTime() + "_" + Math.random().toString(36).slice(2, 6);
        sh.appendRow([id, code, dateStr, cleanPh, status, note]);
      }
      savedCount++;
    }

    return { ok: true, savedCount: savedCount, date: dateStr };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Self-test suite runnable from Apps Script editor
 */
function classroomCompanionSelfTest() {
  const ss = ccGetSpreadsheet_();
  ccEnsureTabs_(ss);

  const preview = classroomView({ parameter: { phone: "0000000000" } });
  Logger.log("SelfTest: unjoined preview -> " + (preview.joined === false ? "PASS" : "FAIL"));

  const diaryTest = ownerDiary({ parameter: { code: "DEMO10", ownerPhone: "9840123456" } });
  Logger.log("SelfTest: ownerDiary DEMO10 -> " + (diaryTest.ok ? "PASS" : "FAIL"));

  return {
    ok: true,
    unjoinedPreview: preview.joined === false,
    ownerDiary: diaryTest.ok,
    timestamp: new Date().toISOString()
  };
}

// =================== PRIVATE HELPERS (WITH UNDERSCORE) ===================

function ccGetSpreadsheet_() {
  const p = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (p) return SpreadsheetApp.openById(p);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ccEnsureTabs_(ss) {
  const required = {
    "TuitionDiary": ["id", "tuitionCode", "date", "tag", "text", "createdAt"],
    "TuitionAttendance": ["id", "tuitionCode", "date", "phone", "status", "note"]
  };

  Object.keys(required).forEach(function(tab) {
    let sh = ss.getSheetByName(tab);
    if (!sh) {
      sh = ss.insertSheet(tab);
      sh.appendRow(required[tab]);
    }
  });
}

function ccRows_(ss, tabName) {
  const sh = ss.getSheetByName(tabName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String);

  const out = [];
  for (let r = 1; r < data.length; r++) {
    const row = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = data[r][c];
    }
    out.push(row);
  }
  return out;
}

function ccFindTuition_(ss, code) {
  const tuitions = ccRows_(ss, "Tuitions");
  const clean = String(code || "").trim().toUpperCase();
  for (let i = 0; i < tuitions.length; i++) {
    if (String(tuitions[i].code || "").trim().toUpperCase() === clean) {
      return tuitions[i];
    }
  }
  return null;
}

function ccVerifyOwner_(ss, code, ownerPhone) {
  const tuition = ccFindTuition_(ss, code);
  if (!tuition) return false;

  const targetOwner = String(tuition.ownerPhone || "").replace(/\D/g, "").slice(-10);
  const inputOwner = String(ownerPhone || "").replace(/\D/g, "").slice(-10);

  return Boolean(targetOwner && inputOwner && targetOwner === inputOwner);
}

function ccGetStudentTuition_(ss, cleanPhone) {
  // Check Seats tab first
  const seats = ccRows_(ss, "Seats");
  for (let i = 0; i < seats.length; i++) {
    const seatPh = String(seats[i].phone || "").replace(/\D/g, "");
    if (seatPh.slice(-10) === cleanPhone) {
      return String(seats[i].tuitionCode || "").trim().toUpperCase();
    }
  }

  // Check Students tab tuitionCode column
  const students = ccRows_(ss, "Students");
  for (let j = 0; j < students.length; j++) {
    const stPh = String(students[j].phone || "").replace(/\D/g, "");
    if (stPh.slice(-10) === cleanPhone && students[j].tuitionCode) {
      return String(students[j].tuitionCode).trim().toUpperCase();
    }
  }

  return null;
}

function ccComputeStudentAttendance_(ss, tuitionCode, cleanPhone) {
  const records = ccRows_(ss, "TuitionAttendance").filter(function(r) {
    const rCode = String(r.tuitionCode || "").trim().toUpperCase();
    const rPh = String(r.phone || "").replace(/\D/g, "").slice(-10);
    return rCode === tuitionCode.toUpperCase() && rPh === cleanPhone;
  });

  if (records.length === 0) {
    return { pct30: 100, lastDate: "" };
  }

  const sorted = records.sort(function(a, b) {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    return db - da;
  });

  const lastDate = sorted[0].date instanceof Date
    ? Utilities.formatDate(sorted[0].date, "Asia/Kolkata", "yyyy-MM-dd")
    : String(sorted[0].date || "");

  const pCount = records.filter(function(r) { return String(r.status).toUpperCase() === "P"; }).length;
  const pct = Math.round((pCount / records.length) * 100);

  return { pct30: pct, lastDate: lastDate };
}

function ccGetTuitionRoster_(ss, code, dateStr) {
  const claimedPhones = new Set();
  const seats = ccRows_(ss, "Seats").filter(function(s) {
    return String(s.tuitionCode || "").trim().toUpperCase() === code;
  });
  seats.forEach(function(s) {
    const ph = String(s.phone || "").replace(/\D/g, "");
    if (ph.length >= 10) claimedPhones.add(ph.slice(-10));
  });

  const students = ccRows_(ss, "Students").filter(function(st) {
    return String(st.tuitionCode || "").trim().toUpperCase() === code;
  });
  students.forEach(function(st) {
    const ph = String(st.phone || "").replace(/\D/g, "");
    if (ph.length >= 10) claimedPhones.add(ph.slice(-10));
  });

  const allAttendance = ccRows_(ss, "TuitionAttendance").filter(function(r) {
    return String(r.tuitionCode || "").trim().toUpperCase() === code;
  });

  const roster = [];
  claimedPhones.forEach(function(cleanPh) {
    let studentName = "Student " + cleanPh.slice(-4);
    let standard = "10th";

    for (let i = 0; i < students.length; i++) {
      const sPh = String(students[i].phone || "").replace(/\D/g, "").slice(-10);
      if (sPh === cleanPh) {
        if (students[i].name) studentName = String(students[i].name);
        if (students[i].standard) standard = String(students[i].standard);
        break;
      }
    }

    const studentRecords = allAttendance.filter(function(r) {
      return String(r.phone || "").replace(/\D/g, "").slice(-10) === cleanPh;
    });

    const dayRecord = studentRecords.find(function(r) {
      const d = r.date instanceof Date ? Utilities.formatDate(r.date, "Asia/Kolkata", "yyyy-MM-dd") : String(r.date).slice(0, 10);
      return d === dateStr;
    });

    let pct30 = 100;
    if (studentRecords.length > 0) {
      const pCount = studentRecords.filter(function(r) { return String(r.status).toUpperCase() === "P"; }).length;
      pct30 = Math.round((pCount / studentRecords.length) * 100);
    }

    roster.push({
      phone: cleanPh,
      maskedPhone: "xxxxx" + cleanPh.slice(-4),
      name: studentName,
      standard: standard,
      status: dayRecord ? String(dayRecord.status).toUpperCase() : null,
      note: dayRecord ? String(dayRecord.note || "") : "",
      pct30: pct30
    });
  });

  return roster;
}

function ccUnjoinedPreview_() {
  return {
    ok: true,
    joined: false,
    tuition: null,
    diary: [],
    myAttendance: null,
    preview: {
      sampleTuition: {
        name: "Apex Centum Academy",
        teacher: "Ramesh Kumar Sir",
        code: "DEMO10"
      },
      sampleDiary: [
        {
          id: "preview-1",
          tag: "homework",
          text: "Maths Chapter 1 Exercise 1.2 — Solve Question 1 to 5. Bring completed notebook tomorrow.",
          date: "Today"
        },
        {
          id: "preview-2",
          tag: "notice",
          text: "Special revision masterclass this Saturday at 10:00 AM on Quadratic Equations.",
          date: "Yesterday"
        },
        {
          id: "preview-3",
          tag: "exam",
          text: "Unit Test 1 answer keys and high-yield scoring tricks uploaded to Pro Materials.",
          date: "2 days ago"
        }
      ],
      sampleAttendance: { pct30: 93, lastDate: "Today" }
    }
  };
}
