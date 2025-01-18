import { createClient } from '@/utils/supabase/server'
import { generateEmbedding } from '@/utils/openai'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create a service role client
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

export async function GET() {
  console.log('=== Starting embedding processing ===');
  try {
    // Get messages without embeddings
    console.log('Fetching messages that need embeddings...');
    const { data: messages, error: messagesError } = await serviceClient
      .from('messages')
      .select(`
        id,
        content,
        embeddings!left (
          message_id,
          embedding
        )
      `)
      .is('embeddings.embedding', null)
      .limit(10) // Process in small batches

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    console.log(`Found ${messages?.length ?? 0} messages that need embeddings`);
    if (messages?.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        message: 'No messages need processing' 
      });
    }

    // Generate and store embeddings
    for (const message of messages ?? []) {
      try {
        console.log(`Processing message ${message.id}: "${message.content.substring(0, 50)}..."`);
        const embedding = await generateEmbedding(message.content);
        console.log('Embedding generated, length:', embedding.length);
        
        console.log('Updating embedding in database...');
        const { error: updateError } = await serviceClient
          .from('embeddings')
          .update({ embedding })
          .eq('message_id', message.id);

        if (updateError) {
          console.error(`Error updating embedding for message ${message.id}:`, updateError);
        } else {
          console.log(`Successfully updated embedding for message ${message.id}`);
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: messages?.length ?? 0 
    });
  } catch (error) {
    console.error('Error in process-embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to process embeddings', details: error },
      { status: 500 }
    );
  }
} 