
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import WhiteboardWorkspace from "../components/WhiteboardWorkspace";

export default function WhiteboardPage() {
    const { boardId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const organizationId = searchParams.get("organizationId");

    const handleClose = () => {
        if (organizationId) {
            navigate(`/organizations/${organizationId}?tab=Whiteboards`);
            return;
        }

        navigate("/dashboard");
    };

    if (!boardId) {
        return <div className="min-h-screen bg-[#06182F] text-white flex items-center justify-center">Whiteboard not found.</div>;
    }

    return (
        <WhiteboardWorkspace
            initialBoardId={boardId}
            organizationId={organizationId}
            onClose={handleClose}
        />
    );
}
