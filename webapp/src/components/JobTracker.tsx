"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: string;
  interviewDate: string | null;
  notes: string | null;
  createdAt: string;
}

const statusOptions = ["Pending", "Interviewing", "Offer", "Rejected"];

const trackerTranslations = {
  en: {
    title: "Job Tracker",
    addJob: "Add New Job",
    company: "Company",
    position: "Position",
    status: "Status",
    interviewDate: "Interview Date",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    noJobs: "No job applications found.",
    total: "Total",
    pending: "Pending",
    interviewing: "Interviewing",
    offers: "Offers",
    rejected: "Rejected",
    calendar: "Interview Calendar",
    close: "Close",
    formTitle: "Application Details",
    confirmDelete: "Are you sure you want to delete this application?",
    autoTrack: "AI Auto-Track",
    autoTracking: "Analyzing...",
    autoTrackSuccess: "AI found {created} new and updated {updated} jobs!"
  },
  th: {
    title: "ติดตามงาน",
    addJob: "เพิ่มงานใหม่",
    company: "บริษัท",
    position: "ตำแหน่ง",
    status: "สถานะ",
    interviewDate: "วันที่สัมภาษณ์",
    notes: "หมายเหตุ",
    save: "บันทึก",
    cancel: "ยกเลิก",
    edit: "แก้ไข",
    delete: "ลบ",
    noJobs: "ยังไม่มีการสมัครงาน",
    total: "ทั้งหมด",
    pending: "รอดำเนินการ",
    interviewing: "กำลังสัมภาษณ์",
    offers: "ได้รับข้อเสนอ",
    rejected: "ปฏิเสธ",
    calendar: "ปฏิทินสัมภาษณ์",
    close: "ปิด",
    formTitle: "รายละเอียดการสมัคร",
    confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
    autoTrack: "AI ติดตามอัตโนมัติ",
    autoTracking: "กำลังวิเคราะห์...",
    autoTrackSuccess: "AI พบงานใหม่ {created} และอัปเดต {updated} รายการ!"
  }
};

interface JobTrackerProps {
  lang: "en" | "th";
}

export default function JobTracker({ lang }: JobTrackerProps) {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [autoTracking, setAutoTracking] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null)
  const [syncMessage, setSyncMessage] = useState("")
  
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "Pending",
    interviewDate: "",
    notes: ""
  })

  const t = trackerTranslations[lang];

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs")
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchJobs()
  }, [session, fetchJobs])

  const handleAutoSync = async () => {
    setAutoTracking(true)
    setSyncMessage("")
    try {
      const res = await fetch("/api/jobs/auto-sync", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(t.autoTrackSuccess.replace("{created}", data.createdCount).replace("{updated}", data.updatedCount))
        fetchJobs()
      }
    } catch (error) {
      console.error("Auto-sync error:", error)
    } finally {
      setAutoTracking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingJob ? "PATCH" : "POST"
    const url = editingJob ? `/api/jobs/${editingJob.id}` : "/api/jobs"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowModal(false)
        setEditingJob(null)
        setFormData({ company: "", position: "", status: "Pending", interviewDate: "", notes: "" })
        fetchJobs()
      }
    } catch (error) {
      console.error("Error saving job:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" })
      if (res.ok) fetchJobs()
    } catch (error) {
      console.error("Error deleting job:", error)
    }
  }

  const openEdit = (job: JobApplication) => {
    setEditingJob(job)
    setFormData({
      company: job.company,
      position: job.position,
      status: job.status,
      interviewDate: job.interviewDate ? new Date(job.interviewDate).toISOString().split('T')[0] : "",
      notes: job.notes || ""
    })
    setShowModal(true)
  }

  // Simple Calendar Logic
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === "Pending").length,
    interviewing: jobs.filter(j => j.status === "Interviewing").length,
    offers: jobs.filter(j => j.status === "Offer").length,
    rejected: jobs.filter(j => j.status === "Rejected").length,
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t.total, val: stats.total, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
          { label: t.pending, val: stats.pending, color: "bg-amber-50 text-amber-600 border-amber-100" },
          { label: t.interviewing, val: stats.interviewing, color: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: t.offers, val: stats.offers, color: "bg-green-50 text-green-600 border-green-100" },
          { label: t.rejected, val: stats.rejected, color: "bg-red-50 text-red-600 border-red-100" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} p-4 rounded-2xl border flex flex-col items-center justify-center shadow-sm`}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</span>
            <span className="text-2xl font-black">{s.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Job List */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.title}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleAutoSync}
                  disabled={autoTracking}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border border-indigo-100"
                >
                  {autoTracking ? (
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  )}
                  {autoTracking ? t.autoTracking : t.autoTrack}
                </button>
                <button 
                  onClick={() => { setEditingJob(null); setFormData({ company: "", position: "", status: "Pending", interviewDate: "", notes: "" }); setShowModal(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  {t.addJob}
                </button>
              </div>
            </div>
            
            {syncMessage && (
              <div className="bg-green-50 border-b border-green-100 px-6 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">{syncMessage}</span>
                <button onClick={() => setSyncMessage("")} className="text-green-400 hover:text-green-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {loading ? (
                <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase text-xs">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">{t.noJobs}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-6 hover:bg-slate-50/50 transition-colors group flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-black text-slate-900 truncate">{job.company}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            job.status === "Offer" ? "bg-green-100 text-green-700" :
                            job.status === "Rejected" ? "bg-red-100 text-red-700" :
                            job.status === "Interviewing" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {lang === "th" ? (
                              job.status === "Pending" ? "รอดำเนินการ" :
                              job.status === "Interviewing" ? "สัมภาษณ์" :
                              job.status === "Offer" ? "ได้รับงาน" : "ปฏิเสธ"
                            ) : job.status}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600 font-bold mb-2 uppercase tracking-wide">{job.position}</p>
                        {job.interviewDate && (
                          <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-[11px] font-medium">{new Date(job.interviewDate).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium' })}</span>
                          </div>
                        )}
                        {job.notes && <p className="text-[11px] text-slate-400 italic line-clamp-1">{job.notes}</p>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(job)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(job.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Calendar View */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">{t.calendar}</h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <span className="font-black text-lg uppercase tracking-tight">
                {viewDate.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {(lang === 'th' ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]).map(d => (
                <span key={d} className="text-[10px] font-black text-slate-500 uppercase">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth(viewDate) }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
                const day = i + 1;
                const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const hasInterview = jobs.some(j => j.interviewDate && new Date(j.interviewDate).toDateString() === d.toDateString());
                const isToday = d.toDateString() === today.toDateString();

                return (
                  <div key={day} className={`aspect-square flex flex-col items-center justify-center rounded-xl relative text-xs font-bold transition-all ${
                    isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-white/5"
                  }`}>
                    {day}
                    {hasInterview && <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-indigo-500"}`}></div>}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 space-y-3">
              {jobs.filter(j => j.interviewDate && new Date(j.interviewDate).getMonth() === viewDate.getMonth() && new Date(j.interviewDate).getFullYear() === viewDate.getFullYear())
                .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime())
                .map(j => (
                  <div key={j.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs">
                      {new Date(j.interviewDate!).getDate()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black truncate">{j.company}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{j.position}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t.formTitle}</span>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.company}</label>
                <input required type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.position}</label>
                <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.status}</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all">
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.interviewDate}</label>
                  <input type="date" value={formData.interviewDate} onChange={e => setFormData({...formData, interviewDate: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.notes}</label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">{t.cancel}</button>
                <button type="submit" className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
