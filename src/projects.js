/* 
Projects markup stays static in index.html. This module only owns the category filter tab logic 
which is wrapped in an exported init fucntion so main.js can call it during page load.
*/
export function initProjectFilters(){
  const filterTabs = document.querySelectorAll('.filter-tab');
  const projectRows = document.querySelectorAll('.project-row');
  const searchInput = document.getElementById('project-search');
  const resultsCount = document.getElementById('project-results-count');
  const emptyState = document.getElementById('project-empty-state');

  projectRows.forEach((row) => {
    if(row.getAttribute('href') === '#'){
      row.addEventListener('click', (e) => e.preventDefault());
    }
  });
function matchesSearch(row, term){
    if(!term) return true;
    const title = row.querySelector('.item-title')?.textContent.toLowerCase() ?? '';
    const meta = row.querySelector('.item-meta')?.textContent.toLowerCase() ?? '';
    return title.includes(term) || meta.includes(term);
  }

  function applyFilters(){
    const activeTab = document.querySelector('.filter-tab.is-active');
    const activeFilter = activeTab ? activeTab.dataset.filter : 'all';
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let visibleCount = 0;

    projectRows.forEach((row) => {
      const matchesCategory = activeFilter === 'all' || row.dataset.category === activeFilter;
      const match = matchesCategory && matchesSearch(row, term);
      row.classList.toggle('is-hidden', !match);
      if(match) visibleCount++;
    });

    if(resultsCount){
      const total = projectRows.length;
      resultsCount.textContent = `Showing ${visibleCount} of ${total}`;
    }

    if(emptyState){
      emptyState.hidden = visibleCount !== 0;
    }
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-pressed', 'true');
            applyFilters();
    });
  });

  if(searchInput){
    searchInput.addEventListener('input', applyFilters);

    // Escape clears the search rather than doing nothing, matching the pattern from Week 6's search.
    searchInput.addEventListener('keydown', (e) => {
      if(e.key === 'Escape'){
        searchInput.value = '';
        applyFilters();
        searchInput.blur();
      }
    });
  }

  applyFilters();
}
