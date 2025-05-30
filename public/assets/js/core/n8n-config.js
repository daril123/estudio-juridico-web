/**
 * Configuración de integración con n8n
 * Maneja la configuración y validación del webhook de n8n
 */

export const N8N_CONFIG = {
    // URL del webhook de n8n
    webhookUrl: 'https://singular-dear-jaybird.ngrok-free.app/webhook/cfa4d4c3-0f1c-49bc-b1f9-4d5c4b719b44',
    
    // Configuración de la API
    api: {
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        retryMultiplier: 2,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LegalChatWidget/1.0'
        }
    },

    // Estructura del payload esperado
    payloadStructure: {
        message: String,
        sessionId: String,
        timestamp: String,
        context: {
            userAgent: String,
            url: String,
            language: String,
            timezone: String,
            screenResolution: String
        },
        metadata: {
            version: String,
            source: String,
            requestId: String
        }
    },

    // Campos de respuesta esperados
    responseFields: [
        'response.body',
        'body',
        'message',
        'reply',
        'text',
        'content',
        'data',
        'result'
    ],

    // Configuración de caché
    cache: {
        enabled: true,
        timeout: 300000, // 5 minutos
        maxSize: 100
    },

    // Configuración de cola
    queue: {
        enabled: true,
        maxSize: 50,
        processInterval: 1000 // 1 segundo
    }
};

/**
 * Clase para manejar la integración con n8n
 */
export class N8NIntegration {
    constructor(config = N8N_CONFIG) {
        this.config = config;
        this.cache = new Map();
        this.queue = [];
        this.isProcessing = false;
    }

    /**
     * Valida la URL del webhook
     */
    validateWebhookUrl() {
        try {
            new URL(this.config.webhookUrl);
            return true;
        } catch (error) {
            console.error('URL de webhook inválida:', error);
            return false;
        }
    }

    /**
     * Construye el payload para enviar a n8n
     */
    buildPayload(message, context = {}) {
        return {
            message: message.trim(),
            sessionId: this.generateSessionId(),
            timestamp: new Date().toISOString(),
            context: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screenResolution: `${screen.width}x${screen.height}`,
                ...context
            },
            metadata: {
                version: '1.0',
                source: 'legal_chat_widget',
                requestId: this.generateRequestId()
            }
        };
    }

    /**
     * Envía un mensaje a n8n
     */
    async sendMessage(message, context = {}) {
        if (!this.validateWebhookUrl()) {
            throw new Error('URL de webhook inválida');
        }

        const payload = this.buildPayload(message, context);
        
        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: this.config.api.headers,
                body: JSON.stringify(payload),
                timeout: this.config.api.timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return this.processResponse(data);
        } catch (error) {
            console.error('Error al enviar mensaje a n8n:', error);
            throw error;
        }
    }

    /**
     * Procesa la respuesta de n8n
     */
    processResponse(response) {
        if (!response) {
            console.error('Respuesta vacía de n8n');
            return null;
        }

        // Intentar encontrar una respuesta válida en los campos esperados
        for (const field of this.config.responseFields) {
            const value = this.getNestedProperty(response, field);
            if (value && typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }

        // Si no se encuentra una respuesta válida, registrar el error
        console.error('No se encontró una respuesta válida en:', response);
        return null;
    }

    /**
     * Obtiene una propiedad anidada de un objeto
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : undefined, obj);
    }

    /**
     * Genera un ID de sesión único
     */
    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Genera un ID de petición único
     */
    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

export default N8NIntegration; 