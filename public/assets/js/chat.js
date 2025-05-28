/**
 * CHAT WIDGET JURÍDICO - JAVASCRIPT
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
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupChat());
        } else {
            this.setupChat();
        }
    }

    setupChat() {
        this.initializeElements();
        this.bindEvents();
        this.showWelcomeNotification();
        
        console.log('🤖 Chat Widget Jurídico inicializado');
    }

    initializeElements() {
        this.chatWidget = document.getElementById('chat-widget');
        this.chatToggle = document.getElementById('chat-toggle');
        this.chatWindow = document.getElementById('chat-window');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSend = document.getElementById('chat-send');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.chatOverlay = document.getElementById('chat-overlay');
        
        if (!this.chatWidget) {
            console.error('Chat widget no encontrado. Asegúrate de añadir el HTML del chat.');
            return;
        }
    }

    bindEvents() {
        // Toggle del chat
        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', () => this.toggleChat());
        }

        // Minimizar chat
        const minimizeBtn = document.getElementById('chat-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.closeChat());
        }

        // Enviar mensaje
        if (this.chatSend) {
            this.chatSend.addEventListener('click', () => this.sendMessage());
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
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                this.chatInput.value = message;
                this.sendMessage();
            });
        });

        // Overlay para móviles
        if (this.chatOverlay) {
            this.chatOverlay.addEventListener('click', () => this.closeChat());
        }

        // Cerrar con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showWelcomeNotification() {
        const notification = document.getElementById('chat-notification');
        if (notification) {
            setTimeout(() => {
                notification.style.display = 'block';
            }, 2000);
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 7000);
        }
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        if (!this.chatWindow) return;
        
        this.isOpen = true;
        this.chatWindow.classList.add('active');
        this.chatToggle.classList.add('active');
        
        // Mostrar ícono de cerrar
        const chatIcon = this.chatToggle.querySelector('.chat-icon');
        const closeIcon = this.chatToggle.querySelector('.chat-close-icon');
        if (chatIcon && closeIcon) {
            chatIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        }

        // Overlay en móviles
        if (window.innerWidth <= 480 && this.chatOverlay) {
            this.chatOverlay.classList.add('active');
        }

        // Ocultar notificación
        const notification = document.getElementById('chat-notification');
        if (notification) {
            notification.style.display = 'none';
        }

        // Focus en input
        setTimeout(() => {
            if (this.chatInput) {
                this.chatInput.focus();
            }
        }, 300);

        this.scrollToBottom();
    }

    closeChat() {
        if (!this.chatWindow) return;
        
        this.isOpen = false;
        this.chatWindow.classList.remove('active');
        this.chatToggle.classList.remove('active');
        
        // Mostrar ícono de chat
        const chatIcon = this.chatToggle.querySelector('.chat-icon');
        const closeIcon = this.chatToggle.querySelector('.chat-close-icon');
        if (chatIcon && closeIcon) {
            chatIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }

        // Quitar overlay
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

        // Animar entrada del mensaje
        setTimeout(() => {
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
            suggestions.style.display = 'none';
        }
    }

    // Método público para enviar mensajes programáticamente
    sendProgrammaticMessage(message) {
        if (this.chatInput) {
            this.chatInput.value = message;
            this.sendMessage();
        }
    }

    // Método para obtener el historial de mensajes
    getMessageHistory() {
        return this.messageHistory;
    }

    // Método para limpiar el chat
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
        }
    }

    // Método para cambiar el estado del chat
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

    // Método de diagnóstico
    diagnose() {
        console.log('🔍 Diagnóstico del Chat Widget:');
        console.log('- Webhook URL:', this.webhookUrl);
        console.log('- Session ID:', this.sessionId);
        console.log('- Chat abierto:', this.isOpen);
        console.log('- Escribiendo:', this.isTyping);
        console.log('- Mensajes en historial:', this.messageHistory.length);
        console.log('- Elementos DOM:', {
            chatWidget: !!this.chatWidget,
            chatToggle: !!this.chatToggle,
            chatWindow: !!this.chatWindow,
            chatMessages: !!this.chatMessages,
            chatInput: !!this.chatInput,
            chatSend: !!this.chatSend
        });
    }
}

// Inicializar el chat cuando se carga la página
let legalChat;

// Función de inicialización global
function initializeLegalChat() {
    legalChat = new LegalChatWidget();
    
    // Hacer disponible globalmente para debugging
    window.legalChat = legalChat;
}

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLegalChat);
} else {
    initializeLegalChat();
}

// Funciones de utilidad globales
window.chatUtils = {
    // Abrir chat programáticamente
    openChat: () => legalChat?.openChat(),
    
    // Cerrar chat programáticamente
    closeChat: () => legalChat?.closeChat(),
    
    // Enviar mensaje programáticamente
    sendMessage: (message) => legalChat?.sendProgrammaticMessage(message),
    
    // Limpiar chat
    clearChat: () => legalChat?.clearChat(),
    
    // Obtener historial
    getHistory: () => legalChat?.getMessageHistory() || [],
    
    // Diagnóstico
    diagnose: () => legalChat?.diagnose()
};

// Export para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LegalChatWidget;
}