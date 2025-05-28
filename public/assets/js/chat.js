/**
 * CHAT WIDGET JURÍDICO - COMPATIBLE CON N8N
 * Maneja específicamente las respuestas de n8n webhook
 */

class LegalChatWidget {
    constructor() {
        // Configuración de la webhook
        this.webhookUrl = 'https://singular-dear-jaybird.ngrok-free.app/webhook/cfa4d4c3-0f1c-49bc-b1f9-4d5c4b719b44';
        
        // Estado del chat
        this.isOpen = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.sessionId = this.generateSessionId();
        this.isInitialized = false;
        
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
        if (this.isInitialized) {
            console.warn('Chat widget ya está inicializado');
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupChat());
        } else {
            this.setupChat();
        }
    }

    setupChat() {
        if (window.legalChatInstance) {
            console.warn('Ya existe una instancia del chat');
            return;
        }

        this.cleanupExistingChat();
        this.initializeElements();
        
        if (!this.validateElements()) {
            console.error('No se pudieron inicializar todos los elementos del chat');
            return;
        }
        
        this.bindEvents();
        this.setupNotificationSystem();
        this.isInitialized = true;
        
        window.legalChatInstance = this;
        
        console.log('🤖 Chat Widget Jurídico inicializado correctamente');
    }

    cleanupExistingChat() {
        const existingNotifications = document.querySelectorAll('.chat-notification');
        existingNotifications.forEach(notification => {
            if (notification.parentElement) {
                notification.remove();
            }
        });

        const existingOverlays = document.querySelectorAll('.chat-overlay');
        if (existingOverlays.length > 1) {
            for (let i = 1; i < existingOverlays.length; i++) {
                existingOverlays[i].remove();
            }
        }
    }

    initializeElements() {
        this.chatWidget = document.querySelector('#chat-widget');
        this.chatToggle = document.querySelector('#chat-toggle');
        this.chatWindow = document.querySelector('#chat-window');
        this.chatMessages = document.querySelector('#chat-messages');
        this.chatInput = document.querySelector('#chat-input');
        this.chatSend = document.querySelector('#chat-send');
        this.typingIndicator = document.querySelector('#typing-indicator');
        this.chatOverlay = document.querySelector('#chat-overlay');
    }

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
        const eventOptions = { passive: false };

        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleChat();
            }, eventOptions);
        }

        const minimizeBtn = document.getElementById('chat-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeChat();
            }, eventOptions);
        }

        if (this.chatSend) {
            this.chatSend.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            }, eventOptions);
        }

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

        if (this.chatOverlay) {
            this.chatOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeChat();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });

        if (this.chatWidget) {
            this.chatWidget.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

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
            
            setTimeout(() => {
                notification.style.transition = 'all 0.5s ease';
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0) scale(1)';
            }, 100);
            
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

    openChat() {
        if (!this.chatWindow || this.isOpen) return;
        
        this.isOpen = true;
        
        document.body.classList.add('chat-active');
        
        this.chatWindow.classList.add('active');
        this.chatToggle.classList.add('active');
        
        const chatIcon = this.chatToggle.querySelector('.chat-icon');
        const closeIcon = this.chatToggle.querySelector('.chat-close-icon');
        if (chatIcon && closeIcon) {
            chatIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        }

        if (window.innerWidth <= 480 && this.chatOverlay) {
            this.chatOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        const notification = document.getElementById('chat-notification');
        if (notification) {
            notification.style.display = 'none';
        }

        setTimeout(() => {
            if (this.chatInput && this.isOpen) {
                this.chatInput.focus();
            }
        }, 300);

        this.scrollToBottom();
    }

    closeChat() {
        if (!this.chatWindow || !this.isOpen) return;
        
        this.isOpen = false;
        
        document.body.classList.remove('chat-active');
        document.body.style.overflow = '';
        
        this.chatWindow.classList.remove('active');
        this.chatToggle.classList.remove('active');
        
        const chatIcon = this.chatToggle.querySelector('.chat-icon');
        const closeIcon = this.chatToggle.querySelector('.chat-close-icon');
        if (chatIcon && closeIcon) {
            chatIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }

        if (this.chatOverlay) {
            this.chatOverlay.classList.remove('active');
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;

        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.toggleSendButton();
        this.autoResize();

        this.hideSuggestions();
        this.showTypingIndicator();

        try {
            const response = await this.sendToWebhook(message);
            
            this.hideTypingIndicator();
            
            // 🔥 MANEJO ESPECÍFICO PARA N8N
            let botReply = this.extractMessageFromN8nResponse(response);
            
            if (botReply) {
                this.addMessage(botReply, 'bot');
            } else {
                console.log('No se pudo extraer mensaje de la respuesta:', response);
                this.addMessage('Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta nuevamente o contacta directamente con nuestro equipo.', 'bot');
            }
            
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            this.hideTypingIndicator();
            this.addMessage('Disculpa, hay un problema de conexión. Por favor intenta más tarde o contacta directamente con nosotros al teléfono (01) 234-5678.', 'bot');
        }
    }

    // 🔥 MÉTODO ESPECÍFICO PARA EXTRAER MENSAJE DE RESPUESTA N8N
    extractMessageFromN8nResponse(response) {
        console.log('🔍 Analizando respuesta de n8n:', response);
        
        if (!response) {
            console.log('❌ Respuesta vacía');
            return null;
        }

        let message = '';

        try {
            // 🔥 NUEVO: Si la respuesta es directamente un string
            if (typeof response === 'string') {
                message = response.trim();
                console.log('✅ Mensaje extraído como string directo:', message);
                return this.cleanMessage(message);
            }

            // Resto del código para manejar estructuras JSON...
            if (response.response && response.response.body) {
                message = response.response.body;
                console.log('✅ Mensaje extraído de response.response.body:', message);
            }
            else if (Array.isArray(response) && response.length > 0) {
                const firstItem = response[0];
                if (firstItem.response && firstItem.response.body) {
                    message = firstItem.response.body;
                    console.log('✅ Mensaje extraído de array[0].response.body:', message);
                } else if (firstItem.body) {
                    message = firstItem.body;
                    console.log('✅ Mensaje extraído de array[0].body:', message);
                } else if (firstItem.message) {
                    message = firstItem.message;
                    console.log('✅ Mensaje extraído de array[0].message:', message);
                } else if (typeof firstItem === 'string') {
                    message = firstItem;
                    console.log('✅ Mensaje extraído de array[0] como string:', message);
                }
            }
            else if (response.body) {
                message = response.body;
                console.log('✅ Mensaje extraído de response.body:', message);
            }
            else if (response.message) {
                message = response.message;
                console.log('✅ Mensaje extraído de response.message:', message);
            }
            else if (response.reply) {
                message = response.reply;
                console.log('✅ Mensaje extraído de response.reply:', message);
            }
            else if (response.text) {
                message = response.text;
                console.log('✅ Mensaje extraído de response.text:', message);
            }
            else {
                // Buscar recursivamente en el objeto
                message = this.findMessageInObject(response);
                if (message) {
                    console.log('✅ Mensaje encontrado recursivamente:', message);
                }
            }

            if (message) {
                return this.cleanMessage(message);
            }

        } catch (error) {
            console.error('❌ Error al procesar respuesta:', error);
        }

        console.log('❌ No se pudo extraer mensaje de la respuesta');
        return null;
    }
    cleanMessage(message) {
        if (!message) return '';
        
        // Remover saltos de línea al inicio y final
        message = message.replace(/^[\n\r\s]+|[\n\r\s]+$/g, '');
        // Convertir \\n en saltos de línea reales
        message = message.replace(/\\n/g, '\n');
        // Limpiar caracteres de escape innecesarios
        message = message.replace(/\\"/g, '"');
        
        console.log('✅ Mensaje final limpiado:', message);
        return message;
    }
    // Método auxiliar para buscar mensaje recursivamente en cualquier objeto
    findMessageInObject(obj, depth = 0) {
        if (depth > 5) return null; // Evitar recursión infinita
        
        if (typeof obj === 'string' && obj.length > 0) {
            return obj;
        }
        
        if (typeof obj === 'object' && obj !== null) {
            // Palabras clave que probablemente contengan el mensaje
            const messageKeys = ['body', 'message', 'reply', 'text', 'content', 'response', 'data'];
            
            for (const key of messageKeys) {
                if (obj[key]) {
                    if (typeof obj[key] === 'string') {
                        return obj[key];
                    } else if (typeof obj[key] === 'object') {
                        const found = this.findMessageInObject(obj[key], depth + 1);
                        if (found) return found;
                    }
                }
            }
            
            // Si no encontramos con las claves conocidas, buscar en todas las propiedades
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const found = this.findMessageInObject(obj[key], depth + 1);
                    if (found) return found;
                }
            }
        }
        
        return null;
    }

    async sendToWebhook(message) {
        const payload = {
            message: message,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            messageHistory: this.messageHistory.slice(-5)
        };

        console.log('📤 Enviando payload a n8n:', payload);

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

        // 🔥 NUEVO: Intentar JSON primero, si falla usar texto plano
        let data;
        const responseText = await response.text();
        console.log('📥 Respuesta cruda recibida:', responseText);

        try {
            // Intentar parsear como JSON
            data = JSON.parse(responseText);
            console.log('📥 Respuesta parseada como JSON:', data);
        } catch (jsonError) {
            // Si no es JSON válido, usar el texto directamente
            console.log('📥 No es JSON válido, usando texto plano:', responseText);
            data = responseText;
        }
        
        return data;
    }

    addMessage(message, sender) {
        if (!this.chatMessages) return;

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

        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);
    }

    formatMessage(message) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        message = message.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        message = message.replace(/\n/g, '<br>');
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return message;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'Ahora';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}min`;
        } else if (date.toDateString() === now.toDateString()) {
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

    // Métodos públicos para API
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
            const welcomeMessage = document.getElementById('welcome-message');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage.cloneNode(true));
            }
        }
        this.messageHistory = [];
        
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

// Inicializar el chat de forma segura
let legalChat;

function initializeLegalChat() {
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLegalChat);
} else {
    setTimeout(initializeLegalChat, 100);
}

// Funciones de utilidad globales
window.chatUtils = {
    openChat: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.openChat();
        } else {
            console.warn('Chat no inicializado');
        }
    },
    
    closeChat: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.closeChat();
        }
    },
    
    sendMessage: (message) => {
        if (window.legalChatInstance) {
            window.legalChatInstance.sendProgrammaticMessage(message);
        }
    },
    
    clearChat: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.clearChat();
        }
    },
    
    getHistory: () => {
        return window.legalChatInstance ? window.legalChatInstance.getMessageHistory() : [];
    },
    
    diagnose: () => {
        if (window.legalChatInstance) {
            window.legalChatInstance.diagnose();
        } else {
            console.warn('Chat no inicializado para diagnóstico');
        }
    },

    isReady: () => {
        return !!(window.legalChatInstance && window.legalChatInstance.isInitialized);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LegalChatWidget;
}