import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StudioProvider, useStudio } from "./StudioContext";
import StudioLayout from "./StudioLayout";
import { EmptyState, FeedbackProvider } from "./ui";
import { ShieldOff } from "lucide-react";
import AdminsPage from "./pages/AdminsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import BuilderPickerPage from "./pages/BuilderPickerPage";
import ContentEditorPage from "./pages/ContentEditorPage";
import ContentListPage from "./pages/ContentListPage";
import ContentTypeWorkspace from "./pages/ContentTypeWorkspace";
import CreateFormPage from "./pages/CreateFormPage";
import DashboardPage from "./pages/DashboardPage";
import FormsPage from "./pages/FormsPage";
import MediaPage from "./pages/MediaPage";
import PermissionsPage from "./pages/PermissionsPage";
import PreviewCenterPage from "./pages/PreviewCenterPage";
import ResponseFormEditorPage from "./pages/ResponseFormEditorPage";
import SettingsPage from "./pages/SettingsPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import TemplatesPage from "./pages/TemplatesPage";

// The Form Builder app, mounted at /form-builder/* inside the portal (same
// server, same Edeco session). The server enforces every permission; these
// guards only keep people from landing on screens they can't use.

const Guard = ({ allow, superOnly = false, children }) => {
  const { can, isSuperAdmin } = useStudio();
  const permitted = superOnly ? isSuperAdmin : can(...allow);
  if (!permitted) {
    return <EmptyState icon={ShieldOff} title="You don't have access to this" description="Ask the super admin to grant you the permission if you need it." />;
  }
  return children;
};

const StudioApp = () => (
  <FeedbackProvider>
    <StudioProvider>
      <Routes>
        <Route element={<StudioLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="content" element={<Guard allow={["content.read"]}><ContentListPage /></Guard>} />
          <Route path="content/new" element={<Guard allow={["content.write"]}><ContentEditorPage /></Guard>} />
          <Route path="content/:id" element={<Guard allow={["content.read"]}><ContentEditorPage /></Guard>} />

          <Route path="forms" element={<Guard allow={["schema.read"]}><FormsPage /></Guard>} />
          <Route path="forms/new" element={<Guard allow={["schema.write"]}><CreateFormPage /></Guard>} />
          <Route path="forms/:id" element={<Guard allow={["schema.read"]}><ResponseFormEditorPage /></Guard>} />
          <Route path="templates" element={<Guard allow={["schema.read"]}><TemplatesPage /></Guard>} />
          <Route path="types/:id" element={<Navigate to="form" replace />} />
          <Route path="types/:id/:tab" element={<Guard allow={["schema.read"]}><ContentTypeWorkspace /></Guard>} />

          <Route path="cards" element={<Guard allow={["schema.read"]}><BuilderPickerPage target="card" /></Guard>} />
          <Route path="pages" element={<Guard allow={["schema.read"]}><BuilderPickerPage target="page" /></Guard>} />
          <Route path="presentation" element={<Guard allow={["schema.read"]}><BuilderPickerPage target="presentation" /></Guard>} />
          <Route path="preview" element={<Guard allow={["schema.read", "content.read"]}><PreviewCenterPage /></Guard>} />

          <Route path="submissions" element={<Guard allow={["submissions.read"]}><SubmissionsPage /></Guard>} />
          <Route path="media" element={<Guard allow={["media.manage", "content.write"]}><MediaPage /></Guard>} />
          <Route path="analytics" element={<Guard allow={["analytics.read"]}><AnalyticsPage /></Guard>} />

          <Route path="admins" element={<Guard superOnly><AdminsPage /></Guard>} />
          <Route path="permissions" element={<Guard superOnly><PermissionsPage /></Guard>} />
          <Route path="audit-logs" element={<Guard allow={["audit.read"]}><AuditLogsPage /></Guard>} />
          <Route path="settings" element={<Guard superOnly><SettingsPage /></Guard>} />
          <Route path="*" element={<Navigate to="/form-builder" replace />} />
        </Route>
      </Routes>
    </StudioProvider>
  </FeedbackProvider>
);

export default StudioApp;
