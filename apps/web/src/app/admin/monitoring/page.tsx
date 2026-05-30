"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMonitoringMetrics, getMonitoringLogs, getMonitoringAuditLogs } from "../actions";
import { Activity, Terminal, Shield, RefreshCcw } from "lucide-react";

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchMetrics = async () => {
    const res = await getMonitoringMetrics();
    if (res.data) setMetrics(res.data);
  };

  const fetchLogs = async () => {
    const res = await getMonitoringLogs();
    if (res.data) setLogs(res.data);
  };

  const fetchAuditLogs = async () => {
    const res = await getMonitoringAuditLogs();
    if (res.data) setAuditLogs(res.data);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchLogs(), fetchAuditLogs()]);
    setLoading(false);
  };

  // Setup Polling
  useEffect(() => {
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goroutines</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.goroutines || 0}</div>
                <p className="text-xs text-muted-foreground">Current execution threads</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Allocated</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.alloc_mb || 0} MB</div>
                <p className="text-xs text-muted-foreground">Current heap usage</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Memory</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.sys_mb || 0} MB</div>
                <p className="text-xs text-muted-foreground">Total OS memory obtained</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GC Cycles</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.num_gc || 0}</div>
                <p className="text-xs text-muted-foreground">Garbage collection runs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* APP LOGS TAB */}
        <TabsContent value="logs" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Live Application Logs
                  </CardTitle>
                  <CardDescription>Streaming structured JSON logs from the Go backend (Last 1000 lines).</CardDescription>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoScroll} 
                    onChange={(e) => setAutoScroll(e.target.checked)} 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Auto-scroll
                </label>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#0D1117] text-[#C9D1D9] p-4 h-[600px] overflow-y-auto font-mono text-[13px] leading-relaxed rounded-b-xl border border-t-0 border-[#30363D]">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-center mt-10">No logs captured yet...</div>
                ) : (
                  logs.map((log, i) => {
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Immutable Audit Trail
              </CardTitle>
              <CardDescription>Permanent records of mutative administrative and system actions.</CardDescription>
            </CardHeader>
            <CardContent>
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
