
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Users, BookOpen, DollarSign, AlertCircle, School, Calendar } from 'lucide-react';

// Mock data for the dashboard
const COLORS = ['#4f46e5', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#84cc16', '#06b6d4'];

const mockFinancialData = [
  { month: 'Jan', income: 6500, expenses: 5200 },
  { month: 'Feb', income: 5900, expenses: 5100 },
  { month: 'Mar', income: 7000, expenses: 5400 },
  { month: 'Apr', income: 6800, expenses: 5600 },
  { month: 'May', income: 7200, expenses: 5300 },
  { month: 'Jun', income: 7500, expenses: 5700 },
];

const mockClassDistribution = [
  { name: 'Class 1', value: 25 },
  { name: 'Class 2', value: 30 },
  { name: 'Class 3', value: 28 },
  { name: 'Class 4', value: 22 },
  { name: 'Class 5', value: 20 },
  { name: 'Class 6', value: 18 },
];

const mockStudentAttendance = [
  { month: 'Jan', attendance: 92 },
  { month: 'Feb', attendance: 94 },
  { month: 'Mar', attendance: 91 },
  { month: 'Apr', attendance: 95 },
  { month: 'May', attendance: 93 },
  { month: 'Jun', attendance: 96 },
];

const AdminOverview = () => {
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    incompleteProfiles: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get dashboard data
    setTimeout(() => {
      setStatsData({
        totalStudents: 143,
        totalTeachers: 12,
        totalIncome: 41900,
        totalExpenses: 32300,
        balance: 9600,
        incompleteProfiles: 8
      });
      setIsLoading(false);
    }, 1000);
    
    // In a real implementation, you would call your backend API
    // fetchDashboardData();
  }, []);

  // Function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : statsData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across all classes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Teaching Staff
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : statsData.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Faculty members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Financial Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : formatCurrency(statsData.balance)}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.balance > 0 ? '+' : ''}{isLoading ? '...' : ((statsData.balance / statsData.totalIncome) * 100).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Incomplete Profiles
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : statsData.incompleteProfiles}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Finances</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span>Teachers</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Income vs. expenses for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockFinancialData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#4f46e5" />
                      <Bar dataKey="expenses" name="Expenses" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Students per class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockClassDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockClassDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Students']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Latest updates and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-school-light p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-school-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Upcoming Parent-Teacher Meeting</p>
                      <p className="text-sm text-muted-foreground">Scheduled for next Friday at 3:00 PM.</p>
                      <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-school-light p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-school-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Student Information Update Required</p>
                      <p className="text-sm text-muted-foreground">8 student profiles need additional information.</p>
                      <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-school-light p-2 rounded-full">
                      <DollarSign className="h-5 w-5 text-school-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Financial Report Ready</p>
                      <p className="text-sm text-muted-foreground">The monthly financial report is ready for review.</p>
                      <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>Monthly attendance rates (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={mockStudentAttendance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[85, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                      <Line type="monotone" dataKey="attendance" name="Attendance Rate" stroke="#a855f7" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="finances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Detailed financial information will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will contain detailed financial reports, budgets, and transaction history.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Detailed student information will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will contain student enrollment data, academic performance, and demographic information.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Information</CardTitle>
              <CardDescription>Detailed teacher information will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will contain teacher profiles, assignments, performance metrics, and schedules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOverview;
