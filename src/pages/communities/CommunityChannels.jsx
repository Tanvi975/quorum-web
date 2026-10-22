
import { useCallback, useEffect, useState } from "react";
import {
    getCommunityChannels,
    createCommunityChannel,
    updateCommunityChannel,
    deleteCommunityChannel,
} from "../../services/communityService";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export default function CommunityChannels({
    communityId,
    canManageChannels = false,
    selectedChannelId = null,
    onSelectChannel,
}) {
    const [channels, setChannels] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadChannels = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);
        setError("");

        try {
            const result = unwrap(await getCommunityChannels(communityId));
            const list = Array.isArray(result)
                ? result
                : result?.channels ?? [];

            setChannels(list);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load channels.");
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    async function handleCreate(event) {
        event.preventDefault();
        if (!name.trim() || saving) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            await createCommunityChannel(communityId, {
                name: name.trim(),
                description: description.trim(),
            });
            setName("");
            setDescription("");
            setNotice("Channel created successfully.");
            await loadChannels();
        } catch (err) {
            setError(
                err.response?.status === 409
                    ? "A channel with this name already exists."
                    : err.response?.data?.message || "Unable to create channel."
            );
        } finally {
            setSaving(false);
        }
    }

    function startEditing(channel) {
        setEditing(channel.id ?? channel._id);
        setEditName(channel.name ?? "");
        setEditDescription(channel.description ?? "");
        setError("");
        setNotice("");
    }

    async function handleUpdate(event) {
        event.preventDefault();
        if (!editName.trim() || saving || !editing) return;

        setSaving(true);
        setError("");

        try {
            await updateCommunityChannel(communityId, editing, {
                name: editName.trim(),
                description: editDescription.trim(),
            });
            setEditing(null);
            setNotice("Channel updated successfully.");
            await loadChannels();
        } catch (err) {
            setError(
                err.response?.status === 409
                    ? "A channel with this name already exists."
                    : err.response?.data?.message || "Unable to update channel."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(channel) {
        const id = channel.id ?? channel._id;
        const isGeneral =
            channel.isDefault || channel.name?.toLowerCase() === "general";

        if (isGeneral) {
            setError("The General channel cannot be deleted.");
            return;
        }

        if (!window.confirm(
            `Delete #${channel.name}? Its posts should be moved to General.`
        )) return;

        setError("");
        setNotice("");

        try {
            await deleteCommunityChannel(communityId, id);

            if (String(selectedChannelId) === String(id)) {
                onSelectChannel?.(null);
            }

            setNotice("Channel deleted successfully.");
            await loadChannels();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to delete channel.");
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0C2D58] to-[#071B35] text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                        Community spaces
                    </p>
                    <h2 className="mt-1 text-lg font-bold">Channels</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100">
                    {channels.length} total
                </span>
            </div>

            <div className="space-y-3 p-4">
                {error && (
                    <p role="alert" className="rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-200">
                        {error}
                    </p>
                )}
                {notice && (
                    <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                        {notice}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => onSelectChannel?.(null)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selectedChannelId == null
                            ? "border-blue-300/40 bg-blue-400/15"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/15 text-lg">
                        <span aria-hidden="true">✦</span>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-semibold">All posts</span>
                        <span className="block text-xs text-blue-100/60">
                            Browse the community feed
                        </span>
                    </span>
                    {selectedChannelId == null && <span className="text-blue-300">●</span>}
                </button>

                {loading ? (
                    <p className="animate-pulse px-2 py-5 text-sm text-blue-100/60">
                        Loading channels…
                    </p>
                ) : channels.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-blue-100/60">
                        No channels returned by the server.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {channels.map((channel) => {
                            const id = channel.id ?? channel._id;
                            const general =
                                channel.isDefault ||
                                channel.name?.toLowerCase() === "general";
                            const active = String(selectedChannelId) === String(id);

                            return (
                                <div
                                    key={id}
                                    className={`rounded-xl border p-3 transition ${
                                        active
                                            ? "border-blue-300/40 bg-blue-400/15"
                                            : "border-white/10 bg-white/[0.03]"
                                    }`}
                                >
                                    {editing === id ? (
                                        <form onSubmit={handleUpdate} className="space-y-2">
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                maxLength={80}
                                                required
                                                aria-label="Channel name"
                                                className="w-full rounded-lg border border-white/15 bg-[#06172E] px-3 py-2 text-sm outline-none focus:border-blue-300"
                                            />
                                            <textarea
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                maxLength={300}
                                                aria-label="Channel description"
                                                placeholder="Description"
                                                className="w-full rounded-lg border border-white/15 bg-[#06172E] px-3 py-2 text-sm outline-none focus:border-blue-300"
                                            />
                                            <div className="flex gap-2">
                                                <button disabled={saving} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold disabled:opacity-50">
                                                    Save
                                                </button>
                                                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-white/15 px-3 py-2 text-xs">
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onSelectChannel?.(id)}
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                <span className="block truncate font-semibold">
                                                    <span className="mr-2 text-blue-300">#</span>
                                                    {channel.name ?? "Untitled"}
                                                </span>
                                                {channel.description && (
                                                    <span className="mt-1 block text-xs text-blue-100/60">
                                                        {channel.description}
                                                    </span>
                                                )}
                                            </button>

                                            {active && <span className="text-blue-300">●</span>}

                                            {canManageChannels && !general && (
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => startEditing(channel)} className="text-xs text-blue-200 hover:text-white">
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(channel)} className="text-xs text-red-200 hover:text-red-100">
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {canManageChannels && (
                    <form onSubmit={handleCreate} className="space-y-3 border-t border-white/10 pt-4">
                        <h3 className="text-sm font-semibold">Create a channel</h3>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                            placeholder="e.g. announcements"
                            className="w-full rounded-xl border border-white/10 bg-[#06172E] px-3 py-3 text-sm outline-none placeholder:text-white/35 focus:border-blue-300"
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={300}
                            rows={2}
                            placeholder="What should members discuss here? (optional)"
                            className="w-full resize-y rounded-xl border border-white/10 bg-[#06172E] px-3 py-3 text-sm outline-none placeholder:text-white/35 focus:border-blue-300"
                        />
                        <button
                            disabled={saving || !name.trim()}
                            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-bold shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "+ Create channel"}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
