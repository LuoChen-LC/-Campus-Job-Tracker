import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectsPage from "@/pages/ProjectsPage";
import QuestionsPage from "@/pages/QuestionsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
