
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Plus, 
  BookOpen,
  Users,
  Eye
} from "lucide-react";
import { ProgressCircle } from './ProgressCircle';

// Progress Circle Component for reuse
const ProgressCircle = ({ value, size = 40, strokeWidth = 4 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-600"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{value}%</span>
      </div>
    </div>
  );
};

// Mock assignments data
const assignmentsData = {
  active: [
    { 
      id: 1, 
      title: 'Linear Equations Problem Set', 
      classCode: 'MATH-9A', 
      section: '9A',
      subject: 'Mathematics',
      assignedDate: '2024-04-05',
      dueDate: '2024-04-15',
      totalStudents: 32,
      submitted: 18,
      graded: 12
    },
    { 
      id: 2, 
      title: 'Quadratic Functions Quiz', 
      classCode: 'MATH-10B', 
      section: '10B',
      subject: 'Mathematics',
      assignedDate: '2024-04-08',
      dueDate: '2024-04-12',
      totalStudents: 28,
      submitted: 20,
      graded: 15
    },
    { 
      id: 3, 
      title: 'Calculus Integration Exercises', 
      classCode: 'MATH-12A', 
      section: '12A',
      subject: 'Advanced Mathematics',
      assignedDate: '2024-04-10',
      dueDate: '2024-04-20',
      totalStudents: 25,
      submitted: 5,
      graded: 0
    },
  ],
  past: [
    { 
      id: 4, 
      title: 'Coordinate Geometry Test', 
      classCode: 'MATH-9A', 
      section: '9A',
      subject: 'Mathematics',
      assignedDate: '2024-03-15',
      dueDate: '2024-03-25',
      totalStudents: 32,
      submitted: 30,
      graded: 30
    },
    { 
      id: 5, 
      title: 'Trigonometry Problem Set', 
      classCode: 'MATH-10B', 
      section: '10B',
      subject: 'Mathematics',
      assignedDate: '2024-03-10',
      dueDate: '2024-03-20',
      totalStudents: 28,
      submitted: 26,
      graded: 26
    },
    { 
      id: 6, 
      title: 'Algebra Mid-term Exam', 
      classCode: 'MATH-11C', 
      section: '11C',
      subject: 'Mathematics',
      assignedDate: '2024-03-05',
      dueDate: '2024-03-05',
      totalStudents: 30,
      submitted: 30,
      graded: 30
    },
  ],
  draft: [
    { 
      id: 7, 
      title: 'Statistics Fundamentals', 
      classCode: 'MATH-10A', 
      section: '10A',
      subject: 'Mathematics',
      lastEdited: '2024-04-09',
    },
    { 
      id: 8, 
      title: 'Probability Word Problems', 
      classCode: 'MATH-9B', 
      section: '9B',
      subject: 'Mathematics',
      lastEdited: '2024-04-07',
    },
  ]
};

const StaffAssignmentsCard = () => {
  const [activeTab, setActiveTab] = useState('active');

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 }
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>
                Manage and track student assignments
              </CardDescription>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Assignment</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Active</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Past</span>
              </TabsTrigger>
              <TabsTrigger value="draft" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Drafts</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {assignmentsData.active.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No active assignments</p>
                ) : (
                  assignmentsData.active.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <Badge variant="outline">{assignment.section}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{assignment.classCode}</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-500">{assignment.subject}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Assigned: {assignment.assignedDate}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>Due: {assignment.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <ProgressCircle 
                              value={Math.round((assignment.submitted / assignment.totalStudents) * 100)} 
                            />
                            <p className="text-xs text-gray-500 mt-1">Submitted</p>
                          </div>
                          <div className="text-center">
                            <ProgressCircle 
                              value={Math.round((assignment.graded / assignment.totalStudents) * 100)} 
                            />
                            <p className="text-xs text-gray-500 mt-1">Graded</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex mt-4 space-x-2">
                        <Button size="sm" variant="default" className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>View Submissions</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Assignment Details</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{assignment.submitted}/{assignment.totalStudents} Submitted</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="past">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {assignmentsData.past.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No past assignments</p>
                ) : (
                  assignmentsData.past.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <Badge variant="outline">{assignment.section}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{assignment.classCode}</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-500">{assignment.subject}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Assigned: {assignment.assignedDate}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>Due: {assignment.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex mt-4 space-x-2">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>View Summary</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Assignment Details</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{assignment.submitted}/{assignment.totalStudents} Submitted</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="draft">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {assignmentsData.draft.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No draft assignments</p>
                ) : (
                  assignmentsData.draft.map((draft) => (
                    <motion.div
                      key={draft.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{draft.title}</h4>
                            <Badge variant="outline">{draft.section}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{draft.classCode}</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-sm text-gray-500">{draft.subject}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>Last edited: {draft.lastEdited}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">Draft</Badge>
                      </div>
                      <div className="flex mt-4 space-x-2">
                        <Button size="sm" className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>Continue Editing</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StaffAssignmentsCard;
