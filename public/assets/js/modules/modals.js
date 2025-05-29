/**
 * MÓDULO DE MODALES - ESTUDIO JURÍDICO
 * Maneja ventanas emergentes, popups y diálogos
 */

import { CONFIG } from '../core/config.js';
import { ConfigManager } from '../core/config.js';
import Utils from '../core/utils.js';

export class ModalManager {
    constructor() {
        this.modals = new Map();
        this.modalStack = [];
        this.bodyScrollPosition = 0;
        
        this.bindMethods();
        this.init();
    }

    bindMethods() {
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleCloseClick = this.handleCloseClick.bind(this);
        this.handleResize = Utils.Performance.debounce(this.handleResize.bind(this), 250);
    }

    init() {
        this.discoverModals();
        this.setupGlobalListeners();
        this.createNotificationContainer();
        
        Utils.Log.info('ModalManager initialized');
    }

    // ===========================
    // CONFIGURACIÓN INICIAL
    // ===========================

    discoverModals() {
        const modalElements = Utils.DOM.selectAll('.modal, [data-modal]');
        
        modalElements.forEach(modal => {
            this.registerModal(modal);
        });

        Utils.Log.debug(`Discovered ${modalElements.length} modals`);
    }

    setupGlobalListeners() {
        document.addEventListener('keydown', this.handleKeydown);
        document.addEventListener('click', this.handleBackdropClick);
        window.addEventListener('resize', this.handleResize);
        
        // Delegación de eventos para triggers
        Utils.Event.delegate(document, '[data-modal-target]', 'click', (event) => {
            Utils.Event.preventDefault(event);
            const target = event.target.getAttribute('data-modal-target');
            this.open(target);
        });

        Utils.Event.delegate(document, '[data-modal-close]', 'click', this.handleCloseClick);
    }

    createNotificationContainer() {
        if (Utils.DOM.select('.notification-container')) return;

        const container = Utils.DOM.createElement('div', {
            className: 'notification-container',
            style: `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `
        });
        
        document.body.appendChild(container);
    }

    // ===========================
    // REGISTRO DE MODALES
    // ===========================

    registerModal(modalElement, options = {}) {
        if (!modalElement) {
            Utils.Log.warn('Invalid modal element provided');
            return null;
        }

        const modalId = modalElement.id || Utils.Utils.generateId('modal');
        if (!modalElement.id) modalElement.id = modalId;

        const modalConfig = {
            element: modalElement,
            content: modalElement.querySelector('.modal-content'),
            closeButtons: modalElement.querySelectorAll('.modal-close, [data-modal-close]'),
            options: {
                backdrop: true,
                keyboard: true,
                focus: true,
                animation: !(ConfigManager && typeof ConfigManager.isReducedMotion === 'function' && ConfigManager.isReducedMotion()),
                autoFocus: true,
                restoreFocus: true,
                ...options
            },
            state: {
                isOpen: false,
                previousFocus: null,
                openPromise: null,
                closePromise: null
            }
        };

        // Configurar ARIA attributes
        this.setupModalAccessibility(modalConfig);

        this.modals.set(modalId, modalConfig);
        
        Utils.Log.debug(`Modal registered: ${modalId}`);
        return modalId;
    }

    setupModalAccessibility(modalConfig) {
        const { element, content } = modalConfig;
        
        // ARIA attributes
        element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'true');
        element.setAttribute('aria-hidden', 'true');
        
        if (content) {
            content.setAttribute('role', 'document');
        }

        // Asegurar que el modal sea focusable
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '-1');
        }
    }

    // ===========================
    // APERTURA Y CIERRE
    // ===========================

    async open(modalId, data = null) {
        const modalConfig = this.modals.get(modalId);
        if (!modalConfig) {
            Utils.Log.warn(`Modal not found: ${modalId}`);
            return false;
        }

        if (modalConfig.state.isOpen) {
            Utils.Log.debug(`Modal already open: ${modalId}`);
            return true;
        }

        // Evitar conflictos con el chat
        if (window.legalChatInstance?.isOpen && ConfigManager && typeof ConfigManager.isMobile === 'function' && ConfigManager.isMobile()) {
            Utils.Log.debug('Chat is open, not opening modal on mobile');
            return false;
        }

        try {
            await this.performOpen(modalConfig, data);
            return true;
        } catch (error) {
            Utils.Log.error('Error opening modal:', error);
            return false;
        }
    }

    async performOpen(modalConfig, data) {
        const { element, options, state } = modalConfig;

        // Prevenir scroll del body
        this.preventBodyScroll();

        // Guardar foco anterior
        if (options.restoreFocus) {
            state.previousFocus = document.activeElement;
        }

        // Añadir al stack
        this.modalStack.push(modalConfig);

        // Actualizar estado
        state.isOpen = true;
        element.setAttribute('aria-hidden', 'false');

        // Mostrar modal
        element.style.display = 'flex';
        
        // Animación de entrada
        if (options.animation) {
            element.style.opacity = '0';
            await Utils.Utils.sleep(10); // Force reflow
            element.style.transition = `opacity ${CONFIG.animations.duration.base}ms ${CONFIG.animations.easing.easeOut}`;
            element.style.opacity = '1';
            await Utils.Utils.sleep(CONFIG.animations.duration.base);
        }

        // Enfocar modal
        if (options.autoFocus) {
            this.focusModal(modalConfig);
        }

        // Emitir eventos
        this.emit('opened', { modalId: element.id, data });
        
        Utils.Log.debug(`Modal opened: ${element.id}`);
    }

    async close(modalId = null, force = false) {
        let modalConfig;

        if (modalId) {
            modalConfig = this.modals.get(modalId);
        } else {
            // Cerrar el modal superior del stack
            modalConfig = this.modalStack[this.modalStack.length - 1];
        }

        if (!modalConfig || !modalConfig.state.isOpen) {
            return false;
        }

        try {
            await this.performClose(modalConfig, force);
            return true;
        } catch (error) {
            Utils.Log.error('Error closing modal:', error);
            return false;
        }
    }

    async performClose(modalConfig, force = false) {
        const { element, options, state } = modalConfig;

        // Prevenir cierre si hay un formulario sucio (opcional)
        if (!force && this.hasUnsavedChanges(modalConfig)) {
            const confirmed = await this.confirmClose();
            if (!confirmed) return;
        }

        // Animación de salida
        if (options.animation) {
            element.style.transition = `opacity ${CONFIG.animations.duration.fast}ms ${CONFIG.animations.easing.easeIn}`;
            element.style.opacity = '0';
            await Utils.Utils.sleep(CONFIG.animations.duration.fast);
        }

        // Ocultar modal
        element.style.display = 'none';
        element.style.opacity = '';
        element.style.transition = '';

        // Actualizar estado
        state.isOpen = false;
        element.setAttribute('aria-hidden', 'true');

        // Remover del stack
        const stackIndex = this.modalStack.indexOf(modalConfig);
        if (stackIndex > -1) {
            this.modalStack.splice(stackIndex, 1);
        }

        // Restaurar scroll si no hay más modales
        if (this.modalStack.length === 0) {
            this.restoreBodyScroll();
        }

        // Restaurar foco
        if (options.restoreFocus && state.previousFocus) {
            state.previousFocus.focus();
            state.previousFocus = null;
        }

        // Emitir eventos
        this.emit('closed', { modalId: element.id });
        
        Utils.Log.debug(`Modal closed: ${element.id}`);
    }

    closeAll(force = false) {
        const promises = this.modalStack.map(modalConfig => 
            this.performClose(modalConfig, force)
        );
        
        return Promise.all(promises);
    }

    // ===========================
    // MANEJO DE FOCO
    // ===========================

    focusModal(modalConfig) {
        const { element, content } = modalConfig;
        
        // Intentar enfocar el primer elemento focusable
        const focusableElement = this.findFirstFocusable(content || element);
        
        if (focusableElement) {
            focusableElement.focus();
        } else {
            element.focus();
        }
    }

    findFirstFocusable(container) {
        const focusableSelectors = [
            'input:not([disabled]):not([type="hidden"])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            'button:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];

        return container.querySelector(focusableSelectors.join(', '));
    }

    trapFocus(modalConfig, event) {
        const { element } = modalConfig;
        const focusableElements = element.querySelectorAll(
            'input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            Utils.Event.preventDefault(event);
            lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            Utils.Event.preventDefault(event);
            firstElement?.focus();
        }
    }

    // ===========================
    // MANEJO DE SCROLL
    // ===========================

    preventBodyScroll() {
        if (this.modalStack.length === 0) {
            this.bodyScrollPosition = window.pageYOffset;
            document.body.style.top = `-${this.bodyScrollPosition}px`;
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
    }

    restoreBodyScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, this.bodyScrollPosition);
    }

    // ===========================
    // EVENT HANDLERS
    // ===========================

    handleKeydown(event) {
        const activeModal = this.modalStack[this.modalStack.length - 1];
        if (!activeModal) return;

        // Escape para cerrar
        if (event.key === 'Escape' && activeModal.options.keyboard) {
            Utils.Event.preventDefault(event);
            this.close();
        }

        // Tab trapping
        if (event.key === 'Tab') {
            this.trapFocus(activeModal, event);
        }
    }

    handleBackdropClick(event) {
        const activeModal = this.modalStack[this.modalStack.length - 1];
        if (!activeModal || !activeModal.options.backdrop) return;

        // Solo cerrar si se hace click en el backdrop, no en el contenido
        if (event.target === activeModal.element) {
            this.close();
        }
    }

    handleCloseClick(event) {
        Utils.Event.preventDefault(event);
        this.close();
    }

    handleResize() {
        // Reposicionar modales si es necesario
        this.modalStack.forEach(modalConfig => {
            this.repositionModal(modalConfig);
        });
    }

    repositionModal(modalConfig) {
        const { element, content } = modalConfig;
        if (!content) return;

        // Centrar verticalmente si es necesario
        const modalHeight = content.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        if (modalHeight > viewportHeight * 0.9) {
            content.style.marginTop = '5vh';
            content.style.marginBottom = '5vh';
            content.style.maxHeight = '90vh';
            content.style.overflowY = 'auto';
        }
    }

    // ===========================
    // UTILIDADES
    // ===========================

    hasUnsavedChanges(modalConfig) {
        const forms = modalConfig.element.querySelectorAll('form');
        
        for (const form of forms) {
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                if (value && value.toString().trim().length > 0) {
                    return true;
                }
            }
        }
        
        return false;
    }

    async confirmClose() {
        return new Promise((resolve) => {
            const confirmed = window.confirm(
                '¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.'
            );
            resolve(confirmed);
        });
    }

    // ===========================
    // NOTIFICACIONES
    // ===========================

    showNotification(message, type = 'info', options = {}) {
        const container = Utils.DOM.select('.notification-container');
        if (!container) return;

        const notificationId = Utils.Utils.generateId('notification');
        const notification = this.createNotificationElement(notificationId, message, type, options);
        
        container.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto-remover
        const duration = options.duration || CONFIG.notifications.duration;
        setTimeout(() => {
            this.removeNotification(notificationId);
        }, duration);

        return notificationId;
    }

    createNotificationElement(id, message, type, options) {
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            warning: '#d69e2e',
            info: '#3182ce'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const notification = Utils.DOM.createElement('div', {
            id: id,
            className: `notification notification-${type}`,
            style: `
                background: ${colors[type] || colors.info};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: auto;
                max-width: 400px;
                word-wrap: break-word;
                position: relative;
            `
        });

        const content = Utils.DOM.createElement('div', {
            style: 'display: flex; align-items: center; gap: 0.5rem;'
        });

        // Icono
        const icon = Utils.DOM.createElement('i', {
            className: `fas ${icons[type] || icons.info}`
        });

        // Mensaje
        const messageSpan = Utils.DOM.createElement('span');
        if (options.html) {
            messageSpan.innerHTML = message;
        } else {
            messageSpan.textContent = message;
        }

        // Botón cerrar
        const closeButton = Utils.DOM.createElement('button', {
            style: `
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                font-size: 1.2rem;
                opacity: 0.8;
            `
        }, '&times;');

        closeButton.addEventListener('click', () => {
            this.removeNotification(id);
        });

        content.appendChild(icon);
        content.appendChild(messageSpan);
        content.appendChild(closeButton);
        notification.appendChild(content);

        return notification;
    }

    removeNotification(notificationId) {
        const notification = Utils.DOM.select(`#${notificationId}`);
        if (!notification) return;

        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }

    // ===========================
    // API PÚBLICA
    // ===========================

    isOpen(modalId = null) {
        if (modalId) {
            const modalConfig = this.modals.get(modalId);
            return modalConfig ? modalConfig.state.isOpen : false;
        }
        
        return this.modalStack.length > 0;
    }

    getOpenModals() {
        return this.modalStack.map(config => config.element.id);
    }

    setModalData(modalId, data) {
        const modalConfig = this.modals.get(modalId);
        if (!modalConfig) return;

        // Actualizar contenido basado en data
        this.populateModalContent(modalConfig, data);
    }

    populateModalContent(modalConfig, data) {
        const { element } = modalConfig;
        
        // Actualizar título
        const title = element.querySelector('.modal-title');
        if (title && data.title) {
            title.textContent = data.title;
        }

        // Actualizar contenido
        const body = element.querySelector('.modal-body');
        if (body && data.content) {
            if (data.html) {
                body.innerHTML = data.content;
            } else {
                body.textContent = data.content;
            }
        }

        // Actualizar formularios
        if (data.formData) {
            Object.entries(data.formData).forEach(([name, value]) => {
                const field = element.querySelector(`[name="${name}"]`);
                if (field) field.value = value;
            });
        }
    }

    // ===========================
    // EVENT EMITTER
    // ===========================

    emit(event, data = null) {
        const customEvent = new CustomEvent(`modal:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    on(event, callback) {
        document.addEventListener(`modal:${event}`, (e) => {
            callback(e.detail);
        });
    }

    // ===========================
    // DESTRUCTOR
    // ===========================

    destroy() {
        this.closeAll(true);
        
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('click', this.handleBackdropClick);
        window.removeEventListener('resize', this.handleResize);

        this.modals.clear();
        this.modalStack.length = 0;
        
        Utils.Log.info('ModalManager destroyed');
    }
}

// ===========================
// FACTORY FUNCTION
// ===========================

export function createModalManager() {
    return new ModalManager();
}

// ===========================
// AUTO-INICIALIZACIÓN
// ===========================

let modalManagerInstance = null;

export function initializeModals() {
    if (modalManagerInstance) {
        Utils.Log.warn('ModalManager already initialized');
        return modalManagerInstance;
    }

    modalManagerInstance = createModalManager();
    
    // Hacer disponible globalmente
    window.modalManager = modalManagerInstance;
    window.notificationManager = {
        show: modalManagerInstance.showNotification.bind(modalManagerInstance)
    };
    
    if (ConfigManager && typeof ConfigManager.getDevConfig === 'function' && ConfigManager.getDevConfig('debug.enabled')) {
        window.modalManager = modalManagerInstance;
    }

    return modalManagerInstance;
}

export function getModalManager() {
    return modalManagerInstance;
}

export default ModalManager;