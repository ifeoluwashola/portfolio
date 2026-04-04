"use client";

import { useEffect, useState } from "react";
import { getAllStudents, warnStudent, disqualifyStudent } from "@/app/academy/actions";
import { 
  Users, 
  ShieldAlert, 
  Ban, 
  Search, 
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'graduated' | 'disqualified';
  warning_count: number;
  disqualification_reason?: string;
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
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="bg-blue-900/40 text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-800/50 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Active</span>;
      case 'graduated': return <span className="bg-emerald-900/40 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-800/50 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Graduated</span>;
      case 'disqualified': return <span className="bg-red-900/40 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-800/50 flex items-center gap-1 w-fit"><XCircle size={12}/> Disqualified</span>;
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-[#eab308]" />
            Student Management
          </h1>
          <p className="text-slate-400 text-sm">Monitor performance and manage disciplinary actions.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            className="bg-[#0f172a] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white w-full md:w-64 focus:ring-1 focus:ring-[#eab308] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e293b]/50 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Warnings</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Retrieving student logs...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No students found matching your criteria.</td></tr>
            ) : filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{student.first_name} {student.last_name}</span>
                    <span className="text-slate-500 text-xs">{student.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(student.status)}
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <div className={`h-2 w-12 rounded-full overflow-hidden bg-slate-800`}>
                        <div 
                          className={`h-full ${student.warning_count >= 3 ? 'bg-red-500' : 'bg-[#eab308]'} transition-all`} 
                          style={{ width: `${Math.min(student.warning_count * 33.3, 100)}%` }}
                        />
                     </div>
                     <span className={`text-xs ${student.warning_count > 0 ? 'text-[#eab308]' : 'text-slate-500'}`}>
                       {student.warning_count}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowWarnModal(true);
                      }}
                      disabled={student.status === 'disqualified'}
                      className="p-2 text-slate-400 hover:text-[#eab308] hover:bg-[#eab308]/10 rounded-lg transition-all"
                      title="Issue Warning"
                    >
                      <AlertTriangle size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDisqualifyModal(true);
                      }}
                      disabled={student.status === 'disqualified'}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Disqualify"
                    >
                      <Ban size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warning Modal */}
      {showWarnModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#eab308]/30 max-w-md w-full rounded-2xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.1)] animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-[#eab308] mb-6">
              <AlertTriangle size={28} />
              <h2 className="text-xl font-bold uppercase tracking-tight">Issue Formal Warning</h2>
            </div>
            
            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              Issuing a warning to <span className="text-white font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</span>.
            </p>

            <div className="space-y-4 mb-8">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Official Warning Note</label>
              <textarea
                placeholder="Detail the infraction (e.g. Inactivity, violation of conduct, etc.)"
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 text-white text-sm min-h-[100px] focus:ring-1 focus:ring-[#eab308] outline-none"
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowWarnModal(false);
                  setWarnReason("");
                }}
                className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
              >
                Abort
              </button>
              <button 
                onClick={handleWarn}
                className="flex-1 px-4 py-3 bg-[#eab308] text-black font-bold rounded-xl hover:bg-yellow-500 transition-colors text-xs uppercase tracking-widest"
              >
                Confirm Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disqualify Modal */}
      {showDisqualifyModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-red-900/50 max-w-lg w-full rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-500 mb-6">
              <ShieldAlert size={28} />
              <h2 className="text-xl font-bold uppercase tracking-tight">Disqualify Student</h2>
            </div>

            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              You are about to disqualify <span className="text-white font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</span>. 
              This will revoke their access to the student portal and send an automated termination notice.
            </p>

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Reason for Termination</label>
              <textarea
                placeholder="e.g. Repeated violation of terms, plagiarism, or inactivity..."
                className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 text-white text-sm min-h-[120px] focus:ring-1 focus:ring-red-500 outline-none"
                value={disqualifyReason}
                onChange={(e) => setDisqualifyReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowDisqualifyModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleDisqualify}
                disabled={!disqualifyReason || disqualifyReason.length < 10}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Termination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
