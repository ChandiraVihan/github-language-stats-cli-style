export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;  
  
  return new Response(`Stats for user: ${username}`, { 
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}