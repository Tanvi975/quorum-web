import {
    FiEdit3,
    FiExternalLink,
    FiEye,
    FiFileText,
    FiUsers,
} from "react-icons/fi";

const permissionLabels = {
    READ: "View only",
    WRITE: "Can edit",
    OWNER: "Owner",
};

function Avatar({ user }) {
    const name = user?.name || "User";

    if (user?.avatar || user?.avatarUrl || user?.profileImage) {
        return (
            <img
                src={
                    user.avatar ||
                    user.avatarUrl ||
                    user.profileImage
                }
                alt={`${name}'s avatar`}
                className="h-10 w-10 shrink-0 rounded-full border border-[#52789E] object-cover"
                loading="lazy"
            />
        );
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#52789E] bg-[#2878D5] text-sm font-semibold text-white">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function DocumentDetailsPanel({
    document,
    onOpenWhiteboard,
}) {
    if (!document) return null;

    const collaborators = Array.isArray(document.collaborators)
        ? document.collaborators
        : [];

    const whiteboards = Array.isArray(document.whiteboards)
        ? document.whiteboards
        : [];

    return (
        <aside className="w-full min-w-0 space-y-4">
            <section className="rounded-xl border border-[#355D83] bg-[#142B45]/95 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.16)]">
                <div className="mb-4 flex items-center gap-2">
                    <FiUsers className="text-[#8CC4FF]" />

                    <h2 className="text-base font-semibold text-white">
                        Collaborators
                    </h2>

                    <span className="ml-auto rounded-full border border-[#52789E] bg-[#102D4B] px-2.5 py-1 text-xs text-[#C6EAFF]">
                        {collaborators.length}
                    </span>
                </div>

                {collaborators.length === 0 ? (
                    <p className="rounded-lg border border-[#355D83]/70 bg-[#102D4B]/80 p-4 text-center text-sm text-[#A9BED6]">
                        No collaborators listed for this document.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {collaborators.map((collaborator, index) => {
                            const person =
                                collaborator.user ||
                                collaborator.collaborator ||
                                collaborator;

                            const permission = String(
                                collaborator.permission ||
                                collaborator.userPermission ||
                                "READ"
                            ).toUpperCase();

                            const collaboratorId =
                                collaborator.id ||
                                collaborator.userId ||
                                person.id ||
                                person._id ||
                                `${
                                    person.email ||
                                    person.name ||
                                    "collaborator"
                                }-${index}`;

                            return (
                                <li
                                    key={collaboratorId}
                                    className="flex min-w-0 items-center gap-3"
                                >
                                    <Avatar user={person} />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-white">
                                            {person.name || "Unknown user"}
                                        </p>

                                        <p className="truncate text-xs text-[#A9BED6]">
                                            {person.email || "Email unavailable"}
                                        </p>
                                    </div>

                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#52789E] bg-[#102D4B] px-2 py-1 text-[11px] text-[#C6EAFF]">
                                        {permission === "READ" ? (
                                            <FiEye />
                                        ) : (
                                            <FiEdit3 />
                                        )}

                                        {permissionLabels[permission] ||
                                            permission}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="rounded-xl border border-[#355D83] bg-[#142B45]/95 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.16)]">
                <div className="mb-4 flex items-center gap-2">
                    <FiFileText className="text-[#8CC4FF]" />

                    <h2 className="text-base font-semibold text-white">
                        Embedded whiteboards
                    </h2>

                    <span className="ml-auto rounded-full border border-[#52789E] bg-[#102D4B] px-2.5 py-1 text-xs text-[#C6EAFF]">
                        {whiteboards.length}
                    </span>
                </div>

                {whiteboards.length === 0 ? (
                    <p className="rounded-lg border border-[#355D83]/70 bg-[#102D4B]/80 p-4 text-center text-sm text-[#A9BED6]">
                        No whiteboards attached to this document.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {whiteboards.map((item, index) => {
                            const board = item.whiteboard || item;

                            const boardId =
                                item.whiteboardId ||
                                board.id ||
                                board._id;

                            return (
                                <li
                                    key={
                                        item.id ||
                                        boardId ||
                                        `whiteboard-${index}`
                                    }
                                >
                                    <button
                                        type="button"
                                        disabled={
                                            !boardId ||
                                            !onOpenWhiteboard
                                        }
                                        onClick={() =>
                                            onOpenWhiteboard?.(
                                                boardId,
                                                board
                                            )
                                        }
                                        className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-lg border border-[#355D83] bg-[#102D4B]/70 p-3 text-left transition hover:border-[#65A7FF] hover:bg-[#24476B] disabled:cursor-default disabled:opacity-60"
                                    >
                                        <FiFileText className="shrink-0 text-[#8CC4FF]" />

                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#EAF2FF]">
                                            {board.name ||
                                                board.title ||
                                                "Untitled whiteboard"}
                                        </span>

                                        <FiExternalLink className="shrink-0 text-[#9EB5CF]" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </aside>
    );
}