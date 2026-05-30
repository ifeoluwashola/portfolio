"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getMonitoringMetrics, getMonitoringLogs, getMonitoringAuditLogs } from "../actions";
import { Activity, Terminal, Shield, RefreshCcw, Search } from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // App Logs Filters (Client-side)
  const [appLogQuery, setAppLogQuery] = useState("");
  const [appLogLevel, setAppLogLevel] = useState("ALL");
  const [appLogTimeframe, setAppLogTimeframe] = useState("ALL");

  // Audit Logs Filters (Server-side)
  const [auditQuery, setAuditQuery] = useState("");
  const [auditHours, setAuditHours] = useState("0");

  const fetchMetrics = async () => {
    const res = await getMonitoringMetrics();
    if (res.data) {
      setMetrics(res.data);
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setMetricsHistory(prev => {
        const newData = [...prev, { ...res.data, time: timeLabel }];
        return newData.length > 30 ? newData.slice(newData.length - 30) : newData;
      });
    }
  };

  const fetchLogs = async () => {
    const res = await getMonitoringLogs();
    if (res.data) setLogs(res.data);
  };

  const fetchAuditLogs = async () => {
    const res = await getMonitoringAuditLogs(auditQuery, auditHours);
    if (res.data) setAuditLogs(res.data);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchLogs(), fetchAuditLogs()]);
    setLoading(false);
  };

  // Setup Polling
  useEffect(() => {
    setMounted(true);
    fetchAll();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchLogs();
    }, 3000); // 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredAppLogs = logs.filter(log => {
    if (appLogLevel !== "ALL") {
      const isLevelMatch = log.level === appLogLevel || (log.raw && log.raw.includes(`level=${appLogLevel}`));
      if (!isLevelMatch) return false;
    }
    if (appLogTimeframe !== "ALL") {
      if (log.time) {
        const logTime = new Date(log.time).getTime();
        const now = new Date().getTime();
        const diffMins = (now - logTime) / 60000;
        if (appLogTimeframe === "5m" && diffMins > 5) return false;
        if (appLogTimeframe === "15m" && diffMins > 15) return false;
        if (appLogTimeframe === "60m" && diffMins > 60) return false;
      }
    }
    if (appLogQuery) {
      const str = JSON.stringify(log).toLowerCase();
      if (!str.includes(appLogQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Monitoring Command Center
          </h1>
          <p className="text-muted-foreground mt-1">Real-time system health, application logs, and immutable audit trails.</p>
        </div>
        <button 
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Force Sync
        </button>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">App Logs</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* METRICS TAB */}
        <TabsContent value="metrics" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {/* Goroutines Chart */}
            <Card className="col-span-1 border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goroutines</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{metrics?.goroutines || 0}</div>
                <div className="h-[120px] w-full mt-2">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGoroutines" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }} />
                        <Area type="monotone" dataKey="goroutines" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGoroutines)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Allocated Memory Chart */}
            <Card className="col-span-1 border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Allocated</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{metrics?.alloc_mb || 0} MB</div>
                <div className="h-[120px] w-full mt-2">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAlloc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }} />
                        <Area type="monotone" dataKey="alloc_mb" stroke="#10b981" fillOpacity={1} fill="url(#colorAlloc)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Memory Chart */}
            <Card className="col-span-1 border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Memory</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{metrics?.sys_mb || 0} MB</div>
                <div className="h-[120px] w-full mt-2">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }} />
                        <Area type="monotone" dataKey="sys_mb" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSys)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GC Cycles Chart */}
            <Card className="col-span-1 border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GC Cycles</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{metrics?.num_gc || 0}</div>
                <div className="h-[120px] w-full mt-2">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGC" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }} />
                        <Area type="monotone" dataKey="num_gc" stroke="#f59e0b" fillOpacity={1} fill="url(#colorGC)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* APP LOGS TAB */}
        <TabsContent value="logs" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Live Application Logs
                  </CardTitle>
                  <CardDescription>Streaming structured JSON logs from the Go backend (Last 1000 lines).</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter logs..."
                      value={appLogQuery}
                      onChange={(e) => setAppLogQuery(e.target.value)}
                      className="h-9 w-[200px] pl-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <select 
                    value={appLogLevel} 
                    onChange={(e) => setAppLogLevel(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                  <select 
                    value={appLogTimeframe} 
                    onChange={(e) => setAppLogTimeframe(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Buffer</option>
                    <option value="5m">Last 5 Mins</option>
                    <option value="15m">Last 15 Mins</option>
                    <option value="60m">Last 1 Hour</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer ml-2">
                    <input 
                      type="checkbox" 
                      checked={autoScroll} 
                      onChange={(e) => setAutoScroll(e.target.checked)} 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Auto-scroll
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#0D1117] text-[#C9D1D9] p-4 h-[600px] overflow-y-auto font-mono text-[13px] leading-relaxed rounded-b-xl border border-t-0 border-[#30363D]">
                {filteredAppLogs.length === 0 ? (
                  <div className="text-muted-foreground text-center mt-10">No logs match your filters...</div>
                ) : (
                  filteredAppLogs.map((log, i) => {
                    if (log.raw) {
                      return <div key={i} className="whitespace-pre-wrap break-all py-1 border-b border-[#21262d] last:border-0">{log.raw}</div>;
                    }
                    
                    const time = log.time ? new Date(log.time).toLocaleTimeString() : "";
                    const isError = log.level === "ERROR" || log.level === "SEVERE";
                    const isWarn = log.level === "WARN";
                    
                    let levelColor = "text-blue-400";
                    if (isError) levelColor = "text-red-500 font-bold";
                    if (isWarn) levelColor = "text-yellow-400";

                    return (
                      <div key={i} className={`py-1 border-b border-[#21262d] last:border-0 ${isError ? 'bg-red-500/10' : ''}`}>
                        <span className="text-[#8B949E] mr-3">[{time}]</span>
                        <span className={`${levelColor} mr-3 w-12 inline-block`}>{log.level}</span>
                        <span className="font-semibold text-[#E6EDF3] mr-3">{log.msg}</span>
                        <span className="text-[#8B949E]">
                          {Object.entries(log)
                            .filter(([k]) => !['time', 'level', 'msg'].includes(k))
                            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                            .join(" ")}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT LOGS TAB */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border bg-muted/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Immutable Audit Trail
                  </CardTitle>
                  <CardDescription>Permanent records of mutative administrative and system actions.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search DB (action, actor, resource)..."
                      value={auditQuery}
                      onChange={(e) => setAuditQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                      className="h-9 w-[280px] pl-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <select 
                    value={auditHours} 
                    onChange={(e) => setAuditHours(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="0">All Time</option>
                    <option value="24">Last 24 Hours</option>
                    <option value="168">Last 7 Days</option>
                    <option value="720">Last 30 Days</option>
                  </select>
                  <Button variant="secondary" size="sm" onClick={fetchAuditLogs} className="h-9">
                    Fetch
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                      <th className="px-4 py-3 font-medium">Actor</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Target Resource</th>
                      <th className="px-4 py-3 font-medium text-right">Context/Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{log.actor_id}</div>
                            <div className="text-xs text-muted-foreground uppercase">{log.actor_role}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>{log.resource_type}</div>
                            <div className="text-xs font-mono text-muted-foreground">{log.resource_id}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs font-mono text-muted-foreground bg-muted p-1 rounded max-w-[200px] truncate ml-auto">
                              {log.details ? JSON.stringify(log.details) : "{}"}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[200px] ml-auto">
                              {log.ip_address} • {log.user_agent?.substring(0, 30)}...
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
