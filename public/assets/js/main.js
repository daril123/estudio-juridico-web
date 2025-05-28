/**
 * TIJATIJA-JURIDICO - JAVASCRIPT PRINCIPAL
 * Funcionalidades principales del sitio web para Andahuaylas, Apurímac
 */

// Configuración global actualizada
const CONFIG = {
    animationDuration: 300,
    scrollOffset: 80,
    typingSpeed: 50,
    autoSlideInterval: 5000,
    firmName: 'TijaTija-Juridico',
    location: 'Andahuaylas, Apurímac',
    phone: '(083) 421-856',
    mobile: '+51 965-478-923',
    email: 'contacto@tijatija-juridico.com'
};

// Utilidades generales
const Utils = {
    // Debounce para optimizar eventos de scroll/resize
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Smooth scroll mejorado
    smoothScrollTo(element, offset = CONFIG.scrollOffset) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    // Detectar si un elemento está visible en viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Validador de email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Formatear teléfono peruano
    formatPhone(phone) {
        // Remover caracteres no numéricos
        const numbers = phone.replace(/\D/g, '');
        
        // Formatear según el patrón peruano
        if (numbers.length === 9 && numbers.startsWith('9')) {
            // Celular: 987-654-321
            return numbers.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
        } else if (numbers.length === 7) {
            // Fijo provincial: 421-856
            return numbers.replace(/(\d{3})(\d{4})/, '$1-$2');
        } else if (numbers.length === 10 && numbers.startsWith('083')) {
            // Con código de área: (083) 421-856
            return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        
        return phone; // Retornar original si no coincide con patrones
    }
};

// Clase principal de la aplicación
class TijaTijaLawFirmApp {
    constructor() {
        this.firmInfo = {
            name: CONFIG.firmName,
            location: CONFIG.location,
            phone: CONFIG.phone,
            mobile: CONFIG.mobile,
            email: CONFIG.email
        };
        this.init();
    }

    init() {
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupScrollEffects();
        this.setupModals();
        this.setupForms();
        this.setupAnimations();
        this.setupCounters();
        this.setupLazyLoading();
        this.bindEvents();
        
        console.log(`🏛️ ${this.firmInfo.name} App inicializado exitosamente para ${this.firmInfo.location}`);
    }

    // ========================
    // NAVEGACIÓN
    // ========================
    setupNavigation() {
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        // Efecto de scroll en navbar
        window.addEventListener('scroll', Utils.debounce(() => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            this.updateActiveNavLink();
        }, 10));

        // Smooth scroll para links de navegación
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    Utils.smoothScrollTo(targetElement);
                    this.closeMobileMenu();
                }
            });
        });
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - CONFIG.scrollOffset;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // ========================
    // EFECTOS DE SCROLL
    // ========================
    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observar elementos con animación
        document.querySelectorAll('.fade-in, .service-card, .team-member, .feature').forEach(el => {
            observer.observe(el);
        });
    }

    // ========================
    // MODALES
    // ========================
    setupModals() {
        const loginBtn = document.getElementById('btn-login');
        const loginModal = document.getElementById('login-modal');
        const closeModal = document.getElementById('close-modal');
        const showRegister = document.getElementById('show-register');

        if (!loginBtn || !loginModal) return;

        // Abrir modal de login
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal(loginModal);
        });

        // Cerrar modal
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal(loginModal);
            });
        }

        // Cerrar modal al hacer click fuera
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.closeModal(loginModal);
            }
        });

        // Manejar registro (placeholder)
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Portal de registro próximamente disponible. Contacta directamente con nuestro estudio.', 'info');
            });
        }
    }

    openModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus en el primer input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // ========================
    // FORMULARIOS
    // ========================
    setupForms() {
        this.setupContactForm();
        this.setupLoginForm();
        this.setupFormValidation();
    }

    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Validar datos
            if (!this.validateContactForm(data)) return;
            
            // Simular envío (aquí iría la integración real)
            this.simulateFormSubmission(contactForm, data);
        });
    }

    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData);
            
            // Simular autenticación
            this.simulateLogin(data);
        });
    }

    setupFormValidation() {
        // Validación en tiempo real
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !Utils.validateEmail(input.value)) {
                    this.showFieldError(input, 'Por favor ingresa un email válido');
                } else {
                    this.clearFieldError(input);
                }
            });
        });

        document.querySelectorAll('input[type="tel"]').forEach(input => {
            input.addEventListener('input', () => {
                input.value = Utils.formatPhone(input.value);
            });
        });
    }

    validateContactForm(data) {
        const errors = [];

        if (!data.name || data.name.length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (!data.email || !Utils.validateEmail(data.email)) {
            errors.push('Por favor ingresa un email válido');
        }

        if (!data.service) {
            errors.push('Por favor selecciona un servicio');
        }

        if (!data.message || data.message.length < 10) {
            errors.push('El mensaje debe tener al menos 10 caracteres');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        return true;
    }

    simulateFormSubmission(form, data) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Limpiar formulario
            form.reset();
            
            // Mostrar éxito
            this.showNotification(
                `¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto desde nuestro estudio en ${this.firmInfo.location}.`,
                'success'
            );
            
            console.log(`📧 Formulario enviado desde ${this.firmInfo.name}:`, data);
        }, 2000);
    }

    simulateLogin(data) {
        // Aquí iría la lógica real de autenticación
        this.showNotification(`Portal de clientes próximamente disponible. Para consultas inmediatas, contacta al ${this.firmInfo.phone}`, 'info');
        console.log(`🔐 Intento de login en ${this.firmInfo.name}:`, data);
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.style.borderColor = '#e53e3e';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#e53e3e';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // ========================
    // ANIMACIONES Y EFECTOS
    // ========================
    setupAnimations() {
        // Animación de escritura en el hero
        this.setupTypeWriter();
        
        // Animaciones de hover para cards
        this.setupCardAnimations();
        
        // Parallax sutil
        this.setupParallax();
    }

    setupTypeWriter() {
        const titleElement = document.querySelector('.hero-title');
        if (!titleElement) return;

        const originalText = titleElement.innerHTML;
        const highlightText = titleElement.querySelector('.highlight');
        
        if (highlightText) {
            // Efecto sutil de aparición
            setTimeout(() => {
                highlightText.style.opacity = '1';
                highlightText.style.transform = 'translateY(0)';
            }, 500);
        }
    }

    setupCardAnimations() {
        document.querySelectorAll('.service-card, .team-member').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.transition = 'all 0.3s ease';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    setupParallax() {
        window.addEventListener('scroll', Utils.debounce(() => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero::before');
            
            parallaxElements.forEach(el => {
                const speed = 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }, 10));
    }

    // ========================
    // CONTADORES ANIMADOS
    // ========================
    setupCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const originalText = element.textContent;
        const target = parseInt(originalText);
        const suffix = originalText.replace(/\d/g, ''); // Obtener + o %
        const duration = 2000;
        const stepTime = 50;
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, stepTime);
    }

    // ========================
    // LAZY LOADING
    // ========================
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // ========================
    // NOTIFICACIONES
    // ========================
    showNotification(message, type = 'info') {
        // Crear el contenedor de notificaciones si no existe
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 3000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // Crear la notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${type === 'success' ? '#1a365d' : type === 'error' ? '#e53e3e' : '#744210'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: all 0.3s ease;
            pointer-events: auto;
            max-width: 400px;
            word-wrap: break-word;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0;
                    font-size: 1.2rem;
                ">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // ========================
    // EVENT LISTENERS
    // ========================
    bindEvents() {
        // Manejar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateActiveNavLink();
            }, 500);
        });

        // Optimizar para dispositivos táctiles
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }

        // ✅ MANEJAR TECLAS DE ACCESIBILIDAD - MEJORADO
        document.addEventListener('keydown', (e) => {
            // Navegación con Tab mejorada
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
            
            // ✅ NO INTERFERIR CON EL CHAT CUANDO ESTÁ ABIERTO
            if (window.legalChatInstance && window.legalChatInstance.isOpen) {
                // Permitir que el chat maneje sus propias teclas
                return;
            }
        });

        // ✅ CLICKS MEJORADOS - PREVENIR CONFLICTOS CON CHAT
        document.addEventListener('click', (e) => {
            // ✅ NO CERRAR MENÚS SI SE HACE CLICK EN EL CHAT
            if (e.target.closest('.chat-widget')) {
                return;
            }
            
            // No cerrar menús si el chat está abierto y se hace click en él
            if (window.legalChatInstance && window.legalChatInstance.isOpen && 
                e.target.closest('#chat-window, #chat-toggle')) {
                return;
            }
            
            // Cerrar menú móvil al hacer click fuera
            const navToggle = document.getElementById('nav-toggle');
            const navMenu = document.getElementById('nav-menu');
            
            if (navToggle && navMenu && 
                !navToggle.contains(e.target) && 
                !navMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // ✅ PERFORMANCE MONITORING MEJORADO
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`⚡ ${this.firmInfo.name} cargado en ${Math.round(loadTime)}ms`);
            
            // ✅ VERIFICAR QUE EL CHAT SE INICIALIZÓ CORRECTAMENTE
            setTimeout(() => {
                if (window.chatUtils && window.chatUtils.isReady()) {
                    console.log(`✅ Chat widget ${this.firmInfo.name} ready`);
                } else {
                    console.warn(`⚠️ Chat widget ${this.firmInfo.name} no se inicializó correctamente`);
                }
            }, 1000);
        });

        // ✅ MANEJAR RESIZE PARA CHAT Y RESPONSIVE
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Actualizar navegación activa
                this.updateActiveNavLink();
                
                // ✅ NOTIFICAR AL CHAT SOBRE CAMBIO DE VIEWPORT
                if (window.legalChatInstance) {
                    // Cerrar chat en cambio a móvil si está abierto
                    if (window.innerWidth <= 480 && window.legalChatInstance.isOpen) {
                        // El chat se ajustará automáticamente
                    }
                }
            }, 250);
        });

        // ✅ MANEJAR ERRORES GLOBALES QUE PUEDAN AFECTAR EL CHAT
        window.addEventListener('error', (e) => {
            console.error(`Error global en ${this.firmInfo.name}:`, e.error);
            
            // Si el error está relacionado con el chat, intentar recuperación
            if (e.error && e.error.message && 
                e.error.message.includes('chat')) {
                console.warn(`Error relacionado con chat ${this.firmInfo.name} detectado, intentando recuperación...`);
                
                // Intentar reinicializar chat después de un breve delay
                setTimeout(() => {
                    if (!window.legalChatInstance) {
                        console.log(`Intentando reinicializar chat ${this.firmInfo.name}...`);
                        if (typeof initializeLegalChat === 'function') {
                            initializeLegalChat();
                        }
                    }
                }, 2000);
            }
        });

        // ✅ MANEJAR VISIBILIDAD DE LA PÁGINA (PARA PAUSAR/REANUDAR CHAT)
        document.addEventListener('visibilitychange', () => {
            if (window.legalChatInstance) {
                if (document.hidden) {
                    // Página oculta - pausar actividades del chat si es necesario
                    console.log(`Página ${this.firmInfo.name} oculta - pausando chat`);
                } else {
                    // Página visible - reanudar actividades del chat
                    console.log(`Página ${this.firmInfo.name} visible - reanudando chat`);
                }
            }
        });
    }

    // ✅ MÉTODO ADICIONAL PARA COMPATIBILIDAD CON CHAT
    checkChatCompatibility() {
        const issues = [];
        
        // Verificar z-index conflicts
        const footer = document.querySelector('.footer');
        if (footer) {
            const footerZIndex = parseInt(getComputedStyle(footer).zIndex) || 0;
            if (footerZIndex >= 9999) {
                issues.push('Footer z-index muy alto, puede interferir con chat');
            }
        }
        
        // Verificar modal conflicts
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const modalZIndex = parseInt(getComputedStyle(modal).zIndex) || 0;
            if (modalZIndex >= 9999) {
                issues.push('Modal z-index muy alto, puede interferir con chat');
            }
        });
        
        // Verificar header conflicts
        const header = document.querySelector('.header');
        if (header) {
            const headerZIndex = parseInt(getComputedStyle(header).zIndex) || 0;
            if (headerZIndex >= 9999) {
                issues.push('Header z-index muy alto, puede interferir con chat');
            }
        }
        
        if (issues.length > 0) {
            console.warn(`⚠️ Problemas de compatibilidad con chat ${this.firmInfo.name} detectados:`, issues);
        } else {
            console.log(`✅ No hay conflictos de compatibilidad con chat ${this.firmInfo.name}`);
        }
        
        return issues;
    }

    // Método para obtener información de la empresa
    getFirmInfo() {
        return this.firmInfo;
    }

    // Método para mostrar información de contacto rápido
    showQuickContact() {
        const contactInfo = `
            📍 ${this.firmInfo.name}
            📞 ${this.firmInfo.phone}
            📱 ${this.firmInfo.mobile}
            ✉️ ${this.firmInfo.email}
            🏛️ ${this.firmInfo.location}
        `;
        
        this.showNotification(contactInfo, 'info');
    }
}

// ========================
// INICIALIZACIÓN
// ========================

// Inicializar la aplicación
const app = new TijaTijaLawFirmApp();

// Funciones globales para compatibilidad
window.tijaTijaApp = app;
window.lawFirmApp = app; // Mantener compatibilidad

// Funciones de utilidad adicionales
window.tijaTijaUtils = {
    showContact: () => app.showQuickContact(),
    getFirmInfo: () => app.getFirmInfo(),
    formatPhone: Utils.formatPhone,
    validateEmail: Utils.validateEmail
};

// Exportar para uso en otros scripts si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TijaTijaLawFirmApp;
}