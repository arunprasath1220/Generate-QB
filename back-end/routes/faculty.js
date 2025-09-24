const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("../db");
const verifyToken = require("./jwtMiddleware");
const xlsx = require("xlsx"); // Import the xlsx library
const app = express();

// Serve uploaded files statically
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.get("/test-dir", (req, res) => {
  res.send(`__dirname is: ${__dirname}`);
});

const upload = multer({ storage: storage });

router.post(
  "/upload-figure",
  verifyToken,
  upload.single("figure"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const figurePath = `/uploads/${req.file.filename}`;
    res.status(200).json({ figurePath });
  }
);

router.get("/get-course-code", verifyToken, (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send("Missing email");

  const query = `
    SELECT c.course_code
    FROM users u
    INNER JOIN faculty_course fc ON u.id = fc.faculty
    INNER JOIN course c ON fc.course = c.id
    WHERE u.email = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).send("Error fetching course code");

    if (results.length === 0)
      return res.status(404).send("No course code found");

    res.json({ course_code: results[0].course_code });
  });
});


router.get("/faculty-question-status", verifyToken, (req, res) => {
  const courseCode = req.query.course_code;

  if (!courseCode) {
    return res.status(400).json({ error: "Course code is required" });
  }

  const weeklyQuery = `
    SELECT 
      u.faculty_id, 
      YEARWEEK(q.created_at, 1) AS week, 
      COUNT(*) AS total_papers
    FROM qb.questions AS q
    JOIN qb.course c ON q.course_code = c.course_code
    JOIN qb.faculty_course fc ON fc.course = c.id
    JOIN qb.users u ON fc.faculty = u.id
    WHERE q.course_code = ?
      AND q.created_at >= NOW() - INTERVAL 7 WEEK
    GROUP BY u.faculty_id, YEARWEEK(q.created_at, 1)
    ORDER BY week ASC
  `;

  const monthlyQuery = `
    SELECT 
      u.faculty_id, 
      DATE_FORMAT(q.created_at, '%Y-%m') AS month, 
      COUNT(*) AS total_papers
    FROM qb.questions AS q
    JOIN qb.course c ON q.course_code = c.course_code
    JOIN qb.faculty_course fc ON fc.course = c.id
    JOIN qb.users u ON fc.faculty = u.id
    WHERE q.course_code = ?
      AND q.created_at >= NOW() - INTERVAL 6 MONTH
    GROUP BY u.faculty_id, DATE_FORMAT(q.created_at, '%Y-%m')
    ORDER BY month ASC
  `;

  db.query(weeklyQuery, [courseCode], (err, weeklyResults) => {
    if (err) return res.status(400).json({ error: err.message });

    db.query(monthlyQuery, [courseCode], (err, monthlyResults) => {
      if (err) return res.status(400).json({ error: err.message });

      res.status(200).json({ weekly: weeklyResults, monthly: monthlyResults });
    });
  });
});


router.get("/faculty-data", verifyToken, (req, res) => {
  const { email } = req.query;
  const query = `
    SELECT 
      u.faculty_id,
      u.name AS faculty_name,
      u.photo,
      u.email,
      c.course_code,
      c.subject,
      d.department,
      dg.degree,
      s.semester,
      s.month AS semester_month,
      fc.status
    FROM users u
    LEFT JOIN faculty_course fc ON u.id = fc.faculty
    LEFT JOIN course c ON fc.course = c.id
    LEFT JOIN department d ON fc.dept = d.id
    LEFT JOIN degree dg ON fc.degree = dg.id
    LEFT JOIN semester s ON fc.semester = s.id
    WHERE u.email = ?;
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).send(results);
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

router.get("/get-vetting-id", verifyToken, (req, res) => {
  const { faculty_id } = req.query;
  const query = "SELECT vetting_id FROM vetting WHERE faculty_id=?";
  db.query(query, [faculty_id], (err, results) => {
    if (!err) res.status(200).send(results[0]);
    else return res.status(400).send(err);
  });
});

router.get("/get-faculty-id", verifyToken, (req, res) => {
  const { vetting_id } = req.query;
  const query = "SELECT faculty_id FROM vetting WHERE vetting_id=?";
  db.query(query, [vetting_id], (err, results) => {
    if (!err) res.status(200).send(results[0]);
    else return res.status(400).send(err);
  });
});
router.get("/get-email", verifyToken, (req, res) => {
  const { faculty_id } = req.query;
  if (!faculty_id) return res.status(400).send("Missing faculty_id");

  const query = `
    SELECT u.email
    FROM users u
    WHERE u.faculty_id = ?
  `;

  db.query(query, [faculty_id], (err, results) => {
    if (err) return res.status(400).send(err);
    if (results.length === 0) return res.status(404).send("No email found");

    res.status(200).send(results[0]);
  });
});


router.get("/question-view/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM question_status WHERE question_id = ?";
  db.query(query, [id], (err, results) => {
    if (!err) res.status(200).send(results);
    else return res.status(400).send(err);
  });
});

router.put("/question-edit/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { unit, topic, mark, question, answer, figure } = req.body;

  if (!unit || !topic || !mark || !question || !answer) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  // On any edit, reset status to 'pending' and clear remarks for re-vetting.
  const query = `
      UPDATE question_status 
      SET 
        unit = ?, 
        topic = ?, 
        mark = ?, 
        question = ?, 
        answer = ?, 
        figure = ?, 
        status = 'pending', 
        remarks = NULL, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

  db.query(
    query,
    [unit, topic, mark, question, answer, figure || null, id],
    (err) => {
      if (!err)
        res.status(200).send("Updated successfully and sent for re-vetting.");
      else res.status(400).send(err);
    }
  );
});

router.delete("/question-delete/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM question_status WHERE question_id = ?";
  db.query(query, [id], (err, result) => {
    if (!err) {
      if (result.affectedRows === 0) {
        return res.status(404).send("Question not found");
      }
      res.status(200).send("Deleted successfully");
    } else {
      return res.status(400).send(err);
    }
  });
});

router.get("/faculty-recently-added", verifyToken, (req, res) => {
  const courseCode = req.query.course_code;

  if (!courseCode) {
    return res.status(400).json({ error: "Course code is required" });
  }

  const query = `
      SELECT course_code, unit, created_at
      FROM questions
      WHERE course_code = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;

  db.query(query, [courseCode], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

router.post("/upload", upload.single("file"), verifyToken, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "../uploads", req.file.filename);
  const courseCode = req.body.course_code;
  const facultyId = req.body.faculty_id;
  const vettingId = req.body.vetting_id;

  if (!courseCode)
    return res.status(400).send("Missing course_code in request");
  if (!facultyId) return res.status(400).send("Missing faculty_id in request");
  if (!vettingId) return res.status(400).send("Missing vetting_id in request");

  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Filter for valid rows
    const results = jsonData.filter(
      (data) =>
        data.unit &&
        data.topic &&
        data.question &&
        data.answer &&
        !isNaN(parseInt(data.mark))
    );

    if (results.length === 0) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete invalid file:", err);
      });
      return res.status(400).send("No valid questions found in the file.");
    }

    // Get max existing ID
    db.query("SELECT MAX(id) AS maxId FROM question_status", (err, result) => {
      if (err) {
        console.error("Error fetching max ID:", err);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file on DB error:", err);
        });
        return res.status(500).send("Error while preparing insertion");
      }

      let currentId = (result[0].maxId || 0) + 1;

      // Insert each row with a custom ID
      results.forEach((row) => {
        const query = `
            INSERT INTO question_status 
            (id, unit, topic, mark, question, answer, course_code, option_a, option_b, option_c, option_d,
            faculty_id, vetting_id, competence_level, course_outcome, portion, figure, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `;

        db.query(
          query,
          [
            currentId++,
            row.unit,
            row.topic,
            parseInt(row.mark),
            row.question,
            row.answer,
            courseCode,
            row.option_a || null,
            row.option_b || null,
            row.option_c || null,
            row.option_d || null,
            facultyId || row.faculty_id || null,
            vettingId || row.vetting_id || null,
            row.competence_level || null,
            row.course_outcome || null,
            row.portion || null,
            row.figure || null,
          ],
          (err) => {
            if (err) console.error("Insert error:", err);
          }
        );
      });

      // Delete uploaded file after processing
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });

      res.send("File uploaded and questions inserted successfully.");
    });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete corrupted/failed file:", err);
    });
    return res.status(500).send("Error processing Excel file.");
  }
});

router.get("/faculty-task-progress/:faculty_id", verifyToken, (req, res) => {
  const facultyId = req.params.faculty_id;

  const query = `
    SELECT 
      c.subject AS subject_name,
      t.unit,
      t.m1, t.m2, t.m3, t.m4, t.m5, t.m6, t.m13, t.m15,
      t.m1_added, t.m2_added, t.m3_added, t.m4_added, t.m5_added, t.m6_added, t.m13_added, t.m15_added,
      t.due_date
    FROM task t
    JOIN users u ON t.faculty_id = u.faculty_id
    JOIN faculty_course fc ON fc.faculty = u.id
    JOIN course c ON c.id = fc.course
    WHERE t.faculty_id = ?
      AND t.due_date >= CURDATE()
  `;

  db.query(query, [facultyId], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const data = results.map((row) => ({
      subject_name: row.subject_name,
      unit: row.unit,
      due_date: row.due_date,
      m1_added: row.m1_added,
      m1_required: row.m1,
      m1_pending: Math.max(row.m1 - row.m1_added, 0),
      m2_added: row.m2_added,
      m2_required: row.m2,
      m2_pending: Math.max(row.m2 - row.m2_added, 0),
      m3_added: row.m3_added,
      m3_required: row.m3,
      m3_pending: Math.max(row.m3 - row.m3_added, 0),
      m4_added: row.m4_added,
      m4_required: row.m4,
      m4_pending: Math.max(row.m4 - row.m4_added, 0),
      m5_added: row.m5_added,
      m5_required: row.m5,
      m5_pending: Math.max(row.m5 - row.m5_added, 0),
      m6_added: row.m6_added,
      m6_required: row.m6,
      m6_pending: Math.max(row.m6 - row.m6_added, 0),
      m13_added: row.m13_added,
      m13_required: row.m13,
      m13_pending: Math.max((row.m13 || 0) - (row.m13_added || 0), 0),
      m15_added: row.m15_added,
      m15_required: row.m15,
      m15_pending: Math.max((row.m15 || 0) - (row.m15_added || 0), 0),
    }));

    res.status(200).json(data);
  });
});


router.get("/faculty-id", verifyToken, (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send("Missing email");

  const query = `
    SELECT u.faculty_id
    FROM users u
    WHERE u.email = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).send("Error fetching faculty-id");
    if (results.length === 0) return res.status(404).send("No faculty found");

    res.json({ faculty_id: results[0].faculty_id });
  });
});


router.post("/add-question", verifyToken, (req, res) => {
  let {
    unit,
    topic,
    mark,
    question,
    answer,
    course_code,
    option_a,
    option_b,
    option_c,
    option_d,
    faculty_id,
    vetting_id,
    competence_level,
    course_outcome,
    portion,
    figure,
  } = req.body;

  if (
    !unit ||
    !topic ||
    !mark ||
    !question ||
    !answer ||
    !course_code ||
    !faculty_id ||
    !vetting_id
  ) {
    return res.status(400).send("Missing required fields");
  }

  const markInt = parseInt(mark);

  // 🟡 Validate MCQs for 1-mark questions
  if (markInt === 1) {
    if (!option_a || !option_b || !option_c || !option_d) {
      return res
        .status(400)
        .send("MCQ options are required for 1-mark questions");
    }
  } else {
    // Set options to empty string for non-1-mark questions
    option_a = "";
    option_b = "";
    option_c = "";
    option_d = "";
  }

  // 🔁 Step 1: Get the latest ID
  const getIdQuery = "SELECT MAX(id) AS maxId FROM question_status";
  db.query(getIdQuery, (err, results) => {
    if (err) {
      console.error("Error fetching latest ID:", err);
      return res.status(500).send("Failed to generate question ID");
    }

    const newId = (results[0].maxId || 0) + 1;

    // 🔁 Step 2: Insert with manually computed ID
    const insertQuery = `
      INSERT INTO question_status 
      (id, unit, topic, mark, question, answer, course_code, option_a, option_b, option_c, option_d,
       faculty_id, vetting_id, competence_level, course_outcome, portion, figure, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.query(
      insertQuery,
      [
        newId,
        unit,
        topic,
        markInt,
        question,
        answer,
        course_code,
        option_a,
        option_b,
        option_c,
        option_d,
        faculty_id,
        vetting_id,
        competence_level,
        course_outcome,
        portion,
        figure,
      ],
      (err, result) => {
        if (err) {
          console.error("Error inserting question:", err);
          return res.status(500).send("Failed to insert question");
        }

        res
          .status(200)
          .json({ message: "Question submitted for review", id: newId });
      }
    );
  });
});

router.put("/review-question/:question_id", verifyToken, (req, res) => {
  const { question_id } = req.params;
  const { status, remarks } = req.body;
  const loginVettingEmail = req.user.email;

  if (!status || (status !== "accepted" && status !== "rejected")) {
    return res.status(400).send("Invalid or missing status");
  }

  // Enforce remarks depending on action
  if (status === "accepted" && (!remarks || !remarks.trim())) {
    return res.status(400).send("Approval remark required");
  }
  if (status === "rejected" && (!remarks || !remarks.trim())) {
    return res.status(400).send("Rejection reason required");
  }

  const getStatusQuery = `SELECT * FROM question_status WHERE question_id = ?`;

  db.query(getStatusQuery, [question_id], (err, statusResults) => {
    if (err) return res.status(500).send("Error fetching question status");
    if (statusResults.length === 0)
      return res.status(404).send("Question status not found");

    const question = statusResults[0];
    const dbVettingId = question.vetting_id;

    // ✅ Updated: get faculty_id directly from users
    const vettingQuery = `
      SELECT u.faculty_id
      FROM users u
      WHERE u.email = ?
    `;

    db.query(vettingQuery, [loginVettingEmail], (err2, vettingResults) => {
      if (err2) return res.status(500).send("Error verifying reviewer");

      const loginVettingId = vettingResults[0]?.faculty_id;
      if (dbVettingId !== loginVettingId) {
        return res
          .status(403)
          .send("You are not authorized to review this question");
      }

      if (status === "accepted") {
        // Accepted path
        const insertQuery = `
          INSERT INTO questions 
          (unit, topic, mark, question, answer, course_code, option_a, option_b, option_c, option_d,
           faculty_id, competence_level, course_outcome, portion, figure)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(
          insertQuery,
          [
            question.unit,
            question.topic,
            question.mark,
            question.question,
            question.answer,
            question.course_code,
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,
            question.faculty_id,
            question.competence_level,
            question.course_outcome,
            question.portion,
            question.figure,
          ],
          (err3) => {
            if (err3)
              return res.status(500).send("Error inserting accepted question");

            const updateQuery = `UPDATE question_status SET status = 'accepted', remarks = ? WHERE question_id = ?`;
            db.query(updateQuery, [remarks || null, question_id], (err4) => {
              if (err4)
                return res
                  .status(500)
                  .send("Inserted but failed to update status");
              res
                .status(200)
                .send("Question accepted, stored, and status updated");
            });
          }
        );
      } else {
        // Rejected path
        const updateQuery = `UPDATE question_status SET status = 'rejected', remarks = ? WHERE question_id = ?`;
        db.query(updateQuery, [remarks || null, question_id], (err5) => {
          if (err5) return res.status(500).send("Failed to update rejection");
          res.status(200).send("Question rejected with remarks");
        });
      }
    });
  });
});


router.post("/increment-question-count", verifyToken, (req, res) => {
  const { faculty_id, unit, mark } = req.body;

  if (!faculty_id || !unit || !mark) {
    console.error("Missing fields:", { faculty_id, unit, mark });
    return res.status(400).json({
      error: "Missing required fields",
      received: req.body,
    });
  }

  const columnName = `m${mark}_added`;

  // Validate allowed mark columns
  const allowedMarks = ["1", "2", "3", "4", "5", "6", "13", "15"];
  if (!allowedMarks.includes(String(mark))) {
    return res.status(400).json({ error: "Invalid mark value" });
  }

  const query = `
    UPDATE task 
    SET ${columnName} = ${columnName} + 1 
    WHERE faculty_id = ? AND unit = ?
  `;

  db.query(query, [faculty_id, unit], (err, result) => {
    if (err) {
      console.error("Error incrementing count:", err);
      return res.status(500).json({ error: "Failed to update count" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "No matching task row found",
        faculty_id,
        unit,
      });
    }

    res.status(200).json({
      message: "Count incremented",
      faculty_id,
      unit,
      mark,
    });
  });
});

module.exports = router;
