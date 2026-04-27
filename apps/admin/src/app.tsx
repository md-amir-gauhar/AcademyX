import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/app-layout";
import { useEffect } from "react";
import { configureAuthBridge } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { VerifyEmailPage } from "@/features/auth/verify-email-page";
import { SetPasswordPage } from "@/features/auth/set-password-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { BatchesPage } from "@/features/batches/batches-page";
import { TeachersPage } from "@/features/teachers/teachers-page";
import { CurriculumPage } from "@/features/subjects/curriculum-page";
import { SchedulesPage } from "@/features/schedules/schedules-page";
import { TestSeriesPage } from "@/features/test-series/test-series-page";
import { TestsPage } from "@/features/tests/tests-page";
import { TestBuilderPage } from "@/features/tests/test-builder-page";
import { CreateQuestionsPage } from "@/features/tests/create-questions-page";
import { EditQuestionPage } from "@/features/tests/edit-question-page";
import { UsersPage } from "@/features/users/users-page";
import { SettingsPage } from "@/features/org-config/settings-page";
import { CachePage } from "@/features/cache/cache-page";
import { UploadPage } from "@/features/upload/upload-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthBridgeSetup() {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    configureAuthBridge({
      getToken: () => useAuthStore.getState().token,
      onUnauthorized: () => {
        logout();
        window.location.href = "/login";
      },
    });
  }, [logout]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthBridgeSetup />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />

            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/curriculum" element={<CurriculumPage />} />
              <Route path="/schedules" element={<SchedulesPage />} />
              <Route path="/test-series" element={<TestSeriesPage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route
                path="/tests/:testId/builder"
                element={<TestBuilderPage />}
              />
              <Route
                path="/tests/:testId/sections/:sectionId/questions/new"
                element={<CreateQuestionsPage />}
              />
              <Route
                path="/tests/questions/:questionId/edit"
                element={<EditQuestionPage />}
              />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/cache" element={<CachePage />} />
              <Route path="/uploads" element={<UploadPage />} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
