import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  FiBookmark,
  FiMessageCircle,
  FiPlus,
  FiX,
  FiTrash2,
  FiEdit2,
  FiFolder,
  FiFileText,
  FiFile,
  FiMessageSquare,
  FiExternalLink,
  FiSearch,
  FiFolderPlus,
  FiAlertCircle,
  FiDownload,
  FiLayers,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import {
  getSavedItems,
  updateSavedItem,
  deleteSavedItem,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../services/savedItemsService";

const ITEM_TYPES = [
  { key: "", label: "All Items", icon: FiLayers },
  { key: "MESSAGE", label: "Messages", icon: FiMessageSquare },
  { key: "FILE", label: "Files", icon: FiFile },
  { key: "CHAT", label: "Chats", icon: FiMessageCircle },
  { key: "DOCUMENT", label: "Documents", icon: FiFileText },
  { key: "RESOURCE", label: "Resources", icon: FiExternalLink },
];

const PRESET_COLORS = [
  "#3388ff",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function SavedItems() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    description: "",
    color: "#3388ff",
  });
  const [collectionError, setCollectionError] = useState("");
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeItemForEdit, setActiveItemForEdit] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [targetCollectionId, setTargetCollectionId] = useState("");
  const [updatingItem, setUpdatingItem] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadCollections = useCallback(async () => {
    try {
      const res = await getCollections();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setCollections(list);
    } catch {
      setCollections([]);
    }
  }, []);

  const loadItems = useCallback(
    async (isLoadMore = false, cursorValue = null) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      try {
        const params = {
          limit: 20,
        };
        if (selectedType) params.itemType = selectedType;
        if (selectedCollectionId) {
          params.collectionId = selectedCollectionId;
        }
        if (debouncedSearch) params.search = debouncedSearch;
        if (cursorValue) params.cursor = cursorValue;

        const res = await getSavedItems(params);
        const data = res?.data || {};
        const newItems = data.items || (Array.isArray(data) ? data : []);

        if (isLoadMore) {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id));
            const filtered = newItems.filter((i) => !seen.has(i.id));
            return [...prev, ...filtered];
          });
        } else {
          setItems(newItems);
        }

        setNextCursor(data.nextCursor || null);
        setHasNextPage(Boolean(data.hasNextPage && data.nextCursor));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load saved items."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedType, selectedCollectionId, debouncedSearch]
  );

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadItems(false, null);
  }, [loadItems]);

  const handleOpenCollectionModal = (col = null) => {
    setEditingCollection(col);
    if (col) {
      setCollectionForm({
        name: col.name || "",
        description: col.description || "",
        color: col.color || "#3388ff",
      });
    } else {
      setCollectionForm({
        name: "",
        description: "",
        color: "#3388ff",
      });
    }
    setCollectionError("");
    setCollectionModalOpen(true);
  };

  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!collectionForm.name.trim()) {
      setCollectionError("Collection name is required.");
      return;
    }

    try {
      setCollectionSubmitting(true);
      setCollectionError("");

      if (editingCollection) {
        await updateCollection(editingCollection.id, collectionForm);
        setSuccessMsg("Collection updated successfully.");
      } else {
        await createCollection(collectionForm);
        setSuccessMsg("Collection created successfully.");
      }

      setCollectionModalOpen(false);
      await loadCollections();
      await loadItems(false, null);
    } catch (err) {
      setCollectionError(
        err.response?.data?.message ||
          (err.response?.status === 409
            ? "A collection with this name already exists."
            : "Could not save collection.")
      );
    } finally {
      setCollectionSubmitting(false);
    }
  };

  const handleDeleteCollection = async (colId) => {


    try {
      await deleteCollection(colId);
      if (selectedCollectionId === colId) {
        setSelectedCollectionId("");
      }
      setSuccessMsg("Collection deleted.");
      await loadCollections();
      await loadItems(false, null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete this collection."
      );
    }
  };

  const handleOpenEditItem = (item) => {
    setActiveItemForEdit(item);
    setNoteInput(item.note || "");
    setTargetCollectionId(item.collectionId || item.collection?.id || "");
    setNoteModalOpen(true);
  };

  const handleSaveItemChanges = async (e) => {
    e.preventDefault();
    if (!activeItemForEdit) return;

    try {
      setUpdatingItem(true);
      const payload = {
        note: noteInput.trim() || null,
        collectionId: targetCollectionId || null,
      };

      await updateSavedItem(activeItemForEdit.id, payload);
      setNoteModalOpen(false);
      setSuccessMsg("Saved item updated.");
      await loadItems(false, null);
      await loadCollections();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update this saved item."
      );
    } finally {
      setUpdatingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteSavedItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setSuccessMsg("Bookmark removed.");
      await loadCollections();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not remove this bookmark."
      );
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
  
    const target = deleteTarget;
  
    if (target.type === "collection") {
      await handleDeleteCollection(target.id);
    } else if (target.type === "item") {
      await handleDeleteItem(target.id);
    }
  
    setDeleteTarget(null);
  };
  const handleItemClick = (item) => {
    if (!item.isAccessible) return;

    if (item.itemType === "FILE") {
      const fileUrl = item.content?.fileUrl;
      if (fileUrl) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (item.itemType === "MESSAGE" || item.itemType === "CHAT") {
      navigate("/chat");
      return;
    }

    if (item.itemType === "DOCUMENT" || item.itemType === "RESOURCE") {
      navigate("/communities");
    }
  };

  const activeCollectionObj = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find((c) => c.id === selectedCollectionId);
  }, [collections, selectedCollectionId]);

  return (
    <div
      className="min-h-screen overflow-x-hidden text-white"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage:
          "linear-gradient(to bottom, #213F70 0%, #315A8A 35%, #506D9A 65%, #7698C5 100%)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
      }}
    >
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/20 bg-[#0F2748]/85 px-4 shadow-sm backdrop-blur-xl sm:px-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-1/2 -translate-x-1/2 text-base font-bold tracking-[0.18em] text-white sm:text-lg"
        >
          QUORUM
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/70 sm:inline">
            Saved Items
          </span>
        </div>
        <div className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-[#0066FF] to-[#0148B3] text-sm font-semibold text-white shadow-sm">
    {user?.name?.[0] || "U"}
  </div>
      </header>

      <div className="min-h-[calc(100vh-64px)]">

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-[#102842]/35 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Personal Library
                </p>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Saved Items & Collections
                </h1>
                <p className="mt-1 text-xs text-white/70">
                  Access and organize your bookmarked messages, files, documents, and resources.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenCollectionModal()}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-3.5 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-110"
                >
                  <FiFolderPlus size={15} />
                  New Collection
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-900/30 px-4 py-2.5 text-xs text-red-200">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="p-1 hover:text-white"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-900/30 px-4 py-2.5 text-xs text-emerald-200">
                <span>{successMsg}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMsg("")}
                  className="p-1 hover:text-white"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <FiSearch
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved notes and content..."
                  className="h-10 w-full min-w-0 rounded-xl border border-white/20 bg-[#102842]/45 pl-9 pr-9 text-xs text-white placeholder:text-white/50 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {ITEM_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = selectedType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSelectedType(t.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-[#0066FF] to-[#0148B3] text-white shadow-md"
                          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <Icon size={13} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">
              <div className="min-w-0 lg:col-span-1">
                <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                      <FiFolder size={14} />
                      Collections
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleOpenCollectionModal()}
                      className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                      title="Add Collection"
                    >
                      <FiPlus size={15} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCollectionId("")}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                        !selectedCollectionId
                          ? "bg-[#0066FF]/25 text-white ring-1 ring-inset ring-blue-300/30"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>All Collections</span>
                      <span className="rounded-md border border-white/10 bg-[#062C5F]/30 px-1.5 py-0.5 text-[10px]">
                        {items.length}
                      </span>
                    </button>

                    {collections.map((col) => {
                      const isSelected = selectedCollectionId === col.id;
                      const count = col._count?.items ?? col.itemsCount ?? 0;

                      return (
                        <div
                          key={col.id}
                          className={`group flex items-center justify-between rounded-lg px-3 py-2 transition ${
                            isSelected
                              ? "bg-[#0066FF]/25 text-white ring-1 ring-inset ring-blue-300/30"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedCollectionId(col.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs"
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: col.color || "#3388ff" }}
                            />
                            <span className="truncate">{col.name}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <span className="rounded-md border border-white/10 bg-[#062C5F]/30 px-1.5 py-0.5 text-[10px] text-white/80">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenCollectionModal(col)}
                              className="hidden rounded p-1 text-white/60 hover:text-white group-hover:block"
                              title="Edit Collection"
                            >
                              <FiEdit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "collection",
                                  id: col.id,
                                  name: col.name,
                                })
                              }
                              className="hidden rounded p-1 text-red-300 hover:text-red-100 group-hover:block"
                              title="Delete Collection"
                            >
                              <FiTrash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {collections.length === 0 && (
                      <p className="py-4 text-center text-[11px] text-white/50">
                        No collections yet. Click + to create one.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0 lg:col-span-3">
                {activeCollectionObj && (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-white/20 bg-[#315A8A]/90 backdrop-blur-xl/40 p-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{
                          backgroundColor:
                            activeCollectionObj.color || "#3388ff",
                        }}
                      />
                      <div>
                        <h2 className="text-sm font-semibold text-white">
                          {activeCollectionObj.name}
                        </h2>
                        {activeCollectionObj.description && (
                          <p className="text-[11px] text-white/60">
                            {activeCollectionObj.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCollectionId("")}
                      className="text-xs text-white/60 hover:text-white"
                    >
                      Clear filter
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-white/20 bg-[#315A8A]/90 backdrop-blur-xl/30">
                    <p className="text-xs text-white/60">Loading saved items...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/30 bg-white/5 p-6 text-center">
                    <FiBookmark size={32} className="mb-2 text-white/30" />
                    <p className="text-sm font-medium text-white/80">
                      No saved items found
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      Bookmark chat messages, attachments, or community documents to keep them handy.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {items.map((item) => {
                      const isAccessible = item.isAccessible !== false;
                      const col = item.collection;

                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                            isAccessible
                              ? "border-white/20 bg-[#102842]/65 backdrop-blur-sm shadow-md hover:border-white/30"
                              : "border-red-500/20 bg-red-950/20 text-white/60"
                          }`}
                        >
                          <div>
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                                  {item.itemType}
                                </span>
                                {col && (
                                  <span
                                    className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${col.color || "#3388ff"}33`,
                                      color: col.color || "#3388ff",
                                    }}
                                  >
                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          col.color || "#3388ff",
                                      }}
                                    />
                                    {col.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-white/50">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>

                            {!isAccessible ? (
                              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3">
                                <div className="flex items-center gap-2 text-xs font-medium text-red-200">
                                  <FiAlertCircle size={15} />
                                  <span>Content no longer available or deleted</span>
                                </div>
                                <p className="mt-1 text-[11px] text-white/50">
                                  {item.title || "The original resource was removed."}
                                </p>
                              </div>
                            ) : (
                              <div className="mb-3">
                                {item.itemType === "FILE" && (
                                  <div
                                    onClick={() => handleItemClick(item)}
                                    className="cursor-pointer rounded-xl border border-white/20 bg-[#102842]/45 p-3 transition hover:bg-white/10"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <FiFile size={20} className="text-blue-300" />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-white">
                                          {item.title ||
                                            item.content?.fileName ||
                                            "Attached File"}
                                        </p>
                                        <p className="text-[10px] text-white/50">
                                          {formatBytes(item.content?.fileSize)}
                                          {item.content?.sender?.name
                                            ? ` · ${item.content.sender.name}`
                                            : ""}
                                        </p>
                                      </div>
                                      {item.content?.fileUrl && (
                                        <FiDownload
                                          size={14}
                                          className="text-white/60"
                                        />
                                      )}
                                    </div>
                                    {item.content?.content && (
                                      <p className="mt-2 line-clamp-2 text-[11px] text-white/70">
                                        "{item.content.content}"
                                      </p>
                                    )}
                                  </div>
                                )}

                                {item.itemType === "MESSAGE" && (
                                  <div
                                    onClick={() => handleItemClick(item)}
                                    className="cursor-pointer rounded-xl border border-white/20 bg-[#102842]/45 p-3 transition hover:bg-white/10"
                                  >
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <span className="truncate text-[11px] font-semibold text-blue-200">
                                        {item.content?.sender?.name ||
                                          item.content?.conversationName ||
                                          "Chat Message"}
                                      </span>
                                      <FiExternalLink
                                        size={12}
                                        className="text-white/40"
                                      />
                                    </div>
                                    <p className="line-clamp-3 text-xs text-white/90">
                                      {item.content?.content ||
                                        item.title ||
                                        "Message content"}
                                    </p>
                                  </div>
                                )}

                                {item.itemType === "CHAT" && (
                                  <div
                                    onClick={() => handleItemClick(item)}
                                    className="cursor-pointer rounded-xl border border-white/20 bg-[#102842]/45 p-3 transition hover:bg-white/10"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-white">
                                        {item.title ||
                                          item.content?.name ||
                                          "Conversation"}
                                      </span>
                                      <FiExternalLink
                                        size={12}
                                        className="text-white/40"
                                      />
                                    </div>
                                    <p className="mt-1 text-[11px] text-white/60">
                                      Click to jump to conversation
                                    </p>
                                  </div>
                                )}

                                {(item.itemType === "DOCUMENT" ||
                                  item.itemType === "RESOURCE") && (
                                  <div
                                    onClick={() => handleItemClick(item)}
                                    className="cursor-pointer rounded-xl border border-white/20 bg-[#102842]/45 p-3 transition hover:bg-white/10"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="truncate text-xs font-semibold text-white">
                                        {item.title || "Community Resource"}
                                      </span>
                                      <FiExternalLink
                                        size={12}
                                        className="text-white/40"
                                      />
                                    </div>
                                    {item.content?.content && (
                                      <p className="mt-1 line-clamp-2 text-[11px] text-white/70">
                                        {item.content.content}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {item.note && (
                              <div className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                                  Personal Note
                                </p>
                                <p className="mt-0.5 break-words text-xs text-amber-100">
                                  {item.note}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 border-t border-white/20 pt-2.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditItem(item)}
                              aria-label={item.note ? "Edit saved item note" : "Add a note to saved item"}
                              title={item.note ? "Edit note / collection" : "Add note / collection"}
                              className="rounded-lg border border-white/20 p-2 text-white/80 transition hover:border-blue-300/40 hover:bg-blue-500/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300/40"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "item",
                                  id: item.id,
                                  name: item.title || "this bookmark",
                                })
                              }
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/20 hover:text-red-100"
                              title="Delete bookmark"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasNextPage && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => loadItems(true, nextCursor)}
                      className="rounded-xl border border-white/20 bg-[#102842]/45 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                      {loadingMore ? "Loading more..." : "Load More"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {collectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061426]/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCollection}
            className="w-full max-w-md rounded-xl border border-white/20 bg-[#315A8A]/90 backdrop-blur-xl p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                {editingCollection ? "Edit Collection" : "New Collection"}
              </h2>
              <button
                type="button"
                onClick={() => setCollectionModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            {collectionError && (
              <p className="mb-3 text-xs text-red-300">{collectionError}</p>
            )}

            <div className="mb-3">
              <label className="mb-1 block text-xs text-white/80">
                Collection Name *
              </label>
              <input
                type="text"
                value={collectionForm.name}
                maxLength={100}
                required
                onChange={(e) =>
                  setCollectionForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g. Design Assets, Sprint 42"
                className="h-10 w-full min-w-0 rounded-xl border border-white/20 bg-[#102842]/45 px-3 text-xs text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-white/80">
                Description (optional)
              </label>
              <textarea
                value={collectionForm.description}
                maxLength={500}
                rows={3}
                onChange={(e) =>
                  setCollectionForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                }))
              }
              placeholder="Brief description of this collection..."
              className="w-full min-w-0 rounded-xl border border-white/20 bg-[#102842]/45 p-2.5 text-xs text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-xs text-white/80">
              Color Tag
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setCollectionForm((prev) => ({ ...prev, color: c }))
                  }
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    collectionForm.color === c
                      ? "scale-110 border-white shadow"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCollectionModalOpen(false)}
              className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={collectionSubmitting}
              className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {collectionSubmitting ? "Saving..." : "Save Collection"}
            </button>
          </div>
        </form>
      </div>
    )}

    {noteModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061426]/75 p-4 backdrop-blur-sm">
        <form
          onSubmit={handleSaveItemChanges}
          className="w-full max-w-md rounded-xl border border-white/20 bg-[#315A8A]/90 backdrop-blur-xl p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Edit Saved Item
            </h2>
            <button
              type="button"
              onClick={() => setNoteModalOpen(false)}
              className="text-white/60 hover:text-white"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-white/80">
              Personal Note
            </label>
            <textarea
              value={noteInput}
              rows={4}
              maxLength={20000}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add your personal notes or reminders..."
              className="w-full min-w-0 rounded-xl border border-white/20 bg-[#102842]/45 p-2.5 text-xs text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-xs text-white/80">
              Assign to Collection
            </label>
            <select
              value={targetCollectionId}
              onChange={(e) => setTargetCollectionId(e.target.value)}
              className="h-10 w-full min-w-0 rounded-lg border border-white/20 bg-[#062C5F] px-3 text-xs text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="">(No collection - Unassigned)</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNoteModalOpen(false)}
              className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingItem}
              className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {updatingItem ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        type="delete"
        title={
          deleteTarget?.type === "collection"
            ? "Delete collection?"
            : "Remove bookmark?"
        }
        message={
          deleteTarget?.type === "collection"
            ? `Delete "${deleteTarget?.name}"? Saved items in this collection will remain unassigned.`
            : `Are you sure you want to remove "${deleteTarget?.name}" from saved items?`
        }
        confirmText={
          deleteTarget?.type === "collection"
            ? "Delete collection"
            : "Remove bookmark"
        }
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
  }