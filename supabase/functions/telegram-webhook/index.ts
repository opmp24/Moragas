import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!
const ADMIN_TELEGRAM_ID = Deno.env.get("ADMIN_TELEGRAM_ID")!
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "moragas" },
})

interface Classification {
  type: "ingreso" | "egreso"
  amount: number
  category: string
  user_name: string | null
  description: string
}

async function classifyWithGemini(text: string): Promise<Classification> {
  const prompt = `Eres un asistente de finanzas personales. Analiza el mensaje y extrae los datos financieros.
Reglas:
- type: "ingreso" o "egreso"
- amount: monto numérico sin puntos ni comas
- category: una categoría corta y descriptiva (ej: comida, transporte, sueldo, freelance, servicios, salud, educacion, vivienda, entretencion, vestuario, mascotas, regalos, otros)
- user_name: nombre de la persona que hizo el gasto/ingreso (null si no se menciona), formato nombre propio
- description: descripción corta de 2-5 palabras

Mensaje: "${text}"

Responde SOLO con JSON válido sin markdown ni explicaciones:
{"type": "...", "amount": 0, "category": "...", "user_name": null, "description": "..."}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    },
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  return JSON.parse(cleaned)
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()

    const fromId = body.message?.from?.id
    if (!fromId || String(fromId) !== ADMIN_TELEGRAM_ID) {
      return new Response("ok", { status: 200 })
    }

    const chatId: number = body.message.chat.id
    const text: string = body.message.text || ""
    const messageId: number | null = body.message.message_id || null

    if (!text.trim()) {
      await sendTelegramMessage(chatId, "ℹ️ Enviame un mensaje con un gasto o ingreso. Ej: 'gaste 5000 en almuerzo'")
      return new Response("ok", { status: 200 })
    }

    const classification = await classifyWithGemini(text)

    const { data: tx, error } = await supabase.rpc("bot_insert_transaction", {
      p_type: classification.type,
      p_amount: classification.amount,
      p_category: classification.category,
      p_description: classification.description,
      p_user_name: classification.user_name || null,
      p_raw_message: text,
      p_telegram_message_id: messageId,
    })

    if (error) throw error

    const emoji = classification.type === "ingreso" ? "💰" : "💸"
    const amountStr = new Intl.NumberFormat("es-CL").format(classification.amount)
    await sendTelegramMessage(
      chatId,
      `${emoji} *Registrado*\nMonto: $${amountStr}\nTipo: ${classification.type}\nCategoría: ${classification.category}${classification.user_name ? `\nUsuario: ${classification.user_name}` : ""}${classification.description ? `\nDetalle: ${classification.description}` : ""}`,
    )

    return new Response("ok", { status: 200 })
  } catch (e) {
    console.error("Webhook error:", e)
    try {
      const body = await req.clone().json()
      const chatId = body.message?.chat?.id
      if (chatId) {
        const msg = e instanceof Error && e.message?.includes("Gemini API")
          ? "❌ Gemini API no habilitada. Activá la Generative Language API en https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=912408221896"
          : "❌ No pude procesar el mensaje. Verifica el formato: monto, categoria y tipo (ingreso/gasto)"
        await sendTelegramMessage(chatId, msg)
      }
    } catch {
      // ignore
    }
    return new Response("ok", { status: 200 })
  }
})
