<a href="#">
  <img alt="ChattyG - A modern team chat platform" src="/public/opengraph-image.png">
  <h1 align="center">ChattyG</h1>
</a>

<p align="center">
 A modern team chat platform built with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a>
</p>
<br/>

## Features

- Real-time messaging with channel support
- Direct messaging between users
- Message threading and emoji reactions
- File sharing and attachments
- User presence and status indicators
- Full text search across messages
- Dark theme and responsive design

## Tech Stack

- [Next.js 13+](https://nextjs.org) with App Router
- [Supabase](https://supabase.com) for backend and real-time features
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Shadcn UI](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) for styling
- [UploadThing](https://uploadthing.com) for file uploads
- React Server Components where possible

## Getting Started

1. Clone the repository
   ```bash
   git clone [repository-url]
   cd chattyg
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
   UPLOADTHING_TOKEN=[YOUR_UPLOADTHING_SECRET_KEY]
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses the following main tables in Supabase:
- profiles - User profile information
- channels - Chat channels
- messages - Message storage with threading support
- channel_members - Channel membership management
- message_reactions - Emoji reactions
- file_attachments - File upload metadata

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utility functions and types
- `/public` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
