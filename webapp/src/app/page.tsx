"use client"

import { signIn, useSession } from "next-auth/react"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  const { data: session } = useSession()

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-12 bg-gray-50">
      {!session ? (
        <div className="z-10 max-w-6xl w-full flex flex-col gap-6 bg-white p-6 lg:p-10 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col items-center py-20 text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to your AI Career Assistant</h2>
            <button onClick={() => signIn("google")} className="bg-blue-600 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
              Login with Google to Start
            </button>
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
    </main>
  )
}
