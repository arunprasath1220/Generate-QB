import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import FacultyNavbar from "../../navbar/FacultyNavbar";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  BarChart3,
  Users,
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Activity,
  Award,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Imagecomp } from "../../images/Imagecomp";
import { Drawer, Paper } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../../../store/userSlice";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FacultyDashboard = () => {
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const [view, setView] = useState("Monthly");
  const [monthlyPeriod, setMonthlyPeriod] = useState("first");
  const [courseCode, setCourseCode] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskRows, setTaskRows] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalQuestions: 0,
    completedTasks: 0,
    pendingTasks: 0,
    thisMonth: 0,
  });
  const location = useLocation();

  // Fetch course code based on user.email
  useEffect(() => {
    if (user?.email) {
      axios
        .get(`http://localhost:7000/api/faculty/get-course-code`, {
          params: { email: user.email },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setCourseCode(res.data.course_code);
        })
        .catch((err) => console.error("Error fetching course code:", err));
    }
  }, [user?.email, token]);

  // Fetch faculty data (including vetting_id)
  useEffect(() => {
    const fetchFacultyData = async () => {
      const email = user?.email;
      if (!email) return;

      try {
        const response = await axios.get(
          `http://localhost:7000/api/faculty/faculty-data?email=${email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.length > 0) {
          const facultyData = response.data[0];
          dispatch(
            setUser({
              ...user,
              ...facultyData,
            })
          );
        }
      } catch (error) {
        console.error("Error fetching faculty data:", error);
        toast.error("Failed to load faculty data");
      }
    };

    fetchFacultyData();
  }, [dispatch, token, user?.email]);

  // Fetch weekly/monthly stats once course code is available
  useEffect(() => {
    if (courseCode) {
      axios
        .get("http://localhost:7000/api/faculty/faculty-question-status", {
          params: { course_code: courseCode },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data) {
            const formattedWeekly = res.data.weekly.map((item) => ({
              name: `W${item.week % 100}`,
              QB_Added: item.total_papers,
            }));

            const formattedMonthly = res.data.monthly.map((item) => ({
              name: item.month,
              QB_Added: item.total_papers,
            }));

            setWeeklyStats(formattedWeekly);
            setMonthlyStats(formattedMonthly);
          } else {
            console.error("No data returned from stats API.");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch stats:", err);
          toast.error("Failed to load statistics");
        });
    }
  }, [courseCode, token]);

  // Filter monthly data to 6 months at a time
  const filteredMonthlyData =
    monthlyPeriod === "first"
      ? monthlyStats.slice(0, 6)
      : monthlyStats.slice(6);

  // Fetch task progress
  useEffect(() => {
    const fetchTaskProgress = async () => {
      try {
        setLoading(true);
        const resFacultyId = await axios.get(
          "http://localhost:7000/api/faculty/faculty-id",
          {
            params: { email: user.email },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const facultyId = resFacultyId.data.faculty_id;

        const resProgress = await axios.get(
          `http://localhost:7000/api/faculty/faculty-task-progress/${facultyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const progressData = resProgress.data;

        const baseMarks = [1, 2, 3, 4, 5, 6];
        const extraMarks = [13, 15];
        const allMarks = [...baseMarks, ...extraMarks];

        const formattedRows = progressData.flatMap((unitData, unitIndex) =>
          allMarks.map((mark) => ({
            id: `${unitIndex}-${mark}`,
            subject: unitData.subject_name,
            unit: unitData.unit,
            mark: `${mark}`,
            faculty_id: facultyId,
            required: unitData[`m${mark}_required`] || 0,
            [`m${mark}_added`]: unitData[`m${mark}_added`] || 0,
            pending: Math.max(
              (unitData[`m${mark}_required`] || 0) - (unitData[`m${mark}_added`] || 0),
              0
            ),
            due_date: new Date(unitData.due_date).toISOString().split("T")[0],
          }))
        );

        const filteredRows = formattedRows.filter((row) => {
          if (row.required > 0) {
            const added = row[`m${row.mark}_added`] || 0;
            const progress = (added / row.required) * 100;
            return progress < 100;
          }
          return false;
        });

        setTaskRows(filteredRows);

        // Calculate dashboard stats
        const totalQuestions = formattedRows.reduce(
          (sum, row) => sum + (row[`m${row.mark}_added`] || 0),
          0
        );
        const completedTasks = formattedRows.filter((row) => {
          const added = row[`m${row.mark}_added`] || 0;
          return row.required > 0 && (added / row.required) * 100 >= 100;
        }).length;
        const pendingTasks = filteredRows.length;
        const currentMonth = new Date().toLocaleString("default", {
          month: "short",
        });
        const thisMonth =
          monthlyStats.find((m) => m.name === currentMonth)?.QB_Added || 0;

        setDashboardStats({
          totalQuestions,
          completedTasks,
          pendingTasks,
          thisMonth,
        });
      } catch (error) {
        console.error("Error fetching faculty task progress:", error);
        toast.error("Failed to load task progress");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchTaskProgress();
    }
  }, [user?.email, token, location.state?.refreshTasks, monthlyStats]);

  // Status badge component
  const StatusBadge = ({ status, progress }) => {
    if (progress >= 100) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-[#4b37cd] text-white border-[#4b37cd]">
          <CheckCircle size={12} />
          Completed
        </div>
      );
    } else if (progress > 0) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-[#4b37cd]/60 text-white border-[#4b37cd]/60">
          <AlertCircle size={12} />
          In Progress
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-[#4b37cd]/30 text-[#4b37cd] border-[#4b37cd]/30">
          <XCircle size={12} />
          Not Started
        </div>
      );
    }
  };

  const taskColumns = [
    {
      field: "subject",
      headerName: "Subject",
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1 rounded">
            <BookOpen size={14} className="text-[#4b37cd]" />
          </div>
          <span className="font-medium text-gray-900">{params.value}</span>
        </div>
      ),
    },
    {
      field: "unit",
      headerName: "Unit",
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1 rounded">
            <Target size={14} className="text-[#4b37cd]" />
          </div>
          <span className="font-medium bg-[#4b37cd]/10 px-2 py-1 rounded text-[#4b37cd] text-xs">
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "mark",
      headerName: "Mark",
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-[#4b37cd]/10 p-1 rounded">
            <Award size={14} className="text-[#4b37cd]" />
          </div>
          <span className="font-bold text-[#4b37cd]">{params.value}M</span>
        </div>
      ),
    },
    {
      field: "required",
      headerName: "Required",
      flex: 1,
      renderCell: (params) => (
        <span className="text-gray-700 font-medium">{params.value}</span>
      ),
    },
    {
      field: "added",
      headerName: "Added",
      flex: 1,
      valueGetter: (params) => {
        if (!params || !params.row || !params.row.mark) return 0;
        return params.row[`m${params.row.mark}_added`] || 0;
      },
      renderCell: (params) => {
        if (!params || !params.row || !params.row.mark) {
          return <span className="text-gray-400">0</span>;
        }
        const added = params.row[`m${params.row.mark}_added`] || 0;
        return (
          <span
            className={`font-medium ${
              added > 0 ? "text-[#4b37cd]" : "text-gray-400"
            }`}
          >
            {added}
          </span>
        );
      },
    },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      renderCell: (params) => {
        const mark = params.row.mark;
        const added = params.row[`m${mark}_added`] || 0;
        const required = params.row.required;

        if (required > 0) {
          const progress = Math.min(Math.round((added / required) * 100), 100);
          return (
            <div className="w-full flex items-center gap-2">
              <span className="text-sm font-medium min-w-[35px]">{progress}%</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    progress >= 100
                      ? "bg-[#4b37cd]"
                      : progress > 0
                      ? "bg-[#4b37cd]/70"
                      : "bg-[#4b37cd]/30"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        }
        return <span className="text-gray-400">N/A</span>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1.2,
      renderCell: (params) => {
        const mark = params.row.mark;
        const added = params.row[`m${mark}_added`] || 0;
        const required = params.row.required;
        const progress = (added / required) * 100;

        return <StatusBadge progress={progress} />;
      },
    },
    {
      field: "due_date",
      headerName: "Due Date",
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">{params.value}</span>
        </div>
      ),
    },
    {
      field: "add_question",
      headerName: "Action",
      flex: 1.2,
      renderCell: (params) => {
        const mark = params.row.mark;
        const added = params.row[`m${mark}_added`] || 0;
        const required = params.row.required;
        const isCompleted = required > 0 && added >= required;

        return (
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isCompleted
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-[#4b37cd] hover:bg-[#3d2ba7] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
            onClick={
              isCompleted ? undefined : () => handleAddQuestion(params.row)
            }
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle size={16} />
                Done
              </>
            ) : (
              <>
                <Plus size={16} />
                Add
              </>
            )}
          </button>
        );
      },
    },
  ];

  const handleAddQuestion = (rowData) => {
    if (!rowData.faculty_id) {
      toast.error("Faculty ID is missing - please refresh the page");
      return;
    }
    if (!rowData.unit || !rowData.mark) {
      toast.error("Incomplete task data - please contact support");
      return;
    }
    navigate("/addquestions", {
      state: {
        unit: rowData.unit,
        mark: rowData.mark,
        faculty_id: rowData.faculty_id,
      },
    });
  };

  const refreshData = () => {
    window.location.reload();
  };

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

      {/* Main Content */}
      <div className="flex-1 px-6 pt-6 pb-10 lg:ml-64 overflow-y-auto" style={{ maxHeight: "100vh" }}>
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-[#4b37cd] px-6 py-8">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="block lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  onClick={() => setOpenSidebar(!openSidebar)}
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <BarChart3 size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Faculty Dashboard
                    </h1>
                    <p className="text-white/80 mt-1">
                      Track your question submissions and progress
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <button
                  onClick={refreshData}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                <div className="hidden md:block">
                  <Imagecomp />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4b37cd]/10 p-3 rounded-lg">
                    <FileText size={24} className="text-[#4b37cd]" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Questions Added
                    </p>
                    <p className="text-2xl font-bold text-[#4b37cd]">
                      {dashboardStats.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4b37cd]/10 p-3 rounded-lg">
                    <CheckCircle size={24} className="text-[#4b37cd]" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Completed Tasks
                    </p>
                    <p className="text-2xl font-bold text-[#4b37cd]">
                      {dashboardStats.completedTasks}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4b37cd]/10 p-3 rounded-lg">
                    <Clock size={24} className="text-[#4b37cd]" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Pending Tasks
                    </p>
                    <p className="text-2xl font-bold text-[#4b37cd]">
                      {dashboardStats.pendingTasks}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4b37cd]/10 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-[#4b37cd]" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-[#4b37cd]">
                      {dashboardStats.thisMonth}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Progress Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-[#4b37cd]/5 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#4b37cd] flex items-center gap-2">
                <Activity size={20} className="text-[#4b37cd]" />
                Task Progress
              </h3>
              <button
                onClick={() => navigate("/addquestions")}
                className="bg-[#4b37cd] hover:bg-[#3d2ba7] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <Plus size={16} />
                Add Question
              </button>
            </div>
          </div>

          <div className="p-6">
            <Paper
              sx={{
                width: "100%",
                minWidth: 900,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <DataGrid
                rows={taskRows}
                columns={taskColumns}
                loading={loading}
                pageSizeOptions={[6, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 6 } },
                }}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                rowHeight={70}
                slots={{
                  noRowsOverlay: () => (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="bg-[#4b37cd]/10 p-4 rounded-full mb-4">
                        <CheckCircle size={32} className="text-[#4b37cd]" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        All Tasks Completed!
                      </p>
                      <p className="text-sm text-gray-500">
                        Great job! You have completed all assigned tasks.
                      </p>
                    </div>
                  ),
                }}
                sx={{
                  border: 0,
                  minWidth: 900,
                  "& .MuiDataGrid-row:nth-of-type(odd)": {
                    backgroundColor: "#fafbfc",
                  },
                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor: "#ffffff",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f3f4f6",
                    transform: "scale(1.002)",
                    transition: "all 0.2s ease-in-out",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f8fafc",
                    fontWeight: "bold",
                    fontSize: 14,
                    color: "#374151",
                    borderBottom: "2px solid #e5e7eb",
                  },
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "16px",
                    borderBottom: "1px solid #f3f4f6",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "2px solid #e5e7eb",
                    backgroundColor: "#f8fafc",
                  },
                }}
              />
            </Paper>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#4b37cd]/5 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#4b37cd] flex items-center gap-2">
                <BarChart3 size={20} className="text-[#4b37cd]" />
                Question Bank Statistics
              </h3>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    view === "Monthly"
                      ? "bg-[#4b37cd] text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setView("Monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    view === "Weekly"
                      ? "bg-[#4b37cd] text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setView("Weekly")}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {view === "Monthly" && (
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setMonthlyPeriod("first")}
                  disabled={monthlyPeriod === "first"}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    monthlyPeriod === "first"
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <span className="font-bold text-lg text-gray-800">
                    {monthlyPeriod === "first"
                      ? "January - June"
                      : "July - December"}
                  </span>
                  <p className="text-sm text-gray-600">2025</p>
                </div>
                <button
                  onClick={() => setMonthlyPeriod("second")}
                  disabled={monthlyPeriod === "second"}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    monthlyPeriod === "second"
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            <div className="w-full h-80 bg-gray-50 rounded-lg p-4">
              {((view === "Monthly" && monthlyStats.length > 0) ||
                (view === "Weekly" && weeklyStats.length > 0)) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={view === "Monthly" ? filteredMonthlyData : weeklyStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="QB_Added"
                      fill="#4b37cd"
                      radius={[8, 8, 0, 0]}
                    >
                      {(view === "Monthly" ? filteredMonthlyData : weeklyStats).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.QB_Added > 3 ? "#4b37cd" : "#6b52d6"}
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={32} className="text-gray-300 animate-spin" />
                      <p className="text-lg font-medium">Loading statistics...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <BarChart3 size={48} className="text-gray-300" />
                      <p className="text-lg font-medium text-gray-700">
                        No Data Available
                      </p>
                      <p className="text-sm text-gray-500 text-center max-w-xs">
                        Add questions to see statistics appear here
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="toast-container"
      />
    </div>
  );
};

export default FacultyDashboard;
