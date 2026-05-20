import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { company, position, status, interviewDate, notes } = await req.json()
    const id = (await params).id;

    const job = await prisma.jobApplication.update({
      where: { id, userId: session.user.id },
      data: {
        company,
        position,
        status,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        notes,
      },
    })
    return NextResponse.json(job)
  } catch (error) {
    console.error("PATCH Job Error:", error)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const id = (await params).id;
    await prisma.jobApplication.delete({
      where: { id, userId: session.user.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE Job Error:", error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}
