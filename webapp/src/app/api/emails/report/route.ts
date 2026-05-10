import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Get today's emails
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const emails = await prisma.jobEmail.findMany({
    where: {
      userId: session.user.id,
      receivedAt: { gte: today },
    },
  })

  if (emails.length === 0) {
    return NextResponse.json({ report: "No new job updates for today." })
  }

  const context = emails.map(e => `- ${e.subject} from ${e.from}`).join("\n")
  const prompt = `
    Summarize these job-related emails received today into a short, encouraging "Daily Report".
    Highlight important companies or next steps if mentioned.
    
    EMAILS:
    ${context}
  `

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant providing daily job update reports." },
        { role: "user", content: prompt }
      ],
    })

    const report = response.choices[0].message.content
    return NextResponse.json({ report })
  } catch (error) {
    console.error("DeepSeek Error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
