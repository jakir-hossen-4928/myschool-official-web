
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Users, BookOpen, ClipboardEdit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock class schedule data
const classDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const classesData = {
  today: [
    { id: 1, className: 'Mathematics', classCode: 'MATH-9A', section: '9A', time: '08:30 AM - 09:30 AM', room: 'Room 105', students: 32 },
    { id: 2, className: 'Mathematics', classCode: 'MATH-10B', section: '10B', time: '10:00 AM - 11:00 AM', room: 'Room 203', students: 28 },
    { id: 3, className: 'Advanced Mathematics', classCode: 'MATH-12A', section: '12A', time: '12:30 PM - 01:30 PM', room: 'Room 301', students: 25 },
  ],
  upcoming: [
    { id: 4, className: 'Mathematics', classCode: 'MATH-11C', section: '11C', day: 'Tuesday', time: '09:30 AM - 10:30 AM', room: 'Room 201', students: 30 },
    { id: 5, className: 'Mathematics', classCode: 'MATH-9B', section: '9B', day: 'Tuesday', time: '11:15 AM - 12:15 PM', room: 'Room 105', students: 34 },
    { id: 6, className: 'Mathematics', classCode: 'MATH-10A', section: '10A', day: 'Wednesday', time: '08:30 AM - 09:30 AM', room: 'Room 202', students: 31 },
    { id: 7, className: 'Advanced Mathematics', classCode: 'MATH-12B', section: '12B', day: 'Wednesday', time: '12:30 PM - 01:30 PM', room: 'Room 301', students: 26 },
  ],
  weekly: classDays.map(day => ({
    day,
    classes: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      id: `${day}-${i}`,
      className: 'Mathematics',
      classCode: `MATH-${Math.floor(Math.random() * 4) + 9}${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
      time: `${Math.floor(Math.random() * 4) + 8}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
      room: `Room ${Math.floor(Math.random() * 5) + 101}`,
    }))
  }))
};

const StaffClassesCard = () => {
  const [activeTab, setActiveTab] = useState('today');

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
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
              <CardTitle>My Classes</CardTitle>
              <CardDescription>
                Manage your teaching schedule and class activities
              </CardDescription>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Full Schedule</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {classDays[new Date().getDay() - 1] && (
                  <h3 className="text-lg font-medium text-gray-700">
                    {classDays[new Date().getDay() - 1]}, {new Date().toLocaleDateString()}
                  </h3>
                )}
                
                {classesData.today.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No classes scheduled for today</p>
                ) : (
                  classesData.today.map((cls) => (
                    <motion.div
                      key={cls.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{cls.className}</h4>
                            <Badge variant="outline">{cls.section}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{cls.classCode}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{cls.time}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{cls.students} students</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={cn(
                            "bg-green-100 text-green-800 hover:bg-green-200",
                            new Date().getHours() >= 12 && "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          )}>
                            {new Date().getHours() < 12 ? 'Upcoming' : 'Completed'}
                          </Badge>
                          <div className="text-sm text-gray-600">{cls.room}</div>
                        </div>
                      </div>
                      <div className="flex mt-4 space-x-2">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Attendance</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Materials</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <ClipboardEdit className="h-4 w-4" />
                          <span>Assignments</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="upcoming">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {classesData.upcoming.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No upcoming classes scheduled</p>
                ) : (
                  classesData.upcoming.map((cls) => (
                    <motion.div
                      key={cls.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{cls.className}</h4>
                            <Badge variant="outline">{cls.section}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{cls.classCode}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{cls.day}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{cls.time}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{cls.students} students</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{cls.room}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="weekly">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesData.weekly.map(day => (
                  <motion.div
                    key={day.day}
                    variants={itemVariants}
                    className="border rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-700 mb-3">{day.day}</h4>
                    {day.classes.length === 0 ? (
                      <p className="text-gray-500 text-sm py-2">No classes</p>
                    ) : (
                      <div className="space-y-3">
                        {day.classes.map(cls => (
                          <div key={cls.id} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{cls.className}</div>
                              <Badge variant="outline">{cls.classCode}</Badge>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{cls.time}</span>
                              </div>
                              <div>{cls.room}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StaffClassesCard;
