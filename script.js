/* ── ScannDine – script.js ── */

/* 1. NAVBAR scroll detection */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* 2. HAMBURGER menu */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

/* Close mobile menu on link click */
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* 3. REVEAL on scroll (IntersectionObserver) */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => observer.observe(el));

/* Trigger immediately visible elements */
revealEls.forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight) {
    el.classList.add('in-view');
  }
});

/* 4. SMOOTH active nav link highlighting */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--cream)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));

/* 5. CONTACT FORM interaction */
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    const body = {
      name:     document.getElementById('fname').value.trim(),
      email:    document.getElementById('femail').value.trim(),
      business: document.getElementById('fbusiness').value.trim(),
      message:  document.getElementById('fmessage').value.trim(),
    };

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        submitBtn.textContent = '✓ Message Sent!';
        submitBtn.style.background = 'var(--rust)';
        form.reset();
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3500);
      } else {
        submitBtn.textContent = data.error || 'Something went wrong.';
        submitBtn.style.background = '#c0392b';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3500);
      }
    } catch {
      submitBtn.textContent = 'Network error. Try again.';
      submitBtn.style.background = '#c0392b';
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 3500);
    }
  });
}

/* 6. Parallax subtle effect on hero */
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
  if (!hero) return;
  const scrollY = window.scrollY;
  hero.style.backgroundPositionY = `${scrollY * 0.12}px`;
}, { passive: true });
