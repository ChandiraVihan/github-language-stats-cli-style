// src/app/api/stats/[username]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;  // <-- Add 'await' here
  
  return new Response(`Stats for user: ${username}`, { 
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}