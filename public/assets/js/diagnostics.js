/**
 * SISTEMA DE DIAGNÓSTICO
 * Verifica que todos los módulos estén cargando correctamente
 */

// Función de diagnóstico global
window.runDiagnostics = async function() {
    console.log('🔍 Ejecutando diagnóstico del sistema...');
    
    const results = {
        timestamp: new Date().toISOString(),
        browser: getBrowserInfo(),
        modules: {},
        css: {},
        elements: {},
        errors: [],
        warnings: [],
        success: []
    };
    
    try {
        // Verificar carga de CSS
        await checkCSSLoading(results);
        
        // Verificar elementos HTML
        checkHTMLElements(results);
        
        // Verificar módulos JavaScript
        await checkJavaScriptModules(results);
        
        // Verificar funcionalidad del chat
        checkChatFunctionality(results);
        
        // Mostrar resultados
        displayDiagnosticResults(results);
        
        return results;
        
    } catch (error) {
        console.error('❌ Error durante diagnóstico:', error);
        results.errors.push(`Error general: ${error.message}`);
        return results;
    }
};

// Verificar carga de CSS
async function checkCSSLoading(results) {
    console.log('📄 Verificando CSS...');
    
    const stylesheets = Array.from(document.styleSheets);
    const expectedFiles = [
        'styles-master.css',
        '01-variables.css',
        '02-reset.css',
        '03-components.css',
        '04-layout.css',
        '05-sections.css',
        '06-responsive.css',
        'chat-base.css',
        'chat-components.css',
        'chat-responsive.css'
    ];
    
    results.css.loaded = stylesheets.length;
    results.css.files = stylesheets.map(sheet => {
        try {
            return sheet.href ? sheet.href.split('/').pop() : 'inline styles';
        } catch (e) {
            return 'protected stylesheet';
        }
    });
    
    // Verificar variables CSS
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);
    
    const primaryColor = getComputedStyle(testElement).getPropertyValue('--primary-color');
    const secondaryColor = getComputedStyle(testElement).getPropertyValue('--secondary-color');
    
    document.body.removeChild(testElement);
    
    results.css.variables = {
        primaryColor: primaryColor.trim() || 'No detectado',
        secondaryColor: secondaryColor.trim() || 'No detectado'
    };
    
    if (primaryColor && secondaryColor) {
        results.success.push('Variables CSS cargadas correctamente');
    } else {
        results.warnings.push('Variables CSS no detectadas - posible problema de carga');
    }
}

// Verificar elementos HTML
function checkHTMLElements(results) {
    console.log('🏗️ Verificando elementos HTML...');
    
    const criticalElements = {
        'header': '#header',
        'nav-container': '.nav-container',
        'nav-menu': '#nav-menu',
        'nav-toggle': '#nav-toggle',
        'chat-widget': '#chat-widget',
        'chat-toggle': '#chat-toggle',
        'chat-window': '#chat-window',
        'chat-messages': '#chat-messages',
        'chat-input': '#chat-input',
        'contact-form': '#contact-form',
        'login-modal': '#login-modal'
    };
    
    results.elements.found = {};
    results.elements.missing = [];
    
    Object.entries(criticalElements).forEach(([name, selector]) => {
        const element = document.querySelector(selector);
        results.elements.found[name] = !!element;
        
        if (!element) {
            results.elements.missing.push(name);
            results.errors.push(`Elemento faltante: ${name} (${selector})`);
        }
    });
    
    if (results.elements.missing.length === 0) {
        results.success.push('Todos los elementos HTML críticos encontrados');
    }
}

// Verificar módulos JavaScript
async function checkJavaScriptModules(results) {
    console.log('📦 Verificando módulos JavaScript...');
    
    const moduleTests = [
        {
            name: 'lawFirmApp',
            test: () => typeof window.lawFirmApp !== 'undefined',
            description: 'Aplicación principal'
        },
        {
            name: 'legalChatCore',
            test: () => typeof window.legalChatInstance !== 'undefined',
            description: 'Sistema de chat'
        },
        {
            name: 'navigationManager',
            test: () => typeof window.navigationManager !== 'undefined',
            description: 'Gestor de navegación'
        },
        {
            name: 'formManager',
            test: () => typeof window.formManager !== 'undefined',
            description: 'Gestor de formularios'
        },
        {
            name: 'modalManager',
            test: () => typeof window.modalManager !== 'undefined',
            description: 'Gestor de modales'
        }
    ];
    
    results.modules.status = {};
    
    moduleTests.forEach(module => {
        const isLoaded = module.test();
        results.modules.status[module.name] = {
            loaded: isLoaded,
            description: module.description
        };
        
        if (isLoaded) {
            results.success.push(`Módulo ${module.name} cargado`);
        } else {
            results.warnings.push(`Módulo ${module.name} no disponible (esto puede ser normal en modo producción)`);
        }
    });
}

// Verificar funcionalidad del chat
function checkChatFunctionality(results) {
    console.log('💬 Verificando funcionalidad del chat...');
    
    const chatWidget = document.getElementById('chat-widget');
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    
    results.chat = {
        elementsPresent: !!(chatWidget && chatToggle && chatWindow),
        isInitialized: typeof window.legalChatInstance !== 'undefined',
        config: {}
    };
    
    if (window.legalChatInstance) {
        try {
            const diagnosis = window.legalChatInstance.diagnose();
            results.chat.diagnosis = diagnosis;
            results.success.push('Chat system diagnostics available');
        } catch (e) {
            results.warnings.push('Chat diagnostics not available');
        }
    }
    
    // Verificar CSS del chat
    const chatStyle = chatWidget ? getComputedStyle(chatWidget) : null;
    results.chat.styling = {
        position: chatStyle ? chatStyle.position : 'N/A',
        zIndex: chatStyle ? chatStyle.zIndex : 'N/A',
        display: chatStyle ? chatStyle.display : 'N/A'
    };
}

// Obtener información del navegador
function getBrowserInfo() {
    const ua = navigator.userAgent;
    return {
        userAgent: ua,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        features: {
            es6Modules: 'noModule' in HTMLScriptElement.prototype,
            intersectionObserver: 'IntersectionObserver' in window,
            customElements: 'customElements' in window,
            webComponents: 'customElements' in window && 'shadow' in Element.prototype,
            serviceWorker: 'serviceWorker' in navigator,
            localStorage: typeof Storage !== 'undefined'
        }
    };
}

// Mostrar resultados del diagnóstico
function displayDiagnosticResults(results) {
    console.log('\n📊 RESULTADOS DEL DIAGNÓSTICO');
    console.log('============================');
    
    // Resumen
    const totalTests = results.success.length + results.warnings.length + results.errors.length;
    console.log(`✅ Éxitos: ${results.success.length}`);
    console.log(`⚠️ Advertencias: ${results.warnings.length}`);
    console.log(`❌ Errores: ${results.errors.length}`);
    console.log(`📈 Total: ${totalTests} verificaciones\n`);
    
    // Detalles de éxitos
    if (results.success.length > 0) {
        console.log('✅ ÉXITOS:');
        results.success.forEach(success => console.log(`  • ${success}`));
        console.log('');
    }
    
    // Detalles de advertencias
    if (results.warnings.length > 0) {
        console.log('⚠️ ADVERTENCIAS:');
        results.warnings.forEach(warning => console.log(`  • ${warning}`));
        console.log('');
    }
    
    // Detalles de errores
    if (results.errors.length > 0) {
        console.log('❌ ERRORES:');
        results.errors.forEach(error => console.log(`  • ${error}`));
        console.log('');
    }
    
    // Información del navegador
    console.log('🌐 NAVEGADOR:');
    console.log(`  • ${getBrowserName()} - ${results.browser.viewport.width}x${results.browser.viewport.height}`);
    console.log(`  • ES6 Modules: ${results.browser.features.es6Modules ? '✅' : '❌'}`);
    console.log(`  • Intersection Observer: ${results.browser.features.intersectionObserver ? '✅' : '❌'}`);
    console.log(`  • Local Storage: ${results.browser.features.localStorage ? '✅' : '❌'}`);
    console.log('');
    
    // CSS Status
    console.log('📄 CSS:');
    console.log(`  • Archivos cargados: ${results.css.loaded}`);
    console.log(`  • Variables CSS: ${results.css.variables.primaryColor ? '✅' : '❌'}`);
    console.log('');
    
    // Módulos Status
    console.log('📦 MÓDULOS:');
    Object.entries(results.modules.status || {}).forEach(([name, status]) => {
        console.log(`  • ${name}: ${status.loaded ? '✅' : '⚠️'} (${status.description})`);
    });
    console.log('');
    
    // Chat Status
    console.log('💬 CHAT:');
    console.log(`  • Elementos presentes: ${results.chat.elementsPresent ? '✅' : '❌'}`);
    console.log(`  • Sistema inicializado: ${results.chat.isInitialized ? '✅' : '⚠️'}`);
    console.log(`  • Posición CSS: ${results.chat.styling.position}`);
    console.log('');
    
    // Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    if (results.errors.length > 0) {
        console.log('  • Corrige los errores listados arriba');
    }
    if (results.warnings.length > 0) {
        console.log('  • Revisa las advertencias - pueden indicar problemas de configuración');
    }
    if (!results.browser.features.es6Modules) {
        console.log('  • Tu navegador no soporta ES6 modules - considera actualizar');
    }
    if (results.success.length === totalTests) {
        console.log('  • 🎉 ¡Todo funciona correctamente!');
    }
    
    console.log('\n📋 Para más detalles, revisa el objeto completo con: runDiagnostics()');
    
    // Crear resumen visual en la página
    createVisualDiagnostic(results);
}

// Crear diagnóstico visual en la página
function createVisualDiagnostic(results) {
    // Remover diagnóstico anterior si existe
    const existing = document.getElementById('diagnostic-panel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.id = 'diagnostic-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10001;
        max-width: 350px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    const totalTests = results.success.length + results.warnings.length + results.errors.length;
    const successRate = Math.round((results.success.length / totalTests) * 100);
    
    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <strong style="color: #4CAF50;">📊 DIAGNÓSTICO DEL SISTEMA</strong>
            <div style="margin-top: 5px; color: ${successRate >= 80 ? '#4CAF50' : successRate >= 60 ? '#FF9800' : '#F44336'};">
                Tasa de éxito: ${successRate}%
            </div>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="color: #4CAF50;">✅ Éxitos: ${results.success.length}</div>
            <div style="color: #FF9800;">⚠️ Advertencias: ${results.warnings.length}</div>
            <div style="color: #F44336;">❌ Errores: ${results.errors.length}</div>
        </div>
        
        <div style="margin-bottom: 10px;">
            <strong>CSS:</strong> ${results.css.loaded} archivos
            <br><strong>Módulos:</strong> ${Object.keys(results.modules.status || {}).length} verificados
            <br><strong>Chat:</strong> ${results.chat.elementsPresent ? '✅' : '❌'} Elementos
        </div>
        
        <div style="text-align: center; margin-top: 15px;">
            <button onclick="document.getElementById('diagnostic-panel').remove()" 
                    style="background: #F44336; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                Cerrar
            </button>
            <button onclick="console.log(window.lastDiagnosticResults)" 
                    style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;">
                Ver Detalles
            </button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Guardar resultados para acceso posterior
    window.lastDiagnosticResults = results;
    
    // Auto-remover después de 15 segundos
    setTimeout(() => {
        if (document.getElementById('diagnostic-panel')) {
            panel.style.opacity = '0.5';
            setTimeout(() => panel.remove(), 3000);
        }
    }, 15000);
}

// Obtener nombre del navegador
function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Desconocido';
}

// Ejecutar diagnóstico automáticamente en desarrollo
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    // Ejecutar después de que todo haya cargado
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🔧 Ejecutando diagnóstico automático...');
            runDiagnostics();
        }, 2000);
    });
}

// Hacer función disponible globalmente
console.log('🔍 Sistema de diagnóstico cargado. Ejecuta runDiagnostics() para verificar el sistema.');