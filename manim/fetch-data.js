// Fetches GitHub data before rendering
const fs = require('fs');

const username = process.env.USERNAME || 'testuser';
const token = process.env.GH_TOKEN;

async function fetchData() {
  const query = `
    query($user: String!) {
      user(login: $user) {
        name
        bio
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges { size node { name color } }
            }
          }
        }
      }
    }
  `;
  
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { user: username } })
  });
  
  const data = await response.json();
  
  // Process languages (same logic as before)
  const langMap = {};
  data.data.user.repositories.nodes.forEach(repo => {
    repo.languages?.edges?.forEach(edge => {
      const name = edge.node.name;
      if (!langMap[name]) {
        langMap[name] = { name, color: edge.node.color, size: 0 };
      }
      langMap[name].size += edge.size;
    });
  });
  
  const total = Object.values(langMap).reduce((a, b) => a + b.size, 0);
  const languages = Object.values(langMap)
    .sort((a, b) => b.size - a.size)
    .slice(0, 6)
    .map(l => ({ ...l, percent: Math.round(l.size/total*100*10)/10 }));
  
  fs.writeFileSync('/manim/stats_data.json', JSON.stringify({
    username,
    name: data.data.user.name || username,
    bio: data.data.user.bio || 'Developer',
    languages
  }));
}

fetchData();