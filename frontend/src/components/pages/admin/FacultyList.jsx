import React, { useState, useEffect } from "react";
import AdminNavbar from "../../navbar/AdminNavbar";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
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
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FacultyList = () => {
  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredData?.length) {
      toast.warning("No data to export");
      return;
    }

    const headers = [
      "Faculty ID",
      "Faculty Name",
      "Course Code",
      "Subject Name",
      "Email",
      "Department",
      "Designation",
    ];
    const escapeCSV = (v) => {
      const s = (v ?? "").toString();
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const exportData = filteredData.map((f) => [
      f.facultyId,
      f.name,
      f.code,
      f.subject,
      f.email,
      f.department,
      f.designation,
    ]);

    const csv = [headers, ...exportData]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `faculty-list-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Faculty list exported successfully!");
  };
  const token = localStorage.getItem("token");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapOptions, setMapOptions] = useState(null);
  const [mapForm, setMapForm] = useState({
    faculty_id: "",
    course_id: "",
    dept_id: "",
    degree_id: "",
    semester_id: "",
    role_id: "", // new
  });
  const [isRoleAdmin, setIsRoleAdmin] = useState(false);

  // NEW: State for the Edit Modal
  const [editMapOpen, setEditMapOpen] = useState(false);
  const [editableUsers, setEditableUsers] = useState([]);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState({ id: '', role: '' });
  const [userMappings, setUserMappings] = useState([]);
  const [editMapForm, setEditMapForm] = useState({
    mappingId: '',
    course_id: '',
    dept_id: '',
    degree_id: '',
    semester_id: '',
    role_id: ''
  });
  const [isEditRoleAdmin, setIsEditRoleAdmin] = useState(false);


  // ADD: faculty form state (already present but keep consistent)
  const [facultyForm, setFacultyForm] = useState({
    faculty_id: "",
    faculty_name: "",
    photo: null,
    course_code: "",
    subject_name: "",
    email: "",
    password: "", // Add password to state
    degree: "",
    semester: "",
    semester_month: "",
    dept: "",
  });

  // ADD: input handler
  const handleFacultyInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === "photo") {
      setFacultyForm((prev) => ({ ...prev, photo: files?.[0] || null }));
    } else if (name === "bulkFile") {
      setBulkFile(files?.[0] || null);
    } else if (name === "isBulk") {
      setIsBulk(checked);
      setBulkSummary(null);
    } else {
      setFacultyForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ADD: submit handler (placeholder – adjust API if needed)
  const handleAddFacultySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isBulk) {
        if (!bulkFile) {
          toast.warning("Select a file");
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        fd.append("file", bulkFile);
        const { data: summary } = await axios.post(
          "http://localhost:7000/api/admin/upload-faculty",
          fd,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBulkSummary(summary);
        toast.success("Bulk upload processed");
      } else {
        const fd = new FormData();
        Object.entries(facultyForm).forEach(([k, v]) => {
          if (k === "photo") {
            if (v) fd.append("photo", v);
          } else fd.append(k, v);
        });
        await axios.post("http://localhost:7000/api/admin/add-faculty", fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Faculty added");
        setAddFacultyOpen(false);
        // refresh
        const response = await axios.get(
          "http://localhost:7000/api/admin/faculty-list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const formatted = response.data.map((item, index) => ({
          id: index + 1,
          facultyId: item.faculty_id,
          name: item.faculty_name,
          photo: item.photo,
          code: item.course_code,
          subject: item.subject_name,
          email: item.email || `${item.faculty_id}@university.edu`,
          department: item.dept || "General",
          designation: item.designation || "Assistant Professor",
        }));
        setData(formatted);
        setFilteredData(formatted);
        setFacultyForm({
          faculty_id: "",
          faculty_name: "",
          photo: null,
          course_code: "",
          subject_name: "",
          email: "",
          password: "",
          degree: "",
          semester: "",
          semester_month: "",
          dept: "",
        });
      }
    } catch (err) {
      console.error("Add/Bulk failed:", err);
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // OPTIONAL: close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setAddFacultyOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:7000/api/admin/faculty-list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
          department: item.dept || "General",
          designation: item.designation || "Assistant Professor",
        }));
        setData(formatted);
        setFilteredData(formatted);
        setTimeout(() => {
          setLoading(false);
        }, 300);
      })
      .catch((error) => {
        console.error("Error fetching faculty list:", error);
        toast.error("Failed to load faculty list");
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      });
  }, [token]);

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
      renderCell: (params) => {
        // Construct the full URL to the image on the backend
        const imageUrl = params.value ? `http://localhost:7000${params.value}` : null;
        return (
          <div className="flex items-center justify-center">
            <Avatar
              src={
                imageUrl ||
                `https://ui-avatars.com/api/?name=${params.row.name}&background=9333ea&color=fff&size=50`
              }
              alt={params.row.name}
              sx={{
                width: 50,
                height: 50,
                border: "2px solid #e5e7eb",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        );
      },
      sortable: false,
      filterable: false,
    },
    {
      field: "facultyId",
      headerName: "Faculty ID",
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-1 rounded">
            <Users size={14} className="text-purple-600" />
          </div>
          <span className="font-semibold text-gray-900">{params.value}</span>
        </div>
      ),
    },
    {
      field: "name",
      headerName: "Faculty Details",
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex flex-col py-2">
          <span className="font-semibold text-gray-900 text-sm">
            {params.value}
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Mail size={10} />
            {params.row.email}
          </span>
        </div>
      ),
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
            <span className="text-xs text-gray-500 mt-1">
              {params.row.department}
            </span>
          </div>
        </div>
      ),
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
            <span className="text-gray-800 font-medium text-sm">
              {params.value}
            </span>
          </div>
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {params.row.designation}
          </span>
        </div>
      ),
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
    const uniqueCourses = new Set(data.map((f) => f.code)).size;
    const uniqueSubjects = new Set(data.map((f) => f.subject)).size;
    const uniqueDepartments = new Set(data.map((f) => f.department)).size;

    return { totalFaculty, uniqueCourses, uniqueSubjects, uniqueDepartments };
  };

  const stats = getStats();
  const departments = [...new Set(data.map((faculty) => faculty.department))];

  // Map handling
  const handleMapInput = (e) => {
    const { name, value } = e.target;
    setMapForm((p) => ({ ...p, [name]: value }));

    if (name === "role_id") {
      const roleId = value;
      setIsRoleAdmin(
        roleId === ""
          ? false
          : String(roleId) ===
            String(mapOptions?.roles?.find((r) => r.role === "admin")?.id)
      );
      // if admin selected, clear mapping fields
      if (
        roleId &&
        String(roleId) ===
          String(mapOptions?.roles?.find((r) => r.role === "admin")?.id)
      ) {
        setMapForm((prev) => ({
          ...prev,
          course_id: "",
          dept_id: "",
          degree_id: "",
          semester_id: "",
        }));
      }
    }
  };

  const submitMapping = async (e) => {
    e.preventDefault();
    try {
      if (!mapForm.faculty_id || !mapForm.role_id) {
        toast.error("Select faculty and role");
        return;
      }
      await axios.post("http://localhost:7000/api/admin/map-faculty", mapForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Role/mapping saved");
      setMapOpen(false);
      // refresh faculty list
      const response = await axios.get("http://localhost:7000/api/admin/faculty-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = response.data.map((item, index) => ({
        id: index + 1,
        facultyId: item.faculty_id,
        name: item.faculty_name,
        photo: item.photo,
        code: item.course_code,
        subject: item.subject_name,
        email: item.email || `${item.faculty_id}@university.edu`,
        department: item.dept || "General",
        designation: item.designation || "Assistant Professor",
      }));
      setData(formatted);
      setFilteredData(formatted);
      // reset form
      setMapForm({
        faculty_id: "",
        course_id: "",
        dept_id: "",
        degree_id: "",
        semester_id: "",
        role_id: "",
      });
    } catch (err) {
      console.error("Mapping failed:", err);
      toast.error(err?.response?.data?.message || "Mapping failed");
    }
  };

  // NEW: Handlers for the Edit Modal
  const openEditModal = async () => {
    try {
      setEditMapOpen(true);
      // Fetch users with existing mappings
      const usersRes = await axios.get("http://localhost:7000/api/admin/users-with-mappings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditableUsers(usersRes.data);
      // Also ensure we have the general options (courses, depts, etc.)
      if (!mapOptions) {
        const optionsRes = await axios.get("http://localhost:7000/api/admin/map-options", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMapOptions(optionsRes.data);
      }
    } catch (err) {
      toast.error("Failed to load data for editing.");
      console.error(err);
    }
  };

  const handleUserToEditSelect = async (userId) => {
    if (!userId) {
      setSelectedUserForEdit({ id: '', role: '' });
      setUserMappings([]);
      setEditMapForm({ mappingId: '', course_id: '', dept_id: '', degree_id: '', semester_id: '', role_id: '' });
      return;
    }
    const user = editableUsers.find(u => u.id === parseInt(userId));
    setSelectedUserForEdit({ id: user.id, role: user.role });
    try {
      const mappingsRes = await axios.get(`http://localhost:7000/api/admin/faculty-mappings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserMappings(mappingsRes.data);
      // Reset form when user changes
      setEditMapForm({ mappingId: '', course_id: '', dept_id: '', degree_id: '', semester_id: '', role_id: user.role });
    } catch (err) {
      toast.error("Failed to fetch user's mappings.");
      console.error(err);
    }
  };

  const handleMappingToEditSelect = (mappingId) => {
    if (!mappingId) {
      setEditMapForm(prev => ({ ...prev, mappingId: '', course_id: '', dept_id: '', degree_id: '', semester_id: '' }));
      return;
    }
    const mapping = userMappings.find(m => m.id === parseInt(mappingId));
    setEditMapForm(prev => ({
      ...prev,
      mappingId: mapping.id,
      course_id: mapping.course,
      dept_id: mapping.dept,
      degree_id: mapping.degree,
      semester_id: mapping.semester,
    }));
  };

  const handleEditMapInputChange = (e) => {
    const { name, value } = e.target;
    setEditMapForm(prev => ({ ...prev, [name]: value }));
    if (name === 'role_id') {
      const adminRole = mapOptions?.roles?.find(r => r.role === 'admin');
      setIsEditRoleAdmin(adminRole && parseInt(value) === adminRole.id);
    }
  };

  const handleEditMapSubmit = async (e) => {
    e.preventDefault();
    if (!editMapForm.mappingId) {
      toast.error("Please select a mapping to edit.");
      return;
    }
    try {
      const payload = {
        user_id: selectedUserForEdit.id,
        role_id: editMapForm.role_id,
        course_id: editMapForm.course_id,
        dept_id: editMapForm.dept_id,
        degree_id: editMapForm.degree_id,
        semester_id: editMapForm.semester_id,
      };
      await axios.put(`http://localhost:7000/api/admin/map-faculty/${editMapForm.mappingId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mapping updated successfully!");
      setEditMapOpen(false);
      // Optionally refresh data
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update mapping.");
      console.error(err);
    }
  };


  return (
    <div className="flex min-h-screen bg-white">
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
      <div
        className="flex-1 px-6 pt-6 pb-10 lg:ml-64 overflow-y-auto"
        style={{ maxHeight: "100vh" }}
      >
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-purple-600 px-6 py-8">
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
                    <p className="text-purple-100 mt-1">
                      Manage and view all faculty members and their details
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                  onClick={() => setAddFacultyOpen(true)}
                >
                  <UserPlus size={18} />
                  Add User
                </button>

                {/* NEW: Map Button */}
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                  onClick={async () => {
                    try {
                      setMapOpen(true);
                      // fetch options when opening
                      const { data } = await axios.get("http://localhost:7000/api/admin/map-options", {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setMapOptions(data);
                    } catch (err) {
                      console.error("Failed to load mapping options:", err);
                      toast.error("Failed to load map options");
                    }
                  }}
                >
                  <BookOpen size={18} />
                  Map
                </button>

                {/* NEW: Edit Button */}
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                  onClick={openEditModal}
                >
                  <Edit size={18} />
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Faculty
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalFaculty}
                    </p>
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
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.uniqueCourses}
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <GraduationCap size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Degrees</p>
                    <p className="text-2xl font-bold text-gray-900">{new Set(data.map(f => f.degree)).size}</p>
                  </div>
                </div>
              </div> */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Departments
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.uniqueDepartments}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty List Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Faculty Members ({filteredData.length} of {data.length})
              </h3>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search by name, ID, course, subject, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={!filteredData.length}
                  className={`bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                    !filteredData.length ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={
                    !filteredData.length ? "No data to export" : "Export to CSV"
                  }
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
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <DataGrid
                rows={filteredData}
                columns={facultyColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } },
                }}
                checkboxSelection
                disableRowSelectionOnClick={false}
                hideFooterSelectedRowCount={false}
                rowHeight={90}
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
                    transform: "scale(1.005)",
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
                  "& .MuiDataGrid-overlay": {
                    backgroundColor: "#ffffff",
                  },
                  "& .MuiCircularProgress-root": {
                    color: "#9333EA",
                  },
                  // Customize selection colors to purple theme
                  "& .MuiCheckbox-root": {
                    color: "#9333EA",
                    "&.Mui-checked": {
                      color: "#9333EA",
                    },
                  },
                  "& .MuiDataGrid-row.Mui-selected": {
                    backgroundColor: "#f3f0ff",
                    "&:hover": {
                      backgroundColor: "#e9d5ff",
                    },
                  },
                  "& .MuiDataGrid-footerContainer .MuiTablePagination-displayedRows":
                    {
                      color: "#374151",
                    },
                  "& .MuiChip-root": {
                    backgroundColor: "#9333EA",
                    color: "#ffffff",
                    "& .MuiChip-deleteIcon": {
                      color: "#ffffff",
                    },
                  },
                  // Additional styling for selection badge/button
                  "& .MuiDataGrid-selectedRowCount": {
                    backgroundColor: "#9333EA",
                    color: "#ffffff",
                    borderRadius: "16px",
                    padding: "4px 12px",
                    fontSize: "14px",
                    fontWeight: 600,
                  },
                  "& .MuiDataGrid-footerContainer .MuiTablePagination-selectLabel":
                    {
                      color: "#374151",
                    },
                  "& .MuiDataGrid-footerContainer .MuiTablePagination-input": {
                    color: "#374151",
                  },
                  "& .MuiDataGrid-footerContainer .MuiSelect-root": {
                    color: "#9333EA",
                  },
                  // Style the selection count specifically
                  '& .MuiDataGrid-selectedRowCount, & [data-testid="selected-row-count"]':
                    {
                      backgroundColor: "#9333EA !important",
                      color: "#ffffff !important",
                      borderRadius: "16px !important",
                      padding: "4px 12px !important",
                      fontSize: "14px !important",
                      fontWeight: 600,
                    },
                }}
              />
            </Paper>
          </div>
        </div>

        {/* Add Faculty Modal */}
        {addFacultyOpen && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setAddFacultyOpen(false)}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-6 text-purple-700">
                Add User
              </h2>
              <form onSubmit={handleAddFacultySubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="isBulk"
                    name="isBulk"
                    checked={isBulk}
                    onChange={handleFacultyInputChange}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="isBulk"
                    className="text-sm font-medium text-gray-700"
                  >
                    Bulk Upload (XLSX / CSV)
                  </label>
                </div>

                {isBulk ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-1">
                        Upload File
                      </label>
                      <input
                        type="file"
                        name="bulkFile"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFacultyInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Required headers: email, password, faculty_id,
                        faculty_name
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          // Generate sample file download
                          const sample = `email,password,faculty_id,faculty_name
john.doe@example.com,Pass@123,FA101,John Doe
jane.smith@example.com,Pass@123,FA102,Jane Smith`;
                          const blob = new Blob(["\uFEFF" + sample], {
                            type: "text/csv;charset=utf-8;",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "faculty_bulk_sample.csv";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="mt-3 text-sm text-purple-600 hover:underline"
                      >
                        Download sample CSV
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
                    >
                      {submitting ? "Uploading..." : "Upload"}
                    </button>

                    {bulkSummary && (
                      <div className="mt-4 border rounded-lg p-4 bg-gray-50 text-sm">
                        <p className="font-semibold mb-2">Summary</p>
                        <ul className="space-y-1">
                          <li>Total rows: {bulkSummary.total}</li>
                          <li>Processed: {bulkSummary.processed}</li>
                          <li>Created: {bulkSummary.created}</li>
                          <li>
                            Duplicate faculty_id:{" "}
                            {bulkSummary.skipped_duplicate_faculty_id}
                          </li>
                          <li>
                            Duplicate email:{" "}
                            {bulkSummary.skipped_duplicate_email}
                          </li>
                          <li>Errors: {bulkSummary.errors}</li>
                        </ul>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-purple-600">
                            Row details
                          </summary>
                          <pre className="text-xs mt-2 max-h-48 overflow-auto bg-white p-2 rounded">
                            {JSON.stringify(bulkSummary.rows, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ) : (
                  // ...existing single add form fields (unchanged)...
                  <>
                    <div>
                      <label className="block font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={facultyForm.email}
                        onChange={handleFacultyInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={facultyForm.password}
                        onChange={handleFacultyInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-2"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Faculty ID
                      </label>
                      <input
                        type="text"
                        name="faculty_id"
                        value={facultyForm.faculty_id}
                        onChange={handleFacultyInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Faculty Name
                      </label>
                      <input
                        type="text"
                        name="faculty_name"
                        value={facultyForm.faculty_name}
                        onChange={handleFacultyInputChange}
                        required
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Photo{" "}
                        <span className="text-xs text-gray-400">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleFacultyInputChange}
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg mt-4 hover:bg-purple-700 transition-all disabled:opacity-60"
                    >
                      {submitting ? "Adding..." : "Add Faculty"}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Map Faculty Modal - NEW */}
        {mapOpen && mapOptions && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Map Faculty to Course</h3>
                <button onClick={() => setMapOpen(false)} className="text-gray-500">&times;</button>
              </div>

              <form onSubmit={submitMapping} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Faculty</label>
                  <select required name="faculty_id" value={mapForm.faculty_id} onChange={handleMapInput} className="w-full px-3 py-2 border rounded">
                    <option value="">Select faculty</option>
                    {mapOptions.faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} — {f.faculty_id} {f.role ? `(role:${mapOptions.roles.find(r=>r.id===f.role)?.role||f.role})` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select required name="role_id" value={mapForm.role_id} onChange={handleMapInput} className="w-full px-3 py-2 border rounded">
                    <option value="">Select role</option>
                    {mapOptions.roles.map(r => (
                      <option key={r.id} value={r.id}>{r.role}</option>
                    ))}
                  </select>
                </div>

                { !isRoleAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Course</label>
                      <select required name="course_id" value={mapForm.course_id} onChange={handleMapInput} className="w-full px-3 py-2 border rounded">
                        <option value="">Select course</option>
                        {mapOptions.courses.map(c => (
                          <option key={c.id} value={c.id}>{c.course_code} — {c.subject}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <select required name="dept_id" value={mapForm.dept_id} onChange={handleMapInput} className="w-full px-3 py-2 border rounded">
                          <option value="">Select department</option>
                          {mapOptions.departments.map(d => (
                            <option key={d.id} value={d.id}>{d.department}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Degree</label>
                        <select required name="degree_id" value={mapForm.degree_id} onChange={handleMapInput} className="w-full px-3 py-2 border rounded">
                          <option value="">Select degree</option>
                          {mapOptions.degrees.map(d => (
                            <option key={d.id} value={d.id}>{d.degree}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Semester</label>
                      <select required name="semester_id" value={mapForm.semester_id} onChange={handleMapInput} className="w-full px-3 py-2 border rounded">
                        <option value="">Select semester</option>
                        {mapOptions.semesters.map(s => (
                          <option key={s.id} value={s.id}>{s.semester} — {s.month}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-4">
                  <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded">Save Mapping</button>
                  <button type="button" onClick={() => setMapOpen(false)} className="flex-1 border rounded py-2">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NEW: Edit Mapping Modal */}
        {editMapOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit User Role & Mapping</h3>
                <button onClick={() => setEditMapOpen(false)} className="text-gray-500">&times;</button>
              </div>

              <form onSubmit={handleEditMapSubmit} className="space-y-3">
                {/* Step 1: Select User */}
                <div>
                  <label className="block text-sm font-medium mb-1">User to Edit</label>
                  <select required value={selectedUserForEdit.id} onChange={(e) => handleUserToEditSelect(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="">-- Select a User --</option>
                    {editableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.faculty_id})</option>
                    ))}
                  </select>
                </div>

                {selectedUserForEdit.id && (
                  <>
                    {/* Step 2: Select Mapping */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Mapping to Edit</label>
                      <select required value={editMapForm.mappingId} onChange={(e) => handleMappingToEditSelect(e.target.value)} className="w-full px-3 py-2 border rounded">
                        <option value="">-- Select a Mapping --</option>
                        {userMappings.map(m => (
                          <option key={m.id} value={m.id}>{m.course_code} - {m.department}</option>
                        ))}
                      </select>
                    </div>

                    {/* Step 3: Edit Form */}
                    {editMapForm.mappingId && mapOptions && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Role</label>
                          <select required name="role_id" value={editMapForm.role_id} onChange={handleEditMapInputChange} className="w-full px-3 py-2 border rounded">
                            <option value="">-- Select Role --</option>
                            {mapOptions.roles.map(r => (
                              <option key={r.id} value={r.id}>{r.role}</option>
                            ))}
                          </select>
                        </div>

                        {!isEditRoleAdmin && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-1">Course</label>
                              <select required name="course_id" value={editMapForm.course_id} onChange={handleEditMapInputChange} className="w-full px-3 py-2 border rounded">
                                {mapOptions.courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.subject}</option>)}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">Department</label>
                                <select required name="dept_id" value={editMapForm.dept_id} onChange={handleEditMapInputChange} className="w-full px-3 py-2 border rounded">
                                  {mapOptions.departments.map(d => <option key={d.id} value={d.id}>{d.department}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Degree</label>
                                <select required name="degree_id" value={editMapForm.degree_id} onChange={handleEditMapInputChange} className="w-full px-3 py-2 border rounded">
                                  {mapOptions.degrees.map(d => <option key={d.id} value={d.id}>{d.degree}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Semester</label>
                              <select required name="semester_id" value={editMapForm.semester_id} onChange={handleEditMapInputChange} className="w-full px-3 py-2 border rounded">
                                {mapOptions.semesters.map(s => <option key={s.id} value={s.id}>{s.semester} - {s.month}</option>)}
                              </select>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="flex gap-2 mt-4">
                  <button type="submit" disabled={!editMapForm.mappingId} className="flex-1 bg-purple-600 text-white py-2 rounded disabled:opacity-50">Update Mapping</button>
                  <button type="button" onClick={() => setEditMapOpen(false)} className="flex-1 border rounded py-2">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default FacultyList;
