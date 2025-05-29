/**
 * APLICACIÓN PRINCIPAL - ESTUDIO JURÍDICO
 * Coordina todos los módulos y maneja la inicialización
 */

import { CONFIG, ConfigManager } from './config.js';
import Utils from './utils.js';
import { initializeNavigation } from '../modules/navigation.js';
import { initializeForms } from '../modules/forms.js';
import { initializeModals } from '../modules/modals.js';
import AnimationsManager from '../modules/animations.js';
import LegalChatCore from '../chat/chat-core.js';

export class LawFirmApp {
    constructor() {
        this.modules = new Map();
        this.state = {
            initialized: false,
            ready: false,
            loading: false,
            error: null
        };
        
        this.bindMethods();
    }

    bindMethods() {
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
        this.handleLoad = this.handleLoad.bind(this);
        this.handleUnload = this.handleUnload.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleResize = Utils.Performance.debounce(this.handleResize.bind(this), 250);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    // ===========================
    // INICIALIZACIÓN
    // ===========================

    async init() {
        if (this.state.initialized) {
            Utils.Log.warn('App already initialized');
            return;
        }

        try {
            Utils.Log.info('🏛️ Initializing LawFirm App...');
            
            this.state.loading = true;
            this.setupGlobalErrorHandling();
            this.setupEventListeners();
            
            // Inicializar según estado del DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
            } else {
                await this.handleDOMContentLoaded();
            }

        } catch (error) {
            this.handleError(error);
        }
    }

    async handleDOMContentLoaded() {
        try {
            Utils.Log.info('📄 DOM Content Loaded');
            
            // Inicializar módulos core
            await this.initializeCoreModules();
            
            // Inicializar características adicionales
            await this.initializeFeatures();
            
            // Configurar observadores
            this.setupObservers();
            
            // Marcar como inicializado
            this.state.initialized = true;
            this.state.loading = false;
            
            // Si el documento ya está completamente cargado
            if (document.readyState === 'complete') {
                await this.handleLoad();
            } else {
                window.addEventListener('load', this.handleLoad);
            }

        } catch (error) {
            this.handleError(error);
        }
    }

    async handleLoad() {
        try {
            Utils.Log.info('⚡ Window Load Complete');
            
            // Optimizaciones post-carga
            await this.performPostLoadOptimizations();
            
            // Inicializar características no críticas
            await this.initializeNonCriticalFeatures();
            
            // Marcar como listo
            this.state.ready = true;
            
            // Emitir evento de aplicación lista
            this.emit('ready');
            
            // Mostrar información de rendimiento
            this.logPerformanceMetrics();
            
            Utils.Log.info('🎉 LawFirm App Ready!');

        } catch (error) {
            this.handleError(error);
        }
    }

    // ===========================
    // INICIALIZACIÓN DE MÓDULOS
    // ===========================

    async initializeCoreModules() {
        const modules = [
            { 
                name: 'navigation', 
                init: async () => await initializeNavigation(), 
                critical: true 
            },
            { 
                name: 'forms', 
                init: async () => await initializeForms(), 
                critical: true 
            },
            { 
                name: 'modals', 
                init: async () => await initializeModals(), 
                critical: true 
            }
        ];

        for (const module of modules) {
            try {
                Utils.Log.debug(`Initializing ${module.name}...`);
                const instance = await module.init();
                this.modules.set(module.name, instance);
                Utils.Log.debug(`✅ ${module.name} initialized`);
            } catch (error) {
                Utils.Log.error(`❌ Error initializing ${module.name}:`, error);
                
                if (module.critical) {
                    throw new Error(`Critical module ${module.name} failed to initialize`);
                }
            }
        }
    }

    async initializeFeatures() {
        // Inicializar animaciones
        await this.initializeAnimations();
        
        // Inicializar lazy loading
        await this.initializeLazyLoading();
        
        // Inicializar contadores
        await this.initializeCounters();
        
        // Configurar accesibilidad
        this.setupAccessibility();
        
        // Inicializar chat
        await this.initializeChat();
    }

    async initializeNonCriticalFeatures() {
        // Analytics
        if (CONFIG.analytics.enabled) {
            await this.initializeAnalytics();
        }
        
        // Service Worker
        if ('serviceWorker' in navigator && CONFIG.pwa.enabled) {
            await this.registerServiceWorker();
        }
        
        // Configurar modo debug si está habilitado
        if (ConfigManager.getDevConfig('debug.enabled')) {
            await this.initializeDebugMode();
        }
    }

    // ===========================
    // CARACTERÍSTICAS ESPECÍFICAS
    // ===========================

    async initializeAnimations() {
        try {
            if (ConfigManager.isReducedMotion()) {
                Utils.Log.debug('Reduced motion detected, skipping animations');
                return;
            }

            const animationsManager = new AnimationsManager();
            this.modules.set('animations', animationsManager);
            
            Utils.Log.debug('✅ Animations initialized');
        } catch (error) {
            Utils.Log.error('Error initializing animations:', error);
        }
    }

    async initializeChat() {
        try {
            Utils.Log.debug('Initializing chat widget...');
            
            // Verificar que los elementos del chat existan
            const chatWidget = document.getElementById('chat-widget');
            if (!chatWidget) {
                Utils.Log.warn('Chat widget elements not found, skipping chat initialization');
                return;
            }

            // Configuración del chat
            const chatConfig = {
                webhookUrl: CONFIG.api.baseUrl || 'https://singular-dear-jaybird.ngrok-free.app/webhook/cfa4d4c3-0f1c-49bc-b1f9-4d5c4b719b44',
                enableNotifications: true,
                enableSuggestions: true,
                welcomeDelay: 3000,
                autoOpen: false
            };

            // Inicializar chat
            const chatCore = new LegalChatCore(chatConfig);
            this.modules.set('chat', chatCore);
            
            // Hacer disponible globalmente para debugging
            if (ConfigManager.getDevConfig('debug.enabled')) {
                window.legalChatCore = chatCore;
            }

            Utils.Log.debug('✅ Chat widget initialized');
        } catch (error) {
            Utils.Log.error('Error initializing chat:', error);
            // No es crítico, continuar sin chat
        }
    }

    async initializeLazyLoading() {
        if (!window.IntersectionObserver) return;

        const lazyImages = Utils.DOM.selectAll('img[data-src]');
        if (lazyImages.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });

        Utils.Log.debug(`Lazy loading setup for ${lazyImages.length} images`);
    }

    async initializeCounters() {
        const counters = Utils.DOM.selectAll('.stat-number');
        if (counters.length === 0 || !window.IntersectionObserver) return;

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px'
        });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });

        Utils.Log.debug(`Counter animation setup for ${counters.length} elements`);
    }

    animateCounter(element) {
        const text = element.textContent;
        const target = parseInt(text.replace(/\D/g, ''));
        const suffix = text.replace(/\d/g, '');
        
        if (isNaN(target)) return;

        const duration = 2000;
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, stepTime);
    }

    setupAccessibility() {
        // Detectar navegación por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Skip link para navegación por teclado
        this.createSkipLink();

        // Anunciar cambios dinámicos a lectores de pantalla
        this.setupScreenReaderAnnouncements();

        Utils.Log.debug('Accessibility features initialized');
    }

    createSkipLink() {
        if (Utils.DOM.select('.skip-link')) return;

        const skipLink = Utils.DOM.createElement('a', {
            href: '#main',
            className: 'skip-link sr-only',
            style: `
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--primary-color);
                color: white;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 10000;
                transition: top 0.3s;
            `
        }, 'Saltar al contenido principal');

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    setupScreenReaderAnnouncements() {
        // Crear región para anuncios
        const announcer = Utils.DOM.createElement('div', {
            'aria-live': 'polite',
            'aria-atomic': 'true',
            className: 'sr-only'
        });
        
        document.body.appendChild(announcer);

        // Función global para anunciar cambios
        window.announceToScreenReader = (message) => {
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        };
    }

    async initializeDebugMode() {
        // Crear panel de debug
        const debugPanel = this.createDebugPanel();
        document.body.appendChild(debugPanel);

        // Shortcuts de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + D = Toggle debug
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            }
        });

        Utils.Log.debug('Debug mode initialized');
    }

    createDebugPanel() {
        const panel = Utils.DOM.createElement('div', {
            id: 'debug-panel',
            style: `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                max-width: 300px;
                display: none;
            `
        });

        const updateInfo = () => {
            const viewport = Utils.Device.getViewportInfo();
            const breakpoint = ConfigManager.getCurrentBreakpoint();
            
            panel.innerHTML = `
                <strong>🐛 Debug Panel</strong><br>
                <strong>Viewport:</strong> ${viewport.width}x${viewport.height}<br>
                <strong>Breakpoint:</strong> ${breakpoint}<br>
                <strong>Device:</strong> ${Utils.Device.getDeviceType()}<br>
                <strong>Online:</strong> ${navigator.onLine ? '✅' : '❌'}<br>
                <strong>Modules:</strong> ${this.modules.size}<br>
                <strong>Performance:</strong> ${Math.round(performance.now())}ms<br>
                <small>Ctrl+Shift+D to toggle</small>
            `;
        };

        updateInfo();
        setInterval(updateInfo, 1000);

        return panel;
    }

    // ===========================
    // OPTIMIZACIONES POST-CARGA
    // ===========================

    async performPostLoadOptimizations() {
        // Precarga de recursos críticos
        this.preloadCriticalResources();
        
        // Optimizar fuentes
        this.optimizeFonts();
        
        // Limpiar listeners innecesarios
        this.cleanupEventListeners();
    }

    preloadCriticalResources() {
        const criticalResources = [
            // Agregar URLs de recursos críticos aquí
        ];

        criticalResources.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    optimizeFonts() {
        // Font display swap para mejor performance
        const fonts = Utils.DOM.selectAll('link[rel="stylesheet"][href*="fonts"]');
        fonts.forEach(font => {
            font.setAttribute('rel', 'preload');
            font.setAttribute('as', 'style');
            font.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
        });
    }

    cleanupEventListeners() {
        // Remover listeners de inicialización que ya no se necesitan
        document.removeEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        window.removeEventListener('load', this.handleLoad);
    }

    // ===========================
    // CONFIGURAR OBSERVADORES
    // ===========================

    setupObservers() {
        // Intersection Observer para animaciones de scroll
        if (window.IntersectionObserver) {
            const animatedElements = Utils.DOM.selectAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
            
            if (animatedElements.length > 0) {
                const observerOptions = {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                };

                this.animationObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            this.animationObserver.unobserve(entry.target);
                        }
                    });
                }, observerOptions);

                animatedElements.forEach(el => {
                    this.animationObserver.observe(el);
                });

                Utils.Log.debug(`Animation observer setup for ${animatedElements.length} elements`);
            }
        }
    }

    // ===========================
    // EVENT HANDLERS
    // ===========================

    setupEventListeners() {
        window.addEventListener('unload', this.handleUnload);
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handleError);
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message));
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
    }

    handleError(error) {
        Utils.Log.error('Application error:', error);
        
        this.state.error = error;
        
        // Reportar error a servicio de logging si está configurado
        if (CONFIG.analytics.enabled) {
            this.reportError(error);
        }
        
        // Mostrar error al usuario en desarrollo
        if (ConfigManager.getDevConfig('debug.enabled')) {
            console.error('🚨 Application Error:', error);
        }
    }

    handleResize() {
        // Notificar a módulos sobre cambio de viewport
        this.emit('resize', {
            viewport: Utils.Device.getViewportInfo(),
            breakpoint: ConfigManager.getCurrentBreakpoint()
        });
    }

    handleVisibilityChange() {
        const isHidden = document.hidden;
        
        if (isHidden) {
            // Pausar actividades no críticas
            this.emit('hidden');
        } else {
            // Reanudar actividades
            this.emit('visible');
        }
    }

    handleUnload() {
        // Limpiar recursos antes de salir
        this.cleanup();
    }

    // ===========================
    // GESTIÓN DE RENDIMIENTO
    // ===========================

    logPerformanceMetrics() {
        if (!performance.timing) return;

        const timing = performance.timing;
        const metrics = {
            'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
            'TCP Connection': timing.connectEnd - timing.connectStart,
            'Server Response': timing.responseEnd - timing.requestStart,
            'DOM Processing': timing.domComplete - timing.domLoading,
            'Page Load': timing.loadEventEnd - timing.navigationStart
        };

        Utils.Log.info('⚡ Performance Metrics:');
        Object.entries(metrics).forEach(([name, time]) => {
            Utils.Log.info(`  ${name}: ${time}ms`);
        });

        // Enviar métricas a analytics si está habilitado
        if (CONFIG.analytics.enabled) {
            this.reportPerformanceMetrics(metrics);
        }
    }

    reportPerformanceMetrics(metrics) {
        // Implementar envío a servicio de analytics
        Utils.Log.debug('Performance metrics would be sent to analytics');
    }

    reportError(error) {
        // Implementar envío a servicio de error tracking
        Utils.Log.debug('Error would be sent to error tracking service');
    }

    // ===========================
    // API PÚBLICA
    // ===========================

    getModule(name) {
        return this.modules.get(name);
    }

    isReady() {
        return this.state.ready;
    }

    getState() {
        return { ...this.state };
    }

    async restart() {
        await this.cleanup();
        await this.init();
    }

    // ===========================
    // LIMPIEZA
    // ===========================

    async cleanup() {
        Utils.Log.info('🧹 Cleaning up application...');

        // Limpiar observadores
        if (this.animationObserver) {
            this.animationObserver.disconnect();
        }

        // Limpiar módulos
        for (const [name, module] of this.modules) {
            if (module && typeof module.destroy === 'function') {
                try {
                    await module.destroy();
                    Utils.Log.debug(`✅ ${name} cleaned up`);
                } catch (error) {
                    Utils.Log.error(`❌ Error cleaning up ${name}:`, error);
                }
            }
        }

        this.modules.clear();

        // Remover event listeners
        window.removeEventListener('unload', this.handleUnload);
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        // Resetear estado
        this.state = {
            initialized: false,
            ready: false,
            loading: false,
            error: null
        };

        Utils.Log.info('✅ Cleanup complete');
    }

    // ===========================
    // EVENT EMITTER
    // ===========================

    emit(event, data = null) {
        const customEvent = new CustomEvent(`app:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    on(event, callback) {
        document.addEventListener(`app:${event}`, (e) => {
            callback(e.detail);
        });
    }
}

// ===========================
// INSTANCIA GLOBAL
// ===========================

let appInstance = null;

export function createApp() {
    if (appInstance) {
        Utils.Log.warn('App instance already exists');
        return appInstance;
    }

    appInstance = new LawFirmApp();
    
    // Hacer disponible globalmente para debugging
    if (typeof window !== 'undefined') {
        window.lawFirmApp = appInstance;
    }

    return appInstance;
}

export function getApp() {
    return appInstance;
}

// ===========================
// AUTO-INICIALIZACIÓN
// ===========================

export async function initializeApp() {
    try {
        const app = createApp();
        await app.init();
        return app;
    } catch (error) {
        console.error('Failed to initialize LawFirm App:', error);
        throw error;
    }
}

export default LawFirmApp;