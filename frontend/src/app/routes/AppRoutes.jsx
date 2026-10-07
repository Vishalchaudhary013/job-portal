import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import CareerServicesPage from "../../features/career-services/pages/CareerServicesPage";
import InternshipPage from "../../features/internship/pages/InternshipPage";
import InternshipDetailsPage from "../../features/internship/pages/InternshipDetailsPage";
import JobsPage from "../../features/job/pages/JobsPage";
import JobDetailsPage from "../../features/job/pages/JobDetailsPage";
import ApprenticeshipsPage from "../../features/apprenticeship/pages/ApprenticeshipsPage";
import ApprenticeshipDetailsPage from "../../features/apprenticeship/pages/ApprenticeshipDetailsPage";
import Login from "../../features/auth/pages/Login";
import Signup from "../../features/auth/pages/Signup";
import ForgetPassword from "../../features/auth/pages/ForgetPassword";
import ChooseSignup from "../../features/auth/components/ChooseSignup";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";
import AdminOpportunityFormPage from "../../features/admin/pages/AdminOpportunityFormPage";
import ApplicationFormBuilderPage from "../../features/form-builder/pages/ApplicationFormBuilderPage";
import SuperAdminDashboard from "../../features/superadmin/pages/SuperAdminDashboard";
import NotFound from "../../pages/NotFound";

// Career Services portal — same paths as the main Edeco app so copied pages
// and links work unchanged. Anything not listed falls through to NotFound,
// which forwards to the main Edeco site (VITE_EDECO_URL).
const AppRoutes = () => {
  return (
    <Routes>
      {/* The landing page is the portal home. Copied links to the main app's
          /career-services path redirect here. */}
      <Route path="/" element={<CareerServicesPage />} />
      <Route path="/career-services" element={<Navigate to="/" replace />} />
      <Route path="/intership" element={<InternshipPage />} />
      <Route path="/internship" element={<InternshipPage />} />
      <Route path="/intership/:id" element={<InternshipDetailsPage />} />
      <Route path="/internship/:id" element={<InternshipDetailsPage />} />
      <Route path="/job" element={<JobsPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/job/:id" element={<JobDetailsPage />} />
      <Route path="/jobs/:id" element={<JobDetailsPage />} />
      {/* Placeholder so the navbar's "Jobs by City" link doesn't fall through to
          NotFound — it renders the jobs listing until the city view is built. */}
      <Route path="/jobs-by-city" element={<JobsPage />} />
      <Route path="/apprenticeship" element={<ApprenticeshipsPage />} />
      <Route path="/apprenticeships" element={<ApprenticeshipsPage />} />
      <Route path="/apprenticeship/:id" element={<ApprenticeshipDetailsPage />} />
      <Route path="/apprenticeships/:id" element={<ApprenticeshipDetailsPage />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/choose-signup" element={<ChooseSignup />} />
      <Route path="/forget-password" element={<ForgetPassword />} />

      {/* Admin / Super Admin dashboards — same screens and paths as Edeco. */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "super_admin"]} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-dashboard/create-internship" element={<AdminOpportunityFormPage />} />
        <Route path="/admin-dashboard/edit-opportunity/:id" element={<AdminOpportunityFormPage />} />
        <Route path="/admin-dashboard/build-form/:id" element={<ApplicationFormBuilderPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin-dashboard/create-internship" element={<AdminOpportunityFormPage />} />
        <Route path="/super-admin-dashboard/edit-opportunity/:id" element={<AdminOpportunityFormPage />} />
        <Route path="/super-admin-dashboard/build-form/:id" element={<ApplicationFormBuilderPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
