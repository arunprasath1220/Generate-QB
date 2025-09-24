import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import FacultyNavbar from "../../navbar/FacultyNavbar";
import { Imagecomp } from "../../images/Imagecomp";
import { useSelector } from "react-redux";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Drawer, Fade, Grow, Zoom } from "@mui/material";
import { 
  Eye, 
  Pencil, 
  Trash, 
  Menu, 
  Plus,
  FileText,
  Settings,
  Save,
  X,
  Calendar,
  BookOpen,
  Target,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  BarChart3,
  Sparkles,
  TrendingUp,
  Star
} from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const prependImageBaseUrl = (html) => {
  const baseUrl = "http://localhost:7000";
  return html.replace(
    /<img src="\/uploads\//g,
    `<img src="${baseUrl}/uploads/`
  );
};

const ManageQB = () => {
  const [questionRows, setQuestionRows] = useState([]);
  const [courseCode, setCourseCode] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const email = user?.email;

  // Custom Upload Adapter Plugin
  function CustomUploadAdapterPlugin(editor) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
      return {
        upload: async () => {
          const file = await loader.file;
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
              default: response.data.figurePath,
            };
          } catch (error) {
            console.error("Image upload failed:", error);
            toast.error("Failed to upload image");
            return Promise.reject("Upload failed");
          }
        },
      };
    };
  }

  // Helper function to determine priority based on date
  const getPriority = (date) => {
    const daysSince = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return 'recent';
    if (daysSince <= 30) return 'normal';
    return 'old';
  };

  // Fetch course code
  useEffect(() => {
    if (email && token) {
      setLoading(true);
      axios
        .get("http://localhost:7000/api/faculty/get-course-code", {
          params: { email },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCourseCode(res.data.course_code))
        .catch((err) => {
          console.error("Error fetching course code:", err);
          toast.error("Failed to fetch course code");
        })
        .finally(() => setLoading(false));
    }
  }, [email, token]);

  // Fetch questions
  useEffect(() => {
    if (courseCode) {
      setLoading(true);
      axios
        .get(
          `http://localhost:7000/api/faculty/faculty-question-list?course_code=${courseCode}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then((res) => {
          // Filter for 'pending' or 'rejected' questions
          const filteredData = res.data.filter(
            (item) => item.status === "pending" || item.status === "rejected"
          );

          const sorted = filteredData.sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
          );
          const formattedRows = sorted.map((item, index) => ({
            id: index + 1,
            questionId: item.question_id,
            facultyId: item.faculty_id,
            courseCode: item.course_code,
            topic: item.topic || 'General',
            remark: item.remarks || 'No remarks',
            unit: item.unit,
            mark: item.mark || 'N/A',
            datetime: new Date(item.updated_at).toLocaleString(),
            status: item.status,
            priority: getPriority(new Date(item.updated_at)),
          }));
          setQuestionRows(formattedRows);
        })
        .catch((err) => {
          console.error("Error fetching question data:", err);
          toast.error("Failed to fetch questions");
        })
        .finally(() => setLoading(false));
    }
  }, [courseCode, token]);

  // Filter questions based on search and status filter
  const filteredRows = questionRows.filter(row => {
    const matchesSearch = row.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || row.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Get unique statuses for filter
  const availableStatuses = [...new Set(questionRows.map(row => row.status))].sort();

  // Enhanced status badge
  const StatusBadge = ({ status, priority }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'pending': return 'bg-[#4b37cd]/70 text-white';
        case 'rejected': return 'bg-[#4b37cd]/40 text-[#4b37cd]';
        default: return 'bg-gray-600 text-white';
      }
    };

    const getPriorityIcon = () => {
      switch (priority) {
        case 'recent': return <Sparkles size={12} className="animate-pulse" />;
        case 'normal': return <Clock size={12} />;
        case 'old': return <Calendar size={12} />;
        default: return null;
      }
    };

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor()}`}>
        {getPriorityIcon()}
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  // Handle view question
  const handleView = (rowId) => {
    setLoading(true);
    const selected = questionRows.find((row) => row.questionId === rowId);
    axios
      .get(
        `http://localhost:7000/api/faculty/question-view/${selected.questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
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

  // Handle edit question
  const handleEdit = (rowId) => {
    setLoading(true);
    const selected = questionRows.find((row) => row.questionId === rowId);
    axios
      .get(
        `http://localhost:7000/api/faculty/question-view/${selected.questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setSelectedQuestion(res.data[0]);
        setEditModalOpen(true);
      })
      .catch((err) => {
        console.error("Error fetching for edit:", err);
        toast.error("Failed to load question for editing");
      })
      .finally(() => setLoading(false));
  };

  // Handle save edit
  const handleSaveEdit = () => {
    setLoading(true);
    const { id, unit, topic, mark, question, answer, figure } = selectedQuestion;

    axios
      .put(
        `http://localhost:7000/api/faculty/question-edit/${id}`,
        { unit, topic, mark, question, answer, figure },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setEditModalOpen(false);
        setSelectedQuestion(null);
        toast.success("Question updated successfully!");
        // Reload the page to fetch the updated data from the server
        window.location.reload();
      })
      .catch((err) => {
        console.error("Error updating question:", err);
        toast.error("Failed to update the question. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Handle delete question
  const handleDelete = (questionId) => {
    const selected = questionRows.find((row) => row.questionId === questionId);
    if (!selected) {
      toast.error("Question not found!");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this question?")) {
      setLoading(true);
      axios
        .delete(
          `http://localhost:7000/api/faculty/question-delete/${selected.questionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
          setQuestionRows((prev) =>
            prev.filter((row) => row.questionId !== questionId)
          );
          toast.success("Question deleted successfully!");
        })
        .catch((err) => {
          console.error("Error deleting question:", err);
          toast.error("Failed to delete question");
        })
        .finally(() => setLoading(false));
    }
  };

  // Enhanced question columns
  const questionColumns = [
    {
      field: 'facultyId',
      headerName: 'Faculty ID',
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1.5 rounded-lg">
            <BookOpen size={14} className="text-[#4b37cd]" />
          </div>
          <span className="font-medium text-gray-800">{params.value}</span>
        </div>
      ),
    },
    {
      field: 'courseCode',
      headerName: 'Course Code',
      flex: 0.9,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1.5 rounded-lg">
            <Target size={14} className="text-[#4b37cd]" />
          </div>
          <span className="font-semibold text-[#4b37cd] py-1 rounded">
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: 'unit',
      headerName: 'Unit',
      flex: 0.5,
      renderCell: (params) => (
        <span className="font-bold text-[#4b37cd] px-0 py-1 rounded">
          {params.value}
        </span>
      ),
    },
    {
      field: 'mark',
      headerName: 'Mark',
      flex: 0.5,
      renderCell: (params) => (
        <span className="font-bold text-[#4b37cd] px-0 py-1 rounded">
          {params.value}M
        </span>
      ),
    },
    {
      field: 'topic',
      headerName: 'Topic',
      flex: 1.4,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1.5 rounded-lg">
            <FileText size={14} className="text-[#4b37cd]" />
          </div>
          <span className="text-gray-700 font-medium truncate" title={params.value}>
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: 'remark',
      headerName: 'Remark',
      flex: 1.5,
      renderCell: (params) => (
        <span className="text-gray-600 text-sm truncate" title={params.value}>
          {params.value}
        </span>
      ),
    },
    {
      field: 'datetime',
      headerName: 'Date & Time',
      flex: 1.3,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">{params.value}</span>
        </div>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => (
        <StatusBadge status={params.value} priority={params.row.priority} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleView(params.row.questionId)}
            className="group relative p-2 bg-[#4b37cd]/10 hover:bg-[#4b37cd]/20 text-[#4b37cd] rounded-lg transition-all duration-200 hover:scale-110"
            title="View Question"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(params.row.questionId)}
            className="group relative p-2 bg-[#4b37cd]/10 hover:bg-[#4b37cd]/20 text-[#4b37cd] rounded-lg transition-all duration-200 hover:scale-110"
            title="Edit Question"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(params.row.questionId)}
            className="group relative p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200 hover:scale-110"
            title="Delete Question"
          >
            <Trash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen bg-white shadow-xl z-50 border-r border-gray-200">
        <FacultyNavbar />
      </div>

      <Drawer
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 250,
            top: 0,
            height: '100vh',
          },
        }}
      >
        <FacultyNavbar />
      </Drawer>

      {/* Main Content */}
      <div className="flex-1 px-6 pt-6 pb-10 lg:ml-64 overflow-y-auto">
        {/* Enhanced Header Section */}
        <Fade in timeout={800}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
            
            <div className="relative bg-[#4b37cd] px-8 py-10">
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex items-center gap-6">
                  <button
                    className="block lg:hidden text-white hover:bg-white/20 p-3 rounded-xl transition-all duration-300"
                    onClick={() => setOpenSidebar(!openSidebar)}
                  >
                    <Menu size={24} />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-2xl border border-white/30">
                      <Settings size={32} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                        Manage Questions
                      </h1>
                      <p className="text-white/80 text-lg">
                        Edit and manage your pending & rejected questions
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                        <span className="text-white/70 text-sm">
                          {questionRows.length} Questions to Review
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6 lg:mt-0">
                  <div className="hidden md:block">
                    <Imagecomp />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="relative px-8 py-6 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Grow in timeout={600}>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#4b37cd]/10 p-3 rounded-xl">
                        <Clock size={20} className="text-[#4b37cd]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Total Questions</p>
                        <p className="text-2xl font-bold text-[#4b37cd]">{questionRows.length}</p>
                      </div>
                    </div>
                  </div>
                </Grow>
                <Grow in timeout={800}>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#4b37cd]/10 p-3 rounded-xl">
                        <AlertCircle size={20} className="text-[#4b37cd]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-[#4b37cd]">
                          {questionRows.filter(q => q.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Grow>
                <Grow in timeout={1000}>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#4b37cd]/10 p-3 rounded-xl">
                        <X size={20} className="text-[#4b37cd]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold text-[#4b37cd]">
                          {questionRows.filter(q => q.status === 'rejected').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Grow>
                <Grow in timeout={1200}>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#4b37cd]/10 p-3 rounded-xl">
                        <Sparkles size={20} className="text-[#4b37cd]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Recent</p>
                        <p className="text-2xl font-bold text-[#4b37cd]">
                          {questionRows.filter(q => q.priority === 'recent').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Grow>
              </div>
            </div>
          </div>
        </Fade>

        {/* Enhanced Filters and Add Button Section */}
        <Fade in timeout={1000}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
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
                    className="w-full px-4 py-2 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <div className="relative min-w-[150px]">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none appearance-none transition-all duration-200"
                  >
                    <option value="">All Status</option>
                    {availableStatuses.map(status => (
                      <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                  </select>
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
                {(searchTerm || filterStatus) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('');
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors duration-200 flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={() => navigate("../addquestions")}
                className="flex items-center gap-2 px-6 py-3 bg-[#4b37cd] hover:bg-[#3d2ba7] text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                <span>Add Questions</span>
              </button>
            </div>
          </div>
        </Fade>

        {/* Enhanced Data Table */}
        <Fade in timeout={1200}>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-[#4b37cd]/5 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#4b37cd] p-3 rounded-2xl shadow-sm">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Question Management</h3>
                    <p className="text-gray-600 mt-1">
                      Showing {filteredRows.length} of {questionRows.length} questions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <Paper 
                sx={{ 
                  width: "100%",
                  minWidth: 900,
                  borderRadius: 3,
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  boxShadow: 'none',
                  background: 'rgba(255, 255, 255, 0.95)',
                }}
              >
                <DataGrid
                  autoHeight
                  rows={filteredRows}
                  columns={questionColumns}
                  loading={loading}
                  pageSizeOptions={[6, 10, 25]}
                  initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } }
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
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Questions Found</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          {searchTerm || filterStatus 
                            ? "Try adjusting your search criteria or filters."
                            : "No pending or rejected questions available."
                          }
                        </p>
                      </div>
                    ),
                  }}
                  sx={{
                    border: 0,
                    minWidth: 900,
                    '& .MuiDataGrid-row:nth-of-type(odd)': {
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                    },
                    '& .MuiDataGrid-row:nth-of-type(even)': {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'rgba(239, 246, 255, 0.8)',
                      transform: 'scale(1.002)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      margin: '2px 8px',
                      width: 'calc(100% - 16px)',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'rgba(248, 250, 252, 0.9)',
                      fontWeight: 'bold',
                      fontSize: 14,
                      color: '#374151',
                      borderBottom: '2px solid rgba(229, 231, 235, 0.8)',
                      borderRadius: '12px 12px 0 0',
                    },
                    '& .MuiDataGrid-cell': {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '20px',
                      borderBottom: '1px solid rgba(243, 244, 246, 0.8)',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '2px solid rgba(229, 231, 235, 0.8)',
                      backgroundColor: 'rgba(248, 250, 252, 0.9)',
                      borderRadius: '0 0 12px 12px',
                    },
                  }}
                />
              </Paper>
            </div>
          </div>
        </Fade>

        {/* Enhanced View Modal */}
        {viewModalOpen && selectedQuestion && (
          <div className={`fixed inset-0 z-50 transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4'}`}>
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setViewModalOpen(false)} 
            />
            <Zoom in={viewModalOpen}>
              <div className={`relative mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
                isFullscreen 
                  ? 'w-full h-full rounded-none' 
                  : 'w-full max-w-6xl h-[90vh] mt-[5vh]'
              }`}>
                {/* Modal Header */}
                <div className="bg-[#4b37cd] px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-2xl">
                        <Eye size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Question Details</h2>
                        <p className="text-white/80 mt-1">
                          {selectedQuestion.unit} - {selectedQuestion.mark}M Question
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200"
                      title="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Content with Custom Scrollbar */}
                <div 
                  className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-white custom-scrollbar"
                  style={{
                    maxHeight: isFullscreen 
                      ? 'calc(100vh - 88px)' 
                      : 'calc(90vh - 88px)'
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
                          <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                            <Target size={18} className="text-[#4b37cd]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Unit</p>
                            <p className="text-lg font-bold text-gray-900">{selectedQuestion.unit}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                            <Award size={18} className="text-[#4b37cd]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Marks</p>
                            <p className="text-lg font-bold text-gray-900">{selectedQuestion.mark}M</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                            <BookOpen size={18} className="text-[#4b37cd]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-2">Topic</p>
                            <div className="bg-[#4b37cd]/10 border border-[#4b37cd]/20 rounded-lg px-3 py-2">
                              <p className="text-sm font-bold text-[#4b37cd] break-words" title={selectedQuestion.topic}>
                                {selectedQuestion.topic}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#4b37cd]/10 p-2 rounded-lg">
                            <CheckCircle size={18} className="text-[#4b37cd]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            <StatusBadge status={selectedQuestion.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <FileText size={20} className="text-[#4b37cd]" />
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

                      {/* Add Remark Section */}
                      {selectedQuestion.remarks && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-[#4b37cd]" />
                            Remark
                          </h3>
                          <div className="bg-[#4b37cd]/10 border-l-4 border-[#4b37cd] p-4 rounded-r-xl">
                            <p className="text-gray-700 leading-relaxed">
                              {selectedQuestion.remarks}
                            </p>
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
                            <span className="font-medium text-gray-600">Last Updated :</span>
                            <span className="text-gray-800 mt-1">
                              {selectedQuestion.updated_at
                                ? new Date(selectedQuestion.updated_at).toLocaleString()
                                : "Not available"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Question ID :</span>
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

        {/* Enhanced Edit Modal */}
        {editModalOpen && selectedQuestion && (
          <div className={`fixed inset-0 z-50 transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4'}`}>
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setEditModalOpen(false)} 
            />
            <Zoom in={editModalOpen}>
              <div className={`relative mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
                isFullscreen 
                  ? 'w-full h-full rounded-none' 
                  : 'w-full max-w-6xl h-[90vh] mt-[5vh]'
              }`}>
                {/* Edit Modal Header */}
                <div className="bg-[#4b37cd] px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-2xl">
                        <Pencil size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Edit Question</h2>
                        <p className="text-white/80 mt-1">
                          Modify and update question details
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200"
                        title="Save Changes"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditModalOpen(false)}
                        className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200"
                        title="Cancel"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Edit Modal Content with Custom Scrollbar */}
                <div 
                  className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-white custom-scrollbar"
                  style={{
                    maxHeight: isFullscreen 
                      ? 'calc(100vh - 88px)' 
                      : 'calc(90vh - 88px)'
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
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={selectedQuestion.unit}
                          onChange={(e) =>
                            setSelectedQuestion({
                              ...selectedQuestion,
                              unit: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200"
                        />
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Topic
                        </label>
                        <input
                          type="text"
                          value={selectedQuestion.topic}
                          onChange={(e) =>
                            setSelectedQuestion({
                              ...selectedQuestion,
                              topic: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200"
                        />
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Marks
                        </label>
                        <input
                          type="number"
                          value={selectedQuestion.mark}
                          onChange={(e) =>
                            setSelectedQuestion({
                              ...selectedQuestion,
                              mark: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4b37cd] focus:border-[#4b37cd] outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Question Editor */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-[#4b37cd]" />
                        Question
                      </h3>
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                        <CKEditor
                          editor={ClassicEditor}
                          data={prependImageBaseUrl(selectedQuestion.question)}
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            setSelectedQuestion({
                              ...selectedQuestion,
                              question: data,
                            });
                          }}
                          config={{
                            extraPlugins: [CustomUploadAdapterPlugin],
                            toolbar: {
                              items: [
                                'heading',
                                '|',
                                'bold',
                                'italic',
                                'underline',
                                'strikethrough',
                                '|',
                                'fontSize',
                                'fontColor',
                                'fontBackgroundColor',
                                '|',
                                'bulletedList',
                                'numberedList',
                                'outdent',
                                'indent',
                                '|',
                                'alignment',
                                '|',
                                'link',
                                'imageUpload',
                                'insertTable',
                                'blockQuote',
                                'horizontalLine',
                                '|',
                                'undo',
                                'redo'
                              ],
                              shouldNotGroupWhenFull: true
                            },
                            fontSize: {
                              options: [9, 11, 13, 'default', 17, 19, 21]
                            },
                            fontColor: {
                              colors: [
                                {
                                  color: 'hsl(0, 0%, 0%)',
                                  label: 'Black'
                                },
                                {
                                  color: 'hsl(0, 0%, 30%)',
                                  label: 'Dim grey'
                                },
                                {
                                  color: 'hsl(0, 0%, 60%)',
                                  label: 'Grey'
                                },
                                {
                                  color: 'hsl(0, 0%, 90%)',
                                  label: 'Light grey'
                                },
                                {
                                  color: 'hsl(0, 0%, 100%)',
                                  label: 'White',
                                  hasBorder: true
                                },
                                {
                                  color: 'hsl(0, 75%, 60%)',
                                  label: 'Red'
                                },
                                {
                                  color: 'hsl(30, 75%, 60%)',
                                  label: 'Orange'
                                },
                                {
                                  color: 'hsl(60, 75%, 60%)',
                                  label: 'Yellow'
                                },
                                {
                                  color: 'hsl(90, 75%, 60%)',
                                  label: 'Light green'
                                },
                                {
                                  color: 'hsl(120, 75%, 60%)',
                                  label: 'Green'
                                },
                                {
                                  color: 'hsl(150, 75%, 60%)',
                                  label: 'Aquamarine'
                                },
                                {
                                  color: 'hsl(180, 75%, 60%)',
                                  label: 'Turquoise'
                                },
                                {
                                  color: 'hsl(210, 75%, 60%)',
                                  label: 'Light blue'
                                },
                                {
                                  color: 'hsl(240, 75%, 60%)',
                                  label: 'Blue'
                                },
                                {
                                  color: 'hsl(270, 75%, 60%)',
                                  label: 'Purple'
                                }
                              ]
                            },
                            fontBackgroundColor: {
                              colors: [
                                {
                                  color: 'hsl(0, 0%, 100%)',
                                  label: 'White'
                                },
                                {
                                  color: 'hsl(0, 0%, 80%)',
                                  label: 'Light grey'
                                },
                                {
                                  color: 'hsl(0, 75%, 60%)',
                                  label: 'Red'
                                },
                                {
                                  color: 'hsl(30, 75%, 60%)',
                                  label: 'Orange'
                                },
                                {
                                  color: 'hsl(60, 75%, 60%)',
                                  label: 'Yellow'
                                },
                                {
                                  color: 'hsl(90, 75%, 60%)',
                                  label: 'Light green'
                                },
                                {
                                  color: 'hsl(120, 75%, 60%)',
                                  label: 'Green'
                                },
                                {
                                  color: 'hsl(150, 75%, 60%)',
                                  label: 'Aquamarine'
                                },
                                {
                                  color: 'hsl(180, 75%, 60%)',
                                  label: 'Turquoise'
                                },
                                {
                                  color: 'hsl(210, 75%, 60%)',
                                  label: 'Light blue'
                                },
                                {
                                  color: 'hsl(240, 75%, 60%)',
                                  label: 'Blue'
                                },
                                {
                                  color: 'hsl(270, 75%, 60%)',
                                  label: 'Purple'
                                }
                              ]
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Answer Editor */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-600" />
                        Answer
                      </h3>
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                        <CKEditor
                          editor={ClassicEditor}
                          data={prependImageBaseUrl(selectedQuestion.answer)}
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            setSelectedQuestion({
                              ...selectedQuestion,
                              answer: data,
                            });
                          }}
                          config={{
                            extraPlugins: [CustomUploadAdapterPlugin],
                            toolbar: {
                              items: [
                                'heading',
                                '|',
                                'bold',
                                'italic',
                                'underline',
                                'strikethrough',
                                '|',
                                'fontSize',
                                'fontColor',
                                'fontBackgroundColor',
                                '|',
                                'bulletedList',
                                'numberedList',
                                'outdent',
                                'indent',
                                '|',
                                'alignment',
                                '|',
                                'link',
                                'imageUpload',
                                'insertTable',
                                'blockQuote',
                                'horizontalLine',
                                '|',
                                'undo',
                                'redo'
                              ],
                              shouldNotGroupWhenFull: true
                            },
                            fontSize: {
                              options: [9, 11, 13, 'default', 17, 19, 21]
                            },
                            fontColor: {
                              colors: [
                                {
                                  color: 'hsl(0, 0%, 0%)',
                                  label: 'Black'
                                },
                                {
                                  color: 'hsl(0, 0%, 30%)',
                                  label: 'Dim grey'
                                },
                                {
                                  color: 'hsl(0, 0%, 60%)',
                                  label: 'Grey'
                                },
                                {
                                  color: 'hsl(0, 0%, 90%)',
                                  label: 'Light grey'
                                },
                                {
                                  color: 'hsl(0, 0%, 100%)',
                                  label: 'White',
                                  hasBorder: true
                                },
                                {
                                  color: 'hsl(0, 75%, 60%)',
                                  label: 'Red'
                                },
                                {
                                  color: 'hsl(30, 75%, 60%)',
                                  label: 'Orange'
                                },
                                {
                                  color: 'hsl(60, 75%, 60%)',
                                  label: 'Yellow'
                                },
                                {
                                  color: 'hsl(90, 75%, 60%)',
                                  label: 'Light green'
                                },
                                {
                                  color: 'hsl(120, 75%, 60%)',
                                  label: 'Green'
                                },
                                {
                                  color: 'hsl(150, 75%, 60%)',
                                  label: 'Aquamarine'
                                },
                                {
                                  color: 'hsl(180, 75%, 60%)',
                                  label: 'Turquoise'
                                },
                                {
                                  color: 'hsl(210, 75%, 60%)',
                                  label: 'Light blue'
                                },
                                {
                                  color: 'hsl(240, 75%, 60%)',
                                  label: 'Blue'
                                },
                                {
                                  color: 'hsl(270, 75%, 60%)',
                                  label: 'Purple'
                                }
                              ]
                            },
                            fontBackgroundColor: {
                              colors: [
                                {
                                  color: 'hsl(0, 0%, 100%)',
                                  label: 'White'
                                },
                                {
                                  color: 'hsl(0, 0%, 80%)',
                                  label: 'Light grey'
                                },
                                {
                                  color: 'hsl(0, 75%, 60%)',
                                  label: 'Red'
                                },
                                {
                                  color: 'hsl(30, 75%, 60%)',
                                  label: 'Orange'
                                },
                                {
                                  color: 'hsl(60, 75%, 60%)',
                                  label: 'Yellow'
                                },
                                {
                                  color: 'hsl(90, 75%, 60%)',
                                  label: 'Light green'
                                },
                                {
                                  color: 'hsl(120, 75%, 60%)',
                                  label: 'Green'
                                },
                                {
                                  color: 'hsl(150, 75%, 60%)',
                                  label: 'Aquamarine'
                                },
                                {
                                  color: 'hsl(180, 75%, 60%)',
                                  label: 'Turquoise'
                                },
                                {
                                  color: 'hsl(210, 75%, 60%)',
                                  label: 'Light blue'
                                },
                                {
                                  color: 'hsl(240, 75%, 60%)',
                                  label: 'Blue'
                                },
                                {
                                  color: 'hsl(270, 75%, 60%)',
                                  label: 'Purple'
                                }
                              ]
                            }
                          }}
                        />
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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
};

export default ManageQB;
