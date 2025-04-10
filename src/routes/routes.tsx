import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import StudentDataCollection from "@/components/StudentDataCollection";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminLogin } from "@/authentication/AdminLogin";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import PublicLayout from "@/components/layout/PublicLayout";
import Assets from "@/components/Assets";

// Lazy-loaded admin components
const FundTracker = lazy(() => import("@/adminDasboard/accounts/FundTraker"));
const AcademicRoutine = lazy(() => import("@/adminDasboard/academic/AcademicRoutine"));
const AdminOverview = lazy(() => import("@/components/AdminOverview"));
const TeachersPanel = lazy(() => import("@/adminDasboard/teachers/TeachersPanel"));
const SmsService = lazy(() => import("@/adminDasboard/smsservcie/SmsService"));
const MySchoolChat = lazy(() => import("@/adminDasboard/myschool-chat/MySchoolChat"));
const Students = lazy(() => import("@/adminDasboard/students/Studnents"));
const ContentGanarator = lazy(() => import("@/adminDasboard/contentganarate/ContentGanarator"));
const Loading = lazy(() => import("@/components/loader/Loading"));

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes with Navbar and Footer */}
      <Route element={<PublicLayout />}>
      <Route path="/" element={<Index />} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/submit-student-data" element={<StudentDataCollection />} />
      </Route>

      <Route path="/admin-login" element={<AdminLogin />} />

      <Route
      path="/admin"
      element={
        <ProtectedRoute>
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
        path="/admin/student-management"
        element={
        <Suspense fallback={<Loading />}>
          <Students />
        </Suspense>
        }
      />
      <Route
        path="/admin/accounts&fund"
        element={
        <Suspense fallback={<Loading />}>
          <FundTracker />
        </Suspense>
        }
      />
      <Route
        path="/admin/academic"
        element={
        <Suspense fallback={<Loading />}>
          <AcademicRoutine />
        </Suspense>
        }
      />
      <Route
        path="/admin/staff"
        element={
        <Suspense fallback={<Loading />}>
          <TeachersPanel />
        </Suspense>
        }
      />
      <Route
        path="/admin/sms-service"
        element={
        <Suspense fallback={<Loading />}>
          <SmsService />
        </Suspense>
        }
      />
      <Route
        path="/admin/myschool-suite"
        element={
        <Suspense fallback={<Loading />}>
          <ContentGanarator />
        </Suspense>
        }
      />
      <Route
        path="/admin/myschool-ai"
        element={
        <Suspense fallback={<Loading />}>
          <MySchoolChat />
        </Suspense>
        }
      />
      </Route>
    </Routes>
  );
};

export default AppRoutes;