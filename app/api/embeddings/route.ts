import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from '@/utils/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { messageId } = await req.json();

    // Fetch the message content
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('content')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Generate embedding
    const embedding = await generateEmbedding(message.content);

    // Store embedding
    const { error: embeddingError } = await supabase
      .from('embeddings')
      .insert({
        message_id: messageId,
        embedding
      });

    if (embeddingError) {
      throw embeddingError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing embedding:', error);
    return NextResponse.json({ error: 'Failed to process embedding' }, { status: 500 });
  }
}

// Batch processing endpoint
export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get messages without embeddings
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content')
      .not('id', 'in', (
        supabase.from('embeddings').select('message_id')
      ))
      .limit(50); // Process in batches of 50

    if (messagesError) {
      throw messagesError;
    }

    // Generate and store embeddings
    for (const message of messages || []) {
      const embedding = await generateEmbedding(message.content);
      
      const { error: embeddingError } = await supabase
        .from('embeddings')
        .insert({
          message_id: message.id,
          embedding
        });

      if (embeddingError) {
        console.error(`Error storing embedding for message ${message.id}:`, embeddingError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: messages?.length || 0 
    });
  } catch (error) {
    console.error('Error in batch processing:', error);
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 });
  }
}
