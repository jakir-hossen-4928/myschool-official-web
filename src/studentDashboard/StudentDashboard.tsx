
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Download,
  Bell,
  User,
  BarChart2,
  Award,
  CheckCircle2
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Mock data for assignments
  const assignments = [
    {
      id: 1,
      subject: "Mathematics",
      title: "Linear Equations Problems",
      dueDate: "May 12, 2023",
      status: "pending"
    },
    {
      id: 2,
      subject: "Science",
      title: "Lab Report: Photosynthesis",
      dueDate: "May 10, 2023",
      status: "completed"
    },
    {
      id: 3,
      subject: "History",
      title: "Essay on Industrial Revolution",
      dueDate: "May 15, 2023",
      status: "pending"
    }
  ];

  // Mock data for upcoming classes
  const classes = [
    {
      id: 1,
      subject: "Mathematics",
      time: "09:00 - 10:00 AM",
      teacher: "Mr. Rahman",
      room: "Room 102"
    },
    {
      id: 2,
      subject: "Science",
      time: "10:15 - 11:15 AM",
      teacher: "Mrs. Begum",
      room: "Lab 3"
    },
    {
      id: 3,
      subject: "English",
      time: "11:30 - 12:30 PM",
      teacher: "Ms. Chowdhury",
      room: "Room 105"
    }
  ];

  // Mock data for resources
  const resources = [
    {
      id: 1,
      title: "Mathematics Textbook PDF",
      type: "PDF",
      size: "10.5 MB"
    },
    {
      id: 2,
      title: "Science Lab Guide",
      type: "PDF",
      size: "8.2 MB"
    },
    {
      id: 3,
      title: "English Grammar Notes",
      type: "DOCX",
      size: "2.7 MB"
    }
  ];

  // Mock data for attendance
  const attendancePercentage = 92;

  return (
    <motion.div 
      className="p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, Anika!</h1>
            <p className="text-muted-foreground">Class 9 | Roll: 15 | ID: S20230015</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
              <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold text-white bg-red-500 rounded-full">
                3
              </span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Profile</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage}%</div>
              <Progress value={attendancePercentage} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">You've attended 46 out of 50 school days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 Pending</div>
              <p className="text-xs text-muted-foreground">Out of 15 total assignments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">May 20</div>
              <p className="text-xs text-muted-foreground">Mathematics - Chapter 6 & 7</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">A (85%)</div>
              <p className="text-xs text-muted-foreground">Position: 5th in class</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Classes */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  Today's Classes
                </CardTitle>
                <Button variant="ghost" size="sm">View Schedule</Button>
              </div>
              <CardDescription>Wednesday, May 10, 2023</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{cls.subject}</p>
                          <p className="text-sm text-muted-foreground">{cls.teacher} • {cls.room}</p>
                        </div>
                        <span className="text-sm font-medium">{cls.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assignments */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
                  Assignments
                </CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <CardDescription>Your pending and completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                    <div className={`p-2 ${
                      assignment.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'
                    } rounded-full`}>
                      {assignment.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">Due: {assignment.dueDate}</span>
                          {assignment.status === 'completed' && (
                            <span className="block text-xs text-green-600 font-medium">Completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Results */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-gray-500" />
                  Recent Results
                </CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <CardDescription>Your recent exam and test scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">Mathematics Test</p>
                      <p className="text-xs text-muted-foreground">Chapter 5 - Linear Equations</p>
                    </div>
                    <div className="bg-green-100 px-2 py-1 rounded text-green-700 text-sm font-medium">
                      92%
                    </div>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">Science Quiz</p>
                      <p className="text-xs text-muted-foreground">Unit 3 - Electricity</p>
                    </div>
                    <div className="bg-green-100 px-2 py-1 rounded text-green-700 text-sm font-medium">
                      85%
                    </div>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">English Essay</p>
                      <p className="text-xs text-muted-foreground">Creative Writing - Narrative</p>
                    </div>
                    <div className="bg-amber-100 px-2 py-1 rounded text-amber-700 text-sm font-medium">
                      78%
                    </div>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resources */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-gray-500" />
                  Resources
                </CardTitle>
                <Button variant="ghost" size="sm">Browse Library</Button>
              </div>
              <CardDescription>Study materials and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">{resource.type} • {resource.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full">Request Study Materials</Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <Award className="h-5 w-5 mr-2 text-gray-500" />
                Achievements
              </CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <CardDescription>Your latest recognitions and badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto py-2">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center space-y-2 min-w-[100px]"
              >
                <div className="p-3 bg-amber-100 rounded-full">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-center">Perfect Attendance</span>
                <span className="text-xs text-muted-foreground">April 2023</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center space-y-2 min-w-[100px]"
              >
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart2 className="h-8 w-8 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-center">Math Whiz</span>
                <span className="text-xs text-muted-foreground">March 2023</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center space-y-2 min-w-[100px]"
              >
                <div className="p-3 bg-green-100 rounded-full">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                <span className="text-sm font-medium text-center">Avid Reader</span>
                <span className="text-xs text-muted-foreground">February 2023</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center space-y-2 min-w-[100px]"
              >
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-center">Science Fair Winner</span>
                <span className="text-xs text-muted-foreground">January 2023</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboard;
