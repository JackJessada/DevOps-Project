import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAIResponse } from "@/lib/ai"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message, chatId } = await req.json()

  try {
    let chat;
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: { id: chatId, userId: session.user.id }
      });
      if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    } else {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        }
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: message,
      }
    });

    // Fetch message history for context
    const history = await prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Fetch user's job emails from the database to provide context
    const emails = await prisma.jobEmail.findMany({
      where: { userId: session.user.id },
      orderBy: { receivedAt: "desc" },
      take: 10,
    })

    // Fetch user's tracked job applications
    const jobApps = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    const emailContext = emails.map(e => (
      `From: ${e.from}\nSubject: ${e.subject}\nDate: ${e.receivedAt}\nSnippet: ${e.snippet}\n---`
    )).join("\n")

    const jobContext = jobApps.map(j => (
      `- Company: ${j.company}, Position: ${j.position}, Status: ${j.status}, Interview: ${j.interviewDate || 'N/A'}`
    )).join("\n")

    const historyContext = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")

    const now = new Date();
    const dateStr = now.toLocaleString("th-TH", { dateStyle: "full", timeStyle: "medium" });

    const systemPrompt = `You are a helpful job application assistant. 
      Today is ${dateStr}. 
      Always use this date as reference when the user asks about 'today', 'yesterday', or recent events.
      
      USER TRACKED JOBS:
      ${jobContext || "No jobs tracked yet."}`
    const userPrompt = `
      You are a helpful job application assistant. Below is a list of the user's recent job-related emails and their chat history.
      Use this context to answer their question.

      USER EMAILS CONTEXT:
      ${emailContext || "No emails found."}

      CHAT HISTORY:
      ${historyContext}

      USER QUESTION:
      ${message}
    `

    const text = await generateAIResponse({
      systemPrompt,
      userPrompt,
    })

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        content: text,
      }
    });

    return NextResponse.json({ text, chatId: chat.id })
  } catch (error) {
    console.error("AI Route Error:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
