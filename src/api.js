//GitHub Repositories that fetch live repo data. Logic unchanged. Exported so main.js can wire it up to the DOM.

export async function fetchRepos(username){
  const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
  if(!response.ok){
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }
  return response.json();
}

export function repoCard(repo){
  const description = repo.description ? repo.description : 'No description provided.';
  const language = repo.language ? `<span class="item-meta">${repo.language}</span>` : '';

  return `
    <a href="${repo.html_url}" class="item-row repo-row" target="_blank" rel="noopener noreferrer">
      <div class="repo-row-main">
        <span class="item-title">${repo.name}</span>
        <span class="repo-desc">${description}</span>
      </div>
      <div class="repo-row-meta">
        ${language}
        <span class="item-meta repo-stars">★ ${repo.stargazers_count}</span>
      </div>
    </a>
  `;
}
