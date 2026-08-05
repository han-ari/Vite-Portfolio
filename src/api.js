// GitHub Repositories that fetch live repo data. Logic unchanged. Exported so main.js can wire it up to the DOM.

export async function fetchRepos(username){
  const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
  if(!response.ok){
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }
  return response.json();
}

export function repoCard({ name, html_url, description, language, stargazers_count }){
  const desc = description ? description : 'No description provided.';
  const languageBadge = language ? `<span class="item-meta">${language}</span>` : '';

  return `
    <a href="${html_url}" class="item-row repo-row" target="_blank" rel="noopener noreferrer">
      <div class="repo-row-main">
        <span class="item-title">${name}</span>
        <span class="repo-desc">${desc}</span>
      </div>
      <div class="repo-row-meta">
        ${languageBadge}
        <span class="item-meta repo-stars">★ ${stargazers_count}</span>
      </div>
    </a>
  `;
}
