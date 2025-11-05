// app/page.tsx - Complete updated version
'use client'

import { useState, useEffect } from 'react';
import LoginModal from '@/components/Modal/LoginModal';
import RegisterModal from '@/components/Modal/RegisterModal';
import ForgotPasswordModal from '@/components/Modal/ForgotPasswordModal'; // Make sure this import path is correct
import Link from 'next/link';
import { 
  PlayCircle, 
  Users, 
  Award, 
  BookOpen, 
  CheckCircle, 
  Star, 
  TrendingUp,
  Clock,
  Shield,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { coursesApi, categoriesApi } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string | { id: string; name: string };
  thumbnail: string | null;
  duration_hours: number;
  actual_duration_hours?: number;
  is_featured: boolean;
  status: string;
  module_count?: number;
}

interface Category {
  id: string;
  name: string;
}

export default function LandingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLink, setActiveLink] = useState("#features");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal states - ADD ALL THREE STATES
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  const [stats, setStats] = useState([
    { value: '98%', label: 'Completion Rate' },
    { value: '24/7', label: 'Support Available' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [coursesResponse, categoriesResponse] = await Promise.all([
          coursesApi.getAllCourses(),
          categoriesApi.getAllCategories(),
        ]);

        if (coursesResponse.data?.results) {
          const publishedCourses = coursesResponse.data.results.filter(
            (course: Course) => course.status === 'PUBLISHED'
          );
          setCourses(publishedCourses);
          
          const featured = publishedCourses
            .filter(course => course.is_featured)
            .slice(0, 3);
          setFeaturedCourses(featured.length > 0 ? featured : publishedCourses.slice(0, 3));
        }

        if (categoriesResponse.data?.results) {
          const categoryMap: Record<string, string> = {};
          categoriesResponse.data.results.forEach((category: Category) => {
            categoryMap[category.id] = category.name;
          });
          setCategories(categoryMap);
        }

      } catch (error) {
        console.error('Error fetching landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Courses", href: "#courses" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "WhiteBox", href: "https://whitebox.go.ke/", external: true },
  ];

  const getCategoryName = (category: string | { id: string; name: string }) => {
    if (typeof category === 'string') {
      return categories[category] || 'General';
    }
    return category.name || 'General';
  };

  const getCourseDuration = (course: Course) => {
    return course.actual_duration_hours || course.duration_hours || 0;
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Comprehensive Curriculum',
      description: 'Access a wide range of courses designed by industry experts and thought leaders.'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Self-Paced Learning',
      description: 'Learn at your own convenience with flexible scheduling and lifetime access to course materials.'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Certification',
      description: 'Earn recognized certificates upon course completion to boost your career prospects.'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Expert Instructors',
      description: 'Learn from experienced professionals with real-world knowledge and expertise.'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Career Advancement',
      description: 'Gain skills that directly translate to career growth and professional development.'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure Platform',
      description: 'Your data and progress are protected with enterprise-grade security measures.'
    }
  ];

  const testimonials = [
    {
      name: 'Victor Otieno',
      role: 'Software Developer',
      content: 'The courses transformed my career. The practical approach helped me land a promotion within 3 months.',
      rating: 5
    },
    {
      name: 'Alex Wachira',
      role: 'Marketing Manager',
      content: 'Outstanding content quality and excellent support. The self-paced format fit perfectly with my busy schedule.',
      rating: 5
    },
    {
      name: 'Sharon Chebet',
      role: 'UX Designer',
      content: 'The certification from this platform was recognized by my employer and helped me negotiate a better salary.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-gray-100 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-6 lg:px-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-24 h-16 md:w-30 md:h-20 flex items-center justify-center">
                <img
                  src="/Whitebox.png"
                  alt="ICTA Logo"
                  className="h-16 w-24 md:h-20 md:w-30 object-contain"
                />
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.external) {
                      if (
                        !confirm(
                          'You are being redirected to the WhiteBox platform. Do you want to proceed?'
                        )
                      ) {
                        e.preventDefault();
                      }
                    } else {
                      setActiveLink(item.href);
                    }
                  }}
                  className={`font-bold text-black px-4 py-3 rounded-lg uppercase text-sm tracking-wide transition-all duration-300 no-underline ${
                    activeLink === item.href
                      ? 'bg-red-600 text-white'
                      : 'hover:text-red-600 hover:bg-gray-200'
                  }`}
                  style={{ textDecoration: 'none' }} // <-- Ensures no underline, even if global styles override
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-red-600 p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="font-bold text-black hover:text-red-600 hover:bg-gray-200 transition-all duration-300 uppercase text-sm tracking-wide px-4 py-3 rounded-lg no-underline"
                style={{ textDecoration: 'none' }}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold uppercase text-sm tracking-wide no-underline"
                style={{ textDecoration: 'none' }}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      if (item.external) {
                        if (
                          !confirm(
                            'You are being redirected to the WhiteBox platform. Do you want to proceed?'
                          )
                        ) {
                          e.preventDefault();
                        }
                      } else {
                        setActiveLink(item.href);
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={`font-bold text-black px-4 py-3 rounded-lg uppercase text-sm tracking-wide transition-all duration-300 no-underline ${
                      activeLink === item.href
                        ? 'bg-red-600 text-white'
                        : 'hover:text-red-600 hover:bg-gray-200'
                    }`}
                    style={{ textDecoration: 'none' }}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex flex-col space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="font-bold text-black hover:text-red-600 hover:bg-gray-200 transition-all duration-300 uppercase text-sm tracking-wide px-4 py-3 rounded-lg text-center no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsRegisterModalOpen(true);
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold uppercase text-sm tracking-wide text-center no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative text-white py-12 lg:py-32 overflow-hidden">
        {/* Background Images Container */}
        <div className="absolute inset-0">
          {/* First Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center animate-fadeInOut"
            style={{ 
              backgroundImage: "url('/images/background.jpg')",
              animationDelay: '0s'
            }}
          ></div>
          
          {/* Second Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center animate-fadeInOut"
            style={{ 
              backgroundImage: "url('/images/share.jpeg')",
              animationDelay: '5s'
            }}
          ></div>
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black opacity-50"></div>
          
          {/* Red tint overlay to maintain brand colors */}
          <div className="absolute inset-0 bg-red-600 opacity-10"></div>
        </div>
        
       {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-4xl text-center"> {/* Added wrapper with max-width and text-center */}
            <div className="space-y-6 lg:space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Empowering Innovators with the Knowledge
                  <span className="text-green-300 block">To Develop Viable, Scalable Ventures</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mt-4 lg:mt-6 text-red-100 max-w-2xl mx-auto">
                 Join a growing community of innovators advancing their entrepreneurial journey through expert-led courses and practical training.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="bg-white text-red-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-base sm:text-lg text-center"
                >
                  Start Learning Free
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 lg:pt-8 max-w-md mx-auto"> {/* Added max-w-md and mx-auto to stats */}
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stat.value}</div>
                    <div className="text-red-200 text-xs sm:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add CSS for animation */}
        <style jsx>{`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            25%, 75% { opacity: 1; }
          }
          .animate-fadeInOut {
            animation: fadeInOut 10s infinite;
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section id="features" className="py-4 lg:py-6 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose The Platform?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
               The platform equips innovators with practical knowledge, mentorship, and tools to develop, refine, and scale their ideas into sustainable ventures.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 lg:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-red-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section id="courses" className="py-4 lg:py-6 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-4">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our most sought-after courses designed to boost your skills and career.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {featuredCourses.map((course, index) => (
                  <div 
                    key={course.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group"
                  >
                    <div className="h-40 sm:h-48 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-white/80" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white text-red-600 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                        {getCategoryName(course.category)}
                      </div>
                      {course.is_featured && (
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {getCourseDuration(course)}h
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                            {course.module_count || 0} modules
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">4.8</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="bg-red-100 text-red-600 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                          {getCourseDuration(course) > 10 ? 'Advanced' : getCourseDuration(course) > 5 ? 'Intermediate' : 'Beginner'}
                        </span>
                        <button 
                          onClick={() => setIsRegisterModalOpen(true)}
                          className="bg-white text-red-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-base sm:text-lg text-center"
                        >
                          Enroll Now →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8 lg:mt-12">
                <Link 
                  href="/dashboard/courses" 
                  className="bg-red-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2 text-sm sm:text-base"
                >
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  View All {courses.length} Courses
                </Link>
              </div>
            </>
          )}

          {!loading && featuredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Courses Available</h3>
              <p className="text-gray-500 text-sm sm:text-base">New courses are coming soon. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-4 lg:py-6 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What The Learners Say
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals who’ve advanced their careers through our transformative learning platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-600 italic mb-6 leading-relaxed text-sm sm:text-base">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-bold text-gray-900 text-sm sm:text-base">{testimonial.name}</div>
                  <div className="text-red-600 text-xs sm:text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-4 lg:py-6 bg-red-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-lg sm:text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Join the community of {stats[0]?.value || '0'} learners and take the first step toward achieving your career goals today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsRegisterModalOpen(true)}
                className="bg-white text-red-600 px-6 py-3 sm:px-8 sm:py-4 rounded-md hover:bg-gray-100 transition-colors font-bold text-base sm:text-lg text-center"
              >
                Create Free Account
              </button>
              <Link 
                href="/dashboard/courses" 
                className="border-2 border-white text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-white hover:text-red-600 transition-colors font-bold text-base sm:text-lg text-center"
              >
                Browse Courses
              </Link>
            </div>
            
            <div className="mt-6 lg:mt-8 text-red-200 text-xs sm:text-sm">
              No credit card required • Free enrollment • Lifetime access
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-8 pb-2 lg:pt-12 lg:pb-4">
      <div className="container mx-auto px-2 sm:px-2 lg:px-4">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-2 lg:gap-4">
          <div className="col-span-1">
          <div className="flex items-center space-x-3">
              <div className="w-24 h-16 md:w-30 md:h-20 flex items-center justify-center">
                <img
                  src="/Whitebox.png"
                  alt="ICTA Logo"
                  className="h-16 w-24 md:h-20 md:w-30 object-contain"
                />
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-xs text-sm sm:text-base">
              Where ideas grow into  real-world solutions.   
              The Whitebox e-learning platform equips innovators with practical knowledge and pathways to venture success.
            </p>
          </div>
          
          {/* Combined Quick Links and Important Links */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm sm:text-base">
              {/* Internal Links as buttons */}
              <div>
                <button 
                  onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  Features
                </button>
              </div>
              <div>
                <button 
                  onClick={() => document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  Courses
                </button>
              </div>
              <div>
                <button 
                  onClick={() => document.querySelector('#testimonials')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  Testimonials
                </button>
              </div>
              <div>
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  Sign In
                </button>
              </div>
              
              <div className="pt-2">
              <button 
                  onClick={() => window.open('privacy', '_blank')}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0"
                >
                  Privacy Policy
                </button>
              </div>
    
            </div>
          </div>
          
           {/* External Links as buttons that open in new tab */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4">External Links</h3>
            <div className="pt-2">
                <button 
                  onClick={() => window.open('https://ict.go.ke/', '_blank')}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  MICDE
                </button>
              </div>
              <div>
                <button 
                  onClick={() => window.open('https://icta.go.ke/', '_blank')}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  ICTA
                </button>
              </div>
              <div>
                <button 
                  onClick={() => window.open('https://digitalent.go.ke/', '_blank')}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  Digitalent
                </button>
              </div>
              <div>
                <button 
                  onClick={() => window.open('https://www.smartacademy.go.ke/', '_blank')}
                  className="text-gray-400 hover:text-white transition-colors border-0 bg-transparent p-0 block"
                >
                  Smart Academy
                </button>
              </div>
          </div>
          
          {/* Contact Us Section */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4">Contact Us</h3>
            <div className="text-gray-400 text-sm sm:text-base space-y-2">
              <p className="leading-tight">ICT Authority,</p>
              <p className="leading-tight">Teleposta Towers, 12th Floor</p>
              <p className="leading-tight">Kenyatta Ave., Nairobi, Kenya.</p>
              <p className="leading-tight">P.O. Box 27150-00100</p>
              <p className="leading-tight">+254202211960</p>
              <p className="leading-tight">+254202211961</p>
              <p className="leading-tight">Email: whitebox@icta.go.ke</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 lg:mt-12 pt-2 lg:pt-2 text-center text-gray-400 text-sm sm:text-base">
          <p>&copy; {new Date().getFullYear()} ICTA Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
          
      {/* MODALS - MAKE SURE ALL THREE ARE INCLUDED WITH CORRECT PROPS */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
        onOpenForgotPassword={() => {
          setIsLoginModalOpen(false);
          setIsForgotPasswordModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSwitchToLogin={() => {
          setIsForgotPasswordModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}