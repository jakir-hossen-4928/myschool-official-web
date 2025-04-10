
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, Bell, 
  MessageSquare, FileText, Settings, LogOut, Menu, X, 
  BriefcaseIcon, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StaffLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/staff', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/staff/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
    { path: '/staff/classes', label: 'Classes', icon: <BookOpen className="h-5 w-5" /> },
    { path: '/staff/schedules', label: 'Schedules', icon: <Calendar className="h-5 w-5" /> },
    { path: '/staff/attendance', label: 'Attendance', icon: <FileText className="h-5 w-5" /> },
    { path: '/staff/messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { path: '/staff/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { path: '/staff/profile', label: 'Profile', icon: <Settings className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "bg-school-secondary text-white fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-school-dark/20">
            <Link to="/staff" className="flex items-center space-x-2">
              <BriefcaseIcon className="h-8 w-8" />
              <span className="text-xl font-bold">Staff Portal</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-white hover:bg-school-dark/20"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200",
                      location.pathname === item.path
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {location.pathname === item.path && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-school-dark/20">
            <Button 
              variant="outline" 
              className="w-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2 lg:hidden"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden lg:flex"
                onClick={toggleSidebar}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-800 ml-2">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Staff Portal'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:inline">Staff Member</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={toggleMobileMenu}></div>
            <div className="absolute top-0 left-0 w-64 h-full bg-school-secondary text-white">
              <div className="flex items-center justify-between p-4 border-b border-school-dark/20">
                <Link to="/staff" className="flex items-center space-x-2" onClick={toggleMobileMenu}>
                  <BriefcaseIcon className="h-8 w-8" />
                  <span className="text-xl font-bold">Staff Portal</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-school-dark/20"
                  onClick={toggleMobileMenu}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="py-4">
                <ul className="space-y-1 px-2">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200",
                          location.pathname === item.path
                            ? "bg-white/20 text-white font-medium"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        )}
                        onClick={toggleMobileMenu}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="p-4 border-t border-school-dark/20">
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
