"use client";

import { useEffect, useState } from "react";
import { Heart, Eye, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  id: number;
  slug: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface BlogData {
  views: number;
  likes: number;
  comments: Comment[];
}

const viewedPosts = new Set<string>();

export function BlogInteractivity({ slug }: { slug: string }) {
  const [data, setData] = useState<BlogData | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";

  useEffect(() => {
    let isMounted = true;

    // Register View
    const registerView = async () => {
      if (viewedPosts.has(slug)) return;
      
      try {
        await fetch(`${API_URL}/blog/${slug}/view`, { method: "POST" });
        viewedPosts.add(slug);
      } catch (err) {
        console.error("Failed to register view", err);
      }
    };

    // Fetch initial metrics and comments
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/blog/${slug}`);
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
      const res = await fetch(`${API_URL}/blog/${slug}/like`, { method: "POST" });
      if (res.ok) {
        setHasLiked(true);
        setData(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        
        // Save to local storage
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !commentContent) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/blog/${slug}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, content: commentContent })
      });

      if (res.ok) {
        const newComment = await res.json();
        setData(prev => prev ? { ...prev, comments: [newComment, ...prev.comments] } : null);
        setDisplayName("");
        setCommentContent("");
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mb-10 space-y-4">
          <Input 
            placeholder="Name (displayed publicly)" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="max-w-xs bg-background"
          />
          <Textarea 
            placeholder="Share your thoughts on this article..." 
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            required
            className="min-h-[100px] bg-background"
          />
          <Button type="submit" disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-500 text-white gap-2">
            <Send className="w-4 h-4" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>

        {/* Existing Comments */}
        <div className="space-y-6">
          {data?.comments && data.comments.length > 0 ? (
            data.comments.map((comment) => (
              <div key={comment.id} className="bg-background rounded-xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-foreground">{comment.display_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
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
