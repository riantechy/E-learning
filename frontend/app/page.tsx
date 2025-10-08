// app/page.tsx
'use client'

import { useState, useEffect } from 'react';
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
  Globe
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
    { name: "WhiteBox", href: "http://10.241.18.19/whitebox/index.php", external: true },
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-30 h-20 flex items-center justify-center">
              <img
                src="/images/download.png"
                alt="ICTA Logo"
                className="h-20 w-30 object-contain"
              />
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.external) {
                    if (!confirm("You are being redirected to the WhiteBox platform. Do you want to proceed?")) {
                      e.preventDefault();
                    }
                  } else {
                    setActiveLink(item.href);
                  }
                }}
                className={`no-underline font-bold text-black px-4 py-3 rounded-lg uppercase text-sm tracking-wide transition-all duration-300 ${
                  activeLink === item.href
                    ? "bg-red-600 text-white"
                    : "hover:text-red-600 hover:bg-gray-200"
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="no-underline font-bold text-black hover:text-red-600 hover:bg-gray-200 transition-all duration-300 uppercase text-sm tracking-wide px-4 py-3 rounded-lg hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold uppercase text-sm tracking-wide"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>


      {/* Hero Section */}
      <section className="relative text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Images Container */}
        <div className="absolute inset-0">
          {/* First Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center animate-fadeInOut"
            style={{ 
              backgroundImage: "url('/images/background.jpg')",
              animationDelay: '3s'
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Empower Your Future Through
                  <span className="text-green-300"> Digital Learning</span>
                </h1>
                <p className="text-xl md:text-2xl mt-6 text-red-100 max-w-2xl">
                  Join thousands of learners transforming their careers with our comprehensive online courses and expert-led training programs.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register" 
                  className="bg-white text-red-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg text-center"
                >
                  Start Learning Free
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                    <div className="text-red-200 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="w-full h-64 bg-white/5 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-white/20" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-green-400 text-red-800 px-4 py-2 rounded-full font-bold">
                Trusted by {stats[0]?.value || '0'} Professionals
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
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide everything you need to succeed in your learning journey with industry-leading features and support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-red-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section id="courses" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our most sought-after courses designed to boost your skills and career.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredCourses.map((course, index) => (
                  <div 
                    key={course.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group"
                  >
                    <div className="h-48 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-white/80" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                      <div className="absolute top-4 right-4 bg-white text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                        {getCategoryName(course.category)}
                      </div>
                      {course.is_featured && (
                        <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {getCourseDuration(course)}h
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.module_count || 0} modules
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-bold text-gray-900">4.8</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                          {getCourseDuration(course) > 10 ? 'Advanced' : getCourseDuration(course) > 5 ? 'Intermediate' : 'Beginner'}
                        </span>
                        <Link 
                          href="/register" 
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Enroll Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Link 
                  href="/dashboard/courses" 
                  className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <BookOpen className="h-5 w-5" />
                  View All {courses.length} Courses
                </Link>
              </div>
            </>
          )}

          {!loading && featuredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Courses Available</h3>
              <p className="text-gray-500">New courses are coming soon. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Learners Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied learners who have transformed their careers with our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-600 italic mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-red-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Join our community of {stats[0]?.value || '0'} learners and take the first step toward achieving your career goals today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="bg-white text-red-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                Create Free Account
              </Link>
              <Link 
                href="/dashboard/courses" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-red-600 transition-colors font-bold text-lg"
              >
                Browse Courses
              </Link>
            </div>
            
            <div className="mt-8 text-red-200 text-sm">
              No credit card required • Free enrollment • Lifetime access
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src="/images/download.png" 
                    alt="ICTA Logo" 
                    className="h-10 w-10 object-contain" 
                  />
                </div>
                {/* <span className="text-xl font-bold">ICTA e-Learning</span> */}
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering self-paced digital learning through Whitebox training programs. 
                Join us in transforming education for the digital age.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#courses" className="text-gray-400 hover:text-white transition-colors">Courses</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ICTA e-Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}