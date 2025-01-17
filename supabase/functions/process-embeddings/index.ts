import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  })
  return response.data[0].embedding
}

Deno.serve(async (req) => {
  try {
    // Get messages without embeddings
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content')
      .in('id', (
        supabase
          .from('embeddings')
          .select('message_id')
          .is('embedding', null)
      ))
      .limit(10) // Process in small batches

    if (messagesError) throw messagesError

    console.log(`Processing ${messages?.length ?? 0} messages`)

    // Generate and store embeddings
    for (const message of messages ?? []) {
      try {
        const embedding = await generateEmbedding(message.content)
        
        const { error: updateError } = await supabase
          .from('embeddings')
          .update({ embedding })
          .eq('message_id', message.id)

        if (updateError) {
          console.error(`Error updating embedding for message ${message.id}:`, updateError)
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: messages?.length ?? 0 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in process-embeddings:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process embeddings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 