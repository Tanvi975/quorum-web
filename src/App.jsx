import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import DashboardBackground from "./components/DashboardBackground";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import SSO from "./pages/SSO";
import VerifyCode from "./pages/VerifyCode";
import SetNewPassword from "./pages/SetNewPassword";
import OnboardingStep1 from "./pages/onboarding/OnboardingStep1";
import VideoCall from "./pages/VideoCall";
import Organization from "./pages/Organization";
import CreateOrganization from "./pages/organization/CreateOrganization";
import Chat from "./pages/Chat";
import Communities from "./pages/communities/Communities";
import JoinOrganization from "./pages/organization/JoinOrganization";
import CommunityDetails from "./pages/communities/CommunityDetails";
import CommunityInvite from "./pages/communities/CommunityInvite";
import OrganizationsList from "./pages/organization/OrganizationsList";
import OrganizationWorkspace from "./pages/organization/OrganizationWorkspace";
import InvitePreview from "./pages/organization/InvitePreview";
import QuorumAIAssistant from "./pages/ai/QuorumAIAssistant";
import Calendar from "./pages/Calendar";
import SavedItems from "./pages/SavedItems";
import MobileBottomNav from "./components/MobileBottomNav";
import CreateCommunity from "./pages/communities/CreateCommunity";
import LandingPage from "./pages/LandingPage";
import WhiteboardPage from "./pages/WhiteboardPage";
import { initCsrf } from "./services/api";
import Profile from "./components/Profile";
import JiraSettingsPage from "./pages/jira/JiraSettingsPage"; 
import MyJiraTicketsPage from "./pages/jira/MyJiraTicketsPage";
import MyJoinRequests from "./pages/communities/MyJoinRequests";
import MyGitHubPage from "./pages/github/MyGitHubPage";
import GitHubPage from "./pages/github/GitHubPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import InviteAcceptPage from "./components/projects/InviteAcceptPage";
import TaskBoard from "./components/projects/TaskBoard";
import ResourceList from "./components/projects/ResourceList";
import DocumentsPage from "./components/documents/DocumentsPage";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
function MeetRedirect() {
  const { code } = useParams();

  return (
    <Navigate
  to={`/video-call?code=${encodeURIComponent(code || "")}`}
  replace
/>
  );
}

function MeetingNotificationRedirect() {
  const { code } = useParams();

  return (
    <Navigate
      to={`/video-call?code=${encodeURIComponent(code || "")}`}
      replace
    />
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Checking session...</div>;
  }

  return <Navigate to={user ? "/dashboard" : "/landing"} replace />;
}
function ProfileRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Profile
      user={user || {}}
      onBack={() => navigate("/dashboard")}
    />
  );
}
function ProjectTasksRoute() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const currentUserId = user?.id || user?.userId || user?.sub;

  const role = (
    user?.role ||
    user?.organizationRole ||
    ""
  ).toUpperCase();

  const isManager = [
    "PROJECT_MANAGER",
    "ORG_ADMIN",
    "ORGANIZATION_ADMIN"
  ].includes(role);

  return (
    <TaskBoard
      projectId={projectId}
      isManager={isManager}
      currentUserId={currentUserId}
    />
  );
}

function ProjectResourcesRoute() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const role = (
    user?.role ||
    user?.organizationRole ||
    ""
  ).toUpperCase();

  const isManager = [
    "PROJECT_MANAGER",
    "ORG_ADMIN",
    "ORGANIZATION_ADMIN"
  ].includes(role);

  return (
    <ResourceList
      projectId={projectId}
      isManager={isManager}
    />
  );
}
function App() {
  useEffect(() => {
    initCsrf()
      .then(() => console.log("CSRF initialized"))
      .catch((err) =>
        console.error("CSRF initialization failed", err)
      );
  }, []);

  return (
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/background-preview"
            element={
              <div
                className="relative min-h-screen overflow-hidden"
                style={{ backgroundColor: "#062C5F" }}
              >
                <DashboardBackground />

                <div className="relative z-10 p-6 text-white">
                  <h1 className="text-2xl font-bold">
                    Dashboard Background Preview
                  </h1>
                </div>
              </div>
            }
          />

          <Route path="/" element={<HomeRedirect />} />
          <Route path="/landing" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/sso" element={<SSO />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />

          <Route path="/join/:token" element={<InvitePreview />} />
          <Route path="/invites/organization" element={<InvitePreview />} />
          <Route path="/communities/invites/:token" element={<CommunityInvite />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-call"
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whiteboards/:boardId"
            element={
              <ProtectedRoute>
                <WhiteboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meet/:code"
            element={
              <ProtectedRoute>
                <MeetRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings/:code"
            element={
              <ProtectedRoute>
                <MeetingNotificationRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
  path="/documents"
  element={
    <ProtectedRoute>
      <DocumentsPage />
    </ProtectedRoute>
  }
/>
          <Route
            path="/organizations"
            element={
              <ProtectedRoute>
                <OrganizationsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations/:organizationId"
            element={
              <ProtectedRoute>
                <OrganizationWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization"
            element={
              <ProtectedRoute>
                <Organization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/create"
            element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/join"
            element={
              <ProtectedRoute>
                <JoinOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities"
            element={
              <ProtectedRoute>
                <Communities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/create"
            element={
              <ProtectedRoute>
                <CreateCommunity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/:communityId"
            element={
              <ProtectedRoute>
                <CommunityDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/:communityId/posts/:postId"
            element={
              <ProtectedRoute>
                <CommunityDetails />
              </ProtectedRoute>
            }
          />
          <Route
  path="/my-join-requests"
  element={
    <ProtectedRoute>
      <MyJoinRequests />
    </ProtectedRoute>
  }
/>
          <Route
            path="/onboarding/step-1"
            element={
              <ProtectedRoute>
                <OnboardingStep1 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <QuorumAIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-items"
            element={
              <ProtectedRoute>
                <SavedItems />
              </ProtectedRoute>
            }
          />
            <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfileRoute />
    </ProtectedRoute>
  }

/>
           <Route
            path="/settings/integrations/jira"
            element={
              <ProtectedRoute>
                <JiraSettingsPage />
              </ProtectedRoute>
            }
          />
 <Route
  path="/github"
  element={
    <ProtectedRoute>
      <MyGitHubPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/settings/integrations/github"
  element={
    <ProtectedRoute>
      <GitHubPage />
    </ProtectedRoute>
  }
/>
          <Route
            path="/jira/my-tickets"
            element={
              <ProtectedRoute>
                <MyJiraTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/projects"
  element={
    <ProtectedRoute>
      <ProjectsPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/projects/:projectId"
  element={
    <ProtectedRoute>
      <ProjectDetailsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/projects/:projectId/tasks"
  element={
    <ProtectedRoute>
      <ProjectTasksRoute />
    </ProtectedRoute>
  }
/>

<Route
  path="/projects/:projectId/resources"
  element={
    <ProtectedRoute>
      <ProjectResourcesRoute />
    </ProtectedRoute>
  }
/>

<Route
  path="/accept-project-invite"
  element={
    <ProtectedRoute>
      <InviteAcceptPage />
    </ProtectedRoute>
  }
/>
<Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
