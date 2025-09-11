const express = require("express");
const router = express.Router();
const seedrandom = require("seedrandom");
const db = require("../db");
const verifyToken = require("./jwtMiddleware");

router.get("/generated-qb-stats", verifyToken, (req, res) => {
  const weeklyQuery = `
      SELECT 
        YEARWEEK(date_time, 1) AS week, 
        COUNT(*) AS total_generated
      FROM qb.generated_papers
      WHERE date_time >= NOW() - INTERVAL 7 WEEK
      GROUP BY YEARWEEK(date_time, 1)
      ORDER BY week ASC
    `;

  const monthlyQuery = `
      SELECT 
        DATE_FORMAT(date_time, '%Y-%m') AS month, 
        COUNT(*) AS total_generated
      FROM qb.generated_papers
      WHERE date_time >= NOW() - INTERVAL 6 MONTH
      GROUP BY DATE_FORMAT(date_time, '%Y-%m')
      ORDER BY month ASC
    `;

  db.query(weeklyQuery, (err, weeklyResults) => {
    if (err) return res.status(400).json({ error: err.message });

    db.query(monthlyQuery, (err, monthlyResults) => {
      if (err) return res.status(400).json({ error: err.message });

      res.status(200).json({
        weekly: weeklyResults,
        monthly: monthlyResults,
      });
    });
  });
});

router.get("/generate-history", verifyToken, (req, res) => {
  const sql = `
    SELECT id, course_code, subject_name, exam_name, date_time
    FROM generated_papers
    ORDER BY date_time DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching question history:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

router.get("/faculty-list", verifyToken, (req, res) => {
  const query = "SELECT * FROM faculty_list";
  db.query(query, (err, results) => {
    if (!err) res.status(200).send(results);
    else return res.status(400).send(err);
  });
});

router.get("/faculty-question-list", verifyToken, (req, res) => {
  const { course_code } = req.query;
  if (!course_code)
    return res.status(400).json({ error: "Course code is required" });

  const query =
    "SELECT faculty_id,course_code,mark,remarks,question_id,question,unit,updated_at,status,topic  FROM question_status WHERE course_code = ?";
  db.query(query, [course_code], (err, results) => {
    if (!err) res.status(200).json(results);
    else res.status(400).json({ error: err.message });
  });
});

router.post("/generate-history", verifyToken, (req, res) => {
  const { course_code, subject_name, exam_name } = req.body;

  if (!course_code || !subject_name || !exam_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const date_time = new Date();

  const sql = `
    INSERT INTO generated_papers (course_code, subject_name, exam_name, date_time)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [course_code, subject_name, exam_name, date_time],
    (err, result) => {
      if (err) {
        console.error("Error inserting question history:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(201).json({
        message: "History recorded successfully",
        insertId: result.insertId,
      });
    }
  );
});

router.get("/question-history", verifyToken, (req, res) => {
  const query = `
      SELECT 
        q.id AS id,
        fl.faculty_id,
        fl.course_code,
        q.unit,
        q.created_at ,
        q.status
      FROM 
        qb.faculty_list AS fl 
      JOIN 
        qb.question_status AS q 
      ON 
        fl.course_code = q.course_code
    `;
  db.query(query, (err, results) => {
    if (!err) res.status(200).send(results);
    else return res.status(400).send(err);
  });
});

router.get("/recently-added", verifyToken, (req, res) => {
  const query = `
      SELECT fl.course_code,fl.faculty_id, q.unit, q.created_at ,q.status
      FROM qb.faculty_list AS fl 
      JOIN qb.question_status AS q ON fl.course_code = q.course_code 
      ORDER BY q.created_at DESC 
      LIMIT 5
    `;
  db.query(query, (err, results) => {
    if (!err) res.status(200).send(results);
    else return res.status(400).send(err);
  });
});

function normalizeUnit(unit) {
  return unit
    .replace("Unit ", "")
    .replace(/([A-Za-z]+)/g, ".$1")
    .split(".")
    .map((v) => (isNaN(v) ? v : parseInt(v)));
}

function compareUnits(u1, u2) {
  const a = normalizeUnit(u1);
  const b = normalizeUnit(u2);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const valA = a[i] !== undefined ? a[i] : 0;
    const valB = b[i] !== undefined ? b[i] : 0;

    if (valA < valB) return -1;
    if (valA > valB) return 1;
  }
  return 0;
}

function shuffleArray(arr, seed) {
  let rng = new seedrandom(seed);
  let shuffled = arr.slice();

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function getPortionFilter(sectionName) {
  const index = sectionName[1]; // "1", "2", or "3"
  if (index === "1") return ["A"];
  if (index === "2") return ["A", "B"];
  if (index === "3") return ["B"];
  return ["A", "B"];
}

function isPortionAllowed(portion, allowedPortions) {
  if (!portion) return false;
  const normalized = portion.toUpperCase();
  if (normalized === "A&B" || normalized === "A AND B") {
    return allowedPortions.some((p) => ["A", "B"].includes(p));
  }
  return allowedPortions.includes(normalized);
}

function isMCQ(q) {
  return q.mark === 1 && q.option_a && q.option_b && q.option_c && q.option_d;
}

function groupQuestions(unit, questions, usedIds, sectionName) {
  const allowedPortions = getPortionFilter(sectionName);
  const unitArray = Array.isArray(unit) ? unit : [unit];

  return {
    oneMarks: questions.filter(
      (q) =>
        unitArray.includes(q.unit) &&
        q.mark === 1 &&
        isMCQ(q) &&
        !usedIds.has(q.id) &&
        isPortionAllowed(q.portion, allowedPortions)
    ),
    otherMarks: questions.filter(
      (q) =>
        unitArray.includes(q.unit) &&
        q.mark !== 1 &&
        !usedIds.has(q.id) &&
        isPortionAllowed(q.portion, allowedPortions)
    ),
  };
}

function findPairForSum(questions, targetSum) {
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      if (questions[i].mark + questions[j].mark === targetSum) {
        return [questions[i], questions[j]];
      }
    }
  }
  return null;
}

const sectionUnits = {
  A1: "Unit 1",
  A2: "Unit 1",
  A3: "Unit 1",
  B1: "Unit 2",
  B2: "Unit 2",
  B3: "Unit 2",
  C1: "Unit 3",
  C2: "Unit 3",
  C3: "Unit 3",
  D1: "Unit 4",
  D2: "Unit 4",
  D3: "Unit 4",
  E1: "Unit 5",
  E2: "Unit 5",
  E3: "Unit 5",
};

// Helper function to select questions based on detailed rules
function selectPgQuestions(questions, rules, excludeIds = new Set()) {
  const getUnit = (q) => (q?.unit || q?.unit_name || "Any").trim();
  const getMarks = (q) => Number(q?.marks ?? q?.mark ?? 0);

  const singlesIndex = {};
  questions.forEach(q => {
    const m = getMarks(q);
    if (m === 0) return;
    const u = getUnit(q).toLowerCase();
    if (!singlesIndex[m]) singlesIndex[m] = {};
    if (!singlesIndex[m][u]) singlesIndex[m][u] = [];
    singlesIndex[m][u].push(q);
  });

  const selectedSingles = [];
  const selectedPairs = [];
  // Use excludes across sets
  const usedQuestionIds = new Set(Array.from(excludeIds || []));

  const pickSinglesFromPool = (pool, count) => {
    const available = pool.filter(q => !usedQuestionIds.has(q.id));
    if (available.length < count) {
      return { picked: [], shortage: count - available.length };
    }
    const selection = available.slice(0, count);
    selection.forEach(q => usedQuestionIds.add(q.id));
    return { picked: selection, shortage: 0 };
  };

  const marksToProcess = [1, 2, 3, 4, 5, 6, 13, 15];
  for (const m of marksToProcess) {
    const isPair = rules[`isPair${m}`];
    const unitCounts = rules.unitsCount ? (rules.unitsCount[String(m)] || {}) : {};
    const totalFromUnits = Object.values(unitCounts).reduce((s, v) => s + (Number(v) || 0), 0);

    if (totalFromUnits > 0) {
      for (const [unitName, countStr] of Object.entries(unitCounts)) {
        const count = Number(countStr || 0);
        if (count === 0) continue;

        const unitKey = unitName.toLowerCase();
        const pool = singlesIndex[m] && singlesIndex[m][unitKey] ? singlesIndex[m][unitKey] : [];

        if (isPair) {
          if (m === 15) {
            // For each requested 15-mark pair for this unit:
            for (let i = 0; i < count; i++) {
              // Pick one from the specified unit
              const availableA = pool.filter(q => !usedQuestionIds.has(q.id));
              if (availableA.length < 1) {
                throw new Error(`Cannot create 15-mark pair for ${unitName}: not enough questions in this unit.`);
              }
              const qA = availableA[0];
              usedQuestionIds.add(qA.id);

              // Pick one from a different unit
              let foundB = null;
              for (const [otherUnit, otherPool] of Object.entries(singlesIndex[m])) {
                if (otherUnit === unitKey) continue;
                const availableB = otherPool.filter(q => !usedQuestionIds.has(q.id));
                if (availableB.length > 0) {
                  foundB = availableB[0];
                  usedQuestionIds.add(foundB.id);
                  break;
                }
              }
              if (!foundB) {
                throw new Error(`Cannot create 15-mark pair for ${unitName}: not enough questions in other units.`);
              }
              selectedPairs.push({ a: qA, b: foundB });
            }
          } else {
            // Other marks: pairs from the same unit
            const neededSingles = count * 2;
            const { picked, shortage } = pickSinglesFromPool(pool, neededSingles);
            if (shortage > 0) {
              throw new Error(`Cannot create ${count} pair(s) for ${m}-marks in ${unitName}. Need ${neededSingles} questions, but only found ${neededSingles - shortage}.`);
            }
            for (let i = 0; i < picked.length; i += 2) {
              selectedPairs.push({ a: picked[i], b: picked[i+1] });
            }
          }
        } else {
          const { picked, shortage } = pickSinglesFromPool(pool, count);
          if (shortage > 0) {
            throw new Error(`Not enough ${m}-mark questions in ${unitName}. Requested ${count}, found ${count - shortage}.`);
          }
          selectedSingles.push(...picked);
        }
      }
    } else {
      const totalCount = Number(rules[`count${m}`] || 0);
      if (totalCount === 0) continue;

      const allItemsForMark = (singlesIndex[m] ? Object.values(singlesIndex[m]).flat() : []);
      if (isPair) {
        if (m === 15) {
          // 15-mark: Each pair must be from different units
          for (let i = 0; i < totalCount; i++) {
            // Pick one from any unit
            const availableA = allItemsForMark.filter(q => !usedQuestionIds.has(q.id));
            if (availableA.length < 1) {
              throw new Error(`Cannot create 15-mark pair: not enough questions for first side.`);
            }
            const qA = availableA[0];
            usedQuestionIds.add(qA.id);

            // Pick one from a different unit
            let foundB = null;
            for (const qB of allItemsForMark) {
              if (!usedQuestionIds.has(qB.id) && getUnit(qB).toLowerCase() !== getUnit(qA).toLowerCase()) {
                foundB = qB;
                usedQuestionIds.add(qB.id);
                break;
              }
            }
            if (!foundB) {
              throw new Error(`Cannot create 15-mark pair: not enough questions in other units.`);
            }
            selectedPairs.push({ a: qA, b: foundB });
          }
        } else {
          const neededSingles = totalCount * 2;
          const { picked, shortage } = pickSinglesFromPool(allItemsForMark, neededSingles);
          if (shortage > 0) {
            throw new Error(`Cannot create ${totalCount} pair(s) for ${m}-marks across all units. Need ${neededSingles} questions, but only found ${neededSingles - shortage}.`);
          }
          for (let i = 0; i < picked.length; i += 2) {
            selectedPairs.push({ a: picked[i], b: picked[i+1] });
          }
        }
      } else {
        const { picked, shortage } = pickSinglesFromPool(allItemsForMark, totalCount);
        if (shortage > 0) {
          throw new Error(`Not enough ${m}-mark questions available across all units. Requested ${totalCount}, found ${totalCount - shortage}.`);
        }
        selectedSingles.push(...picked);
      }
    }
  }

  return { partA: selectedSingles, partB: selectedPairs, partC: null };
}

router.get("/generate-pg-qb", verifyToken, (req, res) => {
  // Always use per-mark/per-unit for PG, ignore exam_type
  const { course_code, set } = req.query;

  if (!course_code) {
    return res.status(400).json({ error: "Course code is required." });
  }

  // Collect excludes across sets if provided
  const excludeIds = (req.query.exclude_ids || "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));

  // Always fetch all questions for the course
  const sql = `SELECT * FROM questions WHERE course_code = ?`;
  db.query(sql, [course_code], (err, allQuestions) => {
    if (err) {
      console.error("Database query failed:", err);
      return res.status(500).json({ error: "Database query failed." });
    }

    try {
      // Build rules from query params (per-mark/per-unit distribution)
      const rules = { unitsCount: req.query.unitsCount ? JSON.parse(req.query.unitsCount) : {} };
      [1, 2, 3, 4, 5, 6, 13, 15].forEach(m => {
        rules[`count${m}`] = req.query[`count${m}`];
        rules[`isPair${m}`] = req.query[`isPair${m}`] === 'true';
      });

      // Randomize question order per set to vary arrangement between sets
      const randomSalt = Math.floor(Math.random() * 10000);
      const seed = `${course_code}-pg-${set || 'A'}-${randomSalt}`;
      const shuffledQuestions = shuffleArray(allQuestions, seed);

      // Select questions honoring excludes
      const finalPaper = selectPgQuestions(shuffledQuestions, rules, new Set(excludeIds));

      // Calculate CO Marks based on the final selected paper
      const coMarksMap = {};
      [...finalPaper.partA, ...finalPaper.partB.map(p => p.a), ...finalPaper.partB.map(p => p.b)].forEach(q => {
        if(q) {
          const co = q.course_outcome;
          const marks = Number(q.mark || q.marks || 0);
          if (!coMarksMap[co]) coMarksMap[co] = 0;
          coMarksMap[co] += marks;
        }
      });
      const coMarks = Object.keys(coMarksMap).map(co => ({ co, marks: coMarksMap[co] }));

      res.json({ paper: finalPaper, coMarks });

    } catch (selectionError) {
      console.error("Selection Error:", selectionError.message);
      return res.status(400).json({ error: selectionError.message });
    }
  });
});

router.get("/generate-semester-qb", verifyToken, (req, res) => {
  const { course_code, set } = req.query;

  if (!course_code) {
    return res.status(400).json({ error: "Missing course_code" });
  }

  // Parse excludes across sets
  const excludeIds = (req.query.exclude_ids || "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));

  console.log(`Generating semester QB for course: ${course_code}, set: ${set}`);

  db.query(
    "SELECT * FROM questions WHERE course_code = ? ",
    [course_code],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      console.log(`Found ${results.length} questions for course ${course_code}`);
      
      if (results.length === 0) {
        return res.status(400).json({ 
          error: `No questions found for course code: ${course_code}` 
        });
      }

      const randomSalt = Math.floor(Math.random() * 10000);
      const seed = `${course_code}-semester-${set || 'A'}-${randomSalt}`;
      const shuffledQuestions = shuffleArray(results, seed);

      const paper = {};
      // Start usedIds with excludes to avoid cross-set repetition
      const usedIds = new Set(excludeIds);

      for (const sectionName of Object.keys(sectionUnits)) {
        const unit = sectionUnits[sectionName];

        const { oneMarks, otherMarks } = groupQuestions(
          unit,
          shuffledQuestions,
          usedIds,
          sectionName
        );

        console.log(`Section ${sectionName} (${unit}): Found ${oneMarks.length} MCQs and ${otherMarks.length} other marks questions`);

        if (oneMarks.length < 2) {
          return res.status(400).json({
            error: `Not enough 1-mark MCQs in ${unit} for section ${sectionName}. Required: 2, Found: ${oneMarks.length}`,
          });
        }

        const selectedOneMarks = oneMarks.slice(0, 2);
        selectedOneMarks.forEach((q) => usedIds.add(q.id));

        const pair = findPairForSum(
          otherMarks.filter((q) => !usedIds.has(q.id)),
          8
        );

        if (!pair) {
          return res.status(400).json({
            error: `Not enough valid question pairs in ${unit} to complete Section ${sectionName} (need 2 questions summing to 8 marks).`,
          });
        }

        pair.forEach((q) => usedIds.add(q.id));

        paper[sectionName] = [...selectedOneMarks, ...pair];
      }

      console.log(`Successfully generated paper with ${Object.keys(paper).length} sections`);
      return res.json(paper);
    }
  );
});

function parseUnitPortion(unitStr) {
  const match = unitStr.match(/(Unit \d+)([AB])?/i);
  if (!match) {
    return { baseUnit: unitStr, portion: null };
  }
  return {
    baseUnit: match[1],
    portion: match[2] ? match[2].toUpperCase() : null,
  };
}

function pnormalizeUnit(unit) {
  return unit
    .replace("Unit ", "")
    .replace(/([A-Za-z]+)/g, ".$1")
    .split(".")
    .map((v) => (isNaN(v) ? v : parseInt(v)));
}

function pcompareUnits(u1, u2) {
  const a = pnormalizeUnit(u1);
  const b = pnormalizeUnit(u2);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const valA = a[i] !== undefined ? a[i] : 0;
    const valB = b[i] !== undefined ? b[i] : 0;

    if (valA < valB) return -1;
    if (valA > valB) return 1;
  }
  return 0;
}

function pshuffleArray(arr, seed) {
  let rng = new seedrandom(seed);
  let shuffled = arr.slice();

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function pgetPortionFilter(sectionName) {
  const section = sectionName[0];
  const index = sectionName[1];

  if (section === "C") return ["A"];
  if (index === "1") return ["A"];
  if (index === "2") return ["A", "B"];
  if (index === "3") return ["B"];
  return ["A", "B"];
}

function pisPortionAllowed(portion, allowedPortions) {
  if (!portion) return true; // Allow questions without portion specified
  const normalized = portion.toUpperCase();
  if (normalized === "A&B") {
    return allowedPortions.includes("A") && allowedPortions.includes("B");
  }
  return allowedPortions.includes(normalized);
}

function pisMCQ(q) {
  return q.mark === 1 && q.option_a && q.option_b && q.option_c && q.option_d;
}

function pgroupQuestions(
  baseUnit,
  questions,
  usedIds,
  sectionName,
  portionFilter = null
) {
  const allowedPortions = pgetPortionFilter(sectionName);
  const portionsToCheck = portionFilter ? [portionFilter] : allowedPortions;

  return {
    oneMarks: questions.filter(
      (q) =>
        q.unit === baseUnit &&
        q.mark === 1 &&
        pisMCQ(q) &&
        !usedIds.has(q.id) &&
        pisPortionAllowed(q.portion, portionsToCheck)
    ),
    fourMarks: questions.filter(
      (q) =>
        q.unit === baseUnit &&
        q.mark === 4 &&
        !usedIds.has(q.id) &&
        pisPortionAllowed(q.portion, portionsToCheck)
    ),
    otherMarks: questions.filter(
      (q) =>
        q.unit === baseUnit &&
        q.mark !== 1 &&
        q.mark !== 4 &&
        !usedIds.has(q.id) &&
        pisPortionAllowed(q.portion, portionsToCheck)
    ),
  };
}

function pickMarkCombination(questions, target = 8) {
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const sum = questions[i].mark + questions[j].mark;
      if (sum === target) {
        return [questions[i], questions[j]];
      }
    }
  }
  return null;
}

// ROUTE STARTS HERE
router.get("/generate-qb", verifyToken, (req, res) => {
  const { course_code, from_unit, to_unit, set } = req.query;

  if (!course_code || !from_unit || !to_unit) {
    return res
      .status(400)
      .json({ error: "Missing course_code, from_unit, or to_unit" });
  }

  // Parse excludes across sets
  const excludeIds = (req.query.exclude_ids || "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));

  console.log(`Generating periodical QB for course: ${course_code}, units: ${from_unit} to ${to_unit}, set: ${set}`);

  const validRange1 =
    pcompareUnits(from_unit, "Unit 1") === 0 &&
    pcompareUnits(to_unit, "Unit 3A") === 0;

  const validRange2 =
    pcompareUnits(from_unit, "Unit 3B") === 0 &&
    pcompareUnits(to_unit, "Unit 5") === 0;

  if (!validRange1 && !validRange2) {
    return res
      .status(400)
      .json({ error: "Only Unit 1–3A or Unit 3B–5 are allowed" });
  }

  const rawSectionUnits = validRange1
    ? { A: "Unit 1", B: "Unit 2", C: "Unit 3A" }
    : { A: "Unit 4", B: "Unit 5", C: "Unit 3B" };

  const sectionUnits = {};
  for (const [section, unitStr] of Object.entries(rawSectionUnits)) {
    sectionUnits[section] = parseUnitPortion(unitStr);
  }

  db.query(
    "SELECT * FROM questions WHERE course_code = ?",
    [course_code],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      console.log(`Found ${results.length} questions for course ${course_code}`);
      
      if (results.length === 0) {
        return res.status(400).json({ 
          error: `No questions found for course code: ${course_code}` 
        });
      }

      const randomSalt = Math.floor(Math.random() * 10000);
      const seed = `${course_code}-${from_unit}-${to_unit}-${set || 'A'}-${randomSalt}`;
      const shuffledQuestions = pshuffleArray(results, seed);

      const paper = {};
      // Start usedIds with excludes to avoid cross-set repetition
      const usedIds = new Set(excludeIds);

      // Section A1–A3 and B1–B3
      for (const section of ["A", "B"]) {
        const { baseUnit, portion } = sectionUnits[section];
        for (let i = 1; i <= 3; i++) {
          const sectionKey = `${section}${i}`;
          const { oneMarks, otherMarks } = pgroupQuestions(
            baseUnit,
            shuffledQuestions,
            usedIds,
            sectionKey,
            portion
          );

          console.log(`Section ${sectionKey} (${baseUnit}${portion ? '-' + portion : ''}): Found ${oneMarks.length} MCQs and ${otherMarks.length} other marks questions`);

          if (oneMarks.length < 2) {
            return res.status(400).json({
              error: `Not enough 1-mark MCQs in ${baseUnit} portion ${
                portion || "Any"
              } for ${sectionKey}. Found: ${oneMarks.length}, Required: 2`,
            });
          }

          const selectedOneMarks = oneMarks.splice(0, 2);
          const selectedOtherMarks = pickMarkCombination(otherMarks, 8);

          if (!selectedOtherMarks) {
            return res.status(400).json({
              error: `Not enough valid 2-question combination summing to 8 marks in ${baseUnit} portion ${
                portion || "Any"
              } for ${sectionKey}`,
            });
          }

          paper[sectionKey] = [...selectedOneMarks, ...selectedOtherMarks];
          selectedOneMarks.forEach((q) => usedIds.add(q.id));
          selectedOtherMarks.forEach((q) => usedIds.add(q.id));
        }
      }

      // Section C1–C3
      const { baseUnit: baseUnitC, portion: portionC } = sectionUnits.C;
      for (let i = 1; i <= 3; i++) {
        const sectionKey = `C${i}`;
        const { oneMarks, fourMarks } = pgroupQuestions(
          baseUnitC,
          shuffledQuestions,
          usedIds,
          sectionKey,
          portionC
        );

        console.log(`Section ${sectionKey} (${baseUnitC}${portionC ? '-' + portionC : ''}): Found ${oneMarks.length} MCQs and ${fourMarks.length} 4-mark questions`);

        if (oneMarks.length < 1 || fourMarks.length < 1) {
          return res.status(400).json({
            error: `Not enough valid MCQ + 4-mark in ${baseUnitC} portion ${
              portionC || "Any"
            } for ${sectionKey}. Found: ${oneMarks.length} MCQs, ${fourMarks.length} 4-mark questions`,
          });
        }

        const one = oneMarks.shift();
        const four = fourMarks.shift();

        paper[sectionKey] = [one, four];
        usedIds.add(one.id);
        usedIds.add(four.id);
      }

      console.log(`Successfully generated periodical paper with ${Object.keys(paper).length} sections`);
      return res.json(paper);
    }
  );
});

router.get("/qb-history", verifyToken, (req, res) => {
  const query =
    "SELECT course_code, subject_name,exam_name,date_time FROM generated_papers";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching faculty subjects:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

router.post("/question-history", verifyToken, (req, res) => {
  const { course_code, subject_name, exam_name } = req.body;

  const query = `
    INSERT INTO generated_papers (course_code, subject_name, exam_name, date_time)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(query, [course_code, subject_name, exam_name], (err, result) => {
    if (err) {
      console.error("Error inserting history:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ message: "History saved successfully" });
  });
});

router.get("/get-faculty-subjects", verifyToken, (req, res) => {
  const { degree } = req.query;

  const query =
    "SELECT course_code, subject_name FROM faculty_list WHERE degree = ?";
  db.query(query, [degree], (err, results) => {
    if (err) {
      console.error("Error fetching faculty subjects:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

router.post("/give-task", verifyToken, (req, res) => {
  const {
    program,
    due_date,
    faculty_ids, // Now always an array
    tasks,       // Array of task objects { unit, m1, m2, ... }
  } = req.body;

  if (!program || !due_date || !Array.isArray(faculty_ids) || faculty_ids.length === 0 || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: "Missing or invalid required fields." });
  }

  // Prepare the values for bulk insertion
  const allTaskValues = [];
  
  for (const faculty_id of faculty_ids) {
    for (const task of tasks) {
      let values;
      if (program === "PG") {
        values = [faculty_id, task.unit, task.m2 || 0, task.m13 || 0, task.m15 || 0, due_date];
      } else { // UG
        values = [faculty_id, task.unit, task.m1 || 0, task.m2 || 0, task.m3 || 0, task.m4 || 0, task.m5 || 0, task.m6 || 0, due_date];
      }
      allTaskValues.push(values);
    }
  }

  if (allTaskValues.length === 0) {
    return res.status(400).json({ message: "No valid tasks to assign." });
  }

  // Define the query based on the program
  const insertQuery = program === "PG"
    ? `INSERT IGNORE INTO task (faculty_id, unit, m2, m13, m15, due_date) VALUES ?`
    : `INSERT IGNORE INTO task (faculty_id, unit, m1, m2, m3, m4, m5, m6, due_date) VALUES ?`;

  // Execute the bulk insert query
  db.query(insertQuery, [allTaskValues], (err, result) => {
    if (err) {
      console.error("Error assigning tasks:", err);
      return res.status(500).json({ message: "Failed to assign tasks due to a server error." });
    }
    if (result.affectedRows === 0) {
        return res.status(409).json({ message: "Tasks already exist for the selected faculty and units. No new tasks were assigned." });
    }
    res.status(200).json({ message: `Successfully assigned ${result.affectedRows} new tasks.` });
  });
});

router.post("/add-vetting", verifyToken, (req, res) => {
  const { vetting_id, faculty_id } = req.body;

  if (!vetting_id || !faculty_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const query = `
    INSERT INTO vetting (vetting_id, faculty_id)
    VALUES (?, ?)
  `;

  db.query(query, [vetting_id, faculty_id], (err, result) => {
    if (err) {
      console.error("Error inserting vetting record:", err);
      return res.status(500).json({ message: "Failed to add vetting record" });
    }

    res.status(200).json({ message: "Vetting entry added successfully" });
  });
});

// Get all vetting assignments with faculty names
router.get('/vetting-list', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.faculty_id, f1.faculty_name AS faculty_name,
        v.vetting_id, f2.faculty_name AS vetting_name
      FROM vetting v
      LEFT JOIN faculty_list f1 ON v.faculty_id = f1.faculty_id
      LEFT JOIN faculty_list f2 ON v.vetting_id = f2.faculty_id
    `;
    db.query(query, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch vetting' });
      }
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vetting' });
  }
});

// Update a vetting assignment
router.put('/vetting-list', verifyToken, (req, res) => {
  const { old_faculty_id, old_vetting_id, faculty_id, vetting_id } = req.body;
  if (!old_faculty_id || !old_vetting_id || !faculty_id || !vetting_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const query = `UPDATE vetting SET faculty_id = ?, vetting_id = ? WHERE faculty_id = ? AND vetting_id = ?`;
  db.query(query, [faculty_id, vetting_id, old_faculty_id, old_vetting_id], (err, result) => {
    if (err) {
      console.error('Error updating vetting assignment:', err);
      return res.status(500).json({ message: 'Failed to update vetting assignment' });
    }
    res.status(200).json({ message: 'Vetting assignment updated successfully' });
  });
});

// Delete a vetting assignment
router.delete('/vetting-list', verifyToken, (req, res) => {
  const { faculty_id, vetting_id } = req.body;
  if (!faculty_id || !vetting_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const query = `DELETE FROM vetting WHERE faculty_id = ? AND vetting_id = ?`;
  db.query(query, [faculty_id, vetting_id], (err, result) => {
    if (err) {
      console.error('Error deleting vetting assignment:', err);
      return res.status(500).json({ message: 'Failed to delete vetting assignment' });
    }
    res.status(200).json({ message: 'Vetting assignment deleted successfully' });
  });
});

// Get all unique departments, optionally filtered by degree
router.get("/departments", (req, res) => {
  const { degree } = req.query;
  let query = "SELECT DISTINCT dept FROM faculty_list";
  let params = [];
  if (degree) {
    query += " WHERE degree = ?";
    params.push(degree);
  }
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results.map(row => row.dept));
  });
});

// Get all faculty for selected departments and degree (multi-select support)
router.get("/faculty-list-by-dept", (req, res) => {
  const { dept, degree } = req.query;
  if (!degree) {
    return res.status(400).json({ error: "Degree is required" });
  }

  let query = "SELECT faculty_id, faculty_name, dept FROM faculty_list WHERE degree = ?";
  let params = [degree];

  // Support multi-select: dept can be a comma-separated string
  if (dept && dept !== "ALL") {
    const depts = dept.split(",").map(d => d.trim());
    query += " AND dept IN (" + depts.map(() => "?").join(",") + ")";
    params = params.concat(depts);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
