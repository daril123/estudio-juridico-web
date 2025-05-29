/**
 * CHAT WIDGET JURÍDICO - INTERFAZ DE USUARIO
 * Maneja toda la interacción con el DOM y la UI del chat
 */

export class ChatUI {
    constructor(core) {
        this.core = core;
        this.elements = {};
        this.isInitialized = false;
        this.animations = new Map();
        this.eventListeners = {};
        
        // Configuración de UI
        this.config = {
            animationDuration: 300,
            typingDuration: 1000,
            autoScroll: true,
            soundEnabled: false,
            notifications: true,
            theme: 'default'
        };
    }

    // ========================
    // INICIALIZACIÓN
    // ========================
    async init() {
        try {
            // Validar que el DOM esté listo
            await this.waitForElements();
            
            // Inicializar elementos
            this.initializeElements();
            
            // Validar elementos críticos
            if (!this.validateElements()) {
                throw new Error('Elementos críticos del chat no encontrados');
            }
            
            // Configurar eventos
            this.bindEvents();
            
            // Configurar UI inicial
            this.setupInitialState();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            console.log('🎨 Chat UI inicializada');
            this.emit('initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al inicializar Chat UI:', error);
            throw error;
        }
    }

    async waitForElements() {
        const maxAttempts = 50;
        let attempts = 0;
        
        return new Promise((resolve, reject) => {
            const checkElements = () => {
                const chatWidget = document.querySelector('#chat-widget');
                
                if (chatWidget) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Elementos del chat no encontrados en el DOM'));
                } else {
                    attempts++;
                    setTimeout(checkElements, 100);
                }
            };
            
            checkElements();
        });
    }

    initializeElements() {
        // Elementos principales
        this.elements = {
            widget: document.querySelector('#chat-widget'),
            toggle: document.querySelector('#chat-toggle'),
            window: document.querySelector('#chat-window'),
            messages: document.querySelector('#chat-messages'),
            input: document.querySelector('#chat-input'),
            send: document.querySelector('#chat-send'),
            minimize: document.querySelector('#chat-minimize'),
            typingIndicator: document.querySelector('#typing-indicator'),
            overlay: document.querySelector('#chat-overlay'),
            notification: document.querySelector('#chat-notification'),
            suggestions: document.querySelector('#chat-suggestions')
        };

        // Elementos secundarios
        this.elements.chatIcon = this.elements.toggle?.querySelector('.chat-icon');
        this.elements.closeIcon = this.elements.toggle?.querySelector('.chat-close-icon');
        this.elements.status = document.querySelector('.chat-status');
        this.elements.statusDot = document.querySelector('.status-dot');
        this.elements.suggestionBtns = document.querySelectorAll('.suggestion-btn');
    }

    validateElements() {
        const required = ['widget', 'toggle', 'window', 'messages', 'input', 'send'];
        const missing = required.filter(key => !this.elements[key]);
        
        if (missing.length > 0) {
            console.error('Elementos faltantes del chat:', missing);
            return false;
        }
        
        return true;
    }

    // ========================
    // CONFIGURACIÓN INICIAL
    // ========================
    setupInitialState() {
        // Estado inicial de la ventana
        if (this.elements.window) {
            this.elements.window.style.display = 'none';
            this.elements.window.classList.remove('active');
        }
        
        // Estado inicial del toggle
        if (this.elements.toggle) {
            this.elements.toggle.classList.remove('active');
        }
        
        // Configurar input
        this.setupInput();
        
        // Configurar botón send
        this.updateSendButton();
        
        // Configurar overlay
        this.setupOverlay();
        
        // Limpiar notificaciones existentes
        this.cleanupExistingNotifications();
    }

    setupInput() {
        if (!this.elements.input) return;
        
        // Configurar textarea auto-resize
        this.elements.input.style.height = 'auto';
        this.elements.input.style.resize = 'none';
        this.elements.input.style.overflow = 'hidden';
        
        // Placeholder dinámico
        this.setInputPlaceholder('Escribe tu consulta legal aquí...');
    }

    setupOverlay() {
        if (!this.elements.overlay) return;
        
        this.elements.overlay.style.display = 'none';
        this.elements.overlay.classList.remove('active');
    }

    cleanupExistingNotifications() {
        const existingNotifications = document.querySelectorAll('.chat-notification:not(#chat-notification)');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
    }

    // ========================
    // EVENTOS
    // ========================
    bindEvents() {
        // Toggle del chat
        if (this.elements.toggle) {
            this.elements.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.emit('toggle');
            });
        }

        // Botón minimizar
        if (this.elements.minimize) {
            this.elements.minimize.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.emit('minimize');
            });
        }

        // Botón enviar
        if (this.elements.send) {
            this.elements.send.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Input de texto
        if (this.elements.input) {
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.elements.input.addEventListener('input', () => {
                this.updateSendButton();
                this.autoResizeInput();
            });

            this.elements.input.addEventListener('paste', () => {
                setTimeout(() => {
                    this.updateSendButton();
                    this.autoResizeInput();
                }, 0);
            });
        }

        // Sugerencias
        this.elements.suggestionBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const message = btn.getAttribute('data-message');
                if (message) {
                    this.emit('suggestion', { message });
                }
            });
        });

        // Overlay (móviles)
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                e.preventDefault();
                this.emit('minimize');
            });
        }

        // Eventos globales
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // Tecla Escape para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.core.isOpen) {
                this.emit('minimize');
            }
        });

        // Prevenir clicks fuera del chat
        document.addEventListener('click', (e) => {
            if (this.core.isOpen && !this.elements.widget?.contains(e.target)) {
                // No cerrar automáticamente, solo en móviles
                if (window.innerWidth <= 480) {
                    this.emit('minimize');
                }
            }
        });

        // Resize para responsive
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // ========================
    // CONTROL DE VENTANA
    // ========================
    async open() {
        if (!this.elements.window || !this.elements.toggle) return false;
        
        try {
            // Mostrar ventana
            this.elements.window.style.display = 'flex';
            
            // Activar clases
            await this.nextFrame();
            this.elements.window.classList.add('active');
            this.elements.toggle.classList.add('active');
            
            // Iconos
            this.toggleIcons(true);
            
            // Overlay en móviles
            if (window.innerWidth <= 480) {
                this.showOverlay();
                document.body.style.overflow = 'hidden';
            }
            
            // Estados del body
            document.body.classList.add('chat-active');
            
            // Ocultar notificación
            this.hideNotification();
            
            // Focus en input
            setTimeout(() => {
                if (this.elements.input && this.core.isOpen) {
                    this.elements.input.focus();
                }
            }, this.config.animationDuration);
            
            // Scroll a bottom
            this.scrollToBottom();
            
            return true;
            
        } catch (error) {
            console.error('Error al abrir chat UI:', error);
            return false;
        }
    }

    async close() {
        if (!this.elements.window || !this.elements.toggle) return false;
        
        try {
            // Desactivar clases
            this.elements.window.classList.remove('active');
            this.elements.toggle.classList.remove('active');
            
            // Iconos
            this.toggleIcons(false);
            
            // Overlay
            this.hideOverlay();
            document.body.style.overflow = '';
            
            // Estados del body
            document.body.classList.remove('chat-active');
            
            // Ocultar ventana después de animación
            await this.delay(this.config.animationDuration);
            this.elements.window.style.display = 'none';
            
            return true;
            
        } catch (error) {
            console.error('Error al cerrar chat UI:', error);
            return false;
        }
    }

    toggleIcons(isOpen) {
        if (!this.elements.chatIcon || !this.elements.closeIcon) return;
        
        if (isOpen) {
            this.elements.chatIcon.style.display = 'none';
            this.elements.closeIcon.style.display = 'block';
        } else {
            this.elements.chatIcon.style.display = 'block';
            this.elements.closeIcon.style.display = 'none';
        }
    }

    // ========================
    // MENSAJES
    // ========================
    addMessage(message) {
        if (!this.elements.messages) return;

        const messageElement = this.createMessageElement(message);
        this.elements.messages.appendChild(messageElement);
        
        // Animar entrada
        this.animateMessageIn(messageElement);
        
        // Scroll automático
        if (this.config.autoScroll) {
            this.scrollToBottom();
        }
        
        // Ocultar sugerencias después del primer mensaje
        if (this.core.messageHistory.length > 1) {
            this.hideSuggestions();
        }
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;
        messageDiv.setAttribute('data-message-id', message.id);
        
        const avatarClass = message.sender === 'user' ? 'fa-user' : 'fa-robot';
        const time = this.formatTime(new Date(message.timestamp));
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${avatarClass}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${this.formatMessage(message.content)}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        return messageDiv;
    }

    formatMessage(message) {
        if (!message) return '';
        
        // Escapar HTML
        message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Enlaces
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        message = message.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Saltos de línea
        message = message.replace(/\n/g, '<br>');
        
        // Texto en negrita
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Texto en cursiva
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Listas
        message = message.replace(/^- (.+)$/gm, '<li>$1</li>');
        message = message.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return message;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // menos de 1 minuto
            return 'Ahora';
        } else if (diff < 3600000) { // menos de 1 hora
            const minutes = Math.floor(diff / 60000);
            return `${minutes}min`;
        } else if (date.toDateString() === now.toDateString()) { // mismo día
            return date.toLocaleTimeString('es', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('es', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    animateMessageIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.3s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 50);
    }

    clearMessages() {
        if (!this.elements.messages) return;
        
        // Mantener mensaje de bienvenida
        const welcomeMessage = this.elements.messages.querySelector('#welcome-message');
        
        this.elements.messages.innerHTML = '';
        
        if (welcomeMessage) {
            this.elements.messages.appendChild(welcomeMessage.cloneNode(true));
        }
        
        // Mostrar sugerencias de nuevo
        this.showSuggestions();
    }

    // ========================
    // INDICADORES DE ESTADO
    // ========================
    showTypingIndicator() {
        if (!this.elements.typingIndicator) return;
        
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
        
        // Animar dots
        const dots = this.elements.typingIndicator.querySelectorAll('.typing-dots span');
        dots.forEach((dot, index) => {
            dot.style.animationDelay = `${index * 0.16}s`;
        });
    }

    hideTypingIndicator() {
        if (!this.elements.typingIndicator) return;
        
        this.elements.typingIndicator.style.display = 'none';
    }

    setStatus(status, message) {
        if (!this.elements.status || !this.elements.statusDot) return;
        
        this.elements.status.innerHTML = `
            <span class="status-dot ${status}"></span>
            ${message}
        `;
        
        // Cambiar color del dot según el status
        const statusColors = {
            online: '#48bb78',
            offline: '#cbd5e0',
            busy: '#ed8936',
            away: '#ecc94b'
        };
        
        if (statusColors[status]) {
            this.elements.statusDot.style.background = statusColors[status];
        }
    }

    // ========================
    // INPUT Y ENVÍO
    // ========================
    sendMessage() {
        const message = this.getInputValue();
        if (!message?.trim()) return;
        
        this.emit('message', message);
        this.clearInput();
        this.updateSendButton();
    }

    getInputValue() {
        return this.elements.input?.value || '';
    }

    setInputValue(value) {
        if (this.elements.input) {
            this.elements.input.value = value;
            this.updateSendButton();
            this.autoResizeInput();
        }
    }

    clearInput() {
        this.setInputValue('');
    }

    setInputPlaceholder(placeholder) {
        if (this.elements.input) {
            this.elements.input.placeholder = placeholder;
        }
    }

    updateSendButton() {
        if (!this.elements.send || !this.elements.input) return;
        
        const hasText = this.elements.input.value.trim().length > 0;
        this.elements.send.disabled = !hasText;
        
        // Cambiar estilo visual
        if (hasText) {
            this.elements.send.classList.add('active');
        } else {
            this.elements.send.classList.remove('active');
        }
    }

    autoResizeInput() {
        if (!this.elements.input) return;
        
        this.elements.input.style.height = 'auto';
        const scrollHeight = this.elements.input.scrollHeight;
        const maxHeight = 100; // máximo en pixels
        
        this.elements.input.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        
        // Scroll si excede el máximo
        if (scrollHeight > maxHeight) {
            this.elements.input.style.overflowY = 'auto';
        } else {
            this.elements.input.style.overflowY = 'hidden';
        }
    }

    // ========================
    // SUGERENCIAS
    // ========================
    showSuggestions() {
        if (!this.elements.suggestions) return;
        
        this.elements.suggestions.style.display = 'flex';
        this.elements.suggestions.style.opacity = '1';
        this.elements.suggestions.style.transform = 'translateY(0)';
    }

    hideSuggestions() {
        if (!this.elements.suggestions) return;
        
        this.elements.suggestions.style.transition = 'all 0.3s ease';
        this.elements.suggestions.style.opacity = '0';
        this.elements.suggestions.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.elements.suggestions.style.display = 'none';
        }, 300);
    }

    // ========================
    // NOTIFICACIONES
    // ========================
    showWelcomeNotification() {
        if (!this.elements.notification || this.core.isOpen) return;
        
        this.elements.notification.style.display = 'block';
        this.elements.notification.style.opacity = '0';
        this.elements.notification.style.transform = 'translateY(10px) scale(0.8)';
        
        setTimeout(() => {
            this.elements.notification.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            this.elements.notification.style.opacity = '1';
            this.elements.notification.style.transform = 'translateY(0) scale(1)';
        }, 100);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        if (!this.elements.notification) return;
        
        this.elements.notification.style.opacity = '0';
        this.elements.notification.style.transform = 'translateY(-10px) scale(0.8)';
        
        setTimeout(() => {
            this.elements.notification.style.display = 'none';
        }, 500);
    }

    // ========================
    // OVERLAY
    // ========================
    showOverlay() {
        if (!this.elements.overlay) return;
        
        this.elements.overlay.style.display = 'block';
        this.elements.overlay.classList.add('active');
    }

    hideOverlay() {
        if (!this.elements.overlay) return;
        
        this.elements.overlay.classList.remove('active');
        
        setTimeout(() => {
            this.elements.overlay.style.display = 'none';
        }, 300);
    }

    // ========================
    // SCROLL
    // ========================
    scrollToBottom() {
        if (!this.elements.messages) return;
        
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 100);
    }

    // ========================
    // RESPONSIVE
    // ========================
    handleResize() {
        // Ajustar overlay en móviles
        if (this.core.isOpen) {
            if (window.innerWidth <= 480) {
                this.showOverlay();
                document.body.style.overflow = 'hidden';
            } else {
                this.hideOverlay();
                document.body.style.overflow = '';
            }
        }
        
        // Reajustar input
        this.autoResizeInput();
    }

    // ========================
    // ESTADOS DE CONTROL
    // ========================
    pause() {
        // Deshabilitar interacciones
        if (this.elements.input) {
            this.elements.input.disabled = true;
        }
        if (this.elements.send) {
            this.elements.send.disabled = true;
        }
        if (this.elements.toggle) {
            this.elements.toggle.style.pointerEvents = 'none';
        }
    }

    resume() {
        // Habilitar interacciones
        if (this.elements.input) {
            this.elements.input.disabled = false;
        }
        this.updateSendButton();
        if (this.elements.toggle) {
            this.elements.toggle.style.pointerEvents = '';
        }
    }

    // ========================
    // UTILIDADES
    // ========================
    async nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================
    // EVENTOS
    // ========================
    emit(eventName, data = {}) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en UI event listener ${eventName}:`, error);
                }
            });
        }
    }

    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    off(eventName, callback) {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(callback);
            if (index > -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
    }

    // ========================
    // DIAGNÓSTICO
    // ========================
    diagnose() {
        const elementsStatus = {};
        Object.keys(this.elements).forEach(key => {
            elementsStatus[key] = !!this.elements[key];
        });
        
        return {
            initialized: this.isInitialized,
            elements: elementsStatus,
            config: this.config,
            windowDimensions: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    // ========================
    // CLEANUP
    // ========================
    destroy() {
        try {
            // Limpiar animaciones
            this.animations.forEach(animation => {
                if (animation.cancel) {
                    animation.cancel();
                }
            });
            this.animations.clear();
            
            // Limpiar elementos
            Object.keys(this.elements).forEach(key => {
                this.elements[key] = null;
            });
            
            // Limpiar eventos
            Object.keys(this.eventListeners).forEach(eventName => {
                this.eventListeners[eventName] = [];
            });
            
            // Restaurar body
            document.body.classList.remove('chat-active');
            document.body.style.overflow = '';
            
            console.log('🎨 Chat UI destroyed');
            
        } catch (error) {
            console.error('Error destroying Chat UI:', error);
        }
    }
}

export default ChatUI;