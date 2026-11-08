import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProjectById } from "../../services/projectService";
import useProjectSocket from "../../hooks/useProjectSocket";
import {
    FiArrowLeft,
    FiPlus,
    FiX,
    FiFileText,
    FiFile,
    FiImage,
    FiLink,
    FiTrash2,
    FiExternalLink,
    FiSearch,
    FiAlertCircle,
    FiFolder,
    FiHardDrive,
    FiCalendar,
    FiRefreshCw,
    FiDownload
} from "react-icons/fi";
import {
    getProjectResources,
    addProjectResource,
    deleteProjectResource
} from "../../services/projectService";

export default function ResourceList({
    projectId,
    isManager = false
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversationId, setConversationId] = useState("");
    const [canManage, setCanManage] = useState(isManager);

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        title: "",
        fileUrl: "",
        fileName: "",
        fileType: "",
        fileSize: ""
    });

    const loadResources = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            setError("");

            const response = await getProjectResources(projectId);

            const data =
                response?.data?.data ??
                response?.data ??
                response;

            setResources(
                Array.isArray(data) ? data : data?.resources || []
            );
        } catch (err) {
            setError(
                "Unable to load project resources. Please try again."
            );
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        loadResources();
        getProjectById(projectId).then((response) => {
            if (!active) return;
            const project = response?.data?.data ?? response?.data ?? response;
            setConversationId(project?.conversation?.id || project?.conversationId || "");
            const members = Array.isArray(project?.members) ? project.members : [];
            const currentId = String(user?.id || user?.userId || user?.sub || "");
            const member = members.find((item) => String(item.user?.id || item.user?._id || "") === currentId);
            const role = String(member?.role || "").toUpperCase();
            setCanManage(isManager || role === "PROJECT_MANAGER" || ["ORG_ADMIN", "ORGANIZATION_ADMIN"].includes(String(user?.role || user?.organizationRole || "").toUpperCase()));
        }).catch(() => {
            if (active) setCanManage(isManager);
        });
        return () => { active = false; };
    }, [projectId, user, isManager]);

    useProjectSocket({
        conversationId,
        onResourceUpdated: () => loadResources(false)
    });

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const resetForm = () => {
        setForm({
            title: "",
            fileUrl: "",
            fileName: "",
            fileType: "",
            fileSize: ""
        });
    };

    const handleAddResource = async (e) => {
        e.preventDefault();

        try {
            setUploading(true);
            setError("");

            const payload = {
                title: form.title.trim(),
                fileUrl: form.fileUrl.trim(),
                fileName: form.fileName.trim(),
                fileType: form.fileType.trim(),
                fileSize: form.fileSize
                    ? Number(form.fileSize)
                    : undefined
            };

            await addProjectResource(projectId, payload);

            resetForm();
            setShowForm(false);
            await loadResources();
        } catch (err) {
            setError(
                "Could not add the resource. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (resourceId) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) {
            return;
        }

        try {
            setDeletingId(resourceId);
            setError("");

            await deleteProjectResource(projectId, resourceId);

            setResources((prev) =>
                prev.filter((resource) => resource.id !== resourceId)
            );
        } catch (err) {
            setError(
                "Could not delete the resource. Please try again."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const getFileIcon = (type = "", fileName = "") => {
        const value = `${type} ${fileName}`.toLowerCase();

        if (value.includes("pdf") || /\.pdf$/i.test(fileName)) {
            return FiFileText;
        }

        if (
            value.includes("image") ||
            /\.(png|jpg|jpeg|svg|webp)$/i.test(fileName)
        ) {
            return FiImage;
        }

        if (value.includes("link") || value.includes("url")) {
            return FiLink;
        }

        return FiFile;
    };

    const getFileColor = (type = "", fileName = "") => {
        const value = `${type} ${fileName}`.toLowerCase();

        if (value.includes("pdf")) {
            return "bg-rose-400/15 text-rose-200 border-rose-200/20";
        }

        if (value.includes("image")) {
            return "bg-purple-400/15 text-purple-200 border-purple-200/20";
        }

        if (value.includes("doc") || value.includes("word")) {
            return "bg-blue-400/15 text-blue-200 border-blue-200/20";
        }

        if (value.includes("link") || value.includes("url")) {
            return "bg-emerald-400/15 text-emerald-200 border-emerald-200/20";
        }

        return "bg-white/10 text-blue-100 border-white/15";
    };

    const formatSize = (size) => {
        if (size == null || Number.isNaN(Number(size))) {
            return "Size unavailable";
        }

        const bytes = Number(size);

        if (bytes < 1024) return `${bytes} B`;

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const filteredResources = resources.filter((resource) =>
        `${resource.title || ""} ${resource.fileName || ""} ${resource.fileType || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalStorage = resources.reduce(
        (total, resource) => total + Number(resource.fileSize || 0),
        0
    );

    const resourceTypes = new Set(
        resources.map((resource) => resource.fileType || "Other")
    ).size;

    return (
        <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] px-4 py-6 text-white sm:px-6 lg:px-9 lg:py-8">
            <div className="mx-auto max-w-[1450px]">

                <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="mb-7 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-blue-50 transition hover:bg-white/[0.15]"
                >
                    <FiArrowLeft />
                    Back to Project
                </button>

                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="mb-2 text-sm text-blue-100/65">
                            Project Workspace / Resources
                        </p>

                        <h1 className="text-3xl font-bold sm:text-4xl">
                            Project Resources
                        </h1>

                        <p className="mt-2 max-w-xl text-sm text-blue-100/70">
                            All your project documents, shared files and useful links in one organized workspace.
                        </p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setShowForm((prev) => !prev);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#2588FF]"
                        >
                            {showForm ? <FiX /> : <FiPlus />}
                            {showForm ? "Close Form" : "Add Resource"}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                        <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />

                        <p className="min-w-0 flex-1 break-words">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadResources}
                            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/70">
                                Total Resources
                            </span>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-300/15 text-blue-200">
                                <FiFolder className="text-xl" />
                            </div>
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {resources.length}
                        </p>

                        <p className="mt-1 text-xs text-blue-100/55">
                            Shared project files
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/70">
                                Total Storage
                            </span>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-300/15 text-purple-200">
                                <FiHardDrive className="text-xl" />
                            </div>
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {formatSize(totalStorage)}
                        </p>

                        <p className="mt-1 text-xs text-blue-100/55">
                            Combined file size
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/70">
                                Resource Types
                            </span>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-200">
                                <FiFileText className="text-xl" />
                            </div>
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {resourceTypes}
                        </p>

                        <p className="mt-1 text-xs text-blue-100/55">
                            Different file categories
                        </p>
                    </div>
                </div>

                {showForm && canManage && (
                    <form
                        onSubmit={handleAddResource}
                        className="mb-8 rounded-2xl border border-white/20 bg-white/[0.10] p-5 shadow-xl backdrop-blur-md sm:p-7"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-300/15 text-blue-100">
                                <FiPlus className="text-xl" />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold">
                                    Add New Resource
                                </h2>

                                <p className="mt-1 text-sm text-blue-100/65">
                                    Share a document, file or external link.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Resource Title *
                                </label>

                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Project Requirements"
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    File URL *
                                </label>

                                <input
                                    type="url"
                                    name="fileUrl"
                                    value={form.fileUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/document.pdf"
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    File Name *
                                </label>

                                <input
                                    name="fileName"
                                    value={form.fileName}
                                    onChange={handleChange}
                                    placeholder="requirements.pdf"
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    File Type *
                                </label>

                                <input
                                    name="fileType"
                                    value={form.fileType}
                                    onChange={handleChange}
                                    placeholder="PDF, DOCX, PNG..."
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    File Size (Bytes)
                                </label>

                                <input
                                    type="number"
                                    name="fileSize"
                                    value={form.fileSize}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Optional"
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#0875F9] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2588FF] disabled:opacity-60"
                            >
                                <FiPlus />
                                {uploading ? "Adding..." : "Add Resource"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            Shared Files
                        </h2>

                        <p className="mt-1 text-sm text-blue-100/65">
                            Documents and links shared with this project.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/55" />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full rounded-xl border border-white/15 bg-white/[0.09] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.08]"
                            />
                        ))}
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-14 text-center shadow-lg backdrop-blur-sm">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <FiFolder className="text-3xl text-blue-100" />
                        </div>

                        <h3 className="text-xl font-bold">
                            {search
                                ? "No matching resources"
                                : "No resources yet"}
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-blue-100/65">
                            {search
                                ? "Try another search term."
                                : "Shared documents and files will appear here once they are added to this project."}
                        </p>

                        {!search && canManage && (
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2588FF]"
                            >
                                <FiPlus />
                                Add First Resource
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredResources.map((resource) => {
                            const FileIcon = getFileIcon(
                                resource.fileType,
                                resource.fileName
                            );

                            const fileColor = getFileColor(
                                resource.fileType,
                                resource.fileName
                            );

                            return (
                                <article
                                    key={resource.id}
                                    className="group min-w-0 rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-1 hover:border-blue-200/30 hover:bg-white/[0.13]"
                                >
                                    <div className="mb-5 flex items-start justify-between gap-3">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl ${fileColor}`}>
                                            <FileIcon />
                                        </div>

                                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase text-blue-100">
                                            {resource.fileType || "FILE"}
                                        </span>
                                    </div>

                                    <h3 className="truncate text-lg font-bold text-white">
                                        {resource.title || "Untitled Resource"}
                                    </h3>

                                    <p className="mt-2 truncate text-sm text-blue-100/60">
                                        {resource.fileName || "File name unavailable"}
                                    </p>

                                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-blue-100/60">
                                        <span className="inline-flex items-center gap-2">
                                            <FiHardDrive />
                                            {formatSize(resource.fileSize)}
                                        </span>

                                        <span className="inline-flex items-center gap-1">
                                            <FiCalendar />
                                            Project File
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <a
                                            href={resource.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0875F9] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2588FF]"
                                        >
                                            <FiExternalLink />
                                            Open Resource
                                        </a>

                                        {canManage && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(resource.id)}
                                                disabled={deletingId === resource.id}
                                                title="Delete resource"
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-300/20 text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-50"
                                            >
                                                {deletingId === resource.id
                                                    ? <FiRefreshCw className="animate-spin" />
                                                    : <FiTrash2 />
                                                }
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-blue-100/45">
                    Quorum Project Resource Workspace
                </div>
            </div>
        </div>
    );
}
