import React, { useState, useEffect } from "react";
import FacultyNavbar from "../../navbar/FacultyNavbar";
import axios from "axios";
import { Menu, ListChecks, CalendarDays, User } from "lucide-react";
import { Imagecomp } from "../../images/Imagecomp";
import { Drawer } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const prependImageBaseUrl = (html) => {
  const baseUrl = "http://localhost:7000";
  return html.replace(
    /<img src="\/uploads\//g,
    `<img src="${baseUrl}/uploads/`
  );
};

const AddQuestions = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    unit: "",
    portion: "",
    topic: "",
    mark: "",
    question: "",
    competence_level: "",
    course_outcome: "",
    answer: "",
    course_code: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    faculty_id: "", // Retained faculty_id
    vetting_id: "", // Re-add vetting_id to state
  });

  const location = useLocation();
  const { unit, mark } = location.state || {};
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      unit: unit || "",
      mark: mark || "",
    }));
  }, [unit, mark]);
  const [isUpload, setIsUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [courseCode, setCourseCode] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [degree, setDegree] = useState(""); // Add degree state
  const [vettingId, setVettingId] = useState(""); // State to hold the fetched vetting ID

  const user = useSelector((state) => state.user.user);
  const email = user?.email;
  const facultyId = user?.faculty_id;

  function CustomUploadAdapterPlugin(editor) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
      return {
        upload: async () => {
          const file = await loader.file;
          // You can now call your custom image upload function
          const formData = new FormData();
          formData.append("figure", file);

          try {
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

  // Fetch course code
  useEffect(() => {
    if (!email) return;
    axios
      .get(`http://localhost:7000/api/faculty/get-course-code?email=${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCourseCode(res.data.course_code);
        setFormData((prev) => ({
          ...prev,
          course_code: res.data.course_code,
        }));
      })
      .catch(() => {
        toast.error("Failed to load course code.");
      });
  }, [email, token]);

  // Fetch faculty ID and Vetting ID
  useEffect(() => {
    if (!facultyId) return;

    setFormData((prev) => ({ ...prev, faculty_id: facultyId }));

    // Re-enable fetching the vetting_id
    axios
      .get("http://localhost:7000/api/faculty/get-vetting-id", {
        params: { faculty_id: facultyId },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Store the fetched vetting_id in state
        if (res.data && res.data.vetting_id) {
          setVettingId(res.data.vetting_id);
          setFormData((prev) => ({ ...prev, vetting_id: res.data.vetting_id }));
        }
      })
      .catch(() => {
        toast.error("Failed to load vetting ID. Cannot submit questions.");
      });
  }, [facultyId, token]);

  // Fetch degree from faculty_list
  useEffect(() => {
    if (!facultyId) return;
    axios
      .get("http://localhost:7000/api/admin/faculty-list", { // Assuming this endpoint returns the faculty list from the admin routes
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const faculty = res.data.find((f) => f.faculty_id === facultyId);
        if (faculty) setDegree(faculty.degree);
      })
      .catch(() => {
        toast.error("Failed to load faculty degree.");
      });
  }, [facultyId, token]);

  // Handle form data changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  // Handle figure upload
  const [figureFile, setFigureFile] = useState(null);
  const [figurePath, setFigurePath] = useState("");

  const handleFigureChange = (e) => {
    setFigureFile(e.target.files[0]);
  };

  const uploadFigure = async () => {
    if (!figureFile) return null;

    try {
      const figureFormData = new FormData();
      figureFormData.append("figure", figureFile);

      const response = await axios.post(
        "http://localhost:7000/api/faculty/upload-figure",
        figureFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.figurePath;
    } catch (error) {
      console.error("Error uploading figure:", error);
      toast.error("Failed to upload figure");
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add a check for the vettingId before proceeding
    if (!vettingId) {
      toast.error("Vetting ID is missing. Cannot submit question.");
      return;
    }

    if (!formData.faculty_id && facultyId) {
      setFormData((prev) => ({
        ...prev,
        faculty_id: facultyId,
      }));
    }

    if (!formData.faculty_id) {
      toast.error("Missing faculty ID. Try again.");
      return;
    }

    if (!isUpload) {
      // Validation for non-upload questions
      const requiredFields = [
        "unit",
        "portion",
        "topic",
        "mark",
        "question",
        "answer",
        "competence_level",
        "course_outcome",
      ];
      for (let field of requiredFields) {
        if (!formData[field]) {
          toast.error(`Please fill in ${field.replace("_", " ")}.`);
          return;
        }
      }

      if (formData.mark === "1") {
        if (
          !formData.option_a ||
          !formData.option_b ||
          !formData.option_c ||
          !formData.option_d
        ) {
          toast.error("All MCQ options are required for 1-mark questions.");
          return;
        }
      }
    }

    try {
      if (isUpload && file) {
        // Handle file upload
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("course_code", courseCode);
        if (facultyId) uploadFormData.append("faculty_id", facultyId);
        // Add vetting_id to the upload form data
        uploadFormData.append("vetting_id", vettingId);

        // Log FormData contents properly
        console.log("File being uploaded:", file.name);
        console.log("Course code:", courseCode);
        console.log("Faculty ID:", facultyId);

        await axios.post(
          "http://localhost:7000/api/faculty/upload",
          uploadFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // console.log(uploadFormData) - This doesn't work for FormData objects

        toast.success("File uploaded successfully!");
      } else {
        // First upload figure if present
        let uploadedFigurePath = null;
        if (figureFile) {
          uploadedFigurePath = await uploadFigure();
          if (!uploadedFigurePath) {
            toast.error("Failed to upload figure. Please try again.");
            return;
          }
        }

        // --- START: Data Formatting Fix ---
        let submissionData = {
          ...formData,
          mark: parseInt(formData.mark, 10), // Ensure mark is a number
          faculty_id: formData.faculty_id || facultyId,
          vetting_id: vettingId,
          figure: uploadedFigurePath,
        };

        // If it's an MCQ, wrap options and answer in <p> tags to match backend expectation
        if (submissionData.mark === 1) {
          submissionData = {
            ...submissionData,
            option_a: `<p>${formData.option_a}</p>`,
            option_b: `<p>${formData.option_b}</p>`,
            option_c: `<p>${formData.option_c}</p>`,
            option_d: `<p>${formData.option_d}</p>`,
            // The answer is already one of the options, so wrap it too.
            answer: `<p>${formData.answer}</p>`,
          };
        }
        // --- END: Data Formatting Fix ---

        await axios.post(
          "http://localhost:7000/api/faculty/add-question",
          submissionData, // Use the formatted submissionData
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Increment the added count only after successful question add
        try {
          await axios.post(
            "http://localhost:7000/api/faculty/increment-question-count",
            {
              faculty_id: submissionData.faculty_id,
              unit: submissionData.unit,
              mark: submissionData.mark,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (incErr) {
          toast.warn("Question added, but failed to increment count.");
        }

        toast.success("Question added successfully!");
        // Navigate to dashboard with a flag to trigger refresh
        navigate("/facultydashboard", { state: { refreshTasks: true } });
        return;
      }
      // console.log(formData)

      // Reset form after submission
      setFormData({
        unit: "",
        portion: "",
        topic: "",
        mark: "",
        question: "",
        competence_level: "",
        course_outcome: "",
        answer: "",
        course_code: courseCode,
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        faculty_id: facultyId,
      });
      setFile(null);
      setFigureFile(null);
      setFigurePath("");
    } catch (error) {
      toast.error(
        "Error adding question: " +
          (error.response?.data?.message || error.message)
      );
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden lg:flex w-64 bg-white shadow-md">
        <FacultyNavbar />
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
        <FacultyNavbar />
      </Drawer>

      <div
        className="flex-1 pl-1 pr-4 bg-gray-50 overflow-y-auto ml-5 mt-5 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Header and form container */}
        <div className="w-full">
          <div className="flex flex-wrap justify-between items-center mb-5 p-4 sticky top-0 z-10 bg-white shadow-lg rounded-lg border-l-4 border-[#4b37cd]">
            <div className="flex items-center gap-4">
              <button
                className="block md:hidden text-[#4b37cd] hover:text-[#3d2ba7] transition-colors"
                onClick={() => setOpenSidebar(!openSidebar)}
              >
                <Menu size={28} />
              </button>
              <h2 className="text-2xl font-bold text-[#4b37cd]">
                Add Question Bank
              </h2>
            </div>
            <div className="mt-4 md:mt-0">
              <Imagecomp />
            </div>
          </div>
          <div className="flex justify-start mb-4">
            <button
              className="px-6 py-3 bg-[#4b37cd] text-white rounded-lg hover:bg-[#3d2ba7] font-semibold shadow-md transition-all duration-200"
              onClick={() => navigate("/manageqb")}
            >
              Back
            </button>
          </div>
          <div className="flex justify-center w-full">
            <form
              onSubmit={handleSubmit}
              className="w-full bg-white border-2 border-[#4b37cd]/20 shadow-xl rounded-lg px-8 py-8 space-y-8 mb-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                      <User size={18} className="text-[#4b37cd]" /> Input Method
                    </label>
                    <select
                      name="input_method"
                      value={isUpload ? "upload" : "input"}
                      onChange={(e) => setIsUpload(e.target.value === "upload")}
                      className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                    >
                      <option value="input">Manual Input</option>
                      <option value="upload">File Upload</option>
                    </select>
                  </div>
                  {/* Only show manual fields if not uploading */}
                  {!isUpload && (
                    <>
                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Course Code
                        </label>
                        <div className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm bg-gray-50 text-[#4b37cd] font-medium">
                          {courseCode || "Loading..."}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Unit
                        </label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                        >
                          <option value="">-- Select Unit --</option>
                          <option value="Unit 1">Unit 1</option>
                          <option value="Unit 2">Unit 2</option>
                          <option value="Unit 3">Unit 3</option>
                          <option value="Unit 4">Unit 4</option>
                          <option value="Unit 5">Unit 5</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Portion
                        </label>
                        <select
                          name="portion"
                          value={formData.portion}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                        >
                          <option value="">-- Select Portion --</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Topic
                        </label>
                        <input
                          type="text"
                          name="topic"
                          value={formData.topic}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Mark
                        </label>
                        <select
                          name="mark"
                          value={formData.mark}
                           onChange={(e) => setFormData({ ...formData, mark: e.target.value })}

                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                        >
                          <option value="">-- Select Mark --</option>
                          {degree === "PG" ? (
                            <>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="13">13</option>
                              <option value="15">15</option>
                            </>
                          ) : (
                            <>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                            </>
                          )}
                        </select>
                      </div>
                    </>
                  )}
                  {/* Only show file upload if uploading */}
                  {isUpload && (
                    <div className="space-y-6 mt-6">
                      <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                        <ListChecks size={18} className="text-[#4b37cd]" /> Upload Question File
                      </label>
                      <input
                        type="file"
                        name="question_file"
                        onChange={handleFileChange}
                        accept=".xlsx,.csv,.xls"
                        className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#4b37cd] file:text-white hover:file:bg-[#3d2ba7]"
                        required
                      />
                      {file && (
                        <p className="text-sm text-[#4b37cd] mt-1 font-medium">
                          Selected: {file.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* Right column */}
                {!isUpload && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                        <ListChecks size={18} className="text-[#4b37cd]" /> Question
                      </label>
                      <div className="bg-white border-2 border-[#4b37cd]/30 rounded-lg shadow-sm p-3 focus-within:ring-2 focus-within:ring-[#4b37cd] focus-within:border-[#4b37cd] transition-all duration-200">
                        <CKEditor
                          editor={ClassicEditor}
                          data={prependImageBaseUrl(formData.question)} // This ensures CKEditor displays the image
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            setFormData({ ...formData, question: data }); // You still save original HTML (with relative path)
                          }}
                          config={{
                            extraPlugins: [CustomUploadAdapterPlugin],
                            toolbar:
                            [
                              "heading",
                              "|",
                              "bold",
                              "italic",
                              "bulletedList",
                              "numberedList",
                              "|",
                              "link",
                              "imageUpload",
                              "blockQuote",
                              "|",
                              "undo",
                              "redo",
                            ],
                          }}
                        />
                      </div>
                    </div>

                    {formData.mark === "1" && (
                      <>
                        <div className="space-y-1">
                          <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                            <ListChecks size={18} className="text-[#4b37cd]" /> Option A
                          </label>
                          <input
                            type="text"
                            name="option_a"
                            value={formData.option_a}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                            <ListChecks size={18} className="text-[#4b37cd]" /> Option B
                          </label>
                          <input
                            type="text"
                            name="option_b"
                            value={formData.option_b}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                            <ListChecks size={18} className="text-[#4b37cd]" /> Option C
                          </label>
                          <input
                            type="text"
                            name="option_c"
                            value={formData.option_c}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                            <ListChecks size={18} className="text-[#4b37cd]" /> Option D
                          </label>
                          <input
                            type="text"
                            name="option_d"
                            value={formData.option_d}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                          />
                        </div>
                      </>
                    )}
                    {formData.mark === "1" ? (
                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Answer
                        </label>
                        <select
                          name="answer"
                          value={formData.answer}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                        >
                          <option value="">-- Select Option --</option>
                          <option value={formData.option_a}>
                            {formData.option_a}
                          </option>
                          <option value={formData.option_b}>
                            {formData.option_b}
                          </option>
                          <option value={formData.option_c}>
                            {formData.option_c}
                          </option>
                          <option value={formData.option_d}>
                            {formData.option_d}
                          </option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                          <ListChecks size={18} className="text-[#4b37cd]" /> Answer
                        </label>
                        <div className="bg-white border-2 border-[#4b37cd]/30 rounded-lg shadow-sm p-3 focus-within:ring-2 focus-within:ring-[#4b37cd] focus-within:border-[#4b37cd] transition-all duration-200">
                          <CKEditor
                            editor={ClassicEditor}
                            data={prependImageBaseUrl(formData.answer)}
                            onChange={(event, editor) => {
                            const data = editor.getData();
                            setFormData({ ...formData, answer: data }); // You still save original HTML (with relative path)
                          }}
                            config={{
                              extraPlugins: [CustomUploadAdapterPlugin],
                              toolbar: [
                                "heading",
                                "|",
                                "bold",
                                "italic",
                                "underline",
                                "bulletedList",
                                "numberedList",
                                "|",
                                "link",
                                "imageUpload",
                                "blockQuote",
                                "|",
                                "undo",
                                "redo",
                              ],
                              image: {
                                toolbar: [
                                  "imageTextAlternative",
                                  "imageStyle:full",
                                  "imageStyle:side",
                                ],
                              },
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                        <ListChecks size={18} className="text-[#4b37cd]" /> Competence level
                      </label>
                      <select
                        name="competence_level"
                        value={formData.competence_level}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                      >
                        <option value="">-- Select Option --</option>
                        <option value="K1">K1 - Remember</option>
                        <option value="K2">K2 - Understand</option>
                        <option value="K3">K3 - Apply</option>
                        <option value="K4">K4 - Analyze</option>
                        <option value="K5">K5 - Evaluate</option>
                        <option value="K6">K6 - Create</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#4b37cd] flex items-center gap-2">
                        <ListChecks size={18} className="text-[#4b37cd]" /> Course outcome
                      </label>
                      <input
                        type="text"
                        name="course_outcome"
                        value={formData.course_outcome}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-[#4b37cd]/30 shadow-sm focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Always show submit button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="w-full px-8 py-4 text-white bg-[#4b37cd] rounded-lg hover:bg-[#3d2ba7] focus:outline-none focus:ring-2 focus:ring-[#4b37cd] focus:ring-offset-2 font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {isUpload ? "Upload File" : "Submit Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default AddQuestions;
