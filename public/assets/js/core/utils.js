/**
 * UTILIDADES GENERALES - ESTUDIO JURÍDICO
 * Funciones auxiliares reutilizables en toda la aplicación
 */

import { CONFIG } from './config.js';

// ===========================
// UTILIDADES DE RENDIMIENTO
// ===========================

export class PerformanceUtils {
    /**
     * Debounce - Retrasa la ejecución hasta que pasen X ms sin llamadas
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle - Limita las ejecuciones a una vez cada X ms
     */
    static throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function executedFunction(...args) {
            if (!lastRan) {
                func(...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    /**
     * RequestAnimationFrame optimizado
     */
    static raf(callback) {
        return window.requestAnimationFrame ? 
            window.requestAnimationFrame(callback) : 
            setTimeout(callback, 16);
    }

    /**
     * Cancelar RequestAnimationFrame
     */
    static cancelRaf(id) {
        return window.cancelAnimationFrame ? 
            window.cancelAnimationFrame(id) : 
            clearTimeout(id);
    }

    /**
     * Medir tiempo de ejecución
     */
    static measure(name, func) {
        const logLevel = window.LOG_LEVEL || 'warn';
        if (logLevel !== 'debug' && logLevel !== 'performance') {
            return func();
        }
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// ===========================
// UTILIDADES DOM
// ===========================

export class DOMUtils {
    /**
     * Selector seguro con cache
     */
    static select(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.warn(`Selector inválido: ${selector}`, error);
            return null;
        }
    }

    /**
     * Selector múltiple seguro
     */
    static selectAll(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.warn(`Selector inválido: ${selector}`, error);
            return [];
        }
    }

    /**
     * Crear elemento con atributos
     */
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.appendChild(content);
            }
        }

        return element;
    }

    /**
     * Verificar si elemento está visible en viewport
     */
    static isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= windowHeight + threshold &&
            rect.right <= windowWidth + threshold
        );
    }

    /**
     * Scroll suave a elemento
     */
    static smoothScrollTo(element, offset = CONFIG.scroll.offset) {
        if (!element) return;
        
        const targetPosition = element.offsetTop - offset;
        
        if (window.CSS && CSS.supports('scroll-behavior', 'smooth') && window.matchMedia('(prefers-reduced-motion: reduce)').matches === false) {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            // Fallback para navegadores sin soporte
            window.scrollTo(0, targetPosition);
        }
    }

    /**
     * Obtener posición de elemento
     */
    static getElementPosition(element) {
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Agregar/remover clases con transiciones
     */
    static toggleClass(element, className, force) {
        if (!element) return;
        
        if (typeof force !== 'undefined') {
            element.classList.toggle(className, force);
        } else {
            element.classList.toggle(className);
        }
    }

    /**
     * Esperar por transición CSS
     */
    static waitForTransition(element, property = 'all') {
        return new Promise(resolve => {
            if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                resolve();
                return;
            }

            const handleTransitionEnd = (event) => {
                if (property === 'all' || event.propertyName === property) {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    resolve();
                }
            };

            element.addEventListener('transitionend', handleTransitionEnd);
            
            // Timeout fallback
            setTimeout(resolve, CONFIG.animations.duration.slow);
        });
    }
}

// ===========================
// UTILIDADES DE VALIDACIÓN
// ===========================

export class ValidationUtils {
    /**
     * Validar email
     */
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Validar teléfono
     */
    static validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 9 && cleaned.length <= 15;
    }

    /**
     * Validar nombre
     */
    static validateName(name) {
        return name && name.trim().length >= 2;
    }

    /**
     * Validar mensaje
     */
    static validateMessage(message, minLength = 10) {
        return message && message.trim().length >= minLength;
    }

    /**
     * Limpiar texto
     */
    static sanitizeText(text) {
        return text
            .replace(/[<>]/g, '') // Remover < y >
            .trim()
            .substring(0, 1000); // Limitar longitud
    }

    /**
     * Formatear teléfono
     */
    static formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 9) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }

    /**
     * Validar URL
     */
    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// ===========================
// UTILIDADES DE ALMACENAMIENTO
// ===========================

export class StorageUtils {
    /**
     * Guardar en localStorage con manejo de errores
     */
    static setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
            return false;
        }
    }

    /**
     * Obtener de localStorage con fallback
     */
    static getLocal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Error leyendo localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remover de localStorage
     */
    static removeLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Error removiendo de localStorage:', error);
            return false;
        }
    }

    /**
     * Guardar en sessionStorage
     */
    static setSession(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Error guardando en sessionStorage:', error);
            return false;
        }
    }

    /**
     * Obtener de sessionStorage
     */
    static getSession(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Error leyendo sessionStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Limpiar almacenamiento
     */
    static clearStorage(type = 'both') {
        try {
            if (type === 'local' || type === 'both') {
                localStorage.clear();
            }
            if (type === 'session' || type === 'both') {
                sessionStorage.clear();
            }
            return true;
        } catch (error) {
            console.warn('Error limpiando almacenamiento:', error);
            return false;
        }
    }

    /**
     * Verificar disponibilidad de Storage
     */
    static isStorageAvailable(type = 'localStorage') {
        try {
            const storage = window[type];
            const testKey = '__test__';
            storage.setItem(testKey, 'test');
            storage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }
}

// ===========================
// UTILIDADES DE FECHA Y TIEMPO
// ===========================

export class DateUtils {
    /**
     * Formatear fecha en español
     */
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options })
            .format(new Date(date));
    }

    /**
     * Formatear tiempo relativo
     */
    static formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) return 'Ahora';
        if (diffMinutes < 60) return `${diffMinutes}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        
        return this.formatDate(date, { month: 'short', day: 'numeric' });
    }

    /**
     * Verificar si es hoy
     */
    static isToday(date) {
        const today = new Date();
        const compareDate = new Date(date);
        
        return today.toDateString() === compareDate.toDateString();
    }

    /**
     * Obtener timestamp
     */
    static getTimestamp() {
        return Date.now();
    }
}

// ===========================
// UTILIDADES DE EVENTOS
// ===========================

export class EventUtils {
    /**
     * Event emitter simple
     */
    static createEventEmitter() {
        const events = {};
        
        return {
            on(event, callback) {
                if (!events[event]) events[event] = [];
                events[event].push(callback);
            },
            
            off(event, callback) {
                if (!events[event]) return;
                const index = events[event].indexOf(callback);
                if (index > -1) events[event].splice(index, 1);
            },
            
            emit(event, ...args) {
                if (!events[event]) return;
                events[event].forEach(callback => callback(...args));
            },
            
            once(event, callback) {
                const onceCallback = (...args) => {
                    callback(...args);
                    this.off(event, onceCallback);
                };
                this.on(event, onceCallback);
            }
        };
    }

    /**
     * Delegación de eventos
     */
    static delegate(parent, selector, event, handler) {
        parent.addEventListener(event, function(e) {
            if (e.target.matches(selector)) {
                handler.call(e.target, e);
            }
        });
    }

    /**
     * Prevenir comportamiento por defecto
     */
    static preventDefault(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
    }

    /**
     * Detener propagación
     */
    static stopPropagation(event) {
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
    }
}

// ===========================
// UTILIDADES DE LOGGING
// ===========================

export class LogUtils {
    static log(message, type = 'info', data = null) {
        const logLevel = window.LOG_LEVEL || 'warn';
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(logLevel);
        const messageTypeIndex = levels.indexOf(type);
        
        if (messageTypeIndex <= currentLevelIndex) {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
            
            if (data) {
                console[type](`${prefix} ${message}`, data);
            } else {
                console[type](`${prefix} ${message}`);
            }
        }
    }

    static error(message, data = null) {
        this.log(message, 'error', data);
    }

    static warn(message, data = null) {
        this.log(message, 'warn', data);
    }

    static info(message, data = null) {
        this.log(message, 'info', data);
    }

    static debug(message, data = null) {
        this.log(message, 'debug', data);
    }
}

// ===========================
// UTILIDADES DE DISPOSITIVO
// ===========================

export class DeviceUtils {
    /**
     * Detectar tipo de dispositivo
     */
    static getDeviceType() {
        const width = window.innerWidth;
        if (width < 576) return 'mobile';
        if (width < 992) return 'tablet';
        return 'desktop';
    }

    /**
     * Obtener información de viewport
     */
    static getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
        };
    }

    /**
     * Verificar soporte de características
     */
    static supports(feature) {
        const features = {
            touchEvents: 'ontouchstart' in window,
            webgl: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
                } catch {
                    return false;
                }
            })(),
            serviceWorker: 'serviceWorker' in navigator,
            webp: (() => {
                const canvas = document.createElement('canvas');
                return canvas.toDataURL('image/webp').indexOf('webp') > 0;
            })(),
            intersectionObserver: 'IntersectionObserver' in window,
            customProperties: CSS.supports('--custom', 'property')
        };
        
        return features[feature] || false;
    }
}

// ===========================
// UTILIDADES GLOBALES
// ===========================

export class Utils {
    /**
     * Generar ID único
     */
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Esperar tiempo determinado
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Capitalizar primera letra
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Truncar texto
     */
    static truncate(str, length = 100, suffix = '...') {
        return str.length > length ? str.substring(0, length) + suffix : str;
    }

    /**
     * Escapar HTML
     */
    static escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Clonar objeto profundo
     */
    static deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch {
            return obj;
        }
    }

    /**
     * Mezclar objetos
     */
    static merge(target, ...sources) {
        return Object.assign({}, target, ...sources);
    }
}

// Exportar todas las utilidades como default
export default {
    Performance: PerformanceUtils,
    DOM: DOMUtils,
    Validation: ValidationUtils,
    Storage: StorageUtils,
    Date: DateUtils,
    Event: EventUtils,
    Log: LogUtils,
    Device: DeviceUtils,
    Utils
};