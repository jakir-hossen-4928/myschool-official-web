
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { School, GraduationCap, Users, BookOpen, Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-school-primary to-school-accent opacity-10"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              School Nexus Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              An integrated management solution for schools, connecting administrators, staff, and students in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-school-primary hover:bg-school-dark">
                  Log In to Portal
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="border-school-primary text-school-primary">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Comprehensive School Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-school-light rounded-full">
                  <Users className="h-8 w-8 text-school-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Admin Dashboard</h3>
              <p className="text-gray-600 text-center">
                Comprehensive administration tools for school management, financial tracking, and decision-making.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-school-light rounded-full">
                  <School className="h-8 w-8 text-school-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Staff Portal</h3>
              <p className="text-gray-600 text-center">
                Tools for teachers to manage classes, track attendance, communicate with students and parents.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-school-light rounded-full">
                  <GraduationCap className="h-8 w-8 text-school-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Student Dashboard</h3>
              <p className="text-gray-600 text-center">
                Access to class schedules, assignments, grades, and educational resources in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Streamline School Operations</h2>
              <p className="text-gray-600 mb-6">
                Our platform simplifies administrative tasks, improves communication, and enhances the educational experience for everyone involved.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-school-light rounded-full">
                    <Sparkles className="h-5 w-5 text-school-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Centralized Information</h3>
                    <p className="text-gray-600">All school data accessible in one secure platform</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-school-light rounded-full">
                    <Sparkles className="h-5 w-5 text-school-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-time Updates</h3>
                    <p className="text-gray-600">Instant notifications and status updates for all users</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-school-light rounded-full">
                    <Sparkles className="h-5 w-5 text-school-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Enhanced Communication</h3>
                    <p className="text-gray-600">Direct messaging and notification system for school community</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-school-primary to-school-accent p-1 rounded-lg">
                <div className="bg-white p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <BookOpen className="h-8 w-8 text-school-primary mb-2" />
                      <h3 className="font-semibold">Academic Management</h3>
                      <p className="text-sm text-gray-600">Course planning and curriculum tracking</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <Users className="h-8 w-8 text-school-primary mb-2" />
                      <h3 className="font-semibold">Student Records</h3>
                      <p className="text-sm text-gray-600">Complete student information system</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <School className="h-8 w-8 text-school-primary mb-2" />
                      <h3 className="font-semibold">Staff Management</h3>
                      <p className="text-sm text-gray-600">Teacher profiles and workload tracking</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <Sparkles className="h-8 w-8 text-school-primary mb-2" />
                      <h3 className="font-semibold">AI Assistant</h3>
                      <p className="text-sm text-gray-600">Intelligent support for administrative tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-school-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your school management?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of schools already using School Nexus to streamline operations and enhance education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/admin-login">
              <Button size="lg" variant="secondary" className="bg-white text-school-primary hover:bg-gray-100">
                Admin Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
