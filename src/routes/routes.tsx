import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loading from "@/components/loader/Loading";

// Layouts
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const StaffLayout = lazy(() => import("@/components/layout/StaffLayout"));
const StudentLayout = lazy(() => import("@/components/layout/StudentLayout"));
const PublicLayout = lazy(() => import("@/components/layout/PublicLayout"));



// Authentication
const ProtectedRoute = lazy(() => import("@/routes/ProtectedRoute"));
const Login = lazy(() => import("@/authentication/Login"));
const SignUp = lazy(() => import("@/authentication/SignUp"));
const ResetPassword = lazy(() => import("@/authentication/ResetPassword"));
const PendingVerification = lazy(() => import("@/authentication/PendingVerification"));
const Unauthorized = lazy(() => import("@/authentication/Unauthorized"));

// Public pages
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const StudentDataCollection = lazy(() => import("@/components/StudentDataCollection"));
const Assets = lazy(() => import("@/components/Assets"));
const UserVerify = lazy(() => import("@/adminDasboard/usersverify/UserVerify"));
const StaffProfile = lazy(() => import("@/staffDashboard/components/StaffProfile"));
const StudentProfile = lazy(() => import("@/studentDashboard/components/StudentProfile"));

// Lazy-loaded admin components
const AdminOverview = lazy(() => import("@/adminDasboard/adminOverview/AdminOverview"));
const Students = lazy(() => import("@/adminDasboard/students/Studnents"));
const FundTracker = lazy(() => import("@/adminDasboard/accounts/FundTraker"));
const AcademicRoutine = lazy(() => import("@/adminDasboard/academic/AcademicRoutine"));
const TeachersPanel = lazy(() => import("@/adminDasboard/teachers/TeachersPanel"));
const SmsService = lazy(() => import("@/adminDasboard/smsservcie/SmsService"));
const ContentGanarator = lazy(() => import("@/adminDasboard/contentganarate/ContentGanarator"));
const AssetsManegment = lazy(() => import("@/adminDasboard/assestManegment/AssetsManegment"));
const Marketing = lazy(() => import("@/adminDasboard/marketing/Marketing"));

// Lazy-loaded staff components
const StaffDashboard = lazy(() => import("@/staffDashboard/StaffDashboard"));
const TodoList = lazy(() => import("@/components/TodoList"));

// Lazy-loaded student components
const StudentDashboard = lazy(() => import("@/studentDashboard/StudentDashboard"));

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <Suspense fallback={<Loading />}>
            <PublicLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<Loading />}>
              <Index />
            </Suspense>
          }
        />
        <Route
          path="assets"
          element={
            <Suspense fallback={<Loading />}>
              <Assets />
            </Suspense>
          }
        />

        <Route
          path="submit-student-data"
          element={
            <Suspense fallback={<Loading />}>
              <StudentDataCollection />
            </Suspense>
          }
        />
      </Route>

      {/* Authentication routes */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<Loading />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<Loading />}>
            <SignUp />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<Loading />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<Loading />}>
            <Unauthorized />
          </Suspense>
        }
      />
      <Route
        path="/pending-verification"
        element={
          <Suspense fallback={<Loading />}>
            <PendingVerification />
          </Suspense>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<Loading />}>
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          </Suspense>
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
              <UserVerify />
            </Suspense>
          }
        />
        <Route
          path="assets-management"
          element={
            <Suspense fallback={<Loading />}>
              <AssetsManegment />
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
          path="marketing"
          element={
            <Suspense fallback={<Loading />}>
              <Marketing />
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

      </Route>

      {/* Staff routes */}
      <Route
        path="/staff"
        element={
          <Suspense fallback={<Loading />}>
            <ProtectedRoute requiredRole="staff">
              <StaffLayout />
            </ProtectedRoute>
          </Suspense>
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
        <Route
          path="students"
          element={
            <Suspense fallback={<Loading />}>
              <Students />
            </Suspense>
          }
        />
        <Route
          path="tasks"
          element={
            <Suspense fallback={<Loading />}>
              <TodoList />
            </Suspense>
          }
        />
        <Route
          path="routine"
          element={
            <Suspense fallback={<Loading />}>
              <AcademicRoutine />
            </Suspense>
          }
        />
        <Route
          path="schedules"
          element={
            <Suspense fallback={<Loading />}>
              <div>Staff Schedules Page</div>
            </Suspense>
          }
        />
        <Route
          path="attendance"
          element={
            <Suspense fallback={<Loading />}>
              <div>Staff Attendance Page</div>
            </Suspense>
          }
        />
        <Route
          path="messages"
          element={
            <Suspense fallback={<Loading />}>
              <div>Staff Messages Page</div>
            </Suspense>
          }
        />
        <Route
          path="notifications"
          element={
            <Suspense fallback={<Loading />}>
              <div>Staff Notifications Page</div>
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<Loading />}>
              <StaffProfile />
            </Suspense>
          }
        />
      </Route>

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <Suspense fallback={<Loading />}>
            <ProtectedRoute requiredRole="student">
              <StudentLayout />
            </ProtectedRoute>
          </Suspense>
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
        <Route
          path="classes"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Classes Page</div>
            </Suspense>
          }
        />
        <Route
          path="tasks"
          element={
            <Suspense fallback={<Loading />}>
              <TodoList />
            </Suspense>
          }
        />
        <Route
          path="routine"
          element={
            <Suspense fallback={<Loading />}>
              <AcademicRoutine />
            </Suspense>
          }
        />
        <Route
          path="assignments"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Assignments Page</div>
            </Suspense>
          }
        />
        <Route
          path="grades"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Grades Page</div>
            </Suspense>
          }
        />
        <Route
          path="schedule"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Schedule Page</div>
            </Suspense>
          }
        />
        <Route
          path="resources"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Resources Page</div>
            </Suspense>
          }
        />
        <Route
          path="messages"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Messages Page</div>
            </Suspense>
          }
        />
        <Route
          path="notifications"
          element={
            <Suspense fallback={<Loading />}>
              <div>Student Notifications Page</div>
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<Loading />}>
              <StudentProfile />
            </Suspense>
          }
        />
      </Route>

      {/* Catch-all route */}
      <Route
        path="*"
        element={
          <Suspense fallback={<Loading />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRoutes;