import React, { useEffect, useState } from 'react';
import AdminNavbar from '../../navbar/AdminNavbar';
import { DataGrid } from '@mui/x-data-grid';
import { Menu, ArrowLeft, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle, Filter, Download, Search, Calendar, TrendingUp } from 'lucide-react';
import Paper from '@mui/material/Paper';
import { Drawer } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Imagecomp } from '../../images/Imagecomp';

const QuestionDetails = () => {
  const token = localStorage.getItem('token');
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Normalize statuses coming from API: treat "accepted" as "approved"
  const normalizeStatus = (status) => {
    const s = (status || '').toLowerCase();
    return s === 'accepted' ? 'approved' : s;
  };

  const handlechangeclick = () => {
    setClicked(!clicked);
    navigate('/');
  };

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:7000/api/admin/question-history", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    .then((res) => {
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const formatted = sorted.map((item, index) => ({
        id: index + 1,
        facultyId: item.faculty_id,
        code: item.course_code,
        unit: item.unit,
        datetime: new Date(item.created_at).toLocaleString(),
        status: normalizeStatus(item.status), // normalized here
        created_at: item.created_at,
      }));

      setRows(formatted);
      setFilteredRows(formatted);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      setLoading(false);
    });
  }, [token]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = rows.filter(row => {
      const matchesSearch = 
        row.facultyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.unit?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredRows(filtered);
  }, [searchTerm, statusFilter, rows]);

  // Get status statistics
  const getStats = () => {
    const total = rows.length;
    const approved = rows.filter(row => row.status === 'approved').length;
    const pending = rows.filter(row => row.status === 'pending').length;
    const rejected = rows.filter(row => row.status === 'rejected').length;
    
    return { total, approved, pending, rejected };
  };

  const stats = getStats();

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status?.toLowerCase()) {
        case 'approved':
          return { 
            color: 'bg-green-100 text-green-800 border-green-200', 
            icon: <CheckCircle size={14} />,
            text: 'Approved'
          };
        case 'pending':
          return { 
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
            icon: <AlertCircle size={14} />,
            text: 'Pending'
          };
        case 'rejected':
          return { 
            color: 'bg-red-100 text-red-800 border-red-200', 
            icon: <XCircle size={14} />,
            text: 'Rejected'
          };
        default:
          return { 
            color: 'bg-gray-100 text-gray-800 border-gray-200', 
            icon: <AlertCircle size={14} />,
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

  const columns = [
    { 
      field: 'facultyId', 
      headerName: 'Faculty ID', 
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-1 rounded">
            <Users size={14} className="text-blue-600" />
          </div>
          <span className="font-medium">{params.value}</span>
        </div>
      )
    },
    { 
      field: 'code', 
      headerName: 'Course Code', 
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-1 rounded">
            <FileText size={14} className="text-purple-600" />
          </div>
          <span className="font-medium">{params.value}</span>
        </div>
      )
    },
    { 
      field: 'unit', 
      headerName: 'Unit', 
      flex: 0.8,
      renderCell: (params) => (
        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
          {params.value}
        </span>
      )
    },
    { 
      field: 'datetime', 
      headerName: 'Date & Time', 
      flex: 1.2,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-1 rounded">
            <Clock size={14} className="text-orange-600" />
          </div>
          <span className="text-sm">{params.value}</span>
        </div>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      renderCell: (params) => <StatusBadge status={params.value} />
    }
  ];

  // Export visible rows (filteredRows) to CSV
  const handleExportCSV = () => {
    if (!filteredRows?.length) return;

    const headers = ['Faculty ID', 'Course Code', 'Unit', 'Date & Time', 'Status'];
    const escapeCSV = (v) => {
      const s = (v ?? '').toString();
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const data = filteredRows.map(r => [
      r.facultyId,
      r.code,
      r.unit,
      r.datetime,
      r.status,
    ]);

    const csv = [headers, ...data]
      .map(row => row.map(escapeCSV).join(','))
      .join('\r\n');

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `question-history-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                    <FileText size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Question Details
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Monitor and track all question submissions and their status
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-white/30"
                  onClick={() => navigate('/vettingtask')}
                >
                  <ArrowLeft size={18} />
                  Back to Vetting
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <AlertCircle size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <XCircle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
              Filters & Search
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Search Questions</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Faculty ID, Course Code, or Unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 focus:bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Question History ({filteredRows.length} items)
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={!filteredRows.length}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${!filteredRows.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-disabled={!filteredRows.length}
                  title={!filteredRows.length ? 'No rows to export' : 'Export to CSV'}
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
                minWidth: 500,
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: 'none'
              }}
            >
              <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } }
                }}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                rowHeight={70}
                sx={{
                  border: 0,
                  minWidth: 500,
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    backgroundColor: '#ffffff',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f3f4f6',
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
    </div>
  );
};

export default QuestionDetails;
