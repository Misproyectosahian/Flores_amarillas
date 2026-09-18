import { gsap } from 'gsap';

// ─── Campo de flores: clona la plantilla y anima cada una ──────────

const FIELD = document.getElementById('flower-field');
const TEMPLATE = document.getElementById('flower-template');

// Alturas/posiciones variadas para que el campo se vea natural, no
// como una fila robótica de flores idénticas.
const FLOWERS = [
  { left: '6%', scale: 0.72, delay: 0 },
  { left: '18%', scale: 0.95, delay: 0.18 },
  { left: '31%', scale: 0.6, delay: 0.36 },
  { left: '45%', scale: 1.05, delay: 0.5 },
  { left: '58%', scale: 0.68, delay: 0.68 },
  { left: '71%', scale: 0.92, delay: 0.82 },
  { left: '84%', scale: 0.78, delay: 1.0 },
  { left: '94%', scale: 0.55, delay: 1.14 }
];

function buildFlower({ left, scale }) {
  const node = TEMPLATE.content.cloneNode(true);
  const svg = node.querySelector('.flower');
  svg.style.left = left;
  svg.style.setProperty('--scale', scale);
  FIELD.appendChild(node);
  return FIELD.lastElementChild;
}

function growFlower(svg, delay, reduceMotion) {
  const stem = svg.querySelector('.stem');
  const leafLeft = svg.querySelector('.leaf-left');
  const leafRight = svg.querySelector('.leaf-right');
  const petals = svg.querySelectorAll('.petal');
  const center = svg.querySelector('.center');
  const centerDot = svg.querySelector('.center-dot');
  const head = svg.querySelector('.flower-head');

  const stemLength = stem.getTotalLength();
  gsap.set(stem, { strokeDasharray: stemLength, strokeDashoffset: stemLength });
  gsap.set(leafLeft, { transformOrigin: '100% 100%', scale: 0, rotate: -35, opacity: 0 });
  gsap.set(leafRight, { transformOrigin: '0% 100%', scale: 0, rotate: 35, opacity: 0 });
  gsap.set([center, centerDot], { transformOrigin: '50% 50%', scale: 0, opacity: 0 });
  gsap.set(petals, { transformOrigin: '50% 50%', scale: 0, opacity: 0 });
  gsap.set(head, { transformOrigin: '50% 100%' });
  gsap.set(svg, { transformOrigin: '50% 100%' });

  // Un ciclo de vida corto (~0.9s) si el sistema pide "reducir
  // movimiento" — igual se ve crecer, pero sin quedar rebotando para
  // siempre. Si no, el crecimiento normal, más lento y con rebote.
  const growDuration = reduceMotion ? 0.35 : 1.1;
  const easeIn = reduceMotion ? 'power1.out' : 'power2.out';
  const easePop = reduceMotion ? 'power1.out' : 'back.out(1.8)';

  const tl = gsap.timeline({ delay: reduceMotion ? delay * 0.3 : delay });

  tl.to(stem, { strokeDashoffset: 0, duration: growDuration, ease: easeIn })
    .to(
      leafLeft,
      { scale: 1, rotate: 0, opacity: 1, duration: growDuration * 0.45, ease: easePop },
      `-=${growDuration * 0.5}`
    )
    .to(leafRight, { scale: 1, rotate: 0, opacity: 1, duration: growDuration * 0.45, ease: easePop }, '<0.08')
    .to([center, centerDot], { scale: 1, opacity: 1, duration: growDuration * 0.35, ease: easePop }, '-=0.15')
    .to(
      petals,
      { scale: 1, opacity: 1, duration: growDuration * 0.5, ease: easePop, stagger: growDuration * 0.04 },
      '-=0.2'
    )
    .call(() => {
      if (reduceMotion) return; // sin loop infinito para quien pidió menos movimiento

      // Balanceo continuo: toda la planta se mece (no solo la
      // cabeza), como si le pegara una brisa — bien visible, no un
      // temblor de un par de grados que pasa desapercibido.
      gsap.to(svg, {
        rotate: 5,
        duration: 3.2 + Math.random() * 0.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
      gsap.to(head, {
        rotate: -4,
        duration: 2.4 + Math.random() * 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.15
      });
      gsap.to([leafLeft, leafRight], {
        rotate: '+=6',
        duration: 1.8 + Math.random() * 0.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.3
      });
    });

  return tl;
}

function plantField() {
  if (!FIELD || !TEMPLATE) return;
  // Ya no salteamos la animación entera con "reducir movimiento": la
  // planta igual crece (más rápido, sin rebote), solo que sin el
  // balanceo continuo en loop — así nunca se ve una flor "muerta",
  // completamente estática, ni en ese modo.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  FLOWERS.forEach((cfg) => {
    const svg = buildFlower(cfg);
    growFlower(svg, cfg.delay, reduceMotion);
  });
}

plantField();

// ─── Reveal al hacer scroll (tarjetas de recuerdos + galería) ──────

const revealTargets = document.querySelectorAll('.memory-card, .gallery-item, .message-card');
revealTargets.forEach((el) => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

revealTargets.forEach((el) => observer.observe(el));

// ─── Lightbox de la galería ─────────────────────────────────────────

const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('.lightbox-img');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const galleryButtons = Array.from(document.querySelectorAll('.gallery-item'));

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    lightbox.hidden = true;
    lightboxImg.src = '';
  }, 200);
}

galleryButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const img = btn.querySelector('img');
    openLightbox(btn.dataset.full, img.alt);
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});
