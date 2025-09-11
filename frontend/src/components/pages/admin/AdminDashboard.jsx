import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import AdminNavbar from "../../navbar/AdminNavbar";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  TrendingUp, 
  FileText, 
  Users, 
  Calendar,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { Imagecomp } from "../../images/Imagecomp";
import { Drawer } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminDashboard = () => {
  const [view, setView] = useState("Monthly");
  const [monthRange, setMonthRange] = useState("first");
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weekRangeStart, setWeekRangeStart] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalQuestions: 0,
    totalFaculty: 0,
    pendingApprovals: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [questionHistoryRes, statsRes, facultyRes] = await Promise.all([
        axios.get("http://localhost:7000/api/admin/question-history", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get("http://localhost:7000/api/admin/generated-qb-stats", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get("http://localhost:7000/api/admin/faculty-list", {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const allQuestions = questionHistoryRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentQuestions(allQuestions);

      // Process stats data
      const { monthly, weekly } = statsRes.data;

      const monthsOrder = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const monthlyMap = {};
      monthsOrder.forEach((m) => {
        monthlyMap[m] = 0;
      });

      monthly.forEach((item) => {
        const [_, month] = item.month.split("-");
        const index = parseInt(month, 10) - 1;
        const monthName = new Date(2025, index).toLocaleString("default", {
          month: "short",
        });
        monthlyMap[monthName] += item.total_generated;
      });

      const monthlyFormatted = monthsOrder.map((name) => ({
        name,
        QB: monthlyMap[name],
      }));

      const weeklyMap = {};
      for (let i = 1; i <= 52; i++) {
        const weekName = `W${String(i).padStart(2, "0")}`;
        weeklyMap[weekName] = 0;
      }

      weekly.forEach((item) => {
        const weekNum = parseInt(String(item.week).slice(4));
        const weekName = `W${String(weekNum).padStart(2, "0")}`;
        weeklyMap[weekName] += item.total_generated;
      });

      const weeklyFormatted = Object.entries(weeklyMap).map(
        ([name, QB]) => ({ name, QB })
      );

      setMonthlyData(monthlyFormatted);
      setWeeklyData(weeklyFormatted);

      // Calculate dashboard stats from the full question history
      const totalQuestions = allQuestions.length;
      const pendingApprovals = allQuestions.filter(q => q.status === 'pending').length;
      const totalFaculty = facultyRes.data.length;
      const currentMonth = new Date().toLocaleString("default", { month: "short" });
      const thisMonth = monthlyMap[currentMonth] || 0;

      setDashboardStats({
        totalQuestions,
        totalFaculty,
        pendingApprovals,
        thisMonth
      });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const filteredMonthlyData = monthRange === "first" ? monthlyData.slice(0, 6) : monthlyData.slice(6);
  const filteredWeeklyData = weeklyData.slice(weekRangeStart, weekRangeStart + 7);

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status?.toLowerCase()) {
        case 'approved':
        case 'accepted':
          return { 
            color: 'bg-green-100 text-green-800 border-green-200', 
            icon: <CheckCircle size={12} />,
            text: 'Approved'
          };
        case 'pending':
          return { 
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
            icon: <AlertCircle size={12} />,
            text: 'Pending'
          };
        case 'rejected':
          return { 
            color: 'bg-red-100 text-red-800 border-red-200', 
            icon: <XCircle size={12} />,
            text: 'Rejected'
          };
        default:
          return { 
            color: 'bg-gray-100 text-gray-800 border-gray-200', 
            icon: <AlertCircle size={12} />,
            text: status || 'Unknown'
          };
      }
    };

    const config = getStatusConfig(status);
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.text}
      </div>
    );
  };

  // Colors for pie chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen bg-white shadow-xl z-50 border-r border-gray-200">
        <AdminNavbar />
      </div>

      <Drawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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

      {/* Main Content */}
      <div className="flex-1 px-6 pt-6 pb-10 lg:ml-64 overflow-y-auto" style={{ maxHeight: "100vh" }}>
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-8">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="block lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <BarChart3 size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Admin Dashboard
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Overview of question bank management and statistics
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <button
                  onClick={fetchDashboardData}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalQuestions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Faculty</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalFaculty}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <AlertCircle size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingApprovals}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.thisMonth}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Activity size={20} className="text-blue-600" />
                  Question Bank Generation Statistics
                </h3>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      view === "Monthly"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setView("Monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      view === "Weekly"
                        ? "bg-blue-500 text-white shadow-md"
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
                    onClick={() => setMonthRange("first")}
                    disabled={monthRange === "first"}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      monthRange === "first"
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="text-center">
                    <span className="font-bold text-lg text-gray-800">
                      {monthRange === "first" ? "January - June" : "July - December"}
                    </span>
                    <p className="text-sm text-gray-600">2025</p>
                  </div>
                  <button
                    onClick={() => setMonthRange("second")}
                    disabled={monthRange === "second"}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      monthRange === "second"
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}

              {view === "Weekly" && (
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setWeekRangeStart((prev) => Math.max(prev - 7, 0))}
                    disabled={weekRangeStart === 0}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      weekRangeStart === 0 
                        ? "text-gray-300 cursor-not-allowed" 
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="text-center">
                    <span className="font-bold text-lg text-gray-800">
                      Weeks {weekRangeStart + 1} - {Math.min(weekRangeStart + 7, 52)}
                    </span>
                    <p className="text-sm text-gray-600">2025</p>
                  </div>
                  <button
                    onClick={() => setWeekRangeStart((prev) => Math.min(prev + 7, 45))}
                    disabled={weekRangeStart + 7 >= 52}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      weekRangeStart + 7 >= 52
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={view === "Monthly" ? filteredMonthlyData : filteredWeeklyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar
                      dataKey="QB"
                      fill="#3B82F6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity size={20} className="text-green-600" />
                Quick Actions
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => handleNavigate('/facultylist')}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 border border-blue-200"
              >
                <Users size={20} className="text-blue-600" />
                <span className="font-medium text-blue-800">Manage Faculty</span>
              </button>
              
              <button
                onClick={() => handleNavigate('/add-task')}
                className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 border border-green-200"
              >
                <FileText size={20} className="text-green-600" />
                <span className="font-medium text-green-800">Assign Tasks</span>
              </button>
              
              <button
                onClick={() => handleNavigate('/generateqb')}
                className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-200 border border-purple-200"
              >
                <Eye size={20} className="text-purple-600" />
                <span className="font-medium text-purple-800">Question Bank Generation</span>
              </button>
              
              <button
                onClick={() => handleNavigate('/vettingtask')}
                className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-200 border border-orange-200"
              >
                <CheckCircle size={20} className="text-orange-600" />
                <span className="font-medium text-orange-800">Vetting Tasks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Questions Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Recently Added Questions
              </h3>
              <button
                onClick={() => handleNavigate('/qbdetails')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <Eye size={16} />
                View All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Faculty ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Course Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-gray-500" colSpan={5}>
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw size={32} className="text-gray-300 animate-spin" />
                        <p className="text-lg font-medium">Loading...</p>
                      </div>
                    </td>
                  </tr>
                ) : recentQuestions.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-gray-500" colSpan={5}>
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={48} className="text-gray-300" />
                        <p className="text-lg font-medium">No recent questions</p>
                        <p className="text-sm">Questions will appear here once faculty start submitting</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentQuestions.slice(0, 5).map((q, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-1 rounded">
                            <Users size={14} className="text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{q.faculty_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 p-1 rounded">
                            <FileText size={14} className="text-purple-600" />
                          </div>
                          <span className="font-medium text-gray-900">{q.course_code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                          {q.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(q.created_at).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={q.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

export default AdminDashboard;
