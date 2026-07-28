/*
This module has everything that isn't Projects or GitHub Repos. Wave animation, hero/nav alignment sync, page switching nav, and the 
contact form. Each piece is wrapped in its own exported init fuction so that main.js can call them individually during DOMContentLoaded. 
*/

/*
Content should start level with the first nav link, not my name. Tried a pure CSS formula but formatting because wonky.
So instead, I measured the nav's actual rendered position so no matter how my name wraps, it fits any screen size.
*/
export function initNavAlign(){
  const heroBlock = document.getElementById('hero-block');
  const pageViewport = document.getElementById('page-viewport');
  const navEl = document.querySelector('.section-nav');

  const mobileStackQuery = window.matchMedia('(max-width:700px), (orientation:landscape) and (max-width:1000px), (orientation:landscape) and (max-height:600px)');

  function syncNavAlign(){
    if(!heroBlock || !pageViewport || !navEl) return;

    /*
    On mobile, the header stacks on top of the content instead of sitting besides it so there's no horizontal alignment to worry about.
    Clears any leftover inline padding and lets the mobile CSS rule control spacking instead.
    */
    if(mobileStackQuery.matches){
      pageViewport.style.paddingTop = '';
      return;
    }

    const heroRect = heroBlock.getBoundingClientRect();
    const navRect = navEl.getBoundingClientRect();
    const offset = Math.max(0, navRect.top - heroRect.top);
    pageViewport.style.paddingTop = offset + 'px';
  }
  window.addEventListener('resize', syncNavAlign);
  window.addEventListener('orientationchange', syncNavAlign);
  syncNavAlign();
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(syncNavAlign);
  }

  /*
  Window resize only fires when the viewport itself changes size, but my name can wrap differently at widths that don't cross a media query
  boundary (ex. tablet portrait), which changes the nav's vertical position without firing a resize event. A ResizeObserver on the hero block
  itself cathces that reflow directly, so the two columns stay lined up no matter what even if the hero block's height changes.
  */
  if('ResizeObserver' in window && heroBlock){
    const heroResizeObserver = new ResizeObserver(() => syncNavAlign());
    heroResizeObserver.observe(heroBlock);
  }
}

/*
Nav clicks switch between "pages" inside the frame. The frame, canvas, and hero block never move, only the active
page content changes, like separate pages sharing the same shell.
*/
export function initPageNav(){
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.section-nav a[href^="#"]');
  const homeLink = document.querySelector('.hero-name-link');

  function setActivePage(id){
    pages.forEach((page) => {
      page.classList.toggle('is-active', page.id === id);
    });
    navLinks.forEach((link) => {
      link.classList.toggle('is-current', link.getAttribute('href') === '#' + id);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      setActivePage(id);
      history.pushState(null, '', '#' + id);
    });
  });

  if(homeLink){
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      setActivePage('home');
      history.pushState(null, '', '#home');
    });
  }

  window.addEventListener('popstate', () => {
    const id = location.hash ? location.hash.slice(1) : 'home';
    setActivePage(id);
  });

  setActivePage(location.hash ? location.hash.slice(1) : 'home');
}

/*
Simple deterministic pseudo-random hash per grid cell, so dots jitter in a fixed but organic way instead
of re-randomizing every frame.
*/
function hash(x, y){
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Palette (animation only — the rest of the page stays white)
const COLOR_BLUE = [131, 166, 255];   // #83a6ff
const COLOR_CORAL = [255, 150, 107];  // #ff966b

function lerp(a, b, f){ return a + (b - a) * f; }
function mixColor(c1, c2, f){
  return [
    lerp(c1[0], c2[0], f),
    lerp(c1[1], c2[1], f),
    lerp(c1[2], c2[2], f)
  ];
}

const CELL = 5; // px spacing between dot centers so fine grain

export function initCanvasAnimation(){
  const frame = document.getElementById('frame');
  const canvas = document.getElementById('wave-canvas');
  if(!frame || !canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let mouseX = 0.5;
  let mouseY = 0.5;

  function resize(){
    width = frame.clientWidth;
    height = frame.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  frame.addEventListener('pointermove', (e) => {
    const rect = frame.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let startTime = performance.now();

  function draw(now){
    requestAnimationFrame(draw);

    const t = prefersReducedMotion ? 0 : (now - startTime) / 1000;

    ctx.clearRect(0, 0, width, height);

    const cols = Math.ceil(width / CELL) + 1;
    const rows = Math.ceil(height / CELL) + 1;

    // Beach-wave direction: rolling diagonally (135deg), coming in from bottom-left to top-right
    const dirX = 0.707;
    const dirY = -0.707;

    for(let iy = 0; iy < rows; iy++){
      for(let ix = 0; ix < cols; ix++){
        const cx = ix * CELL;
        const cy = iy * CELL;

        const nx = cx / width;
        const ny = cy / height;

        // Fine per-dot swell (grain-level texture)
        const finePhase = (nx * dirX + ny * dirY) * 22 - t * 1.225;
        const fineSwell = Math.sin(finePhase) * 0.5 + Math.sin(finePhase * 2.3 + ny * 6) * 0.3;

        // I wanted rolling waves across the box at a lower frequency and lower exponent so it looks thicker and more pronounced.
        const bandPhase = (nx * dirX + ny * dirY) * 3.2 - t * 0.65;
        const band = Math.pow(Math.max(0, Math.sin(bandPhase)), 1.3);

        // Per-cell jitter so it doesn't look like a rigid grid
        const jitterX = (hash(ix, iy) - 0.5) * CELL * 0.6;
        const jitterY = (hash(ix + 91.7, iy + 3.3) - 0.5) * CELL * 0.6;

        const px = cx + jitterX;
        const py = cy + jitterY;

        const mouseDist = Math.hypot(nx - mouseX, ny - mouseY);
        const mouseBoost = Math.max(0, 1 - mouseDist / 0.35) * 0.5;

        const sizeNoise = hash(ix * 0.31, iy * 0.31 + Math.floor(t * 0.5));
        let radius = 0.3 + sizeNoise * 0.4 + fineSwell * 0.3 + band * 1.1 + mouseBoost * 0.5;
        radius = Math.max(0.15, radius);

        let alpha = 0.08 + Math.max(0, fineSwell) * 0.1 + band * 0.55 + mouseBoost * 0.2;
        alpha = Math.min(alpha, 0.75);

        // colour along the 135deg axis, blue -> coral
        const gradPos = Math.min(1, Math.max(0, (nx + (1 - ny)) / 2));
        const [r, g, b] = mixColor(COLOR_BLUE, COLOR_CORAL, gradPos);

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }
  }

  requestAnimationFrame(draw);
}

/*
Made a contact form with a character counter and mailto submit. Will swap this for a Formspree/EmailJS fetch call
once I have an endpoint, so tthe form submits in-page instead of opening email.
*/
export function initContactForm(){
  const contactForm = document.getElementById('contact-form');
  const cfMessage = document.getElementById('cf-message');
  const cfCount = document.getElementById('cf-count');
  const cfNote = document.getElementById('cf-note');

  if(cfMessage && cfCount){
    cfMessage.addEventListener('input', () => {
      cfCount.textContent = cfMessage.value.length;
    });
  }

  if(contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const message = cfMessage.value.trim();

      if(!name || !email || !message){
        cfNote.textContent = 'Please fill in every field.';
        return;
      }

      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:you@example.com?subject=${subject}&body=${body}`;

      cfNote.textContent = 'Opening your email client...';
    });
  }
}
