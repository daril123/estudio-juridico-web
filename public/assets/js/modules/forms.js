/**
 * MÓDULO DE FORMULARIOS - ESTUDIO JURÍDICO
 * Maneja validación, envío y estados de todos los formularios
 */

import { CONFIG } from '../core/config.js';
import Utils from '../core/utils.js';

export class FormManager {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
        this.bindMethods();
        this.init();
    }

    bindMethods() {
        this.handleInput = Utils.Performance.debounce(this.handleInput.bind(this), CONFIG.forms.validation.debounceTime);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    init() {
        this.setupDefaultValidators();
        this.discoverForms();
        this.setupGlobalListeners();
        
        Utils.Log.info('FormManager initialized');
    }

    // ===========================
    // CONFIGURACIÓN INICIAL
    // ===========================

    setupDefaultValidators() {
        // Validador de email
        this.registerValidator('email', {
            validate: (value) => Utils.Validation.validateEmail(value),
            message: 'Por favor ingresa un email válido'
        });

        // Validador de teléfono
        this.registerValidator('phone', {
            validate: (value) => Utils.Validation.validatePhone(value),
            message: 'Por favor ingresa un teléfono válido',
            formatter: (value) => Utils.Validation.formatPhone(value)
        });

        // Validador de nombre
        this.registerValidator('name', {
            validate: (value) => Utils.Validation.validateName(value),
            message: 'El nombre debe tener al menos 2 caracteres'
        });

        // Validador de mensaje
        this.registerValidator('message', {
            validate: (value) => Utils.Validation.validateMessage(value),
            message: 'El mensaje debe tener al menos 10 caracteres'
        });

        // Validador requerido
        this.registerValidator('required', {
            validate: (value) => value && value.trim().length > 0,
            message: 'Este campo es obligatorio'
        });
    }

    discoverForms() {
        const formElements = Utils.DOM.selectAll('form');
        
        formElements.forEach(form => {
            this.registerForm(form);
        });

        Utils.Log.debug(`Discovered ${formElements.length} forms`);
    }

    setupGlobalListeners() {
        // Delegación de eventos para mejor rendimiento
        document.addEventListener('input', this.handleInput);
        document.addEventListener('focus', this.handleFocus, true);
        document.addEventListener('blur', this.handleBlur, true);
        document.addEventListener('submit', this.handleSubmit);
    }

    // ===========================
    // REGISTRO DE FORMULARIOS
    // ===========================

    registerForm(formElement, options = {}) {
        if (!formElement || formElement.tagName !== 'FORM') {
            Utils.Log.warn('Invalid form element provided');
            return null;
        }

        const formId = formElement.id || Utils.Utils.generateId('form');
        if (!formElement.id) formElement.id = formId;

        const formConfig = {
            element: formElement,
            fields: new Map(),
            options: {
                validateOnInput: true,
                validateOnBlur: true,
                showSuccessStates: true,
                resetOnSuccess: true,
                ...options
            },
            state: {
                isValid: false,
                isSubmitting: false,
                hasErrors: false,
                touched: false
            }
        };

        // Descubrir campos del formulario
        this.discoverFormFields(formConfig);

        this.forms.set(formId, formConfig);
        
        Utils.Log.debug(`Form registered: ${formId}`);
        return formId;
    }

    discoverFormFields(formConfig) {
        const fieldSelectors = [
            'input[type="text"]',
            'input[type="email"]',
            'input[type="tel"]',
            'input[type="password"]',
            'textarea',
            'select'
        ];

        fieldSelectors.forEach(selector => {
            const fields = formConfig.element.querySelectorAll(selector);
            fields.forEach(field => this.registerField(formConfig, field));
        });
    }

    registerField(formConfig, fieldElement, validators = []) {
        const fieldName = fieldElement.name || fieldElement.id || Utils.Utils.generateId('field');
        
        // Auto-detectar validadores basado en atributos
        const autoValidators = this.detectFieldValidators(fieldElement);
        const allValidators = [...autoValidators, ...validators];

        const fieldConfig = {
            element: fieldElement,
            name: fieldName,
            validators: allValidators,
            state: {
                value: fieldElement.value,
                isValid: false,
                isTouched: false,
                errors: [],
                formatted: false
            }
        };

        formConfig.fields.set(fieldName, fieldConfig);
        
        // Agregar clases CSS para styling
        this.setupFieldClasses(fieldElement);
    }

    detectFieldValidators(fieldElement) {
        const validators = [];
        const type = fieldElement.type;
        
        // Required
        if (fieldElement.required || fieldElement.hasAttribute('required')) {
            validators.push('required');
        }

        // Tipo específico
        switch (type) {
            case 'email':
                validators.push('email');
                break;
            case 'tel':
                validators.push('phone');
                break;
        }

        // Por nombre/clase
        if (fieldElement.name.includes('name') || fieldElement.classList.contains('name-field')) {
            validators.push('name');
        }

        if (fieldElement.name.includes('message') || fieldElement.tagName === 'TEXTAREA') {
            validators.push('message');
        }

        return validators;
    }

    setupFieldClasses(fieldElement) {
        const formGroup = fieldElement.closest('.form-group');
        if (formGroup && !formGroup.querySelector('.form-error')) {
            const errorDiv = Utils.DOM.createElement('div', {
                className: 'form-error',
                style: 'display: none;'
            });
            formGroup.appendChild(errorDiv);
        }
    }

    // ===========================
    // VALIDADORES
    // ===========================

    registerValidator(name, config) {
        this.validators.set(name, {
            validate: config.validate,
            message: config.message || 'Valor inválido',
            formatter: config.formatter || null
        });
    }

    validateField(formConfig, fieldConfig) {
        const { element, validators } = fieldConfig;
        const value = element.value.trim();
        const errors = [];

        for (const validatorName of validators) {
            const validator = this.validators.get(validatorName);
            if (validator && !validator.validate(value)) {
                errors.push(validator.message);
            }
        }

        // Actualizar estado del campo
        fieldConfig.state.errors = errors;
        fieldConfig.state.isValid = errors.length === 0;
        fieldConfig.state.value = value;

        // Aplicar formato si existe
        this.applyFieldFormatter(fieldConfig);

        return errors.length === 0;
    }

    applyFieldFormatter(fieldConfig) {
        const { element, validators } = fieldConfig;
        
        for (const validatorName of validators) {
            const validator = this.validators.get(validatorName);
            if (validator && validator.formatter && !fieldConfig.state.formatted) {
                const formattedValue = validator.formatter(element.value);
                if (formattedValue !== element.value) {
                    element.value = formattedValue;
                    fieldConfig.state.formatted = true;
                }
            }
        }
    }

    validateForm(formId) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) return false;

        let isValid = true;
        const errors = [];

        formConfig.fields.forEach((fieldConfig) => {
            const fieldValid = this.validateField(formConfig, fieldConfig);
            if (!fieldValid) {
                isValid = false;
                errors.push(...fieldConfig.state.errors);
            }
        });

        formConfig.state.isValid = isValid;
        formConfig.state.hasErrors = !isValid;

        return { isValid, errors };
    }

    // ===========================
    // EVENT HANDLERS
    // ===========================

    handleInput(event) {
        const field = event.target;
        if (!this.isFormField(field)) return;

        const formConfig = this.getFormConfigByField(field);
        if (!formConfig || !formConfig.options.validateOnInput) return;

        const fieldConfig = this.getFieldConfig(formConfig, field);
        if (!fieldConfig) return;

        // Validar campo en tiempo real
        this.validateField(formConfig, fieldConfig);
        this.updateFieldUI(fieldConfig);
        
        // Resetear formato flag para permitir reformateo
        fieldConfig.state.formatted = false;
    }

    handleFocus(event) {
        const field = event.target;
        if (!this.isFormField(field)) return;

        field.classList.add('focused');
        this.clearFieldError(field);
    }

    handleBlur(event) {
        const field = event.target;
        if (!this.isFormField(field)) return;

        field.classList.remove('focused');

        const formConfig = this.getFormConfigByField(field);
        if (!formConfig || !formConfig.options.validateOnBlur) return;

        const fieldConfig = this.getFieldConfig(formConfig, field);
        if (!fieldConfig) return;

        fieldConfig.state.isTouched = true;
        formConfig.state.touched = true;

        // Validar en blur
        this.validateField(formConfig, fieldConfig);
        this.updateFieldUI(fieldConfig);
    }

    async handleSubmit(event) {
        const form = event.target;
        if (!form || form.tagName !== 'FORM') return;

        const formConfig = this.getFormConfigByElement(form);
        if (!formConfig) return;

        event.preventDefault();

        if (formConfig.state.isSubmitting) return;

        // Validar formulario completo
        const validation = this.validateForm(form.id);
        
        if (!validation.isValid) {
            this.showFormErrors(formConfig, validation.errors);
            this.focusFirstError(formConfig);
            return;
        }

        // Procesar envío
        await this.processFormSubmission(formConfig);
    }

    // ===========================
    // ENVÍO DE FORMULARIOS
    // ===========================

    async processFormSubmission(formConfig) {
        const formData = this.collectFormData(formConfig);
        const formType = this.detectFormType(formConfig);

        this.setFormLoading(formConfig, true);

        try {
            await this.submitForm(formType, formData, formConfig);
            this.handleFormSuccess(formConfig, formData);
        } catch (error) {
            this.handleFormError(formConfig, error);
        } finally {
            this.setFormLoading(formConfig, false);
        }
    }

    collectFormData(formConfig) {
        const data = {};
        
        formConfig.fields.forEach((fieldConfig, fieldName) => {
            data[fieldName] = fieldConfig.state.value;
        });

        return data;
    }

    detectFormType(formConfig) {
        const formId = formConfig.element.id;
        
        if (formId.includes('contact')) return 'contact';
        if (formId.includes('login')) return 'login';
        if (formId.includes('newsletter')) return 'newsletter';
        
        return 'generic';
    }

    async submitForm(type, data, formConfig) {
        switch (type) {
            case 'contact':
                return this.submitContactForm(data, formConfig);
            case 'login':
                return this.submitLoginForm(data, formConfig);
            default:
                return this.submitGenericForm(data, formConfig);
        }
    }

    async submitContactForm(data, formConfig) {
        // Simular envío (aquí iría la integración real)
        await Utils.Utils.sleep(2000);
        
        Utils.Log.info('Contact form submitted', data);
        
        // Emitir evento para analytics u otros sistemas
        this.emit('formSubmitted', { type: 'contact', data });
        
        return { success: true, message: 'Mensaje enviado exitosamente' };
    }

    async submitLoginForm(data, formConfig) {
        await Utils.Utils.sleep(1500);
        
        // Aquí iría la lógica real de autenticación
        throw new Error('Función de login próximamente disponible');
    }

    async submitGenericForm(data, formConfig) {
        await Utils.Utils.sleep(1000);
        return { success: true, message: 'Formulario enviado correctamente' };
    }

    // ===========================
    // UI UPDATES
    // ===========================

    updateFieldUI(fieldConfig) {
        const { element, state } = fieldConfig;
        const { isValid, errors, isTouched } = state;

        if (!isTouched) return;

        // Actualizar clases
        element.classList.toggle('error', !isValid);
        element.classList.toggle('success', isValid && element.value.length > 0);

        // Mostrar/ocultar errores
        if (!isValid && errors.length > 0) {
            this.showFieldError(element, errors[0]);
        } else {
            this.clearFieldError(element);
        }
    }

    showFieldError(fieldElement, message) {
        const formGroup = fieldElement.closest('.form-group');
        if (!formGroup) return;

        let errorDiv = formGroup.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = Utils.DOM.createElement('div', { className: 'form-error' });
            formGroup.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Añadir ícono de error
        if (!errorDiv.querySelector('.error-icon')) {
            const icon = Utils.DOM.createElement('i', { className: 'fas fa-exclamation-circle error-icon' });
            errorDiv.insertBefore(icon, errorDiv.firstChild);
        }
    }

    clearFieldError(fieldElement) {
        const formGroup = fieldElement.closest('.form-group');
        if (!formGroup) return;

        const errorDiv = formGroup.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    showFormErrors(formConfig, errors) {
        // Mostrar notificación con errores
        if (window.notificationManager) {
            window.notificationManager.show(
                errors.join('<br>'),
                'error',
                { html: true }
            );
        }
    }

    setFormLoading(formConfig, isLoading) {
        formConfig.state.isSubmitting = isLoading;
        
        const submitButton = formConfig.element.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitButton) return;

        if (isLoading) {
            submitButton.classList.add('btn-loading');
            submitButton.disabled = true;
            
            // Guardar texto original
            if (!submitButton.dataset.originalText) {
                submitButton.dataset.originalText = submitButton.textContent;
            }
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        } else {
            submitButton.classList.remove('btn-loading');
            submitButton.disabled = false;
            
            if (submitButton.dataset.originalText) {
                submitButton.textContent = submitButton.dataset.originalText;
            }
        }
    }

    handleFormSuccess(formConfig, data) {
        // Mostrar notificación de éxito
        if (window.notificationManager) {
            window.notificationManager.show(
                '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.',
                'success'
            );
        }

        // Reset formulario si está configurado
        if (formConfig.options.resetOnSuccess) {
            this.resetForm(formConfig.element.id);
        }

        this.emit('formSuccess', { type: this.detectFormType(formConfig), data });
    }

    handleFormError(formConfig, error) {
        Utils.Log.error('Form submission error:', error);
        
        if (window.notificationManager) {
            window.notificationManager.show(
                error.message || 'Hubo un error al enviar el formulario. Inténtalo nuevamente.',
                'error'
            );
        }

        this.emit('formError', { type: this.detectFormType(formConfig), error });
    }

    focusFirstError(formConfig) {
        for (const [fieldName, fieldConfig] of formConfig.fields) {
            if (!fieldConfig.state.isValid) {
                fieldConfig.element.focus();
                break;
            }
        }
    }

    // ===========================
    // API PÚBLICA
    // ===========================

    resetForm(formId) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) return;

        formConfig.element.reset();
        
        formConfig.fields.forEach((fieldConfig) => {
            fieldConfig.state = {
                value: '',
                isValid: false,
                isTouched: false,
                errors: [],
                formatted: false
            };
            
            this.clearFieldError(fieldConfig.element);
            fieldConfig.element.classList.remove('error', 'success');
        });

        formConfig.state = {
            isValid: false,
            isSubmitting: false,
            hasErrors: false,
            touched: false
        };
    }

    getFormData(formId) {
        const formConfig = this.forms.get(formId);
        return formConfig ? this.collectFormData(formConfig) : null;
    }

    setFieldValue(formId, fieldName, value) {
        const formConfig = this.forms.get(formId);
        if (!formConfig) return;

        const fieldConfig = formConfig.fields.get(fieldName);
        if (!fieldConfig) return;

        fieldConfig.element.value = value;
        fieldConfig.state.value = value;
        
        this.validateField(formConfig, fieldConfig);
        this.updateFieldUI(fieldConfig);
    }

    // ===========================
    // UTILIDADES INTERNAS
    // ===========================

    isFormField(element) {
        return element && (
            element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.tagName === 'SELECT'
        );
    }

    getFormConfigByField(fieldElement) {
        const form = fieldElement.closest('form');
        return form ? this.forms.get(form.id) : null;
    }

    getFormConfigByElement(formElement) {
        return this.forms.get(formElement.id);
    }

    getFieldConfig(formConfig, fieldElement) {
        const fieldName = fieldElement.name || fieldElement.id;
        return formConfig.fields.get(fieldName);
    }

    // ===========================
    // EVENT EMITTER
    // ===========================

    emit(event, data = null) {
        const customEvent = new CustomEvent(`form:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    on(event, callback) {
        document.addEventListener(`form:${event}`, (e) => {
            callback(e.detail);
        });
    }

    // ===========================
    // DESTRUCTOR
    // ===========================

    destroy() {
        document.removeEventListener('input', this.handleInput);
        document.removeEventListener('focus', this.handleFocus, true);
        document.removeEventListener('blur', this.handleBlur, true);
        document.removeEventListener('submit', this.handleSubmit);

        this.forms.clear();
        this.validators.clear();
        
        Utils.Log.info('FormManager destroyed');
    }
}

// ===========================
// FACTORY FUNCTION
// ===========================

export function createFormManager() {
    return new FormManager();
}

// ===========================
// AUTO-INICIALIZACIÓN
// ===========================

let formManagerInstance = null;

export function initializeForms() {
    if (formManagerInstance) {
        Utils.Log.warn('FormManager already initialized');
        return formManagerInstance;
    }

    formManagerInstance = createFormManager();
    
    if (Utils.ConfigManager.getDevConfig('debug.enabled')) {
        window.formManager = formManagerInstance;
    }

    return formManagerInstance;
}

export function getFormManager() {
    return formManagerInstance;
}

export default FormManager;