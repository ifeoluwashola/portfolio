"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MessageSquare, Search, Send, User, Loader2, BookOpen, Terminal, X, CornerDownRight, Heart, Pencil } from "lucide-react";
import { getThreads, createThread, getPublicAvatarUrl, getStudentProfile, updateThread, toggleThreadLike } from "../../app/academy/actions";
import { ThreadDetail } from "./ThreadDetail";
import { MentionTextArea } from "./MentionTextArea";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";


interface Thread {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  is_resolved: boolean;
  created_at: string;
  author_name: string;
  author_avatar_key?: string;
  author_role: string;
  cohort_name: string;
  reply_count: number;
  like_count: number;
  is_liked: boolean;
}

export function DiscussionForumFeed() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 15;
  const [hasMore, setHasMore] = useState(true);

  const composerRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleLike = async (id: string) => {
    try {
      const res = await toggleThreadLike(id);
      if (res.success && res.data) {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, is_liked: res.data.liked, like_count: res.data.like_count } : t
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // New Post state (bottom compose bar)
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Question");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");
  const [isComposeExpanded, setIsComposeExpanded] = useState(false);

  // Editing state
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("Question");
  const [editError, setEditError] = useState("");
  const [isEditPending, startEditTransition] = useTransition();

  const [currentUserProfile, setCurrentUserProfile] = useState<{ id: string; role: string } | null>(null);

  // Avatars cache
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const messageEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await getThreads(category, search, limit, page * limit);
      if (result.data) {
        setThreads(result.data);
        setHasMore(result.data.length === limit);

        // Fetch avatar URLs for authors asynchronously
        result.data.forEach(async (t: Thread) => {
          if (t.author_avatar_key && !avatarUrls[t.author_avatar_key]) {
            const url = await getPublicAvatarUrl(t.author_avatar_key);
            if (url) {
              setAvatarUrls((prev) => ({ ...prev, [t.author_avatar_key!]: url }));
            }
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [category, search, page]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await getStudentProfile();
        if (profileRes && !("error" in profileRes)) {
          setCurrentUserProfile({ id: profileRes.id, role: profileRes.role || "student" });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleEditThread = (thread: Thread) => {
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditCategory(thread.category);
    setEditError("");
  };

  const handleUpdateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editTitle.trim() || !editContent.trim()) {
      setEditError("Title and content are required.");
      return;
    }

    if (!editingThreadId) return;

    startEditTransition(async () => {
      const res = await updateThread(editingThreadId, editTitle, editContent, editCategory);
      if (res.error) {
        setEditError(res.error);
      } else {
        setEditingThreadId(null);
        setEditTitle("");
        setEditContent("");
        fetchThreads(true); // reload silently
      }
    });
  };

  const preprocessMentions = (content: string) => {
    return content.replace(/(?<=^|\s)@([a-zA-Z0-9_-]+)/g, "[@$1](#mention-$1)");
  };

  const markdownComponents = {
    a: ({ href, children }: any) => {
      if (href && href.startsWith("#mention-")) {
        return <span className="text-yellow-400 font-bold">{children}</span>;
      }
      return (
        <a href={href} className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };


  // Handle URL updates for thread drawer
  const handleSelectThread = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("thread", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCloseThread = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("thread");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newTitle.trim() || !newContent.trim()) {
      setFormError("Title and post content are required.");
      return;
    }

    startTransition(async () => {
      const res = await createThread(newTitle, newContent, newCategory);
      if (res.error) {
        setFormError(res.error);
      } else {
        setNewTitle("");
        setNewContent("");
        setIsComposeExpanded(false);
        setPage(0);
        fetchThreads(false);
      }
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Learning":
        return <BookOpen className="w-3 h-3" />;
      case "Debugging":
        return <Terminal className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  const categories = ["All", "Learning", "Question", "Debugging"];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-8rem)] lg:h-[calc(100vh-8rem)] w-full border border-white/5 lg:rounded-3xl overflow-hidden bg-slate-950">
      
      {/* LEFT/CENTER PANE: Message Stream */}
      <div className={`flex flex-col h-full flex-1 min-w-0 transition-all duration-300 ${
        activeThreadId ? "hidden lg:flex lg:max-w-[65%]" : "flex w-full"
      }`}>
        
        {/* Stream Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-white flex items-center gap-2">
              # operational-discussion
            </h2>
          </div>
          
          {/* Search bar */}
          <div className="relative max-w-[200px] sm:max-w-[250px] w-full">
            <input
              type="text"
              placeholder="Search chat..."
              className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/30 font-mono transition-colors"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        {/* Category Filter bar */}
        <div className="flex gap-2 px-6 py-3 border-b border-white/5 bg-slate-950/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-widest transition-all ${
                category === cat
                  ? "bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/10"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-yellow-400 font-mono animate-pulse uppercase tracking-widest text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Synchronizing discussion feed...
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <MessageSquare className="w-6 h-6 text-slate-600" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">No discussions found</p>
            </div>
          ) : (
            <>
              {threads.map((thread) => {
                const isInstructor = thread.author_role === "instructor";
                return (
                  <div
                    key={thread.id}
                    className="flex gap-4 items-start group hover:bg-slate-900/10 p-2.5 rounded-xl transition-all"
                  >
                    {/* User Avatar */}
                    <div className={`w-9 h-9 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10 flex-shrink-0 ${isInstructor ? "ring-2 ring-yellow-400" : ""}`}>
                      {thread.author_avatar_key && avatarUrls[thread.author_avatar_key] ? (
                        <img
                          src={avatarUrls[thread.author_avatar_key]}
                          alt={thread.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Chat Bubble Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-bold font-mono ${isInstructor ? "text-yellow-400" : "text-slate-200"}`}>
                          {thread.author_name}
                        </span>
                        {isInstructor && (
                          <span className="text-[8px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1 py-0.2 rounded font-black uppercase tracking-tighter">
                            Instructor
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 font-bold">{thread.cohort_name}</span>
                        <span className="text-[9px] text-slate-600 font-semibold">{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>

                      {editingThreadId === thread.id ? (
                        <form onSubmit={handleUpdateThread} className="space-y-3 mt-2 bg-slate-950 p-4 border border-white/10 rounded-2xl">
                          {editError && <p className="text-[10px] text-red-500 font-mono">{editError}</p>}
                          
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              required
                              placeholder="Post Topic/Title..."
                              className="bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/30 font-mono flex-1"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                            />
                            
                            <select
                              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-yellow-400/20 font-mono"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                            >
                              <option value="Question">Question</option>
                              <option value="Learning">Learning</option>
                              <option value="Debugging">Debugging</option>
                            </select>
                          </div>

                          <MentionTextArea
                            value={editContent}
                            onChange={setEditContent}
                            placeholder="Edit your post content (Markdown supported)..."
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-400/40 transition-colors resize-none font-mono"
                            rows={4}
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingThreadId(null)}
                              className="px-3 py-1.5 border border-white/5 bg-slate-900/30 text-[10px] font-bold uppercase rounded-lg text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isEditPending}
                              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1.5"
                            >
                              {isEditPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Save Changes
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {/* Thread Title as Header */}
                          <h4 className="text-sm font-bold font-mono text-white tracking-tight uppercase group-hover:text-yellow-400/90 transition-colors">
                            {thread.title}
                          </h4>

                          {/* Content preview */}
                          <div className="prose prose-invert prose-xs max-w-none text-xs text-slate-300 leading-relaxed font-mono
                            prose-code:text-yellow-400 prose-code:bg-yellow-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:hidden prose-code:after:hidden
                            prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
                          ">
                            <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={markdownComponents}>{preprocessMentions(thread.content)}</ReactMarkdown>
                          </div>

                          {/* Message Footer Actions */}
                          <div className="flex items-center gap-4 pt-1.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-yellow-400/80 bg-yellow-400/5 px-2 py-0.5 rounded border border-yellow-400/10">
                              {getCategoryIcon(thread.category)}
                              {thread.category}
                            </span>
                            
                            <button
                              onClick={() => handleSelectThread(thread.id)}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {thread.reply_count > 0 ? thread.reply_count : ""}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLike(thread.id);
                              }}
                              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                thread.is_liked
                                  ? "text-rose-500 hover:text-rose-400"
                                  : "text-slate-500 hover:text-white"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${thread.is_liked ? "fill-rose-500" : ""}`} />
                              {thread.like_count > 0 ? thread.like_count : ""}
                            </button>

                            {currentUserProfile && currentUserProfile.id === thread.author_id && (
                              <button
                                onClick={() => handleEditThread(thread)}
                                className="text-[10px] font-bold text-slate-500 hover:text-yellow-400 uppercase tracking-wider transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Feed Pagination */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 font-mono">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-white/5 bg-slate-900/30 text-[10px] font-bold uppercase rounded-lg text-slate-400 hover:text-white disabled:opacity-20"
                >
                  {"<"} Prev
                </button>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Page {page + 1}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="px-3 py-1.5 border border-white/5 bg-slate-900/30 text-[10px] font-bold uppercase rounded-lg text-slate-400 hover:text-white disabled:opacity-20"
                >
                  Next {">"}
                </button>
              </div>
            </>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* BOTTOM MESSAGE COMPOSER BAR */}
        <div className="p-4 border-t border-white/5 bg-slate-900/10 relative">
          <form 
            onSubmit={handleCreateThread} 
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button, input, select, textarea, a')) return;
              if (composerRef.current) composerRef.current.focus();
            }}
            className="bg-slate-950 border border-white/10 rounded-2xl p-3 focus-within:border-yellow-400/30 transition-colors shadow-lg cursor-text"
          >
            {formError && <p className="text-[10px] text-red-500 font-mono mb-2">{formError}</p>}
            
            {/* Title input & Category Picker - visible on click or expanded */}
            {isComposeExpanded ? (
              <div className="flex flex-col sm:flex-row gap-3 pb-3 mb-2 border-b border-white/5">
                <input
                  type="text"
                  required
                  placeholder="Post Topic/Title..."
                  className="bg-transparent border-none text-xs text-white focus:outline-none flex-1 font-mono uppercase tracking-tight"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                
                <div className="flex items-center gap-2 relative">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Category:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    }}
                    className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-yellow-400/20 font-mono flex items-center gap-1.5"
                  >
                    {newCategory}
                    <CornerDownRight className="w-2.5 h-2.5 text-slate-500" />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[120px] animate-in slide-in-from-bottom-2 fade-in duration-200">
                      {["Question", "Learning", "Debugging"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[10px] font-mono transition-colors ${
                            newCategory === cat ? "bg-yellow-400/10 text-yellow-400 font-bold" : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Main Message textarea */}
            <div className="flex items-end gap-3">
              <MentionTextArea
                inputRef={composerRef}
                value={newContent}
                onChange={setNewContent}
                onFocus={() => setIsComposeExpanded(true)}
                placeholder="Share your learning experience, what you're learning, or ask a question (use @ to mention someone)..."
                className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none resize-none font-mono py-1.5 scrollbar-hide"
                rows={isComposeExpanded ? 4 : 1}
              />

              <div className="flex items-center gap-2 flex-shrink-0">
                {isComposeExpanded && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposeExpanded(false);
                      setNewTitle("");
                      setNewContent("");
                      setFormError("");
                    }}
                    className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="p-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl transition-all shadow-md flex items-center justify-center"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* RIGHT SIDE PANEL: Slide-out replies panel */}
      {activeThreadId ? (
        <div className="w-full lg:w-[35%] h-full border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col bg-slate-900/20">
          {/* Thread Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900/40">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 font-mono">
              Thread Details
            </h3>
            <button
              onClick={handleCloseThread}
              className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Reply Panel Container */}
          <div className="flex-1 overflow-y-auto">
            <ThreadDetail threadId={activeThreadId} isDrawer={true} />
          </div>
        </div>
      ) : null}

    </div>
  );
}
