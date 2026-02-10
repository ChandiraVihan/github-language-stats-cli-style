// src/app/api/stats/[username]/route.ts
import { fetchUserLanguages, fetchGitHubProfile } from '@/lib/github';
import { generateSolarSystemGIF } from '@/lib/gif-generator';

export const runtime = 'nodejs';
export const maxDuration = 30; // Allow 30 seconds for generation

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

    return new Response(gifBuffer, {
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