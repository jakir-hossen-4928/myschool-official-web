
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import ProgressCircle from "./ProgressCircle";

// Fix the component content or create it if needed
const StaffAssignmentsCard = () => {
  const assignments = [
    { id: 1, title: "Grade Mid-Term Papers", status: "completed", dueDate: "2023-03-15" },
    { id: 2, title: "Prepare Lab Materials", status: "in-progress", dueDate: "2023-03-22" },
    { id: 3, title: "Submit Student Evaluations", status: "pending", dueDate: "2023-03-30" },
  ];

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (assignments.filter(a => a.status === "completed").length / assignments.length) * 100
  );

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-l-4 border-l-blue-500 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>Assignments & Tasks</span>
            <ProgressCircle 
              percentage={completionPercentage} 
              size={50} 
              strokeWidth={6}
              color="#3b82f6"
            >
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </ProgressCircle>
          </CardTitle>
          <CardDescription>Track your teaching assignments and tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {assignments.map((assignment, index) => (
              <motion.li 
                key={assignment.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(assignment.status)}
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    assignment.status === "completed" ? "bg-green-100 text-green-800" :
                    assignment.status === "in-progress" ? "bg-amber-100 text-amber-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {assignment.status === "completed" ? "Completed" :
                     assignment.status === "in-progress" ? "In Progress" : "Pending"}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="outline" className="w-full">
            View All Assignments
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default StaffAssignmentsCard;
