class Chat {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Crear elementos del DOM
        const chatHTML = `
            <button class="chat-toggle" id="chat-toggle">
                <i class="fas fa-comments chat-icon"></i>
                <i class="fas fa-times chat-close-icon"></i>
            </button>
            <div class="chat-window" id="chat-window">
                <div class="chat-header">
                    <div class="chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="chat-info">
                        <h4>Asistente Jurídico</h4>
                        <div class="chat-status">
                            <span class="status-dot"></span>
                            En línea
                        </div>
                    </div>
                    <button class="chat-minimize" id="chat-minimize">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="typing-indicator" id="typing-indicator">
                    <i class="fas fa-robot"></i> escribiendo...
                </div>
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <textarea class="chat-input" id="chat-input" placeholder="Escribe tu mensaje aquí..." rows="1"></textarea>
                        <button class="chat-send" id="chat-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="chat-overlay" id="chat-overlay"></div>
        `;

        // Insertar el HTML en el body
        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Guardar referencias a los elementos
        this.elements = {
            toggle: document.getElementById('chat-toggle'),
            window: document.getElementById('chat-window'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input'),
            send: document.getElementById('chat-send'),
            minimize: document.getElementById('chat-minimize'),
            typingIndicator: document.getElementById('typing-indicator'),
            overlay: document.getElementById('chat-overlay')
        };
    }

    bindEvents() {
        // Toggle del chat
        this.elements.toggle.addEventListener('click', () => this.toggle());

        // Minimizar chat
        this.elements.minimize.addEventListener('click', () => this.close());

        // Enviar mensaje
        this.elements.send.addEventListener('click', () => this.sendMessage());

        // Input de texto
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

        // Overlay para móviles
        this.elements.overlay.addEventListener('click', () => this.close());

        // Tecla Escape para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Resize para responsive
        window.addEventListener('resize', () => this.handleResize());
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.elements.window.classList.add('active');
        this.elements.toggle.classList.add('active');
        this.elements.overlay.classList.add('active');
        this.elements.input.focus();
        this.handleResize();
    }

    close() {
        this.isOpen = false;
        this.elements.window.classList.remove('active');
        this.elements.toggle.classList.remove('active');
        this.elements.overlay.classList.remove('active');
    }

    handleResize() {
        if (window.innerWidth <= 480) {
            this.elements.overlay.style.display = this.isOpen ? 'block' : 'none';
        } else {
            this.elements.overlay.style.display = 'none';
        }
    }

    sendMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        // Agregar mensaje del usuario
        this.addMessage(message, false);

        // Limpiar input
        this.elements.input.value = '';
        this.updateSendButton();
        this.autoResizeInput();

        // Simular respuesta del bot
        this.showTyping();
        setTimeout(() => {
            this.hideTyping();
            this.addMessage('Gracias por tu mensaje. ¿En qué más puedo ayudarte?', true);
        }, 1500);
    }

    addMessage(content, isBot = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${isBot ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${content}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();

        // Guardar en historial
        this.messageHistory.push({
            content,
            isBot,
            timestamp: new Date()
        });
    }

    showTyping() {
        this.isTyping = true;
        this.elements.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.elements.typingIndicator.classList.remove('active');
    }

    updateSendButton() {
        const hasText = this.elements.input.value.trim().length > 0;
        this.elements.send.classList.toggle('active', hasText);
    }

    autoResizeInput() {
        const input = this.elements.input;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
}

// Inicializar el chat cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.chat = new Chat();
}); 