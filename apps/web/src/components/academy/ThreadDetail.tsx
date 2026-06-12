"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, User, Loader2, Send, CornerDownRight, Check, Heart, Pencil, Paperclip, FileIcon, X, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { getThread, createReply, endorseReply, getStudentProfile, getPublicAvatarUrl, updateReply, updateThread, toggleThreadReaction, toggleReplyReaction, getUploadUrl, getDownloadUrl, deleteReply } from "../../app/academy/actions";
import { MentionTextArea } from "./MentionTextArea";
import { AlertModal } from "../AlertModal";

const CURATED_EMOJIS = ["👍", "❤️", "😂", "🚀", "👀", "🔥"];

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
  reaction_counts: Record<string, number>;
  user_reactions: string[];
  media_urls?: string[];
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
  reaction_counts: Record<string, number>;
  user_reactions: string[];
  media_urls?: string[];
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

  // Composer Ref & Media
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean; 
    title: string; 
    message: string; 
    type: 'error'|'warning'|'success';
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "", type: "error" });
  const [isDeletingReply, setIsDeletingReply] = useState(false);


  // Emoji picker state
  const [isThreadEmojiPickerOpen, setIsThreadEmojiPickerOpen] = useState(false);
  const [openReplyEmojiPickerId, setOpenReplyEmojiPickerId] = useState<string | null>(null);

  // Avatars & Media cache
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [mediaDownloadUrls, setMediaDownloadUrls] = useState<Record<string, string>>({});
  const [fullscreenMediaUrl, setFullscreenMediaUrl] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const threadRes = await getThread(threadId);
      if (threadRes.data) {
        setThread(threadRes.data.thread);
        setReplies(threadRes.data.replies || []);

        // Retrieve avatar and media urls
        const allKeyedItems = [threadRes.data.thread, ...(threadRes.data.replies || [])];
        allKeyedItems.forEach(async (item) => {
          const key = item.author_avatar_key;
          if (key && !avatarUrls[key]) {
            const url = await getPublicAvatarUrl(key);
            if (url) {
              setAvatarUrls((prev) => ({ ...prev, [key]: url }));
            }
          }

          if (item.media_urls && item.media_urls.length > 0) {
            item.media_urls.forEach(async (mediaKey: string) => {
              if (!mediaDownloadUrls[mediaKey]) {
                const url = await getDownloadUrl(mediaKey);
                if (url) {
                  setMediaDownloadUrls((prev) => ({ ...prev, [mediaKey]: url }));
                }
              }
            });
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
      const res = await createReply(threadId, replyContent, mediaUrls);
      if (res.error) {
        setFormError(res.error);
      } else {
        setReplyContent("");
        setMediaUrls([]);
        fetchData();
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      setAlertConfig({ isOpen: true, title: "File Too Large", message: `Maximum size is ${isVideo ? '20MB' : '10MB'}.`, type: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const res = await getUploadUrl(file.name, "thread_media");
      if (res.error || !res.data) throw new Error(res.error || "Failed to get upload URL");
      
      const { upload_url, file_key } = res.data;

      const objectUrl = URL.createObjectURL(file);
      setMediaDownloadUrls(prev => ({ ...prev, [file_key]: objectUrl }));

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");

      setMediaUrls(prev => [...prev, file_key]);
    } catch (error) {
      console.error(error);
      setAlertConfig({ isOpen: true, title: "Upload Failed", message: "Error uploading file. Please try again.", type: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEndorseReply = async (replyId: string) => {
    try {
      const res = await endorseReply(replyId);
      if (res.error) {
        setAlertConfig({ isOpen: true, title: "Endorse Failed", message: res.error, type: "error" });
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    setIsDeletingReply(true);
    try {
      const res = await deleteReply(replyId);
      if (res.error) {
        setAlertConfig({ isOpen: true, title: "Delete Failed", message: res.error, type: "error" });
      } else {
        setAlertConfig({ isOpen: true, title: "Reply Deleted", message: "Reply has been successfully deleted.", type: "success" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ isOpen: true, title: "Error", message: "An unexpected error occurred.", type: "error" });
    } finally {
      setIsDeletingReply(false);
    }
  };

  const handleToggleThreadReaction = async (reactionType: string) => {
    if (!thread) return;
    try {
      const res = await toggleThreadReaction(thread.id, reactionType);
      if (res.error || !res.data) {
        console.error(res.error || "Failed to toggle reaction");
        return;
      }
      
      const newCounts = res.data.reaction_counts;
      const isLiked = res.data.liked;
      
      // Update user_reactions locally
      let newUserReactions = [...(thread.user_reactions || [])];
      if (isLiked && !newUserReactions.includes(reactionType)) {
        newUserReactions.push(reactionType);
      } else if (!isLiked) {
        newUserReactions = newUserReactions.filter(r => r !== reactionType);
      }

      setThread({ ...thread, reaction_counts: newCounts, user_reactions: newUserReactions });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReplyReaction = async (replyId: string, reactionType: string) => {
    try {
      const res = await toggleReplyReaction(replyId, reactionType);
      if (res.error || !res.data) {
        console.error(res.error || "Failed to toggle reaction");
        return;
      }
      
      const newCounts = res.data.reaction_counts;
      const isLiked = res.data.liked;
      
      setReplies(replies.map(r => {
        if (r.id === replyId) {
          let newUserReactions = [...(r.user_reactions || [])];
          if (isLiked && !newUserReactions.includes(reactionType)) {
            newUserReactions.push(reactionType);
          } else if (!isLiked) {
            newUserReactions = newUserReactions.filter(type => type !== reactionType);
          }
          return { ...r, reaction_counts: newCounts, user_reactions: newUserReactions };
        }
        return r;
      }));
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
    <>
      <AlertModal 
        isOpen={alertConfig.isOpen} 
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
      <div className={`font-mono ${isDrawer ? "space-y-6 p-4 pb-32" : "space-y-8 max-w-5xl mx-auto px-4 pb-16"}`}>
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
            <div className="prose prose-invert prose-sm max-w-none w-full min-w-0 break-words text-slate-300 leading-relaxed
              [&_code:not(pre_code)]:text-yellow-400 [&_code:not(pre_code)]:bg-yellow-400/10 [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:text-xs [&_code:not(pre_code)]:font-mono prose-code:before:hidden prose-code:after:hidden
              prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-pre:p-4 prose-pre:max-w-[calc(100vw-4rem)] md:prose-pre:max-w-full prose-pre:overflow-x-auto
              prose-headings:text-white prose-headings:font-bold prose-headings:uppercase
            ">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                {preprocessMentions(thread.content)}
              </ReactMarkdown>
            </div>

            {/* Media Attachments */}
            {thread.media_urls && thread.media_urls.length > 0 && (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5">
                <div className="flex flex-wrap gap-4">
                  {thread.media_urls.map((key) => {
                    const downloadUrl = mediaDownloadUrls[key];
                    if (!downloadUrl) return <div key={key} className="w-24 h-24 bg-slate-900 rounded-xl animate-pulse" />;
                    
                    if (key.match(/\.(mp4|mov|webm)$/i)) {
                      return (
                        <div key={key} className="relative w-full max-w-2xl bg-slate-950 rounded-xl border border-white/10 overflow-hidden group" onClick={(e) => e.stopPropagation()}>
                          <video src={downloadUrl} controls className="w-full max-h-[500px] object-contain bg-black" />
                        </div>
                      );
                    } else if (key.match(/\.(png|jpe?g|gif|webp)$/i)) {
                      return (
                        <div key={key} className="relative w-full max-w-2xl bg-slate-950 rounded-xl border border-white/10 overflow-hidden group">
                          <img 
                            src={downloadUrl} 
                            alt="Attachment" 
                            className="w-full max-h-[500px] object-contain cursor-zoom-in" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenMediaUrl(downloadUrl);
                            }}
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setFullscreenMediaUrl(downloadUrl); }}
                            className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10 flex items-center gap-2 shadow-xl"
                          >
                            <FileIcon className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Fullscreen</span>
                          </button>
                        </div>
                      );
                    } else if (key.match(/\.pdf$/i)) {
                      return (
                        <div key={key} className="relative w-full max-w-2xl h-[500px] bg-slate-950 rounded-xl border border-white/10 overflow-hidden group">
                          <iframe src={`${downloadUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-none bg-white" title="PDF Preview" />
                          <a 
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10 flex items-center gap-2 shadow-xl"
                          >
                            <FileIcon className="w-4 h-4 text-red-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Open in New Tab</span>
                          </a>
                        </div>
                      );
                    } else {
                      return (
                        <a key={key} href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-900 border border-white/10 p-3 rounded-xl hover:bg-white/5 transition-colors">
                          <FileIcon className="w-5 h-5 text-yellow-400" />
                          <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]">{key.split('-').pop()}</span>
                        </a>
                      );
                    }
                  })}
                </div>
              </div>
            )}

            {/* Thread Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/5 flex-wrap">
              {CURATED_EMOJIS.map(emoji => {
                const count = thread.reaction_counts?.[emoji] || 0;
                const hasReacted = thread.user_reactions?.includes(emoji);
                if (count === 0) return null;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleToggleThreadReaction(emoji)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                      hasReacted
                        ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                        : "bg-slate-900/50 text-slate-400 border border-white/5 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
              
              {/* Emoji Picker Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsThreadEmojiPickerOpen(!isThreadEmojiPickerOpen)}
                  className="flex items-center justify-center px-2 py-1 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all gap-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center">
                    <span className="text-sm mr-1">+</span> React
                  </span>
                </button>
                {isThreadEmojiPickerOpen && (
                  <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-white/10 rounded-xl p-1.5 shadow-2xl grid grid-cols-3 sm:flex sm:flex-row gap-1 animate-in fade-in zoom-in-95 duration-200 z-[100] w-max">
                    {CURATED_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleToggleThreadReaction(emoji);
                          setIsThreadEmojiPickerOpen(false);
                        }}
                        className="text-base hover:bg-white/10 p-1 rounded-md transition-colors flex items-center justify-center w-7 h-7"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                {isEndorsed && (thread?.category === 'question' || thread?.category === 'debugging') && (
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
                <div className="prose prose-invert prose-sm max-w-none w-full min-w-0 break-words text-slate-300 leading-relaxed
                  [&_code:not(pre_code)]:text-yellow-400 [&_code:not(pre_code)]:bg-yellow-400/10 [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:text-xs [&_code:not(pre_code)]:font-mono prose-code:before:hidden prose-code:after:hidden
                  prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-pre:p-4 prose-pre:max-w-[calc(100vw-4rem)] md:prose-pre:max-w-full prose-pre:overflow-x-auto
                  prose-headings:text-white prose-headings:font-bold prose-headings:uppercase
                ">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                    {preprocessMentions(reply.content)}
                  </ReactMarkdown>
                </div>

                {/* Media Attachments */}
                {reply.media_urls && reply.media_urls.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-4">
                      {reply.media_urls.map((key) => {
                        const downloadUrl = mediaDownloadUrls[key];
                        if (!downloadUrl) return <div key={key} className="w-24 h-24 bg-slate-900 rounded-xl animate-pulse" />;
                        
                        if (key.match(/\.(mp4|mov|webm)$/i)) {
                          return (
                            <div key={key} className="relative w-full max-w-2xl bg-slate-950 rounded-xl border border-white/10 overflow-hidden group" onClick={(e) => e.stopPropagation()}>
                              <video src={downloadUrl} controls className="w-full max-h-[500px] object-contain bg-black" />
                            </div>
                          );
                        } else if (key.match(/\.(png|jpe?g|gif|webp)$/i)) {
                          return (
                            <div key={key} className="relative w-full max-w-2xl bg-slate-950 rounded-xl border border-white/10 overflow-hidden group">
                              <img 
                                src={downloadUrl} 
                                alt="Attachment" 
                                className="w-full max-h-[500px] object-contain cursor-zoom-in" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullscreenMediaUrl(downloadUrl);
                                }}
                              />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setFullscreenMediaUrl(downloadUrl); }}
                                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10 flex items-center gap-2 shadow-xl"
                              >
                                <FileIcon className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Fullscreen</span>
                              </button>
                            </div>
                          );
                        } else if (key.match(/\.pdf$/i)) {
                          return (
                            <div key={key} className="relative w-full max-w-2xl h-[500px] bg-slate-950 rounded-xl border border-white/10 overflow-hidden group">
                              <iframe src={`${downloadUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-none bg-white" title="PDF Preview" />
                              <a 
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10 flex items-center gap-2 shadow-xl"
                              >
                                <FileIcon className="w-4 h-4 text-red-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Open in New Tab</span>
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <a key={key} href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-900 border border-white/10 p-3 rounded-xl hover:bg-white/5 transition-colors">
                              <FileIcon className="w-5 h-5 text-yellow-400" />
                              <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]">{key.split('-').pop()}</span>
                            </a>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Endorsement and Editing Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t border-white/5 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {CURATED_EMOJIS.map(emoji => {
                      const count = reply.reaction_counts?.[emoji] || 0;
                      const hasReacted = reply.user_reactions?.includes(emoji);
                      if (count === 0) return null;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReplyReaction(reply.id, emoji)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                            hasReacted
                              ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                              : "bg-slate-900/50 text-slate-400 border border-white/5 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                    
                    {/* Emoji Picker Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenReplyEmojiPickerId(openReplyEmojiPickerId === reply.id ? null : reply.id)}
                        className="flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">+</span>
                      </button>
                      {openReplyEmojiPickerId === reply.id && (
                        <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-white/10 rounded-xl p-1.5 shadow-2xl grid grid-cols-3 sm:flex sm:flex-row gap-1 animate-in fade-in zoom-in-95 duration-200 z-[100] w-max">
                          {CURATED_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => {
                                handleToggleReplyReaction(reply.id, emoji);
                                setOpenReplyEmojiPickerId(null);
                              }}
                              className="text-base hover:bg-white/10 p-1 rounded-md transition-colors flex items-center justify-center w-7 h-7"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                    
                    {currentUserProfile && (currentUserProfile.id === reply.author_id || currentUserProfile.role === "instructor" || currentUserProfile.role === "admin") ? (
                      <button
                        onClick={() => {
                          setAlertConfig({
                            isOpen: true,
                            title: "Delete Reply?",
                            message: "Are you sure you want to delete this reply? This action cannot be undone.",
                            type: "warning",
                            onConfirm: () => {
                              handleDeleteReply(reply.id);
                              setAlertConfig(prev => ({ ...prev, isOpen: false }));
                            }
                          });
                        }}
                        disabled={isDeletingReply}
                        className="text-[10px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-wider transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}

                    {currentUserProfile?.role === "instructor" && !isEndorsed && !isInstructor && (thread?.category === 'question' || thread?.category === 'debugging') && !thread?.is_resolved && (
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
          
          {/* Media Attachments Preview */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative group">
                  {url.match(/\.(png|jpe?g|gif|webp)$/i) && mediaDownloadUrls[url] ? (
                    <img 
                      src={mediaDownloadUrls[url]} 
                      alt="Attachment preview" 
                      className="h-16 w-16 object-cover rounded-lg border border-white/10 cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenMediaUrl(mediaDownloadUrls[url]);
                      }}
                    />
                  ) : url.match(/\.(mp4|mov|webm)$/i) ? (
                    <div className="h-16 w-16 bg-slate-900 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1">
                      <FileIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Video</span>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-slate-900 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1">
                      <FileIcon className="w-5 h-5 text-yellow-400" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-[50px]">{url.split('-').pop()}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,application/pdf"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
          </div>
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
      {/* Fullscreen Media Modal */}
      {fullscreenMediaUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenMediaUrl(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-50"
            onClick={() => setFullscreenMediaUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={fullscreenMediaUrl} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
    </>
  );
}
