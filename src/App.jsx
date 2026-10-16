import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { useEffect } from "react";
import api from "./services/api";
import VideoCall from "./pages/VideoCall";
import Organization from "./pages/Organization";
import CreateOrganization from "./pages/CreateOrganization";
import Chat from "./pages/Chat";
import Communities from "./pages/communities/Communities";
import JoinOrganization from "./pages/JoinOrganization";
import CommunityDetails from "./pages/communities/CommunityDetails";
import CommunityInvite from "./pages/communities/CommunityInvite";
import OrganizationsList from "./pages/organization/OrganizationsList";

function App() {
  useEffect(() => {
    api.get("/api/csrf-token")
      .then(() => console.log("CSRF initialized"))
      .catch((err) => console.error("CSRF initialization failed", err));
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/sso" element={<SSO />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/video-call" element={<VideoCall />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/organizations" element={<OrganizationsList />} />
          <Route
    path="/communities/invite/:token"
    element={<CommunityInvite />}
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
  path="/organization/join"
  element={<JoinOrganization />}
/>
          
          <Route path="/onboarding/step-1" element={<OnboardingStep1 />} />
          <Route
  path="/communities"
  element={<ProtectedRoute><Communities /></ProtectedRoute> }
/>
<Route path="/organization" element={<Organization />} />
<Route
  path="/organization/create"
  element={<CreateOrganization />}
/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;