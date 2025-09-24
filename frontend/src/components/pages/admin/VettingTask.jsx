import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../navbar/AdminNavbar";
import axios from "axios";
import { Menu, CalendarDays, User, ListChecks, Users, UserCheck, Clock, ChevronRight, Search, Filter, Plus, Edit3, Trash2, Save, X } from "lucide-react";
import { Imagecomp } from "../../images/Imagecomp";
import { Drawer } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VettingTask = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    faculty_id: "",
    vetting_id: "",
    unit: "",
    due_date: "",
  });

  const [openSidebar, setOpenSidebar] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [assignedList, setAssignedList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Edit/Delete state
  const [editIdx, setEditIdx] = useState(null);
  const [editFacultyId, setEditFacultyId] = useState("");
  const [editVettingId, setEditVettingId] = useState("");

  // Fetch assigned vetting tasks
  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await axios.get(
          "http://localhost:7000/api/admin/vetting-list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAssignedList(res.data);
      } catch (err) {
        setAssignedList([]);
      }
    };
    fetchAssigned();
  }, [token]);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await axios.get(
          "http://localhost:7000/api/admin/faculty-list",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFacultyList(res.data);
      } catch (err) {
        toast.error("Failed to load faculty list");
      }
    };
    fetchFaculty();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:7000/api/admin/add-vetting",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message || "Task Assigned Successfully!");
      setFormData({
        faculty_id: "",
        vetting_id: "",
      });
      
      // Refresh list
      const updatedRes = await axios.get(
        "http://localhost:7000/api/admin/vetting-list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssignedList(updatedRes.data);
    } catch (err) {
      toast.error("Failed to assign task");
    }
  };

  const handleEdit = (idx, item) => {
    setEditIdx(idx);
    setEditFacultyId(item.faculty_id);
    setEditVettingId(item.vetting_id);
  };

  const handleSaveEdit = async (item) => {
    try {
      await axios.put(
        `http://localhost:7000/api/admin/vetting-list`,
        {
          old_faculty_id: item.faculty_id,
          old_vetting_id: item.vetting_id,
          faculty_id: editFacultyId,
          vetting_id: editVettingId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Assignment updated successfully");
      setEditIdx(null);
      
      // Refresh list
      const res = await axios.get(
        "http://localhost:7000/api/admin/vetting-list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssignedList(res.data);
    } catch (err) {
      toast.error("Failed to update assignment");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      await axios.delete(`http://localhost:7000/api/admin/vetting-list`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          faculty_id: item.faculty_id,
          vetting_id: item.vetting_id,
        },
      });
      toast.success("Assignment deleted successfully");
      
      // Refresh list
      const res = await axios.get(
        "http://localhost:7000/api/admin/vetting-list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssignedList(res.data);
    } catch (err) {
      toast.error("Failed to delete assignment");
    }
  };

  // Filter and search functionality
  const filteredAssignedList = assignedList.filter(item => {
    const matchesSearch = 
      item.faculty_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vetting_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vetting_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Compute available faculty for each column
  const availableQuestionFaculty = facultyList.filter(faculty =>
    !assignedList.some(item => item.faculty_id === faculty.faculty_id)
  );
  const availableVettingFaculty = facultyList.filter(faculty =>
    !assignedList.some(item => item.vetting_id === faculty.faculty_id)
  );
  const maxAvailableRows = Math.max(availableQuestionFaculty.length, availableVettingFaculty.length);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen bg-white shadow-xl z-50 border-r border-gray-200">
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
                  onClick={() => setOpenSidebar(!openSidebar)}
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <UserCheck size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Vetting Assignment
                    </h1>
                    <p className="text-purple-100 mt-1">
                      Manage faculty vetting assignments and track progress
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                  onClick={() => navigate("/qbdetails")}
                >
                  <ListChecks size={18} />
                  Vetting Status
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Faculty</p>
                    <p className="text-2xl font-bold text-gray-900">{facultyList.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <UserCheck size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Assigned Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{assignedList.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Clock size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Available Faculty</p>
                    <p className="text-2xl font-bold text-gray-900">{availableQuestionFaculty.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Plus size={20} className="text-purple-600" />
              Create New Assignment
            </h2>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User size={16} className="text-purple-600" />
                    Question Faculty
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="faculty_id"
                      value={formData.faculty_id}
                      onChange={handleChange}
                      required
                      list="faculty-suggestions"
                      placeholder="Type or select Faculty ID/Name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-500"
                    />
                    <datalist id="faculty-suggestions">
                      {facultyList.map((faculty, idx) => (
                        <option key={idx} value={faculty.faculty_id}>
                          {faculty.faculty_id} — {faculty.faculty_name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck size={16} className="text-purple-600" />
                    Vetting Faculty
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="vetting_id"
                      value={formData.vetting_id}
                      onChange={handleChange}
                      required
                      list="vetting-suggestions"
                      placeholder="Type or select Faculty ID/Name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-500"
                    />
                    <datalist id="vetting-suggestions">
                      {facultyList.map((faculty, idx) => (
                        <option key={idx} value={faculty.faculty_id}>
                          {faculty.faculty_id} — {faculty.faculty_name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus size={18} />
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Assigned Faculty Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ListChecks size={20} className="text-purple-600" />
                  Assigned Faculty ({filteredAssignedList.length})
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Question Faculty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vetting Faculty
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssignedList.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-gray-500" colSpan={3}>
                        <div className="flex flex-col items-center gap-3">
                          <Users size={48} className="text-gray-300" />
                          <p className="text-lg font-medium">No assignments found</p>
                          <p className="text-sm">Create your first assignment above</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAssignedList.map((item, idx) => {
                      const isEditing = editIdx === idx;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <select
                                value={editFacultyId}
                                onChange={(e) => setEditFacultyId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              >
                                {facultyList.map((f) => (
                                  <option key={f.faculty_id} value={f.faculty_id}>
                                    {f.faculty_id} — {f.faculty_name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <User size={16} className="text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{item.faculty_id}</p>
                                  {item.faculty_name && (
                                    <p className="text-sm text-gray-600">{item.faculty_name}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <select
                                value={editVettingId}
                                onChange={(e) => setEditVettingId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              >
                                {facultyList.map((f) => (
                                  <option key={f.faculty_id} value={f.faculty_id}>
                                    {f.faculty_id} — {f.faculty_name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <UserCheck size={16} className="text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{item.vetting_id}</p>
                                  {item.vetting_name && (
                                    <p className="text-sm text-gray-600">{item.vetting_name}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 flex items-center gap-1"
                                    onClick={() => handleSaveEdit(item)}
                                    title="Save"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors duration-200 flex items-center gap-1"
                                    onClick={() => setEditIdx(null)}
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="bg-purple-600 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors duration-200 flex items-center gap-1"
                                    onClick={() => handleEdit(idx, item)}
                                    title="Edit"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 flex items-center gap-1"
                                    onClick={() => handleDelete(item)}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Available Faculty Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Available Faculty
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Available Question Faculty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Available Vetting Faculty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facultyList.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-gray-500" colSpan={2}>
                        <div className="flex flex-col items-center gap-3">
                          <Users size={48} className="text-gray-300" />
                          <p className="text-lg font-medium">No faculty found</p>
                        </div>
                      </td>
                    </tr>
                  ) : maxAvailableRows === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-gray-500" colSpan={2}>
                        <div className="flex flex-col items-center gap-3">
                          <UserCheck size={48} className="text-gray-300" />
                          <p className="text-lg font-medium">All faculty assigned</p>
                          <p className="text-sm">Great job! All available faculty have been assigned.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    Array.from({ length: maxAvailableRows }).map((_, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          {availableQuestionFaculty[idx] ? (
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <User size={16} className="text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {availableQuestionFaculty[idx].faculty_id}
                                </p>
                                {availableQuestionFaculty[idx].faculty_name && (
                                  <p className="text-sm text-gray-600">
                                    {availableQuestionFaculty[idx].faculty_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-12"></div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {availableVettingFaculty[idx] ? (
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <UserCheck size={16} className="text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {availableVettingFaculty[idx].faculty_id}
                                </p>
                                {availableVettingFaculty[idx].faculty_name && (
                                  <p className="text-sm text-gray-600">
                                    {availableVettingFaculty[idx].faculty_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-12"></div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

export default VettingTask;