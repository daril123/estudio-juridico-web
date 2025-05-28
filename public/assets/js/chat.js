/**
 * CHAT WIDGET JURÍDICO - JAVASCRIPT CORREGIDO
 * Integración con n8n webhook para asistente legal IA
 */

class LegalChatWidget {
    constructor() {
        // Configuración de la webhook
        this.webhookUrl = 'https://singular-dear-jaybird.ngrok-free.app/webhook-test/cfa4d4c3-0f1c-49bc-b1f9-4d5c4b719b44';
        
        // Estado del chat
        this.isOpen = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.sessionId = this.generateSessionId();
        this.isInitialized = false; // ✅ PREVENIR DOBLE INICIALIZACIÓN
        
        // Elementos del DOM
        this.chatWidget = null;
        this.chatToggle = null;
        this.chatWindow = null;
        this.chatMessages = null;
        this.chatInput = null;
        this.chatSend = null;
        this.typingIndicator = null;
        this.chatOverlay = null;
        
        this.init();
    }

    init() {
        // ✅ PREVENIR DOBLE INICIALIZACIÓN
        if (this.isInitialized) {
            console.warn('Chat widget ya está inicializado');
            return;
        }

        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupChat());
        } else {
            this.setupChat();
        }
    }

    setupChat() {
        // ✅ VERIFICAR SI YA EXISTE UNA INSTANCIA
        if (window.legalChatInstance) {
            console.warn('Ya existe una instancia del chat');
            return;
        }

        // ✅ LIMPIAR CUALQUIER CHAT WIDGET EXISTENTE
        this.cleanupExistingChat();
        
        this.initializeElements();
        
        // ✅ VERIFICAR QUE LOS ELEMENTOS EXISTEN
        if (!this.validateElements()) {
            console.error('No se pudieron inicializar todos los elementos del chat');
            return;
        }
        
        this.bindEvents();
        this.setupNotificationSystem();
        this.isInitialized = true;
        
        // ✅ REGISTRAR INSTANCIA GLOBAL
        window.legalChatInstance = this;
        
        console.log('🤖 Chat Widget Jurídico inicializado correctamente');
    }

    // ✅ LIMPIAR ELEMENTOS DUPLICADOS
    cleanupExistingChat() {
        // Remover notificaciones existentes
        const existingNotifications = document.querySelectorAll('.chat-notification');
        existingNotifications.forEach(notification => {
            if (notification.parentElement) {
                notification.remove();
            }
        });

        // Limpiar overlays duplicados
        const existingOverlays = document.querySelectorAll('.chat-overlay');
        if (existingOverlays.length > 1) {
            for (let i = 1; i < existingOverlays.length; i++) {
                existingOverlays[i].remove();
            }
        }
    }

    initializeElements() {
        // ✅ USAR QUERYSELECTOR MÁS ESPECÍFICO
        this.chatWidget = document.querySelector('#chat-widget');
        this.chatToggle = document.querySelector('#chat-toggle');
        this.chatWindow = document.querySelector('#chat-window');
        this.chatMessages = document.querySelector('#chat-messages');
        this.chatInput = document.querySelector('#chat-input');
        this.chatSend = document.querySelector('#chat-send');
        this.typingIndicator = document.querySelector('#typing-indicator');
        this.chatOverlay = document.querySelector('#chat-overlay');
    }

    // ✅ VALIDAR QUE TODOS LOS ELEMENTOS EXISTEN
    validateElements() {
        const requiredElements = [
            'chatWidget', 'chatToggle', 'chatWindow', 
            'chatMessages', 'chatInput', 'chatSend'
        ];
        
        const missingElements = requiredElements.filter(element => !this[element]);
        
        if (missingElements.length > 0) {
            console.error('Elementos faltantes:', missingElements);
            return false;
        }
        
        return true;
    }

    bindEvents() {
        // ✅ USAR ADDEVENTLISTENER CON OPCIONES
        const eventOptions = { passive: false };

        // Toggle del chat
        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleChat();
            }, eventOptions);
        }

        // Minimizar chat
        const minimizeBtn = document.getElementById('chat-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeChat();
            }, eventOptions);
        }

        // Enviar mensaje
        if (this.chatSend) {
            this.chatSend.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            }, eventOptions);
        }

        // Input del chat
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.chatInput.addEventListener('input', () => {
                this.toggleSendButton();
                this.autoResize();
            });
        }

        // Sugerencias
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const message = btn.getAttribute('data-message');
                if (this.chatInput) {
                    this.chatInput.value = message;
                    this.sendMessage();
                }
            });
        });

        // Overlay para móviles
        if (this.chatOverlay) {
            this.chatOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeChat();
            });
        }

        // ✅ CERRAR CON TECLA ESCAPE
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });

        // ✅ PREVENIR CONFLICTOS CON OTROS CLICKS
        if (this.chatWidget) {
            this.chatWidget.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ✅ MEJORAR SISTEMA DE NOTIFICACIONES
    setupNotificationSystem() {
        setTimeout(() => {
            this.showWelcomeNotification();
        }, 2000);
    }

    showWelcomeNotification() {
        const notification = document.getElementById('chat-notification');
        if (notification && !this.isOpen) {
            notification.style.display = 'block';
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px) scale(0.8)';
            
            // ✅ ANIMACIÓN MEJORADA
            setTimeout(() => {
                notification.style.transition = 'all 0.5s ease';
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0) scale(1)';
            }, 100);
            
            // ✅ OCULTAR DESPUÉS DE 5 SEGUNDOS
            setTimeout(() => {
                if (notification && !this.isOpen) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(-10px) scale(0.8)';
                    setTimeout(() => {
                        if (notification) {
                            notification.style.display = 'none';
                        }
                    }, 500);
                }
            }, 5000);
        }
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    // ✅ MÉTODO OPENCHAT MEJORADO
    openChat() {
        if (!this.chatWindow || this.isOpen) return;
        
        this.isOpen = true;
        
        // ✅ PREVENIR CONFLICTOS DE ESTILO
        document.body.classList.add('chat-active');
        
        this.chatWindow.classList.add('active');
        this.chatToggle.classList.add('active');
        
        // Mostrar ícono de cerrar
        const chatIcon = this.chatToggle.querySelector('.chat-icon');
        const closeIcon = this.chatToggle.querySelector('.chat-close-icon');
        if (chatIcon && closeIcon) {
            chatIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        }

        // ✅ OVERLAY MEJORADO EN MÓVILES
        if (window.innerWidth <= 480 && this.chatOverlay) {
            this.chatOverlay.classList.add('active');
            // ✅ PREVENIR SCROLL DEL BODY EN MÓVIL
            document.body.style.overflow = 'hidden';
        }

        // Ocultar notificación
        const notification = document.getElementById('chat-notification');
        if (notification) {
            notification.style.display = 'none';
        }

        // ✅ FOCUS MEJORADO
        setTimeout(() => {
            if (this.chatInput && this.isOpen) {
                this.chatInput.focus();
            }
        }, 300);

        this.scrollToBottom();
    }

    // ✅ MÉTODO CLOSECHAT MEJORADO
    closeChat() {
        if (!this.chatWindow || !this.isOpen) return;
        
        this.isOpen = false;
        
        // ✅ LIMPIAR CLASES DEL BODY
        document.body.classList.remove('chat-active');
        document.body.style.overflow = ''; // ✅ RESTAURAR SCROLL
        
        this.chatWindow.classList.remove('active');
        this.chatToggle.classList.remove('active');
        
        // Mostrar ícono de chat
        const chatIcon = this.chatToggle.querySelector('.chat-icon');
        const closeIcon = this.chatToggle.querySelector('.chat-close-icon');
        if (chatIcon && closeIcon) {
            chatIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }

        // ✅ QUITAR OVERLAY CORRECTAMENTE
        if (this.chatOverlay) {
            this.chatOverlay.classList.remove('active');
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;

        // Añadir mensaje del usuario
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.toggleSendButton();
        this.autoResize();

        // Ocultar sugerencias después del primer mensaje
        this.hideSuggestions();

        // Mostrar indicador de escritura
        this.showTypingIndicator();

        try {
            // Enviar a la webhook
            const response = await this.sendToWebhook(message);
            
            // Ocultar indicador de escritura
            this.hideTypingIndicator();
            
            // Añadir respuesta del bot
            if (response && response.reply) {
                this.addMessage(response.reply, 'bot');
            } else {
                this.addMessage('Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta nuevamente o contacta directamente con nuestro equipo.', 'bot');
            }
            
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            this.hideTypingIndicator();
            this.addMessage('Disculpa, hay un problema de conexión. Por favor intenta más tarde o contacta directamente con nosotros al teléfono (01) 234-5678.', 'bot');
        }
    }

    async sendToWebhook(message) {
        const payload = {
            message: message,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            messageHistory: this.messageHistory.slice(-5) // Últimos 5 mensajes para contexto
        };

        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LegalChatWidget/1.0'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    addMessage(message, sender) {
        if (!this.chatMessages) return;

        // Guardar en historial
        this.messageHistory.push({
            message: message,
            sender: sender,
            timestamp: new Date().toISOString()
        });

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const avatarClass = sender === 'user' ? 'fa-user' : 'fa-robot';
        const time = this.formatTime(new Date());
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${avatarClass}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${this.formatMessage(message)}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();

        // ✅ ANIMAR ENTRADA DEL MENSAJE
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);
    }

    formatMessage(message) {
        // Convertir URLs en enlaces
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        message = message.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convertir saltos de línea
        message = message.replace(/\n/g, '<br>');
        
        // Convertir **texto** en negrita
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convertir *texto* en cursiva
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return message;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Menos de 1 minuto
            return 'Ahora';
        } else if (diff < 3600000) { // Menos de 1 hora
            const minutes = Math.floor(diff / 60000);
            return `${minutes}min`;
        } else if (date.toDateString() === now.toDateString()) { // Mismo día
            return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
        }
    }

    showTypingIndicator() {
        if (!this.typingIndicator) return;
        
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        if (!this.typingIndicator) return;
        
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
    }

    toggleSendButton() {
        if (!this.chatSend || !this.chatInput) return;
        
        const hasText = this.chatInput.value.trim().length > 0;
        this.chatSend.disabled = !hasText;
    }

    autoResize() {
        if (!this.chatInput) return;
        
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 100) + 'px';
    }

    scrollToBottom() {
        if (!this.chatMessages) return;
        
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    hideSuggestions() {
        const suggestions = document.getElementById('chat-suggestions');
        if (suggestions && this.messageHistory.length > 0) {
            suggestions.style.transition = 'all 0.3s ease';
            suggestions.style.opacity = '0';
            suggestions.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                suggestions.style.display = 'none';
            }, 300);
        }
    }

    // ✅ MÉTODOS PÚBLICOS PARA API
    sendProgrammaticMessage(message) {
        if (this.chatInput) {
            this.chatInput.value = message;
            this.sendMessage();
        }
    }

    getMessageHistory() {
        return this.messageHistory;
    }

    clearChat() {
        if (this.chatMessages) {
            // Mantener solo el mensaje de bienvenida
            const welcomeMessage = document.getElementById('welcome-message');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage.cloneNode(true));
            }
        }
        this.messageHistory = [];
        
        // Mostrar sugerencias de nuevo
        const suggestions = document.getElementById('chat-suggestions');
        if (suggestions) {
            suggestions.style.display = 'flex';
            suggestions.style.opacity = '1';
            suggestions.style.transform = 'translateY(0)';
        }
    }

    setStatus(status, message) {
        const statusElement = document.querySelector('.chat-status');
        const statusDot = document.querySelector('.status-dot');
        
        if (statusElement && statusDot) {
            statusElement.innerHTML = `
                <span class="status-dot ${status}"></span>
                ${message}
            `;
        }
    }

    // ✅ MÉTODO DE DIAGNÓSTICO
    diagnose() {
        console.log('🔍 Diagnóstico del Chat Widget:');
        console.log('- Webhook URL:', this.webhookUrl);
        console.log('- Session ID:', this.sessionId);
        console.log('- Chat abierto:', this.isOpen);
        console.log('- Escribiendo:', this.isTyping);
        console.log('- Inicializado:', this.isInitialized);
        console.log('- Mensajes en historial:', this.messageHistory.length);
        console.log('- Elementos DOM:', {
            chatWidget: !!this.chatWidget,
            chatToggle: !!this.chatToggle,
            chatWindow: !!this.chatWindow,
            chatMessages: !!this.chatMessages,
            chatInput: !!this.chatInput,
            chatSend: !!this.chatSend,
            chatOverlay: !!this.chatOverlay
        });
        console.log('- Z-index del widget:', this.chatWidget ? getComputedStyle(this.chatWidget).zIndex : 'N/A');
    }
}

// ✅ INICIALIZAR EL CHAT DE FORMA SEGURA
let legalChat;

function initializeLegalChat() {
    // ✅ VERIFICAR SI YA EXISTE
    if (window.legalChatInstance) {
        console.warn('Chat ya inicializado');
        return;
    }
    
    try {
        legalChat = new LegalChatWidget();
        window.legalChat = legalChat;
        window.legalChatInstance = legalChat;
        console.log('✅ Chat widget inicializado exitosamente');
    } catch (error) {
        console.error('❌ Error al inicializar chat widget:', error);
    }
}

// ✅ AUTO-INICIALIZAR UNA SOLA VEZ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLegalChat);
} else {
    // ✅ USAR SETTIMEOUT PARA EVITAR CONFLICTOS CON OTROS SCRIPTS
    setTimeout(initializeLegalChat, 100);
}

// ✅ FUNCIONES DE UTILIDAD GLOBALES
window.chatUtils = {
    // Abrir chat programáticamente
    openChat: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.openChat();
        } else {
            console.warn('Chat no inicializado');
        }
    },
    
    // Cerrar chat programáticamente
    closeChat: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.closeChat();
        }
    },
    
    // Enviar mensaje programáticamente
    sendMessage: (message) => {
        if (window.legalChatInstance) {
            window.legalChatInstance.sendProgrammaticMessage(message);
        }
    },
    
    // Limpiar chat
    clearChat: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.clearChat();
        }
    },
    
    // Obtener historial
    getHistory: () => {
        return window.legalChatInstance ? window.legalChatInstance.getMessageHistory() : [];
    },
    
    // Diagnóstico
    diagnose: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.diagnose();
        } else {
            console.warn('Chat no inicializado para diagnóstico');
        }
    },

    // ✅ VERIFICAR ESTADO
    isReady: () => {
        return !!(window.legalChatInstance && window.legalChatInstance.isInitialized);
    }
};

// ✅ EXPORT PARA USO EN OTROS MÓDULOS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LegalChatWidget;
}