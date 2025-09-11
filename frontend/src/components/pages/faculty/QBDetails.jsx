import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import FacultyNavbar from "../../navbar/FacultyNavbar";
import { Imagecomp } from "../../images/Imagecomp";
import { Drawer, Fade, Grow, Zoom, Chip } from "@mui/material";
import { useSelector } from "react-redux";
import {
  Eye,
  Menu,
  BookOpen,
  Target,
  Award,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  X,
  Maximize2,
  Minimize2,
  Download,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  BarChart3,
  Star,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const QBDetails = () => {
  const token = localStorage.getItem("token");
  const [questionRows, setQuestionRows] = useState([]);
  const [courseCode, setCourseCode] = useState(null);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const email = user?.email;

  // Modal states
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (email) {
      setLoading(true);
      axios
        .get("http://localhost:7000/api/faculty/get-course-code", {
          params: { email: email },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setCourseCode(res.data.course_code);
        })
        .catch((err) => {
          console.error("Error fetching course code:", err);
          toast.error("Failed to fetch course code");
        })
        .finally(() => setLoading(false));
    }
  }, [email, token]);

  useEffect(() => {
    if (courseCode) {
      setLoading(true);
      axios
        .get(
          `http://localhost:7000/api/admin/faculty-question-list?course_code=${courseCode}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then((res) => {
          const acceptedQuestions = res.data
            .filter((item) => item.status === "accepted")
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map((item, index) => ({
              id: index + 1,
              questionId: item.question_id,
              facultyId: item.faculty_id,
              code: item.courseCode || courseCode,
              unit: item.unit,
              mark: item.mark || "N/A",
              topic: item.topic || "General",
              remark: item.remarks || "No remarks",
              datetime: new Date(item.updated_at).toLocaleString(),
              status: item.status,
              priority: getPriority(new Date(item.updated_at)),
            }));
          setQuestionRows(acceptedQuestions);
        })
        .catch((err) => {
          console.error("Error fetching question data:", err);
          toast.error("Failed to fetch questions");
        })
        .finally(() => setLoading(false));
    }
  }, [courseCode, token]);

  // Helper function to determine priority based on date
  const getPriority = (date) => {
    const daysSince = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return "recent"; // Within last 7 days
    if (daysSince <= 30) return "normal"; // 8-30 days old
    return "old"; // More than 30 days old
  };

  // Filter questions based on search and unit filter
  const filteredRows = questionRows.filter((row) => {
    const matchesSearch =
      row.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = !filterUnit || row.unit === filterUnit;
    return matchesSearch && matchesUnit;
  });

  // Get unique units for filter
  const availableUnits = [
    ...new Set(questionRows.map((row) => row.unit)),
  ].sort();

  // Function to handle viewing a question
  const handleView = (questionId) => {
    setLoading(true);
    axios
      .get(`http://localhost:7000/api/faculty/question-view/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSelectedQuestion(res.data[0]);
        setViewModalOpen(true);
      })
      .catch((err) => {
        console.error("Error viewing question:", err);
        toast.error("Failed to load question details");
      })
      .finally(() => setLoading(false));
  };

  // Enhanced status badge
  const StatusBadge = ({ status, priority }) => {
    const getStatusColor = () => {
      switch (status) {
        case "accepted":
          return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
        case "pending":
          return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
        case "rejected":
          return "bg-gradient-to-r from-red-500 to-pink-500 text-white";
        default:
          return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      }
    };

    const getPriorityIcon = () => {
      switch (priority) {
        case "recent":
          return <Sparkles size={12} className="animate-pulse" />;
        case "normal":
          return <Clock size={12} />;
        case "old":
          return <Calendar size={12} />;
        default:
          return null;
      }
    };

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getStatusColor()}`}
      >
        {getPriorityIcon()}
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  // Enhanced question columns
  const questionColumns = [
    {
      field: "facultyId",
      headerName: "Faculty ID",
      flex: 0.9,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <div className="bg-blue-100 p-1.5 rounded-lg">
            <User size={14} className="text-blue-600" />
          </div>
          <span className="font-medium text-gray-800">{params.value}</span>
        </div>
      ),
    },
    {
      field: "code",
      headerName: "Course Code",
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <div className="bg-purple-100 p-1.5 rounded-lg">
            <BookOpen size={14} className="text-purple-600" />
          </div>
          <span className="font-semibold text-purple-800 px-0 py-1 rounded">
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "unit",
      headerName: "Unit",
      flex: 0.5,
      renderCell: (params) => (
        <div className="flex items-center gap-0">
          <span className="font-bold text-indigo-800 px-0 py-1 rounded">
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "mark",
      headerName: "Mark",
      flex: 0.5,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <span className="font-bold text-emerald-800 px-0 py-1 rounded">
            {params.value}M
          </span>
        </div>
      ),
    },
    {
      field: "topic",
      headerName: "Topic",
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <FileText size={14} className="text-orange-600" />
          </div>
          <span
            className="text-gray-700 font-medium truncate"
            title={params.value}
          >
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "remark",
      headerName: "Remark",
      flex: 1.5,
      renderCell: (params) => (
        <span className="text-gray-600 text-sm truncate" title={params.value}>
          {params.value}
        </span>
      ),
    },
    {
      field: "datetime",
      headerName: "Date & Time",
      flex: 1.6,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">{params.value}</span>
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <StatusBadge status={params.value} priority={params.row.priority} />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleView(params.row.questionId)}
          className="group relative flex items-center gap-1 px-4 py-2 hover:text-green-600"
          title="View Question Details"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <Eye size={16} />
          <span className="hidden sm:inline">View</span>
        </button>
      ),
    },
  ];

  // Function to export questions to CSV
  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      // Define CSV headers
      const headers = [
        "Faculty ID",
        "Course Code",
        "Unit",
        "Mark",
        "Topic",
        "Remark",
        "Date & Time",
        "Status",
      ];

      // Convert data to CSV format
      const csvData = filteredRows.map((row) => [
        row.facultyId,
        row.code,
        row.unit,
        row.mark,
        row.topic,
        row.remark,
        row.datetime,
        row.status,
      ]);

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `question_bank_${courseCode || "export"}_${new Date()
            .toISOString()
            .split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success(`Successfully exported ${filteredRows.length} questions`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen bg-white/80 backdrop-blur-xl shadow-2xl z-50 border-r border-gray-200/50">
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
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <FacultyNavbar />
      </Drawer>

      {/* Main Content */}
      <div
        className="flex-1 px-6 pt-6 pb-10 lg:ml-64 overflow-y-auto"
        style={{ maxHeight: "100vh" }}
      >
        {/* Enhanced Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-8">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="block lg:hidden text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-110"
                  onClick={() => setOpenSidebar(!openSidebar)}
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <BarChart3 size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Question Bank Details
                    </h1>
                    <p className="text-blue-100 mt-1">
                      View and manage your accepted questions
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <Imagecomp />
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="relative px-8 py-6 bg-gradient-to-b from-gray-50/80 to-white/80 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Grow in timeout={600}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Total Questions
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {questionRows.length}
                      </p>
                    </div>
                  </div>
                </div>
              </Grow>
              <Grow in timeout={800}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                      <Star size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Course Code
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {courseCode || "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>
              </Grow>
              <Grow in timeout={1000}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Recent Questions
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          questionRows.filter((q) => q.priority === "recent").length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </Grow>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <Fade in timeout={1000}>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 mb-8 p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-gray-400" />
                <span className="font-semibold text-gray-700">Filters:</span>
              </div>
              <div className="relative min-w-[250px]">
                <input
                  type="text"
                  placeholder="Search questions, topics, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
              <div className="relative min-w-[150px]">
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all duration-200"
                >
                  <option value="">All Units</option>
                  {availableUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
              {(searchTerm || filterUnit) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterUnit("");
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </Fade>

        {/* Enhanced Data Table */}
        <Fade in timeout={1200}>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10 px-8 py-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Question Details
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Showing {filteredRows.length} of {questionRows.length}{" "}
                      questions
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors duration-200"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            <div className="p-8">
              <Paper
                sx={{
                  width: "100%",
                  minWidth: 900,
                  borderRadius: 3,
                  border: "1px solid rgba(229, 231, 235, 0.5)",
                  boxShadow: "none",
                  background: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <DataGrid
                  autoHeight
                  rows={filteredRows}
                  columns={questionColumns}
                  loading={loading}
                  pageSizeOptions={[6, 10, 25]}
                  initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
                  }}
                  disableRowSelectionOnClick
                  hideFooterSelectedRowCount
                  rowHeight={75}
                  slots={{
                    noRowsOverlay: () => (
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-3xl mb-6 shadow-lg">
                          <FileText size={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                          No Questions Found
                        </h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          {searchTerm || filterUnit
                            ? "Try adjusting your search criteria or filters."
                            : "No accepted questions available yet."}
                        </p>
                      </div>
                    ),
                  }}
                  sx={{
                    border: 0,
                    minWidth: 900,
                    "& .MuiDataGrid-row:nth-of-type(odd)": {
                      backgroundColor: "rgba(248, 250, 252, 0.8)",
                    },
                    "& .MuiDataGrid-row:nth-of-type(even)": {
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "rgba(239, 246, 255, 0.8)",
                      transform: "scale(1.002)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 8px 25px -5px rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      margin: "2px 8px",
                      width: "calc(100% - 16px)",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "rgba(248, 250, 252, 0.9)",
                      fontWeight: "bold",
                      fontSize: 14,
                      color: "#374151",
                      borderBottom: "2px solid rgba(229, 231, 235, 0.8)",
                      borderRadius: "12px 12px 0 0",
                    },
                    "& .MuiDataGrid-cell": {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      padding: "20px",
                      borderBottom: "1px solid rgba(243, 244, 246, 0.8)",
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "2px solid rgba(229, 231, 235, 0.8)",
                      backgroundColor: "rgba(248, 250, 252, 0.9)",
                      borderRadius: "0 0 12px 12px",
                    },
                  }}
                />
              </Paper>
            </div>
          </div>
        </Fade>

        {/* Enhanced Question View Modal with Custom Scrollbar */}
        {viewModalOpen && selectedQuestion && (
          <div
            className={`fixed inset-0 z-50 transition-all duration-300 ${
              isFullscreen ? "p-0" : "p-4"
            }`}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewModalOpen(false)}
            />
            <Zoom in={viewModalOpen}>
              <div
                className={`relative mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
                  isFullscreen
                    ? "w-full h-full rounded-none"
                    : "w-full max-w-6xl h-[90vh] mt-[5vh]"
                }`}
              >
                {/* Enhanced Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <Eye size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Question Details
                        </h2>
                        <p className="text-blue-100 mt-1">
                          {selectedQuestion.unit} - {selectedQuestion.mark}M
                          Question
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200"
                        title={
                          isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                        }
                      >
                        {isFullscreen ? (
                          <Minimize2 size={20} />
                        ) : (
                          <Maximize2 size={20} />
                        )}
                      </button>
                      <button
                        onClick={() => setViewModalOpen(false)}
                        className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200"
                        title="Close"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Modal Content with Custom Scrollbar */}
                <div
                  className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-white custom-scrollbar"
                  style={{
                    maxHeight: isFullscreen
                      ? "calc(100vh - 88px)"
                      : "calc(90vh - 88px)",
                  }}
                >
                  <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 12px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: #f1f5f9;
                      border-radius: 10px;
                      margin: 8px 0;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: linear-gradient(to bottom, #94a3b8, #64748b);
                      border-radius: 10px;
                      border: 2px solid #f1f5f9;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: linear-gradient(to bottom, #64748b, #475569);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:active {
                      background: linear-gradient(to bottom, #475569, #334155);
                    }
                    .custom-scrollbar::-webkit-scrollbar-corner {
                      background: #f1f5f9;
                    }
                  `}</style>
                  <div className="max-w-none">
                    {/* Question Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Target size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Unit
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedQuestion.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Award size={18} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Marks
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedQuestion.mark}M
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <BookOpen size={18} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Topic
                            </p>
                            <p
                              className="text-lg font-bold text-gray-900 truncate"
                              title={selectedQuestion.topic}
                            >
                              {selectedQuestion.topic}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <CheckCircle
                              size={18}
                              className="text-emerald-600"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Status
                            </p>
                            <StatusBadge status={selectedQuestion.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <FileText size={20} className="text-blue-600" />
                          Question
                        </h3>
                        <div
                          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: selectedQuestion.question,
                          }}
                        />
                      </div>

                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <CheckCircle size={20} className="text-green-600" />
                          Answer
                        </h3>
                        <div
                          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: selectedQuestion.answer,
                          }}
                        />
                      </div>

                      {selectedQuestion.figure && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Eye size={20} className="text-purple-600" />
                            Figure
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <img
                              src={`http://localhost:7000${selectedQuestion.figure}`}
                              alt="Question Figure"
                              className="max-w-full h-auto rounded-lg shadow-md"
                            />
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Calendar size={20} className="text-gray-600" />
                          Metadata
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">
                              Last Updated :
                            </span>
                            <span className="text-gray-800 mt-1">
                              {selectedQuestion.updated_at
                                ? new Date(
                                    selectedQuestion.updated_at
                                  ).toLocaleString()
                                : "Not available"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Question ID :
                            </span>
                            <span className="text-gray-800 mt-1 font-mono">
                              {selectedQuestion.question_id || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Zoom>
          </div>
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="toast-container"
        toastStyle={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(229, 231, 235, 0.8)",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      />
    </div>
  );
};

export default QBDetails;
