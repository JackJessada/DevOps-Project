import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export async function fetchAndStoreEmails(userId: string, days: number = 7) {
  // 1. Get the account for this user to get the access token
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  })

  if (!account || !account.access_token) {
    throw new Error("No Google account or access token found")
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  })

  const gmail = google.gmail({ version: "v1", auth })

  // Check if user has any emails in DB. If not, sync 6 months.
  const emailCount = await prisma.jobEmail.count({ where: { userId } });
  let syncDays = days;
  let maxResults = 300;

  if (emailCount === 0) {
    syncDays = 180; // ~6 months
    maxResults = 500; // Increased for initial sync
  }

  // 2. Build search query with job keywords (English + Thai)
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - syncDays);
  const afterStr = `${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`;
  
  const keywords = [
    "application", "interview", "hiring", "recruitment", "offer", "position", "career", "resume", "candidate", "onboarding",
    "สมัครงาน", "สัมภาษณ์", "รับสมัคร", "ตำแหน่ง", "ผลการสมัคร", "นัดหมาย", "ตอบรับ", "ประวัติการทำงาน"
  ];
  const query = `(${keywords.join(" OR ")}) after:${afterStr}`;

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  })

  const messages = res.data.messages || []
  if (messages.length === 0) return 0

  // 3. Get existing message IDs from DB to avoid re-fetching details
  const existingEmails = await prisma.jobEmail.findMany({
    where: { 
      userId,
      messageId: { in: messages.map(m => m.id!) }
    },
    select: { messageId: true }
  })
  
  const existingIds = new Set(existingEmails.map(e => e.messageId))
  const newMessages = messages.filter(m => !existingIds.has(m.id!))

  if (newMessages.length === 0) return 0

  // 4. Fetch details in parallel with a concurrency limit
  const batchSize = 15 // Process 15 emails at a time
  let processedCount = 0

  for (let i = 0; i < newMessages.length; i += batchSize) {
    const batch = newMessages.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (message) => {
      try {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
        })

        const headers = msg.data.payload?.headers
        const from = headers?.find((h) => h.name === "From")?.value || "Unknown"
        const subject = headers?.find((h) => h.name === "Subject")?.value || "No Subject"
        const snippet = msg.data.snippet || ""
        const receivedAt = new Date(parseInt(msg.data.internalDate!))

        interface GmailPart {
          mimeType?: string | null;
          body?: { data?: string | null } | null;
          parts?: GmailPart[] | null;
        }

        // Recursive helper to extract body parts
        const extractBodyParts = (parts: GmailPart[]): { html: string; plain: string } => {
          let html = "";
          let plain = "";
          
          for (const part of parts) {
            if (part.mimeType === "text/html" && part.body?.data) {
              html += Buffer.from(part.body.data, "base64url").toString("utf-8");
            } else if (part.mimeType === "text/plain" && part.body?.data) {
              plain += Buffer.from(part.body.data, "base64url").toString("utf-8");
            } else if (part.parts) {
              const nested = extractBodyParts(part.parts);
              html += nested.html;
              plain += nested.plain;
            }
          }
          return { html, plain };
        };

        let body = "";
        const payload = msg.data.payload;
        
        if (payload?.parts) {
          const { html, plain } = extractBodyParts(payload.parts);
          body = html || plain;
        } else if (payload?.body?.data) {
          body = Buffer.from(payload.body.data, "base64url").toString("utf-8");
        }

        // Store in database
        await prisma.jobEmail.create({
          data: {
            userId,
            messageId: message.id!,
            from,
            subject,
            snippet,
            body,
            receivedAt,
          },
        })
        processedCount++
      } catch (error) {
        console.error(`Failed to sync message ${message.id}:`, error)
      }
    }))
  }

  return processedCount
}
