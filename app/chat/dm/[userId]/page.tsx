interface DMPageProps {
  params: {
    userId: string;
  }
}

export default function DMPage({ params }: DMPageProps) {
  return (
    <div className="flex-1 h-full">
      {/* We'll add the DM conversation component here later */}
      <div>DM conversation with user {params.userId}</div>
    </div>
  )
} 