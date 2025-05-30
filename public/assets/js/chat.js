/**
 * CHAT WIDGET - ESTUDIO JURÍDICO
 * Maneja la interfaz y funcionalidad del chat
 */

import { CHAT_CONFIG } from './core/config.js';
import ChatAI from './chat/chat-ai.js';

class ChatWidget {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeChatAI();
        this.showWelcomeNotification();
    }

    initializeElements() {
        // Elementos principales
        this.widget = document.getElementById('chat-widget');
        this.toggle = document.getElementById('chat-toggle');
        this.window = document.getElementById('chat-window');
        this.messages = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendButton = document.getElementById('chat-send');
        this.minimizeButton = document.getElementById('chat-minimize');
        this.notification = document.getElementById('chat-notification');
        this.overlay = document.getElementById('chat-overlay');
        this.suggestions = document.getElementById('chat-suggestions');
        this.typingIndicator = document.getElementById('typing-indicator');
    }

    initializeEventListeners() {
        // Toggle chat
        this.toggle.addEventListener('click', () => this.toggleChat());
        
        // Minimizar chat
        this.minimizeButton.addEventListener('click', () => this.minimizeChat());
        
        // Enviar mensaje
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = this.input.scrollHeight + 'px';
            this.updateSendButton();
        });
        
        // Sugerencias rápidas
        this.suggestions.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                this.input.value = message;
                this.input.dispatchEvent(new Event('input'));
                this.sendMessage();
            });
        });
        
        // Overlay para móviles
        this.overlay.addEventListener('click', () => this.minimizeChat());
    }

    initializeChatAI() {
        this.chatAI = new ChatAI();
    }

    showWelcomeNotification() {
        setTimeout(() => {
            this.notification.classList.add('show');
            setTimeout(() => {
                this.notification.classList.remove('show');
            }, CHAT_CONFIG.behavior.notificationDuration);
        }, CHAT_CONFIG.behavior.welcomeDelay);
    }

    toggleChat() {
        this.window.classList.toggle('active');
        this.toggle.classList.toggle('active');
        this.overlay.classList.toggle('active');
        
        if (this.window.classList.contains('active')) {
            this.input.focus();
        }
    }

    minimizeChat() {
        this.window.classList.remove('active');
        this.toggle.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    updateSendButton() {
        const hasText = this.input.value.trim().length > 0;
        this.sendButton.disabled = !hasText;
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Limpiar input
        this.input.value = '';
        this.input.style.height = 'auto';
        this.updateSendButton();

        // Enviar mensaje
        await this.chatAI.sendMessage(message);
    }

    addMessage(message, isBot = true) {
        // Reemplazar saltos de línea por <br>
        const formattedMessage = (message || '').replace(/\n/g, '<br>');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
        
        const content = `
            <div class="message-avatar">
                <i class="fas fa-${isBot ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${formattedMessage}
                </div>
                <div class="message-time">Ahora</div>
            </div>
        `;
        
        messageElement.innerHTML = content;
        this.messages.appendChild(messageElement);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}

// Inicializar el chat cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
}); 