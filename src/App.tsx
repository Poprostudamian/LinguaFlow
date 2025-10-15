// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { StudentsProvider } from './contexts/StudentsContext';
import { Layout } from './components/Layout';
import { RouteGuard } from './components/RouteGuard';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { StudentDashboard } from './pages/StudentDashboard';
import { TutorDashboard } from './pages/TutorDashboard';
import { TutorStudentsPage } from './pages/TutorStudentsPage';
import { TutorLessonManagementPage } from './pages/TutorLessonManagementPage';
import { TutorSchedulePage } from './pages/TutorSchedulePage';
import { TutorMessagesPage } from './pages/TutorMessagesPage';
import { StudentLessonsPage } from './pages/StudentLessonsPage';
import { StudentLessonViewer } from './pages/StudentLessonViewer';
import { StudentLessonHistory } from './pages/StudentLessonHistory';
import { StudentSchedulePage } from './pages/StudentSchedulePage';
import { StudentMessagesPage } from './pages/StudentMessagesPage';
import { TutorGradingPage } from './pages/TutorGradingPage';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <StudentsProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} /> {/* ← ZMIENIONE: Landing jako strona główna */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected Routes with Layout */}
                  <Route path="/" element={<Layout />}>
                    <Route 
                      path="student/*" 
                      element={
                        <RouteGuard requiredRole="student">
                          <Routes>
                            <Route index element={<StudentDashboard />} />
                            <Route path="lessons" element={<StudentLessonsPage />} />
                            <Route path="lessons/:lessonId" element={<StudentLessonViewer />} />
                            <Route path="lessons/:lessonId/history" element={<StudentLessonHistory />} />
                            <Route path="schedule" element={<StudentSchedulePage />} />
                            <Route path="messages" element={<StudentMessagesPage />} />
                          </Routes>
                        </RouteGuard>
                      } 
                    />
                    
                    <Route 
                      path="tutor/*" 
                      element={
                        <RouteGuard requiredRole="tutor">
                          <Routes>
                            <Route index element={<TutorDashboard />} />
                            <Route path="students" element={<TutorStudentsPage />} />
                            <Route path="lessons" element={<TutorLessonManagementPage />} />
                            <Route path="schedule" element={<TutorSchedulePage />} />
                            <Route path="messages" element={<TutorMessagesPage />} />
                          </Routes>
                        </RouteGuard>
                      } 
                    />
                  </Route>
                  
                  {/* Fallback - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} /> {/* ← ZMIENIONE: przekieruj do Landing, nie login */}
                </Routes>
              </div>
            </Router>
          </StudentsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;