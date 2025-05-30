/**
 * CONFIGURACIÓN GLOBAL - ESTUDIO JURÍDICO
 * Centraliza toda la configuración de la aplicación
 */

// ===========================
// CONFIGURACIÓN PRINCIPAL
// ===========================

export const CONFIG = {
    // Información del sitio
    site: {
        name: 'LexFirma',
        version: '2.0.0',
        description: 'Estudio Jurídico Profesional'
    },

    // Configuración de animaciones
    animations: {
        duration: {
            fast: 150,
            base: 300,
            slow: 500,
            spring: 400
        },
        easing: {
            ease: 'ease',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },

    // Configuración de scroll
    scroll: {
        offset: 80,
        behavior: 'smooth',
        threshold: 100
    },

    // Configuración de formularios
    forms: {
        validation: {
            realTime: true,
            showErrors: true,
            debounceTime: 300
        },
        submission: {
            timeout: 10000,
            retries: 3,
            showLoading: true
        }
    },

    // Configuración de modales
    modals: {
        backdrop: true,
        keyboard: true,
        focus: true,
        animation: true
    },

    // Configuración de notificaciones
    notifications: {
        position: 'top-right',
        duration: 5000,
        maxVisible: 3,
        animations: true
    },

    // Breakpoints (sincronizados con CSS)
    breakpoints: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400
    },

    // API endpoints (para futuro backend)
    api: {
        baseUrl: '/api/v1',
        timeout: 10000,
        retries: 3,
        endpoints: {
            contact: '/contact',
            newsletter: '/newsletter',
            consultation: '/consultation'
        }
    },

    // Configuración de cookies
    cookies: {
        consent: {
            name: 'cookie_consent',
            duration: 365
        },
        preferences: {
            name: 'user_preferences',
            duration: 90
        }
    },

    // Configuración de analytics (preparado para futuro)
    analytics: {
        enabled: false,
        trackingId: null,
        events: {
            pageView: true,
            formSubmit: true,
            buttonClick: true,
            chatInteraction: true
        }
    },

    // Configuración de PWA (preparado para futuro)
    pwa: {
        enabled: false,
        cacheName: 'lexfirma-v1',
        cacheStrategy: 'networkFirst'
    }
};

// ===========================
// CONFIGURACIÓN DEL CHAT
// ===========================

export const CHAT_CONFIG = {
    // URL del webhook (configurable)
    webhookUrl: 'https://singular-dear-jaybird.ngrok-free.app/webhook/cfa4d4c3-0f1c-49bc-b1f9-4d5c4b719b44',
    
    // Configuración de n8n
    n8n: {
        enabled: true,
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        cache: {
            enabled: true,
            timeout: 300000 // 5 minutos
        }
    },

    // Configuración de UI
    ui: {
        position: 'bottom-right',
        toggleSize: 64,
        windowSize: {
            width: 380,
            height: 600,
            mobile: {
                fullscreen: true
            }
        },
        colors: {
            primary: '#0f2847',
            secondary: '#d4af37',
            background: '#ffffff',
            text: '#212529'
        }
    },

    // Configuración de comportamiento
    behavior: {
        autoOpen: false,
        welcomeDelay: 2000,
        notificationDuration: 5000,
        typingIndicatorDelay: 500,
        messageMaxLength: 1000,
        historyLimit: 50
    },

    // Configuración de mensajes
    messages: {
        welcome: '¡Hola! Soy tu asistente legal virtual. ¿En qué puedo ayudarte hoy?',
        offline: 'Actualmente estoy desconectado. Por favor, intenta más tarde.',
        error: 'Lo siento, hay un problema de conexión. Intenta nuevamente.',
        rateLimit: 'Has enviado muchos mensajes. Espera un momento antes de continuar.',
        maxLength: 'Tu mensaje es muy largo. Por favor, hazlo más breve.'
    },

    // Sugerencias rápidas
    quickReplies: [
        {
            text: '📄 Documentos divorcio',
            message: '¿Qué documentos necesito para un divorcio?'
        },
        {
            text: '💼 Derechos laborales',
            message: '¿Cuáles son mis derechos laborales?'
        },
        {
            text: '🏢 Registro empresa',
            message: '¿Cómo registro una empresa?'
        },
        {
            text: '🚗 Accidente tránsito',
            message: '¿Qué hacer en caso de accidente de tránsito?'
        }
    ],

    // Configuración de API
    api: {
        timeout: 15000,
        retries: 2,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LegalChatWidget/2.0'
        }
    },

    // Configuración de almacenamiento
    storage: {
        sessionKey: 'legal_chat_session',
        historyKey: 'legal_chat_history',
        preferencesKey: 'legal_chat_preferences',
        maxHistorySize: 100
    }
};

// ===========================
// CONFIGURACIÓN DE DESARROLLO
// ===========================

export const DEV_CONFIG = {
    debug: {
        enabled: localStorage.getItem('debug') === 'true',
        verbose: localStorage.getItem('debug_verbose') === 'true',
        performance: localStorage.getItem('debug_performance') === 'true'
    },
    
    logging: {
        level: localStorage.getItem('log_level') || 'warn', // error, warn, info, debug
        console: true,
        remote: false
    },

    testing: {
        mockApi: localStorage.getItem('mock_api') === 'true',
        slowNetwork: localStorage.getItem('slow_network') === 'true',
        showGrid: localStorage.getItem('show_grid') === 'true'
    }
};

// ===========================
// UTILIDADES DE CONFIGURACIÓN
// ===========================

export class ConfigManager {
    static get(path, defaultValue = null) {
        return this.getNestedValue(CONFIG, path, defaultValue);
    }

    static getChatConfig(path, defaultValue = null) {
        return this.getNestedValue(CHAT_CONFIG, path, defaultValue);
    }

    static getDevConfig(path, defaultValue = null) {
        return this.getNestedValue(DEV_CONFIG, path, defaultValue);
    }

    static set(path, value) {
        this.setNestedValue(CONFIG, path, value);
    }

    static setChatConfig(path, value) {
        this.setNestedValue(CHAT_CONFIG, path, value);
    }

    static getNestedValue(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    static setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }

    static getCurrentBreakpoint() {
        const width = window.innerWidth;
        const breakpoints = CONFIG.breakpoints;
        
        if (width >= breakpoints.xxl) return 'xxl';
        if (width >= breakpoints.xl) return 'xl';
        if (width >= breakpoints.lg) return 'lg';
        if (width >= breakpoints.md) return 'md';
        if (width >= breakpoints.sm) return 'sm';
        return 'xs';
    }

    static isMobile() {
        return this.getCurrentBreakpoint() === 'xs' || this.getCurrentBreakpoint() === 'sm';
    }

    static isTablet() {
        return this.getCurrentBreakpoint() === 'md';
    }

    static isDesktop() {
        const bp = this.getCurrentBreakpoint();
        return bp === 'lg' || bp === 'xl' || bp === 'xxl';
    }

    static isDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    static isReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    static isHighContrast() {
        return window.matchMedia('(prefers-contrast: high)').matches;
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static isOnline() {
        return navigator.onLine;
    }

    static getBrowserInfo() {
        const ua = navigator.userAgent;
        return {
            userAgent: ua,
            isChrome: /Chrome/.test(ua),
            isFirefox: /Firefox/.test(ua),
            isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
            isEdge: /Edge/.test(ua),
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isAndroid: /Android/.test(ua),
            isMobile: /Mobi|Android/i.test(ua)
        };
    }
}

// ===========================
// CONFIGURACIÓN DINÁMICA
// ===========================

// Actualizar configuración basada en el entorno
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    DEV_CONFIG.debug.enabled = true;
    DEV_CONFIG.logging.level = 'debug';
}

// Configurar animaciones basado en preferencias del usuario
if (ConfigManager.isReducedMotion()) {
    CONFIG.animations.duration.fast = 1;
    CONFIG.animations.duration.base = 1;
    CONFIG.animations.duration.slow = 1;
    CONFIG.modals.animation = false;
    CONFIG.notifications.animations = false;
}

// Exportar configuración como default
export default CONFIG;