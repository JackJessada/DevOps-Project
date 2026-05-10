import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { fetchAndStoreEmails } from "@/lib/gmail"

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const count = await fetchAndStoreEmails(session.user.id)
    return NextResponse.json({ success: true, count })
  } catch (error: any) {
    console.error("Failed to sync emails:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
