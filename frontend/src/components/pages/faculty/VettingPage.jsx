import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import FacultyNavbar from "../../navbar/FacultyNavbar";
import { Drawer, Fade, Grow, Zoom } from "@mui/material";
import { Imagecomp } from "../../images/Imagecomp";
import { useSelector } from "react-redux";
import {
  Menu,
  Eye,
  CheckCircle,
  X,
  AlertCircle,
  FileText,
  BookOpen,
  Target,
  Award,
  Calendar,
  Clock,
  Settings,
  Filter,
  Search,
  Users,
  Sparkles,
  TrendingUp,
  Star,
  Shield,
  CheckSquare,
  XSquare,
  MessageSquare,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VettingPage = () => {
  const [questionRows, setQuestionRows] = useState([]);
  const [courseCode, setCourseCode] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [vettingEmail, setVettingEmail] = useState("");
  const [vFacultyId, setVFacultyId] = useState(null);
  const [approvalRemark, setApprovalRemark] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationMsg, setValidationMsg] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [faculty, setFaculty] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const vettingId = user.faculty_id;
  const email = user.email;

  // Helper function to determine priority based on date
  const getPriority = (date) => {
    const daysSince = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return "recent";
    if (daysSince <= 30) return "normal";
    return "old";
  };

  // Enhanced status badge
  const StatusBadge = ({ status, priority }) => {
    const getStatusColor = () => {
      switch (status) {
        case "pending":
          return "bg-[#4b37cd]/70 text-white";
        case "accepted":
          return "bg-[#4b37cd] text-white";
        case "rejected":
          return "bg-[#4b37cd]/40 text-white";
        default:
          return "bg-[#4b37cd]/60 text-white";
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

  useEffect(() => {
    const fetchFacultyId = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:7000/api/faculty/get-faculty-id",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { vetting_id: vettingId },
          }
        );
        setVFacultyId(res.data.faculty_id);
      } catch (err) {
        console.error("Error fetching faculty_id:", err);
        toast.error("Failed to fetch faculty ID");
      } finally {
        setLoading(false);
      }
    };
    if (vettingId) fetchFacultyId();
  }, [vettingId]);

  useEffect(() => {
    if (!vFacultyId) return;
    const fetchEmail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:7000/api/faculty/get-email",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { faculty_id: vFacultyId },
          }
        );
        setVettingEmail(res.data.email);
      } catch (err) {
        console.error("Error fetching email:", err);
        toast.error("Failed to fetch email");
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, [vFacultyId]);

  useEffect(() => {
    if (!vettingEmail) return;
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:7000/api/faculty/faculty-data",
          {
            params: { email: vettingEmail },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.length === 0) {
          setError("No faculty found with this email.");
          setFaculty(null);
        } else {
          setFaculty(response.data[0]);
          setError("");
        }
      } catch (err) {
        setError("Failed to fetch data: " + err.message);
        setFaculty(null);
        toast.error("Failed to fetch faculty data");
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, [vettingEmail, token]);

  useEffect(() => {
    if (!vettingEmail || !token) return;
    setLoading(true);
    axios
      .get("http://localhost:7000/api/faculty/get-course-code", {
        params: { email: vettingEmail },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCourseCode(res.data.course_code))
      .catch((err) => {
        console.error("Error fetching course code:", err);
        toast.error("Failed to fetch course code");
      })
      .finally(() => setLoading(false));
  }, [vettingEmail, token]);

  useEffect(() => {
    if (!courseCode) return;
    setLoading(true);
    axios
      .get(
        `http://localhost:7000/api/faculty/faculty-question-list?course_code=${courseCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        const vettingList = res.data.filter(
          (item) => item.status !== "accepted"
        );

        const sortedData = vettingList
          .slice()
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        const formattedRows = sortedData.map((item, index) => ({
          id: index + 1,
          facultyId: item.faculty_id,
          questionId: item.question_id,
          code: item.courseCode || courseCode,
          unit: item.unit,
          topic: item.topic || "General",
          mark: item.mark || "N/A",
          status: item.status || "pending",
          datetime: new Date(item.updated_at).toLocaleString(),
          priority: getPriority(new Date(item.updated_at)),
        }));
        setQuestionRows(formattedRows);
      })
      .catch((err) => {
        console.error("Error fetching question data:", err);
        toast.error("Failed to fetch questions");
      })
      .finally(() => setLoading(false));
  }, [courseCode, refreshTrigger]);

  // Filter questions based on search and status filter
  const filteredRows = questionRows.filter((row) => {
    const matchesSearch =
      row.facultyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || row.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Get unique statuses for filter
  const availableStatuses = [
    ...new Set(questionRows.map((row) => row.status)),
  ].sort();

  const handleView = (rowId) => {
    setLoading(true);
    const selected = questionRows.find((row) => row.id === rowId);
    axios
      .get(
        `http://localhost:7000/api/faculty/question-view/${selected.questionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        setSelectedQuestion({ ...res.data[0], id: selected.questionId });
        setViewModalOpen(true);
      })
      .catch((err) => {
        console.error("Error viewing question:", err);
        toast.error("Failed to load question details");
      })
      .finally(() => setLoading(false));
  };

  const handleAccept = async () => {
    if (!approvalRemark) {
      setValidationMsg("Approval remark is required.");
      return;
    }
    setValidationMsg("");
    setLoading(true);
    try {
      await axios.put(
        `http://localhost:7000/api/faculty/review-question/${selectedQuestion.question_id}`,
        { status: "accepted", remarks: approvalRemark, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewModalOpen(false);
      setApprovalRemark("");
      setRejectionReason("");
      setRefreshTrigger((prev) => !prev);
      toast.success("Question accepted successfully!");
    } catch (err) {
      console.error("Error accepting question:", err);
      toast.error("Failed to accept question");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      setValidationMsg("Rejection reason is required.");
      return;
    }
    setValidationMsg("");
    setLoading(true);
    try {
      await axios.put(
        `http://localhost:7000/api/faculty/review-question/${selectedQuestion.question_id}`,
        { status: "rejected", remarks: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewModalOpen(false);
      setApprovalRemark("");
      setRejectionReason("");
      setRefreshTrigger((prev) => !prev);
      toast.success("Question rejected successfully!");
    } catch (err) {
      console.error("Error rejecting question:", err);
      toast.error("Failed to reject question");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced question columns
  const questionColumns = [
    {
      field: "facultyId",
      headerName: "Faculty ID",
      flex: 0.9,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1.5 rounded-lg">
            <Users size={14} className="text-[#4b37cd]" />
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
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1.5 rounded-lg">
            <Target size={14} className="text-[#4b37cd]" />
          </div>
          <span className="font-semibold text-[#4b37cd] px-2 py-1 rounded">
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
        <span className="font-bold text-[#4b37cd] px-2 py-1 rounded">
          {params.value}
        </span>
      ),
    },
    {
      field: "mark",
      headerName: "Mark",
      flex: 0.5,
      renderCell: (params) => (
        <span className="font-bold text-[#4b37cd] px-2 py-1 rounded">
          {params.value}M
        </span>
      ),
    },
    {
      field: "topic",
      headerName: "Topic",
      flex: 1.2,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1.5 rounded-lg">
            <FileText size={14} className="text-[#4b37cd]" />
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
      field: "datetime",
      headerName: "Date & Time",
      flex: 1.3,
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
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleView(params.row.id)}
          className="group relative p-2 bg-[#4b37cd]/10 hover:bg-[#4b37cd]/20 text-[#4b37cd] rounded-lg transition-all duration-200 hover:scale-110 flex items-center gap-2 px-4"
          title="View & Review Question"
        >
          <Eye size={16} />
          <span className="text-sm font-medium">Review</span>
        </button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
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
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        <div className="px-4 sm:px-6 pt-6 pb-10">
          {/* Enhanced Header Section */}
          <Fade in timeout={800}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
              <div className="relative bg-[#4b37cd] px-4 sm:px-8 py-10">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
                    <button
                      className="block lg:hidden text-white hover:bg-white/20 p-3 rounded-xl transition-all duration-300 hover:scale-110 flex-shrink-0"
                      onClick={() => setOpenSidebar(!openSidebar)}
                    >
                      <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 flex-shrink-0">
                        <Shield size={32} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 truncate">
                          Vetting Dashboard
                        </h1>
                        <p className="text-white/80 text-sm sm:text-lg">
                          Review and approve submitted questions
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />
                          <span className="text-white/70 text-sm truncate">
                            {questionRows.length} Questions to Review
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-6 lg:mt-0 flex-shrink-0">
                    <div className="hidden md:block">
                      <Imagecomp />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="relative px-4 sm:px-8 py-6 bg-gradient-to-b from-gray-50/80 to-white/80 backdrop-blur-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <Grow in timeout={600}>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-[#4b37cd] p-2 sm:p-3 rounded-xl flex-shrink-0">
                          <FileText
                            size={window.innerWidth < 640 ? 16 : 20}
                            className="text-white"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
                            Total Questions
                          </p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">
                            {questionRows.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Grow>
                  <Grow in timeout={800}>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-[#4b37cd]/70 p-2 sm:p-3 rounded-xl flex-shrink-0">
                          <Clock
                            size={window.innerWidth < 640 ? 16 : 20}
                            className="text-white"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
                            Pending
                          </p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">
                            {
                              questionRows.filter((q) => q.status === "pending")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </Grow>
                  <Grow in timeout={1000}>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-[#4b37cd]/40 p-2 sm:p-3 rounded-xl flex-shrink-0">
                          <XSquare
                            size={window.innerWidth < 640 ? 16 : 20}
                            className="text-white"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
                            Rejected
                          </p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">
                            {
                              questionRows.filter(
                                (q) => q.status === "rejected"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </Grow>
                  <Grow in timeout={1200}>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-[#4b37cd]/60 p-2 sm:p-3 rounded-xl flex-shrink-0">
                          <Sparkles
                            size={window.innerWidth < 640 ? 16 : 20}
                            className="text-white"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
                            Recent
                          </p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">
                            {
                              questionRows.filter(
                                (q) => q.priority === "recent"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </Grow>
                </div>
              </div>
            </div>
          </Fade>

          {/* Enhanced Filters Section */}
          {/* <Fade in timeout={1000}>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 mb-8 p-4 sm:p-6">
              
            </div>
          </Fade> */}

          {/* Enhanced Data Table */}
          <Fade in timeout={1200}>
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
              <div className="bg-[#4b37cd]/10 px-4 sm:px-8 py-6 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-[#4b37cd] p-3 rounded-2xl shadow-lg flex-shrink-0">
                      <Shield size={24} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                        Question Vetting
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Showing {filteredRows.length} of {questionRows.length}{" "}
                        questions for review
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-[#4b37cd]/10 hover:bg-[#4b37cd]/20 text-[#4b37cd] rounded-xl transition-colors duration-200">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Search size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-700">
                              Filters:
                            </span>
                          </div>
                          <div className="relative w-full sm:min-w-[250px] sm:max-w-[300px]">
                            <input
                              type="text"
                              placeholder="Search faculty ID, topics, or units..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full px-4 py-2 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200"
                            />
                            <Search
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              size={16}
                            />
                          </div>
                          <div className="relative w-full sm:w-auto sm:min-w-[150px]">
                            <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="w-full px-4 py-2 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none appearance-none transition-all duration-200"
                            >
                              <option value="">All Status</option>
                              {availableStatuses.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  className="capitalize"
                                >
                                  {status}
                                </option>
                              ))}
                            </select>
                            <Filter
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              size={16}
                            />
                          </div>
                          {(searchTerm || filterStatus) && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setFilterStatus("");
                              }}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors duration-200 flex items-center gap-2 flex-shrink-0 w-full sm:w-auto"
                            >
                              <X size={16} />
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-8 overflow-x-auto">
                <Paper
                  sx={{
                    width: "100%",
                    minWidth: { xs: 800, sm: 900 },
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
                      pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                      },
                    }}
                    disableRowSelectionOnClick
                    hideFooterSelectedRowCount
                    rowHeight={75}
                    slots={{
                      noRowsOverlay: () => (
                        <div className="flex flex-col items-center justify-center h-64 p-4">
                          <div className="bg-[#4b37cd]/10 p-6 rounded-3xl mb-6 shadow-lg">
                            <Shield size={48} className="text-[#4b37cd]" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 text-center">
                            No Vetting Tasks Assigned
                          </h3>
                          <p className="text-gray-500 text-center max-w-sm text-sm sm:text-base">
                            {searchTerm || filterStatus
                              ? "Try adjusting your search criteria or filters."
                              : "No questions available for vetting at this time."}
                          </p>
                        </div>
                      ),
                    }}
                    sx={{
                      border: 0,
                      minWidth: { xs: 800, sm: 900 },
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
                        fontSize: { xs: 12, sm: 14 },
                        color: "#374151",
                        borderBottom: "2px solid rgba(229, 231, 235, 0.8)",
                        borderRadius: "12px 12px 0 0",
                      },
                      "& .MuiDataGrid-cell": {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        padding: { xs: "12px", sm: "20px" },
                        borderBottom: "1px solid rgba(243, 244, 246, 0.8)",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
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

          {/* Enhanced View Modal */}
          {viewModalOpen && selectedQuestion && (
            <div
              className={`fixed inset-0 z-50 transition-all duration-300 ${
                isFullscreen ? "p-0" : "p-2 sm:p-4"
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
                      : "w-full max-w-7xl h-[90vh] mt-[5vh]"
                  }`}
                >
                  {/* Modal Header */}
                  <div className="bg-[#4b37cd] px-4 sm:px-8 py-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm flex-shrink-0">
                          <Shield size={24} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                            Question Vetting
                          </h2>
                          <p className="text-white/80 mt-1 text-sm sm:text-base">
                            {selectedQuestion.unit} - {selectedQuestion.mark}M
                            Question
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewModalOpen(false)}
                        className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200 flex-shrink-0"
                        title="Close"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex flex-col lg:flex-row h-full">
                    {/* Question Details Section */}
                    <div
                      className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-white border-b lg:border-b-0 lg:border-r border-gray-200 custom-scrollbar"
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
                          background: linear-gradient(
                            to bottom,
                            #94a3b8,
                            #64748b
                          );
                          border-radius: 10px;
                          border: 2px solid #f1f5f9;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                          background: linear-gradient(
                            to bottom,
                            #64748b,
                            #475569
                          );
                        }
                      `}</style>

                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText
                          size={24}
                          className="text-[#4b37cd] flex-shrink-0"
                        />
                        <span className="truncate">Question Details</span>
                      </h3>

                      {/* Question Info Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                              <Target size={18} className="text-[#4b37cd]" />
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
                            <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                              <Award size={18} className="text-[#4b37cd]" />
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
                            <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                              <BookOpen size={18} className="text-[#4b37cd]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-600 mb-2">
                                Topic
                              </p>
                              <div className="bg-[#4b37cd]/20 border border-[#4b37cd]/40 rounded-lg px-3 py-2">
                                <p
                                  className="text-sm font-bold text-[#4b37cd] break-words"
                                  title={selectedQuestion.topic}
                                >
                                  {selectedQuestion.topic}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText
                              size={20}
                              className="text-[#4b37cd] flex-shrink-0"
                            />
                            Question
                          </h4>
                          <div
                            className="prose prose-sm sm:prose-lg max-w-none text-gray-700 leading-relaxed break-words"
                            dangerouslySetInnerHTML={{
                              __html: selectedQuestion.question,
                            }}
                          />
                        </div>

                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle
                              size={20}
                              className="text-[#4b37cd] flex-shrink-0"
                            />
                            Answer
                          </h4>
                          <div
                            className="prose prose-sm sm:prose-lg max-w-none text-gray-700 leading-relaxed break-words"
                            dangerouslySetInnerHTML={{
                              __html: selectedQuestion.answer,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vetting Panel */}
                    <div
                      className="w-full lg:w-96 bg-gradient-to-b from-purple-50 to-indigo-50 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-shrink-0"
                      style={{
                        maxHeight: isFullscreen
                          ? "calc(100vh - 88px)"
                          : "calc(90vh - 88px)",
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageSquare
                              size={20}
                              className="text-[#4b37cd]"
                            />
                            Vetting Process
                          </h3>

                          <div className="space-y-4 mb-6">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-600">
                                Course Code
                              </p>
                              <p className="text-lg font-bold text-[#4b37cd]">
                                {courseCode}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-600">
                                Faculty ID
                              </p>
                              <p className="text-lg font-bold text-[#4b37cd]">
                                {faculty?.faculty_id}
                              </p>
                            </div>
                          </div>

                          {/* Status Alert */}
                          {["accepted", "rejected"].includes(
                            selectedQuestion?.status
                          ) && (
                            <div className="bg-[#4b37cd]/10 border border-[#4b37cd]/30 text-[#4b37cd] rounded-xl p-4 mb-6">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} />
                                <span className="font-semibold">
                                  Already Reviewed
                                </span>
                              </div>
                              <p className="text-sm">
                                This question has been reviewed. Status:{" "}
                                <span className="font-bold capitalize">
                                  {selectedQuestion.status}
                                </span>
                              </p>
                            </div>
                          )}

                          {/* Approval Section */}
                          <div className="space-y-4">
                            <div>
                              <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                                <CheckSquare
                                  size={16}
                                  className="text-[#4b37cd]"
                                />
                                Approval Remarks
                                <span className="text-red-600">*</span>
                              </label>
                              <select
                                value={approvalRemark}
                                onChange={(e) => {
                                  setApprovalRemark(e.target.value);
                                  if (e.target.value) {
                                    setRejectionReason("");
                                    setValidationMsg("");
                                  }
                                }}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200 disabled:bg-gray-100"
                                disabled={["accepted", "rejected"].includes(
                                  selectedQuestion?.status
                                )}
                              >
                                <option value="">
                                  -- Select Approval Remark --
                                </option>
                                <option value="The Quality of the Question is Good">
                                  The Quality of the Question is Good
                                </option>
                                <option value="Excellent Question Structure">
                                  Excellent Question Structure
                                </option>
                                <option value="Need Improvement">
                                  Need Improvement
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                                <XSquare size={16} className="text-[#4b37cd]" />
                                Rejection Reasons
                                <span className="text-red-600">*</span>
                              </label>
                              <select
                                value={rejectionReason}
                                onChange={(e) => {
                                  setRejectionReason(e.target.value);
                                  if (e.target.value) {
                                    setApprovalRemark("");
                                    setValidationMsg("");
                                  }
                                }}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200 disabled:bg-gray-100"
                                disabled={["accepted", "rejected"].includes(
                                  selectedQuestion?.status
                                )}
                              >
                                <option value="">
                                  -- Select Rejection Reason --
                                </option>
                                <option value="The clarity of question is not proper">
                                  The clarity of question is not proper
                                </option>
                                <option value="The Question is Incomplete">
                                  The Question is Incomplete
                                </option>
                                <option value="The Figure in the Question is not clear">
                                  The Figure in the Question is not clear
                                </option>
                              </select>
                            </div>

                            {validationMsg && (
                              <div className="bg-[#4b37cd]/10 border border-[#4b37cd]/30 text-[#4b37cd] rounded-xl p-3">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={16} />
                                  <span className="text-sm font-semibold">
                                    {validationMsg}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <button
                              onClick={handleAccept}
                              disabled={
                                !approvalRemark ||
                                ["accepted", "rejected"].includes(
                                  selectedQuestion?.status
                                ) ||
                                loading
                              }
                              className="w-full px-6 py-3 bg-[#4b37cd] hover:bg-[#3d2ba7] text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <CheckSquare size={18} />
                              {loading ? "Processing..." : "Accept Question"}
                            </button>
                            <button
                              onClick={handleReject}
                              disabled={
                                !rejectionReason ||
                                ["accepted", "rejected"].includes(
                                  selectedQuestion?.status
                                ) ||
                                loading
                              }
                              className="w-full px-6 py-3 bg-[#4b37cd]/60 hover:bg-[#4b37cd]/70 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <XSquare size={18} />
                              {loading ? "Processing..." : "Reject Question"}
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setViewModalOpen(false);
                              setValidationMsg("");
                              setApprovalRemark("");
                              setRejectionReason("");
                            }}
                            className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Zoom>
            </div>
          )}
        </div>
      </main>

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

export default VettingPage;
