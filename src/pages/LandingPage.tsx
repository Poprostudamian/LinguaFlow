// src/pages/LandingPage.tsx - WITH TRANSLATIONS
import React, { useState } from 'react';
import { BookOpen, Users, Calendar, MessageSquare, CheckCircle, ArrowRight, Menu, X, Star, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage(); // ← DODANE

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: t.landingPage.interactiveLessonsTitle,
      description: t.landingPage.interactiveLessonsDesc
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: t.landingPage.smartSchedulingTitle,
      description: t.landingPage.smartSchedulingDesc
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: t.landingPage.realtimeCommunicationTitle,
      description: t.landingPage.realtimeCommunicationDesc
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t.landingPage.studentManagementTitle,
      description: t.landingPage.studentManagementDesc
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: t.landingPage.progressTrackingTitle,
      description: t.landingPage.progressTrackingDesc
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: t.landingPage.personalizedLearningTitle,
      description: t.landingPage.personalizedLearningDesc
    }
  ];

  const steps = [
    {
      role: t.landingPage.forTutors,
      steps: [
        t.landingPage.tutorStep1,
        t.landingPage.tutorStep2,
        t.landingPage.tutorStep3,
        t.landingPage.tutorStep4
      ]
    },
    {
      role: t.landingPage.forStudents,
      steps: [
        t.landingPage.studentStep1,
        t.landingPage.studentStep2,
        t.landingPage.studentStep3,
        t.landingPage.studentStep4
      ]
    }
  ];

  const testimonials = [
    { 
      name: t.landingPage.testimonial1Name, 
      role: t.landingPage.testimonial1Role, 
      text: t.landingPage.testimonial1Text 
    },
    { 
      name: t.landingPage.testimonial2Name, 
      role: t.landingPage.testimonial2Role, 
      text: t.landingPage.testimonial2Text 
    },
    { 
      name: t.landingPage.testimonial3Name, 
      role: t.landingPage.testimonial3Role, 
      text: t.landingPage.testimonial3Text 
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
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {t.landingPage.features}
              </a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {t.landingPage.howItWorks}
              </a>
              
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle language"
              >
                <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'en' ? '🇬🇧 EN' : '🇵🇱 PL'}
                </span>
              </button>
              
              {/* Theme Toggle Button */}
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
              
              <a href="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                {t.landingPage.login}
              </a>
              <a href="/signup" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                {t.landingPage.getStarted}
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900 dark:text-white" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                className="block text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.landingPage.features}
              </a>
              <a 
                href="#how-it-works" 
                className="block text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.landingPage.howItWorks}
              </a>
              
              {/* Mobile Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 w-full"
              >
                <Globe className="h-5 w-5" />
                <span>{language === 'en' ? '🇬🇧 English' : '🇵🇱 Polski'}</span>
              </button>
              
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 w-full"
              >
                {isDark ? (
                  <>
                    <Sun className="h-5 w-5" />
                    <span>{t.landingPage.lightMode}</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    <span>{t.landingPage.darkMode}</span>
                  </>
                )}
              </button>
              
              <a href="/login" className="block text-purple-600 dark:text-purple-400 font-medium">
                {t.landingPage.login}
              </a>
              <a href="/signup" className="block bg-purple-600 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-700">
                {t.landingPage.getStarted}
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {t.landingPage.heroTitle}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-10">
              {t.landingPage.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                {t.landingPage.startTeaching}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-2 border-purple-600 dark:border-purple-400"
              >
                {t.landingPage.startLearning}
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              {t.landingPage.freeToStart}
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
              <div className="text-purple-100">{t.landingPage.activeTutors}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">2,000+</div>
              <div className="text-purple-100">{t.landingPage.studentsLearning}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-purple-100">{t.landingPage.lessonsCompleted}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-purple-100">{t.landingPage.satisfactionRate}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t.landingPage.featuresTitle}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t.landingPage.featuresSubtitle}
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
              {t.landingPage.howItWorksTitle}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t.landingPage.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {steps.map((section, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6">
                  {section.role}
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
              {t.landingPage.testimonialsTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
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
            {t.landingPage.ctaTitle}
          </h2>
          <p className="text-xl text-purple-100 mb-10">
            {t.landingPage.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-600 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t.landingPage.createFreeAccount}
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
                {t.landingPage.footerTagline}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t.landingPage.footerProduct}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-purple-400 transition-colors">{t.landingPage.features}</a></li>
                <li><a href="#how-it-works" className="hover:text-purple-400 transition-colors">{t.landingPage.howItWorks}</a></li>
                <li><a href="/signup" className="hover:text-purple-400 transition-colors">{t.landingPage.footerPricing}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t.landingPage.footerCompany}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">{t.landingPage.footerAbout}</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">{t.landingPage.footerBlog}</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">{t.landingPage.footerContact}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t.landingPage.footerLegal}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">{t.landingPage.footerPrivacy}</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">{t.landingPage.footerTerms}</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">{t.landingPage.footerSecurity}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>{t.landingPage.footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}