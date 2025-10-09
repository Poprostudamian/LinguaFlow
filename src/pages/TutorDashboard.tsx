import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  UserCheck,
  Award,
  Calendar,
  Activity
} from 'lucide-react';

// Toast Notification Component
function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />
  };

  return (
    <div className={`fixed top-6 right-6 z-50 animate-slide-in-right max-w-md`}>
      <div className={`${colors[type]} border rounded-lg p-4 shadow-lg flex items-start space-x-3`}>
        {icons[type]}
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    purple: 'from-purple-600 to-purple-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// Student Card Component
function StudentCard({ student }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {student.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{student.level}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          student.status === 'active' 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
        }`}>
          {student.status}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
          style={{ width: `${student.progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">{student.lessonsCompleted} lessons</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">{student.totalHours}h</span>
        </div>
      </div>
    </div>
  );
}

// Student Selection Card for Form
function StudentSelectCard({ student, selected, onToggle }) {
  return (
    <div
      onClick={() => onToggle(student.id)}
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        selected
          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
          selected ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-400'
        }`}>
          {student.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">{student.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{student.level}</p>
        </div>
        {selected && (
          <CheckCircle className="h-5 w-5 text-purple-600" />
        )}
      </div>
    </div>
  );
}

// Main TutorDashboard Component
export default function TutorDashboard() {
  // Mock data
  const mockKPIs = {
    totalStudents: 12,
    activeStudents: 8,
    teachingHours: 45,
    completionRate: 78
  };

  const mockStudents = [
    { id: '1', name: 'John Doe', level: 'B2', status: 'active', progress: 75, lessonsCompleted: 8, totalHours: 12 },
    { id: '2', name: 'Jane Smith', level: 'A2', status: 'active', progress: 45, lessonsCompleted: 5, totalHours: 8 },
    { id: '3', name: 'Mike Johnson', level: 'C1', status: 'active', progress: 90, lessonsCompleted: 12, totalHours: 18 },
    { id: '4', name: 'Sarah Williams', level: 'B1', status: 'inactive', progress: 30, lessonsCompleted: 3, totalHours: 5 }
  ];

  // State
  const [activeTab, setActiveTab] = useState('info'); // info, content, students
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    assignedStudentIds: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const handleStudentToggle = (studentId) => {
    setNewLesson(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setToast({
      type: 'success',
      message: `Lesson "${newLesson.title}" created and assigned to ${newLesson.assignedStudentIds.length} student(s)!`
    });

    // Reset form
    setNewLesson({
      title: '',
      description: '',
      content: '',
      assignedStudentIds: []
    });
    setActiveTab('info');
    setIsCreating(false);
  };

  const isFormValid = newLesson.title.trim() && newLesson.content.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header with Quick Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tutor Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Live from your database</span>
            </p>
          </div>
          <button
            onClick={() => setToast({ type: 'success', message: 'Dashboard refreshed!' })}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Total Students"
            value={mockKPIs.totalStudents}
            icon={Users}
            color="purple"
            trend="+2 this week"
          />
          <KPICard
            title="Active Students"
            value={mockKPIs.activeStudents}
            icon={TrendingUp}
            color="blue"
            trend="+15%"
          />
          <KPICard
            title="Teaching Hours"
            value={`${mockKPIs.teachingHours}h`}
            icon={Clock}
            color="green"
            trend="+5h this week"
          />
          <KPICard
            title="Completion Rate"
            value={`${mockKPIs.completionRate}%`}
            icon={Award}
            color="orange"
            trend="+3%"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students Section */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>My Students ({mockStudents.length})</span>
              </h2>
            </div>

            {mockStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No students yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mockStudents.map(student => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Lesson Section */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <PlusCircle className="h-5 w-5 text-purple-600" />
              <span>Create New Lesson</span>
            </h2>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'info', label: 'Lesson Info', icon: FileText },
                { id: 'content', label: 'Content', icon: BookOpen },
                { id: 'students', label: 'Assign Students', icon: UserCheck }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-6">
              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === 'info' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Title *
                      </label>
                      <input
                        type="text"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="e.g., Spanish Conversation Practice"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="Brief description of the lesson..."
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Tip:</strong> A clear title and description help students understand what they'll learn.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Content *
                      </label>
                      <textarea
                        value={newLesson.content}
                        onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                        rows={10}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm transition-all"
                        placeholder="Enter lesson content, instructions, exercises..."
                        required
                      />
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        <strong>Pro tip:</strong> Include clear instructions, examples, and exercises for best results.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'students' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Students
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {newLesson.assignedStudentIds.length} / {mockStudents.length} selected
                      </span>
                    </div>

                    {mockStudents.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No students available</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Add students first in the Students tab
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                        {mockStudents.map(student => (
                          <StudentSelectCard
                            key={student.id}
                            student={student}
                            selected={newLesson.assignedStudentIds.includes(student.id)}
                            onToggle={handleStudentToggle}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {!isFormValid && (
                    <span className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Please fill in required fields</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCreating || !isFormValid}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5" />
                      <span>Create Lesson</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}