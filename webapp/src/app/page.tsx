"use client"

import { signIn, useSession } from "next-auth/react"
import Dashboard from "@/components/Dashboard"
import LandingPage from "@/components/LandingPage"

export default function Home() {
  const { data: session } = useSession()

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50">
      {!session ? (
        <LandingPage />
      ) : (
        <div className="p-4 lg:p-12 w-full flex flex-col items-center">
          <Dashboard />
        </div>
      )}
    </main>
  )
}
