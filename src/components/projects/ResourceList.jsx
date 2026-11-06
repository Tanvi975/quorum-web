
import { useEffect, useState } from "react";
import {
    getProjectResources,
    addProjectResource,
    deleteProjectResource
} from "../../services/projectService";

export default function ResourceList({
    projectId,
    isManager = false
}) {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        title: "",
        fileUrl: "",
        fileName: "",
        fileType: "",
        fileSize: ""
    });

    const loadResources = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getProjectResources(projectId);
            const data =
                response?.data?.data ??
                response?.data ??
                response;

            setResources(Array.isArray(data) ? data : data?.resources || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load project resources."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResources();
    }, [projectId]);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
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

            setForm({
                title: "",
                fileUrl: "",
                fileName: "",
                fileType: "",
                fileSize: ""
            });

            setShowForm(false);
            await loadResources();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to add project resource."
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
            setError("");

            await deleteProjectResource(projectId, resourceId);

            setResources((prev) =>
                prev.filter((resource) => resource.id !== resourceId)
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete resource."
            );
        }
    };

    if (loading) {
        return <div>Loading project resources...</div>;
    }

    return (
        <div className="project-resources">
            <div className="project-resources-header">
                <div>
                    <h2>Project Resources</h2>
                    <p>{resources.length} shared resources</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm ? "Cancel" : "Add Resource"}
                </button>
            </div>

            {error && (
                <div className="project-resources-error">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    className="project-resource-form"
                    onSubmit={handleAddResource}
                >
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Resource title"
                        required
                    />

                    <input
                        type="url"
                        name="fileUrl"
                        value={form.fileUrl}
                        onChange={handleChange}
                        placeholder="File URL"
                        required
                    />

                    <input
                        name="fileName"
                        value={form.fileName}
                        onChange={handleChange}
                        placeholder="File name"
                        required
                    />

                    <input
                        name="fileType"
                        value={form.fileType}
                        onChange={handleChange}
                        placeholder="File type"
                        required
                    />

                    <input
                        type="number"
                        name="fileSize"
                        value={form.fileSize}
                        onChange={handleChange}
                        placeholder="File size in bytes"
                        min="0"
                    />

                    <button type="submit" disabled={uploading}>
                        {uploading ? "Adding..." : "Add Resource"}
                    </button>
                </form>
            )}

            <div className="project-resources-list">
                {resources.length === 0 ? (
                    <p>No resources shared yet.</p>
                ) : (
                    resources.map((resource) => (
                        <div
                            className="project-resource-card"
                            key={resource.id}
                        >
                            <div>
                                <h3>{resource.title}</h3>
                                <p>{resource.fileName}</p>
                                <span>{resource.fileType}</span>

                                {resource.fileSize != null && (
                                    <span>
                                        {" "}
                                        {(resource.fileSize / 1024).toFixed(1)} KB
                                    </span>
                                )}
                            </div>

                            <div className="project-resource-actions">
                                <a
                                    href={resource.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open
                                </a>

                                {isManager && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDelete(resource.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
