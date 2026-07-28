/* 
This is the ONLY file imported directly from index.html. Wiring only. Imported the pieces from other modules and calls them on page load. 
No rendering or fetch logic of its own beyond using the imported repoCard() to build the repo grid. 
*/

import './style.css';

import { initProjectFilters } from './projects.js';
import { fetchRepos, repoCard } from './api.js';
import { initNavAlign, initPageNav, initCanvasAnimation, initContactForm } from './site.js';

const USERNAME = 'han-ari';

async function initRepos(){
  const repoList = document.getElementById('repo-list');
  const repoStatus = document.getElementById('repo-status');
  if(!repoList) return;

  if(repoStatus) repoStatus.classList.add('is-loading');

  try{
    const repos = await fetchRepos(USERNAME);

    // Build a filtered copy with spread so the original fetched array is never mutated —
    // useful if we ever need the full unfiltered list elsewhere later.
    const ownRepos = [...repos].filter((repo) => !repo.fork);

    if(!ownRepos.length){
      repoList.innerHTML = '<p class="form-note">No public repositories found.</p>';
    } else {
      repoList.innerHTML = ownRepos.map(repoCard).join('');
    }
  } catch(err){
    repoList.innerHTML = '<p class="form-note">Couldn\'t load repositories right now. Please try again later.</p>';
    console.error(err);
  } finally {
    if(repoStatus) repoStatus.classList.remove('is-loading');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavAlign();
  initPageNav();
  initCanvasAnimation();
  initContactForm();
  initProjectFilters();
  initRepos();
});
