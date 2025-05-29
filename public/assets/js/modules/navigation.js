/**
 * MÓDULO DE NAVEGACIÓN - ESTUDIO JURÍDICO
 * Maneja header, menú móvil, scroll effects y navegación
 */

import { CONFIG, ConfigManager } from '../core/config.js';
import Utils from '../core/utils.js';

export class NavigationManager {
    constructor() {
        this.elements = {};
        this.state = {
            isMenuOpen: false,
            isScrolled: false,
            activeSection: '',
            lastScrollY: 0
        };
        
        this.bindMethods();
        this.init();
    }

    bindMethods() {
        this.handleScroll = Utils.Performance.throttle(this.handleScroll.bind(this), 16);
        this.handleResize = Utils.Performance.debounce(this.handleResize.bind(this), 250);
        this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
        this.closeMobileMenu = this.closeMobileMenu.bind(this);
        this.handleNavLinkClick = this.handleNavLinkClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    init() {
        this.cacheElements();
        
        if (!this.elements.header) {
            Utils.Log.warn('Header element not found');
            return;
        }

        this.setupEventListeners();
        this.updateActiveSection();
        
        Utils.Log.info('NavigationManager initialized');
    }

    cacheElements() {
        this.elements = {
            header: Utils.DOM.select('.header'),
            navbar: Utils.DOM.select('.navbar'),
            navContainer: Utils.DOM.select('.nav-container'),
            navMenu: Utils.DOM.select('.nav-menu'),
            navToggle: Utils.DOM.select('.nav-toggle'),
            navLinks: Utils.DOM.selectAll('.nav-link[href^="#"]'),
            navLogo: Utils.DOM.select('.nav-logo'),
            sections: Utils.DOM.selectAll('section[id]'),
            body: document.body
        };
    }

    setupEventListeners() {
        // Scroll events
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        window.addEventListener('resize', this.handleResize);
        
        // Mobile menu toggle
        if (this.elements.navToggle) {
            this.elements.navToggle.addEventListener('click', this.toggleMobileMenu);
        }

        // Navigation links
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavLinkClick);
        });

        // Logo click
        if (this.elements.navLogo) {
            this.elements.navLogo.addEventListener('click', this.handleLogoClick.bind(this));
        }

        // Close menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown);

        // Intersection Observer para sections
        this.setupSectionObserver();
    }

    handleScroll() {
        const currentScrollY = window.pageYOffset;
        const scrollThreshold = CONFIG.scroll.threshold;

        // Header scroll effect
        this.updateHeaderScrollState(currentScrollY > scrollThreshold);

        // Update active section
        this.updateActiveSection();

        // Auto-hide header en móvil (opcional)
        this.handleHeaderAutoHide(currentScrollY);

        this.state.lastScrollY = currentScrollY;
    }

    updateHeaderScrollState(isScrolled) {
        if (this.state.isScrolled !== isScrolled) {
            this.state.isScrolled = isScrolled;
            Utils.DOM.toggleClass(this.elements.header, 'scrolled', isScrolled);
        }
    }

    handleHeaderAutoHide(currentScrollY) {
        if (!(ConfigManager && typeof ConfigManager.isMobile === 'function' && ConfigManager.isMobile())) return;

        const deltaY = currentScrollY - this.state.lastScrollY;
        const isScrollingDown = deltaY > 0;
        const isScrollingUp = deltaY < 0;
        const minScrollDistance = 60;

        if (Math.abs(deltaY) < minScrollDistance) return;

        if (isScrollingDown && currentScrollY > 200) {
            this.elements.header.style.transform = 'translateY(-100%)';
        } else if (isScrollingUp) {
            this.elements.header.style.transform = 'translateY(0)';
        }
    }

    updateActiveSection() {
        if (!this.elements.sections.length) return;

        const scrollPosition = window.pageYOffset + CONFIG.scroll.offset + 50;
        let activeSection = '';

        // Buscar la sección activa
        for (const section of this.elements.sections) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                activeSection = section.getAttribute('id');
                break;
            }
        }

        // Si no encontramos ninguna sección, usar la primera visible
        if (!activeSection && this.elements.sections.length > 0) {
            activeSection = this.elements.sections[0].getAttribute('id');
        }

        // Actualizar estado si cambió
        if (this.state.activeSection !== activeSection) {
            this.state.activeSection = activeSection;
            this.updateActiveNavLink(activeSection);
        }
    }

    updateActiveNavLink(activeSection) {
        this.elements.navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${activeSection}`;
            Utils.DOM.toggleClass(link, 'active', isActive);
        });
    }

    setupSectionObserver() {
        if (!window.IntersectionObserver || !this.elements.sections.length) return;

        const observerOptions = {
            threshold: 0.3,
            rootMargin: `-${CONFIG.scroll.offset}px 0px 0px 0px`
        };

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');
                    this.updateActiveNavLink(sectionId);
                    this.state.activeSection = sectionId;
                }
            });
        }, observerOptions);

        this.elements.sections.forEach(section => {
            this.sectionObserver.observe(section);
        });
    }

    handleResize() {
        // Cerrar menú móvil en resize a desktop
        if (ConfigManager && typeof ConfigManager.isMobile === 'function' && !ConfigManager.isMobile() && this.state.isMenuOpen) {
            this.closeMobileMenu();
        }

        // Reposicionar elementos si es necesario
        this.updateActiveSection();
    }

    toggleMobileMenu(event) {
        Utils.Event.preventDefault(event);
        Utils.Event.stopPropagation(event);

        if (this.state.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.state.isMenuOpen = true;
        
        // Actualizar clases
        Utils.DOM.toggleClass(this.elements.navToggle, 'active', true);
        Utils.DOM.toggleClass(this.elements.navMenu, 'active', true);
        Utils.DOM.toggleClass(this.elements.body, 'menu-open', true);

        // Enfocar primer link
        this.focusFirstNavLink();

        // Emitir evento
        this.emit('menuOpened');
        
        Utils.Log.debug('Mobile menu opened');
    }

    closeMobileMenu() {
        if (!this.state.isMenuOpen) return;

        this.state.isMenuOpen = false;
        
        // Actualizar clases
        Utils.DOM.toggleClass(this.elements.navToggle, 'active', false);
        Utils.DOM.toggleClass(this.elements.navMenu, 'active', false);
        Utils.DOM.toggleClass(this.elements.body, 'menu-open', false);

        // Emitir evento
        this.emit('menuClosed');
        
        Utils.Log.debug('Mobile menu closed');
    }

    focusFirstNavLink() {
        const firstLink = this.elements.navLinks[0];
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }
    }

    handleNavLinkClick(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');
        
        if (!href || !href.startsWith('#')) return;

        Utils.Event.preventDefault(event);
        
        const targetId = href.substring(1);
        const targetElement = Utils.DOM.select(`#${targetId}`);
        
        if (targetElement) {
            // Cerrar menú móvil
            this.closeMobileMenu();
            
            // Scroll suave
            Utils.DOM.smoothScrollTo(targetElement, CONFIG.scroll.offset);
            
            // Actualizar URL sin scroll
            this.updateUrl(href);
            
            // Emitir evento
            this.emit('navigationClicked', { targetId, targetElement });
            
            Utils.Log.debug(`Navigated to section: ${targetId}`);
        }
    }

    handleLogoClick(event) {
        Utils.Event.preventDefault(event);
        
        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: CONFIG.scroll.behavior
        });
        
        // Cerrar menú móvil
        this.closeMobileMenu();
        
        // Actualizar URL
        this.updateUrl('#inicio');
        
        this.emit('logoClicked');
    }

    updateUrl(hash) {
        if (history.pushState) {
            history.pushState(null, null, hash);
        } else {
            location.hash = hash;
        }
    }

    handleOutsideClick(event) {
        if (!this.state.isMenuOpen) return;

        const isClickInsideNav = this.elements.navContainer?.contains(event.target);
        
        // Si el click está relacionado con el chat, no cerrar el menú
        if (event.target.closest('.chat-widget')) return;

        if (!isClickInsideNav) {
            this.closeMobileMenu();
        }
    }

    handleKeydown(event) {
        // Cerrar menú con Escape
        if (event.key === 'Escape' && this.state.isMenuOpen) {
            this.closeMobileMenu();
            this.elements.navToggle?.focus();
        }

        // Navegación con teclado en menú móvil
        if (this.state.isMenuOpen && event.key === 'Tab') {
            this.handleTabNavigation(event);
        }

        // Indicar navegación por teclado
        if (event.key === 'Tab') {
            this.elements.body.classList.add('keyboard-navigation');
        }
    }

    handleTabNavigation(event) {
        const focusableElements = this.elements.navMenu.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            Utils.Event.preventDefault(event);
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            Utils.Event.preventDefault(event);
            firstElement.focus();
        }
    }

    // ===========================
    // API PÚBLICA
    // ===========================

    /**
     * Navegar a una sección específica
     */
    navigateToSection(sectionId) {
        const targetElement = Utils.DOM.select(`#${sectionId}`);
        if (targetElement) {
            Utils.DOM.smoothScrollTo(targetElement, CONFIG.scroll.offset);
            this.updateUrl(`#${sectionId}`);
            this.updateActiveNavLink(sectionId);
        }
    }

    /**
     * Obtener sección activa
     */
    getActiveSection() {
        return this.state.activeSection;
    }

    /**
     * Verificar si el menú móvil está abierto
     */
    isMobileMenuOpen() {
        return this.state.isMenuOpen;
    }

    /**
     * Forzar actualización del estado de scroll
     */
    updateScrollState() {
        this.handleScroll();
    }

    /**
     * Destruir el manager
     */
    destroy() {
        // Remover event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('keydown', this.handleKeydown);

        if (this.elements.navToggle) {
            this.elements.navToggle.removeEventListener('click', this.toggleMobileMenu);
        }

        this.elements.navLinks.forEach(link => {
            link.removeEventListener('click', this.handleNavLinkClick);
        });

        // Destruir observer
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }

        // Limpiar estado
        this.closeMobileMenu();
        
        Utils.Log.info('NavigationManager destroyed');
    }

    // ===========================
    // EVENT EMITTER
    // ===========================

    emit(event, data = null) {
        const customEvent = new CustomEvent(`navigation:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    on(event, callback) {
        document.addEventListener(`navigation:${event}`, (e) => {
            callback(e.detail);
        });
    }
}

// ===========================
// FACTORY FUNCTION
// ===========================

export function createNavigationManager() {
    return new NavigationManager();
}

// ===========================
// AUTO-INICIALIZACIÓN
// ===========================

let navigationManagerInstance = null;

export function initializeNavigation() {
    if (navigationManagerInstance) {
        Utils.Log.warn('NavigationManager already initialized');
        return navigationManagerInstance;
    }

    navigationManagerInstance = createNavigationManager();
    
    // Hacer disponible globalmente para debugging
    if (ConfigManager && typeof ConfigManager.getDevConfig === 'function' && ConfigManager.getDevConfig('debug.enabled')) {
        window.navigationManager = navigationManagerInstance;
    }

    return navigationManagerInstance;
}

export function getNavigationManager() {
    return navigationManagerInstance;
}

export default NavigationManager;