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