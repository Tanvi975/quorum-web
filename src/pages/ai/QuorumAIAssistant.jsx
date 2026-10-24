
import { useEffect, useRef, useState } from "react";
import { aiService } from "../../services/aiService";

const tabs = [
  { id: "chat", label: "AI Chat" },
  { id: "search", label: "Workspace Search" },
  { id: "project", label: "Project Assistance" },
  { id: "update", label: "Status Report" },
  { id: "history", label: "AI History" },
];

const tones = ["professional", "casual", "friendly", "concise", "enthusiastic"];
const modes = [
  { value: "replies", label: "Quick replies" },
  { value: "follow_up", label: "Follow-ups" },
  { value: "rewrite", label: "Rewrite" },
];

const targetTypes = [
  { value: "organizationId", label: "Organization ID" },
  { value: "teamId", label: "Team ID" },
  { value: "communityId", label: "Community ID" },
];

const timeframes = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
];

const actionTypes = [
  "chat",
  "search",
  "project_assistance",
  "quick_replies",
  "project_update",
];

function getErrorMessage(error) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You don't have permission to access this resource.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 429) return "AI request limit reached. Please wait and try again.";
  if (status === 502 || status >= 500) {
    return "AI is temporarily unavailable. Please try again.";
  }

  return data?.message || data?.error || error.message || "Something went wrong.";
}

function getTarget(type, id) {
  if (!type || !id.trim()) return null;
  return { [type]: id.trim() };
}

function getProjectLabel(project) {
  return project?.name || "Selected workspace";
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
  }
function formatAIResponse(text = "") {
  return String(text)
      .replace(/\\n/g, "\n")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/^\d+\.\s+/gm, "• ");
}

function ResultBox({ title, children }) {
  return (
    <section className="mt-5 rounded-xl border border-slate-700 bg-[#10213b] p-4">
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      )}
      <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
        {children}
      </div>
    </section>
  );
}

function Loading({ children = "Working on it..." }) {
  return (
    <p className="mt-4 text-sm text-blue-300" role="status">
      {children}
    </p>
  );
}

export default function QuorumAIAssistant() {
  const [activeTab, setActiveTab] = useState("chat");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // AI chat
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState([]);
  const [quickMode, setQuickMode] = useState("replies");
  const [tone, setTone] = useState("professional");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionDisclaimer, setSuggestionDisclaimer] = useState("");

  // Workspace search
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Project assistance and status reports
  const [targetType, setTargetType] = useState("organizationId");
  const [targetId, setTargetId] = useState("");
  const [projectPrompt, setProjectPrompt] = useState("");
  const [projectResult, setProjectResult] = useState(null);
  const [timeframe, setTimeframe] = useState("last_7_days");
  const [statusResult, setStatusResult] = useState(null);

  // AI history
  const [history, setHistory] = useState([]);
  const [historyCursor, setHistoryCursor] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory("", historyFilter);
    }
    // History is reloaded when the tab or filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, historyFilter]);

  function runRequest(request) {
    setError("");
    setBusy(true);

    return request()
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setBusy(false);
      });
  }

  async function handleChat(event) {
    event.preventDefault();
    const text = prompt.trim();

    if (!text || busy) return;
    if (text.length > 10000 || context.length > 10000) {
      setError("Prompt and context must each be 10,000 characters or fewer.");
      return;
    }

    setPrompt("");
    setSuggestions([]);
    setMessages((current) => [...current, { role: "user", text }]);

    await runRequest(async () => {
      const response = await aiService.chat(text, context.trim());
      const data = response.data;

      if (!data?.answer) throw new Error("The AI response did not contain an answer.");

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.answer, metadata: data.metadata },
      ]);
    });
  }

  async function handleQuickReplies() {
    if (busy) return;

    const inputText = prompt.trim();
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user")?.text;

    const message = inputText || latestUserMessage;

    if (!message) {
      setError("Enter a draft message first to generate suggestions.");
      return;
    }

    await runRequest(async () => {
      const response = await aiService.quickReplies(
        quickMode,
        { message },
        tone
      );

      setSuggestions(response.data?.suggestions || []);
      setSuggestionDisclaimer(response.data?.disclaimer || "");
    });
  }

  async function handleSearch(event) {
    event.preventDefault();

    const text = query.trim();
    if (!text || busy) return;

    if (text.length > 1000) {
      setError("Search query must be 1,000 characters or fewer.");
      return;
    }

    await runRequest(async () => {
      const response = await aiService.search(text, 15);
      setSearchResult(response.data);
    });
  }

  async function handleProjectAssistance(event) {
    event.preventDefault();

    const text = projectPrompt.trim();
    const target = getTarget(targetType, targetId);

    if (!text || !target || busy) {
      setError("Enter a prompt and a valid workspace ID.");
      return;
    }

    if (text.length > 10000) {
      setError("Prompt must be 10,000 characters or fewer.");
      return;
    }

    await runRequest(async () => {
      const response = await aiService.projectAssistance(text, target);
      setProjectResult(response.data);
    });
  }

  async function handleStatusUpdate() {
    const target = getTarget(targetType, targetId);

    if (!target || busy) {
      setError("Enter a workspace ID first.");
      return;
    }

    await runRequest(async () => {
      const response = await aiService.projectUpdate(timeframe, target);
      setStatusResult(response.data);
    });
  }

  async function loadHistory(cursor = "", filter = historyFilter) {
    setError("");
    setHistoryLoading(true);

    try {
      const params = { limit: 20 };

      if (cursor) params.cursor = cursor;
      if (filter) params.actionType = filter;

      const response = await aiService.getHistory(params);
      const data = response.data;

      setHistory((current) =>
        cursor ? [...current, ...(data.interactions || [])] : data.interactions || []
      );
      setHistoryCursor(cursor);
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore && data.nextCursor));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteHistoryItem(id) {
    if (busy || !window.confirm("Delete this AI history item?")) return;

    await runRequest(async () => {
      await aiService.deleteHistoryItem(id);
      setHistory((current) => current.filter((item) => item.id !== id));
    });
  }

  async function clearHistory() {
    if (busy || !window.confirm("Delete all your AI history? This cannot be undone.")) {
      return;
    }

    await runRequest(async () => {
      await aiService.clearAllHistory();
      setHistory([]);
      setNextCursor(null);
      setHasMore(false);
    });
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text).catch(() => {
      setError("Could not copy automatically. Please select and copy the text.");
    });
  }

  function startNewChat() {
    setMessages([]);
    setSuggestions([]);
    setContext("");
    setPrompt("");
    setError("");
  }

  const project = projectResult?.project;
  const statusProject = statusResult?.project;

  return (
    <div className="min-h-screen bg-[#071426] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              QUORUM
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              AI Assistant
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Ask questions, search your workspace, and prepare project updates.
            </p>
          </div>

          {activeTab === "chat" && (
            <button
              type="button"
              onClick={startNewChat}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              + New chat
            </button>
          )}
        </header>

        <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-700 pb-3">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => {
                setError("");
                setActiveTab(tab.id);
              }}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-200"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0d1c31]">
              <div className="border-b border-slate-700 px-5 py-4">
                <h2 className="font-medium">Quorum AI</h2>
                <p className="mt-1 text-xs text-slate-400">
                  AI-generated answers may need verification.
                </p>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                {messages.length === 0 && (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-xl text-blue-300">
                      AI
                    </div>
                    <h3 className="text-lg font-medium">How can I help?</h3>
                    <p className="mt-2 max-w-md text-sm text-slate-400">
                      Ask a question about Quorum or provide context for a more
                      relevant answer.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {[
                        "How do I invite collaborators?",
                        "Explain team roles",
                        "Help me plan a project",
                      ].map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion}
                          onClick={() => setPrompt(suggestion)}
                          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-blue-400"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-xl px-4 py-3 sm:max-w-[80%] ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "border border-slate-700 bg-[#142844] text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                      {formatAIResponse(message.text)}
                      </p>
                      {message.metadata?.model && (
                        <p className="mt-2 text-[11px] text-slate-400">
                          Model: {message.metadata.model}
                        </p>
                      )}
                      {message.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => copyText(message.text)}
                          className="mt-3 text-xs text-blue-300 hover:text-white"
                        >
                          Copy answer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {busy && <Loading>Quorum AI is thinking...</Loading>}
              </div>

              <form
                onSubmit={handleChat}
                className="border-t border-slate-700 p-4"
              >
                <label htmlFor="ai-context" className="mb-2 block text-xs text-slate-400">
                  Optional context
                </label>
                <textarea
                  id="ai-context"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  maxLength={20000}
                  rows={2}
                  placeholder="Add relevant context (optional)..."
                  className="mb-3 w-full resize-y max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-gray-400 outline-none focus:border-blue-500"
                />
                <div className="flex items-end gap-3">
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    maxLength={20000}
                    rows={2}
                    required
                    placeholder="Message Quorum AI..."
                    aria-label="Message Quorum AI"
                    className="min-w-0 flex-1 resize-y max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-gray-400 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={busy || !prompt.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "..." : "Send"}
                  </button>
                </div>
                <p className="mt-2 text-right text-xs text-slate-500">
                  {prompt.length}/10,000
                </p>
              </form>
            </section>

            <aside className="h-fit rounded-xl border border-slate-700 bg-[#0d1c31] p-4">
              <h3 className="font-medium">Message assistant</h3>
              <p className="mt-1 text-sm text-slate-400">
                Generate suggestions for a draft. Review before using them.
              </p>

              <label className="mb-2 mt-5 block text-xs text-slate-400">
                Suggestion type
              </label>
              <select
                value={quickMode}
                onChange={(event) => setQuickMode(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-white"
              >
                {modes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-4 block text-xs text-slate-400">
                Tone
              </label>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-white"
              >
                {tones.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={busy}
                onClick={handleQuickReplies}
                className="mt-4 w-full rounded-lg border border-blue-500/50 bg-blue-600/10 px-4 py-3 text-sm text-blue-200 hover:bg-blue-600/20 disabled:opacity-50"
              >
                {busy ? "Generating..." : "Generate suggestions"}
              </button>

              {suggestions.length > 0 && (
                <div className="mt-5 space-y-3">
                  {suggestions.map((item, index) => (
                    <div
                      key={`${index}-${item}`}
                      className="rounded-lg border border-slate-700 bg-[#09172a] p-3"
                    >
                      <p className="text-sm leading-6 text-slate-200">{item}</p>
                      <button
                        type="button"
                        onClick={() => setPrompt(item)}
                        className="mt-3 text-xs text-blue-300 hover:text-white"
                      >
                        Use in draft
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(item)}
                        className="ml-4 mt-3 text-xs text-blue-300 hover:text-white"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                  {suggestionDisclaimer && (
                    <p className="text-xs leading-5 text-slate-400">
                      {suggestionDisclaimer}
                    </p>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}

        {activeTab === "search" && (
          <section className="max-w-4xl rounded-xl border border-slate-700 bg-[#0d1c31] p-5 sm:p-6">
            <SectionTitle
              title="Workspace Search"
              subtitle="Search available workspace evidence and view the returned sources."
            />
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={1000}
                required
                placeholder="Search messages, posts, teams, meetings..."
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm outline-none focus:border-blue-500"
              />
              <button
                disabled={busy || !query.trim()}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {busy ? "Searching..." : "Search"}
              </button>
            </form>

            {busy && <Loading>Searching workspace...</Loading>}

            {searchResult && (
              <>
                <ResultBox title="AI answer">
               {formatAIResponse(searchResult.answer)}
              </ResultBox>
                <div className="mt-5">
                  <h3 className="mb-3 font-medium">
                    Sources ({searchResult.sources?.length || 0})
                  </h3>
                  {searchResult.sources?.length ? (
                    <div className="space-y-3">
                      {searchResult.sources.map((source) => (
                        <article
                          key={source.id}
                          className="rounded-lg border border-slate-700 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-medium text-slate-100">
                              {source.title || source.type || "Workspace source"}
                            </h4>
                            <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">
                              {source.type}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {source.snippet}
                          </p>
                          <div className="mt-3 text-xs text-slate-400">
                            {source.author && <span>By {source.author}</span>}
                            {source.createdAt && (
                              <span>
                                {source.author ? " · " : ""}
                                {new Date(source.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {source.url && (
                            <a
                              href={source.url}
                              className="mt-3 inline-block text-sm text-blue-300 hover:text-white"
                            >
                              Open source
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No sources were returned.</p>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {(activeTab === "project" || activeTab === "update") && (
          <section className="max-w-4xl rounded-xl border border-slate-700 bg-[#0d1c31] p-5 sm:p-6">
            <SectionTitle
              title={activeTab === "project" ? "Project Assistance" : "Project Status Report"}
              subtitle="Choose exactly one workspace type and provide its ID."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Workspace type
                </label>
                <select
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-white"
                >
                  {targetTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Workspace UUID
                </label>
                <input
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  placeholder="Enter organization/team/community UUID"
                  className="w-full rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-gray-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {activeTab === "project" ? (
              <form onSubmit={handleProjectAssistance} className="mt-5">
                <label className="mb-2 block text-sm text-slate-300">
                  What do you need help with?
                </label>
                <textarea
                  value={projectPrompt}
                  onChange={(event) => setProjectPrompt(event.target.value)}
                  maxLength={20000}
                  rows={4}
                  required
                  placeholder="Example: Give me a high-level breakdown of our team structure."
                  className="w-full rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-gray-400 outline-none focus:border-blue-500"
                />
                <button
                  disabled={busy || !projectPrompt.trim() || !targetId.trim()}
                  className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {busy ? "Generating..." : "Get assistance"}
                </button>
              </form>
            ) : (
              <div className="mt-5">
                <label className="mb-2 block text-sm text-slate-300">
                  Report timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#09172a] p-3 text-sm text-white sm:max-w-xs"
                >
                  {timeframes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={busy || !targetId.trim()}
                  className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {busy ? "Generating..." : "Generate status report"}
                </button>
              </div>
            )}

            {busy && <Loading />}

            {activeTab === "project" && projectResult && (
              <ResultBox title={`Assistance — ${getProjectLabel(project)}`}>
                {formatAIResponse(projectResult.answer)}
                {project?.description && `\n\n${project.description}`}
                {project && (
                  `\n\nMembers: ${project.memberCount ?? 0}` +
                  (project.teamCount !== undefined ? `\nTeams: ${project.teamCount}` : "") +
                  (project.discussionCount !== undefined
                    ? `\nDiscussions: ${project.discussionCount}`
                    : "")
                )}
              </ResultBox>
            )}

            {activeTab === "update" && statusResult && (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-slate-700 bg-[#10213b] p-4">
                  <h3 className="font-medium">{getProjectLabel(statusProject)}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {statusResult.timeframe} · {statusResult.activitySource || "Activity source not specified"}
                  </p>
                  <p className="mt-3 text-sm text-slate-300">
                    Members: {statusResult.retrievedFacts?.membersCount ?? 0}
                    {" · "}Discussions: {statusResult.retrievedFacts?.discussionsAnalyzed ?? 0}
                    {" · "}Teams: {statusResult.retrievedFacts?.teamsRecorded ?? 0}
                  </p>
                </div>
                <ResultBox title="Status update">
                {formatAIResponse(statusResult.statusUpdate)}
                </ResultBox>
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
                  <h3 className="text-sm font-medium text-amber-200">Important note</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-100/80">
                    {statusResult.disclaimer}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(statusResult.statusUpdate || "")}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
                >
                  Copy report
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section className="rounded-xl border border-slate-700 bg-[#0d1c31] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionTitle
                title="AI History"
                subtitle="Review or delete previous AI interactions."
              />
              <button
                type="button"
                onClick={clearHistory}
                disabled={busy || history.length === 0}
                className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
              >
                Clear all history
              </button>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <label htmlFor="history-filter" className="text-sm text-slate-300">
                Filter:
              </label>
              <select
                id="history-filter"
                value={historyFilter}
                onChange={(event) => setHistoryFilter(event.target.value)}
                className="rounded-lg border border-slate-700 bg-[#09172a] p-2 text-sm text-white"
              >
                <option value="">All interactions</option>
                {actionTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => loadHistory("")}
                disabled={historyLoading}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {historyLoading && <Loading>Loading history...</Loading>}

            {!historyLoading && history.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                No AI interactions found.
              </p>
            )}

            <div className="space-y-3">
              {history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-slate-700 bg-[#10213b] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded bg-slate-800 px-2 py-1 text-xs text-blue-200">
                        {item.actionType}
                      </span>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium text-slate-100">
                        {item.prompt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteHistoryItem(item.id)}
                      disabled={busy}
                      className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                  {formatAIResponse(item.response)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    {item.createdAt && (
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    )}
                    {item.model && <span>Model: {item.model}</span>}
                    {item.tokensUsed != null && <span>Tokens: {item.tokensUsed}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.response || "")}
                    className="mt-3 text-xs text-blue-300 hover:text-white"
                  >
                    Copy response
                  </button>
                </article>
              ))}
            </div>

            {hasMore && nextCursor && (
              <button
                type="button"
                onClick={() => loadHistory(nextCursor)}
                disabled={historyLoading}
                className="mt-5 rounded-lg border border-slate-600 px-4 py-3 text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {historyLoading ? "Loading..." : "Load more"}
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
