/*
This module has everything that isn't Projects or GitHub Repos. Wave animation, hero/nav alignment sync,
the scroll-driven nav (reveal-on-scroll + which link is underlined + click-to-scroll), and the contact 
form. Each piece is wrapped in its own exported init fuction so that main.js can call them individually
during DOMContentLoaded.
*/

/*
Sets which nav link is underlined. Shared by the scroll spy and the click handler.
*/
function setCurrentLink(navLinks, id) {
  navLinks.forEach((link) => {
    link.classList.toggle('is-current', id !== null && link.getAttribute('href') === '#' + id);
  });
}

/*
Only one section is ever fully visible at a time, matching whichever one is currently settled in the
viewport. This drives two things off the same "which section is current" geometry check: which .page
gets the .is-current class (so CSS can scale+fade it in while every other section fades out), and
which nav link gets underlined. Because only the current section is ever shown, its --nav-offset
padding (see style.css) always lines its heading up with the nav - there's no partial overlap with a
neighbouring section to throw that alignment off.
*/
export function initScrollSpy() {
  const pageViewport = document.getElementById('page-viewport');
  const homeSpacer = document.getElementById('home');
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.section-nav a[href^="#"]');
  if (!pageViewport || !pages.length) return;

  const snapTargets = homeSpacer ? [homeSpacer, ...pages] : Array.from(pages);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileStackQuery = window.matchMedia('(max-width:700px), (orientation:landscape) and (max-width:1000px), (orientation:landscape) and (max-height:600px)');

  /*
  Keeps the URL hash matching whichever section is current, so refreshing or copying the link lands
  back in the right place. Previously this only happened on an explicit nav click; scrolling there
  naturally left the URL stale. replaceState rather than pushState on purpose: pushState would add a
  new browser-history entry for every section you scroll past, so the back button would have to be
  hit once per section instead of taking you to wherever you were before you landed on this page.
  */
  let lastHash = null;
  function syncHash(id) {
    const hash = '#' + id;
    if (hash === lastHash) return;
    lastHash = hash;
    history.replaceState(null, '', hash);
  }

  function updateVisuals() {
    const midline = pageViewport.getBoundingClientRect().top + pageViewport.clientHeight / 2;
    let current = null;
    pages.forEach((page) => {
      if (page.getBoundingClientRect().top <= midline) current = page;
    });
    pages.forEach((page) => {
      page.classList.toggle('is-current', page === current);
    });
    setCurrentLink(navLinks, current ? current.id : null);
    syncHash(current ? current.id : 'home');
  }

  function goToIndex(index) {
    index = Math.max(0, Math.min(snapTargets.length - 1, index));
    const target = snapTargets[index];
    pageViewport.scrollTo({ top: target.offsetTop, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  /*
  Which snap target's own range currently contains the scroll position -this is what the wheel
  handler needs to know whether there's still content below/above worth scrolling through, rather
  than just picking whichever section's top happens to be closest.
  */
  function containingIndex() {
    const scrollTop = pageViewport.scrollTop;
    let idx = 0;
    snapTargets.forEach((el, i) => {
      if (el.offsetTop <= scrollTop + 1) idx = i;
    });
    return idx;
  }

  /*
  On desktop/tablet, wheel/trackpad input pages between short sections instead of leaving you able to
  rest halfway between two with neither aligned to the nav. But Technical Summary and Repositories can
  both run taller than one viewport, and jumping straight to the next section on every wheel tick
  regardless of position meant there was no way to actually scroll through the rest of their content -
  the first tick out of a tall section skipped straight past everything still below the fold.

  So a wheel tick only triggers a page-jump once you've reached the edge of the CURRENT section's own
  content - scrolled all the way to its bottom before advancing forward, or all the way to its top
  before going back. Anywhere in between, the wheel event is left alone and scrolls normally, the same
  as it would inside any ordinary scrollable page.

  This only touches wheel input, on purpose. Keyboard scrolling (Page Up/Down, arrow keys, Tab) and
  touch both fall straight through to ordinary, uncaptured scrolling - nothing here ever prevents the
  page from being scrolled through by any method, which is the actual accessibility requirement.
  Reduced-motion users get an instant jump instead of an animated one, same as everywhere else in this
  file.
  */
  let wheelLocked = false;
  function onWheel(e) {
    if (mobileStackQuery.matches) return;

    const idx = containingIndex();
    const direction = e.deltaY > 0 ? 1 : -1;
    const scrollTop = pageViewport.scrollTop;
    const viewportHeight = pageViewport.clientHeight;
    const sectionStart = snapTargets[idx].offsetTop;
    const sectionEnd = idx + 1 < snapTargets.length ? snapTargets[idx + 1].offsetTop : pageViewport.scrollHeight;

    const hasRoomBelow = scrollTop + viewportHeight < sectionEnd - 1;
    const hasRoomAbove = scrollTop > sectionStart + 1;

    if (direction === 1 && hasRoomBelow) return;     // still content below in this section - let it scroll normally
    if (direction === -1 && hasRoomAbove) return;    // still content above in this section - let it scroll normally

    e.preventDefault();
    if (wheelLocked) return;

    const next = idx + direction;
    if (next < 0 || next >= snapTargets.length) return;

    wheelLocked = true;
    goToIndex(next);
    setTimeout(() => { wheelLocked = false; }, prefersReducedMotion ? 150 : 550);
  }
  pageViewport.addEventListener('wheel', onWheel, { passive: false });

  let rafId = 0;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      updateVisuals();
    });
  }
  pageViewport.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateVisuals();
}

/*
Content should start level with the first nav link, not my name, for EVERY section - not just the
first one. Tried a pure CSS formula but formatting because wonky. So instead, I measured the nav's
actual rendered position and expose it as a CSS custom property that every section reads as its own
top padding, so whichever one is currently in view lines its heading up with the nav the same way.
*/
export function initNavAlign() {
  const heroBlock = document.getElementById('hero-block');
  const pageViewport = document.getElementById('page-viewport');
  const navEl = document.querySelector('.section-nav');

  const mobileStackQuery = window.matchMedia('(max-width:700px), (orientation:landscape) and (max-width:1000px), (orientation:landscape) and (max-height:600px)');

  function syncNavAlign() {
    if (!heroBlock || !pageViewport || !navEl) return;

    /*
    On mobile, the header stacks above the content instead of sitting beside it, so there's no
    horizontal alignment to worry about - clear the custom property and let the mobile CSS block's
    own fixed padding take over.
    */
    if (mobileStackQuery.matches) {
      pageViewport.style.removeProperty('--nav-offset');
      return;
    }

    const heroRect = heroBlock.getBoundingClientRect();
    const navRect = navEl.getBoundingClientRect();
    const offset = Math.max(0, navRect.top - heroRect.top);
    pageViewport.style.setProperty('--nav-offset', offset + 'px');
  }
  window.addEventListener('resize', syncNavAlign);
  window.addEventListener('orientationchange', syncNavAlign);
  syncNavAlign();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncNavAlign);
  }

  /*
  Window resize only fires when the viewport itself changes size, but my name can wrap differently 
  at widths that don't cross a media query  boundary (ex. tablet portrait), which changes the nav's 
  vertical position without firing a resize event. A ResizeObserver on the hero block itself catches
  that reflow directly, so the two columns stay lined up no matter what even if the hero block's 
  height changes.
  */
  if ('ResizeObserver' in window && heroBlock) {
    const heroResizeObserver = new ResizeObserver(() => syncNavAlign());
    heroResizeObserver.observe(heroBlock);
  }
}

/*
Nav clicks scroll to a section instead of swapping which one is displayed. The frame, canvas, and hero
block still never move - only #page-viewport scrolls. Nothing in here touches .is-current any more; the
scroll spy owns the underline and the fade, so a section lights up and appears because the scroll
landed there, not because it was clicked.
*/
export function initPageNav() {
  const pageViewport = document.getElementById('page-viewport');
  const navLinks = document.querySelectorAll('.section-nav a[href^="#"]');
  const homeLink = document.querySelector('.hero-name-link');
  if (!pageViewport) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*
  Scroll to each section's own offsetTop rather than scrollIntoView - same reasoning as the settle
  snap in initScrollSpy: offsetTop is exact, since it's relative to #page-viewport (which is the
  nearest positioned ancestor), while scrollIntoView's alignment can land a few px off for sections
  taller than the viewport. Clicks are a direct request to go somewhere, so unlike the passive
  settle snap, these still move even with reduced motion on; they just jump there instantly instead
  of animating.
  */
  function goToSection(target, behavior) {
    pageViewport.scrollTo({ top: target.offsetTop, behavior: prefersReducedMotion ? 'auto' : behavior });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      goToSection(target, 'smooth');
      history.pushState(null, '', '#' + id);
    });
  });

  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      pageViewport.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', '#home');
    });
  }

  /*
  Deep links still have to work. The browser's own jump-to-fragment is unreliable here because the
  scroller is a nested element and initNavAlign changes its padding after load, so do it manually with
  'auto' so it's already in place rather than visibly scrolling there.
  */
  const deepLink = location.hash.slice(1);
  if (deepLink) {
    const target = document.getElementById(deepLink);
    if (target && target.classList.contains('page')) goToSection(target, 'auto');
  }
}

/*
Simple deterministic pseudo-random hash per grid cell, so dots jitter in a fixed but organic way instead
of re-randomizing every frame.
*/
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Palette (animation only — the rest of the page stays white)
const COLOR_BLUE = 'rgb(131,166,255)';    // #83a6ff
const COLOR_CORAL = 'rgb(255,150,107)';   // #ff966b

/*
px spacing between dot centers, so fine grain. This is the main cost dial for the whole animation: the dot
count is (width/CELL) * (height/CELL), so cost scales with 1/CELL². A fixed CELL=5 meant a small mobile
viewport and a large desktop one ended up with wildly different dot counts - a Lighthouse run showed
~16.7s of blocked main-thread time on a large desktop viewport (tens of thousands more dots than the same
constant produced on a phone) versus none at all on mobile. CELL is computed per-resize instead, targeting
a fixed dot budget regardless of screen size, so a big screen gets a coarser grain rather than a
proportionally heavier frame cost.
*/
let CELL = 5;
const TARGET_DOT_COUNT = 55000;     
/* 
Was 38000, tuned for a 30fps (50%-cost) frame cap. The switch to a true 24fps cap (40%-cost) below freed
up more budget than that left banked as safety margin, so this uses it to push density back up instead - targeting
roughly the same total render cost as the 22000-dots/60fps configuration that measured at Desktop Performance 78
earlier, just spent on more dots at a lower frame rate instead. 
*/
function computeCell(width, height){
  const idealCell = Math.sqrt((width * height) / TARGET_DOT_COUNT);
  return Math.max(5, idealCell);     // never finer than the original 5px grain, only ever coarser
}

/*
Wave shape lookup tables.

Every dot used to run three Math.sin calls and a Math.pow every frame. At CELL=5 a 1900x1000 frame is about
78,000 dots, so that was ~310,000 transcendental calls per frame, 60 times a second and none of them told
us anything new, because all three are periodic functions of a phase. So compute one full 2*PI cycle into a
table up front and look values up instead. Math.pow folds into the band table for free.

Indexing is `(phase * LUT_SCALE) & LUT_MASK`. The bitwise AND does double duty: it truncates the float to an
integer and wraps the phase into the table. It also wraps correctly for negative phases, which matters here
because scrolling back up drives the phase below zero. 4096 entries is fine enough that the steps are invisible.
*/
const LUT_SIZE = 4096;
const LUT_MASK = LUT_SIZE - 1;
const LUT_SCALE = LUT_SIZE / (Math.PI * 2);
const SIN_LUT = new Float32Array(LUT_SIZE);
const BAND_LUT = new Float32Array(LUT_SIZE);
for (let i = 0; i < LUT_SIZE; i++) {
  const angle = i / LUT_SCALE;
  SIN_LUT[i] = Math.sin(angle);
  BAND_LUT[i] = Math.pow(Math.max(0, Math.sin(angle)), 1.3);
}

/*
Dots get sorted into this many alpha steps so they can be drawn in batches instead of one at a time (see
render). 64 steps over an alpha range of 0.75 is a step of about 0.012 - well below what shows up as banding.
*/
const ALPHA_STEPS = 64;
const ALPHA_MAX = 0.75;

export function initCanvasAnimation() {
  const frame = document.getElementById('frame');
  const canvas = document.getElementById('wave-canvas');
  if (!frame || !canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;

  let mouseX = 0.5;
  let mouseY = 0.5;

  let gradient = null;

  /*
  Per-dot values that don't change unless the frame is resized: jittered position, the three wave phase
  offsets, and the base radius. All of this used to be recalculated inside the frame loop - the jitter and
  the size noise alone were three hash() calls, so three more Math.sin, per dot per frame. Now it's computed
  once per resize into flat typed arrays that render() just walks straight through in order.
  */
  let dotCount = 0;
  let dotX, dotY, phaseFine, phaseFineB, phaseBand, dotBaseSize;

  function buildDots() {
    const cols = Math.ceil(width / CELL) + 1;
    const rows = Math.ceil(height / CELL) + 1;
    dotCount = cols * rows;

    dotX = new Float32Array(dotCount);
    dotY = new Float32Array(dotCount);
    phaseFine = new Float32Array(dotCount);
    phaseFineB = new Float32Array(dotCount);
    phaseBand = new Float32Array(dotCount);
    dotBaseSize = new Float32Array(dotCount);

    // Beach-wave direction: rolling diagonally (135deg), coming in from bottom-left to top-right
    const dirX = 0.707;
    const dirY = -0.707;

    let i = 0;
    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++, i++) {
        const cx = ix * CELL;
        const cy = iy * CELL;
        const nx = cx / width;
        const ny = cy / height;

        // Per-cell jitter so it doesn't look like a rigid grid
        dotX[i] = cx + (hash(ix, iy) - 0.5) * CELL * 0.6;
        dotY[i] = cy + (hash(ix + 91.7, iy + 3.3) - 0.5) * CELL * 0.6;

        /*
        Each wave phase is `axis * frequency - t * speed`. Only the t half moves, so the axis half gets baked
        in here and render() just subtracts the moving part off a number that's already waiting for it.
        */
        const axis = nx * dirX + ny * dirY;
        phaseFine[i] = axis * 22;                    // fine per-dot swell (grain-level texture)
        phaseFineB[i] = axis * 22 * 2.3 + ny * 6;    // second, higher-frequency fine term
        phaseBand[i] = axis * 3.2;                   // slower, thicker rolling bands

        dotBaseSize[i] = 0.3 + hash(ix * 0.31, iy * 0.31) * 0.4;
      }
    }

    /*
    Colour used to be mixed per dot and written into a fresh `rgba(...)` template string - ~78,000 string
    allocations and ~78,000 CSS colour parses every frame, just to redraw a gradient that never changes shape.
    It's a fixed diagonal blue -> coral ramp, so hand it to the canvas once as a real linear gradient and let
    the compositor do it. Alpha is the only part that still varies per dot, and globalAlpha handles that.
    */
    gradient = ctx.createLinearGradient(0, height, width, 0);
    gradient.addColorStop(0, COLOR_BLUE);
    gradient.addColorStop(1, COLOR_CORAL);
  }

  function resize() {
    width = frame.clientWidth;
    height = frame.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CELL = computeCell(width, height);
    buildDots();
  }
  window.addEventListener('resize', resize);
  resize();

  frame.addEventListener('pointermove', (e) => {
    const rect = frame.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*
  Back to a real clock instead of scroll position - the wave rolls continuously on its own, same as the
  original version, rather than only moving when you scroll. The render math below is unchanged from the
  scroll-driven version though: lookup tables instead of live Math.sin/Math.pow calls, and one batched
  Path2D fill per alpha step instead of a fill() per dot. That's what actually fixed the slowdown, this
  just decides what drives `t`, not how expensive each frame is.
  */
  let startTime = performance.now();
  /*
  Capped at 24fps rather than whatever the display refresh rate is. Leaves more of the performance budget
  free for the dot count above to stay dense.
  */
  const TARGET_FPS = 24;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;
  let lastRenderTime = 0;

  function draw(now) {
    requestAnimationFrame(draw);
    if (now - lastRenderTime < FRAME_INTERVAL) return;
    lastRenderTime = now;
    const t = prefersReducedMotion ? 0 : (now - startTime) / 1000;
    render(t);
  }

  function render(t) {
    ctx.clearRect(0, 0, width, height);
    if (!dotCount) return;

    // Only the moving halves of the three wave phases, worked out once per frame instead of once per dot
    const tFine = t * 1.225;
    const tFineB = t * 2.8175;    // the fine term's phase is scaled by 2.3, so its speed is too
    const tBand = t * 0.65;

    // Pointer falloff still measured in normalized space, but pre-scaled so the inner loop needs no divisions
    const invW = 1 / width;
    const invH = 1 / height;
    const mpx = mouseX * width;
    const mpy = mouseY * height;
    const MOUSE_RADIUS = 0.35;
    const mouseR2 = MOUSE_RADIUS * MOUSE_RADIUS;

    /*
    One Path2D per alpha step, filled in a single batch at the end. This is the biggest saving of the lot: a
    naive loop does a beginPath + arc + fillStyle + fill per dot, so ~78,000 separate fill dispatches and
    ~78,000 colour-string parses per frame. This is 64 fills and 64 globalAlpha writes, and the dots
    themselves are just points accumulated into a path.
    */
    const buckets = new Array(ALPHA_STEPS);
    for (let s = 0; s < ALPHA_STEPS; s++) buckets[s] = new Path2D();

    for (let i = 0; i < dotCount; i++) {
      const fine = SIN_LUT[((phaseFine[i] - tFine) * LUT_SCALE) & LUT_MASK] * 0.5
                 + SIN_LUT[((phaseFineB[i] - tFineB) * LUT_SCALE) & LUT_MASK] * 0.3;

      // Lower frequency and a lower exponent, so the rolling bands read thicker and more pronounced
      const band = BAND_LUT[((phaseBand[i] - tBand) * LUT_SCALE) & LUT_MASK];

      /*
      Compare squared distances so the square root is skipped for the ~60% of dots outside the pointer's reach
      (the falloff radius is 0.35 of the frame, so it covers about pi * 0.35² of it).
      */
      let mouseBoost = 0;
      const dx = (dotX[i] - mpx) * invW;
      const dy = (dotY[i] - mpy) * invH;
      const d2 = dx * dx + dy * dy;
      if (d2 < mouseR2) mouseBoost = (1 - Math.sqrt(d2) / MOUSE_RADIUS) * 0.5;

      let alpha = 0.08 + (fine > 0 ? fine * 0.1 : 0) + band * 0.55 + mouseBoost * 0.2;
      if (alpha > ALPHA_MAX) alpha = ALPHA_MAX;

      let step = ((alpha / ALPHA_MAX) * ALPHA_STEPS) | 0;
      if (step >= ALPHA_STEPS) step = ALPHA_STEPS - 1;

      let radius = dotBaseSize[i] + fine * 0.3 + band * 1.1 + mouseBoost * 0.5;
      if (radius < 0.15) radius = 0.15;

      /*
      rect, not arc. These dots run from 0.15px to about 2px across, a size where a square and a circle are
      indistinguishable - but arc() has to tessellate a curve into line segments for every single one, while
      rect() is four points.
      */
      const d = radius * 2;
      buckets[step].rect(dotX[i] - radius, dotY[i] - radius, d, d);
    }

    ctx.fillStyle = gradient;
    for (let s = 0; s < ALPHA_STEPS; s++) {
      ctx.globalAlpha = ((s + 0.5) / ALPHA_STEPS) * ALPHA_MAX;
      ctx.fill(buckets[s]);
    }
    ctx.globalAlpha = 1;
  }

  /*
  Starting the animation only once the browser reports idle time (or the page has fully loaded, as a
  fallback for browsers without requestIdleCallback) keeps it out of the way of everything competing
  for the main thread during initial page load — which is exactly the window Lighthouse's Total
  Blocking Time metric measures. The animation itself is unchanged once it starts; this only delays
  when the first frame fires.
  */
  function start() {
    requestAnimationFrame(draw);
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 2000 });
  } else {
    window.addEventListener('load', start);
  }
}

/*
Made a contact form with a character counter and mailto submit. Will swap this for a Formspree/EmailJS fetch call
once I have an endpoint, so tthe form submits in-page instead of opening email.
*/
export function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  const cfMessage = document.getElementById('cf-message');
  const cfCount = document.getElementById('cf-count');
  const cfNote = document.getElementById('cf-note');

  if (cfMessage && cfCount) {
    cfMessage.addEventListener('input', () => {
      cfCount.textContent = cfMessage.value.length;
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const message = cfMessage.value.trim();

      if (!name || !email || !message) {
        cfNote.textContent = 'Please fill in every field.';
        return;
      }

      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:ari.han.inbox@gmail.com?subject=${subject}&body=${body}`;

      cfNote.textContent = 'Opening your email client...';
    });
  }
}
