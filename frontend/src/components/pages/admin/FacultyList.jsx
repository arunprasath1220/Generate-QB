import React, { useState, useEffect } from "react";
import AdminNavbar from "../../navbar/AdminNavbar";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import { Drawer } from "@mui/material";
import axios from "axios";
import { Imagecomp } from "../../images/Imagecomp";
import { 
  Menu, 
  Users, 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  Mail, 
  BookOpen, 
  GraduationCap,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FacultyList = () => {
  const token = localStorage.getItem('token');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:7000/api/admin/faculty-list", {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      .then((response) => {
        const formatted = response.data.map((item, index) => ({
          id: index + 1,
          facultyId: item.faculty_id,
          name: item.faculty_name,
          photo: item.photo,
          code: item.course_code,
          subject: item.subject_name,
          email: item.email || `${item.faculty_id}@university.edu`,
          department: item.dept || 'General',
          designation: item.designation || 'Assistant Professor',
        }));
        setData(formatted);
        setFilteredData(formatted);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching faculty list:", error);
        toast.error("Failed to load faculty list");
        setLoading(false);
      });
  }, [token]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = data.filter(faculty => {
      const matchesSearch = 
        faculty.facultyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || faculty.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
    
    setFilteredData(filtered);
  }, [searchTerm, departmentFilter, data]);

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Get unique departments for filter
  const departments = [...new Set(data.map(faculty => faculty.department))];

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredData?.length) {
      toast.warning("No data to export");
      return;
    }

    const headers = ['Faculty ID', 'Faculty Name', 'Course Code', 'Subject Name', 'Email', 'Department', 'Designation'];
    const escapeCSV = (v) => {
      const s = (v ?? '').toString();
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const exportData = filteredData.map(f => [
      f.facultyId,
      f.name,
      f.code,
      f.subject,
      f.email,
      f.department,
      f.designation,
    ]);

    const csv = [headers, ...exportData]
      .map(row => row.map(escapeCSV).join(','))
      .join('\r\n');

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `faculty-list-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Faculty list exported successfully!");
  };

  const handleViewDetails = (faculty) => {
    toast.info(`Viewing details for ${faculty.name}`);
    // Implement view details functionality
  };

  const handleEditFaculty = (faculty) => {
    toast.info(`Editing ${faculty.name}`);
    // Implement edit functionality
  };

  const facultyColumns = [
    {
      field: "photo",
      headerName: "Photo",
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex items-center justify-center">
          <Avatar
            src={params.value || `https://ui-avatars.com/api/?name=${params.row.name}&background=3b82f6&color=fff&size=50`}
            alt={params.row.name}
            sx={{ 
              width: 50, 
              height: 50,
              border: '2px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      ),
      sortable: false,
      filterable: false,
    },
    { 
      field: "facultyId", 
      headerName: "Faculty ID", 
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-1 rounded">
            <Users size={14} className="text-blue-600" />
          </div>
          <span className="font-semibold text-gray-900">{params.value}</span>
        </div>
      )
    },
    { 
      field: "name", 
      headerName: "Faculty Details", 
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex flex-col py-2">
          <span className="font-semibold text-gray-900 text-sm">{params.value}</span>
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Mail size={10} />
            {params.row.email}
          </span>
        </div>
      )
    },
    { 
      field: "code", 
      headerName: "Course", 
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-1 rounded">
            <BookOpen size={14} className="text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium bg-purple-50 px-2 py-1 rounded text-purple-800 text-xs">
              {params.value}
            </span>
            <span className="text-xs text-gray-500 mt-1">{params.row.department}</span>
          </div>
        </div>
      )
    },
    { 
      field: "subject", 
      headerName: "Subject & Designation", 
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex flex-col py-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-green-100 p-1 rounded">
              <GraduationCap size={14} className="text-green-600" />
            </div>
            <span className="text-gray-800 font-medium text-sm">{params.value}</span>
          </div>
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {params.row.designation}
          </span>
        </div>
      )
    },
    // {
    //   field: "actions",
    //   headerName: "Actions",
    //   flex: 1,
    //   renderCell: (params) => (
    //     <div className="flex items-center gap-2">
    //       <button
    //         className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200 group"
    //         onClick={() => handleViewDetails(params.row)}
    //         title="View Details"
    //       >
    //         <Eye size={14} className="group-hover:scale-110 transition-transform" />
    //       </button>
    //       <button
    //         className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 group"
    //         onClick={() => handleEditFaculty(params.row)}
    //         title="Edit Faculty"
    //       >
    //         <Edit size={14} className="group-hover:scale-110 transition-transform" />
    //       </button>
    //       <button
    //         className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200 group"
    //         title="More Options"
    //       >
    //         <MoreHorizontal size={14} className="group-hover:scale-110 transition-transform" />
    //       </button>
    //     </div>
    //   ),
    //   sortable: false,
    //   filterable: false,
    // }
  ];

  // Get statistics
  const getStats = () => {
    const totalFaculty = data.length;
    const uniqueCourses = new Set(data.map(f => f.code)).size;
    const uniqueSubjects = new Set(data.map(f => f.subject)).size;
    const uniqueDepartments = new Set(data.map(f => f.department)).size;
    
    return { totalFaculty, uniqueCourses, uniqueSubjects, uniqueDepartments };
  };

  const stats = getStats();

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
                    <Users size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Faculty Directory
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Manage and view all faculty members and their details
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                  onClick={() => toast.info("Add faculty feature coming soon!")}
                >
                  <UserPlus size={18} />
                  Add Faculty
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
                    <Users size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Faculty</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalFaculty}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <BookOpen size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.uniqueCourses}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <GraduationCap size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Subjects</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.uniqueSubjects}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.uniqueDepartments}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Filter size={20} className="text-blue-600" />
              Search & Filter Faculty
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Search Faculty</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, course, subject, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Filter by Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty List Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Faculty Members ({filteredData.length} of {data.length})
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={!filteredData.length}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${!filteredData.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!filteredData.length ? 'No data to export' : 'Export to CSV'}
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Paper 
              sx={{ 
                width: "100%", 
                minWidth: 900,
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: 'none'
              }}
            >
              <DataGrid
                rows={filteredData}
                columns={facultyColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } }
                }}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                rowHeight={90}
                sx={{
                  border: 0,
                  minWidth: 900,
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    backgroundColor: '#ffffff',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f3f4f6',
                    transform: 'scale(1.005)',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8fafc',
                    fontWeight: 'bold',
                    fontSize: 14,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                  },
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '16px',
                    borderBottom: '1px solid #f3f4f6',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '2px solid #e5e7eb',
                    backgroundColor: '#f8fafc',
                  },
                  '& .MuiDataGrid-overlay': {
                    backgroundColor: '#ffffff',
                  },
                  '& .MuiCircularProgress-root': {
                    color: '#3b82f6',
                  },
                }}
              />
            </Paper>
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

export default FacultyList;
