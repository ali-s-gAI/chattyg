import { createClient } from '@/utils/supabase/server'
import { generateEmbedding } from '@/utils/openai'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create a service role client that bypasses RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  console.log('\n🔵 EMBEDDING API START 🔵');
  console.log('----------------------------------------');
  try {
    const { messageId, content } = await req.json()
    console.log('📥 Received message:', { 
      id: messageId,
      contentLength: content.length,
      preview: content.substring(0, 50) + '...'
    });
    
    // Generate embedding
    console.log('🤖 Calling OpenAI...');
    const embedding = await generateEmbedding(content)
    console.log('✅ OpenAI response received:', { 
      vectorLength: embedding?.length,
      sampleValues: embedding?.slice(0, 3)
    });
    
    // Store embedding using service client
    console.log('💾 Storing in database...');
    const { data: updateData, error: embeddingError } = await serviceClient
      .from('embeddings')
      .upsert({
        message_id: messageId,
        embedding: embedding
      })
      .select()

    if (embeddingError) {
      console.error('❌ Database error:', {
        error: embeddingError,
        code: embeddingError.code,
        message: embeddingError.message,
        details: embeddingError.details
      })
      throw embeddingError
    }

    console.log('✅ Embedding stored successfully:', {
      messageId,
      updateResult: updateData
    });
    console.log('----------------------------------------');
    console.log('🔵 EMBEDDING API END 🔵\n');

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ API ERROR:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    console.log('----------------------------------------');
    console.log('🔴 EMBEDDING API ERROR END 🔴\n');
    return NextResponse.json(
      { error: 'Failed to generate embedding', details: error },
      { status: 500 }
    )
  }
} 