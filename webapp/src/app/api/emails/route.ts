import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const emails = await prisma.jobEmail.findMany({
      where: { userId: session.user.id },
      orderBy: { receivedAt: "desc" },
      take: 20,
    })
    return NextResponse.json({ emails })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
