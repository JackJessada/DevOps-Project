"use client"

import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"

export default function Dashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")
  const [emails, setEmails] = useState<any[]>([])
  
  // Chat & Report state
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([])
  const [dailyReport, setDailyReport] = useState("")

  // Fetch emails from our DB to show in the list
  const loadEmails = async () => {
    try {
      const res = await fetch("/api/emails")
      if (res.ok) {
        const data = await res.json()
        setEmails(data.emails)
      }
    } catch (error) {
      console.error("Failed to load emails")
    }
  }

  useEffect(() => {
    if (session) loadEmails()
  }, [session])

  const handleFetchEmails = async () => {
    setLoading(true)
    setSyncMessage("")
    try {
      const res = await fetch("/api/emails/sync", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(`Synced ${data.count} new emails.`)
        loadEmails()
      } else {
        setSyncMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setSyncMessage("Error occurred during sync.")
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setChatLoading(true)
    try {
      const res = await fetch("/api/emails/report")
      const data = await res.json()
      if (res.ok) {
        setDailyReport(data.report)
        setChatHistory(prev => [...prev, { role: "ai", text: `📊 **Daily Job Update:**\n\n${data.report}` }])
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: "ai", text: "Failed to generate daily report." }])
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
        body: JSON.stringify({ message: userMessage }),
      })
      const data = await res.json()
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: "ai", text: data.text }])
      } else {
        setChatHistory(prev => [...prev, { role: "ai", text: `Error: ${data.error}` }])
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: "ai", text: "Sorry, I couldn't process that request." }])
    } finally {
      setChatLoading(false)
    }
  }

  if (!session) return null

  return (
    <div className="z-10 max-w-6xl w-full flex flex-col gap-6 bg-white p-6 lg:p-10 rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Mail Chat</h1>
          <p className="text-gray-400 text-xs">DevOps Project Dashboard</p>
        </div>
        <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500 text-xs font-medium">
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: Profile & Sync */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <img src={session.user?.image || ""} className="w-10 h-10 rounded-full" />
              <p className="font-bold text-sm text-gray-800">{session.user?.name}</p>
            </div>
            <button onClick={handleFetchEmails} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm mb-2 disabled:bg-gray-400">
              {loading ? "Syncing..." : "Sync Gmail"}
            </button>
            <button onClick={generateReport} disabled={chatLoading} className="w-full bg-green-600 text-white py-2 rounded font-bold text-sm">
              Daily Update Report
            </button>
            {syncMessage && <p className="mt-2 text-[10px] text-center text-blue-500">{syncMessage}</p>}
          </div>

          {/* Email List */}
          <div className="flex-1 bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 px-4 py-2 border-b"><span className="text-xs font-bold text-gray-500">RECENT EMAILS</span></div>
            <div className="max-h-[300px] overflow-y-auto">
              {emails.length === 0 ? <p className="p-4 text-xs text-gray-400 text-center">No emails synced yet.</p> : emails.map((e, i) => (
                <div key={i} className="p-3 border-b hover:bg-gray-50 cursor-default transition-colors">
                  <p className="text-[10px] font-bold text-blue-600 truncate">{e.from}</p>
                  <p className="text-[11px] font-medium text-gray-800 truncate">{e.subject}</p>
                  <p className="text-[9px] text-gray-400">{new Date(e.receivedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main: AI Chatbot */}
        <div className="lg:col-span-9 flex flex-col h-[600px] border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-bold">Assistant Chat</span>
            <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-gray-50">
            {chatHistory.length === 0 && (
              <div className="text-center py-10 opacity-40 italic text-sm">Ask about your applications or click "Daily Update Report"</div>
            )}
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-xl shadow-sm ${chat.role === "user" ? "bg-blue-600 text-white" : "bg-white border text-gray-800"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{chat.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && <div className="text-xs text-gray-400 animate-pulse">Assistant is thinking...</div>}
          </div>

          <form onSubmit={handleChat} className="p-3 border-t bg-white flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message..." className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" disabled={chatLoading} />
            <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-blue-600 text-white px-5 py-2 rounded font-bold text-sm disabled:bg-gray-300">Send</button>
          </form>
        </div>
      </div>
    </div>
  )
}
