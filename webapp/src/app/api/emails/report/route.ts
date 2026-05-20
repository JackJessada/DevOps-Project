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

  let lang = "en"
  let chatId: string | undefined = undefined

  try {
    const body = await request.json() as { lang?: string; chatId?: string }
    lang = body.lang || "en"
    chatId = body.chatId
  } catch {
    // ignore
  }

  // 1. Get emails from the last 2 days (today and yesterday)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 1)
  twoDaysAgo.setHours(0, 0, 0, 0)

  const emails = await prisma.jobEmail.findMany({
    where: {
      userId: session.user.id,
      receivedAt: { gte: twoDaysAgo },
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  })

  let report = "";
  let title = "";

  const now = new Date();
  const dateStr = now.toLocaleString("th-TH", { dateStyle: "full", timeStyle: "medium" });

  if (emails.length === 0) {
    report = lang === "th" ? "ไม่มีอัปเดตใหม่สำหรับ 2 วันที่ผ่านมา" : "No new updates for the last 2 days."
    title = lang === "th" ? "ไม่มีอัปเดต" : "No Updates"
  } else {
    const context = emails.map(e => `- ${e.subject} from ${e.from}`).join("\n")
    const systemPrompt = lang === "th" 
      ? `คุณคือผู้ช่วยที่มีประโยชน์ซึ่งจัดทำรายงานสรุปประจำวัน วันนี้คือ ${dateStr}` 
      : `You are a helpful assistant providing daily update reports. Today is ${dateStr}`;

    const userPrompt = lang === "th"
      ? `ช่วยสรุปอีเมลเหล่านี้ที่ได้รับในช่วง 2 วันที่ผ่านมา (วันนี้และเมื่อวาน) ให้เป็น "รายงานสรุป" สั้นๆ และให้กำลังใจ
         เน้นผู้ส่งที่สำคัญหรือขั้นตอนต่อไปที่ต้องทำหากมีการระบุไว้
         
         ตอบกลับเป็นภาษาไทยเท่านั้น
      
         EMAILS:
         ${context}`
      : `Summarize these emails received in the last 2 days (today and yesterday) into a short, encouraging report.
         Highlight important senders or next steps if mentioned.
         
         Respond in English only.
      
         EMAILS:
         ${context}`

    try {
      report = await generateAIResponse({
        systemPrompt,
        userPrompt,
      })

      const titlePrompt = lang === "th" 
        ? `สรุปข้อความนี้เป็นชื่อหัวข้อสั้นๆ ไม่เกิน 5 คำ ไม่ต้องมีคำนำหน้า:\n${report}`
        : `Summarize this text into a short title of max 5 words, no prefix:\n${report}`;
      
      title = await generateAIResponse({ 
        systemPrompt: "You are a helpful title generator.", 
        userPrompt: titlePrompt 
      });
      title = title.replace(/['"]/g, '').trim();

    } catch (_error: unknown) {
      console.error("AI Report Error:", _error)
      return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
    }
  }

  try {
    // Database save
    let chat;
    if (chatId) {
      chat = await prisma.chat.findUnique({ where: { id: chatId } });
    }
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          title: title || (lang === "th" ? "สรุปประจำวัน" : "Daily Report"),
        }
      });
    } else if (!chat.title || chat.title === "New Chat") {
       await prisma.chat.update({
         where: { id: chat.id },
         data: { title: title || (lang === "th" ? "สรุปประจำวัน" : "Daily Report") }
       });
    }

    const userMessageContent = lang === "th" ? "ขอสรุปรายงานประจำวัน" : "Give me a daily report";

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: userMessageContent,
      }
    });

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        content: report,
      }
    });

    return NextResponse.json({ report, chatId: chat.id })
  } catch (_error: unknown) {
    console.error("DB Save Error:", _error)
    // Still return the report even if saving fails
    return NextResponse.json({ report, error: "Failed to save history" }, { status: 500 })
  }
}
