"use client"

import { signOut, useSession } from "next-auth/react"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import JobTracker from "./JobTracker"

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body?: string;
  receivedAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

const translations = {
  en: {
    dashboard: "Dashboard v3.1",
    signOut: "Sign Out",
    syncGmail: "Sync Gmail",
    syncing: "Syncing...",
    dailyUpdate: "Daily Update",
    clearData: "Clear Data",
    recentEmails: "Recent Emails",
    emailDetails: "Email Details",
    from: "From",
    date: "Date",
    askAi: "Ask AI",
    assistantChat: "Assistant Chat",
    thinking: "Thinking...",
    typeMessage: "Type your message...",
    newChat: "New Chat",
    history: "History",
    noHistory: "No history",
    noEmails: "No emails",
    confirmDelete: "Delete this chat?",
    confirmClear: "Are you sure you want to delete all synced emails? This cannot be undone.",
    synced: "Synced {count} new emails.",
    error: "Error: {error}",
    aiTitle: "Personal Career AI",
    reportMsg: "Summarize this email from {from}: {subject}",
    reportSuccess: "📊 **Daily Update:**\n\n{report}",
    reportFail: "Failed to generate daily report.",
    thai: "Thai",
    english: "English",
    mailChat: "Mail Chat",
    jobTracker: "Job Tracker",
    syncDays: "{days} days"
  },
  th: {
    dashboard: "แดชบอร์ด v3.1",
    signOut: "ออกจากระบบ",
    syncGmail: "ซิงค์ Gmail",
    syncing: "...",
    dailyUpdate: "สรุปประจำวัน",
    clearData: "ล้างข้อมูล",
    recentEmails: "อีเมลล่าสุด",
    emailDetails: "รายละเอียดอีเมล",
    from: "จาก",
    date: "วันที่",
    askAi: "ถาม AI",
    assistantChat: "แชทผู้ช่วย AI",
    thinking: "กำลังคิด...",
    typeMessage: "พิมพ์ข้อความ...",
    newChat: "แชทใหม่",
    history: "ประวัติการแชท",
    noHistory: "ไม่มีประวัติ",
    noEmails: "ไม่มีอีเมล",
    confirmDelete: "ลบแชทนี้หรือไม่?",
    confirmClear: "คุณแน่ใจหรือไม่ว่าต้องการลบอีเมลทั้งหมด? ไม่สามารถย้อนกลับได้",
    synced: "ซิงค์ใหม่ {count} ฉบับ",
    error: "ข้อผิดพลาด: {error}",
    aiTitle: "ผู้ช่วย AI ส่วนตัว",
    reportMsg: "ช่วยสรุปอีเมลนี้จาก {from}: {subject}",
    reportSuccess: "📊 **สรุปรายงานประจำวัน:**\n\n{report}",
    reportFail: "ไม่สามารถสรุปรายงานประจำวันได้",
    thai: "ไทย",
    english: "อังกฤษ",
    mailChat: "แชทอีเมล",
    jobTracker: "ติดตามงาน",
    syncDays: "{days} วัน"
  }
};

const EmailSkeleton = () => (
  <div className="p-3 border-b animate-pulse space-y-2">
    <div className="h-2 w-20 bg-slate-200 rounded"></div>
    <div className="h-3 w-full bg-slate-100 rounded"></div>
    <div className="h-2 w-12 bg-slate-50 rounded"></div>
  </div>
);

export default function Dashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [syncMessage, setSyncMessage] = useState("")
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [uiLang, setUiLang] = useState<"en" | "th">("th")
  const [view, setView] = useState<"mail" | "tracker">("mail")
  const [syncDays, setSyncDays] = useState(7)
  
  const t = translations[uiLang];

  // Chat & Report state
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([])
  const [chats, setChats] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, chatLoading])

  // Fetch emails from our DB to show in the list
  const loadEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/emails")
      if (res.ok) {
        const data = await res.json()
        setEmails(data.emails)
      }
    } catch {
      console.error("Failed to load emails")
    } finally {
      setInitialLoad(false)
    }
  }, [])

  const loadChatList = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/list")
      if (res.ok) {
        const data = await res.json()
        setChats(Array.isArray(data) ? data : [])
      }
    } catch {
      console.error("Failed to load chat list")
    }
  }, [])

  const selectChat = async (id: string | null) => {
    setCurrentChatId(id)
    setChatHistory([])
    setChatInput("")
    
    if (!id) return

    setChatLoading(true)
    try {
      const res = await fetch(`/api/chat/${id}`)
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.messages)) {
          setChatHistory(data.messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "ai" : "user",
            text: m.content
          })))
        }
      }
    } catch (err) {
      console.error("Error loading chat:", err)
    } finally {
      setChatLoading(false)
    }
  }

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(t.confirmDelete)) return
    try {
      const res = await fetch(`/api/chat/${id}`, { method: "DELETE" })
      if (res.ok) {
        if (currentChatId === id) selectChat(null)
        loadChatList()
      }
    } catch {
      console.error("Failed to delete chat")
    }
  }

  useEffect(() => {
    if (session) {
      Promise.resolve().then(() => {
        loadEmails()
        loadChatList()
      })
    }
  }, [session, loadEmails, loadChatList])

  const handleFetchEmails = async (days: number = 7) => {
    setLoading(true)
    setSyncMessage("")
    try {
      const res = await fetch("/api/emails/sync", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days })
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(t.synced.replace("{count}", data.count.toString()))
        loadEmails()
      } else {
        setSyncMessage(t.error.replace("{error}", data.error))
      }
    } catch {
      setSyncMessage("Error occurred during sync.")
    } finally {
      setLoading(false)
    }
  }

  const handleClearEmails = async () => {
    if (!confirm(t.confirmClear)) return
    setLoading(true)
    try {
      const res = await fetch("/api/emails/clear", { method: "POST" })
      if (res.ok) {
        setEmails([])
        setSelectedEmail(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setChatLoading(true)
    try {
      const res = await fetch("/api/emails/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: uiLang, chatId: currentChatId }),
      })
      const data = await res.json()
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: "ai", text: t.reportSuccess.replace("{report}", data.report) }])
        if (!currentChatId && data.chatId) {
          setCurrentChatId(data.chatId)
          loadChatList()
        }
      } else {
        setChatHistory(prev => [...prev, { role: "ai", text: t.reportFail }])
      }
    } catch {
      setChatHistory(prev => [...prev, { role: "ai", text: t.reportFail }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput("")
    setChatHistory(prev => [...prev, { role: "user", text: userMessage }])
    setChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, chatId: currentChatId, lang: uiLang }),
      })
      const data = await res.json()
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: "ai", text: data.text }])
        if (!currentChatId) {
          setCurrentChatId(data.chatId)
          loadChatList()
        }
      }
    } catch {
      setChatHistory(prev => [...prev, { role: "ai", text: "Error processing request." }])
    } finally {
      setChatLoading(false)
    }
  }

  if (!session) return null

  return (
    <div className="z-10 max-w-[1600px] w-full flex flex-col gap-6 bg-white p-4 lg:p-8 rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100">
      {/* Universal Header */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 pb-6 gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">M</div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mail Chat</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t.dashboard}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
            <button 
              onClick={() => setView("mail")} 
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                view === "mail" ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {t.mailChat}
            </button>
            <button 
              onClick={() => setView("tracker")} 
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                view === "tracker" ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>
              {t.jobTracker}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setUiLang("th")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${uiLang === "th" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{t.thai}</button>
            <button onClick={() => setUiLang("en")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${uiLang === "en" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{t.english}</button>
          </div>
          <button onClick={() => signOut()} className="px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold uppercase tracking-wider">{t.signOut}</button>
        </div>
      </div>

      {view === "mail" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pane 1 (Far Left): Profile & Emails */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                  <Image src={session.user?.image || "/next.svg"} alt="Profile" width={40} height={40} className="rounded-xl shadow-md border-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="overflow-hidden text-left">
                  <p className="font-bold text-slate-900 truncate text-sm">{session.user?.name}</p>
                  <p className="text-[9px] text-slate-500 truncate font-medium uppercase tracking-wider">{session.user?.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden p-0.5">
                    {[2, 7, 30].map(d => (
                      <button 
                        key={d}
                        onClick={() => setSyncDays(d)}
                        className={`flex-1 py-1 text-[9px] font-black uppercase tracking-tighter transition-all ${
                          syncDays === d ? "bg-indigo-600 text-white shadow-sm rounded-lg" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {t.syncDays.replace("{days}", d.toString())}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleFetchEmails(syncDays)} 
                    disabled={loading} 
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? t.syncing : t.syncGmail}
                  </button>
                </div>
                <button onClick={generateReport} disabled={chatLoading} className="bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 text-slate-700 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                  {t.dailyUpdate}
                </button>
                <button onClick={handleClearEmails} disabled={loading} className="text-red-400 hover:text-red-600 text-[9px] font-bold uppercase pt-1">{t.clearData}</button>
              </div>
              {syncMessage && <div className="mt-3 p-2 bg-indigo-50 rounded-lg text-[9px] text-center text-indigo-600 font-bold uppercase animate-pulse">{syncMessage}</div>}
            </div>

            <div className="flex-1 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.recentEmails}</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{emails.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {initialLoad || loading ? (
                  Array(6).fill(0).map((_, i) => <EmailSkeleton key={i} />)
                ) : emails.length === 0 ? (
                  <div className="p-8 text-center text-[10px] text-slate-400 font-bold">{t.noEmails}</div>
                ) : (
                  emails.map((e, i) => (
                    <div key={i} onClick={() => setSelectedEmail(e)} className={`p-3 border-b border-slate-50 cursor-pointer transition-all relative ${selectedEmail?.id === e.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                      <p className="text-[9px] font-black text-indigo-600 uppercase truncate">{e.from}</p>
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight my-0.5">{e.subject}</p>
                      <p className="text-[8px] text-slate-400 font-medium">{new Date(e.receivedAt).toLocaleDateString(uiLang === 'th' ? 'th-TH' : 'en-US')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pane 2 (Middle): Chat History Sessions */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            <button onClick={() => selectChat(null)} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-xl font-bold text-sm transition-all border border-indigo-100 flex items-center justify-center gap-2 group">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {t.newChat}
            </button>
            
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.history}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-slate-400 font-bold uppercase">{t.noHistory}</div>
                ) : (
                  chats.map(c => (
                    <div key={c.id} onClick={() => selectChat(c.id)} className={`group p-3 rounded-xl cursor-pointer transition-all relative overflow-hidden ${currentChatId === c.id ? 'bg-white shadow-md border border-indigo-100' : 'hover:bg-slate-100'}`}>
                      <p className={`text-xs font-bold truncate pr-6 ${currentChatId === c.id ? 'text-indigo-600' : 'text-slate-600'}`}>{c.title}</p>
                      <button onClick={(e) => deleteChat(c.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pane 3: Main AI Chatbot */}
          <div className="lg:col-span-7 flex flex-col h-full border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/30 shadow-sm relative">
            {/* Email Detail Modal */}
            {selectedEmail && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEmail(null)}></div>
                <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90%] border border-slate-100">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                    {t.emailDetails}
                    <button onClick={() => setSelectedEmail(null)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"><svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedEmail.subject}</h2>
                    <div className="text-xs space-y-1">
                      <p><span className="text-slate-400 font-bold uppercase text-[9px]">{t.from}:</span> <span className="font-bold text-indigo-600">{selectedEmail.from}</span></p>
                      <p><span className="text-slate-400 font-bold uppercase text-[9px]">{t.date}:</span> <span className="font-medium text-slate-600">{new Date(selectedEmail.receivedAt).toLocaleString()}</span></p>
                    </div>
                    <div className="h-px bg-slate-100 w-full"></div>
                    <div className="text-slate-700 text-sm leading-relaxed font-medium">
                      {selectedEmail.body ? <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} className="prose prose-sm max-w-none" /> : <div className="whitespace-pre-wrap">{selectedEmail.snippet}</div>}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={() => { setChatInput(t.reportMsg.replace("{from}", selectedEmail.from).replace("{subject}", selectedEmail.subject)); setSelectedEmail(null); }} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700">{t.askAi}</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shadow-lg z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-sm font-black tracking-tight uppercase">{t.assistantChat}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 lg:p-6 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-slate-200">
              {chatHistory.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-60">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <h3 className="text-md font-bold text-slate-900">{t.aiTitle}</h3>
                </div>
              )}
              
              {chatHistory.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] lg:max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-left ${chat.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"}`}>
                    <p className="text-xs whitespace-pre-wrap leading-relaxed font-medium">{chat.text}</p>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{t.thinking}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleChat} className="relative flex items-center gap-2">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder={t.typeMessage}
                  className="flex-1 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all text-slate-900 placeholder:text-slate-400" 
                  disabled={chatLoading} 
                />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-3 rounded-xl transition-all shadow-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <JobTracker lang={uiLang} />
      )}
    </div>
  )
}
