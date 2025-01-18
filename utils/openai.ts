import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string) {
  console.log('=== Generating Embedding ===');
  console.log('Input text length:', text.length);
  try {
    console.log('Calling OpenAI API...');
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    
    console.log('OpenAI API response received');
    console.log('Response data length:', response.data.length);
    
    const embedding = response.data[0].embedding;
    console.log('Embedding vector length:', embedding.length);
    console.log('First few values:', embedding.slice(0, 3));
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}
