import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, extractionType } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // Define extraction prompts based on type
    const prompts: { [key: string]: string } = {
      products: `Extract product information from the following text. Return a JSON array where each item has these fields: "title", "price", "link", "description". If a field is not available, use an empty string. Only return valid JSON, no markdown or explanation.

Text:
${text}`,
      
      contacts: `Extract contact information from the following text. Return a JSON array where each item has these fields: "name", "email", "phone", "company", "title". If a field is not available, use an empty string. Only return valid JSON, no markdown or explanation.

Text:
${text}`,
      
      inventory: `Extract inventory/product data from the following text. Return a JSON array where each item has these fields: "item_name", "sku", "quantity", "price", "category". If a field is not available, use an empty string. Only return valid JSON, no markdown or explanation.

Text:
${text}`,
      
      general: `Extract structured data from the following text. Analyze the content and determine appropriate field names. Return a JSON array of objects with consistent fields across all items. Only return valid JSON, no markdown or explanation.

Text:
${text}`,
    }

    const prompt = prompts[extractionType] || prompts.general

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction assistant. Extract structured data from text and return only valid JSON arrays. Never include markdown formatting or explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const content = completion.choices[0].message.content || '[]'
    
    // Clean up markdown formatting if present
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    // Parse and validate JSON
    const extractedData = JSON.parse(jsonContent)

    if (!Array.isArray(extractedData)) {
      return NextResponse.json(
        { error: 'AI did not return an array' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      count: extractedData.length,
    })
  } catch (error: any) {
    console.error('AI extraction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to extract data' },
      { status: 500 }
    )
  }
}
