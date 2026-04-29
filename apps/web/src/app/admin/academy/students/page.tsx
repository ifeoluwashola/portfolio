"use client";

import { useEffect, useState } from "react";
import { 
  getAllStudents, 
  warnStudent, 
  disqualifyStudent 
} from "@/app/academy/actions";
import { 
  updateStudentStatus 
} from "../../actions";
import { 
  Users, 
  ShieldAlert, 
  Ban, 
  Search, 
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Loader2,
  Info
} from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'graduated' | 'disqualified' | 'probation';
  warning_count: number;
  disqualification_reason?: string;
  is_manually_locked: boolean;
  attendance_rate: number;
  attended_count: number;
  total_held_sessions: number;
  created_at: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [warnReason, setWarnReason] = useState("");
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showProbationModal, setShowProbationModal] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    const data = await getAllStudents();
    if (Array.isArray(data)) {
      setStudents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleWarn = async () => {
    if (!selectedStudent || !warnReason.trim()) {
      setFeedback({ type: 'error', message: "Please provide a reason for the warning" });
      return;
    }
    const res = await warnStudent(selectedStudent.id, warnReason);
    if (res.success) {
      setFeedback({ message: `Warning issued to ${selectedStudent.first_name}`, type: 'success' });
      setShowWarnModal(false);
      setWarnReason("");
      fetchStudents();
    } else {
      setFeedback({ message: res.error || "Failed to warn student", type: 'error' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDisqualify = async () => {
    if (!selectedStudent || !disqualifyReason) return;
    const res = await disqualifyStudent(selectedStudent.id, disqualifyReason);
    if (res.success) {
      setShowDisqualifyModal(false);
      setDisqualifyReason("");
      setFeedback({ message: `${selectedStudent.first_name} has been disqualified`, type: 'success' });
      setSelectedStudent(null);
      fetchStudents();
    } else {
      setFeedback({ message: res.error || "Failed to disqualify student", type: 'error' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleLock = async (student: Student) => {
    setActionLoading(student.id);
    const newLockState = !student.is_manually_locked;
    const res = await updateStudentStatus(student.id, student.status, newLockState);
    
    if (res.success) {
      setFeedback({ 
        message: `Portal access ${newLockState ? 'locked' : 'unlocked'} for ${student.first_name}`, 
        type: 'success' 
      });
      fetchStudents();
    } else {
      setFeedback({ message: "Failed to update portal lock", type: 'error' });
    }
    setActionLoading(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApplyProbation = async () => {
    if (!selectedStudent) return;
    setActionLoading(selectedStudent.id);
    const res = await updateStudentStatus(selectedStudent.id, 'probation', selectedStudent.is_manually_locked);
    
    if (res.success) {
      setFeedback({ 
        message: `${selectedStudent.first_name} is now on Academic Probation`, 
        type: 'success' 
      });
      setShowProbationModal(false);
      fetchStudents();
    } else {
      setFeedback({ message: "Failed to apply probation", type: 'error' });
    }
    setActionLoading(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleViewAttendance = async (student: Student) => {
    setSelectedStudent(student);
    setFetchingAttendance(true);
    setShowAttendanceModal(true);
    
    try {
      const res = await fetch(`/api/v1/admin/students/${student.id}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(data);
      } else {
        setFeedback({ message: "Failed to fetch attendance history", type: 'error' });
      }
    } catch (err) {
      setFeedback({ message: "Network error fetching attendance", type: 'error' });
    } finally {
      setFetchingAttendance(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="bg-emerald-900/40 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-800/50 flex items-center gap-1 w-fit uppercase tracking-tighter shadow-sm">Active</span>;
      case 'probation': return <span className="bg-amber-900/40 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-800/50 flex items-center gap-1 w-fit uppercase tracking-tighter shadow-sm animate-pulse">Probation</span>;
      case 'graduated': return <span className="bg-sky-900/40 text-sky-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-sky-800/50 flex items-center gap-1 w-fit uppercase tracking-tighter shadow-sm">Graduated</span>;
      case 'disqualified': return <span className="bg-rose-900/40 text-rose-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-800/50 flex items-center gap-1 w-fit uppercase tracking-tighter shadow-sm">Disqualified</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {/* Feedback Overlay */}
      {feedback && (
        <div className="fixed top-20 right-6 z-[100] animate-in slide-in-from-right duration-300">
           <div className={`px-6 py-4 rounded-xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
             feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
           }`}>
             {feedback.type === 'success' ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}
             <span className="font-bold text-sm uppercase tracking-widest">{feedback.message}</span>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Users className="text-primary h-8 w-8" />
            Student Master List
          </h1>
          <p className="text-slate-400 text-sm mt-1">Unified academic standing and administrative security dashboard.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            className="bg-card/50 border border-border rounded-full pl-10 pr-4 py-2 text-white w-full md:w-64 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card/50 border border-border rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em]">
              <th className="px-6 py-5 font-semibold">Student Identity</th>
              <th className="px-6 py-5 font-semibold">Status Matrix</th>
              <th className="px-6 py-5 font-semibold">Participation</th>
              <th className="px-6 py-5 font-semibold">Disciplinary History</th>
              <th className="px-6 py-5 font-semibold text-right">Moderation Suite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-24 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Synchronizing student data...
              </td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-24 text-center text-muted-foreground uppercase tracking-widest text-xs">Zero records match the active query.</td></tr>
            ) : filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-800/20 transition-all group">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold group-hover:text-primary transition-colors">{student.first_name} {student.last_name}</span>
                    <span className="text-muted-foreground text-[11px] font-mono">{student.email}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(student.status)}
                    {student.is_manually_locked && (
                      <span className="bg-rose-950/40 text-rose-500 px-2 py-0.5 rounded text-[10px] font-black border border-rose-900/50 flex items-center gap-1 uppercase tracking-tighter">
                        <Lock size={10} /> System Lock
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                   <button 
                     onClick={() => handleViewAttendance(student)}
                     className="group/attend flex items-center gap-3 hover:bg-white/5 p-2 -m-2 rounded-lg transition-all"
                   >
                     <div className="relative h-10 w-10 flex items-center justify-center">
                        <svg className="h-10 w-10 -rotate-90">
                           <circle
                             cx="20" cy="20" r="16"
                             className="stroke-slate-800 fill-none"
                             strokeWidth="4"
                           />
                           <circle
                             cx="20" cy="20" r="16"
                             className={`fill-none transition-all duration-1000 ${
                               student.attendance_rate > 80 ? 'stroke-emerald-500' : 
                               student.attendance_rate > 50 ? 'stroke-primary' : 'stroke-rose-500'
                             }`}
                             strokeWidth="4"
                             strokeDasharray={100}
                             strokeDashoffset={100 - (student.attendance_rate || 0)}
                             strokeLinecap="round"
                           />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                           {Math.round(student.attendance_rate || 0)}%
                        </span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Live Ops</span>
                        <span className="text-xs font-bold text-foreground">{student.attended_count}/{student.total_held_sessions}</span>
                     </div>
                   </button>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                     <div className={`h-1.5 w-16 rounded-full overflow-hidden bg-slate-800`}>
                        <div 
                           className={`h-full ${student.warning_count >= 3 ? 'bg-rose-500' : 'bg-primary'} transition-all shadow-[0_0_8px_rgba(234,179,8,0.3)]`} 
                           style={{ width: `${Math.min(student.warning_count * 33.3, 100)}%` }}
                        />
                     </div>
                     <span className={`text-[11px] font-black ${student.warning_count > 0 ? 'text-primary' : 'text-slate-600'}`}>
                       W-0{student.warning_count}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => handleToggleLock(student)}
                      disabled={actionLoading === student.id}
                      className={`p-2 rounded-lg transition-all ${
                        student.is_manually_locked 
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500'
                      }`}
                      title={student.is_manually_locked ? "Unlock Portal" : "Lock Portal"}
                    >
                      {actionLoading === student.id ? <Loader2 size={16} className="animate-spin" /> : student.is_manually_locked ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>

                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowProbationModal(true);
                      }}
                      disabled={student.status === 'disqualified' || student.status === 'probation'}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                      title="Apply Academic Probation"
                    >
                      <Info size={16} />
                    </button>

                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowWarnModal(true);
                      }}
                      disabled={student.status === 'disqualified'}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Issue Official Warning"
                    >
                      <AlertTriangle size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDisqualifyModal(true);
                      }}
                      disabled={student.status === 'disqualified'}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Terminate Enrollment"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Probation Modal */}
      {showProbationModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-amber-500/30 max-w-md w-full rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-amber-500 mb-6 font-black tracking-tight uppercase">
              <Info size={24} />
              <h2>Apply Academic Probation</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Changing status for <span className="text-white font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</span>. This will trigger a notification email and move the student into a &quot;Monitored&quot; state for 14 days.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowProbationModal(false)} className="flex-1 py-3 bg-slate-800 text-foreground font-bold rounded-xl hover:bg-slate-700 transition-all text-sm">Abort</button>
              <button onClick={handleApplyProbation} className="flex-1 py-3 bg-amber-500 text-amber-950 font-black rounded-xl hover:bg-amber-400 transition-all text-sm uppercase">Apply Status</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarnModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-primary/30 max-w-md w-full rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-primary mb-6 font-black tracking-tight uppercase">
              <AlertTriangle size={24} />
              <h2>New Disciplinary Ledger</h2>
            </div>
            
            <div className="space-y-4 mb-8">
              <textarea
                placeholder="Detail the infraction for official student notification..."
                className="w-full bg-background border border-border rounded-xl p-4 text-white text-sm min-h-[120px] focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => { setShowWarnModal(false); setWarnReason(""); }}
                className="flex-1 py-3 bg-slate-800 text-foreground font-bold rounded-xl hover:bg-slate-700 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleWarn}
                className="flex-1 py-3 bg-primary text-black font-black rounded-xl hover:bg-yellow-400 transition-all text-sm uppercase"
              >
                Post Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disqualify Modal */}
      {showDisqualifyModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-rose-900/50 max-w-lg w-full rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-rose-500 mb-6 font-black tracking-tight uppercase">
              <ShieldAlert size={24} />
              <h2>Final Termination Sequence</h2>
            </div>

            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Permanent de-enrollment for <span className="text-white font-black">{selectedStudent.first_name} {selectedStudent.last_name}</span>. 
              Infrastructure access will be purged immediately.
            </p>

            <div className="space-y-4">
              <textarea
                placeholder="Official reason for terminal revocation..."
                className="w-full bg-background border border-border rounded-xl p-4 text-white text-sm min-h-[120px] focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                value={disqualifyReason}
                onChange={(e) => setDisqualifyReason(e.target.value)}
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowDisqualifyModal(false)} className="flex-1 py-3 bg-slate-800 text-foreground font-bold rounded-xl hover:bg-slate-700 transition-all text-sm">Abort</button>
              <button 
                onClick={handleDisqualify}
                disabled={!disqualifyReason || disqualifyReason.length < 5}
                className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-500 transition-all text-sm uppercase disabled:opacity-50"
              >
                Purge Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      {showAttendanceModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-card border border-border max-w-2xl w-full rounded-2xl p-0 shadow-2xl flex flex-col h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-border bg-background/50 flex items-center justify-between">
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Attendance Ledger</h2>
                    <p className="text-muted-foreground text-xs mt-1">Audit trail for <span className="text-primary">{selectedStudent.first_name} {selectedStudent.last_name}</span></p>
                 </div>
                 <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-all">&times; Close</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                 {fetchingAttendance ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic text-sm">
                       <Loader2 className="animate-spin mb-4 text-primary" />
                       Synchronizing local attendance records...
                    </div>
                 ) : attendanceHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm uppercase tracking-widest">
                       Zero session data recorded for this student.
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {attendanceHistory.map((rec, i) => (
                          <div key={i} className="bg-background/50 border border-border/50 rounded-xl p-4 flex items-center justify-between group hover:border-border transition-all">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-white tracking-tight">{rec.session_title}</span>
                                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                                   {new Date(rec.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                   <span className="h-1 w-1 rounded-full bg-slate-800" />
                                   {rec.status.toUpperCase()}
                                </span>
                             </div>
                             
                             <div className="flex items-center gap-4">
                                {rec.attended ? (
                                   <div className="flex flex-col items-end">
                                      <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                         <CheckCircle2 size={10} /> Present
                                      </span>
                                      {rec.joined_at && <span className="text-[9px] font-mono text-slate-600 mt-1">{new Date(rec.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                   </div>
                                ) : (
                                   <span className="bg-rose-950/50 text-rose-500 border border-rose-900/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                      <Ban size={10} /> Absent
                                   </span>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
              
              <div className="p-6 bg-background/50 border-t border-border flex items-center justify-between">
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Global Coverage</span>
                    <span className="text-white text-lg">{Math.round(selectedStudent.attendance_rate)}%</span>
                 </div>
                 <button onClick={() => setShowAttendanceModal(false)} className="px-6 py-2 bg-slate-800 text-foreground font-bold rounded-lg hover:bg-slate-700 transition-all text-sm">Dismiss</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
