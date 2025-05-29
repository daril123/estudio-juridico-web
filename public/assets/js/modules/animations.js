/**
 * MÓDULO DE ANIMACIONES Y EFECTOS VISUALES
 * Maneja todas las animaciones, efectos de scroll y transiciones
 */

import { CONFIG } from '../core/config.js';
import { Utils } from '../core/utils.js';

export class AnimationsManager {
    constructor() {
        this.observers = new Map();
        this.counters = new Map();
        this.activeAnimations = new Set();
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupTypeWriter();
        this.setupCardAnimations();
        this.setupParallax();
        this.setupCounters();
        this.setupLazyLoading();
        console.log('🎭 Animations Manager initialized');
    }

    // ========================
    // ANIMACIONES DE SCROLL
    // ========================
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerFadeIn(entry.target);
                    
                    // Trigger specific animations based on element type
                    if (entry.target.classList.contains('service-card')) {
                        this.animateServiceCard(entry.target);
                    } else if (entry.target.classList.contains('team-member')) {
                        this.animateTeamMember(entry.target);
                    } else if (entry.target.classList.contains('feature')) {
                        this.animateFeature(entry.target);
                    }
                }
            });
        }, observerOptions);

        // Observar elementos con animación
        document.querySelectorAll('.fade-in, .service-card, .team-member, .feature').forEach(el => {
            scrollObserver.observe(el);
        });

        this.observers.set('scroll', scrollObserver);
    }

    triggerFadeIn(element) {
        element.classList.add('visible');
        
        // Add stagger effect for grouped elements
        const siblings = element.parentElement.children;
        const index = Array.from(siblings).indexOf(element);
        
        if (index > 0) {
            element.style.animationDelay = `${index * 100}ms`;
        }
    }

    animateServiceCard(card) {
        card.style.transform = 'translateY(30px)';
        card.style.opacity = '0';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.transform = 'translateY(0)';
            card.style.opacity = '1';
        }, 100);
    }

    animateTeamMember(member) {
        member.style.transform = 'scale(0.8) rotateY(20deg)';
        member.style.opacity = '0';
        
        setTimeout(() => {
            member.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            member.style.transform = 'scale(1) rotateY(0deg)';
            member.style.opacity = '1';
        }, 150);
    }

    animateFeature(feature) {
        feature.style.transform = 'translateX(-30px)';
        feature.style.opacity = '0';
        
        setTimeout(() => {
            feature.style.transition = 'all 0.5s ease-out';
            feature.style.transform = 'translateX(0)';
            feature.style.opacity = '1';
        }, 200);
    }

    // ========================
    // ANIMACIÓN DE ESCRITURA
    // ========================
    setupTypeWriter() {
        const titleElement = document.querySelector('.hero-title');
        const highlightElements = document.querySelectorAll('.highlight');
        
        if (!titleElement) return;

        // Animar elementos highlight
        highlightElements.forEach((highlight, index) => {
            this.animateHighlight(highlight, index * 500);
        });

        // Typewriter effect si está habilitado
        if (CONFIG.animations?.typewriter) {
            this.typeWriterEffect(titleElement);
        }
    }

    animateHighlight(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // Animar el underline
            const underline = element.querySelector('::after');
            if (underline) {
                element.classList.add('animate-underline');
            }
        }, delay);
    }

    typeWriterEffect(element) {
        const text = element.textContent;
        const speed = CONFIG.animations?.typingSpeed || 50;
        
        element.textContent = '';
        element.style.borderRight = '2px solid var(--primary-color)';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                element.style.borderRight = 'none';
            }
        }, speed);
        
        this.activeAnimations.add(typeInterval);
    }

    // ========================
    // ANIMACIONES DE HOVER PARA CARDS
    // ========================
    setupCardAnimations() {
        this.setupServiceCardAnimations();
        this.setupTeamCardAnimations();
        this.setupFeatureAnimations();
    }

    setupServiceCardAnimations() {
        document.querySelectorAll('.service-card').forEach(card => {
            this.addHoverEffects(card, {
                scale: 1.03,
                translateY: -12,
                rotateX: 2,
                shadowIntensity: 1.5
            });
        });
    }

    setupTeamCardAnimations() {
        document.querySelectorAll('.team-member').forEach(member => {
            this.addHoverEffects(member, {
                scale: 1.02,
                translateY: -8,
                rotateY: 3,
                shadowIntensity: 1.3
            });

            // Animate member image on hover
            const image = member.querySelector('.member-image');
            if (image) {
                member.addEventListener('mouseenter', () => {
                    image.style.transform = 'scale(1.1) rotate(5deg)';
                });
                
                member.addEventListener('mouseleave', () => {
                    image.style.transform = 'scale(1) rotate(0deg)';
                });
            }
        });
    }

    setupFeatureAnimations() {
        document.querySelectorAll('.feature').forEach(feature => {
            this.addHoverEffects(feature, {
                translateX: 12,
                shadowIntensity: 1.2
            });

            // Animate icon
            const icon = feature.querySelector('i');
            if (icon) {
                feature.addEventListener('mouseenter', () => {
                    icon.style.transform = 'scale(1.2) rotate(10deg)';
                    icon.style.color = 'var(--accent-color)';
                });
                
                feature.addEventListener('mouseleave', () => {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                    icon.style.color = '';
                });
            }
        });
    }

    addHoverEffects(element, options = {}) {
        const defaultOptions = {
            scale: 1,
            translateX: 0,
            translateY: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            shadowIntensity: 1,
            duration: '0.3s',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        };

        const config = { ...defaultOptions, ...options };

        element.style.transition = `all ${config.duration} ${config.easing}`;

        element.addEventListener('mouseenter', () => {
            const transform = `
                scale(${config.scale})
                translateX(${config.translateX}px)
                translateY(${config.translateY}px)
                rotateX(${config.rotateX}deg)
                rotateY(${config.rotateY}deg)
                rotateZ(${config.rotateZ}deg)
            `.replace(/\s+/g, ' ').trim();

            element.style.transform = transform;
            
            if (config.shadowIntensity > 1) {
                element.style.boxShadow = `var(--shadow-xl)`;
                element.style.filter = `brightness(1.05)`;
            }
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'none';
            element.style.boxShadow = '';
            element.style.filter = '';
        });
    }

    // ========================
    // EFECTOS PARALLAX
    // ========================
    setupParallax() {
        if (CONFIG.performance?.reduceMotion) return;

        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) {
            // Fallback para elementos existentes
            this.setupLegacyParallax();
            return;
        }

        window.addEventListener('scroll', Utils.debounce(() => {
            this.updateParallaxElements(parallaxElements);
        }, 10));
    }

    setupLegacyParallax() {
        window.addEventListener('scroll', Utils.debounce(() => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero::before');
            
            parallaxElements.forEach(el => {
                const speed = 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }, 10));
    }

    updateParallaxElements(elements) {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;

        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            const yPos = -(scrolled * speed);
            
            // Only animate elements in viewport or close to it
            if (rect.bottom >= 0 && rect.top <= windowHeight) {
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            }
        });
    }

    // ========================
    // CONTADORES ANIMADOS
    // ========================
    setupCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.counters.has(entry.target)) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });

        this.observers.set('counter', counterObserver);
    }

    animateCounter(element) {
        const originalText = element.textContent;
        const target = parseInt(originalText.replace(/\D/g, ''));
        
        if (isNaN(target)) return;

        const suffix = originalText.replace(/\d/g, '');
        const duration = CONFIG.animations?.counterDuration || 2000;
        const stepTime = 16; // ~60fps
        const steps = duration / stepTime;
        const increment = target / steps;
        
        let current = 0;
        this.counters.set(element, true);

        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
                this.activeAnimations.delete(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, stepTime);

        this.activeAnimations.add(timer);
    }

    // ========================
    // LAZY LOADING MEJORADO
    // ========================
    setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback para navegadores antiguos
            this.loadAllImages();
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        this.observers.set('image', imageObserver);
    }

    loadImage(img) {
        // Add loading animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';

        img.onload = () => {
            img.style.opacity = '1';
            img.classList.remove('lazy');
        };

        img.onerror = () => {
            img.style.opacity = '1';
            img.classList.add('error');
        };

        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    }

    loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }

    // ========================
    // ANIMACIONES ESPECIALES
    // ========================
    
    // Animación de reveal con mask
    revealText(element, direction = 'left') {
        element.style.overflow = 'hidden';
        element.style.position = 'relative';
        
        const mask = document.createElement('div');
        mask.style.cssText = `
            position: absolute;
            top: 0;
            ${direction}: 0;
            width: 100%;
            height: 100%;
            background: var(--primary-color);
            transform: translateX(${direction === 'left' ? '0%' : '100%'});
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        element.appendChild(mask);
        
        setTimeout(() => {
            mask.style.transform = `translateX(${direction === 'left' ? '100%' : '0%'})`;
        }, 100);
        
        setTimeout(() => {
            mask.remove();
        }, 900);
    }

    // Animación de morphing
    morphElement(element, newContent, duration = 500) {
        element.style.transition = `all ${duration}ms ease`;
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0.5';
        
        setTimeout(() => {
            element.innerHTML = newContent;
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
        }, duration / 2);
    }

    // Efecto de ondas (ripple)
    createRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    // ========================
    // UTILIDADES DE CONTROL
    // ========================
    
    pauseAllAnimations() {
        this.activeAnimations.forEach(animation => {
            if (typeof animation === 'number') {
                clearInterval(animation);
            }
        });
        this.activeAnimations.clear();
        
        // Pausar animaciones CSS
        document.body.style.animationPlayState = 'paused';
    }

    resumeAllAnimations() {
        document.body.style.animationPlayState = 'running';
    }

    reduceMotion() {
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Cleanup al destruir
    destroy() {
        this.pauseAllAnimations();
        
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.counters.clear();
        
        console.log('🎭 Animations Manager destroyed');
    }
}

// CSS adicional para animaciones
const animationStyles = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .animate-underline::after {
        animation: highlightGrow 2s ease-out 0.8s forwards;
    }
    
    @keyframes highlightGrow {
        to { transform: scaleX(1); }
    }
    
    .fade-in {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;

// Inyectar estilos si no existen
if (!document.querySelector('#animation-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'animation-styles';
    styleSheet.textContent = animationStyles;
    document.head.appendChild(styleSheet);
}

export default AnimationsManager;