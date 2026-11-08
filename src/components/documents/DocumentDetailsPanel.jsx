
import { FiFileText, FiUsers, FiEye, FiEdit3, FiExternalLink } from "react-icons/fi";

const permissionLabel = {
    READ: "View only",
    WRITE: "Can edit",
    OWNER: "Owner",
};

function Avatar({ user }) {
    const name = user?.name || "User";

    if (user?.avatar) {
        return (
            <img
                src={user.avatar}
                alt={`${name}'s avatar`}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                loading="lazy"
            />
        );
    }

    return (
        <div
            aria-label={name}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        >
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
        <aside className="w-full min-w-0 space-y-5">
            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-4 flex items-center gap-2">
                    <FiUsers className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Collaborators
                    </h2>
                    <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {collaborators.length}
                    </span>
                </div>

                {collaborators.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        No collaborators added yet.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {collaborators.map((collaborator) => {
                            const person = collaborator.user || {};
                            const permission = String(
                                collaborator.permission || "READ"
                            ).toUpperCase();

                            return (
                                <li
                                    key={
                                        collaborator.id ||
                                        collaborator.userId
                                    }
                                    className="flex min-w-0 items-center gap-3"
                                >
                                    <Avatar user={person} />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                            {person.name || "Unknown user"}
                                        </p>
                                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                            {person.email || "Email unavailable"}
                                        </p>
                                    </div>

                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {permission === "READ" ? (
                                            <FiEye />
                                        ) : (
                                            <FiEdit3 />
                                        )}
                                        {permissionLabel[permission] || permission}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-4 flex items-center gap-2">
                    <FiFileText className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Embedded Whiteboards
                    </h2>
                    <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {whiteboards.length}
                    </span>
                </div>

                {whiteboards.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        No whiteboards attached to this document.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {whiteboards.map((item) => {
                            const board = item.whiteboard || {};
                            const boardId =
                                item.whiteboardId || board.id;

                            return (
                                <li key={item.id || boardId}>
                                    <button
                                        type="button"
                                        disabled={
                                            !boardId ||
                                            !onOpenWhiteboard
                                        }
                                        onClick={() =>
                                            onOpenWhiteboard?.(boardId, board)
                                        }
                                        className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-lg border border-gray-100 p-3 text-left transition hover:bg-gray-50 disabled:cursor-default dark:border-gray-800 dark:hover:bg-gray-800"
                                    >
                                        <FiFileText className="shrink-0 text-gray-500" />

                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {board.name || "Untitled whiteboard"}
                                        </span>

                                        <FiExternalLink className="shrink-0 text-gray-400" />
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
