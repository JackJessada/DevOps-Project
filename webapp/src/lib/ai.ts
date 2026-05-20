import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type AIProvider = "openai" | "anthropic" | "gemini" | "deepseek"

interface AIRequestOptions {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
}

export async function generateAIResponse({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
}: AIRequestOptions): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "deepseek") as AIProvider

  try {
    switch (provider) {
      case "openai": {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
            { role: "user" as const, content: userPrompt },
          ],
          temperature,
        })
        return response.choices[0].message.content || ""
      }

      case "anthropic": {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature,
        })
        return response.content[0].type === "text" ? response.content[0].text : ""
      }

      case "gemini": {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(
          systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt
        )
        return result.response.text()
      }

      case "deepseek": {
        const deepseek = new OpenAI({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: "https://api.deepseek.com",
        })
        const response = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
            { role: "user" as const, content: userPrompt },
          ],
          temperature,
        })
        return response.choices[0].message.content || ""
      }

      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  } catch (error) {
    console.error(`AI Error (${provider}):`, error)
    throw error
  }
}
