import { createClient } from '@/utils/supabase/server'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { question, userId, selectedChannels } = await req.json()
    const supabase = await createClient()
    
    // 1. Generate embedding for the question
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    })
    const questionEmbedding = embeddingResponse.data[0].embedding

    // 2. Search for similar messages using pgvector
    const { data: similarMessages, error: searchError } = await supabase.rpc(
      'match_messages',
      {
        query_embedding: questionEmbedding,
        match_threshold: 0.8,
        match_count: 5
      }
    )

    if (searchError) throw searchError

    // 3. Format context from similar messages
    const context = similarMessages
      .map(msg => msg.content)
      .join('\n\n')

    // 4. Generate response using context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ChattyG, a whimsical and fun AI assistant for a workplace chat app advertised as no-frills and casual, in a workplace that prioritizes workers not being overburdened or overly-occupied or distracted at or by work. Use the following context to address the user's message in this DM conversation. but don't mention that you're using any context. If the context doesn't help, note that what is being asked may not have been discussed in the workspace, but respond as ChattyG:\n\n${context}`
        },
        {
          role: "user",
          content: question
        }
      ]
    })

    const answer = completion.choices[0].message.content

    // 5. Store the conversation
    const { error: insertError } = await supabase
      .from('ai_messages')
      .insert([
        {
          conversation_id: userId,
          content: question,
          role: 'user'
        },
        {
          conversation_id: userId,
          content: answer,
          role: 'assistant'
        }
      ])

    if (insertError) throw insertError

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('ChattyG error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 