import React, { useState, useEffect } from 'react';
import Profile from './profile.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, removeUser } from '../../store/userSlice';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  BookOpen, 
  IdCard, 
  LogOut, 
  X, 
  Edit3,
  Shield,
  Calendar,
  MapPin,
  Award,
  Settings,
  ChevronRight,
  Star,
  Activity
} from 'lucide-react';

export const Imagecomp = () => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);  
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [facultyData, setFacultyData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    dispatch(removeUser());  
    navigate('/');
  };

  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      axios
        .get(`http://localhost:7000/api/faculty/faculty-data?email=${user.email}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        .then((res) => {
          if (res.data.length > 0) {
            setFacultyData(res.data[0]);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching faculty data:', err);
          setLoading(false);
        });
    }
  }, [user, token]);

  const ProfileModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl relative overflow-hidden animate-slide-in">
        
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
          
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all duration-200 z-10 group"
            onClick={() => setOpenProfileModal(false)}
          >
            <X size={15} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>

          {/* Profile Header */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden bg-white">
                <img
                  src={user?.photo || Profile}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                <Activity size={16} className="text-white animate-pulse" />
              </div>
            </div>
            
            {loading ? (
              <div className="animate-pulse text-center">
                <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-24"></div>
              </div>
            ) : facultyData ? (
              <>
                <h2 className="text-3xl font-bold mb-2">{facultyData.faculty_name}</h2>
                <p className="text-white/90 text-lg font-medium mb-3">Faculty Member</p>
                <div className="flex items-center gap-6 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Building size={16} />
                    <span>Department</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard size={16} />
                    <span>ID: {facultyData.faculty_id}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-2">{user?.name || 'Faculty Member'}</h2>
                <p className="text-white/90 text-lg font-medium mb-3">Academic Staff</p>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Shield size={16} />
                  <span>Verified Account</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-300 ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
            }`}
          >
            <User size={18} className="inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-300 ${
              activeTab === 'details'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
            }`}
          >
            <Award size={18} className="inline mr-2" />
            Details
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-xl bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'overview' && facultyData ? (
            <div className="space-y-6">
              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">Full Name</p>
                      <p className="text-gray-800 font-bold text-lg">{facultyData.faculty_name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-5 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <IdCard size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide mb-1">Faculty ID</p>
                      <p className="text-gray-800 font-bold text-lg">{facultyData.faculty_id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-teal-100 p-5 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">Subject</p>
                      <p className="text-gray-800 font-bold text-lg">{facultyData.subject_name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-5 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Award size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide mb-1">Course Code</p>
                      <p className="text-gray-800 font-bold text-lg">{facultyData.course_code}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-blue-500" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium">Email Address</p>
                      <p className="text-gray-800 font-semibold">{facultyData.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                  <div>
                    <p className="text-green-800 font-semibold">Account Active</p>
                    <p className="text-green-600 text-sm">All systems operational</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'details' && facultyData ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Professional Profile</h3>
                <p className="text-gray-600">Detailed information about your academic profile</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Faculty Name</p>
                        <p className="text-gray-800 font-semibold text-lg">{facultyData.faculty_name}</p>
                      </div>
                    </div>
                    <Star size={20} className="text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <BookOpen size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Teaching Subject</p>
                        <p className="text-gray-800 font-semibold text-lg">{facultyData.subject}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <IdCard size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Course Code</p>
                        <p className="text-gray-800 font-semibold text-lg">{facultyData.course_code}</p>
                      </div>
                    </div>
                    <Award size={20} className="text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          ) : !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500">Faculty information could not be loaded.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex gap-4">
            <button className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold py-4 rounded-2xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transform hover:scale-105">
              <Edit3 size={20} />
              Edit Profile
            </button>
            <button className="flex-1 bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-700 font-semibold py-4 rounded-2xl hover:from-blue-200 hover:to-indigo-300 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transform hover:scale-105">
              <Settings size={20} />
              Settings
            </button>
            <button
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="relative">
      <div className="group">
        <img
          src={user?.photo || Profile}
          alt="Profile"
          className="w-14 h-14 rounded-full cursor-pointer border-2 border-transparent hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
          onClick={() => setOpenProfileModal(true)}
        />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
      </div>

      {openProfileModal && <ProfileModal />}
    </div>
  );
};
