import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";


import DashboardBackground from "./components/DashboardBackground";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
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

import api from "./services/api";

function MeetRedirect() {
  const { code } = useParams();

  return (
    <Navigate
      to={`/video-call?code=${encodeURIComponent(code || "")}&host=1`}
      replace
    />
  );
}

function App() {
  useEffect(() => {
    api
      .get("/api/csrf-token")
      .then(() => console.log("CSRF initialized"))
      .catch((err) =>
        console.error("CSRF initialization failed", err)
      );
  }, []);

  return (
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


          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/sso" element={<SSO />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />

          <Route path="/join/:token" element={<InvitePreview />} />
          <Route path="/invites/organization" element={<InvitePreview />} />
          <Route path="/communities/invites/:token" element={<CommunityInvite />} /> <Route
            path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> }/>
           <Route path="/video-call" element={ <ProtectedRoute><VideoCall /></ProtectedRoute> } />
           <Route path="/meet/:code"element={ <ProtectedRoute><MeetRedirect /> </ProtectedRoute>  } />
           <Route path="/chat" element={<ProtectedRoute><Chat /> </ProtectedRoute> }/>
          <Route path="/organizations" element={ <ProtectedRoute><OrganizationsList /></ProtectedRoute> }/>
           <Route path="/organizations/:organizationId" element={ <ProtectedRoute>
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
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
