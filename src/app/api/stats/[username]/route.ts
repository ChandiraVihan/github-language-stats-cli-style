// src/app/api/stats/[username]/route.ts
import { fetchUserLanguages, fetchGitHubProfile } from '@/lib/github';
import { generateSolarSystemGIF } from '@/lib/gif-generator';

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const params = await context.params;
    const username = params.username;

    const [profile, languages] = await Promise.all([
      fetchGitHubProfile(username),
      fetchUserLanguages(username),
    ]);

    if (languages.length === 0) {
      return new Response('No languages found', { status: 404 });
    }

    const gifBuffer = await generateSolarSystemGIF(profile, languages);

    // Return ArrayBuffer properly
    const arrayBuffer = new ArrayBuffer(gifBuffer.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(gifBuffer);

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to generate GIF', { status: 500 });
  }
}