// src/app/api/stats/[username]/route.ts

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  
  // Check if render exists
  const gifUrl = `https://yourname.github.io/github-solar-stats/renders/${username}/stats.gif`;
  
  try {
    const check = await fetch(gifUrl, { method: 'HEAD' });
    
    if (check.ok) {
      // Return existing GIF
      return Response.redirect(gifUrl, 302);
    }
  } catch {
    // Not found, trigger render
  }
  
  // Trigger GitHub Action to render
  await fetch(
    `https://api.github.com/repos/yourname/github-solar-stats/actions/workflows/render.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { username }
      })
    }
  );
  
  return new Response(
    JSON.stringify({ 
      status: 'rendering',
      message: 'Check back in 2 minutes',
      url: gifUrl 
    }),
    { 
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}