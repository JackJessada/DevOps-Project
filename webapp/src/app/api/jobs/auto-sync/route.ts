import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAIResponse } from "@/lib/ai"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Fetch recent emails (last 30)
    const emails = await prisma.jobEmail.findMany({
      where: { userId: session.user.id },
      orderBy: { receivedAt: "desc" },
      take: 30,
    })

    if (emails.length === 0) {
      return NextResponse.json({ message: "No emails to analyze", count: 0 })
    }

    // 2. Fetch current tracking list
    const currentJobs = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
    })

    const emailContext = emails.map(e => `From: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}\nDate: ${e.receivedAt}`).join("\n---\n")
    const jobsContext = currentJobs.map(j => `- ${j.company} (${j.position}): ${j.status}`).join("\n")

    const now = new Date();
    const dateStr = now.toLocaleString("en-US", { dateStyle: "full" });

    const systemPrompt = `You are an expert recruitment assistant. Today is ${dateStr}.
    Your task is to analyze emails and extract job application updates.
    Return ONLY a valid JSON array of objects with this structure:
    [
      {
        "company": "string",
        "position": "string",
        "status": "Pending" | "Interviewing" | "Offer" | "Rejected",
        "interviewDate": "ISO string or null",
        "notes": "short summary of the update"
      }
    ]`

    const userPrompt = `
    CURRENT TRACKED JOBS:
    ${jobsContext || "None"}

    NEW EMAILS TO ANALYZE:
    ${emailContext}

    Instructions:
    1. Identify any NEW job applications or status UPDATES (like interview invites, rejections, or offers) from the emails.
    2. If an interview date is mentioned, extract it as an ISO string.
    3. Be precise with company names and positions.
    4. If the email doesn't contain a job update, ignore it.
    5. Return ONLY the JSON array.
    `

    const response = await generateAIResponse({
      systemPrompt,
      userPrompt,
      temperature: 0.1, // Low temperature for consistent JSON
    })

    // Extract JSON from response (handling potential markdown fences)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ message: "AI did not return valid updates", raw: response })
    }

    const updates = JSON.parse(jsonMatch[0])
    let createdCount = 0
    let updatedCount = 0

    for (const update of updates) {
      // Find existing job by company (rough match)
      const existing = currentJobs.find(j => 
        j.company.toLowerCase().includes(update.company.toLowerCase()) || 
        update.company.toLowerCase().includes(j.company.toLowerCase())
      )

      if (existing) {
        // Update if status changed or new interview date
        await prisma.jobApplication.update({
          where: { id: existing.id },
          data: {
            status: update.status,
            interviewDate: update.interviewDate ? new Date(update.interviewDate) : existing.interviewDate,
            notes: update.notes ? `${existing.notes || ""}\n[AI Update ${dateStr}]: ${update.notes}`.trim() : existing.notes
          }
        })
        updatedCount++
      } else {
        // Create new
        await prisma.jobApplication.create({
          data: {
            userId: session.user.id,
            company: update.company,
            position: update.position,
            status: update.status,
            interviewDate: update.interviewDate ? new Date(update.interviewDate) : null,
            notes: update.notes
          }
        })
        createdCount++
      }
    }

    return NextResponse.json({ success: true, createdCount, updatedCount })
  } catch (error) {
    console.error("Auto-Sync Error:", error)
    return NextResponse.json({ error: "Failed to auto-sync jobs" }, { status: 500 })
  }
}
