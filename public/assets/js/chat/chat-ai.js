// Chat AI Handler
class ChatAI {
    constructor() {
        this.apiUrl = '/api/chat'; // Ajusta esto a tu endpoint real
        this.isProcessing = false;
    }

    async sendMessage(message) {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            
            // Mostrar mensaje del usuario
            window.chatWidget.addMessage(message, false);
            
            // Simular respuesta de la IA (reemplazar con tu lógica real)
            const response = await this.getAIResponse(message);
            
            // Mostrar respuesta de la IA
            window.chatWidget.addMessage(response);
            
        } catch (error) {
            console.error('Error al procesar mensaje:', error);
            window.chatWidget.addMessage('Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta nuevamente.');
        } finally {
            this.isProcessing = false;
        }
    }

    async getAIResponse(message) {
        // Aquí deberías implementar la llamada real a tu API de IA
        // Por ahora, retornamos una respuesta simulada
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('Gracias por tu consulta. Como asistente legal virtual, puedo ayudarte con información general sobre temas legales. Sin embargo, para casos específicos, te recomiendo consultar con un abogado en persona. ¿Hay algo más en lo que pueda ayudarte?');
            }, 1000);
        });
    }
}

// Inicializar el chat AI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.chatAI = new ChatAI();
}); 