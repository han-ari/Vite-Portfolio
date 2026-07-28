/*
Projects markup stays static in index.html (six hardcoded cards with hover thumbnail SVGs). This module only owns the category filter tab logic
which is wrapped in an exported init function so main.js can call it during page load. 
*/
export function initProjectFilters(){
  const filterTabs = document.querySelectorAll('.filter-tab');
  const projectRows = document.querySelectorAll('.project-row');

  projectRows.forEach((row) => {
    if(row.getAttribute('href') === '#'){
      row.addEventListener('click', (e) => e.preventDefault());
    }
  });

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      const filter = tab.dataset.filter;
      projectRows.forEach((row) => {
        const match = filter === 'all' || row.dataset.category === filter;
        row.classList.toggle('is-hidden', !match);
      });
    });
  });
}
