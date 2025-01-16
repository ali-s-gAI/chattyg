import { createClient } from '@/utils/supabase/server'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

interface SimilarMessage {
  content: string;
  similarity: number;
}

interface MatchMessagesParams {
  query_embedding: number[];
  match_threshold: number;
  match_count: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { question, userId, selectedChannels } = await req.json()
    console.log('Received request:', { question, userId, selectedChannels })
    
    const supabase = await createClient()
    
    // 1. Generate embedding for the question
    console.log('Generating embedding...')
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    })
    const questionEmbedding = embeddingResponse.data[0].embedding
    console.log('Embedding generated successfully')

    // 2. Search for similar messages using pgvector
    console.log('Searching for similar messages...')
    const { data: similarMessages, error: searchError } = await supabase
      .rpc('match_messages', {
        query_embedding: questionEmbedding,
        match_threshold: 0.8,
        match_count: 5
      } as MatchMessagesParams)

    if (searchError) {
      console.error('Search error:', searchError)
      throw searchError
    }
    console.log('Found similar messages:', similarMessages)

    // 3. Format context from similar messages
    const context = (similarMessages as SimilarMessage[] || [])
      .map(msg => msg.content)
      .join('\n\n')
    console.log('Context formatted:', context.substring(0, 100) + '...')

    // 4. Generate response using context
    console.log('Generating OpenAI response...')
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
    console.log('OpenAI response generated')

    const answer = completion.choices[0].message.content

    // Store ChattyG's response in direct_messages
    console.log('Storing response in direct_messages...')
    const { error: responseError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: 'a7756e85-e983-464e-843b-f74e3e34decd', // ChattyG's ID
        recipient_id: userId,
        content: answer,
      })

    if (responseError) {
      console.error('Error storing response:', responseError)
      throw responseError
    }
    console.log('Response stored successfully')

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('ChattyG error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 