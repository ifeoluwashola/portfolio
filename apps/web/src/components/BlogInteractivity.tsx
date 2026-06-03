"use client";

import { useEffect, useState, useRef } from "react";
import { Heart, Eye, MessageSquare, Send, CornerDownRight, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStudentProfile, academyFetch } from "@/app/academy/actions";
import { MentionTextArea } from "@/components/academy/MentionTextArea";

interface Comment {
  id: number;
  slug: string;
  display_name: string;
  content: string;
  student_id: string | null;
  likes: number;
  created_at: string;
  replies?: Comment[];
}

interface BlogData {
  views: number;
  likes: number;
  comments: Comment[];
}

interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
}

const viewedPosts = new Set<string>();

export function BlogInteractivity({ slug }: { slug: string }) {
  const [data, setData] = useState<BlogData | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  
  const formRef = useRef<HTMLFormElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";
  const API_URL = apiBase;

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const profile = await getStudentProfile();
        if (!('error' in profile) && profile.id) {
          if (isMounted) {
            setUser(profile);
            const name = profile.display_name || profile.username || "Student";
            setDisplayName(name);
          }
        }
      } catch {
        // Not logged in or error, ignore
      }
    };
    fetchUser();

    // Register View
    const registerView = async () => {
      if (viewedPosts.has(slug)) return;
      try {
        await fetch(`${API_URL}/v1/blog/${slug}/view`, { method: "POST" });
        viewedPosts.add(slug);
      } catch (err) {
        console.error("Failed to register view", err);
      }
    };

    // Fetch initial metrics and comments
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/blog/${slug}`);
        if (res.ok && isMounted) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error("Failed to fetch blog data", err);
      }
    };

    registerView().then(fetchData);

    // Check local storage for like prevention
    if (typeof window !== "undefined") {
      const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
      if (likedPosts.includes(slug)) {
        setHasLiked(true);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [slug, API_URL]);

  const handleLike = async () => {
    if (hasLiked) return;
    try {
      const res = await fetch(`${API_URL}/v1/blog/${slug}/like`, { method: "POST" });
      if (res.ok) {
        setHasLiked(true);
        setData(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        
        if (typeof window !== "undefined") {
          const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
          likedPosts.push(slug);
          localStorage.setItem("liked_posts", JSON.stringify(likedPosts));
        }
      }
    } catch (err) {
      console.error("Failed to register like", err);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!user) {
      alert("You must be logged in to like comments.");
      return;
    }
    
    // We'll use academyFetch to automatically include the auth token
    const result = await academyFetch(`/v1/blog/comments/${commentId}/like`, { method: "POST" });
    if (result.error) {
      console.error("Failed to like comment:", result.error);
      return;
    }

    // Optimistically update UI
    setData(prev => {
      if (!prev) return prev;
      
      const updatedComments = prev.comments.map(c => {
        if (c.id === commentId) return { ...c, likes: c.likes + 1 };
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => r.id === commentId ? { ...r, likes: r.likes + 1 } : r)
          };
        }
        return c;
      });
      
      return { ...prev, comments: updatedComments };
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !commentContent) return;

    setIsSubmitting(true);
    try {
      // If user is logged in, we should use academyFetch to include auth token for mentions/likes features
      const payload = {
        display_name: displayName,
        content: commentContent,
        ...(replyingTo ? { parent_id: replyingTo.id } : {})
      };

      let newComment = null;

      if (user) {
        const res = await academyFetch(`/v1/blog/${slug}/comment`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (!res.error) newComment = res.data;
      } else {
        const res = await fetch(`${API_URL}/v1/blog/${slug}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) newComment = await res.json();
      }

      if (newComment) {
        setData(prev => {
          if (!prev) return prev;
          if (replyingTo) {
            return {
              ...prev,
              comments: prev.comments.map(c => {
                if (c.id === replyingTo.id) {
                  return { ...c, replies: [...(c.replies || []), newComment] };
                }
                // If replying to a reply, attach it to the root parent
                if (c.replies?.some(r => r.id === replyingTo.id)) {
                   return { ...c, replies: [...(c.replies || []), newComment] };
                }
                return c;
              })
            };
          }
          return { ...prev, comments: [newComment, ...prev.comments] };
        });
        setCommentContent("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    setEditingCommentId(null);
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setReplyingTo(null);
  };

  const handleEditSubmit = async (e: React.FormEvent, commentId: number) => {
    e.preventDefault();
    if (!editContent || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await academyFetch(`/v1/blog/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editContent })
      });

      if (!res.error) {
        setData(prev => {
          if (!prev) return prev;
          const mapComment = (c: Comment): Comment => {
            if (c.id === commentId) return { ...c, content: editContent };
            if (c.replies) return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, content: editContent } : r) };
            return c;
          };
          return { ...prev, comments: prev.comments.map(mapComment) };
        });
        setEditingCommentId(null);
        setEditContent("");
      } else {
        console.error("Failed to edit comment", res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Replace @usernames with styled spans
  const formatCommentContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-yellow-500 font-semibold">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderCommentCard = (comment: Comment, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    
    return (
      <div className={`bg-background rounded-xl p-5 border border-border ${isReply ? 'ml-8 sm:ml-12 relative before:absolute before:-left-6 before:top-6 before:w-4 before:h-px before:bg-border' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-foreground">{comment.display_name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-3">
            {new Date(comment.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric"
            })}
          </span>
        </div>
        
        {isEditing ? (
          <form onSubmit={(e) => handleEditSubmit(e, comment.id)} className="space-y-3 mb-4">
            <MentionTextArea
              value={editContent}
              onChange={setEditContent}
              placeholder="Edit your comment..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} size="sm" className="bg-sky-600 hover:bg-sky-500 text-white">
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button type="button" disabled={isSubmitting} size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm mb-4">
            {formatCommentContent(comment.content)}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <button 
            type="button"
            onClick={() => handleCommentLike(comment.id)} 
            className="flex items-center gap-1.5 hover:text-rose-500 transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{comment.likes || 0}</span>
          </button>
          <button 
            type="button"
            onClick={() => startReply(comment)}
            className="flex items-center gap-1.5 hover:text-sky-500 transition-colors"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
          {user && user.id === comment.student_id && !isEditing && (
            <button 
              type="button"
              onClick={() => startEdit(comment)}
              className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors ml-auto"
            >
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCommentForm = (isReply = false) => (
    <form ref={isReply ? undefined : formRef} onSubmit={handleCommentSubmit} className={`space-y-4 ${isReply ? 'ml-8 sm:ml-12 mt-4' : 'mb-10'}`}>
      {isReply && replyingTo && (
        <div className="flex items-center justify-between bg-sky-500/10 text-sky-500 px-4 py-2 rounded-lg text-sm border border-sky-500/20">
          <span className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4" />
            Replying to <span className="font-bold">{replyingTo.display_name}</span>
          </span>
          <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <Input 
        placeholder="Name (displayed publicly)" 
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
        disabled={!!user}
        className="max-w-xs bg-background"
      />
      
      {user ? (
        <MentionTextArea
          value={commentContent}
          onChange={setCommentContent}
          placeholder="Share your thoughts... (use @ to mention someone)"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
        />
      ) : (
        <Textarea 
          placeholder="Share your thoughts on this article..." 
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          required
          className="min-h-[100px] bg-background"
        />
      )}

      <Button type="submit" disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-500 text-white gap-2">
        <Send className="w-4 h-4" />
        {isSubmitting ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );

  return (
    <div className="mt-16 pt-8 border-t border-border">
      {/* Metrics Row */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-medium">{data !== null ? data.views : "..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">{data?.comments?.length || 0}</span>
          </div>
        </div>

        <Button 
          variant={hasLiked ? "default" : "outline"} 
          className={`gap-2 ${hasLiked ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}`}
          onClick={handleLike}
          disabled={hasLiked}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "fill-white" : ""}`} />
          {hasLiked ? "Liked" : "Like this article"}
          {data && <span className="ml-1 opacity-80">({data.likes})</span>}
        </Button>
      </div>

      {/* Comment Section */}
      <div className="bg-card/30 rounded-2xl p-6 sm:p-8 border border-border">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-sky-500" />
          Discussion
        </h3>

        {/* Comment Form - Hide top form if replying to someone */}
        {!replyingTo && renderCommentForm()}

        {/* Existing Comments */}
        <div className="space-y-6">
          {data?.comments && data.comments.length > 0 ? (
            data.comments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                {renderCommentCard(comment)}
                
                {/* Render inline reply form under the main comment if selected */}
                {replyingTo?.id === comment.id && renderCommentForm(true)}
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-4 pl-2">
                    {comment.replies.map(reply => (
                      <div key={reply.id}>
                        {renderCommentCard(reply, true)}
                        {/* Render inline reply form under the reply if selected */}
                        {replyingTo?.id === reply.id && renderCommentForm(true)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8 italic border border-dashed border-border rounded-xl">
              No comments yet. Be the first to start the discussion!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
