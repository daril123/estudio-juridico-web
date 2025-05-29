// Chat Widget Jurídico
class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Elementos principales
        this.widget = document.getElementById('chat-widget');
        this.toggle = document.getElementById('chat-toggle');
        this.window = document.getElementById('chat-window');
        this.messages = document.getElementById('chat-messages');
        this.minimize = document.getElementById('chat-minimize');
        this.notification = document.getElementById('chat-notification');
        this.input = document.getElementById('chat-input');
        this.send = document.getElementById('chat-send');
        this.suggestions = document.getElementById('chat-suggestions');

        // Crear overlay si no existe
        if (!document.getElementById('chat-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'chat-overlay';
            this.overlay.className = 'chat-overlay';
            document.body.appendChild(this.overlay);
        } else {
            this.overlay = document.getElementById('chat-overlay');
        }
    }

    bindEvents() {
        // Toggle del chat
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleChat();
        });

        // Minimizar chat
        this.minimize.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });

        // Cerrar con overlay en móviles
        this.overlay.addEventListener('click', () => {
            if (window.innerWidth <= 575) {
                this.close();
            }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Input y envío de mensajes
        if (this.input) {
            this.input.addEventListener('input', () => {
                this.updateSendButton();
                this.autoResizeInput();
            });

            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Botón enviar
        if (this.send) {
            this.send.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Sugerencias
        if (this.suggestions) {
            this.suggestions.querySelectorAll('.suggestion-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const message = btn.getAttribute('data-message');
                    if (message) {
                        this.input.value = message;
                        this.updateSendButton();
                        this.sendMessage();
                    }
                });
            });
        }
    }

    updateSendButton() {
        if (this.send && this.input) {
            this.send.disabled = !this.input.value.trim();
        }
    }

    autoResizeInput() {
        if (this.input) {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
        }
    }

    sendMessage() {
        if (!this.input || !this.input.value.trim()) return;

        const message = this.input.value.trim();
        this.input.value = '';
        this.updateSendButton();
        this.autoResizeInput();

        // Enviar mensaje a través de la IA
        if (window.chatAI) {
            window.chatAI.sendMessage(message);
        }
    }

    toggleChat() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;

        // Mostrar ventana
        this.window.style.display = 'flex';
        this.window.classList.add('active');
        this.toggle.classList.add('active');
        
        // Mostrar overlay en móviles
        if (window.innerWidth <= 575) {
            this.overlay.classList.add('active');
            document.body.classList.add('chat-active');
        }

        // Ocultar notificación
        if (this.notification) {
            this.notification.style.display = 'none';
        }

        // Focus en input
        setTimeout(() => {
            if (this.input) {
                this.input.focus();
            }
        }, 300);

        this.isOpen = true;
    }

    close() {
        if (!this.isOpen) return;

        // Ocultar ventana
        this.window.classList.remove('active');
        this.toggle.classList.remove('active');
        
        // Ocultar overlay
        this.overlay.classList.remove('active');
        document.body.classList.remove('chat-active');

        // Esperar a que termine la animación
        setTimeout(() => {
            this.window.style.display = 'none';
        }, 300);

        this.isOpen = false;
    }

    addMessage(message, isBot = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${isBot ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${message}
                </div>
                <div class="message-time">Ahora</div>
            </div>
        `;

        this.messages.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}

// Inicializar el chat cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
}); 