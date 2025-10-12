import React from 'react';
import { BookOpen, Users, Calendar, MessageSquare, CheckCircle, ArrowRight, Menu, X, Star, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Interactive Lessons",
      description: "Create and assign custom lessons with exercises, flashcards, and assessments tailored to each student's needs."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Smart Scheduling",
      description: "Manage meetings and sessions with an integrated calendar. Never miss a lesson with automated reminders."
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Real-time Communication",
      description: "Stay connected with built-in messaging. Discuss progress, ask questions, and provide feedback instantly."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Student Management",
      description: "Track progress, monitor completion rates, and manage multiple students from one intuitive dashboard."
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Progress Tracking",
      description: "Detailed analytics and reports show learning progress, completed exercises, and time spent on each lesson."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Personalized Learning",
      description: "Adapt content to individual learning styles. Create custom exercises that match each student's level."
    }
  ];

  const steps = [
    {
      role: "Tutor",
      steps: [
        "Sign up and create your profile",
        "Invite students via email",
        "Create custom lessons and exercises",
        "Schedule meetings and track progress"
      ]
    },
    {
      role: "Student",
      steps: [
        "Accept your tutor's invitation",
        "Access assigned lessons",
        "Complete interactive exercises",
        "Track your learning journey"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">LinguaFlow</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">How It Works</a>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              <a href="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">Login</a>
              <a href="/signup" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">Get Started</a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-900 dark:text-white" /> : <Menu className="h-6 w-6 text-gray-900 dark:text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">Features</a>
              <a href="#how-it-works" className="block text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">How It Works</a>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
              >
                {isDark ? (
                  <>
                    <Sun className="h-5 w-5" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <a href="/login" className="block text-purple-600 dark:text-purple-400 font-medium">Login</a>
              <a href="/signup" className="block bg-purple-600 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-700">Get Started</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Transform Language Learning
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-10">
              The all-in-one platform connecting tutors and students for personalized, interactive language education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
                <a href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Teaching
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-2 border-purple-600 dark:border-purple-400"
              >
                Start Learning
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              ✨ Free to get started • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-purple-600 dark:bg-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-purple-100">Active Tutors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">2,000+</div>
              <div className="text-purple-100">Students Learning</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-purple-100">Lessons Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-purple-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful tools designed for modern language education
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800"
              >
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple steps to start your journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {steps.map((section, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6">
                  For {section.role}s
                </h3>
                <div className="space-y-4">
                  {section.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold mr-4">
                        {stepIdx + 1}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 pt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              What People Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Maria Garcia", role: "Spanish Tutor", text: "LinguaFlow has transformed how I teach. The interactive lessons keep my students engaged!" },
              { name: "John Smith", role: "English Student", text: "Finally, a platform that makes learning fun and organized. I've improved so much!" },
              { name: "Sophie Chen", role: "Mandarin Tutor", text: "Managing multiple students is effortless. The progress tracking is invaluable." }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-900 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-purple-100 mb-10">
            Join thousands of tutors and students already using LinguaFlow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold text-white">LinguaFlow</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering language education through technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-purple-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-purple-400 transition-colors">How It Works</a></li>
                <li><a href="/signup" className="hover:text-purple-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 LinguaFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}