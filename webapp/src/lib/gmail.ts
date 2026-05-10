import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export async function fetchAndStoreEmails(userId: string) {
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

  // 2. Search for ALL emails (no filter)
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 500, // Increased to fetch more emails
  })

  const messages = res.data.messages || []

  for (const message of messages) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: message.id!,
    })

    const headers = msg.data.payload?.headers
    const from = headers?.find((h) => h.name === "From")?.value || "Unknown"
    const subject = headers?.find((h) => h.name === "Subject")?.value || "No Subject"
    const snippet = msg.data.snippet || ""
    const receivedAt = new Date(parseInt(msg.data.internalDate!))

    // 3. Store in database
    await prisma.jobEmail.upsert({
      where: { messageId: message.id! },
      update: {
        userId,
        from,
        subject,
        snippet,
        receivedAt,
      },
      create: {
        userId,
        messageId: message.id!,
        from,
        subject,
        snippet,
        receivedAt,
      },
    })
  }

  return messages.length
}
