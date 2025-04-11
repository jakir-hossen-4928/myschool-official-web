import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loading from "@/components/loader/Loading";

// Layouts
import AdminLayout from "@/components/layout/AdminLayout";
import StaffLayout from "@/components/layout/StaffLayout";
import StudentLayout from "@/components/layout/StudentLayout";
import PublicLayout from "@/components/layout/PublicLayout";

// Authentication
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import Login from "@/authentication/Loging"; // Assuming 'Loging' is a typo; should be 'Login'
import SignUp from "@/authentication/SignUp";

// Public pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import StudentDataCollection from "@/components/StudentDataCollection";
import Assets from "@/components/Assets";
import ResetPassword from "@/authentication/ResetPassword";
import UserVerify from "@/adminDasboard/usersverify/UserVerify";

// Lazy-loaded admin components
const AdminOverview = lazy(() => import("@/adminDasboard/adminOverview/AdminOverview"));
const Students = lazy(() => import("@/adminDasboard/students/Studnents"));
const FundTracker = lazy(() => import("@/adminDasboard/accounts/FundTraker"));
const AcademicRoutine = lazy(() => import("@/adminDasboard/academic/AcademicRoutine"));
const TeachersPanel = lazy(() => import("@/adminDasboard/teachers/TeachersPanel"));
const SmsService = lazy(() => import("@/adminDasboard/smsservcie/SmsService"));
const ContentGanarator = lazy(() => import("@/adminDasboard/contentganarate/ContentGanarator"));
const MySchoolChat = lazy(() => import("@/adminDasboard/myschool-chat/MySchoolChat"));

// Lazy-loaded staff components
const StaffDashboard = lazy(() => import("@/staffDashboard/StaffDashboard"));

// Lazy-loaded student components
const StudentDashboard = lazy(() => import("@/studentDashboard/StudentDashboard"));

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Index />} />
        <Route path="assets" element={<Assets />} />
        <Route path="submit-student-data" element={<StudentDataCollection />} />
        <Route path="contact" element={<div>Contact Page</div>} />
      </Route>

      {/* Authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword ></ResetPassword>} />
      <Route path="/unauthorized" element={<div>Unauthorized Access - Please contact support</div>} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<Loading />}>
              <AdminOverview />
            </Suspense>
          }
        />
        <Route
          path="student-management"
          element={
            <Suspense fallback={<Loading />}>
              <Students />
            </Suspense>
          }
        />
        <Route
          path="users-management"
          element={
            <Suspense fallback={<Loading />}>
              <UserVerify/>
            </Suspense>
          }
        />
        <Route
          path="accounts&fund"
          element={
            <Suspense fallback={<Loading />}>
              <FundTracker />
            </Suspense>
          }
        />
        <Route
          path="academic"
          element={
            <Suspense fallback={<Loading />}>
              <AcademicRoutine />
            </Suspense>
          }
        />
        <Route
          path="staff"
          element={
            <Suspense fallback={<Loading />}>
              <TeachersPanel />
            </Suspense>
          }
        />
        <Route
          path="sms-service"
          element={
            <Suspense fallback={<Loading />}>
              <SmsService />
            </Suspense>
          }
        />
        <Route
          path="myschool-suite"
          element={
            <Suspense fallback={<Loading />}>
              <ContentGanarator />
            </Suspense>
          }
        />
        <Route
          path="myschool-ai"
          element={
            <Suspense fallback={<Loading />}>
              <MySchoolChat />
            </Suspense>
          }
        />
      </Route>

      {/* Staff routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute requiredRole="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<Loading />}>
              <StaffDashboard />
            </Suspense>
          }
        />
        <Route path="students" element={<div>Staff Students Page</div>} />
        <Route path="classes" element={<div>Staff Classes Page</div>} />
        <Route path="schedules" element={<div>Staff Schedules Page</div>} />
        <Route path="attendance" element={<div>Staff Attendance Page</div>} />
        <Route path="messages" element={<div>Staff Messages Page</div>} />
        <Route path="notifications" element={<div>Staff Notifications Page</div>} />
        <Route path="profile" element={<div>Staff Profile Page</div>} />
      </Route>

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<Loading />}>
              <StudentDashboard />
            </Suspense>
          }
        />
        <Route path="classes" element={<div>Student Classes Page</div>} />
        <Route path="assignments" element={<div>Student Assignments Page</div>} />
        <Route path="grades" element={<div>Student Grades Page</div>} />
        <Route path="schedule" element={<div>Student Schedule Page</div>} />
        <Route path="resources" element={<div>Student Resources Page</div>} />
        <Route path="messages" element={<div>Student Messages Page</div>} />
        <Route path="notifications" element={<div>Student Notifications Page</div>} />
        <Route path="profile" element={<div>Student Profile Page</div>} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;