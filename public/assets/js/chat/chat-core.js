/**
 * CHAT WIDGET JURÍDICO - NÚCLEO PRINCIPAL
 * Maneja la lógica central del chat widget
 */

import { ChatUI } from './chat-ui.js';
import { ChatAPI } from './chat-api.js';

export class LegalChatCore {
    constructor(options = {}) {
        // Configuración
        this.webhookUrl = options.webhookUrl || 
            'https://singular-dear-jaybird.ngrok-free.app/webhook/cfa4d4c3-0f1c-49bc-b1f9-4d5c4b719b44';
        
        // Estado del chat
        this.isOpen = false;
        this.isTyping = false;
        this.isInitialized = false;
        this.isPaused = false;
        
        // Datos del chat
        this.sessionId = this.generateSessionId();
        this.messageHistory = [];
        this.userContext = {};
        
        // Módulos
        this.ui = null;
        this.api = null;
        
        // Configuración por defecto
        this.config = {
            maxHistoryLength: 50,
            typingTimeout: 3000,
            reconnectAttempts: 3,
            reconnectDelay: 1000,
            enableNotifications: true,
            enableSuggestions: true,
            enableSound: false,
            autoOpen: false,
            welcomeDelay: 2000,
            ...options
        };
    }

    // ========================
    // INICIALIZACIÓN
    // ========================
    async init() {
        if (this.isInitialized) {
            console.warn('Chat widget ya está inicializado');
            return false;
        }

        try {
            // Si ya existe una instancia previa, destruirla antes de continuar
            if (window.legalChatInstance) {
                if (typeof window.legalChatInstance.destroy === 'function') {
                    window.legalChatInstance.destroy();
                }
                window.legalChatInstance = null;
            }

            // Esperar a que el DOM esté listo
            await this.waitForDOM();
            
            // Inicializar módulos
            await this.initializeModules();
            
            // Configurar el sistema
            await this.setupSystem();
            
            // Marcar como inicializado
            this.isInitialized = true;
            window.legalChatInstance = this;
            
            console.log('🤖 Legal Chat Core inicializado correctamente');
            this.emit('initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al inicializar chat core:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    async initializeModules() {
        // Inicializar UI
        this.ui = new ChatUI(this);
        await this.ui.init();
        
        // Inicializar API
        this.api = new ChatAPI(this.webhookUrl, {
            sessionId: this.sessionId,
            maxRetries: this.config.reconnectAttempts,
            retryDelay: this.config.reconnectDelay
        });
        await this.api.init();
        
        // Conectar eventos entre módulos
        this.connectModules();
    }

    connectModules() {
        // UI -> Core events
        this.ui.on('toggle', () => this.toggle());
        this.ui.on('message', (message) => this.handleUserMessage(message));
        this.ui.on('minimize', () => this.close());
        this.ui.on('suggestion', (suggestion) => this.handleSuggestion(suggestion));
        
        // API -> Core events
        this.api.on('response', (response) => this.handleBotResponse(response));
        this.api.on('error', (error) => this.handleAPIError(error));
        this.api.on('typing', () => this.showTyping());
        this.api.on('stopTyping', () => this.hideTyping());
    }

    async setupSystem() {
        // Configurar context del usuario
        this.setupUserContext();
        
        // Configurar notificaciones
        if (this.config.enableNotifications) {
            this.setupNotifications();
        }
        
        // Auto-abrir si está configurado
        if (this.config.autoOpen) {
            setTimeout(() => this.open(), this.config.welcomeDelay);
        } else if (this.config.enableNotifications) {
            // Mostrar notificación de bienvenida
            setTimeout(() => this.ui.showWelcomeNotification(), this.config.welcomeDelay);
        }
        
        // Configurar cleanup
        this.setupCleanup();
    }

    setupUserContext() {
        this.userContext = {
            userAgent: navigator.userAgent,
            url: window.location.href,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };
    }

    setupNotifications() {
        // Configurar permisos de notificación si es necesario
        if ('Notification' in window && Notification.permission === 'default') {
            // No pedir permisos automáticamente, solo si el usuario interactúa
        }
    }

    setupCleanup() {
        // Cleanup al cerrar la página
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Cleanup al cambiar de página
        window.addEventListener('pagehide', () => {
            this.cleanup();
        });
    }

    // ========================
    // CONTROL DE ESTADO
    // ========================
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    async open() {
        if (this.isOpen || !this.isInitialized) {
            console.log('[ChatCore] Chat ya está abierto o no está inicializado');
            return false;
        }
        
        try {
            console.log('[ChatCore] Intentando abrir el chat...');
            
            // Abrir UI
            const opened = await this.ui.open();
            if (!opened) {
                console.error('[ChatCore] No se pudo abrir la UI del chat');
                return false;
            }
            
            // Actualizar estado
            this.isOpen = true;
            this.emit('opened');
            
            // Analytics/tracking
            this.trackEvent('chat_opened');
            
            console.log('[ChatCore] Chat abierto exitosamente');
            return true;
            
        } catch (error) {
            console.error('[ChatCore] Error al abrir chat:', error);
            this.emit('error', { type: 'open', error });
            return false;
        }
    }

    async close() {
        if (!this.isOpen || !this.isInitialized) return false;
        
        try {
            // Cerrar UI
            await this.ui.close();
            
            // Actualizar estado
            this.isOpen = false;
            this.emit('closed');
            
            // Analytics/tracking
            this.trackEvent('chat_closed');
            
            return true;
            
        } catch (error) {
            console.error('Error al cerrar chat:', error);
            this.emit('error', { type: 'close', error });
            return false;
        }
    }

    pause() {
        this.isPaused = true;
        this.ui?.pause();
        this.api?.pause();
        this.emit('paused');
    }

    resume() {
        this.isPaused = false;
        this.ui?.resume();
        this.api?.resume();
        this.emit('resumed');
    }

    // ========================
    // MANEJO DE MENSAJES
    // ========================
    async handleUserMessage(message) {
        if (!message?.trim() || this.isTyping || this.isPaused) {
            return false;
        }

        try {
            // Agregar mensaje del usuario
            this.addMessage(message, 'user');
            
            // Mostrar indicador de escritura
            this.showTyping();
            
            // Ocultar sugerencias
            this.ui.hideSuggestions();
            
            // Enviar a la API
            const response = await this.api.sendMessage(message, {
                context: this.userContext,
                history: this.getRecentHistory()
            });
            
            // Ocultar indicador de escritura
            this.hideTyping();
            
            // Procesar respuesta
            await this.handleBotResponse(response);
            
            // Analytics
            this.trackEvent('message_sent', { message: message.substring(0, 50) });
            
            return true;
            
        } catch (error) {
            console.error('Error al manejar mensaje del usuario:', error);
            this.hideTyping();
            await this.handleAPIError(error);
            return false;
        }
    }

    async handleBotResponse(response) {
        try {
            // Extraer mensaje de la respuesta
            const message = this.api.extractMessage(response);
            
            if (message) {
                // Agregar mensaje del bot
                this.addMessage(message, 'bot');
                
                // Analizar si necesita acciones especiales
                this.processMessageActions(message);
                
                this.emit('botResponse', { message, rawResponse: response });
            } else {
                throw new Error('No se pudo extraer mensaje de la respuesta');
            }
            
        } catch (error) {
            console.error('Error al procesar respuesta del bot:', error);
            
            // Mensaje de fallback
            this.addMessage(
                'Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta nuevamente o contacta directamente con nuestro equipo.',
                'bot'
            );
            
            this.emit('error', { type: 'botResponse', error });
        }
    }

    async handleAPIError(error) {
        console.error('Error de API:', error);
        
        let errorMessage = 'Disculpa, hay un problema de conexión. Por favor intenta más tarde.';
        
        // Personalizar mensaje según el tipo de error
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        } else if (error.status === 429) {
            errorMessage = 'Demasiadas consultas. Por favor espera un momento antes de enviar otro mensaje.';
        } else if (error.status >= 500) {
            errorMessage = 'El servidor está experimentando problemas. Por favor intenta más tarde.';
        }
        
        // Agregar información de contacto
        errorMessage += '\n\nPuedes contactarnos directamente al (01) 234-5678.';
        
        this.addMessage(errorMessage, 'bot');
        this.emit('apiError', error);
    }

    handleSuggestion(suggestion) {
        if (!suggestion?.message) return;
        
        // Simular que el usuario escribió la sugerencia
        this.ui.setInputValue(suggestion.message);
        this.handleUserMessage(suggestion.message);
        
        this.trackEvent('suggestion_used', { suggestion: suggestion.message });
    }

    // ========================
    // GESTIÓN DE MENSAJES
    // ========================
    addMessage(content, sender, metadata = {}) {
        const message = {
            id: this.generateMessageId(),
            content: content,
            sender: sender,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            ...metadata
        };
        
        // Agregar al historial
        this.messageHistory.push(message);
        
        // Limitar historial
        if (this.messageHistory.length > this.config.maxHistoryLength) {
            this.messageHistory = this.messageHistory.slice(-this.config.maxHistoryLength);
        }
        
        // Mostrar en UI
        this.ui.addMessage(message);
        
        // Emitir evento
        this.emit('messageAdded', message);
        
        return message;
    }

    getRecentHistory(count = 5) {
        return this.messageHistory.slice(-count);
    }

    processMessageActions(message) {
        // Detectar y procesar acciones especiales en el mensaje
        const lowerMessage = message.toLowerCase();
        
        // Ejemplo: enlaces a documentos
        if (lowerMessage.includes('documento') || lowerMessage.includes('formulario')) {
            // Podría agregar botones de descarga
        }
        
        // Ejemplo: sugerencia de llamada
        if (lowerMessage.includes('llamar') || lowerMessage.includes('teléfono')) {
            // Podría mostrar botón de llamada
        }
        
        // Ejemplo: agendar cita
        if (lowerMessage.includes('cita') || lowerMessage.includes('reunión')) {
            // Podría mostrar calendario
        }
    }

    // ========================
    // INDICADORES DE ESTADO
    // ========================
    showTyping() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.ui.showTypingIndicator();
        this.emit('typingStarted');
        
        // Auto-ocultar después de timeout
        setTimeout(() => {
            if (this.isTyping) {
                this.hideTyping();
            }
        }, this.config.typingTimeout);
    }

    hideTyping() {
        if (!this.isTyping) return;
        
        this.isTyping = false;
        this.ui.hideTypingIndicator();
        this.emit('typingStopped');
    }

    // ========================
    // API PÚBLICA
    // ========================
    
    // Enviar mensaje programáticamente
    sendMessage(message) {
        if (!this.isInitialized) {
            console.warn('Chat no está inicializado');
            return false;
        }
        
        this.ui.setInputValue(message);
        return this.handleUserMessage(message);
    }

    // Limpiar chat
    clearChat() {
        this.messageHistory = [];
        this.ui.clearMessages();
        this.emit('chatCleared');
    }

    // Obtener historial
    getHistory() {
        return [...this.messageHistory];
    }

    // Configurar estado
    setStatus(status, message) {
        this.ui.setStatus(status, message);
    }

    // ========================
    // UTILIDADES
    // ========================
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `chat_${timestamp}_${random}`;
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    trackEvent(eventName, data = {}) {
        // Integración con analytics (Google Analytics, etc.)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'legal_chat',
                event_label: this.sessionId,
                ...data
            });
        }
        
        // Console log para desarrollo
        console.log(`📊 Chat Event: ${eventName}`, data);
        
        this.emit('analyticsEvent', { eventName, data });
    }

    // ========================
    // SISTEMA DE EVENTOS
    // ========================
    emit(eventName, data = {}) {
        const event = new CustomEvent(`legalChat:${eventName}`, {
            detail: { ...data, chat: this }
        });
        
        document.dispatchEvent(event);
        
        // También emitir en el objeto para compatibilidad
        if (this.eventListeners && this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en event listener ${eventName}:`, error);
                }
            });
        }
    }

    on(eventName, callback) {
        if (!this.eventListeners) {
            this.eventListeners = {};
        }
        
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        
        this.eventListeners[eventName].push(callback);
        
        return () => this.off(eventName, callback);
    }

    off(eventName, callback) {
        if (!this.eventListeners || !this.eventListeners[eventName]) {
            return;
        }
        
        const index = this.eventListeners[eventName].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }

    // ========================
    // DIAGNÓSTICO Y DEBUG
    // ========================
    diagnose() {
        const diagnosis = {
            core: {
                initialized: this.isInitialized,
                open: this.isOpen,
                typing: this.isTyping,
                paused: this.isPaused,
                sessionId: this.sessionId,
                messagesCount: this.messageHistory.length
            },
            ui: this.ui?.diagnose(),
            api: this.api?.diagnose(),
            config: this.config,
            userContext: this.userContext
        };
        
        console.log('🔍 Legal Chat Diagnosis:', diagnosis);
        return diagnosis;
    }

    // ========================
    // CLEANUP
    // ========================
    cleanup() {
        try {
            // Pausar operaciones
            this.pause();
            
            // Limpiar módulos
            this.ui?.destroy();
            this.api?.destroy();
            
            // Limpiar eventos
            if (this.eventListeners) {
                Object.keys(this.eventListeners).forEach(eventName => {
                    this.eventListeners[eventName] = [];
                });
            }
            
            // Limpiar referencia global
            if (window.legalChatInstance === this) {
                window.legalChatInstance = null;
            }
            
            this.emit('destroyed');
            console.log('🤖 Legal Chat Core destroyed');
            
        } catch (error) {
            console.error('Error durante cleanup:', error);
        }
    }

    destroy() {
        this.cleanup();
    }
}

export default LegalChatCore;