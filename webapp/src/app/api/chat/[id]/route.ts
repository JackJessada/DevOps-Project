import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params;
    const chat = await prisma.chat.findUnique({
      where: { id: id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Get Chat Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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
    const { id } = await params;
    const chat = await prisma.chat.findUnique({
      where: { id: id }
    })

    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    await prisma.chat.delete({
      where: { id: id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Delete Chat Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
