
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  LucideIcon,
  MessageCircle,
  Users,
  BookMarked,
  Award,
  BarChart2
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, icon: Icon, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon: Icon, color, onClick }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer h-full" onClick={onClick}>
        <CardHeader className="pb-2">
          <div className={`p-2 w-fit rounded-full ${color} mb-2`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

const StaffDashboard: React.FC = () => {
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

  // Mock functions for card actions
  const handleCardClick = (action: string) => {
    console.log(`Action clicked: ${action}`);
  };

  return (
    <motion.div 
      className="p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Teacher!</h1>
            <p className="text-muted-foreground">Here's what's happening with your classes today.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button>View Schedule</Button>
            <Button variant="outline">Upload Resources</Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Students"
            value="120"
            description="Total students in your classes"
            icon={Users}
            color="text-blue-500"
          />
          <StatsCard
            title="Classes Today"
            value="4"
            description="You have 4 classes scheduled"
            icon={Calendar}
            color="text-green-500"
          />
          <StatsCard
            title="Assignments"
            value="12"
            description="Pending assignments to grade"
            icon={FileText}
            color="text-orange-500"
          />
          <StatsCard
            title="Next Class"
            value="10:30 AM"
            description="Class 7 Mathematics"
            icon={Clock}
            color="text-purple-500"
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="Take Attendance"
            description="Mark attendance for today's classes"
            icon={Users}
            color="bg-blue-500"
            onClick={() => handleCardClick('attendance')}
          />
          <ActionCard
            title="Upload Lesson Plan"
            description="Share your lesson plans with students"
            icon={BookOpen}
            color="bg-green-500"
            onClick={() => handleCardClick('upload')}
          />
          <ActionCard
            title="Create Assignment"
            description="Assign homework to your classes"
            icon={FileText}
            color="bg-purple-500"
            onClick={() => handleCardClick('assignment')}
          />
          <ActionCard
            title="Grade Assignments"
            description="Review and grade submitted work"
            icon={Award}
            color="bg-orange-500"
            onClick={() => handleCardClick('grade')}
          />
          <ActionCard
            title="Student Performance"
            description="View analytics and reports"
            icon={BarChart2}
            color="bg-red-500"
            onClick={() => handleCardClick('performance')}
          />
          <ActionCard
            title="Send Messages"
            description="Communicate with students or parents"
            icon={MessageCircle}
            color="bg-cyan-500"
            onClick={() => handleCardClick('messages')}
          />
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Assignment Submissions</p>
                  <p className="text-sm text-muted-foreground">You have 5 new submissions for "Math Chapter 7"</p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Attendance Reminder</p>
                  <p className="text-sm text-muted-foreground">You haven't taken attendance for Class 9 today</p>
                  <p className="text-xs text-muted-foreground mt-1">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-purple-100 rounded-full">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-muted-foreground">You have 3 unread messages from parents</p>
                  <p className="text-xs text-muted-foreground mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Classes */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BookMarked className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Mathematics - Class 8</p>
                    <p className="text-sm text-muted-foreground">Chapter 5: Linear Equations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">08:30 - 09:30 AM</p>
                  <p className="text-sm text-muted-foreground">Room 102</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <BookMarked className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Science - Class 7</p>
                    <p className="text-sm text-muted-foreground">Chapter 3: Simple Machines</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">10:30 - 11:30 AM</p>
                  <p className="text-sm text-muted-foreground">Lab 2</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <BookMarked className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Mathematics - Class 6</p>
                    <p className="text-sm text-muted-foreground">Chapter 4: Fractions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">01:30 - 02:30 PM</p>
                  <p className="text-sm text-muted-foreground">Room 105</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StaffDashboard;
