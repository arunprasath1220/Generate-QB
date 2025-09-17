import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import axios from "axios";
import AdminNavbar from "../../navbar/AdminNavbar";
import { Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Imagecomp } from "../../images/Imagecomp";
import bitlogo from "../../images/bitlogo.png";
import Select from "react-select";
import { TextField, Button, Box, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert,
  FormLabel,
} from "@mui/material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

// Function to strip all HTML tags from a string
function stripHTMLTags(str) {
  if (!str) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = str;
  return tmp.textContent || tmp.innerText || "";
}

// Function to extract <img> src URLs from HTML string
function extractImageSrcs(html) {
  if (!html) return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const imgs = Array.from(div.getElementsByTagName("img"));
  return imgs.map((img) => img.src);
}

const prependImageBaseUrl = (html) => {
  if (!html) return "";
  const baseUrl = "http://localhost:7000"; // Server base URL
  return html.replace(/<img src="\/uploads\//g, `<img src="${baseUrl}/uploads/`);
};

const GenerateQuestion = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  function CustomUploadAdapterPlugin(editor) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
      return {
        upload: async () => {
          const file = await loader.file;
          const formData = new FormData();
          formData.append("figure", file);

          try {
            // Using the faculty upload endpoint as it's available.
            // An admin-specific one could be created if needed.
            const response = await axios.post(
              "http://localhost:7000/api/faculty/upload-figure",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            return {
              default: response.data.figurePath, // must return a URL to the uploaded image
            };
          } catch (error) {
            console.error("Image upload failed:", error);
            return Promise.reject("Upload failed");
          }
        },
      };
    };
  }
  
  // Changed from single paperData to multiple papers
  const [papersData, setPapersData] = useState([]);
  const [currentView, setCurrentView] = useState({ index: 0, type: "question" }); // { index: number, type: 'question' | 'answer' }
  const [repetition, setRepetition] = useState(""); // "" | "not-occur" | "occur"
  
  
  
  
  const [formData, setFormData] = useState({
    course_code: "",
    semester: "",
    set: [], // Changed from string to array
    from_unit: "",
    to_unit: "",
    department: [],
    exam_type: "",
    exam_month: "",
  });
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [error, setError] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [degree, setDegree] = useState("UG");
  const [facultyList, setFacultyList] = useState([]);
  const [header, setHeader] = useState({
    collegeName: "Your College Name",
    department: "Department of ...",
    examName: "PG Semester Examination",
    subject: "Subject Name",
    date: "Date: ...",
    duration: "Duration: 3 Hours",
    maxMarks: "Max Marks: ...",
    regulation: "2021",
    instruction: "",
  });
  const [openHeaderEdit, setOpenHeaderEdit] = useState(false);

  // PG mark distribution editor state with unified counts and isPair flags
  const [openPgMarksEdit, setOpenPgMarksEdit] = useState(false);
  const unitOptions = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"];
  const [pgDistribution, setPgDistribution] = useState({
    // Unified counts for all marks
    count1: 0,
    count2: 10,
    count3: 0,
    count4: 0,
    count5: 0,
    count6: 0,
    count13: 5,
    count15: 1,
    // Either/Or flags for all marks
    isPair1: false,
    isPair2: false,
    isPair3: false,
    isPair4: false,
    isPair5: false,
    isPair6: false,
    isPair13: true,
    isPair15: true,
    // Units by mark
    units1: [],
    units2: [],
    units3: [],
    units4: [],
    units5: [],
    units6: [],
    units13: [],
    units15: [],
  });

  // Add state for unit range in the edit marks dialog
  const [dialogFromUnit, setDialogFromUnit] = useState("");
  const [dialogToUnit, setDialogToUnit] = useState("");

  // Update header for PG periodical tests
  useEffect(() => {
    if (degree === "PG") {
      if (formData.exam_type !== "End Semester") {
        setHeader((prev) => ({
          ...prev,
          duration: "Duration: 1.5 Hours",
          maxMarks: "Max Marks: 50",
        }));
      } else {
        // Revert to default for End Semester
        const savedHeader = localStorage.getItem("pgHeaderDefault");
        if (savedHeader) {
          const defaults = JSON.parse(savedHeader);
          setHeader((prev) => ({
            ...prev,
            duration: defaults.duration || "Duration: 3 Hours",
            maxMarks: defaults.maxMarks || "Max Marks: 100",
          }));
        } else {
          setHeader((prev) => ({
            ...prev,
            duration: "Duration: 3 Hours",
            maxMarks: "Max Marks: 100",
          }));
        }
      }
    }
  }, [degree, formData.exam_type]);

  // Update dialog units when form data changes
  useEffect(() => {
    if (degree === "PG" && formData.exam_type !== "End Semester") {
      setDialogFromUnit(formData.from_unit);
      setDialogToUnit(formData.to_unit);
    }
  }, [degree, formData.exam_type, formData.from_unit, formData.to_unit]);

  // Reset unit counts to 0 for units outside the selected range
  useEffect(() => {
    if (
      degree === "PG" &&
      formData.exam_type !== "End Semester" &&
      dialogFromUnit &&
      dialogToUnit
    ) {
      setPgDistribution((prev) => {
        const newUnitsCount = { ...prev.unitsCount };
        unitOptions.forEach((unit) => {
          if (!isUnitInRange(unit)) {
            [1, 2, 3, 4, 5, 6, 13, 15].forEach((mark) => {
              const markKey = String(mark);
              if (!newUnitsCount[markKey]) {
                newUnitsCount[markKey] = {};
              }
              newUnitsCount[markKey][unit] = 0;
            });
          }
        });
        return { ...prev, unitsCount: newUnitsCount };
      });
    }
  }, [dialogFromUnit, dialogToUnit, degree, formData.exam_type]);

  const handleCountChange = (field, value) => {
    setPgDistribution((prev) => ({
      ...prev,
      [field]: Math.max(0, parseInt(value || 0, 10)),
    }));
  };

  const handlePairToggle = (field) => {
    setPgDistribution((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleUnit = (field, unit) => {
    setPgDistribution((prev) => ({
      ...prev,
      [field]: prev[field].includes(unit)
        ? prev[field].filter((u) => u !== unit)
        : [...prev[field], unit],
    }));
  };

  // Function to get filtered unit options based on dialog from/to units
  const getFilteredUnitOptions = () => {
    if (
      degree === "PG" &&
      formData.exam_type !== "End Semester" &&
      dialogFromUnit &&
      dialogToUnit
    ) {
      const fromIndex = unitOptions.indexOf(dialogFromUnit);
      const toIndex = unitOptions.indexOf(dialogToUnit);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex <= toIndex) {
        return unitOptions.slice(fromIndex, toIndex + 1);
      }
    }
    return unitOptions;
  };

  const savePgDistribution = () => {
    const target =
      degree === "PG" && formData.exam_type !== "End Semester" ? 50 : 100;
    if (totalSum !== target) return;

    // Save the unit range if applicable
    const updatedDistribution = {
      ...pgDistribution,
      fromUnit: dialogFromUnit,
      toUnit: dialogToUnit,
    };

    localStorage.setItem("pgDistribution", JSON.stringify(updatedDistribution));
    setOpenPgMarksEdit(false);
  };

  // Load saved config and migrate old formats
  useEffect(() => {
    const saved = localStorage.getItem("pgDistribution");
    if (!saved) return;
    try {
      const obj = JSON.parse(saved);
      // Check if it's the new format (has isPair1) or old format
      if (Object.prototype.hasOwnProperty.call(obj, "isPair1")) {
        setPgDistribution(obj);
      } else {
        // Migrate from old format (with pairs13/15)
        setPgDistribution((prev) => ({
          ...prev, // Start with new defaults
          count1: obj.count1 || 0,
          count2: obj.count2 || 0,
          count3: obj.count3 || 0,
          count4: obj.count4 || 0,
          count5: obj.count5 || 0,
          count6: obj.count6 || 0,
          count13: obj.pairs13 || 5, // Migrate from pairs13
          count15: obj.pairs15 || 1, // Migrate from pairs15
          units1: obj.units1 || [],
          units2: obj.units2 || [],
          units3: obj.units3 || [],
          units4: obj.units4 || [],
          units5: obj.units5 || [],
          units6: obj.units6 || [],
          units13: obj.units13 || [],
          units15: obj.units15 || [],
        }));
      }
    } catch {}
  }, []);

  const departmentOptions = [
    { value: "ALL", label: "All Departments" },
    { value: "C.S.E", label: "C.S.E" },
    { value: "C.S.B.S", label: "C.S.B.S" },
    { value: "E.E.E", label: "E.E.E" },
    { value: "M.E", label: "M.E" },
    { value: "I.T", label: "I.T" },
    { value: "A.I.D.S", label: "A.I.D.S" },
    { value: "A.I.M.L", label: "A.I.M.L" },
    { value: "B.T", label: "B.T" },
  ];

  const handleDepartmentChange = (selectedOptions) => {
    if (!selectedOptions) {
      setFormData({ ...formData, department: [] });
      return;
    }

    const hasAll = selectedOptions.find((opt) => opt.value === "ALL");

    if (hasAll) {
      const allDepartments = departmentOptions
        .filter((opt) => opt.value !== "ALL")
        .map((opt) => opt.value);

      setFormData({ ...formData, department: allDepartments });
    } else {
      const selectedValues = selectedOptions.map((opt) => opt.value);
      setFormData({ ...formData, department: selectedValues });
    }
  };

  const [coMarks, setCoMarks] = useState([]);

  // Updated useEffect for exam_type to allow unit selection for PG periodical
  useEffect(() => {
    if (formData.exam_type === "End Semester") {
      setFormData((prev) => ({
        ...prev,
        from_unit: "Unit 1",
        to_unit: "Unit 5",
      }));
    } else {
      // For both UG and PG periodical tests, allow unit selection
      setFormData((prev) => ({
        ...prev,
        from_unit: "",
        to_unit: "",
      }));
    }
  }, [formData.exam_type, degree]);

  useEffect(() => {
    axios
      .get(
        `http://localhost:7000/api/admin/get-faculty-subjects?degree=${degree}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => setSubjectOptions(res.data))
      .catch((err) => console.error("Error fetching subject options:", err));
  }, [degree]);

  // Fetch faculty_list once
  useEffect(() => {
    axios
      .get("http://localhost:7000/api/admin/faculty-list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFacultyList(res.data))
      .catch(() => setFacultyList([]));
  }, [token]);

  // Auto-fill semester and exam_month when subject changes
  useEffect(() => {
    if (formData.course_code && facultyList.length > 0) {
      const faculty = facultyList.find(
        (f) => f.course_code === formData.course_code
      );
      if (faculty) {
        setFormData((prev) => ({
          ...prev,
          semester: faculty.semester || "",
          exam_month:
            formData.exam_type === "End Semester"
              ? faculty.semester_month || ""
              : prev.exam_month,
        }));
      }
    }
  }, [formData.course_code, facultyList, formData.exam_type]);

  // Modified fetchPaper function to handle multiple sets
  const fetchPaper = async () => {
    const {
      from_unit,
      to_unit,
      course_code,
      department,
      exam_type,
      semester,
      exam_month,
      set, // array of sets, e.g., ['A','B']
    } = formData;

    // Updated validation to require units for both UG and PG periodical tests
    if (
      !course_code ||
      !department.length ||
      !exam_type ||
      !semester ||
      !exam_month ||
      !set.length || // Check if at least one set is selected
      // For UG periodical or PG periodical, require units
      (exam_type !== "End Semester" &&
        (degree === "UG" || degree === "PG") &&
        (!from_unit || !to_unit))
    ) {
      setError(
        "Failed to fetch question: Please fill all the fields and select at least one set before generating the paper."
      );
      setPapersData([]);
      return;
    }

    try {
      // Validate PG marks sum
      if (degree === "PG") {
        const target = formData.exam_type !== "End Semester" ? 50 : 100;
        const totalSum = [1, 2, 3, 4, 5, 6, 13, 15].reduce((sum, m) => {
          return sum + effectiveCountForMark(m) * m;
        }, 0);

        if (totalSum !== target) {
          setError(
            `Failed to generate question paper: Question distribution sum must equal ${target} marks. Current sum: ${totalSum} marks. Please adjust the question counts in Edit Marks.`
          );
          setPapersData([]);
          return;
        }
      }

      const papers = [];
      const usedAcrossSets = new Set();
      // Ensure deterministic order A, B
      const setsOrdered = [...set].sort();

      for (const selectedSet of setsOrdered) {
        let res;

        // Common params
        const baseParams = {};
        if (repetition === "not-occur" && usedAcrossSets.size > 0) {
          baseParams.exclude_ids = Array.from(usedAcrossSets).join(",");
        }

        // End Semester
        if (exam_type === "End Semester") {
          if (degree === "PG") {
            const params = {
              course_code,
              degree: "PG",
              exam_mode: "semester",
              set: selectedSet,
              ...baseParams,
            };
            [1, 2, 3, 4, 5, 6, 13, 15].forEach((m) => {
              params[`count${m}`] = pgDistribution[`count${m}`] || 0;
              params[`isPair${m}`] = !!pgDistribution[`isPair${m}`];
            });
            if (pgDistribution.unitsCount) params.unitsCount = JSON.stringify(pgDistribution.unitsCount);

            res = await axios.get("http://localhost:7000/api/admin/generate-pg-qb", {
              headers: { Authorization: `Bearer ${token}` },
              params,
            });
            setCoMarks(res.data.coMarks || []);
          } else {
            res = await axios.get("http://localhost:7000/api/admin/generate-semester-qb", {
              headers: { Authorization: `Bearer ${token}` },
              params: { course_code, set: selectedSet, ...baseParams },
            });
          }
        } else {
          // Periodical / Optional
          const from = parseInt((from_unit || "").toString().replace(/Unit\s*/, ""), 10);
          const to = parseInt((to_unit || "").toString().replace(/Unit\s*/, ""), 10);

          if (Number.isNaN(from) || Number.isNaN(to)) {
            setError("Please select valid From/To units.");
            setPapersData([]);
            return;
          }
          if (from > to) {
            setError("From Unit cannot be greater than To Unit.");
            setPapersData([]);
            return;
          }

          if (degree === "PG") {
            const params = {
              course_code,
              from_unit: from,
              to_unit: to,
              degree: "PG",
              exam_mode: "periodical",
              set: selectedSet,
              ...baseParams,
            };
            [1, 2, 3, 4, 5, 6, 13, 15].forEach((m) => {
              params[`count${m}`] = pgDistribution[`count${m}`] || 0;
              params[`isPair${m}`] = !!pgDistribution[`isPair${m}`];
            });
            if (pgDistribution.unitsCount) params.unitsCount = JSON.stringify(pgDistribution.unitsCount);

            res = await axios.get("http://localhost:7000/api/admin/generate-pg-qb", {
              headers: { Authorization: `Bearer ${token}` },
              params,
            });
            setCoMarks(res.data.coMarks || []);
          } else {
            res = await axios.get("http://localhost:7000/api/admin/generate-qb", {
              headers: { Authorization: `Bearer ${token}` },
              params: { course_code, from_unit: from, to_unit: to, degree, set: selectedSet, ...baseParams },
            });
          }
        }

        // 3. Process the response for this set
        if (!res || res.data?.error) {
          const msg =
            res && res.data && res.data.error
              ? res.data.error
              : "Unknown error from server";
          throw new Error("Failed to fetch question for Set " + selectedSet + ": " + msg);
        }

        const paper = res.data;
        const normalizedPaper = paper.paper ? paper.paper : paper;
        let finalPaper = normalizedPaper;

        // Check if paper is empty for UG
        if (degree === "UG" && isPaperEmpty(finalPaper)) {
          const backendMsg =
            (res && res.data && (res.data.error || res.data.message)) ||
            "No questions available for selected units/distribution.";
          throw new Error("No questions generated for Set " + selectedSet + ": " + backendMsg);
        }

        // For PG, check if paper structure is correct
        if (degree === "PG" && (!finalPaper.partA && !finalPaper.partB && !finalPaper.partC)) {
          const backendMsg =
            (res && res.data && (res.data.error || res.data.message)) ||
            "No questions available for selected units/distribution.";
          throw new Error("No questions generated for Set " + selectedSet + ": " + backendMsg);
        }

        const subject = subjectOptions.find((s) => s.course_code === course_code);
        
        // Create paper object for this set
        const paperData = {
          set: selectedSet,
          college: header.collegeName || "Bannari Amman Institute of Technology",
          exam_name: exam_type,
          department: `IV Sem – B.E. / B.Tech. ${department}`,
          course_code,
          subject_name: subject?.subject_name || "Subject Name",
          time: degree === "UG" ? 
            (exam_type === "End Semester" ? "3 Hours" : "1:30 hrs") : 
            (exam_type === "End Semester" ? "3 Hours" : "1:30 hrs"),
          max_marks:
            degree === "PG" && exam_type !== "End Semester"
              ? 50
              : exam_type.toLowerCase() === "end semester"
              ? 100
              : 50, // UG periodical tests are usually 50 marks
          instructions: degree === "UG" ? [
            "1. Students should not mark/write anything on the Question Paper other than the register number.",
            "2. Section A of the Question Paper contains questions for 15 Marks. Sections B and C contain questions for 30 Marks each.",
            "3. Section A: 10 marks, Section B: 20 marks, Section C: 20 marks. Students can attempt answering any two out of three subsections in each section. The maximum mark is limited to 10 in section A and 20 in section B & C.",
          ] : [
            "1. Answer ALL questions.",
            "2. Each question carries equal marks as indicated.",
          ],
          paper: finalPaper,
        };

        papers.push(paperData);

        // Accumulate used IDs to avoid repetition across sets when required
        if (repetition === "not-occur") {
          collectIdsFromPaper(finalPaper, degree).forEach((id) => usedAcrossSets.add(id));
        }
      }

      // Save generation history
      const subject = subjectOptions.find((s) => s.course_code === course_code);
      await axios.post(
        "http://localhost:7000/api/admin/generate-history",
        {
          course_code,
          subject_name: subject?.subject_name || "Subject Name",
          exam_name: exam_type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPapersData(papers);
      setCurrentView({ index: 0, type: "question" }); // Reset view to the first question paper
      setError("");

    } catch (err) {
      console.error("Generate QB request failed:", err);
      console.error("Request params:", { course_code, from_unit, to_unit, set, degree, exam_type });
      
      if (err.response && err.response.data) {
        console.error(
          "Backend response:",
          err.response.status,
          err.response.data
        );
        const backendMsg =
          err.response.data.error ||
          err.response.data.message ||
          JSON.stringify(err.response.data);
        setError("Failed to fetch question: " + backendMsg);
      } else {
        setError("Failed to fetch question: " + (err.message || "Unable to connect to server."));
      }
      setPapersData([]);
    }
  };

  // Updated export functions
  const exportToPDF = (paperIndex = null) => {
    const index = paperIndex !== null ? paperIndex : currentView.index;
    const paperToExport = papersData[index];
    
    if (!paperToExport) return;

    const element = document.getElementById(`question-paper-${index}`);
    
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `${paperToExport.course_code}_Set_${paperToExport.set}_question_paper.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  const exportAnswerToPDF = (paperIndex = null) => {
    const index = paperIndex !== null ? paperIndex : currentView.index;
    const paperToExport = papersData[index];
    
    if (!paperToExport) return;

    const element = document.getElementById(`answer-paper-${index}`);
    if (!element) return;
    
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `${paperToExport.course_code}_Set_${paperToExport.set}_answer_paper.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Function to export all papers at once
  const exportAllPapers = () => {
    papersData.forEach((_, index) => {
      setTimeout(() => {
        exportToPDF(index);
        setTimeout(() => {
          exportAnswerToPDF(index);
        }, 1000);
      }, index * 3000); // Stagger exports to avoid conflicts
    });
  };

  const renderQuestions = (sectionData, sectionLabel) => (
    <div className="section-wrapper">
      <table className="w-full border border-gray-400 text-sm mt-4 mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th
              className="border border-black px-2 py-2"
              style={{ width: "15%" }}
            >
              Section
            </th>
            <th
              className="border border-black px-2 py-2"
              style={{ width: "15%" }}
            >
              Q. No
            </th>
            <th
              className="border border-black px-2 py-2"
              style={{ width: "70%" }}
            >
              Question
            </th>
          </tr>
        </thead>
        <tbody>
          {sectionData?.map((q, idx) => {
            // Safely strip HTML, and extract images
            const plainQuestion = stripHTMLTags(q.question);
            const imgSrcs = extractImageSrcs(q.question);

            return (
              <tr key={q.id || idx} className="align-top">
                {idx === 0 && (
                  <td
                    className="border border-black px-2 py-3 text-center"
                    rowSpan={sectionData.length}
                  >
                    {sectionLabel}
                  </td>
                )}
                <td className="border border-black px-2 py-3 text-center">
                  ({toRoman(1 + idx)})
                </td>
                <td className="border border-black px-3 py-3 whitespace-pre-line">
                  <div>{plainQuestion}</div>
                  {imgSrcs.map((src, i) => (
                    <div key={i}>
                      <img
                        src={src}
                        style={{ maxWidth: "300px" }}
                        alt={`img${i}`}
                      />
                    </div>
                  ))}
                  {q.mark === 1 && (
                    <div className="mt-2">
                      <div>a) {stripHTMLTags(q.option_a || "")}</div>
                      <div>b) {stripHTMLTags(q.option_b || "")}</div>
                      <div>c) {stripHTMLTags(q.option_c || "")}</div>
                      <div>d) {stripHTMLTags(q.option_d || "")}</div>
                    </div>
                  )}
                  <div className="text-right mt-2">
                    ({q.mark} Mark - [ {q.competence_level || q.k_level}/{q.course_outcome}{" "}
                    ])
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  function toRoman(num) {
    const romans = [
      ["M", 1000],
      ["CM", 900],
      ["D", 500],
      ["CD", 400],
      ["C", 100],
      ["XC", 90],
      ["L", 50],
      ["XL", 40],
      ["X", 10],
      ["IX", 9],
      ["V", 5],
      ["IV", 4],
      ["I", 1],
    ];
    let result = "";
    for (const [roman, value] of romans) {
      while (num >= value) {
        result += roman;
        num -= value;
      }
    }
    return result.toLowerCase();
  }

  useEffect(() => {
    if (degree === "PG") {
      setFormData((prev) => ({
        ...prev,
        exam_type: "End Semester",
      }));
    }
  }, [degree]);

  // Updated Header component to accept set parameter
  const Header = ({ currentSet }) => (
    <div>
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <span className="font-semibold"></span>
          <span
            className="border border-black w-8 h-8 flex items-center justify-center text-lg font-bold"
            style={{ display: "inline-flex" }}
          >
            {currentSet}
          </span>
        </div>
        <div className="flex items-center">
          <span className="mr-2 font-semibold">Register No.</span>
          {[...Array(12)].map((_, idx) => (
            <span
              key={idx}
              className="border border-black inline-block w-6 h-6 align-middle"
            />
          ))}
        </div>
      </div>
      <table className="w-full table-fixed border border-black text-center">
        <tbody>
          <tr>
            <td className="border border-black font-bold" colSpan="2">
              <div className="[&_img]:h-12 [&_img]:w-auto [&_img]:inline-block align-middle" dangerouslySetInnerHTML={{ __html: prependImageBaseUrl(header.collegeName) || "BIT" }} />
            </td>
          </tr>
          <tr>
            <td className="border border-black" colSpan="2">
              (Autonomous)
            </td>
          </tr>
          <tr>
            <td className="border border-black font-bold" colSpan="2">
              QP CODE:
            </td>
          </tr>
          <tr>
            <td className="border border-black" colSpan="2">
              {header.examName || `M.E. / M.Tech Degree Examinations`}
              &nbsp; - {formData.exam_month}
              &nbsp; 2025
            </td>
          </tr>
          <tr>
            <td className="border border-black text-center" colSpan="2">
              {formData.semester && (
                <span className="text-sm my-1 text-center">
                  {formData.semester} Semester
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-black" colSpan="2">
              Regulation – {header.regulation || "2021"}
            </td>
          </tr>
          <tr>
            <td className="border border-black" colSpan="2">
              {header.department ||
                `M.E. / M.Tech: ${formData.department.join(", ")}`}
              &nbsp; – {formData.department.join(", ")}
            </td>
          </tr>
          <tr>
            <td className="border border-black font-bold" colSpan="2">
              {formData.course_code} –{" "}
              {subjectOptions.find(
                (s) => s.course_code === formData.course_code
              )?.subject_name || ""}
            </td>
          </tr>
          <tr>
            <td className="border border-black italic text-sm" colSpan="2">
              <strong>
                {header.instruction ||
                  "(Specify Any Chart or Tables etc. to be Permitted)"}
              </strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black text-left">
              {header.duration || "Time : 3 Hours"}
            </td>
            <td className="border border-black text-right">
              {header.maxMarks || "Maximum Marks : 100"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const buildPGParts = (paper) => {
    if (!paper) return [];
    const { partA = [], partB = [], partC = null } = paper;
    const parts = [];

    // Group single questions from partA by mark
    const singleQuestionGroups = {};
    partA.forEach((q) => {
      const m = Number(q.marks ?? q.mark);
      if (!singleQuestionGroups[m]) singleQuestionGroups[m] = [];
      singleQuestionGroups[m].push(q);
    });

    // List parts by mark
    Object.keys(singleQuestionGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((mark) => {
        parts.push({
          type: "list",
          mark,
          questions: singleQuestionGroups[mark],
        });
      });

    // Group all pairs by their actual mark (handles 2, 13, 15, etc.)
    const pairGroups = new Map();

    if (Array.isArray(partB) && partB.length) {
      partB.forEach((pair) => {
        const mA = Number(pair?.a?.marks ?? pair?.a?.mark);
        const mB = Number(pair?.b?.marks ?? pair?.b?.mark);
        const m = !Number.isNaN(mA) ? mA : mB;
        if (!pairGroups.has(m)) pairGroups.set(m, []);
        pairGroups.get(m).push(pair);
      });
    }

    const partCPairs = partC ? (Array.isArray(partC) ? partC : [partC]) : [];
    if (partCPairs.length) {
      partCPairs.forEach((pair) => {
        const mA = Number(pair?.a?.marks ?? pair?.a?.mark);
        const mB = Number(pair?.b?.marks ?? pair?.b?.mark);
        const m = !Number.isNaN(mA) ? mA : mB;
        if (!pairGroups.has(m)) pairGroups.set(m, []);
        pairGroups.get(m).push(pair);
      });
    }

    Array.from(pairGroups.keys())
      .sort((a, b) => a - b)
      .forEach((m) => {
        const pairs = pairGroups.get(m) || [];
        if (pairs.length > 0) {
          parts.push({ type: "pairs", mark: Number(m), pairs });
        }
      });

    return parts;
  };

  const renderDynamicPGParts = (paper) => {
    const parts = buildPGParts(paper);
    if (!parts.length) return null;

    let questionCounter = 1;

    return parts.map((part, index) => {
      const partLetter = String.fromCharCode(65 + index);
      const partCount =
        part.type === "list" ? part.questions.length : part.pairs.length;
      const partTotalMarks =
        part.type === "list"
          ? part.questions.reduce(
              (sum, q) => sum + (Number(q.marks ?? q.mark) || 0),
              0
            )
          : partCount * Number(part.mark || 0);

      if (part.type === "list") {
        return (
          <div key={`part-${partLetter}`} className="mb-6 mt-6">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th
                    className="border border-black font-bold px-2 py-1 text-left"
                    colSpan="2"
                  >
                    {`Part ${partLetter}`}
                  </th>
                  <th
                    className="border border-black font-bold px-2 py-1 text-right"
                    colSpan="2"
                  >
                    {`(${partCount} × ${part.mark} = ${partTotalMarks} Marks)`}
                  </th>
                </tr>
                <tr>
                  <th
                    className="border border-black italic font-normal text-sm py-1"
                    colSpan="4"
                  >
                    Answer All Questions
                  </th>
                </tr>
                <tr>
                  <th className="border border-black w-10">Q.No</th>
                  <th className="border border-black">Question</th>
                  <th className="border border-black w-16">K-Level</th>
                  <th className="border border-black w-20">PI Code</th>
                </tr>
              </thead>
              <tbody>
                {part.questions.map((q) => {
                  const plainQ = stripHTMLTags(q.question);
                  const imgSrcs = extractImageSrcs(q.question);
                  return (
                    <tr key={q.id}>
                      <td className="border border-black text-center">
                        {questionCounter++}.
                      </td>
                      <td className="border border-black p-1">
                        {plainQ}
                        {imgSrcs.map((src, j) => (
                          <div key={j}>
                            <img
                              src={src}
                              style={{ maxWidth: "300px" }}
                              alt={`img${j}`}
                            />
                          </div>
                        ))}
                        {(q.marks === 1 || q.mark === 1) && (
                          <div className="mt-2 pl-4 grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>a) {stripHTMLTags(q.option_a || "")}</div>
                            <div>b) {stripHTMLTags(q.option_b || "")}</div>
                            <div>c) {stripHTMLTags(q.option_c || "")}</div>
                            <div>d) {stripHTMLTags(q.option_d || "")}</div>
                          </div>
                        )}
                      </td>
                      <td className="border border-black text-center">
                        {q.k_level || q.competence_level || "-"}
                      </td>
                      <td className="border border-black text-center">
                        {q.course_outcome || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      if (part.type === "pairs") {
        return (
          <div key={`part-${partLetter}`} className="mb-6 mt-6">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th
                    className="border border-black font-bold px-2 py-1 text-left"
                    colSpan="3"
                  >
                    {`Part ${partLetter}`}
                  </th>
                  <th
                    className="border border-black font-bold px-2 py-1 text-right"
                    colSpan="2"
                  >
                    {`(${partCount} × ${part.mark} = ${partTotalMarks} Marks)`}
                  </th>
                </tr>
                <tr>
                  <th
                    className="border border-black italic font-normal text-sm py-1"
                    colSpan="5"
                  >
                    Answer All Questions
                  </th>
                </tr>
                <tr>
                  <th className="border border-black w-10">Q.No</th>
                  <th className="border border-black" colSpan="2">
                    Question
                  </th>
                  <th className="border border-black w-16">K-Level</th>
                  <th className="border border-black w-20">PI Code</th>
                </tr>
              </thead>
              <tbody>
                {part.pairs.map((pair, idx) => {
                  const qNo = questionCounter++;
                  const plainA = stripHTMLTags(pair.a?.question || "");
                  const imgsA = extractImageSrcs(pair.a?.question || "");
                  const plainB = stripHTMLTags(pair.b?.question || "");
                  const imgsB = extractImageSrcs(pair.b?.question || "");
                  return (
                    <React.Fragment key={`${partLetter}-${idx}`}>
                      <tr>
                        <td
                          className="border border-black w-10 text-center align-top font-semibold"
                          rowSpan={3}
                        >
                          {qNo}.
                        </td>
                        <td className="border border-black w-5 text-center align-top">
                          a)
                        </td>
                        <td className="border border-black p-2">
                          {plainA}
                          {imgsA.map((src, i) => (
                            <div key={i}>
                              <img
                                src={src}
                                style={{ maxWidth: "300px" }}
                                alt={`Q${qNo}a-img${i}`}
                              />
                            </div>
                          ))}
                        </td>
                        <td className="border border-black w-20 text-center align-top">
                          {pair.a?.k_level || pair.a?.competence_level || "-"}
                        </td>
                        <td className="border border-black w-20 text-center align-top">
                          {pair.a?.course_outcome || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td
                          className="border border-black text-center font-semibold"
                          colSpan="4"
                        >
                          OR
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black w-5 text-center align-top">
                          b)
                        </td>
                        <td className="border border-black p-2">
                          {plainB}
                          {imgsB.map((src, i) => (
                            <div key={i}>
                              <img
                                src={src}
                                style={{ maxWidth: "300px" }}
                                alt={`Q${qNo}b-img${i}`}
                              />
                            </div>
                          ))}
                        </td>
                        <td className="border border-black w-20 text-center align-top">
                          {pair.b?.k_level || pair.b?.competence_level || "-"}
                        </td>
                        <td className="border border-black w-20 text-center align-top">
                          {pair.b?.course_outcome || "-"}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      return null;
    });
  };

  // For PG: answers in same format as questions
  const renderDynamicPGPartsAnswers = (paper) => {
    const parts = buildPGParts(paper);
    if (!parts.length) return null;

    let questionCounter = 1;

    return parts.map((part, index) => {
      const partLetter = String.fromCharCode(65 + index);

      if (part.type === "list") {
        return (
          <div key={`part-answer-${partLetter}`} className="mb-6 mt-6">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th
                    className="border border-black font-bold px-2 py-1 text-left"
                    colSpan="2"
                  >
                    {`Part ${partLetter} Answers`}
                  </th>
                </tr>
                <tr>
                  <th className="border border-black w-10">Q.No</th>
                  <th className="border border-black">Answer</th>
                </tr>
              </thead>
              <tbody>
                {part.questions.map((q) => (
                  <tr key={q.id}>
                    <td className="border border-black text-center">
                      {questionCounter++}.
                    </td>
                    <td className="border border-black p-1">
                      <div dangerouslySetInnerHTML={{ __html: q.answer || "-" }} />
                      <div className="text-right mt-2 text-xs font-semibold">
                        ({q.marks ?? q.mark} Mark)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      if (part.type === "pairs") {
        return (
          <div key={`part-answer-${partLetter}`} className="mb-6 mt-6">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th
                    className="border border-black font-bold px-2 py-1 text-left"
                    colSpan="3"
                  >
                    {`Part ${partLetter} Answers`}
                  </th>
                </tr>
                <tr>
                  <th className="border border-black w-10">Q.No</th>
                  <th className="border border-black" colSpan="2">
                    Answer
                  </th>
                </tr>
              </thead>
              <tbody>
                {part.pairs.map((pair, idx) => {
                  const markA = pair.a?.marks ?? pair.a?.mark;
                  const markB = pair.b?.marks ?? pair.b?.mark;
                  const qNo = questionCounter++;
                  return (
                    <React.Fragment key={`${partLetter}-answer-${idx}`}>
                      <tr>
                        <td className="border border-black w-10 text-center align-top font-semibold" rowSpan={3}>{qNo}.</td>
                        <td className="border border-black w-5 text-center align-top">a)</td>
                        <td className="border border-black p-2">
                          <div dangerouslySetInnerHTML={{ __html: pair.a?.answer || "-" }} />
                          <div className="text-right mt-2 text-xs font-semibold">
                            ({markA} Mark)
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black text-center font-semibold" colSpan="4">OR</td>
                      </tr>
                      <tr>
                        <td className="border border-black w-5 text-center align-top">b)</td>
                        <td className="border border-black p-2">
                          <div dangerouslySetInnerHTML={{ __html: pair.b?.answer || "-" }} />
                          <div className="text-right mt-2 text-xs font-semibold">
                            ({markB} Mark)
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      return null;
    });
  };

  // For UG: answers in same format as questions
  const renderQuestionsAnswers = (sectionData, sectionLabel) => (
    <div className="section-wrapper">
      <table className="w-full border border-gray-400 text-sm mt-4 mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th
              className="border border-black px-2 py-2"
              style={{ width: "15%" }}
            >
              Section
            </th>
            <th
              className="border border-black px-2 py-2"
              style={{ width: "15%" }}
            >
              Q. No
            </th>
            <th
              className="border border-black px-2 py-2"
              style={{ width: "70%" }}
            >
              Answer
            </th>
          </tr>
        </thead>
        <tbody>
          {sectionData?.map((q, idx) => (
            <tr key={q.id || idx} className="align-top">
              {idx === 0 && (
                <td className="border border-black px-2 py-3 text-center" rowSpan={sectionData.length}>
                  {sectionLabel}
                </td>
              )}
              <td className="border border-black px-2 py-3 text-center">
                {idx + 1}
              </td>
              <td className="border border-black px-3 py-3 whitespace-pre-line">
                <div dangerouslySetInnerHTML={{ __html: q.answer || "-" }} />
                <div className="text-right mt-2 text-xs font-semibold">
                  ({q.marks ?? q.mark} Mark)
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleGenerate = () => {
    console.log("Header for PG Paper:", header);
  };

  // Load header from localStorage on mount
  useEffect(() => {
    const savedHeader = localStorage.getItem("pgHeaderDefault");
    if (savedHeader) {
      setHeader(JSON.parse(savedHeader));
    }
  }, []);

  // Save header to localStorage
  const handleSetDefaultHeader = () => {
    localStorage.setItem("pgHeaderDefault", JSON.stringify(header));
    setOpenHeaderEdit(false);
  };

  // If you don't already have this handler, add it (keeps state updated for per-unit inputs)
  const handleUnitCountChange = (mark, unit, value) => {
    const n = Math.max(0, parseInt(value || 0, 10) || 0);
    setPgDistribution((prev) => ({
      ...prev,
      unitsCount: {
        ...(prev.unitsCount || {}),
        [String(mark)]: {
          ...((prev.unitsCount && prev.unitsCount[String(mark)]) || {}),
          [unit]: n,
        },
      },
    }));
  };

  // Return effective count for a mark: sum of per-unit counts if any >0, otherwise fallback to countX
  function effectiveCountForMark(mark) {
    const key = String(mark);
    const ucounts = pgDistribution?.unitsCount?.[key];
    if (ucounts) {
      const sumUnits = Object.values(ucounts).reduce(
        (s, v) => s + (Number(v) || 0),
        0
      );
      if (sumUnits > 0) return sumUnits;
    }
    return Number(pgDistribution[`count${mark}`] || 0);
  }

  // Recompute grand total from effective counts (used in UI/validation)
  const totalSum = [1, 2, 3, 4, 5, 6, 13, 15].reduce((sum, m) => {
    return sum + effectiveCountForMark(m) * m;
  }, 0);

  // Function to check if a unit is within the selected range
  const isUnitInRange = (unit) => {
    if (degree !== "PG" || formData.exam_type === "End Semester") return true;
    if (!dialogFromUnit || !dialogToUnit) return false;
    const fromIndex = unitOptions.indexOf(dialogFromUnit);
    const toIndex = unitOptions.indexOf(dialogToUnit);
    const unitIndex = unitOptions.indexOf(unit);
    return unitIndex >= fromIndex && unitIndex <= toIndex;
  };

  const renderCOTable = (paperData) => {
    // Example implementation, adjust as needed for your data
    if (!paperData || !paperData.paper) return null;

    // Example: Calculate marks per unit (CO1-CO5)
    const unitMarks = {
      "Unit 1": 0,
      "Unit 2": 0,
      "Unit 3": 0,
      "Unit 4": 0,
      "Unit 5": 0,
    };

    const getUnit = (q) => (q?.unit || q?.unit_name || "Any").trim();
    const getMarks = (q) => Number(q?.marks ?? q?.mark ?? 0);

    (paperData.paper.partA || []).forEach((q) => {
      const unit = getUnit(q);
      if (unitMarks.hasOwnProperty(unit)) {
        unitMarks[unit] += getMarks(q);
      }
    });
    (paperData.paper.partB || []).forEach((pair) => {
      if (pair.a) {
        const unitA = getUnit(pair.a);
        if (unitMarks.hasOwnProperty(unitA)) {
          unitMarks[unitA] += getMarks(pair.a);
        }
      }
      if (pair.b) {
        const unitB = getUnit(pair.b);
        if (unitMarks.hasOwnProperty(unitB)) {
          unitMarks[unitB] += getMarks(pair.b);
        }
      }
    });

    const fullCoData = [
      { co: "CO1", marks: unitMarks["Unit 1"] },
      { co: "CO2", marks: unitMarks["Unit 2"] },
      { co: "CO3", marks: unitMarks["Unit 3"] },
      { co: "CO4", marks: unitMarks["Unit 4"] },
      { co: "CO5", marks: unitMarks["Unit 5"] },
    ];
    const totalMarks = fullCoData.reduce((sum, item) => sum + item.marks, 0);

    return (
      <div className="mt-10">
        <h4 className="text-md font-bold mb-2">Course Outcome Analysis:</h4>
        <table className="w-full table-auto border border-black text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Course outcome (1/2/3/4/5)</th>
              <th className="border px-2 py-1">Marks</th>
              <th className="border px-2 py-1">Contribution in %</th>
            </tr>
          </thead>
          <tbody>
            {fullCoData.map((item) => (
              <tr key={item.co}>
                <td className="border px-2 py-1 font-bold">{item.co}</td>
                <td className="border px-2 py-1">{item.marks}</td>
                <td className="border px-2 py-1">
                  {totalMarks > 0
                    ? ((item.marks * 100) / totalMarks).toFixed(2)
                    : "0.00"}
                </td>
              </tr>
            ))}
            <tr>
              <td className="border px-2 py-1 font-bold"></td>
              <td className="border px-2 py-1 font-bold">{totalMarks}</td>
              <td className="border px-2 py-1 font-bold">
                {totalMarks > 0 ? "100.00" : "0.00"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Collect question IDs from a generated paper (UG/PG)
  function collectIdsFromPaper(finalPaper, degree) {
    const ids = [];
    if (!finalPaper) return ids;

    const addId = (q) => {
      if (!q) return;
      const id = q.id ?? q.question_id ?? q._id;
      if (id != null) ids.push(id);
    };

    if (degree === "PG") {
      (finalPaper.partA || []).forEach(addId);
      (finalPaper.partB || []).forEach((p) => {
        addId(p?.a);
        addId(p?.b);
      });
      if (finalPaper.partC) {
        const pairs = Array.isArray(finalPaper.partC)
          ? finalPaper.partC
          : [finalPaper.partC];
        pairs.forEach((p) => {
          addId(p?.a);
          addId(p?.b);
        });
      }
    } else {
      // UG sections object: { A:[], B:[], C:[] }
      Object.values(finalPaper || {}).forEach((arr) => {
        (arr || []).forEach(addId);
      });
    }

    return ids;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 overflow-hidden">
      <div className="hidden lg:flex flex-col fixed top-0 left-0 w-56 h-full bg-white shadow-lg z-50">
        <AdminNavbar />
      </div>

      <Drawer
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: 250,
            top: 0,
            height: "100vh",
          },
        }}
      >
        <AdminNavbar />
      </Drawer>

      <div className="flex flex-col w-full h-screen p-6 lg:ml-64">
        {/* Enhanced Header Section */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-6 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            {/* Left side - Menu & Title */}
            <div className="flex items-center gap-4">
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setOpenSidebar(true)}
                sx={{ 
                  display: { lg: "none" },
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
                }}
              >
                <MenuIcon className="text-blue-600" />
              </IconButton>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">QB</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Generate Question Paper
                  </h1>
                  <p className="text-sm text-gray-500">Create and manage question papers</p>
                </div>
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-3">
              
              {degree === "PG" && (
                <div className="hidden sm:flex gap-2">
                  <Button
                    variant="outlined"
                    onClick={() => setOpenHeaderEdit(true)}
                    className="!border-blue-200 !text-blue-600 hover:!bg-blue-50 !rounded-xl !px-4 !py-2 !font-medium"
                  >
                    Edit Header
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenPgMarksEdit(true)}
                    className="!border-purple-200 !text-purple-600 hover:!bg-purple-50 !rounded-xl !px-4 !py-2 !font-medium"
                  >
                    Edit Marks
                  </Button>
                </div>
              )}
              
              <button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate("/qbhistory")}
              >
                QB History
              </button>
            </div>
          </div>
        </div>

        {/* Main content area with scrolling */}
        <div className="flex-grow overflow-y-auto pr-2">
          {/* Enhanced Form Section */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Degree Selection */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Degree Program
                  </label>
                  <select
                    name="degree"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                  >
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>

                {/* Subject Selection */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Subject Selection
                  </label>
                  <div className="space-y-3">
                    <select
                      name="course_code"
                      value={formData.course_code}
                      onChange={(e) =>
                        setFormData({ ...formData, course_code: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                    >
                      <option value="">Select Subject</option>
                      {subjectOptions.map((subject, idx) => (
                        <option key={idx} value={subject.course_code}>
                          {subject.course_code} - {subject.subject_name}
                        </option>
                      ))}
                    </select>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Or enter course code manually"
                        className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                        value={formData.course_code}
                        onChange={(e) =>
                          setFormData({ ...formData, course_code: e.target.value })
                        }
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">📝</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semester */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                  >
                    <option value="">Select Semester</option>
                    {formData.semester && (
                      <option value={formData.semester}>{formData.semester}</option>
                    )}
                  </select>
                </div>

                {/* Exam Type */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Examination Type
                  </label>
                  <select
                    name="exam_type"
                    value={formData.exam_type}
                    onChange={(e) =>
                      setFormData({ ...formData, exam_type: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                  >
                    <option value="">Select Exam Type</option>
                    <option value="Periodical Test - I">Periodical Test - I</option>
                    <option value="Periodical Test - II">Periodical Test - II</option>
                    <option value="Optional Test - I">Optional Test - I</option>
                    <option value="Optional Test - II">Optional Test - II</option>
                    <option value="End Semester">End Semester</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Exam Month */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Exam Month
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="exam_month"
                      placeholder="Enter exam month (e.g., April, October)"
                      required
                      value={formData.exam_month}
                      onChange={(e) =>
                        setFormData({ ...formData, exam_month: e.target.value })
                      }
                      className="w-full p-4 pl-12 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 text-xs font-bold">📅</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Units Selection */}
                {formData.exam_type !== "End Semester" &&
                  (degree === "UG" || degree === "PG") && (
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        Unit Range
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <select
                            name="from_unit"
                            value={formData.from_unit}
                            onChange={(e) =>
                              setFormData({ ...formData, from_unit: e.target.value })
                            }
                            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                          >
                            <option value="">From Unit</option>
                            {unitOptions.map((unit, idx) => (
                              <option key={idx} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="to_unit"
                            value={formData.to_unit}
                            onChange={(e) =>
                              setFormData({ ...formData, to_unit: e.target.value })
                            }
                            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-300 text-gray-800 font-medium group-hover:shadow-md"
                          >
                            <option value="">To Unit</option>
                            {unitOptions.map((unit, idx) => (
                              <option key={idx} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Department Selection */}
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    Department
                  </label>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500 transition-all duration-300 group-hover:shadow-md">
                    <Select
                      isMulti
                      name="department"
                      options={departmentOptions}
                      value={departmentOptions.filter((option) =>
                        formData.department.includes(option.value)
                      )}
                      onChange={handleDepartmentChange}
                      placeholder="Select departments..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: "transparent",
                          border: "none",
                          boxShadow: "none",
                          padding: "8px",
                          minHeight: "40px",
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected 
                            ? "rgb(244 63 94)" 
                            : state.isFocused 
                            ? "rgb(255 241 242)" 
                            : "white",
                          color: state.isSelected ? "white" : "black",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          margin: "2px",
                        }),
                        multiValue: (provided) => ({
                          ...provided,
                          backgroundColor: "rgb(255 241 242)",
                          borderRadius: "8px",
                          padding: "2px",
                        }),
                        multiValueLabel: (provided) => ({
                          ...provided,
                          color: "rgb(244 63 94)",
                          fontWeight: "600",
                        }),
                        multiValueRemove: (provided) => ({
                          ...provided,
                          color: "rgb(244 63 94)",
                          borderRadius: "0 8px 8px 0",
                          ":hover": {
                            backgroundColor: "rgb(244 63 94)",
                            color: "white",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>

                {/* Set and Repetition Selection */}
                <div className="space-y-6">
                  {/* Set Selection */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Question Paper Sets
                    </label>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="setA"
                          checked={formData.set.includes("A")}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              set: prev.set.includes("A")
                                ? prev.set.filter((s) => s !== "A")
                                : [...prev.set, "A"],
                            }));
                          }}
                          className="w-5 h-5 text-emerald-600 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-emerald-500 focus:ring-2"
                        />
                        <label htmlFor="setA" className="ml-3 text-gray-700 font-medium cursor-pointer">
                          Set A
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="setB"
                          checked={formData.set.includes("B")}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              set: prev.set.includes("B")
                                ? prev.set.filter((s) => s !== "B")
                                : [...prev.set, "B"],
                            }));
                          }}
                          className="w-5 h-5 text-emerald-600 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-emerald-500 focus:ring-2"
                        />
                        <label htmlFor="setB" className="ml-3 text-gray-700 font-medium cursor-pointer">
                          Set B
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Repetition Settings */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Question Repetition
                    </label>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notOccur"
                          checked={repetition === "not-occur"}
                          onChange={() => setRepetition(repetition === "not-occur" ? "" : "not-occur")}
                          className="w-5 h-5 text-amber-600 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-amber-500 focus:ring-2"
                        />
                        <label htmlFor="notOccur" className="ml-3 text-gray-700 font-medium cursor-pointer">
                          No Repetition
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="occur"
                          checked={repetition === "occur"}
                          onChange={() => setRepetition(repetition === "occur" ? "" : "occur")}
                          className="w-5 h-5 text-amber-600 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-amber-500 focus:ring-2"
                        />
                        <label htmlFor="occur" className="ml-3 text-gray-700 font-medium cursor-pointer">
                          Allow Repetition
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={fetchPaper}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-400 transform hover:scale-105 flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">✨</span>
                </div>
                Generate Question Paper
                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-sm">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-red-800 font-semibold">Generation Error</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation and Export Controls for Multiple Papers */}
          {papersData.length > 0 && (
            <>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {papersData.map((paper, index) => (
                      <React.Fragment key={index}>
                        <button
                          onClick={() => setCurrentView({ index, type: "question" })}
                          className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                            currentView.index === index && currentView.type === "question"
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                          }`}
                        >
                          Set {paper.set} Question
                        </button>
                        <button
                          onClick={() => setCurrentView({ index, type: "answer" })}
                          className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                            currentView.index === index && currentView.type === "answer"
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                          }`}
                        >
                          Set {paper.set} Answer
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (currentView.type === "question") {
                          exportToPDF();
                        } else {
                          exportAnswerToPDF();
                        }
                      }}
                      className={`px-6 py-2.5 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        currentView.type === "question"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      }`}
                    >
                      {currentView.type === "question"
                        ? "Export Current Question"
                        : "Export Current Answer"}
                    </button>
                    <button
                      onClick={exportAllPapers}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Export All Papers
                    </button>
                  </div>
                </div>
              </div>

              {/* Question and Answer Papers remain unchanged */}
              {papersData.map((paperData, index) => (
                <div key={index}>
                  {/* Question Paper */}
                  <div
                    id={`question-paper-${index}`}
                    className="mt-6 p-12 bg-white text-black leading-relaxed border rounded shadow"
                    style={{
                      display:
                        currentView.index === index && currentView.type === "question"
                          ? "block"
                          : "none",
                      paddingTop: "60px",
                      paddingBottom: "60px",
                      fontFamily: "Arial, sans-serif",
                      fontSize: "16px",
                    }}
                  >
                    {/* Question Paper content remains unchanged */}
                    {degree === "UG" && (
                      <>
                        <div className="flex justify-between mb-6">
                          <div className="border border-black px-4 py-3 text-md font-semibold">
                            Regulation: 2022
                          </div>
                          <div className="border border-black px-4 py-3 text-lg font-semibold">
                            {paperData.set}
                          </div>
                        </div>

                        <div className="flex items-center justify-end mb-6 gap-2">
                          <div className="text-sm font-semibold">Reg No :</div>
                          <div className="flex">
                            {[...Array(12)].map((_, idx) => (
                              <input
                                key={idx}
                                type="text"
                                className="w-8 h-8 text-center border border-black text-sm font-semibold"
                                maxLength="1"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="border border-black rounded-md mb-6 shadow-sm">
                          <div className="flex items-stretch justify-center ">
                            <div className="border-r border-black flex justify-center items-center w-1/6 py-4">
                              <img
                                src={bitlogo}
                                alt="BIT LOGO"
                                className="w-48 h-36 object-contain"
                              />
                            </div>
                            <div className="flex flex-col w-full justify-center">
                              <div className="text-center mb-2 border-b border-black pb-2">
                                <h1 className="text-lg font-bold uppercase">
                                  Bannari Amman Institute of Technology
                                </h1>
                                <p className="text-sm italic">
                                  (An Autonomous Institution Affiliated to Anna
                                  University)
                                </p>
                                <p className="text-md font-semibold">
                                  SATHYAMANGALAM - 638 401
                                </p>
                              </div>

                              <div className="text-center pt-2">
                                <h2 className="text-md font-semibold">
                                  {formData.exam_type && ` ${formData.exam_type}`} -{" "}
                                  {formData.exam_month}
                                </h2>

                                {formData.department && (
                                  <div className="text-sm font-semibold my-1">
                                    <>{formData.semester}</> Semester
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col text-sm mb-4">
                          <div>
                            <strong>Degree & Branch : </strong> B.E/B.Tech -{" "}
                            {formData.department.join(", ")}
                          </div>
                          <div>
                            <strong>Subject Code & Name : </strong>{formData.course_code} - {subjectOptions.find((s) => s.course_code === formData.course_code)?.subject_name || ""}
                          </div>
                          <div className="flex mt-2 justify-between">
                            <div className="mr-4">
                              <strong>Time:</strong> {paperData.time}
                            </div>
                            <div>
                              <strong>Max Marks:</strong> {paperData.max_marks}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm">
                            <strong>Instructions:</strong>
                          </div>
                          <div className="text-xs mt-2">
                            {paperData.instructions.map((instruction, idx) => (
                              <div key={idx}>{instruction}</div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {degree === "PG" ? (
                      <>
                        <Header currentSet={paperData.set} />
                        {renderDynamicPGParts(paperData?.paper)}
                        {/* Competency Level Analysis Table */}
                        <div className="mt-10">
                          <h4 className="text-md font-bold mb-2">
                            Competency Level Analysis:
                          </h4>
                          <table className="w-full table-auto border border-black text-sm">
                            <thead>
                              <tr>
                                <th className="border px-2 py-1">Competence level</th>
                                <th className="border px-2 py-1">
                                  Revised Blooms' Taxonomy
                                </th>
                                <th className="border px-2 py-1">Question No.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {["K1", "K2", "K3", "K4", "K5", "K6"].map((level) => {
                                const numbers = [];
                                const parts = buildPGParts(paperData?.paper);
                                let qCounter = 1; // exact same numbering as renderer

                                parts.forEach((part) => {
                                  if (part.type === "list") {
                                    part.questions.forEach((q) => {
                                      const k = q.k_level || q.competence_level;
                                      if (k === level) numbers.push(`${qCounter}`);
                                      qCounter++; // one number per single question
                                    });
                                  } else if (part.type === "pairs") {
                                    part.pairs.forEach((pair) => {
                                      // one number per pair with a/b suffixes
                                      if (
                                        (pair.a?.k_level ||
                                          pair.a?.competence_level) === level
                                      ) {
                                        numbers.push(`${qCounter}a`);
                                      }
                                      if (
                                        (pair.b?.k_level ||
                                          pair.b?.competence_level) === level
                                      ) {
                                        numbers.push(`${qCounter}b`);
                                      }
                                      qCounter++; // increment once per pair
                                    });
                                  }
                                });

                                const bloomMap = {
                                  K1: "Remember",
                                  K2: "Understand",
                                  K3: "Apply",
                                  K4: "Analyze",
                                  K5: "Evaluate",
                                  K6: "Create",
                                };

                                return (
                                  <tr key={level}>
                                    <td className="border px-2 py-1">{level}</td>
                                    <td className="border px-2 py-1">
                                      {bloomMap[level]}
                                    </td>
                                    <td className="border px-2 py-1">
                                      {numbers.join(", ")}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {degree === "PG" && renderCOTable(paperData)}
                      </>
                    ) : (
                      <>
                        {/* UG Questions by Section */}
                        {paperData.paper && Object.entries(paperData.paper).map(
                          ([section, questions]) => (
                            <div key={section} className="mb-6">
                              <h4 className="text-md font-bold mb-2 text-center">
                                Section {section}
                              </h4>
                              {renderQuestions(questions, section)}
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {/* Answer Paper */}
                  <div
                    id={`answer-paper-${index}`}
                    className="mt-16 p-12 bg-white text-black leading-relaxed border rounded shadow"
                    style={{
                      display:
                        currentView.index === index && currentView.type === "answer"
                          ? "block"
                          : "none",
                    }}
                  >
                    <h2 className="text-xl font-bold mb-6 text-center">
                      Answer Paper - Set {paperData.set}
                    </h2>
                    {degree === "PG" ? (
                      <>
                        <Header currentSet={paperData.set} />
                        {renderDynamicPGPartsAnswers(paperData.paper)}
                      </>
                    ) : (
                      <>
                        {paperData.paper && Object.entries(paperData.paper).map(
                          ([section, questions]) => (
                            <div key={section} className="mb-6">
                              <h4 className="text-md font-bold mb-2 text-center">
                                Section {section} Answers
                              </h4>
                              {renderQuestionsAnswers(questions, section)}
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Dialogs remain unchanged */}
        <Dialog
          open={openHeaderEdit}
          onClose={() => setOpenHeaderEdit(false)}
          maxWidth="md" // Increased width to accommodate editor
          fullWidth
        >
          <DialogTitle>Edit PG Question Paper Header</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Typography variant="subtitle2" sx={{ mb: -1 }}>College Name</Typography>
              <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-1">
                <CKEditor
                  editor={ClassicEditor}
                  data={prependImageBaseUrl(header.collegeName)}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    setHeader(prev => ({ ...prev, collegeName: data }));
                  }}
                  config={{
                    extraPlugins: [CustomUploadAdapterPlugin],
                    toolbar: [
                      "heading", "|", "bold", "italic", "|",
                      "link", "imageUpload", "|", "undo", "redo",
                    ],
                  }}
                />
              </div>
              <TextField
                label="Department"
                name="department"
                value={header.department}
                onChange={handleHeaderChange}
                fullWidth
              />
              <TextField
                label="Exam Name"
                name="examName"
                value={header.examName}
                onChange={handleHeaderChange}
                fullWidth
              />
              <TextField
                label="Date"
                name="date"
                value={header.date}
                onChange={handleHeaderChange}
                fullWidth
              />
              <TextField
                label="Duration"
                name="duration"
                value={header.duration}
                onChange={handleHeaderChange}
                fullWidth
              />
              <TextField
                label="Max Marks"
                name="maxMarks"
                value={header.maxMarks}
                onChange={handleHeaderChange}
                fullWidth
              />
              <TextField
                label="Regulation"
                name="regulation"
                value={header.regulation}
                onChange={handleHeaderChange}
                fullWidth
              />
              <TextField
                label="Instructions"
                name="instruction"
                value={header.instruction}
                onChange={handleHeaderChange}
                fullWidth
                multiline
                rows={4}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenHeaderEdit(false)}>Cancel</Button>
            <Button
              onClick={handleSetDefaultHeader}
              color="primary"
              variant="contained"
            >
              Set as Default
            </Button>
          </DialogActions>
        </Dialog>

        {/* PG Marks Edit Dialog remains unchanged */}
        <Dialog
          open={openPgMarksEdit}
          onClose={() => setOpenPgMarksEdit(false)}
          maxWidth="md"
          fullWidth
        >
          {/* Dialog content remains exactly the same */}
          <DialogTitle>Edit PG Question Counts & Units</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Typography variant="subtitle2">
                Select question counts and type (auto-computes to target)
              </Typography>

              {/* Conditionally show unit range selectors for PG non-End Semester */}
              {degree === "PG" && formData.exam_type !== "End Semester" && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", minWidth: "120px" }}
                  >
                    Unit Range:
                  </Typography>
                  <select
                    value={dialogFromUnit}
                    onChange={(e) => setDialogFromUnit(e.target.value)}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      flex: 1,
                    }}
                  >
                    <option value="">From Unit</option>
                    {unitOptions.map((unit, idx) => (
                      <option key={idx} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dialogToUnit}
                    onChange={(e) => setDialogToUnit(e.target.value)}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      flex: 1,
                    }}
                  >
                    <option value="">To Unit</option>
                    {unitOptions.map((unit, idx) => (
                      <option key={idx} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </Box>
              )}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 13, 15].map((mark) => (
                  <Box
                    key={mark}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      border: "1px solid #eee",
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <TextField
                      label={`${mark}-Mark Count`}
                      type="number"
                      value={pgDistribution[`count${mark}`]}
                      onChange={(e) =>
                        handleCountChange(`count${mark}`, e.target.value)
                      }
                      inputProps={{ min: 0, step: 1 }}
                      helperText={`${
                        pgDistribution[`count${mark}`] || 0
                      } × ${mark} = ${
                        (pgDistribution[`count${mark}`] || 0) * mark
                      }`}
                      sx={{ flex: 1 }}
                      size="small"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!pgDistribution[`isPair${mark}`]}
                          onChange={() => handlePairToggle(`isPair${mark}`)}
                        />
                      }
                      label="Either/Or"
                    />
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 1 }} />

              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: "bold" }}>
                Grand Total: <strong>{totalSum}</strong>{" "}
                {(() => {
                  const target =
                    degree === "PG" && formData.exam_type !== "End Semester"
                      ? 50
                      : 100;
                  return totalSum !== target ? `(must be ${target})` : "";
                })()}
              </Typography>
              {(() => {
                const target =
                  degree === "PG" && formData.exam_type !== "End Semester"
                    ? 50
                    : 100;
                return totalSum !== target ? (
                  <Alert severity="warning">
                    Sum must equal {target} marks.
                  </Alert>
                ) : null;
              })()}

              <Divider sx={{ my: 2 }} />

              {/* Per-mark per-unit numeric inputs */}
              {[1, 2, 3, 4, 5, 6, 13, 15].map((mark) => (
                <Box
                  key={`unitcounts-${mark}`}
                  sx={{
                    mb: 2,
                    p: 1,
                    border: "1px solid #f0f0f0",
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">
                      Units counts for {mark}-Mark
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Effective count: {effectiveCountForMark(mark)} (× {mark} ={" "}
                      {effectiveCountForMark(mark) * mark})
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {unitOptions.map((u) => (
                      <TextField
                        key={`input-${mark}-${u}`}
                        label={`${u}`}
                        type="number"
                        size="small"
                        value={
                          pgDistribution.unitsCount?.[String(mark)]?.[u] ?? ""
                        }
                        onChange={(e) =>
                          handleUnitCountChange(mark, u, e.target.value)
                        }
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        sx={{ width: 110 }}
                        disabled={!isUnitInRange(u)}
                      />
                    ))}
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 1, color: "text.secondary" }}
                  >
                    Leave all unit inputs zero to use the total count field (
                    {pgDistribution[`count${mark}`] || 0}) above.
                  </Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPgMarksEdit(false)}>Cancel</Button>
            <Button
              onClick={savePgDistribution}
              color="primary"
              disabled={(() => {
                const target =
                  degree === "PG" && formData.exam_type !== "End Semester"
                    ? 50
                    : 100;
                return totalSum !== target;
              })()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default GenerateQuestion;

// Helper function to check if paper is empty (for UG) - remains unchanged
function isPaperEmpty(paper) {
  if (!paper) return true;
  
  // For UG papers, check if sections exist and have questions
  if (typeof paper === 'object') {
    const sections = Object.keys(paper);
    if (sections.length === 0) return true;
    
    // Check if any section has questions
    const hasQuestions = sections.some(section => {
      const questions = paper[section];
      return Array.isArray(questions) && questions.length > 0;
    });
    
    return !hasQuestions;
  }
  
  // For PG papers, check partA, partB, partC
  const partAEmpty = !Array.isArray(paper.partA) || paper.partA.length === 0;
  const partBEmpty = !Array.isArray(paper.partB) || paper.partB.length === 0;
  const partCEmpty =
    !paper.partC || (Array.isArray(paper.partC) && paper.partC.length === 0);

  return partAEmpty && partBEmpty && partCEmpty;
}
