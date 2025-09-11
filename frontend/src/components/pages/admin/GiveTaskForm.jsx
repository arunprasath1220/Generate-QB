import React, { useState, useEffect } from "react";
import AdminNavbar from "../../navbar/AdminNavbar";
import axios from "axios";
import { 
  Menu, 
  CalendarDays, 
  ListChecks, 
  Clipboard, 
  Users, 
  Check, 
  CheckSquare, 
  Trash2, 
  PlusCircle,
  FileText,
  Target,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  UserCheck,
  Building2,
  ChevronRight
} from "lucide-react";
import { Imagecomp } from "../../images/Imagecomp";
import { 
  Drawer, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  styled,
  useTheme,
  Chip
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
// Date picker imports
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Custom styled MUI components with enhanced styling
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.75rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#3b82f6',
    fontWeight: 600,
  },
  '& .MuiSelect-select': {
    padding: '1rem',
    fontWeight: 500,
  }
}));

// Enhanced UnitFormControl
const UnitFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  marginBottom: '0.75rem',
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.75rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(219, 234, 254, 0.5)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#1d4ed8',
    fontWeight: 600,
  },
  '& .MuiSelect-select': {
    padding: '1rem',
    fontWeight: 600,
    color: '#1e40af',
  }
}));

const GiveTaskForm = () => {
  const token = localStorage.getItem('token');
  
  // State for the overall form
  const [program, setProgram] = useState("UG");
  const [dueDate, setDueDate] = useState(null);
  
  // State for unit-specific mark allotments, starting with one dynamic unit
  const [unitAllotments, setUnitAllotments] = useState([
    { unit: "", m1: "", m2: "", m3: "", m4: "", m5: "", m6: "", m13: "", m15: "" },
  ]);

  // State for multi-selection of faculty
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openSidebar, setOpenSidebar] = useState(false);

  // Fetch UG departments on mount
  useEffect(() => {
    axios
      .get("http://localhost:7000/api/admin/departments?degree=UG")
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]));
  }, []);

  // Fetch faculty when selected departments or program changes
  useEffect(() => {
    if (selectedDepts.length > 0 && program) {
      axios
        .get(`http://localhost:7000/api/admin/faculty-list-by-dept?dept=${selectedDepts.join(',')}&degree=${program}`)
        .then(res => setFacultyList(res.data))
        .catch(() => setFacultyList([]));
    } else {
      setFacultyList([]);
    }
    // Reset selected faculty whenever the department selection changes
    setSelectedFacultyIds([]);
  }, [selectedDepts, program]);

  const handleDegreeChange = async (e) => {
    const value = e.target.value;
    setProgram(value);
    // Reset selections
    setSelectedDepts([]);
    setSelectedFacultyIds([]);
    setFacultyList([]);
    setDepartments([]);
    // Reset units to a single default entry
    setUnitAllotments([
      { unit: "", m1: "", m2: "", m3: "", m4: "", m5: "", m6: "", m13: "", m15: "" },
    ]);
    if (value) {
      try {
        const res = await axios.get(`http://localhost:7000/api/admin/departments?degree=${value}`);
        setDepartments(res.data);
      } catch {
        setDepartments([]);
      }
    }
  };

  // Handle changes in the mark input fields for each unit
  const handleAllotmentChange = (index, field, value) => {
    const newAllotments = [...unitAllotments];
    newAllotments[index][field] = value;
    setUnitAllotments(newAllotments);
  };

  // Add a new empty unit allotment
  const addUnit = () => {
    setUnitAllotments([
      ...unitAllotments,
      { unit: "", m1: "", m2: "", m3: "", m4: "", m5: "", m6: "", m13: "", m15: "" },
    ]);
  };

  // Remove a unit allotment by its index
  const removeUnit = (index) => {
    const newAllotments = unitAllotments.filter((_, i) => i !== index);
    setUnitAllotments(newAllotments);
  };

  // Handler to toggle department selection
  const handleDeptToggle = (deptName) => {
    setSelectedDepts(prev =>
      prev.includes(deptName)
        ? prev.filter(d => d !== deptName)
        : [...prev, deptName]
    );
  };

  // Handler to toggle all departments
  const handleSelectAllDepts = (e) => {
    if (e.target.checked) {
      setSelectedDepts(departments);
    } else {
      setSelectedDepts([]);
    }
  };

  // Handler to toggle faculty selection
  const handleFacultyToggle = (facultyId) => {
    setSelectedFacultyIds(prev =>
      prev.includes(facultyId)
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  // Handler to toggle all faculty in the current list
  const handleSelectAllFaculty = (e) => {
    if (e.target.checked) {
      setSelectedFacultyIds(facultyList.map(f => String(f.faculty_id)));
    } else {
      setSelectedFacultyIds([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFacultyIds.length === 0) {
      toast.error("Please select at least one faculty member.");
      return;
    }
    if (!dueDate) {
      toast.error("Please select a due date.");
      return;
    }

    // --- New Validation ---
    const assignedUnits = new Set();
    for (const allotment of unitAllotments) {
      if (allotment.unit) {
        if (assignedUnits.has(allotment.unit)) {
          toast.error(`Duplicate unit found: ${allotment.unit}. Please select unique units.`);
          return;
        }
        assignedUnits.add(allotment.unit);
      }
    }

    // Filter out units that have no marks or unit name assigned
    const tasks = unitAllotments.map(allotment => {
      if (!allotment.unit) return null; // Ignore if no unit is selected

      const marks = program === 'UG' 
        ? { m1: allotment.m1, m2: allotment.m2, m3: allotment.m3, m4: allotment.m4, m5: allotment.m5, m6: allotment.m6 }
        : { m2: allotment.m2, m13: allotment.m13, m15: allotment.m15 };
      
      const hasMarks = Object.values(marks).some(val => val && parseInt(val, 10) > 0);
      
      if (hasMarks) {
        return {
          unit: allotment.unit,
          ...marks
        };
      }
      return null;
    }).filter(Boolean);

    if (tasks.length === 0) {
      toast.error("Please select a unit and assign marks for at least one entry.");
      return;
    }

    // Format the dayjs date to YYYY-MM-DD for the API
    const formattedDueDate = dueDate ? dueDate.format('YYYY-MM-DD') : '';

    const submitData = {
      program,
      due_date: formattedDueDate,
      faculty_ids: selectedFacultyIds,
      tasks: tasks, // Send the array of tasks
    };

    try {
      const res = await axios.post("http://localhost:7000/api/admin/give-task", submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Tasks Assigned Successfully!");
      // Reset form
      setDueDate(null);
      setSelectedDepts([]);
      setSelectedFacultyIds([]);
      // Reset units to a single default entry
      setUnitAllotments([
        { unit: "", m1: "", m2: "", m3: "", m4: "", m5: "", m6: "", m13: "", m15: "" },
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign tasks");
    }
  };

  const ugMarks = ["m1", "m2", "m3", "m4", "m5", "m6"];
  const pgMarks = ["m2", "m13", "m15"];
  const marksToShow = program === 'UG' ? ugMarks : pgMarks;

  // Get statistics
  const getStats = () => {
    const totalUnits = unitAllotments.filter(u => u.unit).length;
    const totalMarks = unitAllotments.reduce((sum, unit) => {
      return sum + marksToShow.reduce((unitSum, mark) => {
        return unitSum + (parseInt(unit[mark]) || 0);
      }, 0);
    }, 0);
    
    return { 
      totalUnits,
      totalMarks,
      selectedDepartments: selectedDepts.length,
      selectedFaculty: selectedFacultyIds.length
    };
  };

  const stats = getStats();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
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
            height: "100vh" 
          } 
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
                  onClick={() => setOpenSidebar(!openSidebar)}
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Target size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Task Assignment
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Create and distribute question paper tasks to faculty members
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="bg-white/20 px-4 py-2 rounded-xl">
                  <span className="text-white text-sm font-medium">
                    {program} Program
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BookOpen size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Units Configured</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Award size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Marks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMarks}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Building2 size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.selectedDepartments}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <UserCheck size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Faculty Selected</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.selectedFaculty}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Form (Task Details) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clipboard size={20} className="text-blue-600" />
                Task Configuration
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    Degree Program
                  </label>
                  <StyledFormControl>
                    <InputLabel id="degree-select-label">Select Degree</InputLabel>
                    <Select
                      labelId="degree-select-label"
                      id="degree-select"
                      value={program}
                      label="Select Degree"
                      onChange={handleDegreeChange}
                      required
                    >
                      <MenuItem value="UG">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-1 rounded">
                            <BookOpen size={14} className="text-blue-600" />
                          </div>
                          Undergraduate (UG)
                        </div>
                      </MenuItem>
                      <MenuItem value="PG">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-100 p-1 rounded">
                            <Award size={14} className="text-green-600" />
                          </div>
                          Postgraduate (PG)
                        </div>
                      </MenuItem>
                    </Select>
                  </StyledFormControl>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock size={16} className="text-orange-600" />
                    Due Date
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Select Due Date"
                      value={dueDate}
                      onChange={(newValue) => setDueDate(newValue)}
                      minDate={dayjs()}
                      sx={{
                        width: '100%', 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '0.75rem',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          border: '2px solid #e5e7eb',
                          '&:hover': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                          },
                          '&.Mui-focused': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                          fontWeight: 600,
                        }
                      }}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          variant: 'outlined'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>

              {/* Unit Allotments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-600" />
                    Unit-wise Mark Distribution
                  </h4>
                  <Chip 
                    label={`${marksToShow.length} Mark Types`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {unitAllotments.map((allotment, index) => (
                    <div key={index} className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 relative group transition-all duration-300 hover:shadow-md">
                      {unitAllotments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUnit(index)}
                          className="absolute -top-2 -right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 transform hover:scale-110 shadow-lg"
                          aria-label="Remove Unit"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      <div className="mb-4">
                        <UnitFormControl variant="outlined">
                          <InputLabel id={`unit-select-label-${index}`}>Select Unit</InputLabel>
                          <Select
                            labelId={`unit-select-label-${index}`}
                            id={`unit-select-${index}`}
                            value={allotment.unit}
                            label="Select Unit"
                            onChange={(e) => handleAllotmentChange(index, 'unit', e.target.value)}
                          >
                            {["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"].map(u => (
                              <MenuItem key={u} value={u}>
                                <div className="flex items-center gap-2">
                                  <div className="bg-indigo-100 p-1 rounded">
                                    <BookOpen size={14} className="text-indigo-600" />
                                  </div>
                                  {u}
                                </div>
                              </MenuItem>
                            ))}
                          </Select>
                        </UnitFormControl>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {marksToShow.map(mark => (
                          <div key={mark} className="space-y-1">
                            <label className="text-sm text-gray-700 font-semibold flex items-center gap-1">
                              <Award size={12} className="text-yellow-600" />
                              {`${mark.slice(1)}-Mark`}
                            </label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={allotment[mark]}
                              onChange={(e) => handleAllotmentChange(index, mark, e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-white hover:border-blue-300" 
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {unitAllotments.length < 5 && (
                  <button
                    type="button"
                    onClick={addUnit}
                    className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-500 transition-all duration-300 transform hover:scale-105"
                  >
                    <PlusCircle size={24} />
                    Add Another Unit
                  </button>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center gap-3"
                >
                  <Target size={20} />
                  Assign Tasks to Faculty
                  <ChevronRight size={20} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Form (Faculty Selection) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                Faculty Selection
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Department Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 size={16} className="text-purple-600" />
                  Departments
                </label>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAllDepts"
                      checked={departments.length > 0 && selectedDepts.length === departments.length}
                      onChange={handleSelectAllDepts}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="selectAllDepts" className="text-sm font-semibold text-purple-800 cursor-pointer flex items-center gap-1">
                      <CheckSquare size={16} className="text-purple-600" />
                      Select All Departments
                    </label>
                  </div>
                  <Chip 
                    label={`${selectedDepts.length} selected`} 
                    size="small" 
                    color="secondary" 
                    variant="filled"
                  />
                </div>

                <div className="max-h-[11.2rem] overflow-y-auto p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                  {departments.length === 0 ? (
                    <div className="text-center py-4">
                      <Building2 size={32} className="text-gray-300 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">No departments available</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {departments.map(d => (
                        <label 
                          key={d} 
                          className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-all duration-200 ${
                            selectedDepts.includes(d) 
                              ? 'bg-purple-100 border border-purple-300' 
                              : 'hover:bg-purple-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDepts.includes(d)}
                            onChange={() => handleDeptToggle(d)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-800">{d}</span>
                          {selectedDepts.includes(d) && (
                            <Check size={16} className="ml-auto text-purple-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Faculty Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCheck size={16} className="text-blue-600" />
                  Faculty Members
                </label>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAllFaculty"
                      checked={facultyList.length > 0 && selectedFacultyIds.length === facultyList.length}
                      onChange={handleSelectAllFaculty}
                      disabled={facultyList.length === 0}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-200"
                    />
                    <label htmlFor="selectAllFaculty" className="text-sm font-semibold text-blue-800 cursor-pointer flex items-center gap-1">
                      <CheckSquare size={16} className="text-blue-600" />
                      Select All Faculty
                    </label>
                  </div>
                  <Chip 
                    label={`${selectedFacultyIds.length} selected`} 
                    size="small" 
                    color="primary" 
                    variant="filled"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                  {selectedDepts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Building2 size={48} className="text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-600">Please select departments first</p>
                      <p className="text-xs text-gray-500 mt-1">Choose from the departments above to see faculty</p>
                    </div>
                  ) : selectedDepts.length > 0 && facultyList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users size={48} className="text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-600">No faculty found</p>
                      <p className="text-xs text-gray-500 mt-1">No faculty available in selected departments</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {facultyList.map(fac => (
                        <label 
                          key={fac.faculty_id} 
                          className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-all duration-200 ${
                            selectedFacultyIds.includes(String(fac.faculty_id)) 
                              ? 'bg-blue-100 border-2 border-blue-300 shadow-sm' 
                              : 'hover:bg-blue-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFacultyIds.includes(String(fac.faculty_id))}
                            onChange={() => handleFacultyToggle(String(fac.faculty_id))}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-100 p-1 rounded">
                                <Users size={12} className="text-blue-600" />
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{fac.faculty_name}</span>
                            </div>
                            <span className="text-xs text-gray-600 ml-5">{fac.dept} • ID: {fac.faculty_id}</span>
                          </div>
                          {selectedFacultyIds.includes(String(fac.faculty_id)) && (
                            <Check size={18} className="text-green-600 bg-green-100 rounded-full p-1" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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

export default GiveTaskForm;
