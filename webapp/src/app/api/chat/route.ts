import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message } = await req.json()

  // 1. Fetch user's job emails from the database to provide context
  const emails = await prisma.jobEmail.findMany({
    where: { userId: session.user.id },
    orderBy: { receivedAt: "desc" },
    take: 10,
  })

  // 2. Format emails for the AI
  const emailContext = emails.map(e => (
    `From: ${e.from}\nSubject: ${e.subject}\nDate: ${e.receivedAt}\nSnippet: ${e.snippet}\n---`
  )).join("\n")

  const prompt = `
    You are a helpful job application assistant. Below is a list of the user's recent job-related emails.
    Use this context to answer their question. If there are no emails, mention that they should sync their emails first.

    USER EMAILS CONTEXT:
    ${emailContext || "No emails found."}

    USER QUESTION:
    ${message}
  `

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful job application assistant." },
        { role: "user", content: prompt }
      ],
    })

    const text = response.choices[0].message.content

    return NextResponse.json({ text })
  } catch (error: any) {
    console.error("DeepSeek Error:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
