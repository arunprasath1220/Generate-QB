import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  BookOpen, 
  Shield, 
  LogOut, 
  ChevronRight,
  User,
  GraduationCap
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from '../../store/userSlice';
import Logo from '../images/bitlogo.png';

const FacultyNavbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const navItems = [
    { 
      to: '/facultydashboard', 
      label: 'Dashboard', 
      icon: <BarChart3 size={20} />,
      description: 'Overview & Analytics'
    },
    { 
      to: '/qbdetailsf', 
      label: 'QB Details', 
      icon: <FileText size={20} />,
      description: 'Question Bank Info'
    },
    { 
      to: '/manageqb', 
      label: 'Manage QB', 
      icon: <BookOpen size={20} />,
      description: 'Create & Edit Questions'
    },
    { 
      to: '/vettingpage', 
      label: 'Vetting Page', 
      icon: <Shield size={20} />,
      description: 'Review & Approve'
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    dispatch(removeUser()); 
  };

  return (
    <nav className="w-64 h-screen fixed bg-gradient-to-b from-white to-gray-50/50 shadow-xl flex flex-col border-r border-gray-200">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-md p-2 mb-3 border border-gray-200">
            <img 
              className="w-full h-full object-contain" 
              src={Logo} 
              alt="BIT LOGO" 
            />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">Faculty Panel</h2>
            <p className="text-xs text-gray-600 mt-1">QB Generator System</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-4  ">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Navigation
          </h3>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`group relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg transform scale-105' 
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-purple-800 rounded-r-full"></div>
                    )}
                    
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 group-hover:bg-purple-100'
                    }`}>
                      <div className={isActive ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}>
                        {item.icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-semibold ${
                            isActive ? 'text-white' : 'text-gray-800 group-hover:text-purple-800'
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-xs ${
                            isActive ? 'text-purple-100' : 'text-gray-500 group-hover:text-purple-600'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight 
                          size={16} 
                          className={`transition-transform duration-200 ${
                            isActive 
                              ? 'text-white transform rotate-90' 
                              : 'text-gray-400 group-hover:text-purple-500 group-hover:transform group-hover:translate-x-1'
                          }`}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Faculty Info Card */}
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <GraduationCap size={20} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name || 'Faculty Member'}
              </p>
              <p className="text-xs text-gray-600">
                ID: {user?.faculty_id || 'Not Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="space-y-2">
          
          {/* Logout Button */}
          <Link
            to="/"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group"
          >
            <div className="p-1 rounded bg-red-100 group-hover:bg-red-200">
              <LogOut size={16} />
            </div>
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
        
        {/* Version Info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Version 1.0.0
          </p>
        </div>
      </div>
    </nav>
  );
};

export default FacultyNavbar;
