import { graphql } from '@octokit/graphql';                  //Github api utility

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  },
});

export interface Language {
  name: string;
  color: string;
  size: number;
}

export async function fetchUserLanguages(username: string): Promise<Language[]> {
  const query = `
    query GetUserLanguages($username: String!, $cursor: String) {
      user(login: $username) {
        repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const result: any = await graphqlWithAuth(query, { username });
  
  // Aggregate languages across all repos
  const languageMap = new Map<string, { color: string; size: number }>();
  
  for (const repo of result.user.repositories.nodes) {
    if (!repo.languages?.edges) continue;
    
    for (const edge of repo.languages.edges) {
      const { name, color } = edge.node;
      const size = edge.size;
      
      if (languageMap.has(name)) {
        languageMap.get(name)!.size += size;
      } else {
        languageMap.set(name, { color, size });
      }
    }
  }

  // Convert to array and sort by size
  return Array.from(languageMap.entries())
    .map(([name, { color, size }]) => ({ name, color, size }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 8); // Top 8 languages
}