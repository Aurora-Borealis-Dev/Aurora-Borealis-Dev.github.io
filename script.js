/* ============================================
   Aurora Borealis Dev - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // Mobile Menu Toggle
  // ============================================
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      this.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking a link
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
  
  // ============================================
  // Calendly: load only when the booking section is near the viewport.
  // Loading it on page load made the iframe grab focus and scroll
  // phones down to it on every refresh.
  // ============================================
  const calendlyWidget = document.querySelector('.calendly-inline-widget');
  
  if (calendlyWidget) {
    // widget.js calls scrollIntoView() on its container whenever the iframe reports
    // a new height and the container is above the viewport, which yanks the page
    // down to the booking section. Make that a no-op on this element.
    calendlyWidget.scrollIntoView = () => {};
    
    // Calendly never removes its own spinner, so flag the container once the iframe has
    // loaded and let CSS hide the spinner.
    new MutationObserver((mutations, observer) => {
      const iframe = calendlyWidget.querySelector('iframe');
      if (!iframe) return;
      observer.disconnect();
      iframe.addEventListener('load', () => calendlyWidget.setAttribute('data-loaded', ''));
    }).observe(calendlyWidget, { childList: true });
    
    const loadCalendly = () => {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    };
    
    new IntersectionObserver((entries, observer) => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadCalendly();
      }
    }, { rootMargin: '300px 0px' }).observe(calendlyWidget);
  }
  
  // ============================================
  // Years in business (founded 2021)
  // ============================================
  const FOUNDED_YEAR = 2021;
  const yearsInBusiness = new Date().getFullYear() - FOUNDED_YEAR;
  const numberWords = {
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
    bs: ['nula', 'jedna', 'dvije', 'tri', 'četiri', 'pet', 'šest', 'sedam', 'osam', 'devet', 'deset',
      'jedanaest', 'dvanaest', 'trinaest', 'četrnaest', 'petnaest', 'šesnaest', 'sedamnaest', 'osamnaest', 'devetnaest', 'dvadeset']
  };
  const words = numberWords[document.documentElement.lang] || numberWords.en;
  
  document.querySelectorAll('[data-years]').forEach(el => {
    const asWord = el.dataset.years === 'word' && words[yearsInBusiness];
    el.textContent = asWord || yearsInBusiness;
  });
  
  // ============================================
  // Hero aurora: glow follows the pointer
  // ============================================
  const hero = document.querySelector('.hero');
  const auroraBg = document.querySelector('.aurora-bg');
  
  if (hero && auroraBg) {
    hero.addEventListener('pointermove', function(e) {
      const rect = hero.getBoundingClientRect();
      auroraBg.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      auroraBg.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  }
  
  // Shared by the two hero canvases below
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssColor = name => {
    const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().slice(1);
    return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  };
  // Runs draw(seconds) every frame, but only while the hero is on screen
  const animateWhileVisible = (el, draw) => {
    let visible = false, raf = 0;
    const frame = ms => { draw(ms / 1000); raf = visible ? requestAnimationFrame(frame) : 0; };
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(el);
  };
  // The hero canvases start once the page has loaded and the main thread is
  // idle, so setting them up never competes with first render or input
  const afterLoadIdle = fn => {
    const idle = () => window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200);
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  };
  const onThemeChange = fn => new MutationObserver(fn)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ============================================
  // Hero aurora: WebGL curtains. Each curtain is a wavy lower edge with light
  // decaying upwards from it, cut into fine vertical rays, green at the base
  // and violet/pink at the top like the real thing. Without WebGL the CSS
  // gradient aurora stays; with reduced motion a single still frame is drawn.
  // ============================================
  const auroraFragment = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform vec2 u_res;
    uniform float u_time, u_light;
    uniform vec3 u_green, u_cyan, u_violet, u_pink;

    float hash(float n) { return fract(sin(n) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n = i.x + i.y * 57.0;
      return mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
    }

    // rgb = colour weighted by brightness, a = brightness
    vec4 curtain(vec2 uv, float seed, float base, float scale) {
      float t = u_time;
      // Folds: the sheet slides sideways by a different amount at each height
      // (and rays lean outwards a little with height, as they do overhead)
      float lean = (uv.x - 0.5 * u_res.x / u_res.y) * (uv.y - 0.4) * 0.12;
      float x = (uv.x + lean) * scale + 0.16 * noise(vec2(uv.x * 1.3 + seed, t * 0.06))
              + 0.05 * sin(uv.y * 3.0 + t * 0.1 + seed);
      float edge = base + 0.22 * (noise(vec2(x * 1.1 + seed * 7.3, t * 0.05)) - 0.5)
                 + 0.025 * sin(x * 5.0 + t * 0.15 + seed);
      float h = (uv.y - edge) * scale;
      float reach = mix(1.5, 4.5, noise(vec2(x * 2.5 + seed * 3.1, t * 0.07)));
      // Bright rim along the lower edge, long soft rays above it
      float body = smoothstep(-0.015, 0.02, h) * (exp(-max(h, 0.0) * reach) + 0.6 * exp(-max(h, 0.0) * 22.0));
      float rays = 0.4 * noise(vec2(x * 70.0 + seed * 11.0, t * 0.3))
                 + 0.35 * noise(vec2(x * 24.0 + seed * 5.0, t * 0.2))
                 + 0.25 * noise(vec2(x * 7.0 + seed * 3.0, t * 0.12));
      rays = smoothstep(0.15, 0.85, rays);
      // Whole stretches of the curtain fade out and flare back
      float lit = smoothstep(0.2, 0.65, noise(vec2(x * 0.9 + seed * 2.7, t * 0.04)));
      float i = body * (0.25 + 0.75 * rays) * lit;
      vec3 col = mix(u_green, u_cyan, smoothstep(0.02, 0.18, h));
      col = mix(col, u_violet, smoothstep(0.12, 0.4, h));
      col = mix(col, u_pink, smoothstep(0.35, 0.75, h));
      return vec4(col * i, i);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.y;
      vec4 c = curtain(uv, 1.0, 0.62, 1.0) * 1.0
             + curtain(uv, 4.0, 0.47, 1.25) * 0.55
             + curtain(uv, 9.0, 0.76, 1.7) * 0.8;
      // Soft shoulder instead of clipping where curtains overlap
      c = 1.0 - exp(-c);
      // Fade into the page background at the bottom of the hero
      c *= smoothstep(0.0, 0.3, uv.y);
      if (u_light > 0.5) {
        // On a light page the aurora is a tinted wash, not added light
        float a = clamp(c.a * 0.55, 0.0, 0.6);
        gl_FragColor = vec4(c.rgb / max(c.a, 0.001) * a, a);
      } else {
        gl_FragColor = vec4(c.rgb, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
      }
    }`;

  // Hide the CSS aurora straight away when WebGL is likely to work, so the
  // sky doesn't visibly swap from one aurora to the other after load
  if (hero && auroraBg && window.WebGLRenderingContext) auroraBg.classList.add('aurora-live');

  if (hero && auroraBg) afterLoadIdle(() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'aurora-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { antialias: false });
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl && gl.createProgram();

    if (program) {
      gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, auroraFragment));
      gl.linkProgram(program);
    }

    if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const uniform = name => gl.getUniformLocation(program, name);

      const applyColors = () => {
        ['green', 'cyan', 'violet', 'pink'].forEach(c => gl.uniform3fv(uniform('u_' + c), cssColor('--aurora-' + c)));
        gl.uniform1f(uniform('u_light'), document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0);
      };
      // The aurora is soft, so half resolution (a third on phones) is plenty and keeps it cheap
      const resize = () => {
        const shrink = hero.clientWidth < 768 ? 3 : 2;
        canvas.width = Math.max(1, Math.round(hero.clientWidth / shrink));
        canvas.height = Math.max(1, Math.round(hero.clientHeight / shrink));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniform('u_res'), canvas.width, canvas.height);
      };
      // Random start so every visit opens on a different sky
      const offset = Math.random() * 500;
      const draw = seconds => {
        gl.uniform1f(uniform('u_time'), offset + seconds);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      // The curtains move slowly, so 30 frames a second looks the same at half the work
      let lastDrawn = -1;
      const drawAt30 = seconds => {
        if (seconds - lastDrawn < 0.03) return;
        lastDrawn = seconds;
        draw(seconds);
      };

      applyColors();
      resize();
      auroraBg.appendChild(canvas);

      if (reducedMotion) {
        draw(0);
        new ResizeObserver(() => { resize(); draw(0); }).observe(hero);
        onThemeChange(() => { applyColors(); draw(0); });
      } else {
        new ResizeObserver(resize).observe(hero);
        onThemeChange(applyColors);
        animateWhileVisible(hero, drawAt30);
      }
    } else {
      // No WebGL after all: bring the CSS aurora back
      auroraBg.classList.remove('aurora-live');
    }
  });

  // ============================================
  // Hero title particles: the headline is redrawn as a few thousand dots that
  // drift in from the sky, settle into the letters and scatter away from the
  // pointer. The real <h1> text stays in the DOM (crawlers, screen readers,
  // find-in-page) and is only faded out once the dots are ready to replace it.
  // ============================================
  const titleText = document.querySelector('.hero-title .gradient-text');

  if (hero && titleText && !reducedMotion && document.fonts) {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    const BUCKETS = 12;        // colour steps along the title gradient
    const STARS = 70;          // free dots drifting up through the sky
    const pointer = { x: -9999, y: -9999 };
    let dots = [], stars = [], colors = [], starColor = '', dotSize = 2, width = 0, height = 0, born = 0;

    const applyColors = () => {
      const from = cssColor('--aurora-cyan'), to = cssColor('--aurora-green');
      colors = Array.from({ length: BUCKETS }, (_, b) => {
        const k = b / (BUCKETS - 1);
        return `rgb(${from.map((v, i) => Math.round((v + (to[i] - v) * k) * 255)).join(',')})`;
      });
      starColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
    };

    // Find where the letters are: draw each word at its on-page position
    // (so wrapped titles work) and keep a dot for every filled sample point
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const heroRect = hero.getBoundingClientRect();
      width = heroRect.width;
      height = heroRect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const box = titleText.getBoundingClientRect();
      const style = getComputedStyle(titleText);
      const fontSize = parseFloat(style.fontSize);
      const SCALE = 2;
      const sample = document.createElement('canvas');
      sample.width = Math.ceil(box.width * SCALE);
      sample.height = Math.ceil(box.height * SCALE);
      const sctx = sample.getContext('2d', { willReadFrequently: true });
      sctx.scale(SCALE, SCALE);
      sctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = sctx.measureText('M');
      const ascent = metrics.fontBoundingBoxAscent, descent = metrics.fontBoundingBoxDescent;
      const node = titleText.firstChild;
      const range = document.createRange();
      for (const word of node.data.matchAll(/\S+/g)) {
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        const r = range.getBoundingClientRect();
        sctx.fillText(word[0], r.left - box.left, r.top - box.top + (r.height - ascent - descent) / 2 + ascent);
      }

      // Spacing scales with the font so every screen size gets a similar dot count
      // (phones get a coarser grid: fewer dots to move every frame)
      const step = Math.max(1.2, fontSize / (width < 768 ? 26 : 36));
      dotSize = step * 0.9;
      const pixels = sctx.getImageData(0, 0, sample.width, sample.height).data;
      const originX = box.left - heroRect.left, originY = box.top - heroRect.top;
      const next = [];
      for (let y = step / 2; y < box.height; y += step) {
        for (let x = step / 2; x < box.width; x += step) {
          if (pixels[(Math.floor(y * SCALE) * sample.width + Math.floor(x * SCALE)) * 4 + 3] < 128) continue;
          const old = dots[next.length];
          const k = (x / box.width + y / box.height) / 2;
          next.push({
            tx: originX + x, ty: originY + y,
            // New dots start scattered through the upper sky, where the aurora is
            x: old ? old.x : Math.random() * width,
            y: old ? old.y : Math.random() * height * 0.6,
            vx: 0, vy: 0,
            delay: old ? 0 : Math.random() * 0.9 + (x / box.width) * 0.5,
            phase: Math.random() * 6.28,
            bucket: Math.min(BUCKETS - 1, Math.floor(k * BUCKETS))
          });
        }
      }
      // Sorted by colour so the canvas fill style changes 12 times a frame, not thousands
      dots = next.sort((a, b) => a.bucket - b.bucket);
      stars = Array.from({ length: STARS }, (_, i) => stars[i] || {
        x: Math.random() * width, y: Math.random() * height,
        vx: 0, vy: 0, speed: 3 + Math.random() * 9, size: 0.6 + Math.random() * 1.2, phase: Math.random() * 6.28
      });
    };

    const push = (p, radius, force) => {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > radius * radius || d2 === 0) return;
      const d = Math.sqrt(d2), f = (1 - d / radius) * force;
      p.vx += dx / d * f;
      p.vy += dy / d * f;
    };

    let last = 0;
    const draw = seconds => {
      const dt = Math.min(seconds - last, 0.05) * 60;   // in 60fps frames; capped after a pause
      last = seconds;
      if (!born) born = seconds;
      const age = seconds - born;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = starColor;
      for (const s of stars) {
        push(s, 110, 0.5);
        s.vx *= 0.94; s.vy *= 0.94;
        s.x += (s.vx + Math.sin(seconds * 0.4 + s.phase) * 0.12) * dt;
        s.y += (s.vy - s.speed / 60) * dt;
        if (s.y < -4) { s.y = height + 4; s.x = Math.random() * width; }
        ctx.globalAlpha = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(seconds * 1.3 + s.phase));
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      let bucket = -1;
      const damping = Math.pow(0.84, dt);
      for (const p of dots) {
        if (p.bucket !== bucket) { bucket = p.bucket; ctx.fillStyle = colors[bucket]; }
        const settling = age > p.delay;
        if (settling) {
          // Spring towards the letter, with a slow shimmer around the exact spot
          p.vx += (p.tx + Math.sin(seconds * 1.1 + p.phase) * 0.35 - p.x) * 0.045 * dt;
          p.vy += (p.ty + Math.cos(seconds * 0.9 + p.phase) * 0.35 - p.y) * 0.045 * dt;
        } else {
          p.vy += 0.004 * dt;
        }
        push(p, 85, 2.4);
        p.vx *= damping; p.vy *= damping;
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = settling ? 0.82 + 0.18 * Math.sin(seconds * 2 + p.phase) : Math.min(0.6, age * 1.5);
        ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
      }
      ctx.globalAlpha = 1;
    };

    // Wait for the webfont, otherwise the dots would trace the fallback font
    afterLoadIdle(() => document.fonts.ready.then(() => {
      applyColors();
      build();
      if (!dots.length) return;
      hero.appendChild(canvas);
      hero.classList.add('hero-particles-on');
      onThemeChange(applyColors);
      let resizeTimer;
      new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
      }).observe(hero);
      hero.addEventListener('pointermove', e => {
        const rect = hero.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      });
      const clearPointer = () => { pointer.x = pointer.y = -9999; };
      hero.addEventListener('pointerleave', clearPointer);
      hero.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') clearPointer(); });
      animateWhileVisible(hero, draw);
    }));
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 80; // Account for fixed header
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // ============================================
  // Navbar Background on Scroll
  // ============================================
  const navHeader = document.querySelector('.nav-header');
  
  function updateNavbar() {
    navHeader.style.background = window.scrollY > 50 ? 'var(--nav-bg-scrolled)' : '';
  }
  
  window.addEventListener('scroll', updateNavbar);
  updateNavbar();
  
  // ============================================
  // Theme Toggle (persisted in a cookie)
  // ============================================
  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
  }
  
  applyTheme(root.getAttribute('data-theme') || 'dark');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      document.cookie = `theme=${next}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    });
  }
  
  // ============================================
  // Language Toggle (each language is its own page; the choice is
  // remembered in a cookie so the head script can redirect next visit)
  // ============================================
  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', function() {
      document.cookie = `lang=${this.dataset.lang}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    });
  });
  
  // ============================================
  // Scroll Animations (Fade In)
  // ============================================
  const fadeElements = document.querySelectorAll('.service-card, .project-card, .about-content, .about-image, .contact-info, .contact-form-wrapper');
  
  // Add fade-in class to elements
  fadeElements.forEach(el => {
    el.classList.add('fade-in');
  });
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  fadeElements.forEach(el => {
    fadeObserver.observe(el);
  });
  
  
  
  // ============================================
  // Notification System
  // ============================================
  function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close" aria-label="Close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#065f46' : '#7f1d1d'};
      border: 1px solid ${type === 'success' ? '#10b981' : '#ef4444'};
      border-radius: 0.75rem;
      color: white;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
  
  // Add notification animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }
    .notification-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
    }
    .notification-close:hover {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
  
  // ============================================
  // Pause Ticker Animation on Hover
  // ============================================
  const tickerTrack = document.querySelector('.ticker-track');
  
  if (tickerTrack) {
    tickerTrack.addEventListener('mouseenter', () => {
      tickerTrack.style.animationPlayState = 'paused';
    });
    
    tickerTrack.addEventListener('mouseleave', () => {
      tickerTrack.style.animationPlayState = 'running';
    });
  }
  
  // ============================================
  // Active Nav Link Highlighting
  // ============================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  function highlightNavLink() {
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.color = 'var(--aurora-cyan)';
          }
        });
      }
    });
  }
  
  window.addEventListener('scroll', highlightNavLink);
  
  // ============================================
  // Service Card Hover Effects
  // ============================================
  const serviceCards = document.querySelectorAll('.service-card');
  
  serviceCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      const icon = this.querySelector('.service-icon');
      if (icon) {
        icon.style.transform = 'scale(1.1)';
        icon.style.transition = 'transform 0.3s ease';
      }
    });
    
    card.addEventListener('mouseleave', function() {
      const icon = this.querySelector('.service-icon');
      if (icon) {
        icon.style.transform = 'scale(1)';
      }
    });
  });
  
});

const track = document.querySelector('.ticker-track');
const ticker = document.querySelector('.client-ticker');

// 1. Dupliraj sadržaj samo jednom
track.innerHTML += track.innerHTML;

// 2. Izračunaj koliko nam vremena treba (dužina / brzina)
// Što je veći broj 'speedFactor', to sporije ide
const speedFactor = 80;
const duration = track.scrollWidth / speedFactor;

// 3. Dodaj animaciju direktno kroz stil
track.style.animation = `scrollInfinite ${duration}s linear infinite`;

// Pauza na hover
ticker.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
ticker.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');