import type { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase, ok, err } from './_shared';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const SYSTEM_PROMPT = `
Eres un asistente de finanzas personales. Analiza mensajes de gastos o ingresos y extrae la información en JSON.

Reglas:
- type: "ingreso" si es dinero que entra, "egreso" si es dinero que sale
- amount: el monto numérico (solo números, sin puntos ni símbolos)
- category: una categoría corta en español (comida, arriendo, transporte, servicios, salud, educación, entretencion, ropa, salario, freelance, otro)
- user_name: si el mensaje menciona quién hizo la transacción (ej. "juan agregó 50000" → "juan"), si no hay mención → null
- description: descripción limpia y corta de lo que se gastó/ingresó

Ejemplos:
"gasté 5.000 en carne" → {"type":"egreso","amount":5000,"category":"comida","user_name":null,"description":"carne"}
"gasto por 300000 arriendo" → {"type":"egreso","amount":300000,"category":"arriendo","user_name":null,"description":"arriendo"}
"juan agregó 50000" → {"type":"ingreso","amount":50000,"category":"otro","user_name":"juan","description":"agregó 50000"}
"recibí 250000 de sueldo" → {"type":"ingreso","amount":250000,"category":"salario","user_name":null,"description":"sueldo"}

Responde SOLO con el JSON, sin texto adicional.
`;

async function sendTelegram(chatId: string | number, text: string) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: 'HTML' }),
  });
  return res.json();
}

async function classifyWithGemini(text: string) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent([SYSTEM_PROMPT, text]);
  const response = result.response.text();

  // Extract JSON from response (handle possible markdown fences)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo extraer JSON de la respuesta de Gemini');

  return JSON.parse(jsonMatch[0]);
}

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const message = body.message;

    // Ignore non-message updates
    if (!message || !message.text) {
      return ok({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = String(message.from?.id || '');
    const text = message.text.trim();

    // Only process messages from the admin
    if (userId !== ADMIN_ID) {
      await sendTelegram(chatId, '⚠️ No autorizado. Solo el admin puede usar este bot.');
      return ok({ ok: true });
    }

    // Classify with Gemini
    let classification;
    try {
      classification = await classifyWithGemini(text);
    } catch (geminiErr) {
      const msg = `❌ Error al analizar el mensaje. Intenta ser más específico.\nDetalle: ${geminiErr instanceof Error ? geminiErr.message : 'Error de IA'}`;
      await sendTelegram(chatId, msg);
      return ok({ ok: true });
    }

    // Validate classification
    if (!classification.type || !classification.amount || !classification.category) {
      await sendTelegram(chatId, '❌ No pude entender el mensaje. Ejemplo: "gasté 5.000 en carne"');
      return ok({ ok: true });
    }

    // Store in Supabase
    const { error: dbError } = await supabase.from('transactions').insert({
      type: classification.type,
      amount: classification.amount,
      description: classification.description || text,
      category: classification.category,
      user_name: classification.user_name,
      raw_message: text,
      telegram_message_id: message.message_id,
    });

    if (dbError) {
      await sendTelegram(chatId, `❌ Error al guardar en la base de datos: ${dbError.message}`);
      return ok({ ok: true });
    }

    // Format confirmation message
    const emoji = classification.type === 'ingreso' ? '📥' : '📤';
    const typeLabel = classification.type === 'ingreso' ? 'Ingreso' : 'Gasto';
    const amountFormatted = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(classification.amount);

    const confirmLines = [
      `${emoji} <b>${typeLabel} registrado</b>`,
      `Monto: ${amountFormatted}`,
      `Categoría: <b>${classification.category}</b>`,
    ];

    if (classification.user_name) {
      confirmLines.push(`Usuario: ${classification.user_name}`);
    }
    if (classification.description) {
      confirmLines.push(`Detalle: ${classification.description}`);
    }

    await sendTelegram(chatId, confirmLines.join('\n'));

    return ok({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return ok({ ok: true }); // Always return 200 to Telegram
  }
};
