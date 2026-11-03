import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";

export default function GitHubPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let target = "/organizations";
    try {
      const pending = JSON.parse(sessionStorage.getItem("pending_github_return") || "null");
      if (pending?.orgId && pending?.teamId) {
        target = `/organizations/${encodeURIComponent(pending.orgId)}?teamId=${encodeURIComponent(pending.teamId)}`;
      }
      sessionStorage.removeItem("pending_github_return");
    } catch {
      sessionStorage.removeItem("pending_github_return");
    }
    const status = searchParams.get("status");
    if (status === "error") target += `${target.includes("?") ? "&" : "?"}github=error`;
    navigate(target, { replace: true });
  }, [navigate, searchParams]);

  return <div className="flex min-h-screen items-center justify-center bg-[#0B1F39] text-white"><div className="flex items-center gap-3 text-sm"><FiRefreshCw className="animate-spin" /> Returning to your team...</div></div>;
}
