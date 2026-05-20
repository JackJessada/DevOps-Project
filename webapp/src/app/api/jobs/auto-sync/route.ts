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
    let days = 2;
    try {
      const body: { days?: string } = await request.json();
      if (body.days) days = parseInt(body.days);
    } catch {
      // ignore
    }

    // 1. Fetch recent emails from the specified range
    const searchRange = new Date()
    searchRange.setDate(searchRange.getDate() - days)
    searchRange.setHours(0, 0, 0, 0)

    const allEmails = await prisma.jobEmail.findMany({
      where: { 
        userId: session.user.id,
        receivedAt: { gte: searchRange }
      },
      orderBy: { receivedAt: "desc" },
    })

    if (allEmails.length === 0) {
      return NextResponse.json({ message: "No emails to analyze", count: 0 })
    }

    // 2. Pre-filter with Regex (Thai + English)
    const jobKeywordsRegex = /application|interview|hiring|recruitment|offer|position|career|status|schedule|สมัครงาน|สัมภาษณ์|รับสมัคร|ตำแหน่ง|ผลการสมัคร|นัดหมาย|ตอบรับ/i;
    
    const filteredEmails = allEmails.filter(e => 
      jobKeywordsRegex.test(e.subject) || jobKeywordsRegex.test(e.snippet)
    ).slice(0, 40); // Limit to top 40 relevant emails for AI context

    if (filteredEmails.length === 0) {
      return NextResponse.json({ message: "No job-related emails found after filtering", count: 0 })
    }

    // 3. Fetch current tracking list
    const currentJobs = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
    })

    const emailContext = filteredEmails.map(e => `From: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}\nDate: ${e.receivedAt}`).join("\n---\n")
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

    const rawUpdates = JSON.parse(jsonMatch[0])
    
    interface JobUpdate {
      company: string;
      position: string;
      status: "Pending" | "Interviewing" | "Offer" | "Rejected";
      interviewDate: string | null;
      notes: string;
    }

    // 4. Consolidate updates by company to prevent duplicate instances in the same batch
    const consolidatedUpdates: Record<string, JobUpdate> = {};
    for (const update of rawUpdates as JobUpdate[]) {
      const key = update.company.toLowerCase().trim();
      if (!consolidatedUpdates[key]) {
        consolidatedUpdates[key] = update;
      } else {
        // Merge: keep latest status, merge unique notes
        consolidatedUpdates[key].status = update.status; // Assume later in list is newer
        if (update.interviewDate) consolidatedUpdates[key].interviewDate = update.interviewDate;
        if (update.notes && !consolidatedUpdates[key].notes.includes(update.notes)) {
          consolidatedUpdates[key].notes += ` | ${update.notes}`;
        }
      }
    }

    const updates = Object.values(consolidatedUpdates);
    let createdCount = 0
    let updatedCount = 0

    for (const update of updates) {
      // Find existing job by company (prioritize exact match, then loose)
      let existing = currentJobs.find(j => j.company.toLowerCase().trim() === update.company.toLowerCase().trim());
      
      if (!existing) {
        existing = currentJobs.find(j => 
          j.company.toLowerCase().includes(update.company.toLowerCase()) || 
          update.company.toLowerCase().includes(j.company.toLowerCase())
        )
      }

      if (existing) {
        // Check for meaningful changes to avoid duplicates
        const isNewNote = update.notes && !existing.notes?.includes(update.notes);
        const statusChanged = existing.status !== update.status;
        const newInterviewDate = update.interviewDate ? new Date(update.interviewDate) : null;
        const dateChanged = newInterviewDate && existing.interviewDate?.getTime() !== newInterviewDate.getTime();

        if (statusChanged || dateChanged || isNewNote) {
          await prisma.jobApplication.update({
            where: { id: existing.id },
            data: {
              status: update.status,
              interviewDate: newInterviewDate || existing.interviewDate,
              notes: isNewNote 
                ? `${existing.notes || ""}\n[AI Update ${dateStr}]: ${update.notes}`.trim() 
                : existing.notes
            }
          })
          updatedCount++
        }
      } else {
        // Create new
        const newJob = await prisma.jobApplication.create({
          data: {
            userId: session.user.id,
            company: update.company,
            position: update.position,
            status: update.status,
            interviewDate: update.interviewDate ? new Date(update.interviewDate) : null,
            notes: update.notes
          }
        })
        // Add to local list to prevent duplicate creation if AI returns it again (though consolidated now)
        currentJobs.push(newJob);
        createdCount++
      }
    }

    return NextResponse.json({ success: true, createdCount, updatedCount })
  } catch (error) {
    console.error("Auto-Sync Error:", error)
    return NextResponse.json({ error: "Failed to auto-sync jobs" }, { status: 500 })
  }
}
