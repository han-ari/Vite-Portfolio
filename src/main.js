/* 
This is the ONLY file imported directly from index.html. Wiring only. Imported the pieces from other
modules and calls them on page load.  No rendering or fetch logic of its own beyond using the imported
repoCard() to build the repo grid. 
*/

import './style.css';

import { initProjectFilters } from './projects.js';
import { fetchRepos, repoCard } from './api.js';
import { initNavAlign, initPageNav, initScrollSpy, initCanvasAnimation, initContactForm } from './site.js';

const USERNAME = 'han-ari';

async function initRepos(){
  const repoList = document.getElementById('repo-list');
  const repoStatus = document.getElementById('repo-status');
  if(!repoList) return;

  if(repoStatus) repoStatus.classList.add('is-loading');

  try{
    const repos = await fetchRepos(USERNAME);
    /*
    Built a filtered copy with spread so the original fetched array is never mutated. Useful if we ever
    need the full unfiltered list elsewhere later.
    */
    const ownRepos = [...repos].filter((repo) => !repo.fork);

    if(!ownRepos.length){
      repoList.innerHTML = '<p class="form-note">No public repositories found.</p>';
    } else {
      repoList.innerHTML = ownRepos.map(repoCard).join('');
    }
  } catch(err){
    repoList.innerHTML = `
      <div class="repo-error">
        <p class="form-note">Couldn't load repositories right now. Please try again.</p>
        <button type="button" class="retry-btn" id="repo-retry-btn">Retry</button>
      </div>
    `;    
    console.error(err);

    const retryBtn = document.getElementById('repo-retry-btn');
    if(retryBtn){
      retryBtn.addEventListener('click', () => initRepos());
    }
  } finally {
    if(repoStatus) repoStatus.classList.remove('is-loading');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  /*
  Order matters for these three: initNavAlign sets the viewport's padding-top, initPageNav then jumps
  to any deep-linked section against that settled layout, and initScrollSpy starts observing last so
  its first reading is of the final scroll position instead of a stale one.
  */
  initNavAlign();
  initPageNav();
  initScrollSpy();
  initCanvasAnimation();
  initContactForm();
  initProjectFilters();
  initRepos();
});
