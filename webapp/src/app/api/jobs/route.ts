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
    const jobs = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(jobs)
  } catch (error) {
    console.error("GET Jobs Error:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { company, position, status, interviewDate, notes } = await req.json()
    
    if (!company || !position || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const job = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        company,
        position,
        status,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        notes,
      },
    })
    return NextResponse.json(job)
  } catch (error) {
    console.error("POST Job Error:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}
