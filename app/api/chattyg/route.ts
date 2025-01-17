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
  channel_ids?: string[] | null;
}

const CHATTYG_ID = 'a7756e85-e983-464e-843b-f74e3e34decd';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    console.log('\n🔵 CHATTYG API START 🔵');
    console.log('----------------------------------------');

    const { question, userId, selectedChannels } = await req.json()
    console.log('📥 Received request:', { 
      question,
      userId,
      selectedChannels,
      questionLength: question.length
    })
    
    const supabase = await createClient()
    
    // 1. Generate embedding for the question
    console.log('\n🔄 Step 1: Generating embedding');
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    })
    const questionEmbedding = embeddingResponse.data[0].embedding
    console.log('✅ Embedding generated:', { 
      vectorLength: questionEmbedding.length,
      sampleValues: questionEmbedding.slice(0, 3)
    })

    // 2. Search for similar messages using pgvector
    console.log('\n🔄 Step 2: Searching for similar messages');
    
    // Debug: Check if we have any embeddings
    const { data: embeddingCount, error: countError } = await supabase
      .from('embeddings')
      .select('id', { count: 'exact' });
    
    console.log('Debug - Embeddings in database:', {
      count: embeddingCount?.length || 0,
      error: countError?.message
    });

    console.log('Search parameters:', {
      match_count: 5,
      match_threshold: 0.8,
      member_id: userId
    })

    // Lower the threshold to be less strict
    const { data: similarMessages, error: searchError } = await supabase
      .rpc('match_messages', {
        match_count: 5,
        match_threshold: 0.3,
        member_id: userId,
        query_embedding: questionEmbedding
      })

    if (searchError) {
      console.error('❌ Search error:', {
        code: searchError.code,
        message: searchError.message,
        details: searchError.details,
        hint: searchError.hint
      })
      throw searchError
    }

    console.log('✅ Search results:', {
      resultCount: similarMessages?.length || 0,
      results: similarMessages?.map((msg: SimilarMessage) => ({
        contentPreview: msg.content.substring(0, 50) + '...',
        similarity: msg.similarity
      }))
    })

    // 3. Format context from similar messages
    console.log('\n🔄 Step 3: Formatting context');
    const context = (similarMessages as SimilarMessage[] || [])
      .map(msg => msg.content)
      .join('\n\n')
    console.log('Context stats:', {
      contextLength: context.length,
      messageCount: (similarMessages as SimilarMessage[] || []).length,
      preview: context.substring(0, 100) + '...'
    })

    // 4. Generate response using OpenAI
    console.log('\n🔄 Step 4: Generating AI response');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ChattyG, a helpful AI assistant in a team chat platform. 
          Use the following context from previous messages to inform your responses, 
          but don't explicitly reference that you're using context unless asked.
          Context: ${context}`
        },
        { role: "user", content: question }
      ]
    })

    const answer = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.'
    console.log('✅ Generated response:', {
      responseLength: answer.length,
      preview: answer.substring(0, 100) + '...'
    })

    // 5. Store the response in direct_messages
    console.log('\n🔄 Step 5: Storing response');
    const { error: responseError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: CHATTYG_ID,
        recipient_id: userId,
        content: answer
      })

    if (responseError) {
      console.error('❌ Error storing response:', {
        code: responseError.code,
        message: responseError.message,
        details: responseError.details
      })
      throw responseError
    }

    console.log('✅ Response stored successfully');
    console.log('----------------------------------------');
    console.log('🔵 CHATTYG API END 🔵\n');

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('\n❌ CHATTYG API ERROR:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      })
    }
    console.log('----------------------------------------');
    console.log('🔴 CHATTYG API ERROR END 🔴\n');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 