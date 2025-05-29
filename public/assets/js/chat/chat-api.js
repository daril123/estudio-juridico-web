/**
 * CHAT WIDGET JURÍDICO - API Y COMUNICACIÓN
 * Maneja toda la comunicación con el backend y procesamiento de respuestas
 */

export class ChatAPI {
    constructor(webhookUrl, options = {}) {
        this.webhookUrl = webhookUrl;
        this.sessionId = options.sessionId || this.generateSessionId();
        
        // Configuración
        this.config = {
            timeout: 30000,
            maxRetries: 3,
            retryDelay: 1000,
            retryMultiplier: 2,
            enableRetry: true,
            enableQueue: true,
            enableCache: false,
            cacheTimeout: 300000, // 5 minutos
            ...options
        };
        
        // Estado
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.requestQueue = [];
        this.activeRequests = new Map();
        this.cache = new Map();
        this.retryCount = 0;
        this.eventListeners = {};
        
        // Estadísticas
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastRequestTime: null
        };
    }

    // ========================
    // INICIALIZACIÓN
    // ========================
    async init() {
        if (this.isInitialized) {
            console.warn('Chat API ya está inicializada');
            return false;
        }

        try {
            // Validar webhook URL
            this.validateWebhookUrl();
            
            // Configurar listeners de red
            this.setupNetworkListeners();
            
            // Configurar queue processor
            if (this.config.enableQueue) {
                this.startQueueProcessor();
            }
            
            // Test de conectividad inicial
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('🌐 Chat API inicializada correctamente');
            this.emit('initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al inicializar Chat API:', error);
            this.emit('error', { type: 'initialization', error });
            throw error;
        }
    }

    validateWebhookUrl() {
        if (!this.webhookUrl) {
            throw new Error('Webhook URL es requerida');
        }
        
        try {
            new URL(this.webhookUrl);
        } catch (error) {
            throw new Error('Webhook URL no es válida');
        }
    }

    setupNetworkListeners() {
        // Detectar cambios en la conectividad
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.emit('online');
            this.processQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.emit('offline');
        });
    }

    startQueueProcessor() {
        // Procesar cola cada 1 segundo
        setInterval(() => {
            if (this.isOnline && this.requestQueue.length > 0) {
                this.processQueue();
            }
        }, 1000);
    }

    async testConnection() {
        try {
            const testPayload = {
                message: 'test_connection',
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                type: 'connection_test'
            };
            
            const response = await this.makeRequest(testPayload, { 
                timeout: 5000,
                retry: false 
            });
            
            console.log('✅ Test de conexión exitoso');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Test de conexión falló, continuando sin validación:', error.message);
            return false;
        }
    }

    // ========================
    // ENVÍO DE MENSAJES
    // ========================
    async sendMessage(message, context = {}) {
        if (!this.isInitialized) {
            throw new Error('API no está inicializada');
        }

        const payload = this.buildPayload(message, context);
        
        try {
            this.emit('requestStart', { payload });
            this.stats.totalRequests++;
            
            const startTime = Date.now();
            
            let response;
            if (this.isOnline) {
                response = await this.makeRequest(payload);
            } else {
                // Encolar si no hay conexión
                response = await this.enqueueRequest(payload);
            }
            
            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, true);
            
            this.emit('response', response);
            return response;
            
        } catch (error) {
            this.updateStats(0, false);
            this.emit('error', { type: 'sendMessage', error, payload });
            throw error;
        }
    }

    buildPayload(message, context = {}) {
        return {
            message: message.trim(),
            sessionId: this.sessionId,
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

    // ========================
    // PETICIONES HTTP
    // ========================
    async makeRequest(payload, options = {}) {
        const config = { ...this.config, ...options };
        const requestId = payload.metadata?.requestId || this.generateRequestId();
        
        // Verificar cache si está habilitado
        if (config.enableCache) {
            const cached = this.getFromCache(payload.message);
            if (cached) {
                console.log('📄 Respuesta desde cache');
                return cached;
            }
        }
        
        // Preparar request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LegalChatWidget/1.0',
                'X-Session-ID': this.sessionId,
                'X-Request-ID': requestId
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        };

        try {
            // Almacenar request activo
            this.activeRequests.set(requestId, { controller, payload, startTime: Date.now() });
            
            console.log('📤 Enviando request a n8n:', {
                url: this.webhookUrl,
                payload: payload
            });
            
            const response = await fetch(this.webhookUrl, requestOptions);
            
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Procesar respuesta
            const data = await this.parseResponse(response);
            
            // Cachear si está habilitado
            if (config.enableCache) {
                this.addToCache(payload.message, data);
            }
            
            console.log('📥 Respuesta recibida:', data);
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            
            // Retry logic
            if (config.enableRetry && config.retry !== false && this.shouldRetry(error)) {
                return await this.retryRequest(payload, options);
            }
            
            throw this.normalizeError(error);
        }
    }

    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        try {
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else {
                // Si no es JSON, intentar como texto
                const text = await response.text();
                console.log('📥 Respuesta como texto:', text);
                
                // Intentar parsear como JSON por si acaso
                try {
                    return JSON.parse(text);
                } catch {
                    // Si no es JSON válido, devolver el texto directamente
                    return text;
                }
            }
        } catch (error) {
            console.error('Error al parsear respuesta:', error);
            throw new Error('Error al procesar respuesta del servidor');
        }
    }

    // ========================
    // RETRY LOGIC
    // ========================
    shouldRetry(error) {
        // No reintentar si es error de usuario (4xx)
        if (error.status >= 400 && error.status < 500) {
            return false;
        }
        
        // No reintentar si se excedió el límite
        if (this.retryCount >= this.config.maxRetries) {
            return false;
        }
        
        // Reintentar para errores de red o servidor
        return true;
    }

    async retryRequest(payload, options = {}) {
        this.retryCount++;
        const delay = this.config.retryDelay * Math.pow(this.config.retryMultiplier, this.retryCount - 1);
        
        console.log(`🔄 Reintentando petición (${this.retryCount}/${this.config.maxRetries}) en ${delay}ms`);
        
        await this.delay(delay);
        
        try {
            const response = await this.makeRequest(payload, { ...options, retry: false });
            this.retryCount = 0; // Reset counter on success
            return response;
        } catch (error) {
            if (this.retryCount >= this.config.maxRetries) {
                this.retryCount = 0;
                throw new Error(`Falló después de ${this.config.maxRetries} intentos: ${error.message}`);
            }
            throw error;
        }
    }

    // ========================
    // QUEUE MANAGEMENT
    // ========================
    async enqueueRequest(payload) {
        return new Promise((resolve, reject) => {
            const queueItem = {
                payload,
                resolve,
                reject,
                timestamp: Date.now(),
                attempts: 0
            };
            
            this.requestQueue.push(queueItem);
            console.log('📥 Petición encolada (sin conexión)');
        });
    }

    async processQueue() {
        if (!this.isOnline || this.requestQueue.length === 0) {
            return;
        }
        
        console.log(`🔄 Procesando cola: ${this.requestQueue.length} peticiones`);
        
        // Procesar una petición a la vez para evitar sobrecarga
        const queueItem = this.requestQueue.shift();
        
        if (queueItem) {
            try {
                const response = await this.makeRequest(queueItem.payload);
                queueItem.resolve(response);
            } catch (error) {
                queueItem.attempts++;
                
                // Reintentar hasta 3 veces
                if (queueItem.attempts < 3) {
                    this.requestQueue.unshift(queueItem);
                } else {
                    queueItem.reject(error);
                }
            }
        }
    }

    // ========================
    // PROCESAMIENTO DE RESPUESTAS
    // ========================
    extractMessage(response) {
        if (!response) {
            console.log('❌ Respuesta vacía');
            return null;
        }

        console.log('🔍 Extrayendo mensaje de respuesta:', response);
        
        try {
            let message = '';

            // Si la respuesta es directamente un string
            if (typeof response === 'string') {
                message = response.trim();
                console.log('✅ Mensaje extraído como string directo:', message);
                return this.cleanMessage(message);
            }

            // Búsqueda estructurada en objeto JSON
            if (typeof response === 'object' && response !== null) {
                // Orden de prioridad para buscar el mensaje
                const searchPaths = [
                    'response.body',
                    'body',
                    'message',
                    'reply',
                    'text',
                    'content',
                    'data',
                    'result'
                ];

                for (const path of searchPaths) {
                    const value = this.getNestedProperty(response, path);
                    if (value && typeof value === 'string' && value.trim()) {
                        message = value;
                        console.log(`✅ Mensaje encontrado en ${path}:`, message);
                        break;
                    }
                }

                // Si es array, buscar en el primer elemento
                if (!message && Array.isArray(response) && response.length > 0) {
                    const firstItem = response[0];
                    for (const path of searchPaths) {
                        const value = this.getNestedProperty(firstItem, path);
                        if (value && typeof value === 'string' && value.trim()) {
                            message = value;
                            console.log(`✅ Mensaje encontrado en array[0].${path}:`, message);
                            break;
                        }
                    }
                }

                // Búsqueda recursiva como último recurso
                if (!message) {
                    message = this.findMessageRecursively(response);
                    if (message) {
                        console.log('✅ Mensaje encontrado recursivamente:', message);
                    }
                }
            }

            if (message) {
                return this.cleanMessage(message);
            }

        } catch (error) {
            console.error('❌ Error al extraer mensaje:', error);
        }

        console.log('❌ No se pudo extraer mensaje de la respuesta');
        return null;
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    findMessageRecursively(obj, depth = 0, maxDepth = 5) {
        if (depth > maxDepth || !obj || typeof obj !== 'object') {
            return null;
        }

        // Si es string y tiene contenido útil
        if (typeof obj === 'string' && obj.trim().length > 0) {
            return obj;
        }

        // Buscar en propiedades
        const messageKeys = ['body', 'message', 'reply', 'text', 'content', 'response', 'data', 'result'];
        
        for (const key of messageKeys) {
            if (obj[key]) {
                if (typeof obj[key] === 'string' && obj[key].trim()) {
                    return obj[key];
                } else if (typeof obj[key] === 'object') {
                    const found = this.findMessageRecursively(obj[key], depth + 1, maxDepth);
                    if (found) return found;
                }
            }
        }

        // Buscar en todas las propiedades si no encontramos con las claves conocidas
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && !messageKeys.includes(key)) {
                const found = this.findMessageRecursively(obj[key], depth + 1, maxDepth);
                if (found) return found;
            }
        }

        return null;
    }

    cleanMessage(message) {
        if (!message || typeof message !== 'string') {
            return '';
        }
        
        // Limpiar espacios al inicio y final
        message = message.trim();
        
        // Convertir \n en saltos de línea reales
        message = message.replace(/\\n/g, '\n');
        
        // Limpiar caracteres de escape innecesarios
        message = message.replace(/\\"/g, '"');
        message = message.replace(/\\'/g, "'");
        
        // Limpiar caracteres de control
        message = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        console.log('✅ Mensaje limpiado:', message);
        return message;
    }

    // ========================
    // CACHE MANAGEMENT
    // ========================
    getFromCache(key) {
        if (!this.config.enableCache) return null;
        
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Verificar si expiró
        if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    addToCache(key, data) {
        if (!this.config.enableCache) return;
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Limpiar cache si es muy grande
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clearCache() {
        this.cache.clear();
    }

    // ========================
    // ESTADÍSTICAS
    // ========================
    updateStats(responseTime, success) {
        if (success) {
            this.stats.successfulRequests++;
            
            // Calcular promedio de tiempo de respuesta
            if (this.stats.averageResponseTime === 0) {
                this.stats.averageResponseTime = responseTime;
            } else {
                this.stats.averageResponseTime = 
                    (this.stats.averageResponseTime + responseTime) / 2;
            }
        } else {
            this.stats.failedRequests++;
        }
        
        this.stats.lastRequestTime = Date.now();
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 
                ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2)
                : 0,
            isOnline: this.isOnline,
            queueLength: this.requestQueue.length,
            activeRequests: this.activeRequests.size,
            cacheSize: this.cache.size
        };
    }

    // ========================
    // CONTROL DE ESTADO
    // ========================
    pause() {
        // Cancelar requests activos
        this.activeRequests.forEach(({ controller }) => {
            controller.abort();
        });
        this.activeRequests.clear();
        
        console.log('⏸️ Chat API pausada');
    }

    resume() {
        // Procesar cola si hay elementos
        if (this.requestQueue.length > 0) {
            this.processQueue();
        }
        
        console.log('▶️ Chat API reanudada');
    }

    // ========================
    // UTILIDADES
    // ========================
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `api_${timestamp}_${random}`;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    normalizeError(error) {
        if (error.name === 'AbortError') {
            return new Error('Request timeout');
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return new Error('Network error');
        }
        
        return error;
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
                    console.error(`Error en API event listener ${eventName}:`, error);
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
        return {
            initialized: this.isInitialized,
            online: this.isOnline,
            webhookUrl: this.webhookUrl,
            sessionId: this.sessionId,
            config: this.config,
            stats: this.getStats(),
            queue: {
                length: this.requestQueue.length,
                items: this.requestQueue.map(item => ({
                    timestamp: item.timestamp,
                    attempts: item.attempts,
                    message: item.payload.message?.substring(0, 50)
                }))
            },
            cache: {
                enabled: this.config.enableCache,
                size: this.cache.size,
                keys: Array.from(this.cache.keys()).slice(0, 5)
            }
        };
    }

    // ========================
    // CLEANUP
    // ========================
    destroy() {
        try {
            // Cancelar requests activos
            this.activeRequests.forEach(({ controller }) => {
                controller.abort();
            });
            this.activeRequests.clear();
            
            // Limpiar cola
            this.requestQueue.forEach(item => {
                item.reject(new Error('API destroyed'));
            });
            this.requestQueue = [];
            
            // Limpiar cache
            this.cache.clear();
            
            // Limpiar eventos
            Object.keys(this.eventListeners).forEach(eventName => {
                this.eventListeners[eventName] = [];
            });
            
            console.log('🌐 Chat API destroyed');
            
        } catch (error) {
            console.error('Error destroying Chat API:', error);
        }
    }
}

export default ChatAPI;