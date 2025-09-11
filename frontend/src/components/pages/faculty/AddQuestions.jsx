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
  const baseUrl = "http://localhost:7000"; // change this if your server is hosted elsewhere
  return html.replace(
    /<img src="\/uploads\//g,
    `<img src="${baseUrl}/uploads/`
  );
};

const AddQuestions = () => {
  const navigate = useNavigate(); // Add this line
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
    vetting_id: "",
    faculty_id: "",
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
  const [vettingId, setVettingId] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [degree, setDegree] = useState(""); // Add degree state

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

  // Fetch vetting ID
  useEffect(() => {
    if (!facultyId) return;

    setFormData((prev) => ({ ...prev, faculty_id: facultyId }));

    axios
      .get("http://localhost:7000/api/faculty/get-vetting-id", {
        params: { faculty_id: facultyId },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setVettingId(res.data.vetting_id);
        setFormData((prev) => ({
          ...prev,
          vetting_id: res.data.vetting_id,
        }));
      })
      .catch(() => {
        toast.error("Failed to load vetting ID.");
      });
  }, [facultyId, token]);

  // Fetch degree from faculty_list
  useEffect(() => {
    if (!facultyId) return;
    axios
      .get("http://localhost:7000/api/admin/faculty-list", {
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

    if (!formData.vetting_id && vettingId) {
      setFormData((prev) => ({
        ...prev,
        vetting_id: vettingId,
      }));
    }

    if (!formData.faculty_id && facultyId) {
      setFormData((prev) => ({
        ...prev,
        faculty_id: facultyId,
      }));
    }

    if (!formData.vetting_id || !formData.faculty_id) {
      toast.error("Missing vetting or faculty ID. Try again.");
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
        if (vettingId) uploadFormData.append("vetting_id", vettingId);
        if (facultyId) uploadFormData.append("faculty_id", facultyId);

        // Log FormData contents properly
        console.log("File being uploaded:", file.name);
        console.log("Course code:", courseCode);
        console.log("Vetting ID:", vettingId);
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

        // Handle question form submission
        const submissionData = {
          ...formData,
          vetting_id: formData.vetting_id || vettingId,
          faculty_id: formData.faculty_id || facultyId,
          figure: uploadedFigurePath, // Add the figure path to submission data
        };

        await axios.post(
          "http://localhost:7000/api/faculty/add-question",
          submissionData,
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
        vetting_id: vettingId,
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
          <div className="flex flex-wrap justify-between items-center mb-5 p-4 sticky top-0 z-10 bg-white shadow-md rounded-md">
            <div className="flex items-center gap-4">
              <button
                className="block md:hidden text-gray-700"
                onClick={() => setOpenSidebar(!openSidebar)}
              >
                <Menu size={28} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">
                Add Question Bank
              </h2>
            </div>
            <div className="mt-4 md:mt-0">
              <Imagecomp />
            </div>
          </div>
          <div className="flex justify-start mb-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow"
              onClick={() => navigate("/manageqb")}
            >
              Back
            </button>
          </div>
          <div className="flex justify-center w-full">
            <form
              onSubmit={handleSubmit}
              className="w-full bg-white/90 border border-gray-200 shadow-xl px-8 py-8 space-y-8 mb-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="font-medium text-gray-700 flex items-center gap-2">
                      <User size={18} /> Input Method
                    </label>
                    <select
                      name="input_method"
                      value={isUpload ? "upload" : "input"}
                      onChange={(e) => setIsUpload(e.target.value === "upload")}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="input">Manual Input</option>
                      <option value="upload">File Upload</option>
                    </select>
                  </div>
                  {/* Only show manual fields if not uploading */}
                  {!isUpload && (
                    <>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Course Code
                        </label>
                        <div className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm bg-gray-100">
                          {courseCode || "Loading..."}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Unit
                        </label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          required
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Portion
                        </label>
                        <select
                          name="portion"
                          value={formData.portion}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">-- Select Portion --</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Topic
                        </label>
                        <input
                          type="text"
                          name="topic"
                          value={formData.topic}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Mark
                        </label>
                        <select
                          name="mark"
                          value={formData.mark}
                           onChange={(e) => setFormData({ ...formData, mark: e.target.value })}

                          required
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      <label className="font-medium text-gray-700 flex items-center gap-2">
                        <ListChecks size={18} /> Upload Question File
                      </label>
                      <input
                        type="file"
                        name="question_file"
                        onChange={handleFileChange}
                        accept=".xlsx,.csv,.xls"
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      {file && (
                        <p className="text-sm text-green-600 mt-1">
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
                      <label className="font-medium text-gray-700 flex items-center gap-2">
                        <ListChecks size={18} /> Question
                      </label>
                      <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-2">
                        <CKEditor
                          editor={ClassicEditor}
                          data={prependImageBaseUrl(formData.question)} // This ensures CKEditor displays the image
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            setFormData({ ...formData, question: data }); // You still save original HTML (with relative path)
                          }}
                          config={{
                            extraPlugins: [CustomUploadAdapterPlugin],
                            toolbar: [
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
                          <label className="font-medium text-gray-700 flex items-center gap-2">
                            <ListChecks size={18} /> Option A
                          </label>
                          <input
                            type="text"
                            name="option_a"
                            value={formData.option_a}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-gray-700 flex items-center gap-2">
                            <ListChecks size={18} /> Option B
                          </label>
                          <input
                            type="text"
                            name="option_b"
                            value={formData.option_b}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-gray-700 flex items-center gap-2">
                            <ListChecks size={18} /> Option C
                          </label>
                          <input
                            type="text"
                            name="option_c"
                            value={formData.option_c}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-gray-700 flex items-center gap-2">
                            <ListChecks size={18} /> Option D
                          </label>
                          <input
                            type="text"
                            name="option_d"
                            value={formData.option_d}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                    {formData.mark === "1" ? (
                      <div className="space-y-1">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Answer
                        </label>
                        <select
                          name="answer"
                          value={formData.answer}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                          <ListChecks size={18} /> Answer
                        </label>
                        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-2">
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
                      <label className="font-medium text-gray-700 flex items-center gap-2">
                        <ListChecks size={18} /> Competence level
                      </label>
                      <select
                        name="competence_level"
                        value={formData.competence_level}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      <label className="font-medium text-gray-700 flex items-center gap-2">
                        <ListChecks size={18} /> Course outcome
                      </label>
                      <input
                        type="text"
                        name="course_outcome"
                        value={formData.course_outcome}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Always show submit button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="w-full px-8 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none font-bold text-lg shadow-xl transition"
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
