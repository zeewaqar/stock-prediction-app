// src/lib/groq.ts
export async function queryGroqArray(
    prompt: string
  ): Promise<{ date: string; predicted_price: number }[]> {
    const model  = process.env.GROQ_MODEL || 'mistral-saba-24b';
    const apiKey = process.env.GROQ_API_KEY!;
    const url    = 'https://api.groq.com/openai/v1/chat/completions';
  
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        stream:      false,
        messages: [
          {
            role: 'system',
            content: [
              'You are a financial analyst.',
              'Given historical closing prices, predict the next 7 calendar days closing prices.',
              'Respond **only** with a JSON array of objects:',
              '`[{"date":"YYYY-MM-DD","predicted_price":123.45}, …]`',
              'Do not include any explanation or surrounding text.'
            ].join(' ')
          },
          { role: 'user', content: prompt }
        ]
      }),
    });
  
    if (!res.ok) {
      const body = await res.text();
      console.error('Groq API error', res.status, body);
      throw new Error(`Groq API responded with ${res.status}`);
    }
  
    const envelope = await res.json();
    const content  = envelope.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      console.error('Unexpected Groq payload:', envelope);
      throw new Error('Invalid response structure from Groq');
    }
  
    // --- Robust JSON extraction ---
    const start = content.indexOf('[');
    const end   = content.lastIndexOf(']');
    if (start === -1 || end === -1) {
      console.error('Failed to locate JSON array in model output:', content);
      throw new Error('No JSON array found in model output');
    }
  
    const jsonText = content.slice(start, end + 1);
  
    let arrRaw: unknown;
    try {
      arrRaw = JSON.parse(jsonText);
    } catch {
      console.error('Failed to JSON.parse extracted text:', jsonText);
      throw new Error('Extracted JSON is invalid');
    }
  
    if (
      !Array.isArray(arrRaw) ||
      arrRaw.some(
        (o) =>
          typeof o !== 'object' ||
          typeof (o as Record<string, unknown>).date !== 'string' ||
          typeof (o as Record<string, unknown>).predicted_price !== 'number'
      )
    ) {
      console.error('Extracted JSON array malformed:', arrRaw);
      throw new Error('JSON array did not match expected shape');
    }
  
    return arrRaw as { date: string; predicted_price: number }[];
  }
  