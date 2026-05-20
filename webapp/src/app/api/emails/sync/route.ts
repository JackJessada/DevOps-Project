import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { fetchAndStoreEmails } from "@/lib/gmail"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let days = 7;
    try {
      const body = await req.json();
      if (body.days) days = parseInt(body.days);
    } catch (e) {}

    const count = await fetchAndStoreEmails(session.user.id, days)
    return NextResponse.json({ success: true, count })
  } catch (error: unknown) {
    console.error("Failed to sync emails:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
