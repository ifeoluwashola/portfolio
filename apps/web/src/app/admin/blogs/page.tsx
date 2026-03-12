"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Eye, Heart, MessageSquare } from "lucide-react";
import Cookies from "js-cookie";

interface BlogStats {
  slug: string;
  views: number;
  likes: number;
  comments: number;
}

export default function AdminBlogsPage() {
  const [stats, setStats] = useState<BlogStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = Cookies.get("admin_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/admin/blog/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch blog stats", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const totalViews = stats.reduce((acc, curr) => acc + curr.views, 0);
  const totalLikes = stats.reduce((acc, curr) => acc + curr.likes, 0);
  const totalComments = stats.reduce((acc, curr) => acc + curr.comments, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Track views, likes, and comments across your technical articles.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Unique page loads across all posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes}</div>
            <p className="text-xs text-muted-foreground">Audience appreciation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComments}</div>
            <p className="text-xs text-muted-foreground">Audience engagement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Post</CardTitle>
            <BarChart className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length > 0 ? stats[0].views : 0} Views</div>
            <p className="text-xs text-muted-foreground truncate" title={stats.length > 0 ? stats[0].slug : "None"}>
              {stats.length > 0 ? stats[0].slug : "No posts yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Performance</CardTitle>
          <CardDescription>Metrics broken down by blog post slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Post Slug</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Loading stats...
                    </TableCell>
                  </TableRow>
                ) : stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No blog data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.map((stat) => (
                    <TableRow key={stat.slug}>
                      <TableCell className="font-medium text-sky-500">{stat.slug}</TableCell>
                      <TableCell className="text-right">{stat.views}</TableCell>
                      <TableCell className="text-right">{stat.likes}</TableCell>
                      <TableCell className="text-right">{stat.comments}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
