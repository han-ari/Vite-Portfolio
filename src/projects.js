/* 
Projects markup stays static in index.html. This module only owns the category filter tab logic 
which is wrapped in an exported init fucntion so main.js can call it during page load.
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
      filterTabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-pressed', 'true');

      const filter = tab.dataset.filter;
      projectRows.forEach((row) => {
        const match = filter === 'all' || row.dataset.category === filter;
        row.classList.toggle('is-hidden', !match);
      });
    });
  });
}
