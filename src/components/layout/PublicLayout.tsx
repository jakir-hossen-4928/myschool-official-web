
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isLoggedIn, getCurrentUser, logout } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Menu, X, School, ChevronDown, User, LogOut, BookOpen, Home, Info, Phone, Image } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/about', label: 'About Us', icon: <Info className="h-4 w-4" /> },
    { path: '/academics', label: 'Academics', icon: <BookOpen className="h-4 w-4" /> },
    { path: '/gallery', label: 'Gallery', icon: <Image className="h-4 w-4" /> },
    { path: '/contact', label: 'Contact', icon: <Phone className="h-4 w-4" /> },
    { path: '/assets', label: 'Assets', icon: <Image className="h-4 w-4" /> },
  ];

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const authStatus = await isLoggedIn();
        setLoggedIn(authStatus);
        
        if (authStatus) {
          const user = await getCurrentUser();
          setUserRole(user?.role || null);
          setUserName(user?.name || null);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };

    checkAuthentication();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setLoggedIn(false);
      setUserRole(null);
      setUserName(null);
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'staff') return '/staff';
    if (userRole === 'student') return '/student';
    return '/';
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <School className="h-8 w-8 text-school-primary" />
              <span className="text-xl font-bold text-gray-800">School Nexus</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'text-school-primary'
                      : 'text-gray-600 hover:text-school-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* Authentication */}
            <div className="hidden md:flex items-center space-x-4">
              {loggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{userName || 'User'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="flex items-center space-x-2 w-full cursor-pointer">
                        <School className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center space-x-2 w-full cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center space-x-2 text-red-500 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-school-primary hover:bg-school-dark">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 py-2 px-3 rounded-md ${
                    location.pathname === item.path
                      ? 'bg-school-light text-school-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                {loggedIn ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center space-x-2 py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <School className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      className="flex items-center space-x-2 py-2 px-3 rounded-md text-red-500 hover:bg-gray-100 w-full text-left"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Log In</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-2 py-2 px-3 rounded-md bg-school-primary text-white hover:bg-school-dark mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">School Nexus</h3>
              <p className="text-gray-400 text-sm">
                Empowering education with comprehensive management solutions for administrators, staff, and students.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="hover:text-white transition-colors duration-200">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <address className="text-sm text-gray-400 not-italic">
                <p>123 Education Street</p>
                <p>School District, City</p>
                <p className="mt-2">Email: admin@schoolnexus.com</p>
                <p>Phone: +123 456 7890</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} School Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
