import { useCallback, useEffect, useState } from "react";
import {
  getCommunityChannels,
  createCommunityChannel,
  updateCommunityChannel,
  deleteCommunityChannel,
} from "../../services/communityService";

const unwrap = (response) =>
  response?.data?.data ?? response?.data ?? response;

const panel =
  "rounded-2xl border border-white/30 bg-[#DCEBFA]/25 shadow-[0_12px_35px_rgba(1,16,39,0.10)] backdrop-blur-xl";

const field =
  "w-full min-w-0 rounded-xl border border-white/20 bg-[#173A5E]/70 px-3 py-3 text-sm text-white outline-none transition placeholder:text-blue-100/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20";

const primaryButton =
  "inline-flex items-center justify-center rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1678FF] disabled:cursor-not-allowed disabled:opacity-50";

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
    if (!communityId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = unwrap(await getCommunityChannels(communityId));
      const list = Array.isArray(result)
        ? result
        : result?.channels ?? [];

      setChannels(list);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load channels."
      );
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
    setNotice("");

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
      channel.isDefault ||
      channel.name?.toLowerCase() === "general";

    if (isGeneral) {
      setError("The General channel cannot be deleted.");
      return;
    }

    if (
      !window.confirm(
        `Delete #${channel.name}? Its posts should be moved to General.`
      )
    ) {
      return;
    }

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
      setError(
        err.response?.data?.message || "Unable to delete channel."
      );
    }
  }

  return (
    <section className={`${panel} min-w-0 overflow-hidden text-blue-950`}>
      {/* Panel heading */}
      <div className=" p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue-900 sm:text-xm">
              Community spaces
            </p>
            <h2 className="mt-1 text-lg font-bold text-blue-950 sm:text-xl">
              Channels
            </h2>
            <p className="mt-1 text-xs text-white">
              Find the right space to connect.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-white/40 bg-white/35 px-3 py-1.5 text-xs font-semibold text-blue-900">
            {channels.length} total
          </span>
        </div>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        {error && (
          <div
            role="alert"
            className="break-words rounded-xl border border-red-300/40 bg-red-100/70 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="break-words rounded-xl border border-emerald-300/40 bg-emerald-100/70 p-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        {/* All posts */}
        <button
          type="button"
          onClick={() => onSelectChannel?.(null)}
          className={`flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition sm:p-3.5 ${
            selectedChannelId == null
              ? "border-blue-300/50 bg-[#173A5E]/70 shadow-sm"
              : "border-white/20 bg-[#173A5E]/70 hover:border-blue-300/50 hover:bg-[#214B73]/80"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl text-blue-100">
            ✦
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-white">
              All posts
            </span>
            <span className="mt-0.5 block text-xs text-blue-100/75">
              Browse the community feed
            </span>
          </span>

          {selectedChannelId == null && (
            <span className="shrink-0 text-sm text-blue-200">●</span>
          )}
        </button>

        {/* Channel list */}
        {loading ? (
          <div className="space-y-3 py-3" aria-live="polite">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[62px] animate-pulse rounded-xl border border-white/20 bg-[#173A5E]/50"
              />
            ))}
            <p className="text-center text-xs text-blue-900/70">
              Loading channels…
            </p>
          </div>
        ) : channels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-300/30 bg-[#173A5E]/70 px-4 py-7 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl text-blue-100">
              #
            </div>
            <p className="mt-3 text-sm font-semibold text-white">
              No channels yet
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-100/75">
              {canManageChannels
                ? "Create a channel to organize discussions."
                : "There are no channels available right now."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map((channel) => {
              const id = channel.id ?? channel._id;
              const general =
                channel.isDefault ||
                channel.name?.toLowerCase() === "general";
              const active =
                String(selectedChannelId) === String(id);

              return (
                <div
                  key={id}
                  className={`min-w-0 rounded-xl border p-3 transition ${
                    active
                      ? "border-blue-300/50 bg-[#173A5E]/70"
                      : "border-white/20 bg-[#173A5E]/70 hover:border-blue-300/50 hover:bg-[#214B73]/80"
                  }`}
                >
                  {editing === id ? (
                    <form
                      onSubmit={handleUpdate}
                      className="space-y-3"
                    >
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={80}
                        required
                        aria-label="Channel name"
                        className={field}
                      />

                      <textarea
                        value={editDescription}
                        onChange={(e) =>
                          setEditDescription(e.target.value)
                        }
                        maxLength={300}
                        aria-label="Channel description"
                        placeholder="Description"
                        rows={3}
                        className={`${field} resize-y`}
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className={primaryButton}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-blue-50 transition hover:bg-white/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex min-w-0 items-start gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectChannel?.(id)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      >
                        <span className="mt-0.5 shrink-0 text-lg font-bold text-blue-200">
                          #
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="break-words font-semibold text-white">
                              {channel.name ?? "Untitled"}
                            </span>
                            {general && (
                              <span className="rounded-full border border-blue-200/30 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                                DEFAULT
                              </span>
                            )}
                          </span>

                          {channel.description && (
                            <span className="mt-1 block break-words text-xs leading-5 text-blue-100/75">
                              {channel.description}
                            </span>
                          )}
                        </span>
                      </button>

                      {active && (
                        <span
                          className="mt-1 shrink-0 text-sm text-blue-200"
                          aria-label="Selected channel"
                        >
                          ●
                        </span>
                      )}
                    </div>
                  )}

                  {editing !== id &&
                    canManageChannels &&
                    !general && (
                      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-white/20 pt-2.5">
                        <button
                          type="button"
                          onClick={() => startEditing(channel)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(channel)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {canManageChannels && (
          <form
            onSubmit={handleCreate}
            className="space-y-3 border-t border-white/35 pt-4"
          >
            <div>
              <h3 className="text-sm font-bold text-blue-950 sm:text-base">
                Create a channel
              </h3>
              <p className="mt-1 text-xs leading-5 text-blue-900/70">
                Give your community a dedicated discussion space.
              </p>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              placeholder="e.g. announcements"
              aria-label="New channel name"
              className={field}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="What should members discuss here? (optional)"
              aria-label="New channel description"
              className={`${field} max-h-40 resize-y`}
            />

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={`${primaryButton} w-full`}
            >
              {saving ? "Creating channel…" : "+ Create channel"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}