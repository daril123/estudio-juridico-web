/**
 * ESTUDIO JURÍDICO - JAVASCRIPT PRINCIPAL
 * Funcionalidades principales del sitio web
 */

// Configuración global
const CONFIG = {
    animationDuration: 300,
    scrollOffset: 80,
    typingSpeed: 50,
    autoSlideInterval: 5000
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

    // Formatear teléfono
    formatPhone(phone) {
        return phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
};

// Clase principal de la aplicación
class LawFirmApp {
    constructor() {
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
        
        console.log('🏛️ LawFirm App initialized successfully');
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
                this.showNotification('Función de registro próximamente disponible', 'info');
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
                '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.',
                'success'
            );
            
            console.log('Formulario enviado:', data);
        }, 2000);
    }

    simulateLogin(data) {
        // Aquí iría la lógica real de autenticación
        this.showNotification('Función de login próximamente disponible', 'info');
        console.log('Intento de login:', data);
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
                card.style.transform = 'translateY(-10px) scale(1.02)';
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
        const target = parseInt(element.textContent);
        const duration = 2000;
        const stepTime = 50;
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = element.textContent.includes('+') ? target + '+' :
                                   element.textContent.includes('%') ? target + '%' : target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + 
                    (element.textContent.includes('+') ? '+' :
                     element.textContent.includes('%') ? '%' : '');
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
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
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

        // Manejar teclas de accesibilidad
        document.addEventListener('keydown', (e) => {
            // Navegación con Tab mejorada
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Performance monitoring
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`⚡ Página cargada en ${Math.round(loadTime)}ms`);
        });
    }
}

// ========================
// INICIALIZACIÓN
// ========================

// Inicializar la aplicación
const app = new LawFirmApp();

// Funciones globales para compatibilidad
window.lawFirmApp = app;

// Exportar para uso en otros scripts si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LawFirmApp;
}