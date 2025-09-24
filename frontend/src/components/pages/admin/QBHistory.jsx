import React, { useEffect, useState } from 'react';
import AdminNavbar from '../../navbar/AdminNavbar';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Menu, 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  FileText, 
  History,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Imagecomp } from '../../images/Imagecomp';

const QBHistory = () => {
  const token = localStorage.getItem('token');
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, thisWeek: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistoryData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, rows]);

  const fetchHistoryData = () => {
    setLoading(true);
    axios.get("http://localhost:7000/api/admin/generate-history", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    .then((res) => {
      const sorted = res.data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
      
      const formatted = sorted.map((item, index) => ({
        id: item.id,
        code: item.course_code,
        subject: item.subject_name,
        exam: item.exam_name,
        datetime: new Date(item.date_time).toLocaleString(),
        rawDate: new Date(item.date_time),
        serialNo: index + 1
      }));

      setRows(formatted);
      calculateStats(formatted);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      setLoading(false);
    });
  };

  const calculateStats = (data) => {
    const now = new Date();
    const thisMonth = data.filter(item => {
      const itemDate = new Date(item.rawDate);
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }).length;

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = data.filter(item => new Date(item.rawDate) >= oneWeekAgo).length;

    setStats({
      total: data.length,
      thisMonth,
      thisWeek
    });
  };

  const filterData = () => {
    if (!searchTerm) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter(row =>
      row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.exam.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRows(filtered);
  };

  const columns = [
    { 
      field: 'serialNo', 
      headerName: 'S.No', 
      width: 80,
      renderCell: (params) => (
        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full text-purple-700 font-semibold text-sm">
          {params.value}
        </div>
      )
    },
    { 
      field: 'code', 
      headerName: 'Course Code', 
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-purple-600" />
          </div>
          <span className="font-semibold text-gray-800">{params.value}</span>
        </div>
      )
    },
    { 
      field: 'subject', 
      headerName: 'Subject Name', 
      flex: 2,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-purple-600" />
          </div>
          <span className="text-gray-700">{params.value}</span>
        </div>
      )
    },
    { 
      field: 'exam', 
      headerName: 'Exam Type', 
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-purple-600" />
          </div>
          <span className="text-gray-700">{params.value}</span>
        </div>
      )
    },
    { 
      field: 'datetime', 
      headerName: 'Generated On', 
      flex: 1.5,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-700 text-sm font-medium">
              {params.row.rawDate.toLocaleDateString()}
            </span>
            <span className="text-gray-500 text-xs">
              {params.row.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-purple-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed z-40 top-0 left-0 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:block w-64`}
      >
        <AdminNavbar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto ml-0 lg:ml-0 p-6">
        {/* Enhanced Header */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-6 sticky top-0 z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                className="block lg:hidden p-3 bg-purple-100 rounded-xl text-purple-600 hover:bg-purple-200 transition-colors duration-200"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={20} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <History size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-purple-800">
                    Question Bank History
                  </h1>
                  <p className="text-sm text-gray-500">Track all generated question papers</p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/generateqb')}
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back to Generator</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Papers</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">This Month</p>
                <p className="text-2xl font-bold text-gray-800">{stats.thisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-800">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by course code, subject, or exam type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-300 text-gray-800"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchHistoryData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Generation History</h3>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredRows.length} of {rows.length} records
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <Paper sx={{ width: "100%", minWidth: 800 }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: 10 } }
                }}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                loading={loading}
                rowHeight={70}
                sx={{
                  border: 0,
                  minWidth: 800,
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-row': {
                    borderBottom: '1px solid #f1f5f9',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: '#374151',
                    '& .MuiDataGrid-columnHeader': {
                      padding: '16px',
                    },
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: 'none',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    backgroundColor: '#ffffff',
                  },
                  '& .MuiDataGrid-overlay': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
            </Paper>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredRows.length === 0 && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm ? 'No matching records found' : 'No history available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'Start generating question papers to see your history here.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/generateqb')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Generate Your First Paper
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QBHistory;