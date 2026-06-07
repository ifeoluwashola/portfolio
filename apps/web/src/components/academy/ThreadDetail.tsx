"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, User, Loader2, Send, CornerDownRight, Check, Heart, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { getThread, createReply, endorseReply, getStudentProfile, getPublicAvatarUrl, updateReply, updateThread, toggleThreadLike, toggleReplyLike } from "../../app/academy/actions";
import { MentionTextArea } from "./MentionTextArea";

// Import highlight.js style via Next.js link or fallback to inline stylesheet injection
interface Author {
  id: string;
  first_name: string;
  last_name: string;
  avatar_s3_key?: string;
  role: string;
  cohort_name: string;
}

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
  like_count: number;
  is_liked: boolean;
}

interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  is_instructor_endorsed: boolean;
  created_at: string;
  author_name: string;
  author_avatar_key?: string;
  author_role: string;
  cohort_name: string;
  like_count: number;
  is_liked: boolean;
}

export function ThreadDetail({ threadId, isDrawer = false }: { threadId: string; isDrawer?: boolean }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ id: string; role: string } | null>(null);

  // Form state
  const [replyContent, setReplyContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");

  // Editing state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [editReplyError, setEditReplyError] = useState("");
  const [isEditPending, startEditTransition] = useTransition();

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [editThreadContent, setEditThreadContent] = useState("");
  const [editThreadCategory, setEditThreadCategory] = useState("Question");
  const [editThreadError, setEditThreadError] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEditThreadPending, startEditThreadTransition] = useTransition();

  // Composer Ref
  const composerRef = useRef<HTMLTextAreaElement>(null);


  // Avatars cache
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const threadRes = await getThread(threadId);
      if (threadRes.data) {
        setThread(threadRes.data.thread);
        setReplies(threadRes.data.replies || []);

        // Retrieve avatar urls
        const allKeyedItems = [threadRes.data.thread, ...(threadRes.data.replies || [])];
        allKeyedItems.forEach(async (item) => {
          const key = item.author_avatar_key;
          if (key && !avatarUrls[key]) {
            const url = await getPublicAvatarUrl(key);
            if (url) {
              setAvatarUrls((prev) => ({ ...prev, [key]: url }));
            }
          }
        });
      }

      const profileRes = await getStudentProfile();
      if (profileRes && !("error" in profileRes)) {
        setCurrentUserProfile({ id: profileRes.id, role: profileRes.role || "student" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [threadId]);

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!replyContent.trim()) {
      setFormError("Reply content cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await createReply(threadId, replyContent);
      if (res.error) {
        setFormError(res.error);
      } else {
        setReplyContent("");
        fetchData();
      }
    });
  };

  const handleEndorseReply = async (replyId: string) => {
    try {
      const res = await endorseReply(replyId);
      if (res.error) {
        alert(res.error);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleThreadLike = async () => {
    if (!thread) return;
    try {
      const res = await toggleThreadLike(thread.id);
      if (res.error || !res.data) {
        console.error(res.error || "Failed to toggle like");
        return;
      }
      setThread({ ...thread, is_liked: res.data.liked, like_count: res.data.like_count });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReplyLike = async (replyId: string) => {
    try {
      const res = await toggleReplyLike(replyId);
      if (res.error || !res.data) {
        console.error(res.error || "Failed to toggle like");
        return;
      }
      setReplies(replies.map(r => r.id === replyId ? { ...r, is_liked: res.data.liked, like_count: res.data.like_count } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
    setEditReplyError("");
  };

  const handleUpdateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditReplyError("");

    if (!editReplyContent.trim()) {
      setEditReplyError("Reply content cannot be empty.");
      return;
    }

    if (!editingReplyId) return;

    startEditTransition(async () => {
      const res = await updateReply(editingReplyId, editReplyContent);
      if (res.error) {
        setEditReplyError(res.error);
      } else {
        setEditingReplyId(null);
        setEditReplyContent("");
        fetchData();
      }
    });
  };

  const handleEditThread = () => {
    if (!thread) return;
    setEditingThreadId(thread.id);
    setEditThreadTitle(thread.title);
    setEditThreadContent(thread.content);
    setEditThreadCategory(thread.category);
    setEditThreadError("");
  };

  const handleUpdateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditThreadError("");

    if (!editThreadTitle.trim() || !editThreadContent.trim()) {
      setEditThreadError("Title and content are required.");
      return;
    }

    if (!editingThreadId) return;

    startEditThreadTransition(async () => {
      const res = await updateThread(editingThreadId, editThreadTitle, editThreadContent, editThreadCategory);
      if (res.error) {
        setEditThreadError(res.error);
      } else {
        setEditingThreadId(null);
        fetchData();
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


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-yellow-400 font-mono animate-pulse uppercase tracking-widest text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Synchronizing thread data...
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-20 font-mono space-y-4">
        <p className="text-red-400 uppercase tracking-widest text-xs">CRITICAL ERROR: Thread not found.</p>
        {!isDrawer && (
          <Link href="/academy/discussion-forum" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Return to Threads
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`font-mono ${isDrawer ? "space-y-6 p-4 pb-32" : "space-y-8 max-w-5xl mx-auto px-4 pb-16"}`}>
      {/* Stylesheet for Highlight.js code blocks */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />

      {/* Back to feed */}
      {!isDrawer && (
        <div>
          <Link
            href="/academy/discussion-forum"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Threads
          </Link>
        </div>
      )}

      {/* Main Thread Card */}
      <div className={`bg-slate-900/40 border border-white/5 space-y-6 ${isDrawer ? "rounded-2xl p-4 sm:p-5" : "rounded-3xl p-6 sm:p-8"}`}>
        {editingThreadId === thread.id ? (
          <form onSubmit={handleUpdateThread} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Edit Post Briefing</h3>
            {editThreadError && <p className="text-xs text-red-500 font-mono">{editThreadError}</p>}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Post Topic/Title..."
                className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors font-mono flex-1"
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
              />
              
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  }}
                  className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-yellow-400/30 font-mono flex items-center justify-between min-w-[140px]"
                >
                  {editThreadCategory}
                  <CornerDownRight className="w-3 h-3 text-slate-500" />
                </button>
                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 bg-slate-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[140px] animate-in fade-in duration-200">
                    {["Question", "Learning", "Debugging"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditThreadCategory(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors ${
                          editThreadCategory === cat ? "bg-yellow-400/10 text-yellow-400 font-bold" : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <MentionTextArea
              value={editThreadContent}
              onChange={setEditThreadContent}
              placeholder="Edit your post content (Markdown supported)..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors resize-none font-mono"
              rows={6}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingThreadId(null)}
                className="px-4 py-2 border border-white/5 bg-slate-900/30 text-xs font-black uppercase tracking-wider rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditThreadPending}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
              >
                {isEditThreadPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-slate-900 border border-white/10 rounded-lg text-[9px] font-bold text-yellow-400 uppercase tracking-wider">
                    {thread.category}
                  </span>
                  {thread.is_resolved && (
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-wider rounded-lg">
                      Resolved
                    </span>
                  )}
                </div>

                {currentUserProfile && currentUserProfile.id === thread.author_id && (
                  <button
                    onClick={handleEditThread}
                    className="text-[10px] font-bold text-slate-500 hover:text-yellow-400 uppercase tracking-wider transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h1 className={`font-black text-white uppercase tracking-tight ${isDrawer ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>
                {thread.title}
              </h1>

              {/* Author info */}
              <div className="flex items-center gap-3 text-xs text-slate-500 border-b border-white/5 pb-4">
                <div className={`w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10 ${thread.author_role === "instructor" ? "ring-2 ring-yellow-400" : ""}`}>
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
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${thread.author_role === "instructor" ? "text-yellow-400" : "text-slate-300"}`}>
                      {thread.author_name}
                    </span>
                    {thread.author_role === "instructor" && (
                      <span className="text-[8px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1 py-0.2 rounded font-black uppercase tracking-tighter">
                        Instructor
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold">{thread.cohort_name} • {new Date(thread.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Thread Content in Markdown */}
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed
              prose-code:text-yellow-400 prose-code:bg-yellow-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:hidden prose-code:after:hidden
              prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
              prose-headings:text-white prose-headings:font-bold prose-headings:uppercase
            ">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                {preprocessMentions(thread.content)}
              </ReactMarkdown>
            </div>

            {/* Thread Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <button
                onClick={handleToggleThreadLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  thread.is_liked
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : "bg-slate-900/50 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-400/30 hover:bg-red-500/5"
                }`}
              >
                <Heart className={`w-4 h-4 ${thread.is_liked ? "fill-current" : ""}`} />
                {thread.like_count > 0 ? <span>{thread.like_count}</span> : null}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Replies Title */}
      <div className="border-b border-white/5 pb-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <CornerDownRight className="w-4 h-4 text-yellow-400" />
          Operational Intel Responses ({replies.length})
        </h3>
      </div>

      {/* Replies Mapping */}
      {replies.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/10 border border-white/5 rounded-2xl">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Awaiting expert deployment answers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {replies.map((reply) => {
            const isInstructor = reply.author_role === "instructor";
            const isEndorsed = reply.is_instructor_endorsed;
            const isEditing = editingReplyId === reply.id;
            
            if (isEditing) {
              return (
                <div
                  key={reply.id}
                  className={`bg-slate-900/30 border rounded-2xl relative border-white/5 ${isDrawer ? "p-4 space-y-3" : "p-6 space-y-4"}`}
                >
                  <form onSubmit={handleUpdateReply} className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Edit Response</h4>
                    {editReplyError && <p className="text-xs text-red-500 font-mono">{editReplyError}</p>}
                    
                    <MentionTextArea
                      value={editReplyContent}
                      onChange={setEditReplyContent}
                      placeholder="Edit your response content (Markdown supported)..."
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-400/40 transition-colors resize-none font-mono"
                      rows={4}
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingReplyId(null)}
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
                </div>
              );
            }

            return (
              <div
                key={reply.id}
                className={`bg-slate-900/30 border rounded-2xl relative ${isDrawer ? "p-4 space-y-3" : "p-6 space-y-4"} ${
                  isEndorsed 
                    ? "border-emerald-500/30 bg-emerald-500/[0.01] shadow-[0_0_15px_rgba(16,185,129,0.03)]" 
                    : isInstructor 
                      ? "border-yellow-500/20 bg-yellow-500/[0.01]" 
                      : "border-white/5"
                }`}
              >
                {/* Verified solution checkmark badge */}
                {isEndorsed && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified Solution</span>
                  </div>
                )}

                {/* Reply Meta / Author details */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className={`w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10 ${isInstructor ? "ring-2 ring-yellow-400" : ""}`}>
                    {reply.author_avatar_key && avatarUrls[reply.author_avatar_key] ? (
                      <img
                        src={avatarUrls[reply.author_avatar_key]}
                        alt={reply.author_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isInstructor ? "text-yellow-400" : "text-slate-300"}`}>
                        {reply.author_name}
                      </span>
                      {isInstructor && (
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1 py-0.2 rounded font-black uppercase tracking-tighter">
                          Instructor
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold">{reply.cohort_name} • {new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Reply Content in Markdown */}
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed
                  prose-code:text-yellow-400 prose-code:bg-yellow-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:hidden prose-code:after:hidden
                  prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
                  prose-headings:text-white prose-headings:font-bold prose-headings:uppercase
                ">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                    {preprocessMentions(reply.content)}
                  </ReactMarkdown>
                </div>

                {/* Endorsement and Editing Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t border-white/5 gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleReplyLike(reply.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 border rounded-xl text-[10px] font-bold uppercase transition-colors ${
                        reply.is_liked
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-slate-900/50 text-slate-400 hover:text-red-400 border-white/5 hover:border-red-400/30 hover:bg-red-500/5"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${reply.is_liked ? "fill-current" : ""}`} />
                      {reply.like_count > 0 ? <span>{reply.like_count}</span> : null}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentUserProfile && currentUserProfile.id === reply.author_id ? (
                      <button
                        onClick={() => handleEditReply(reply)}
                        className="text-[10px] font-bold text-slate-500 hover:text-yellow-400 uppercase tracking-wider transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    ) : null}

                    {currentUserProfile?.role === "instructor" && !isEndorsed && !isInstructor && (
                      <button
                        onClick={() => handleEndorseReply(reply.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verify Solution
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reply Form */}
      <form 
        onSubmit={handleCreateReply} 
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button, input, select, textarea, a')) return;
          if (composerRef.current) composerRef.current.focus();
        }}
        className={`bg-slate-900/40 border border-white/5 space-y-4 cursor-text ${isDrawer ? "rounded-2xl p-4" : "rounded-3xl p-6"}`}
      >
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Deploy Response</h4>
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        
        <div className="space-y-2">
          <MentionTextArea
            inputRef={composerRef}
            value={replyContent}
            onChange={setReplyContent}
            placeholder="Type your response here (use @ to mention someone)..."
            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/40 transition-colors resize-none"
            rows={5}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 shadow-md"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Commit Response
          </button>
        </div>
      </form>
    </div>
  );
}
