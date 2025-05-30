// Chat AI Handler
import { N8NIntegration } from '../core/n8n-config.js';

class ChatAI {
    constructor() {
        this.n8n = new N8NIntegration();
        this.isProcessing = false;
    }

    async sendMessage(message) {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            
            // Mostrar mensaje del usuario
            window.chatWidget.addMessage(message, false);
            
            // Enviar mensaje a n8n y obtener respuesta
            const response = await this.n8n.sendMessage(message);
            
            // Mostrar respuesta de la IA solo si hay una respuesta válida
            if (response && typeof response === 'string' && response.trim()) {
                window.chatWidget.addMessage(response);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
            
        } catch (error) {
            console.error('Error al procesar mensaje:', error);
            window.chatWidget.addMessage('Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta nuevamente.');
        } finally {
            this.isProcessing = false;
        }
    }
}

export default ChatAI;

// Inicializar el chat AI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.chatAI = new ChatAI();
}); 