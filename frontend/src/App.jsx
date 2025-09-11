import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import LoginPage from './components/pages/LoginPage';
import Admindashboard from './components/pages/admin/AdminDashboard';
import FacultyList from './components/pages/admin/FacultyList';
import GenerateQB from './components/pages/admin/GenerateQB';
import FacultyDashboard from './components/pages/faculty/FacultyDashboard';
import ManageQB from './components/pages/faculty/ManageQB';
import QBDetails from './components/pages/faculty/QBDetails';
import AddQuestions from './components/pages/faculty/AddQuestions';
import GiveTaskForm from './components/pages/admin/GiveTaskForm';
import QBHistory from './components/pages/admin/QBHistory';
import VettingPage from './components/pages/faculty/VettingPage';
import VettingTask from './components/pages/admin/VettingTask';
import QuestionDetails from './components/pages/admin/QuestionDetails';

const ProtectedRoute = ({ children, role }) => {
  const user = useSelector((state) => state.user.user);
  if (user && user.role === role) {
    return children;
  }
  return <Navigate to="/" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute role="admin">
              <Admindashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facultylist"
          element={
            <ProtectedRoute role="admin">
              <FacultyList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-task"
          element={
            <ProtectedRoute role="admin">
              <GiveTaskForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vettingtask"
          element={
            <ProtectedRoute role="admin">
              <VettingTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generateqb"
          element={
            <ProtectedRoute role="admin">
              <GenerateQB />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qbdetails"
          element={
            <ProtectedRoute role="admin">
                <QuestionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qbhistory"
          element={
            <ProtectedRoute role="admin">
              <QBHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/facultydashboard"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manageqb"
          element={
            <ProtectedRoute role="faculty">
              <ManageQB />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vettingpage"
          element={
            <ProtectedRoute role="faculty">
              <VettingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qbdetailsf"
          element={
            <ProtectedRoute role="faculty">
              <QBDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addquestions"
          element={
            <ProtectedRoute role="faculty">
              <AddQuestions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
