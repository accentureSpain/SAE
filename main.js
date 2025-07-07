// Configuración de Supabase
const SUPABASE_URL = 'https://iktcwnrazpxauwshfwpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdGN3bnJhenB4YXV3c2hmd3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDk4NTIsImV4cCI6MjA2NTMyNTg1Mn0.GHlZ_Hkqdw-zY_CMFNhNVAmzBnwgRjJiAmXzTVxpbIs';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let currentSection = 'home';
let currentTestCategory = 'tecnicas';
let currentQuestionIndex = 0;
let chartInstances = {};
let currentUser = null;
let isOfflineMode = false;

// API Key integrada del mentor  
const MENTOR_API_KEY = 'pplx-tnSUQJptZvIskWlMDrO9WyHEENl6l2sqBpjdjWzTlnclA2x';

// Variables para comparativas entre períodos
let periodComparisonData = {
    '2024-08': { tecnicas: 3.8, transversales: 3.5, digitales: 2.9, linguisticas: 3.2, diferenciadoras: 3.6, interpersonales: 3.4 },
    '2024-09': { tecnicas: 3.9, transversales: 3.6, digitales: 2.8, linguisticas: 3.3, diferenciadoras: 3.7, interpersonales: 3.5 },
    '2024-10': { tecnicas: 4.0, transversales: 3.7, digitales: 2.9, linguisticas: 3.4, diferenciadoras: 3.8, interpersonales: 3.6 },
    '2024-11': { tecnicas: 4.1, transversales: 3.8, digitales: 3.0, linguisticas: 3.4, diferenciadoras: 3.9, interpersonales: 3.7 },
    '2024-12': { tecnicas: 4.2, transversales: 3.8, digitales: 3.2, linguisticas: 3.4, diferenciadoras: 4.0, interpersonales: 3.9 },
    '2025-01': { tecnicas: 4.8, transversales: 4.5, digitales: 2.8, linguisticas: 3.4, diferenciadoras: 4.0, interpersonales: 3.9 }
};

// Módulo de recomendaciones de formación
const formationRecommendations = {
    'excel-advanced': {
        id: 'excel-advanced',
        title: 'Curso Avanzado de Excel',
        competency: 'digitales',
        priority: 'high',
        hours: 40,
        nextDate: '2025-01-15',
        compatibility: 85,
        description: 'Formación intensiva en Excel avanzado para mejorar competencias ofimáticas',
        provider: 'INAP',
        certificate: true
    },
    'digital-management': {
        id: 'digital-management',
        title: 'Taller de Gestión Digital',
        competency: 'digitales',
        priority: 'high',
        hours: 16,
        nextDate: '2025-01-20',
        compatibility: 78,
        description: 'Herramientas digitales para la gestión eficiente en el sector público',
        provider: 'INAP',
        certificate: false
    },
    'assertive-communication': {
        id: 'assertive-communication',
        title: 'Comunicación Asertiva',
        competency: 'transversales',
        priority: 'medium',
        hours: 24,
        nextDate: '2025-02-01',
        compatibility: 72,
        description: 'Técnicas de comunicación efectiva y asertiva',
        provider: 'INAP',
        certificate: true
    },
    'technical-english': {
        id: 'technical-english',
        title: 'Inglés Técnico',
        competency: 'linguisticas',
        priority: 'medium',
        hours: 60,
        nextDate: '2025-02-15',
        compatibility: 68,
        description: 'Inglés aplicado al ámbito laboral y técnico',
        provider: 'Escuela de Idiomas',
        certificate: true
    },
    'time-management': {
        id: 'time-management',
        title: 'Gestión del Tiempo',
        competency: 'transversales',
        priority: 'medium',
        hours: 12,
        nextDate: '2025-01-25',
        compatibility: 65,
        description: 'Técnicas de organización y gestión eficiente del tiempo',
        provider: 'INAP',
        certificate: false
    },
    'public-leadership': {
        id: 'public-leadership',
        title: 'Liderazgo en el Servicio Público',
        competency: 'diferenciadoras',
        priority: 'low',
        hours: 50,
        nextDate: '2025-03-01',
        compatibility: 60,
        description: 'Desarrollo de habilidades de liderazgo en el sector público',
        provider: 'INAP',
        certificate: true
    },
    'digital-transformation': {
        id: 'digital-transformation',
        title: 'Transformación Digital',
        competency: 'digitales',
        priority: 'low',
        hours: 35,
        nextDate: '2025-03-15',
        compatibility: 55,
        description: 'Tendencias y aplicaciones de la transformación digital',
        provider: 'Universidad Complutense',
        certificate: true
    }
};

// Función para inicializar modo offline
function initializeOfflineMode() {
    // Crear usuario demo para modo offline
    currentUser = {
        id: 'offline-user',
        email: 'demo@servicioempleo.es',
        user_metadata: {
            nombre: 'María García López',
            puesto: 'Técnico/a de empleo',
            departamento: 'Orientación Laboral',
            nivel: 2
        },
        rol: 'user'
    };
    
    // Mostrar notificación de modo offline
    showNotification('Funcionando en modo offline - Las funciones básicas están disponibles', 'info');
    
    console.log('Modo offline inicializado correctamente');
}

// Inicialización al cargar el documento
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar autenticación y base de datos con modo offline de respaldo
    try {
        await initializeSupabase();
    } catch (error) {
        console.warn('Error conectando a Supabase, activando modo offline:', error);
        isOfflineMode = true;
        initializeOfflineMode();
    }
    
    // Verificar si hay un hash en la URL para mostrar una sección específica
    const hash = window.location.hash;
    const sectionId = hash ? hash.substring(1) : 'home';
    
    // Inicializar la sección activa
    showSection(sectionId);
    
    // Inicializar gráficos
    initializeCharts();
    
    // Inicializar tooltips de Bootstrap
    initTooltips();
    
    // Cargar datos del usuario actual
    await loadUserData();
    
    // Cargar datos de administración si el usuario es admin
    if (currentUser?.rol === 'admin') {
        await loadAdminData();
    }
    
    // Inicializar sistema de notificaciones y recordatorios
    initializeNotificationSystem();
    
    // Configurar notificaciones inteligentes
    setupIntelligentNotifications();
    
    // Configurar recordatorios semanales
    setupWeeklyReminders();
    
    // Verificar milestones de progreso
    checkProgressMilestones();
    
    // Inicializar sistema de gamificación
    initializeGamificationSystem();
    
    // Cargar datos de feedback
    loadFeedbackData();
    
    // Inicializar comparativas entre períodos
    initializePeriodComparisons();
    
    // Agregar un listener para detectar cambios en el hash
    window.addEventListener('hashchange', function() {
        const newHash = window.location.hash;
        const newSectionId = newHash ? newHash.substring(1) : 'home';
        showSection(newSectionId);
    });
});

// Inicializar Supabase y autenticación
async function initializeSupabase() {
    try {
        // Comprobar si hay un usuario logueado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            // Si no hay usuario, crear uno demo por defecto para mantener funcionalidad
            await createDemoUser();
        } else {
            currentUser = user;
            // Cargar datos del usuario desde la base de datos
            await loadUserProfile();
        }
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        // Fallback a modo demo si hay errores
        await createDemoUser();
    }
}

// Crear usuario demo para mantener funcionalidad
async function createDemoUser() {
    try {
        // Intentar crear/obtener usuario demo
        const demoEmail = 'demo@servicioempleo.es';
        
        // Buscar si ya existe el usuario demo
        const { data: existingUser, error: searchError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', demoEmail)
            .single();

        if (existingUser) {
            currentUser = { 
                id: existingUser.id, 
                email: existingUser.email,
                user_metadata: {
                    nombre: existingUser.nombre,
                    puesto: existingUser.puesto_trabajo,
                    departamento: existingUser.departamento
                }
            };
        } else {
            // Crear usuario demo
            const { data: newUser, error: insertError } = await supabase
                .from('usuarios')
                .insert({
                    nombre: 'María García López',
                    email: demoEmail,
                    puesto_trabajo: 'Técnica de Empleo',
                    departamento: 'Orientación Laboral',
                    rol: 'usuario',
                    fecha_ingreso: '2021-03-15',
                    estado: 'activo'
                })
                .select()
                .single();

            if (newUser) {
                currentUser = {
                    id: newUser.id,
                    email: newUser.email,
                    user_metadata: {
                        nombre: newUser.nombre,
                        puesto: newUser.puesto_trabajo,
                        departamento: newUser.departamento
                    }
                };
            }
        }
    } catch (error) {
        console.error('Error creando usuario demo:', error);
        // Fallback a usuario local si Supabase falla
        currentUser = {
            id: 'demo-user',
            email: 'demo@servicioempleo.es',
            user_metadata: {
                nombre: 'María García López',
                puesto: 'Técnica de Empleo',
                departamento: 'Orientación Laboral'
            }
        };
    }
}

// Cargar perfil del usuario desde la base de datos
async function loadUserProfile() {
    try {
        const { data: userProfile, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (userProfile) {
            currentUser.user_metadata = {
                ...currentUser.user_metadata,
                nombre: userProfile.nombre,
                puesto: userProfile.puesto_trabajo,
                departamento: userProfile.departamento
            };
        }
    } catch (error) {
        console.error('Error cargando perfil del usuario:', error);
    }
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Actualizar elementos de UI con datos del usuario
        const profileNameElements = document.querySelectorAll('#profileName');
        profileNameElements.forEach(element => {
            element.textContent = currentUser?.user_metadata?.nombre || 'María García López';
        });

        const profilePositionElements = document.querySelectorAll('#profilePosition');
        profilePositionElements.forEach(element => {
            element.textContent = currentUser?.user_metadata?.puesto || 'Técnica de Empleo';
        });

        const profileDepartmentElements = document.querySelectorAll('#profileDepartment');
        profileDepartmentElements.forEach(element => {
            element.textContent = currentUser?.user_metadata?.departamento || 'Orientación Laboral';
        });

        // Cargar estadísticas desde Supabase si está disponible
        await loadUserStats();
        
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
    }
}

// Cargar estadísticas del usuario desde la base de datos
async function loadUserStats() {
    try {
        // Intentar cargar desde Supabase
        const { data: evaluations, error } = await supabase
            .from('evaluaciones')
            .select('*')
            .eq('usuario_id', currentUser?.id)
            .order('fecha_completada', { ascending: false });

        if (evaluations && evaluations.length > 0) {
            // Calcular estadísticas desde las evaluaciones
            const latestEvaluation = evaluations[0];
            const averageScore = evaluations.reduce((sum, eval) => sum + eval.puntuacion_total, 0) / evaluations.length;
            
            // Actualizar UI con datos reales
            document.getElementById('competenciesCount').textContent = evaluations.length;
            document.getElementById('averageLevel').textContent = averageScore.toFixed(1);
            document.getElementById('lastEvaluation').textContent = new Date(latestEvaluation.fecha_completada).toLocaleDateString('es-ES');
        }
    } catch (error) {
        console.log('Usando datos demo para estadísticas');
        // Mantener datos demo si Supabase no está disponible
    }
}

// Cargar datos de administración
async function loadAdminData() {
    try {
        // Cargar usuarios
        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('*')
            .order('nombre');

        // Cargar puestos
        const { data: puestos, error: puestosError } = await supabase
            .from('puestos_trabajo')
            .select('*')
            .order('nombre');

        // Cargar competencias
        const { data: competencias, error: competenciasError } = await supabase
            .from('competencias')
            .select('*')
            .order('nombre');

        // Actualizar tablas de administración si existen
        if (usuarios) updateAdminUsersTable(usuarios);
        if (puestos) updateAdminPositionsTable(puestos);
        if (competencias) updateAdminCompetenciesTable(competencias);

    } catch (error) {
        console.error('Error cargando datos de administración:', error);
    }
}

// Funciones de actualización de tablas de administración
function updateAdminUsersTable(users) {
    // Implementar actualización de tabla de usuarios
    console.log('Actualizando tabla de usuarios:', users.length);
}

function updateAdminPositionsTable(positions) {
    // Implementar actualización de tabla de puestos
    console.log('Actualizando tabla de puestos:', positions.length);
}

function updateAdminCompetenciesTable(competencies) {
    // Implementar actualización de tabla de competencias
    console.log('Actualizando tabla de competencias:', competencies.length);
}

// Funciones de navegación
function showSection(sectionId) {
    console.log('🎯 showSection called with:', sectionId);
    
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionId;
        
        // Actualizar navegación activa
        updateActiveNavigation(sectionId);
        
        // Actualizar gráficos si es necesario
        if (sectionId === 'reports') {
            setTimeout(() => {
                updateCharts();
            }, 100);
        }
        
        // Cargar datos específicos de la sección
        if (sectionId === 'training') {
            loadTrainingData();
        } else if (sectionId === 'reports') {
            loadReportsData();
        } else if (sectionId === 'assistant') {
            // Verificar que los elementos del mentor existan
            const userMessageEl = document.getElementById('userMessage');
            const chatContainer = document.getElementById('chatContainer');
            console.log('🔍 Mentor section loaded - userMessage exists:', !!userMessageEl);
            console.log('🔍 Mentor section loaded - chatContainer exists:', !!chatContainer);
            
            // Inicializar el chat si es necesario
            if (chatContainer && !chatContainer.querySelector('.chat-message')) {
                initializeChat();
            }
        }
        
        console.log('✅ Section displayed successfully:', sectionId);
    } else {
        console.error('❌ Section not found:', sectionId);
    }
}

// Hacer showSection disponible globalmente
window.showSection = showSection;

function updateActiveNavigation(sectionId) {
    // Actualizar enlaces del navbar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Inicializar gráficos
function initializeCharts() {
    // Gráfico de competencias en el perfil
    const competencyCtx = document.getElementById('competencyChart');
    if (competencyCtx) {
        chartInstances.competency = new Chart(competencyCtx, {
            type: 'radar',
            data: {
                labels: [
                    'Técnicas (Específicas del Puesto)',
                    'Transversales (Soft Skills)',
                    'Digitales',
                    'Lingüísticas',
                    'Diferenciadoras (opcionales)',
                    'Interpersonales'
                ],
                datasets: [{
                    label: 'Mi Nivel',
                    data: [4.2, 3.8, 3.5, 3.4, 4.0, 3.9],
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
                }, {
                    label: 'Objetivo',
                    data: [4.5, 4.0, 4.0, 3.8, 4.2, 4.5],
                    backgroundColor: 'rgba(25, 135, 84, 0.2)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    pointBackgroundColor: 'rgba(25, 135, 84, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(25, 135, 84, 1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: {
                            display: false
                        },
                        suggestedMin: 0,
                        suggestedMax: 5
                    }
                }
            }
        });
    }

    // Gráfico de informes
    const radarCtx = document.getElementById('competencyRadarChart');
    if (radarCtx) {
        chartInstances.radar = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: [
                    'Técnicas (Específicas del Puesto)',
                    'Transversales (Soft Skills)',
                    'Digitales',
                    'Lingüísticas',
                    'Diferenciadoras (opcionales)',
                    'Interpersonales'
                ],
                datasets: [{
                    label: 'Nivel Actual',
                    data: [4.2, 3.8, 3.5, 3.4, 4.0, 3.9],
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: false
                        },
                        suggestedMin: 0,
                        suggestedMax: 5
                    }
                }
            }
        });
    }
}

function updateCharts() {
    // Actualizar datos de los gráficos si es necesario
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.update === 'function') {
            chart.update();
        }
    });
}

function changeChartType(type) {
    const ctx = document.getElementById('competencyChart');
    if (!ctx || !chartInstances.competency) return;
    
    // Destruir gráfico existente
    chartInstances.competency.destroy();
    
    // Crear nuevo gráfico con el tipo especificado
    const data = {
        labels: [
            'Técnicas (Específicas del Puesto)',
            'Transversales (Soft Skills)',
            'Digitales',
            'Lingüísticas',
            'Diferenciadoras (opcionales)',
            'Interpersonales'
        ],
        datasets: [{
            label: 'Mi Nivel',
            data: [4.2, 3.8, 3.5, 3.4, 4.0, 3.9],
            backgroundColor: [
                'rgba(13, 110, 253, 0.8)',
                'rgba(25, 135, 84, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(220, 53, 69, 0.8)',
                'rgba(108, 117, 125, 0.8)',
                'rgba(111, 66, 193, 0.8)'
            ],
            borderColor: [
                'rgba(13, 110, 253, 1)',
                'rgba(25, 135, 84, 1)',
                'rgba(255, 193, 7, 1)',
                'rgba(220, 53, 69, 1)',
                'rgba(108, 117, 125, 1)',
                'rgba(111, 66, 193, 1)'
            ],
            borderWidth: 2
        }]
    };
    
    let options = {
        responsive: true,
        maintainAspectRatio: false
    };
    
    if (type === 'radar') {
        options.scales = {
            r: {
                angleLines: { display: false },
                suggestedMin: 0,
                suggestedMax: 5
            }
        };
    } else if (type === 'bar') {
        options.scales = {
            y: {
                beginAtZero: true,
                max: 5
            }
        };
    }
    
    chartInstances.competency = new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}

// Funciones del sistema de evaluación
function selectTestCategory(category) {
    currentTestCategory = category;
    currentQuestionIndex = 0;
    
    // Actualizar UI de la categoría seleccionada
    const cards = document.querySelectorAll('.competency-category-card');
    cards.forEach(card => {
        card.classList.remove('border-primary', 'border-3');
    });
    
    event.target.closest('.competency-category-card').classList.add('border-primary', 'border-3');
    
    // Definir datos específicos de cada categoría
    const categoryData = {
        'tecnicas': {
            title: 'Competencias Técnicas (Específicas del Puesto)',
            icon: 'fas fa-briefcase',
            color: 'primary',
            description: 'Esta evaluación consta de <strong>20 preguntas</strong> diseñadas para medir tu nivel actual en competencias técnicas específicas de tu puesto de trabajo en el Servicio de Empleo.',
            duration: '10-15 minutos',
            questions: '20',
            focus: 'Legislación laboral y procedimientos específicos del SEPE',
            focusIcon: 'fas fa-gavel'
        },
        'transversales': {
            title: 'Competencias Transversales (Soft Skills)',
            icon: 'fas fa-users',
            color: 'info',
            description: 'Esta evaluación consta de <strong>20 preguntas</strong> diseñadas para medir tus habilidades transversales como comunicación, trabajo en equipo y pensamiento crítico.',
            duration: '10-12 minutos',
            questions: '20',
            focus: 'Comunicación efectiva, trabajo colaborativo y resolución de problemas',
            focusIcon: 'fas fa-handshake'
        },
        'digitales': {
            title: 'Competencias Digitales',
            icon: 'fas fa-laptop',
            color: 'success',
            description: 'Esta evaluación consta de <strong>20 preguntas</strong> diseñadas para evaluar tu nivel en tecnologías digitales y herramientas informáticas del entorno laboral.',
            duration: '8-10 minutos',
            questions: '20',
            focus: 'Herramientas ofimáticas, gestión de datos y ciberseguridad básica',
            focusIcon: 'fas fa-shield-alt'
        },
        'linguisticas': {
            title: 'Competencias Lingüísticas',
            icon: 'fas fa-language',
            color: 'warning',
            description: 'Esta evaluación consta de <strong>15 preguntas</strong> diseñadas para evaluar tus habilidades de comunicación escrita, comprensión y dominio de idiomas.',
            duration: '6-8 minutos',
            questions: '15',
            focus: 'Redacción formal, comprensión de normativas e idiomas extranjeros',
            focusIcon: 'fas fa-file-alt'
        },
        'diferenciadoras': {
            title: 'Competencias Diferenciadoras (opcionales)',
            icon: 'fas fa-star',
            color: 'purple',
            description: 'Esta evaluación consta de <strong>12 preguntas</strong> diseñadas para identificar competencias especializadas que aportan valor añadido a tu perfil profesional.',
            duration: '6-8 minutos',
            questions: '12',
            focus: 'Especialización en colectivos, innovación social y programas europeos',
            focusIcon: 'fas fa-trophy'
        },
        'interpersonales': {
            title: 'Competencias Interpersonales',
            icon: 'fas fa-handshake',
            color: 'danger',
            description: 'Esta evaluación consta de <strong>18 preguntas</strong> diseñadas para evaluar tus habilidades de relación, networking y gestión de conflictos.',
            duration: '8-10 minutos',
            questions: '18',
            focus: 'Gestión de conflictos, construcción de relaciones y trabajo colaborativo',
            focusIcon: 'fas fa-people-arrows'
        }
    };
    
    const data = categoryData[category];
    if (!data) return; // Si no existe la categoría, salir
    
    // Actualizar encabezado del test
    const testHeader = document.querySelector('#assessment .card-header');
    if (testHeader) {
        testHeader.className = `card-header bg-${data.color} text-white`;
        
        // Buscar el elemento h5, si no existe lo creamos
        let headerTitle = testHeader.querySelector('h5');
        if (!headerTitle) {
            headerTitle = document.createElement('h5');
            headerTitle.className = 'mb-0';
            testHeader.appendChild(headerTitle);
        }
        
        headerTitle.innerHTML = `<i class="${data.icon} me-2"></i>${data.title}`;
    }
    
    // Actualizar contenido del test
    updateTestContent(data);
}

function updateTestContent(data) {
    // Actualizar descripción principal
    const descriptionElement = document.querySelector('#testIntro .lead');
    if (descriptionElement) {
        descriptionElement.innerHTML = data.description;
    }
    
    // Actualizar duración
    const durationElement = document.querySelector('#testIntro .feature-item:nth-child(1) strong');
    if (durationElement) {
        durationElement.textContent = `Duración aproximada: ${data.duration}`;
    }
    
    // Actualizar enfoque especializado
    const focusElement = document.querySelector('#testIntro .feature-item:nth-child(4)');
    if (focusElement) {
        const focusIcon = focusElement.querySelector('.feature-icon i');
        const focusText = focusElement.querySelector('div strong');
        const focusDesc = focusElement.querySelector('div .small');
        
        if (focusIcon) focusIcon.className = data.focusIcon;
        if (focusText) focusText.textContent = 'Enfoque especializado';
        if (focusDesc) focusDesc.textContent = data.focus;
    }
    
    // Actualizar preview (lado derecho)
    const previewIcon = document.querySelector('.preview-icon i');
    if (previewIcon) {
        previewIcon.className = `${data.icon} fa-2x`;
    }
    
    const previewTitle = document.querySelector('.evaluation-preview h6');
    if (previewTitle) {
        previewTitle.textContent = data.title.split('(')[0].trim(); // Solo el título principal
    }
    
    const previewSubtitle = document.querySelector('.evaluation-preview p.small');
    if (previewSubtitle) {
        const subtitle = data.title.includes('(') ? data.title.split('(')[1].replace(')', '') : '';
        previewSubtitle.textContent = subtitle;
    }
    
    // Actualizar estadísticas rápidas
    const questionsCount = document.querySelector('.quick-stats .col-4:nth-child(1) .h5');
    if (questionsCount) {
        questionsCount.textContent = data.questions;
    }
    
    const durationPreview = document.querySelector('.quick-stats .col-4:nth-child(2) .h5');
    if (durationPreview) {
        const minutes = data.duration.split('-')[0]; // Tomar el primer número
        durationPreview.textContent = minutes.replace(' minutos', '');
    }
    
    // Mostrar notificación de cambio
    showNotification(`Categoría cambiada a: ${data.title}`, 'info');
}

function startTest() {
    // Ocultar introducción y mostrar preguntas
    document.getElementById('testIntro').style.display = 'none';
    document.getElementById('testQuestions').style.display = 'block';
    
    // Inicializar primera pregunta
    currentQuestionIndex = 0;
    updateQuestion();
    
    // Inicializar timer
    startTestTimer();
}

let testStartTime;
let testTimer;

function startTestTimer() {
    testStartTime = new Date();
    testTimer = setInterval(updateElapsedTime, 1000);
}

function updateElapsedTime() {
    const now = new Date();
    const elapsed = Math.floor((now - testStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timeDisplay = document.getElementById('elapsedTime');
    if (timeDisplay) {
        timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateQuestion() {
    const totalQuestions = 20;
    const currentQuestionNumber = currentQuestionIndex + 1;
    
    // Actualizar contadores
    document.getElementById('currentQuestion').textContent = currentQuestionNumber;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('questionNumberBadge').textContent = currentQuestionNumber;
    document.getElementById('navCurrentQuestion').textContent = currentQuestionNumber;
    document.getElementById('navTotalQuestions').textContent = totalQuestions;
    
    // Actualizar barra de progreso
    const progressPercentage = Math.round((currentQuestionNumber / totalQuestions) * 100);
    document.getElementById('progressPercentage').textContent = progressPercentage;
    document.getElementById('questionProgressBar').style.width = `${progressPercentage}%`;
    
    // Actualizar navegación
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    
    const nextBtn = document.getElementById('nextBtn');
    const nextBtnText = document.getElementById('nextBtnText');
    const nextBtnIcon = document.getElementById('nextBtnIcon');
    
    if (currentQuestionNumber === totalQuestions) {
        nextBtnText.textContent = 'Finalizar';
        nextBtnIcon.className = 'fas fa-check ms-2';
    } else {
        nextBtnText.textContent = 'Siguiente';
        nextBtnIcon.className = 'fas fa-arrow-right ms-2';
    }
    
    // Limpiar selección anterior
    const options = document.querySelectorAll('input[name="currentQuestion"]');
    options.forEach(option => {
        option.checked = false;
    });
    
    // Ocultar validación
    document.getElementById('answerValidation').classList.add('d-none');
}

function selectOption(value) {
    // Seleccionar radio button
    document.getElementById(`q-option${value}`).checked = true;
    
    // Actualizar UI visual
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
        card.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
    });
    
    const selectedCard = event.target.closest('.option-card');
    selectedCard.classList.add('border-primary', 'bg-primary', 'bg-opacity-10');
    
    // Ocultar mensaje de validación
    document.getElementById('answerValidation').classList.add('d-none');
}

function nextQuestion() {
    // Validar que se haya seleccionado una respuesta
    const selectedOption = document.querySelector('input[name="currentQuestion"]:checked');
    if (!selectedOption) {
        document.getElementById('answerValidation').classList.remove('d-none');
        return;
    }
    
    // Guardar respuesta
    // Aquí se podría almacenar la respuesta en una array o base de datos
    
    currentQuestionIndex++;
    
    // Verificar si es la última pregunta
    if (currentQuestionIndex >= 20) {
        finishTest();
    } else {
        updateQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestion();
    }
}

function pauseEvaluation() {
    const confirmed = confirm('¿Deseas pausar la evaluación? Podrás reanudarla más tarde desde donde la dejaste.');
    if (confirmed) {
        // Guardar estado actual
        localStorage.setItem('pausedEvaluation', JSON.stringify({
            category: currentTestCategory,
            questionIndex: currentQuestionIndex,
            startTime: testStartTime
        }));
        
        showNotification('Evaluación pausada. Puedes reanudarla desde la sección de Autoevaluación.', 'info');
        
        // Volver a la vista inicial
        document.getElementById('testQuestions').style.display = 'none';
        document.getElementById('testIntro').style.display = 'block';
        
        // Detener timer
        if (testTimer) {
            clearInterval(testTimer);
        }
    }
}

function finishTest() {
    // Detener timer
    if (testTimer) {
        clearInterval(testTimer);
    }
    
    // Calcular tiempo total
    const endTime = new Date();
    const totalTime = Math.floor((endTime - testStartTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    
    // Mostrar resultados
    document.getElementById('testQuestions').style.display = 'none';
    document.getElementById('testResults').style.display = 'block';
    
    // Actualizar datos de resultados
    document.getElementById('resultQuestions').textContent = '20';
    document.getElementById('resultTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('resultDate').textContent = new Date().toLocaleDateString('es-ES');
    
    // Simular puntuación (aquí se calcularía basado en las respuestas reales)
    const score = 4.2;
    const percentage = Math.round((score / 5) * 100);
    
    document.getElementById('mainScore').textContent = score.toFixed(1);
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
    document.getElementById('scoreProgressBar').style.width = `${percentage}%`;
    
    // Determinar nivel de competencia
    let competencyLevel = 'Principiante';
    if (score >= 4.5) competencyLevel = 'Experto';
    else if (score >= 4.0) competencyLevel = 'Avanzado';
    else if (score >= 3.0) competencyLevel = 'Intermedio';
    else if (score >= 2.0) competencyLevel = 'Básico';
    
    document.getElementById('competencyLevel').innerHTML = `<i class="fas fa-medal me-1"></i>Nivel ${competencyLevel}`;
    
    // Guardar resultados en Supabase si está disponible
    saveEvaluationResults(score);
    
    // Mostrar notificación de éxito
    showNotification('¡Evaluación completada con éxito! Los resultados han sido guardados en tu perfil.', 'success');
    
    // Actualizar progreso general
    updateOverallProgress();
}

async function saveEvaluationResults(score) {
    try {
        if (currentUser && supabase) {
            const evaluationData = {
                usuario_id: currentUser.id,
                categoria_competencia: currentTestCategory,
                puntuacion_total: score,
                fecha_completada: new Date().toISOString(),
                tiempo_empleado: Math.floor((new Date() - testStartTime) / 1000),
                respuestas: [], // Aquí irían las respuestas específicas
                completada: true
            };
            
            const { data, error } = await supabase
                .from('evaluaciones')
                .insert(evaluationData);
                
            if (error) {
                console.error('Error guardando evaluación:', error);
            } else {
                console.log('Evaluación guardada exitosamente');
            }
        }
    } catch (error) {
        console.error('Error al guardar evaluación:', error);
    }
}

function updateOverallProgress() {
    // Actualizar estadísticas globales
    const completedCount = document.getElementById('completedCount');
    if (completedCount) {
        const current = parseInt(completedCount.textContent.split('/')[0]) || 0;
        completedCount.textContent = `${current + 1}/6`;
        
        const progressBar = document.getElementById('overallProgress');
        if (progressBar) {
            const percentage = Math.round(((current + 1) / 6) * 100);
            progressBar.style.width = `${percentage}%`;
        }
    }
}

function downloadResults() {
    showNotification('Generando informe PDF...', 'info');
    // Aquí se implementaría la generación del PDF
}

function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'Resultados de Evaluación de Competencias',
            text: 'He completado mi evaluación de competencias profesionales',
            url: window.location.href
        });
    } else {
        // Fallback para navegadores que no soportan Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Enlace copiado al portapapeles', 'success');
        });
    }
}

// Funciones del sistema de informes
function showReport(reportType) {
    // Ocultar todos los informes
    const reports = document.querySelectorAll('.report-content');
    reports.forEach(report => {
        report.style.display = 'none';
    });
    
    // Mostrar el informe seleccionado
    const targetReport = document.getElementById(`${reportType}-report`);
    if (targetReport) {
        targetReport.style.display = 'block';
    }
    
    // Actualizar navegación activa
    const listItems = document.querySelectorAll('.list-group-item');
    listItems.forEach(item => {
        item.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Cargar datos específicos del informe
    if (reportType === 'progress') {
        loadProgressReport();
    } else if (reportType === 'recommendations') {
        loadRecommendationsReport();
    } else if (reportType === 'benchmarking') {
        loadBenchmarkingReport();
    } else if (reportType === 'adoption') {
        loadAdoptionReport();
    } else if (reportType === 'gaps') {
        loadGapsReport();
    }
}

function loadReportsData() {
    // Cargar datos para la sección de informes
    updateCharts();
}

function loadTrainingData() {
    // Cargar datos para la sección de formación
    console.log('Cargando datos de formación...');
}

function loadProgressReport() {
    // Implementar carga de informe de progreso histórico/comparación entre pares
    console.log('Cargando informe de progreso...');
    
    // Destruir gráfico existente si existe
    if (chartInstances.historicalChart) {
        chartInstances.historicalChart.destroy();
    }
    
    // Actualizar contenido para mostrar informe actual
    updateCurrentReportInfo('progress');
    
    // Datos para el gráfico de comparación histórica
    const historicalData = {
        labels: ['Ago 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dic 2024', 'Ene 2025'],
        datasets: [
            {
                label: 'Técnicas',
                data: [3.8, 3.9, 4.0, 4.1, 4.2, 4.8],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Transversales',
                data: [3.5, 3.6, 3.7, 3.8, 3.8, 4.5],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Digitales',
                data: [2.9, 2.8, 2.9, 3.0, 3.2, 2.8],
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Lingüísticas',
                data: [3.2, 3.3, 3.4, 3.4, 3.4, 3.4],
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Diferenciadoras',
                data: [3.6, 3.7, 3.8, 3.9, 4.0, 4.0],
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Interpersonales',
                data: [3.4, 3.5, 3.6, 3.7, 3.9, 3.9],
                borderColor: '#e83e8c',
                backgroundColor: 'rgba(232, 62, 140, 0.1)',
                fill: false,
                tension: 0.4
            }
        ]
    };
    
    // Configuración del gráfico
    const config = {
        type: 'line',
        data: historicalData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución de Competencias - Comparación Histórica',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    title: {
                        display: true,
                        text: 'Puntuación (1-5)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Período'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    // Crear el gráfico
    const ctx = document.getElementById('historicalChart');
    if (ctx) {
        chartInstances.historicalChart = new Chart(ctx, config);
    }
}

function loadRecommendationsReport() {
    // Implementar carga de informe de recomendaciones
    console.log('Cargando informe de recomendaciones...');
    
    // Actualizar contenido para mostrar informe actual
    updateCurrentReportInfo('recommendations');
}

// Nuevos informes de adopción de competencias y análisis de brechas
function loadAdoptionReport() {
    // Implementar carga de informe de adopción de competencias
    console.log('Cargando informe de adopción de competencias...');
    
    // Actualizar contenido para mostrar informe actual
    updateCurrentReportInfo('adoption');
    
    // Destruir gráfico existente si existe
    if (chartInstances.adoptionChart) {
        chartInstances.adoptionChart.destroy();
    }
    
    // Datos para el gráfico de adopción de competencias
    const competencias = ['Legislación laboral', 'Procedimientos SEPE', 'Orientación laboral', 
                          'Gestión prestaciones', 'Políticas empleo', 'Comunicación efectiva',
                          'Trabajo en equipo', 'Adaptabilidad', 'Ofimática', 'Ciberseguridad'];
    
    const velocidadAdopcion = [85, 72, 90, 65, 78, 82, 95, 68, 55, 48];
    const tiempoImplementacion = [14, 30, 10, 45, 21, 15, 7, 21, 60, 90];
    
    // Normalizar el tiempo de implementación para la visualización (0-100)
    const tiempoNormalizado = tiempoImplementacion.map(tiempo => Math.min(100, Math.max(0, 100 - tiempo)));
    
    const adoptionData = {
        labels: competencias,
        datasets: [
            {
                type: 'bar',
                label: 'Velocidad de Adopción (%)',
                data: velocidadAdopcion,
                backgroundColor: 'rgba(0, 123, 255, 0.7)',
                borderColor: '#007bff',
                borderWidth: 1,
                yAxisID: 'y'
            },
            {
                type: 'line',
                label: 'Facilidad de Implementación',
                data: tiempoNormalizado,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#28a745',
                yAxisID: 'y1'
            }
        ]
    };
    
    const config = {
        type: 'bar',
        data: adoptionData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Adopción e Implementación de Competencias',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += context.raw + '%';
                            } else {
                                // Para la facilidad de implementación, mostrar el valor original
                                const originalValue = tiempoImplementacion[context.dataIndex];
                                label += 'Tiempo medio: ' + originalValue + ' días';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Velocidad de Adopción (%)'
                    }
                },
                y1: {
                    beginAtZero: true,
                    max: 100,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Facilidad de Implementación'
                    }
                }
            }
        }
    };
    
    // Crear el gráfico
    const ctx = document.getElementById('adoptionChart');
    if (ctx) {
        chartInstances.adoptionChart = new Chart(ctx, config);
    }
}

function loadGapsReport() {
    // Implementar carga de informe de análisis de brechas
    console.log('Cargando informe de análisis de brechas...');
    
    // Actualizar contenido para mostrar informe actual
    updateCurrentReportInfo('gaps');
    
    // Destruir gráfico existente si existe
    if (chartInstances.gapsChart) {
        chartInstances.gapsChart.destroy();
    }
    
    // Datos para el gráfico de análisis de brechas
    const competencias = ['Técnicas', 'Transversales', 'Digitales', 'Lingüísticas', 'Diferenciadoras', 'Interpersonales'];
    const nivelActual = [4.8, 4.5, 2.8, 3.4, 4.0, 3.9];
    const nivelRequerido = [4.0, 4.2, 4.0, 3.5, 3.0, 4.5];
    
    // Calcular las brechas y determinar colores
    const brechas = nivelActual.map((actual, index) => actual - nivelRequerido[index]);
    const brechaColors = brechas.map(brecha => 
        brecha >= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'
    );
    
    const gapsData = {
        labels: competencias,
        datasets: [
            {
                label: 'Nivel Actual',
                data: nivelActual,
                backgroundColor: 'rgba(0, 123, 255, 0.7)',
                borderColor: '#007bff',
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
                order: 2
            },
            {
                label: 'Nivel Requerido',
                data: nivelRequerido,
                backgroundColor: 'rgba(108, 117, 125, 0.4)',
                borderColor: '#6c757d',
                borderWidth: 1,
                borderDash: [5, 5],
                barPercentage: 0.6,
                categoryPercentage: 0.8,
                order: 1
            },
            {
                label: 'Brecha',
                data: brechas,
                backgroundColor: brechaColors,
                borderColor: brechaColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1,
                type: 'bar',
                yAxisID: 'y1',
                order: 0
            }
        ]
    };
    
    const config = {
        type: 'bar',
        data: gapsData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Análisis de Brechas de Competencias',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 2) { // Para brechas
                                const value = context.raw;
                                if (value >= 0) {
                                    label += '+' + value.toFixed(1) + ' (Excede requisito)';
                                } else {
                                    label += value.toFixed(1) + ' (Déficit)';
                                }
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Categorías de Competencias'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 5,
                    title: {
                        display: true,
                        text: 'Nivel (1-5)'
                    }
                },
                y1: {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Brecha'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value > 0) return '+' + value;
                            return value;
                        }
                    }
                }
            }
        }
    };
    
    // Crear el gráfico
    const ctx = document.getElementById('gapsChart');
    if (ctx) {
        chartInstances.gapsChart = new Chart(ctx, config);
    }
}

// Función para actualizar la información del informe actual (para exportación)
function updateCurrentReportInfo(reportType) {
    window.currentReportType = reportType;
    const reportTitles = {
        'overview': 'Resumen General',
        'detailed': 'Informe Detallado',
        'progress': 'Comparación entre Pares',
        'recommendations': 'Recomendaciones',
        'benchmarking': 'Informe de Benchmarking',
        'adoption': 'Adopción de Competencias',
        'gaps': 'Análisis de Brechas'
    };
    
    window.currentReportTitle = reportTitles[reportType] || 'Informe';
}

// Función para exportar el informe actual
function exportReport(format) {
    if (!window.currentReportType) {
        showNotification('Por favor, selecciona un informe para exportar', 'warning');
        return;
    }
    
    const reportTitle = window.currentReportTitle || 'Informe';
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${formatDate(new Date())}`;
    
    showNotification(`Preparando exportación en formato ${format.toUpperCase()}...`, 'info');
    
    try {
        switch (format) {
            case 'pdf':
                exportAsPDF(fileName);
                break;
            case 'excel':
                exportAsExcel(fileName);
                break;
            case 'image':
                exportAsImage(fileName);
                break;
            default:
                showNotification('Formato de exportación no soportado', 'danger');
        }
    } catch (error) {
        console.error('Error al exportar:', error);
        showNotification('Error al generar la exportación. Inténtalo de nuevo.', 'danger');
    }
}

// Exportar como PDF
function exportAsPDF(fileName) {
    // Simulación de exportación PDF (en una implementación real se usaría una librería como jsPDF)
    setTimeout(() => {
        showNotification(`El informe "${window.currentReportTitle}" ha sido exportado como PDF. Nombre: ${fileName}.pdf`, 'success');
    }, 1500);
}

// Exportar como Excel
function exportAsExcel(fileName) {
    // Simulación de exportación Excel (en una implementación real se usaría una librería como SheetJS)
    setTimeout(() => {
        showNotification(`El informe "${window.currentReportTitle}" ha sido exportado como Excel. Nombre: ${fileName}.xlsx`, 'success');
    }, 1500);
}

// Exportar como Imagen
function exportAsImage(fileName) {
    // Simulación de exportación de imagen (en una implementación real se usaría html2canvas o similar)
    const currentReport = document.getElementById(`${window.currentReportType}-report`);
    
    if (!currentReport) {
        showNotification('No se pudo encontrar el informe para exportar', 'danger');
        return;
    }
    
    setTimeout(() => {
        showNotification(`El informe "${window.currentReportTitle}" ha sido exportado como imagen. Nombre: ${fileName}.png`, 'success');
    }, 1500);
}

// Función auxiliar para formatear la fecha en formato YYYYMMDD para nombres de archivo
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function loadBenchmarkingReport() {
    // Implementar carga de informe de benchmarking
    console.log('Cargando informe de benchmarking...');
    
    // Destruir gráfico existente si existe
    if (chartInstances.benchmarkingChart) {
        chartInstances.benchmarkingChart.destroy();
    }
    
    // Datos del usuario actual vs promedio del sector
    const userData = [4.8, 4.5, 2.8, 3.4, 4.0, 3.9];
    const sectorData = [4.1, 3.8, 3.5, 3.3, 3.6, 3.7];
    
    // Actualizar contenido para mostrar informe actual
    updateCurrentReportInfo('benchmarking');
    
    const benchmarkingData = {
        labels: ['Técnicas', 'Transversales', 'Digitales', 'Lingüísticas', 'Diferenciadoras', 'Interpersonales'],
        datasets: [
            {
                label: 'Tu Puntuación',
                data: userData,
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
                borderColor: '#007bff',
                borderWidth: 2,
                pointBackgroundColor: '#007bff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            },
            {
                label: 'Promedio del Sector',
                data: sectorData,
                backgroundColor: 'rgba(108, 117, 125, 0.4)',
                borderColor: '#6c757d',
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: '#6c757d',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }
        ]
    };
    
    const config = {
        type: 'radar',
        data: benchmarkingData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparación con Promedio del Sector - Técnico/a de Empleo',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    beginAtZero: true,
                    max: 5,
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };
    
    const ctx = document.getElementById('benchmarkingChart');
    if (ctx) {
        chartInstances.benchmarkingChart = new Chart(ctx, config);
    }
}

// Inicializar tooltips de Bootstrap
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Sistema de notificaciones
function showNotification(message, type = 'info', duration = 5000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Auto-dismiss después del tiempo especificado
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// Funciones de usuario y logout
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Limpiar datos de localStorage
        localStorage.clear();
        
        // Redirigir o recargar
        location.reload();
    }
}

// ==========================================
// FUNCIONALIDADES DEL ASISTENTE IA
// ==========================================

// Variables para el chat con IA
let chatHistory = [];
let isProcessingMessage = false;

// Respuestas simuladas del mentor para modo offline
const mentorResponses = {
    'desarrollo': 'Para el desarrollo profesional en el Servicio de Empleo, te recomiendo centrarte en: 1) Formación en competencias digitales (Excel avanzado, plataformas SEPE), 2) Cursos de orientación laboral, 3) Gestión de conflictos y comunicación asertiva. ¿En qué área específica te gustaría profundizar?',
    'competencias': 'Basándome en tu perfil de Técnica de Empleo, las competencias más valoradas son: Técnicas (conocimiento legislación laboral), Transversales (comunicación, trabajo en equipo), Digitales (gestión BBDD, ofimática), Interpersonales (atención ciudadana, empatía). ¿Cuál te interesa mejorar?',
    'formacion': 'Para tu puesto recomiendo: 1) Curso INAP de Atención al Ciudadano (24h), 2) Especialización en Orientación Laboral (40h), 3) Excel Avanzado (16h), 4) Gestión del Tiempo (12h). Todos disponibles en INAP y con certificación oficial.',
    'carrera': 'La progresión típica es: Técnico/a → Jefe/a Departamento → Director/a. Para ascender necesitas: experiencia mínima 3-5 años, formación complementaria, evaluación positiva, y desarrollo de competencias de liderazgo. ¿Qué nivel te interesa alcanzar?',
    'idiomas': 'Para competencias lingüísticas te sugiero: 1) Inglés B2 (muy valorado), 2) Curso técnico de inglés laboral, 3) Francés básico (útil para ciertos programas UE). El INAP ofrece cursos subvencionados. ¿Qué nivel tienes actualmente?',
    'digitales': 'Las competencias digitales clave son: 1) Plataformas SEPE (SISPE, SIGAP), 2) Excel avanzado (tablas dinámicas, macros), 3) Bases de datos relacionales, 4) Herramientas colaborativas (Teams, SharePoint). Te recomiendo empezar por Excel.',
    'liderazgo': 'Para desarrollar liderazgo: 1) Curso INAP "Liderazgo en la Administración" (30h), 2) Gestión de equipos multidisciplinares, 3) Toma de decisiones bajo presión, 4) Comunicación estratégica. El liderazgo se construye con práctica diaria.',
    'default': 'Como tu mentor en desarrollo de competencias, estoy aquí para ayudarte. Puedo aconsejarte sobre: formación específica, desarrollo de carrera, competencias técnicas, soft skills, preparación para ascensos, y recursos disponibles en INAP. ¿En qué área necesitas orientación?'
};

// Función para obtener respuesta simulada del mentor
function getSimulatedMentorResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('desarrollo') || lowerMessage.includes('crecer') || lowerMessage.includes('mejorar')) {
        return mentorResponses.desarrollo;
    } else if (lowerMessage.includes('competencia') || lowerMessage.includes('habilidad') || lowerMessage.includes('skill')) {
        return mentorResponses.competencias;
    } else if (lowerMessage.includes('formacion') || lowerMessage.includes('curso') || lowerMessage.includes('formación')) {
        return mentorResponses.formacion;
    } else if (lowerMessage.includes('carrera') || lowerMessage.includes('ascen') || lowerMessage.includes('promocion')) {
        return mentorResponses.carrera;
    } else if (lowerMessage.includes('idioma') || lowerMessage.includes('ingles') || lowerMessage.includes('inglés')) {
        return mentorResponses.idiomas;
    } else if (lowerMessage.includes('digital') || lowerMessage.includes('excel') || lowerMessage.includes('informática')) {
        return mentorResponses.digitales;
    } else if (lowerMessage.includes('lider') || lowerMessage.includes('jefe') || lowerMessage.includes('director')) {
        return mentorResponses.liderazgo;
    } else {
        return mentorResponses.default;
    }
}

// Función simplificada para el mentor (modo de emergencia)
function emergencySendMessage() {
    console.log('🚨 Emergency sendMessage called');
    
    const messageInput = document.getElementById('userMessage');
    if (!messageInput) {
        console.error('❌ userMessage input not found');
        alert('Error: Campo de mensaje no encontrado');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) {
        alert('Por favor escribe un mensaje');
        return;
    }
    
    // Añadir mensaje del usuario
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        const userMsg = document.createElement('div');
        userMsg.innerHTML = `
            <div style="margin: 10px 0; padding: 10px; background: #007bff; color: white; border-radius: 10px; margin-left: 50px;">
                <strong>Tú:</strong> ${message}
            </div>
        `;
        chatContainer.appendChild(userMsg);
        messageInput.value = '';
        
        // Mostrar indicador de carga
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'loading-msg';
        loadingMsg.innerHTML = `
            <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 10px; margin-right: 50px;">
                <strong>Mentor:</strong> ⌨️ Escribiendo...
            </div>
        `;
        chatContainer.appendChild(loadingMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Primero intentar API real, si falla usar respuesta simulada
        fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MENTOR_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un mentor especializado en desarrollo de competencias profesionales del Servicio de Empleo. Responde de forma concisa y práctica en español.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        })
        .then(response => {
            // Remover indicador de carga
            const loading = document.getElementById('loading-msg');
            if (loading) loading.remove();
            
            if (!response.ok) {
                throw new Error(`API Error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.choices && data.choices.length > 0) {
                const assistantReply = data.choices[0].message.content;
                
                // Añadir respuesta del mentor
                const assistantMsg = document.createElement('div');
                assistantMsg.innerHTML = `
                    <div style="margin: 10px 0; padding: 10px; background: #e9ecef; border-radius: 10px; margin-right: 50px;">
                        <strong>Mentor:</strong> ${assistantReply}
                        <br><small style="color: #666;">💡 Respuesta por IA</small>
                    </div>
                `;
                chatContainer.appendChild(assistantMsg);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                console.log('✅ API mentor response successful');
            } else {
                throw new Error('Invalid API response');
            }
        })
        .catch(error => {
            console.warn('❌ API failed, using simulated response:', error);
            
            // Remover indicador de carga si aún existe
            const loading = document.getElementById('loading-msg');
            if (loading) loading.remove();
            
            // Usar respuesta simulada
            const simulatedResponse = getSimulatedMentorResponse(message);
            
            const assistantMsg = document.createElement('div');
            assistantMsg.innerHTML = `
                <div style="margin: 10px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; margin-right: 50px;">
                    <strong>Mentor:</strong> ${simulatedResponse}
                    <br><small style="color: #856404;">🤖 Respuesta simulada (API no disponible)</small>
                </div>
            `;
            chatContainer.appendChild(assistantMsg);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }
}

// Asignar función global como fallback
window.sendMessage = emergencySendMessage;

// Enviar mensaje al mentor
async function sendMessage() {
    console.log('🎯 sendMessage() function called');
    
    const messageInput = document.getElementById('userMessage');
    if (!messageInput) {
        console.error('❌ userMessage element not found');
        return;
    }
    
    const message = messageInput.value.trim();
    console.log('📝 Message text:', message);
    
    if (!message) {
        console.log('⚠️ Empty message, returning');
        return;
    }
    
    // Usar API key integrada
    const apiKey = MENTOR_API_KEY;
    console.log('🔑 API Key available:', !!apiKey);
    
    if (isProcessingMessage) {
        console.log('⏳ Already processing message, returning');
        return;
    }
    
    // Añadir mensaje del usuario al chat
    console.log('💬 Adding user message to chat');
    addMessageToChat(message, 'user');
    messageInput.value = '';
    
    // Mostrar indicador de escritura
    console.log('⌨️ Showing typing indicator');
    showTypingIndicator();
    
    try {
        isProcessingMessage = true;
        console.log('🚀 Starting message processing');
        
        // Preparar el contexto del usuario
        const userContext = getUserContext();
        console.log('👤 User context prepared');
        
        // Preparar el mensaje para la IA
        const systemPrompt = `Eres un mentor especializado en desarrollo de competencias profesionales. 
        Ayudas a empleados del Servicio de Empleo a mejorar sus habilidades y competencias laborales. 
        Proporciona consejos prácticos, recomendaciones de cursos, y estrategias de desarrollo profesional.
        ${userContext}
        Responde de forma concisa y práctica, con recomendaciones específicas y accionables.`;
        
        console.log('🔄 Calling Perplexity API...');
        
        // Llamar a la API de AlexandriA usando .then() en lugar de await
        callPerplexityAPI(apiKey, systemPrompt, message)
            .then(response => {
                console.log('✅ API response received:', response?.substring(0, 100) + '...');
                // Añadir respuesta de la IA al chat
                addMessageToChat(response, 'assistant');
            })
            .catch(error => {
                console.error('❌ Error al comunicarse con la IA:', error);
                addMessageToChat('Lo siento, ha ocurrido un error al procesar tu mensaje. Verifica tu conexión a internet e inténtalo de nuevo. Error: ' + error.message, 'assistant', true);
            })
            .finally(() => {
                console.log('🏁 Finishing message processing');
                hideTypingIndicator();
                isProcessingMessage = false;
            });
        
        return; // Salir aquí para evitar ejecutar el resto del código
        
    } catch (error) {
        console.error('❌ Error en sendMessage:', error);
        hideTypingIndicator();
        isProcessingMessage = false;
        addMessageToChat('Error interno: ' + error.message, 'assistant', true);
    }
}

// Función para llamar a la API de Perplexity
async function callPerplexityAPI(apiKey, systemPrompt, userMessage) {
    console.log('🌐 callPerplexityAPI function called');
    
    // Verificar que tenemos API key
    if (!apiKey || apiKey.trim() === '') {
        console.error('❌ API key not configured');
        throw new Error('API key no configurada');
    }
    
    console.log('🔑 API key validation passed');
    
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            search_mode: "web",
            reasoning_effort: "medium",
            temperature: 0.2,
            top_p: 0.9,
            return_images: false,
            return_related_questions: false,
            top_k: 0,
            stream: false,
            presence_penalty: 0,
            frequency_penalty: 0,
            web_search_options: {
                search_context_size: "low"
            },
            model: "sonar",
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]
        })
    };
    
    try {
        console.log('📡 Making fetch request to Perplexity API...');
        const response = await fetch('https://api.perplexity.ai/chat/completions', options);
        console.log('📨 Fetch response received, status:', response.status);
        
        if (!response.ok) {
            // Obtener el cuerpo del error para más detalles
            const errorText = await response.text();
            console.error('❌ Error response body:', errorText);
            
            // Manejo específico de errores HTTP
            if (response.status === 400) {
                throw new Error('Petición mal formada. Verifica la configuración del modelo');
            } else if (response.status === 401) {
                throw new Error('API key inválida o expirada');
            } else if (response.status === 429) {
                throw new Error('Límite de uso excedido. Inténtalo más tarde');
            } else if (response.status === 500) {
                throw new Error('Error del servidor. Inténtalo más tarde');
            } else {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log('📄 JSON response parsed successfully');
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            console.log('✅ Valid response structure found');
            return data.choices[0].message.content;
        } else {
            console.error('❌ Invalid response structure:', data);
            throw new Error('Respuesta inválida del servidor');
        }
        
    } catch (error) {
        // Re-lanzar errores de fetch/network
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet');
        }
        throw error;
    }
}

// Obtener contexto del usuario para la IA
function getUserContext() {
    const includeProfile = document.getElementById('includeProfile')?.checked !== false;
    
    if (!includeProfile) return '';
    
    return `
    Contexto del usuario:
    - Nombre: ${currentUser?.user_metadata?.nombre || 'María García López'}
    - Puesto: ${currentUser?.user_metadata?.puesto || 'Técnica de Empleo'}
    - Departamento: ${currentUser?.user_metadata?.departamento || 'Orientación Laboral'}
    - Competencias destacadas: Técnicas (4.2/5), Transversales (4.0/5)
    - Áreas de mejora: Digitales (3.5/5), Lingüísticas (3.4/5)
    - Experiencia: 3 años en la empresa
    
    Considera esta información al dar recomendaciones personalizadas.
    `;
}

// Añadir mensaje al chat
function addMessageToChat(message, sender, isError = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const currentTime = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="avatar-circle bg-success text-white me-3">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble bg-primary text-white p-3 rounded">
                        ${message}
                    </div>
                    <small class="text-muted">Tú • ${currentTime}</small>
                </div>
            </div>
        `;
    } else {
        const iconClass = isError ? 'fas fa-exclamation-triangle' : 'fas fa-chalkboard-teacher';
        const bgClass = isError ? 'bg-danger' : 'bg-primary';
        
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="avatar-circle ${bgClass} text-white me-3">
                    <i class="${iconClass}"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble bg-light p-3 rounded">
                        ${formatAIResponse(message)}
                    </div>
                    <small class="text-muted">Mentor • ${currentTime}</small>
                </div>
            </div>
        `;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Guardar en historial
    chatHistory.push({ message, sender, timestamp: new Date().toISOString() });
}

// Formatear respuesta de la IA
function formatAIResponse(response) {
    // Convertir saltos de línea a HTML
    response = response.replace(/\n/g, '<br>');
    
    // Formatear listas con viñetas
    response = response.replace(/^- (.+)$/gm, '<li>$1</li>');
    response = response.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Formatear texto en negrita
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return response;
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    const chatContainer = document.getElementById('chatContainer');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'chat-message ai-message typing-indicator show';
    typingDiv.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="avatar-circle bg-primary text-white me-3">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble bg-light p-3 rounded">
                    <span class="typing-dots"></span> Escribiendo...
                </div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Ocultar indicador de escritura
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Enviar pregunta rápida
function sendQuickQuestion(question) {
    document.getElementById('userMessage').value = question;
    sendMessage();
}

// Función de debugging del mentor
function debugMentor() {
    console.log('🔍 MENTOR DEBUG INFO:');
    console.log('- API Key configured:', !!MENTOR_API_KEY);
    console.log('- userMessage element:', !!document.getElementById('userMessage'));
    console.log('- chatContainer element:', !!document.getElementById('chatContainer'));
    console.log('- sendMessage function:', typeof sendMessage);
    console.log('- isProcessingMessage:', isProcessingMessage);
    console.log('- Current section:', currentSection);
    
    // Probar una función simple
    try {
        const testEl = document.getElementById('userMessage');
        if (testEl) {
            console.log('- userMessage value:', testEl.value);
            console.log('- userMessage type:', testEl.tagName);
        }
    } catch (error) {
        console.error('- Error accessing userMessage:', error);
    }
}

// Función de prueba simplificada
function emergencyTestMentorConnection() {
    console.log('🧪 Testing mentor connection...');
    
    // Verificar elementos básicos
    const userMessage = document.getElementById('userMessage');
    const chatContainer = document.getElementById('chatContainer');
    
    console.log('Elements check:');
    console.log('- userMessage:', !!userMessage);
    console.log('- chatContainer:', !!chatContainer);
    console.log('- API Key:', !!MENTOR_API_KEY);
    
    if (!userMessage || !chatContainer) {
        alert('❌ Error: Elementos del chat no encontrados');
        return;
    }
    
    // Hacer prueba de API usando .then()
    fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${MENTOR_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
                {
                    role: 'system',
                    content: 'Responde solo "Conexión exitosa" para confirmar que funciono.'
                },
                {
                    role: 'user',
                    content: 'Test'
                }
            ],
            max_tokens: 50,
            temperature: 0.1
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    })
    .then(data => {
        console.log('✅ API Test successful:', data.choices[0].message.content);
        alert('✅ Mentor funcionando correctamente!');
    })
    .catch(error => {
        console.error('❌ API Test failed:', error);
        alert('❌ Error de conexión: ' + error.message);
    });
}

window.testMentorConnection = emergencyTestMentorConnection;

// Probar conexión del mentor (función original con fallback)
async function testMentorConnection() {
    console.log('🎯 testMentorConnection called - using simplified version');
    return window.testMentorConnection();
}

// Inicializar el chat del mentor
function initializeChat() {
    console.log('🎯 Initializing chat...');
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.innerHTML = `
            <div class="chat-message ai-message">
                <div class="d-flex align-items-start">
                    <div class="avatar-circle bg-primary text-white me-3">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-bubble bg-light p-3 rounded">
                            ¡Hola! Soy tu mentor para desarrollo de competencias. 
                            Puedes preguntarme sobre cómo mejorar tus habilidades profesionales, 
                            qué cursos tomar, o cualquier duda sobre desarrollo de carrera. ¿En qué puedo ayudarte?
                        </div>
                        <small class="text-muted">Mentor • Ahora</small>
                    </div>
                </div>
            </div>
        `;
        chatHistory = [];
        console.log('✅ Chat initialized successfully');
    } else {
        console.error('❌ Chat container not found');
    }
}

// Limpiar chat
function clearChat() {
    if (confirm('¿Estás seguro de que quieres limpiar la conversación?')) {
        console.log('🧹 Clearing chat...');
        initializeChat();
    }
}

// ==========================================
// COMPARATIVAS ENTRE PERÍODOS Y FORMACIÓN
// ==========================================

// Actualizar comparativa entre períodos
function updatePeriodComparison() {
    const period1 = document.getElementById('periodSelector1')?.value;
    const period2 = document.getElementById('periodSelector2')?.value;
    
    if (!period1 || !period2 || period1 === period2) return;
    
    const data1 = periodComparisonData[period1];
    const data2 = periodComparisonData[period2];
    
    if (!data1 || !data2) return;
    
    // Calcular cambios
    const changes = {};
    let improvements = 0;
    let stable = 0;
    let declines = 0;
    
    Object.keys(data1).forEach(competency => {
        const change = data2[competency] - data1[competency];
        changes[competency] = change;
        
        if (change > 0.2) improvements++;
        else if (change < -0.2) declines++;
        else stable++;
    });
    
    // Actualizar contadores
    const improvementElement = document.getElementById('improvementCount');
    const stableElement = document.getElementById('stableCount');
    const declineElement = document.getElementById('declineCount');
    
    if (improvementElement) improvementElement.textContent = improvements;
    if (stableElement) stableElement.textContent = stable;
    if (declineElement) declineElement.textContent = declines;
    
    // Actualizar tabla de evolución
    updateCompetencyEvolutionTable(data1, data2, changes);
    
    // Actualizar gráfico
    updatePeriodComparisonChart(period1, period2, data1, data2);
    
    // Generar recomendaciones automáticas
    generateAutomaticRecommendations(changes);
}

// Actualizar tabla de evolución de competencias
function updateCompetencyEvolutionTable(data1, data2, changes) {
    const tbody = document.getElementById('competencyEvolutionTable');
    if (!tbody) return;
    
    const competencyNames = {
        'tecnicas': 'Competencias Técnicas',
        'transversales': 'Competencias Transversales',
        'digitales': 'Competencias Digitales',
        'linguisticas': 'Competencias Lingüísticas',
        'diferenciadoras': 'Competencias Diferenciadoras',
        'interpersonales': 'Competencias Interpersonales'
    };
    
    let html = '';
    Object.keys(data1).forEach(competency => {
        const change = changes[competency];
        const badgeClass = change > 0.1 ? 'bg-success' : change < -0.1 ? 'bg-danger' : 'bg-info';
        const trendIcon = change > 0.1 ? 'fas fa-arrow-up text-success' : 
                         change < -0.1 ? 'fas fa-arrow-down text-danger' : 
                         'fas fa-minus text-muted';
        const trendText = change > 0.1 ? 'Mejorando' : 
                         change < -0.1 ? 'Retrocediendo' : 
                         'Estable';
        
        html += `
            <tr>
                <td>${competencyNames[competency]}</td>
                <td>${data1[competency].toFixed(1)}</td>
                <td>${data2[competency].toFixed(1)}</td>
                <td><span class="badge ${badgeClass}">${change >= 0 ? '+' : ''}${change.toFixed(1)}</span></td>
                <td><i class="${trendIcon}"></i> ${trendText}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Actualizar gráfico de comparación entre períodos
function updatePeriodComparisonChart(period1, period2, data1, data2) {
    const ctx = document.getElementById('periodComparisonChart');
    if (!ctx) return;
    
    // Destruir gráfico existente si existe
    if (chartInstances.periodComparison) {
        chartInstances.periodComparison.destroy();
    }
    
    const competencyLabels = [
        'Técnicas', 'Transversales', 'Digitales', 
        'Lingüísticas', 'Diferenciadoras', 'Interpersonales'
    ];
    
    const competencyKeys = ['tecnicas', 'transversales', 'digitales', 'linguisticas', 'diferenciadoras', 'interpersonales'];
    
    chartInstances.periodComparison = new Chart(ctx, {
        type: 'line',
        data: {
            labels: competencyLabels,
            datasets: [{
                label: formatPeriodLabel(period1),
                data: competencyKeys.map(key => data1[key]),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }, {
                label: formatPeriodLabel(period2),
                data: competencyKeys.map(key => data2[key]),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 0.5
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Evolución de Competencias entre Períodos'
                }
            }
        }
    });
}

// Formatear etiqueta de período
function formatPeriodLabel(period) {
    const [year, month] = period.split('-');
    const monthNames = {
        '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
        '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
        '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };
    return `${monthNames[month]} ${year}`;
}

// Generar recomendaciones automáticas basadas en cambios
function generateAutomaticRecommendations(changes) {
    const recommendations = [];
    
    // Identificar competencias en declive
    Object.keys(changes).forEach(competency => {
        const change = changes[competency];
        if (change < -0.2) {
            // Buscar cursos para competencias en declive
            Object.values(formationRecommendations).forEach(course => {
                if (course.competency === competency && course.priority === 'high') {
                    recommendations.push({
                        ...course,
                        reason: `Declive de ${Math.abs(change).toFixed(1)} puntos`,
                        urgency: 'high'
                    });
                }
            });
        } else if (change > 0.3) {
            // Recomendar cursos para potenciar competencias en crecimiento
            Object.values(formationRecommendations).forEach(course => {
                if (course.competency === competency && course.priority === 'medium') {
                    recommendations.push({
                        ...course,
                        reason: `Potenciar mejora de ${change.toFixed(1)} puntos`,
                        urgency: 'medium'
                    });
                }
            });
        }
    });
    
    // Mostrar notificación si hay recomendaciones críticas
    const criticalRecommendations = recommendations.filter(r => r.urgency === 'high');
    if (criticalRecommendations.length > 0) {
        showNotification(`Se han identificado ${criticalRecommendations.length} recomendaciones de formación urgentes basadas en tu análisis de progreso.`, 'warning', 10000);
    }
    
    return recommendations;
}

// Inscribirse en curso
function enrollInCourse(courseId) {
    const course = formationRecommendations[courseId];
    if (!course) return;
    
    // Simular inscripción
    const confirmed = confirm(`¿Deseas inscribirte en "${course.title}"?\n\nDuración: ${course.hours} horas\nFecha: ${course.nextDate}\nProveedor: ${course.provider}`);
    
    if (confirmed) {
        showNotification(`¡Te has inscrito correctamente en "${course.title}"! Recibirás un email con los detalles.`, 'success');
        
        // Actualizar estadísticas de cursos recomendados
        const currentCount = parseInt(document.getElementById('recommendedCourses')?.textContent) || 0;
        if (document.getElementById('recommendedCourses')) {
            document.getElementById('recommendedCourses').textContent = Math.max(0, currentCount - 1);
        }
    }
}

// Inicializar comparativas al cargar la página
function initializePeriodComparisons() {
    // Configurar valores por defecto
    const period1Selector = document.getElementById('periodSelector1');
    const period2Selector = document.getElementById('periodSelector2');
    
    if (period1Selector && period2Selector) {
        period1Selector.value = '2024-12';
        period2Selector.value = '2025-01';
        updatePeriodComparison();
    }
}

// ==========================================
// SISTEMA DE GAMIFICACIÓN COMPLETO
// ==========================================

// Variables del sistema de gamificación
let userStats = {
    currentXP: 650,
    totalPoints: 2150,
    level: 3,
    achievementsUnlocked: 8,
    currentStreak: 12,
    totalActionsCompleted: 25,
    feedbackGiven: 2,
    feedbackReceived: 3
};

// Variables para feedback y colaboración
let feedbackRequests = [];
let feedbackHistory = [];

// Variables para notificaciones y recordatorios
let notificationSettings = {
    enabled: true,
    frequency: 'weekly',
    emailNotifications: true,
    browserNotifications: true,
    calendarSync: false
};

// Variables para sistema de notificaciones inteligentes
let intelligentNotifications = {
    lastProgressUpdate: null,
    remindersSent: 0,
    achievementsNotified: [],
    competencyAlerts: []
};

// Configuración de niveles
const levels = {
    1: { xpRequired: 0, title: 'Principiante', icon: 'fas fa-seedling', color: 'secondary' },
    2: { xpRequired: 300, title: 'Aprendiz', icon: 'fas fa-leaf', color: 'info' },
    3: { xpRequired: 750, title: 'Especialista', icon: 'fas fa-star', color: 'warning' },
    4: { xpRequired: 1500, title: 'Experto', icon: 'fas fa-crown', color: 'danger' },
    5: { xpRequired: 3000, title: 'Maestro', icon: 'fas fa-trophy', color: 'dark' },
    6: { xpRequired: 5000, title: 'Leyenda', icon: 'fas fa-dragon', color: 'purple' }
};

// Configuración de logros
const achievements = {
    'first_action': {
        id: 'first_action',
        title: 'Primer Paso',
        description: 'Completar tu primera acción de desarrollo',
        icon: 'fas fa-baby',
        xpReward: 50,
        unlocked: true
    },
    'streak_7': {
        id: 'streak_7',
        title: 'Semana Completa',
        description: 'Mantener actividad durante 7 días consecutivos',
        icon: 'fas fa-calendar-week',
        xpReward: 100,
        unlocked: true
    },
    'completion_25': {
        id: 'completion_25',
        title: 'Un Cuarto del Camino',
        description: 'Completar 25% de tu roadmap',
        icon: 'fas fa-chart-pie',
        xpReward: 150,
        unlocked: false
    },
    'feedback_master': {
        id: 'feedback_master',
        title: 'Maestro del Feedback',
        description: 'Dar feedback a 5 compañeros',
        icon: 'fas fa-comments',
        xpReward: 200,
        unlocked: false
    },
    'mentor_seeker': {
        id: 'mentor_seeker',
        title: 'Buscador de Sabiduría',
        description: 'Tener 10 conversaciones con el mentor IA',
        icon: 'fas fa-brain',
        xpReward: 120,
        unlocked: true
    },
    'night_owl': {
        id: 'night_owl',
        title: 'Búho Nocturno',
        description: 'Completar acciones después de las 22:00',
        icon: 'fas fa-moon',
        xpReward: 75,
        unlocked: false
    },
    'early_bird': {
        id: 'early_bird',
        title: 'Madrugador',
        description: 'Completar acciones antes de las 8:00',
        icon: 'fas fa-sun',
        xpReward: 75,
        unlocked: false
    },
    'level_up': {
        id: 'level_up',
        title: 'Subida de Nivel',
        description: 'Alcanzar el nivel 3',
        icon: 'fas fa-level-up-alt',
        xpReward: 100,
        unlocked: true
    }
};

// Inicializar sistema de gamificación
function initializeGamificationSystem() {
    loadUserStats();
    updateGamificationUI();
    checkDailyStreak();
}

// Cargar estadísticas del usuario
function loadUserStats() {
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) {
        userStats = { ...userStats, ...JSON.parse(savedStats) };
    }
    
    // Cargar logros desbloqueados
    const savedAchievements = localStorage.getItem('unlockedAchievements');
    if (savedAchievements) {
        const unlockedIds = JSON.parse(savedAchievements);
        unlockedIds.forEach(id => {
            if (achievements[id]) {
                achievements[id].unlocked = true;
            }
        });
    }
}

// Guardar estadísticas del usuario
function saveUserStats() {
    localStorage.setItem('userStats', JSON.stringify(userStats));
    
    // Guardar logros desbloqueados
    const unlockedIds = Object.keys(achievements).filter(id => achievements[id].unlocked);
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedIds));
}

// Actualizar UI de gamificación
function updateGamificationUI() {
    const currentLevelInfo = getCurrentLevelInfo();
    const nextLevelInfo = getNextLevelInfo();
    
    // Actualizar nivel (ambos paneles)
    const levelElements = document.querySelectorAll('#currentLevel');
    levelElements.forEach(element => {
        if (element) {
            element.innerHTML = `<i class="${currentLevelInfo.icon} me-1"></i>Nivel ${userStats.level} - ${currentLevelInfo.title}`;
        }
    });
    
    // Actualizar barra de XP
    const xpProgress = nextLevelInfo ? 
        ((userStats.currentXP - currentLevelInfo.xpRequired) / (nextLevelInfo.xpRequired - currentLevelInfo.xpRequired)) * 100 : 100;
    
    const xpBars = document.querySelectorAll('#xpProgressBar');
    xpBars.forEach(xpBar => {
        if (xpBar) {
            xpBar.style.width = `${Math.min(xpProgress, 100)}%`;
            
            if (nextLevelInfo) {
                const xpNeeded = nextLevelInfo.xpRequired - userStats.currentXP;
                xpBar.textContent = `${userStats.currentXP} / ${nextLevelInfo.xpRequired} XP`;
                const nextSibling = xpBar.parentElement.nextElementSibling;
                if (nextSibling) {
                    nextSibling.textContent = `${xpNeeded} XP para el siguiente nivel`;
                }
            } else {
                xpBar.textContent = `Nivel Máximo Alcanzado!`;
                const nextSibling = xpBar.parentElement.nextElementSibling;
                if (nextSibling) {
                    nextSibling.textContent = '¡Eres una leyenda!';
                }
            }
        }
    });
    
    // Actualizar estadísticas (todos los elementos)
    const updateElements = (selector, value) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element) element.textContent = value;
        });
    };
    
    updateElements('#totalPoints', userStats.totalPoints.toLocaleString());
    updateElements('#achievementsCount', userStats.achievementsUnlocked);
    updateElements('#streakDays', userStats.currentStreak);
    updateElements('#feedbackReceivedTop', userStats.feedbackReceived);
    updateElements('#feedbackSentTop', userStats.feedbackGiven);
}

// Obtener información del nivel actual
function getCurrentLevelInfo() {
    return levels[userStats.level] || levels[1];
}

// Obtener información del siguiente nivel
function getNextLevelInfo() {
    return levels[userStats.level + 1] || null;
}

// Verificar racha diaria
function checkDailyStreak() {
    const lastVisit = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    
    if (lastVisit !== today) {
        // Es un nuevo día
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisit === yesterday.toDateString()) {
            // Continúa la racha
            userStats.currentStreak++;
        } else if (lastVisit !== null) {
            // Se rompió la racha
            userStats.currentStreak = 1;
        }
        
        localStorage.setItem('lastVisitDate', today);
        saveUserStats();
        updateGamificationUI();
    }
}

// Añadir XP y verificar logros
function addXP(amount, reason = '') {
    userStats.currentXP += amount;
    userStats.totalPoints += amount * 2; // Los puntos valen el doble que XP
    
    // Verificar si subió de nivel
    const newLevel = calculateLevel(userStats.currentXP);
    if (newLevel > userStats.level) {
        userStats.level = newLevel;
        unlockAchievement('level_up');
        showNotification(`¡Felicidades! Has alcanzado el nivel ${newLevel}: ${getCurrentLevelInfo().title}`, 'success', 8000);
    }
    
    // Mostrar notificación de XP ganado
    if (reason) {
        showNotification(`+${amount} XP: ${reason}`, 'info', 3000);
    }
    
    saveUserStats();
    updateGamificationUI();
}

// Calcular nivel basado en XP
function calculateLevel(currentXP) {
    let level = 1;
    Object.keys(levels).forEach(levelNum => {
        if (currentXP >= levels[levelNum].xpRequired) {
            level = parseInt(levelNum);
        }
    });
    return level;
}

// Desbloquear logro
function unlockAchievement(achievementId) {
    const achievement = achievements[achievementId];
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        userStats.achievementsUnlocked++;
        addXP(achievement.xpReward, `Logro desbloqueado: ${achievement.title}`);
        
        showNotification(
            `🎉 ¡Logro desbloqueado! "${achievement.title}" - ${achievement.description}`, 
            'success', 
            10000
        );
        
        saveUserStats();
        updateGamificationUI();
    }
}

// Mostrar logros
function showAchievements() {
    let achievementsHTML = `
        <div class="modal fade" id="achievementsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-trophy me-2"></i>Mis Logros
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
    `;
    
    Object.values(achievements).forEach(achievement => {
        const unlocked = achievement.unlocked;
        const opacity = unlocked ? 'opacity-100' : 'opacity-50';
        const bgColor = unlocked ? 'bg-success' : 'bg-secondary';
        
        achievementsHTML += `
            <div class="col-md-6">
                <div class="card border-0 shadow-sm ${opacity}">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="achievement-icon ${bgColor} text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                <i class="${achievement.icon}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${achievement.title}</h6>
                                <p class="small text-muted mb-2">${achievement.description}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-primary">+${achievement.xpReward} XP</span>
                                    ${unlocked ? '<span class="badge bg-success">Desbloqueado</span>' : '<span class="badge bg-secondary">Bloqueado</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    achievementsHTML += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Añadir modal al DOM
    if (!document.getElementById('achievementsModal')) {
        document.body.insertAdjacentHTML('beforeend', achievementsHTML);
    } else {
        document.getElementById('achievementsModal').outerHTML = achievementsHTML;
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('achievementsModal'));
    modal.show();
}

// Mostrar ranking
function showLeaderboard() {
    // Datos demo del ranking
    const leaderboardData = [
        { name: 'Ana Martínez', points: 3250, level: 4, position: 1 },
        { name: 'Carlos López', points: 2890, level: 4, position: 2 },
        { name: 'María García (Tú)', points: userStats.totalPoints, level: userStats.level, position: 3 },
        { name: 'José Rodríguez', points: 2050, level: 3, position: 4 },
        { name: 'Laura Fernández', points: 1980, level: 3, position: 5 }
    ];
    
    let leaderboardHTML = `
        <div class="modal fade" id="leaderboardModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-ranking-star me-2"></i>Ranking del Departamento
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
    `;
    
    leaderboardData.forEach(user => {
        const isCurrentUser = user.name.includes('(Tú)');
        const badgeClass = user.position === 1 ? 'bg-warning' : user.position === 2 ? 'bg-secondary' : user.position === 3 ? 'bg-warning' : 'bg-light text-dark';
        const itemClass = isCurrentUser ? 'list-group-item-primary' : '';
        
        leaderboardHTML += `
            <div class="list-group-item ${itemClass}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <span class="badge ${badgeClass} me-3" style="width: 30px;">#${user.position}</span>
                        <div>
                            <h6 class="mb-0">${user.name}</h6>
                            <small class="text-muted">Nivel ${user.level}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <strong>${user.points.toLocaleString()}</strong>
                        <div class="small text-muted">puntos</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    leaderboardHTML += `
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-muted">Ranking actualizado semanalmente</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Añadir modal al DOM
    if (!document.getElementById('leaderboardModal')) {
        document.body.insertAdjacentHTML('beforeend', leaderboardHTML);
    } else {
        document.getElementById('leaderboardModal').outerHTML = leaderboardHTML;
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('leaderboardModal'));
    modal.show();
}

// ==========================================
// SISTEMA DE NOTIFICACIONES Y RECORDATORIOS
// ==========================================

// Inicializar sistema de notificaciones
function initializeNotificationSystem() {
    loadNotificationSettings();
    updateNotificationUI();
    requestNotificationPermission();
}

// Cargar configuración de notificaciones
function loadNotificationSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
        notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
    }
}

// Guardar configuración de notificaciones
function saveNotificationSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
}

// Actualizar UI de notificaciones
function updateNotificationUI() {
    const enableElement = document.getElementById('enableNotificationsTop');
    const frequencyElement = document.getElementById('reminderFrequencyTop');
    
    if (enableElement) enableElement.checked = notificationSettings.enabled;
    if (frequencyElement) frequencyElement.value = notificationSettings.frequency;
}

// Solicitar permiso para notificaciones del navegador
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Alternar notificaciones
function toggleNotifications() {
    notificationSettings.enabled = !notificationSettings.enabled;
    saveNotificationSettings();
    
    if (notificationSettings.enabled) {
        showNotification('Notificaciones activadas', 'success');
        requestNotificationPermission();
    } else {
        showNotification('Notificaciones desactivadas', 'info');
    }
}

// Actualizar frecuencia de recordatorios
function updateReminderFrequency() {
    const frequency = document.getElementById('reminderFrequencyTop').value;
    notificationSettings.frequency = frequency;
    saveNotificationSettings();
    showNotification(`Frecuencia de recordatorios actualizada: ${frequency}`, 'info');
}

// Programar recordatorio
function scheduleReminder() {
    const title = prompt('¿Qué quieres recordar?');
    const dateStr = prompt('¿Cuándo? (dd/mm/yyyy HH:mm)');
    
    if (title && dateStr) {
        // Simular programación de recordatorio
        showNotification(`Recordatorio programado: "${title}" para ${dateStr}`, 'success');
        
        // Aquí se implementaría la lógica real de programación
        // Por ejemplo, usando setTimeout o una librería de scheduling
    }
}

// Añadir al calendario
function addToCalendar() {
    // Generar enlace de Google Calendar
    const title = 'Revisión de Progreso de Competencias';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Una semana desde ahora
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
    
    window.open(googleCalendarUrl, '_blank');
    showNotification('Enlace de calendario abierto en nueva pestaña', 'info');
}

// Mostrar historial de recordatorios
function showReminderHistory() {
    // Datos demo de historial
    const historyData = [
        { date: '05/01/2025', title: 'Completar evaluación de competencias digitales', completed: true },
        { date: '03/01/2025', title: 'Revisar roadmap de desarrollo', completed: true },
        { date: '01/01/2025', title: 'Establecer objetivos del año', completed: false },
        { date: '30/12/2024', title: 'Revisión trimestral de progreso', completed: true }
    ];
    
    let historyHTML = `
        <div class="modal fade" id="reminderHistoryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>Historial de Recordatorios
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
    `;
    
    historyData.forEach(item => {
        const iconClass = item.completed ? 'fas fa-check-circle text-success' : 'fas fa-clock text-warning';
        const statusText = item.completed ? 'Completado' : 'Pendiente';
        
        historyHTML += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <i class="${iconClass} me-3"></i>
                        <div>
                            <h6 class="mb-1">${item.title}</h6>
                            <small class="text-muted">${item.date}</small>
                        </div>
                    </div>
                    <span class="badge ${item.completed ? 'bg-success' : 'bg-warning'}">${statusText}</span>
                </div>
            </div>
        `;
    });
    
    historyHTML += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Añadir modal al DOM
    if (!document.getElementById('reminderHistoryModal')) {
        document.body.insertAdjacentHTML('beforeend', historyHTML);
    } else {
        document.getElementById('reminderHistoryModal').outerHTML = historyHTML;
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('reminderHistoryModal'));
    modal.show();
}

// Alternar sincronización de calendario
function toggleCalendarSync() {
    notificationSettings.calendarSync = !notificationSettings.calendarSync;
    saveNotificationSettings();
    
    const statusElement = document.getElementById('calendarStatusTop');
    if (statusElement) {
        if (notificationSettings.calendarSync) {
            statusElement.textContent = 'Conectado';
            statusElement.className = 'alert alert-success small mb-0';
            statusElement.style.display = 'block';
            showNotification('Sincronización con Google Calendar activada', 'success');
        } else {
            statusElement.textContent = 'No conectado';
            statusElement.className = 'alert alert-light small mb-0';
            statusElement.style.display = 'block';
            showNotification('Sincronización con Google Calendar desactivada', 'info');
        }
    }
}

// ==========================================
// NOTIFICACIONES INTELIGENTES Y RECORDATORIOS AUTOMÁTICOS
// ==========================================

// Configurar notificaciones inteligentes
function setupIntelligentNotifications() {
    // Verificar progreso cada hora
    setInterval(checkProgressMilestones, 3600000); // 1 hora
    
    // Recordatorios semanales
    setupWeeklyReminders();
    
    // Notificaciones de oportunidades
    checkForOpportunities();
}

// Verificar hitos de progreso
function checkProgressMilestones() {
    const lastCheck = localStorage.getItem('lastProgressCheck');
    const now = new Date().toISOString();
    
    // Solo verificar una vez al día
    if (lastCheck && new Date(lastCheck).toDateString() === new Date().toDateString()) {
        return;
    }
    
    // Verificar si hay mejoras significativas
    const improvements = detectProgressImprovements();
    if (improvements.length > 0) {
        improvements.forEach(improvement => {
            showNotification(
                `¡Progreso detectado! ${improvement.competency}: +${improvement.change.toFixed(1)} puntos`,
                'success',
                8000
            );
        });
    }
    
    // Verificar declives preocupantes
    const declines = detectProgressDeclines();
    if (declines.length > 0) {
        declines.forEach(decline => {
            showNotification(
                `Atención: ${decline.competency} ha disminuido ${Math.abs(decline.change).toFixed(1)} puntos. ¿Necesitas ayuda?`,
                'warning',
                10000
            );
        });
    }
    
    localStorage.setItem('lastProgressCheck', now);
}

// Detectar mejoras de progreso
function detectProgressImprovements() {
    // Simular detección de mejoras basada en datos históricos
    const improvements = [];
    
    // Aquí se compararían los datos actuales con datos históricos
    // Por simplicidad, simulamos algunas mejoras
    const simulatedImprovements = [
        { competency: 'Comunicación Efectiva', change: 0.7 },
        { competency: 'Legislación Laboral', change: 0.6 }
    ];
    
    return simulatedImprovements.filter(improvement => improvement.change > 0.3);
}

// Detectar declives de progreso
function detectProgressDeclines() {
    // Simular detección de declives
    const declines = [];
    
    const simulatedDeclines = [
        { competency: 'Herramientas Ofimáticas', change: -0.4 }
    ];
    
    return simulatedDeclines.filter(decline => decline.change < -0.3);
}

// Configurar recordatorios semanales
function setupWeeklyReminders() {
    const lastReminder = localStorage.getItem('lastWeeklyReminder');
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (!lastReminder || new Date(lastReminder) < oneWeekAgo) {
        // Es momento de enviar recordatorio semanal
        setTimeout(() => {
            sendWeeklyReminder();
        }, 5000); // Esperar 5 segundos después de cargar la página
    }
}

// Enviar recordatorio semanal
function sendWeeklyReminder() {
    const reminderMessages = [
        '¡Es hora de revisar tu progreso semanal! ¿Has completado tus objetivos?',
        'Recordatorio: Tienes evaluaciones pendientes que podrían mejorar tu perfil.',
        '¿Sabías que llevas una racha de ' + userStats.currentStreak + ' días? ¡Sigue así!',
        'Tu mentor IA tiene nuevas recomendaciones basadas en tu progreso reciente.',
        'Es un buen momento para solicitar feedback de tus compañeros.'
    ];
    
    const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
    
    showNotification(randomMessage, 'info', 8000);
    
    // Marcar como enviado
    localStorage.setItem('lastWeeklyReminder', new Date().toISOString());
}

// Verificar oportunidades
function checkForOpportunities() {
    // Verificar si hay cursos recomendados sin inscribir
    setTimeout(() => {
        const urgentCourses = Object.values(formationRecommendations)
            .filter(course => course.priority === 'high')
            .length;
            
        if (urgentCourses > 0) {
            showNotification(
                `Tienes ${urgentCourses} cursos de alta prioridad disponibles. ¡Revísalos en la sección de Informes!`,
                'warning',
                10000
            );
        }
    }, 15000); // 15 segundos después de cargar
}

// ==========================================
// SISTEMA DE FEEDBACK Y COLABORACIÓN
// ==========================================

// Marcar acción como completada
function markActionCompleted() {
    const actions = [
        'Completar módulo de formación',
        'Revisar documentación técnica',
        'Practicar nueva habilidad',
        'Solicitar feedback',
        'Actualizar perfil profesional'
    ];
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    // Simular acción completada
    addXP(25, randomAction);
    userStats.totalActionsCompleted++;
    
    // Verificar logros
    if (userStats.totalActionsCompleted >= 25 && !achievements.completion_25.unlocked) {
        unlockAchievement('completion_25');
    }
    
    showNotification(`✅ Acción completada: ${randomAction}`, 'success');
    saveUserStats();
}

// Actualizar roadmap
function updateRoadmap() {
    showNotification('Roadmap actualizado con nuevas recomendaciones basadas en tu progreso', 'info');
    addXP(15, 'Actualización de roadmap');
}

// Exportar progreso
function exportProgress() {
    // Simular exportación
    showNotification('Generando reporte de progreso...', 'info');
    
    setTimeout(() => {
        showNotification('Reporte de progreso generado. Descarga iniciada.', 'success');
        addXP(10, 'Exportación de progreso');
    }, 2000);
}

// Solicitar feedback
function requestFeedback() {
    const colleagues = ['Ana Martínez', 'Carlos López', 'José Rodríguez', 'Laura Fernández'];
    const randomColleague = colleagues[Math.floor(Math.random() * colleagues.length)];
    
    const requestId = Date.now().toString();
    feedbackRequests.push({
        id: requestId,
        to: randomColleague,
        from: currentUser?.user_metadata?.nombre || 'María García',
        date: new Date().toISOString(),
        status: 'pending',
        type: 'competency_assessment'
    });
    
    showNotification(`Solicitud de feedback enviada a ${randomColleague}`, 'success');
    addXP(10, 'Solicitud de feedback');
    
    saveFeedbackData();
}

// Dar feedback
function giveFeedback() {
    const colleagues = ['Ana Martínez', 'Carlos López', 'José Rodríguez', 'Laura Fernández'];
    const randomColleague = colleagues[Math.floor(Math.random() * colleagues.length)];
    
    // Simular proceso de dar feedback
    const feedbackTypes = [
        'Excelente comunicación en la reunión de ayer',
        'Gran dominio técnico en el proyecto reciente',
        'Muy buena capacidad de liderazgo',
        'Destaca en trabajo en equipo',
        'Excelente resolución de problemas'
    ];
    
    const randomFeedback = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
    
    feedbackHistory.push({
        id: Date.now().toString(),
        to: randomColleague,
        from: currentUser?.user_metadata?.nombre || 'María García',
        date: new Date().toISOString(),
        topic: 'Competencias Profesionales',
        comment: randomFeedback,
        rating: Math.floor(Math.random() * 2) + 4 // 4 o 5 estrellas
    });
    
    userStats.feedbackGiven++;
    addXP(20, `Feedback dado a ${randomColleague}`);
    
    // Verificar logro de maestro del feedback
    if (userStats.feedbackGiven >= 5 && !achievements.feedback_master.unlocked) {
        unlockAchievement('feedback_master');
    }
    
    showNotification(`Feedback enviado a ${randomColleague}: "${randomFeedback}"`, 'success');
    
    saveFeedbackData();
    saveUserStats();
    updateGamificationUI();
}

// Mostrar historial de feedback
function showFeedbackHistory() {
    let historyHTML = `
        <div class="modal fade" id="feedbackHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-comments me-2"></i>Historial de Feedback
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-success">Feedback Dado</h6>
                                <div class="list-group">
    `;
    
    // Mostrar feedback dado
    if (feedbackHistory.length > 0) {
        feedbackHistory.slice(-5).forEach(item => {
            historyHTML += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">Para: ${item.to}</h6>
                            <p class="mb-1 small">${item.comment}</p>
                            <small class="text-muted">${new Date(item.date).toLocaleDateString('es-ES')}</small>
                        </div>
                        <span class="badge bg-success">${item.rating}/5</span>
                    </div>
                </div>
            `;
        });
    } else {
        historyHTML += '<div class="list-group-item text-muted">No has dado feedback aún</div>';
    }
    
    historyHTML += `
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Feedback Recibido</h6>
                                <div class="list-group">
    `;
    
    // Simular feedback recibido
    const receivedFeedback = [
        { from: 'Ana Martínez', comment: 'Excelente trabajo en el análisis de datos', rating: 5, date: '2025-01-05' },
        { from: 'Carlos López', comment: 'Muy buena presentación del proyecto', rating: 4, date: '2025-01-03' },
        { from: 'José Rodríguez', comment: 'Gran capacidad de síntesis', rating: 5, date: '2025-01-01' }
    ];
    
    if (receivedFeedback.length > 0) {
        receivedFeedback.forEach(item => {
            historyHTML += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">De: ${item.from}</h6>
                            <p class="mb-1 small">${item.comment}</p>
                            <small class="text-muted">${item.date}</small>
                        </div>
                        <span class="badge bg-primary">${item.rating}/5</span>
                    </div>
                </div>
            `;
        });
    } else {
        historyHTML += '<div class="list-group-item text-muted">No has recibido feedback aún</div>';
    }
    
    historyHTML += `
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Añadir modal al DOM
    if (!document.getElementById('feedbackHistoryModal')) {
        document.body.insertAdjacentHTML('beforeend', historyHTML);
    } else {
        document.getElementById('feedbackHistoryModal').outerHTML = historyHTML;
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('feedbackHistoryModal'));
    modal.show();
}

// Guardar datos de feedback
function saveFeedbackData() {
    localStorage.setItem('feedbackRequests', JSON.stringify(feedbackRequests));
    localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory));
}

// Cargar datos de feedback
function loadFeedbackData() {
    const savedRequests = localStorage.getItem('feedbackRequests');
    if (savedRequests) {
        feedbackRequests = JSON.parse(savedRequests);
    }
    
    const savedHistory = localStorage.getItem('feedbackHistory');
    if (savedHistory) {
        feedbackHistory = JSON.parse(savedHistory);
    }
}

// Función para analizar certificados y CV
async function analyzeCertificate() {
    const fileInput = document.getElementById('certificateFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Por favor, selecciona un archivo para analizar', 'warning');
        return;
    }
    
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Formato de archivo no soportado. Use PDF, DOC, DOCX, JPG o PNG', 'error');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Analizando...';
        button.disabled = true;
        
        // Simular análisis del documento usando setTimeout
        setTimeout(() => {
            try {
                // Análisis simulado basado en el tipo de archivo
                let analysisResult = '';
                if (file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('curriculum')) {
                    analysisResult = `
**Análisis de CV completado:**

📋 **Competencias detectadas:**
• Técnicas: Gestión de prestaciones, atención al ciudadano
• Transversales: Comunicación, trabajo en equipo
• Digitales: Microsoft Office, gestión de bases de datos
• Lingüísticas: Español nativo, Inglés B1

🎯 **Recomendaciones de mejora:**
• Completar formación en competencias digitales avanzadas
• Considerar certificación en orientación laboral
• Añadir experiencia en programas específicos del SEPE
                    `;
                } else {
                    analysisResult = `
**Análisis de certificado completado:**

🏆 **Certificación detectada:**
• Curso de especialización identificado
• Competencias relacionadas con el puesto actual
• Nivel de certificación: Intermedio-Avanzado

💡 **Impacto en tu perfil:**
• Mejora esperada en competencias técnicas: +0.5 puntos
• Complementa áreas de desarrollo identificadas
• Aumenta tu puntuación general de empleabilidad
                    `;
                }
                
                // Mostrar resultado en el mentor
                showSection('assistant');
                addMessageToChat(`He analizado tu documento "${file.name}". ${analysisResult}`, 'assistant');
                
                showNotification('Documento analizado correctamente', 'success');
                
                // Restaurar botón
                button.innerHTML = originalText;
                button.disabled = false;
                
                // Limpiar input
                fileInput.value = '';
                
            } catch (error) {
                console.error('Error al analizar documento:', error);
                showNotification('Error al analizar el documento. Inténtalo de nuevo.', 'error');
                
                // Restaurar botón
                button.innerHTML = '<i class="fas fa-magic me-1"></i>Analizar Documento';
                button.disabled = false;
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error general en analyzeCertificate:', error);
        showNotification('Error al procesar el archivo', 'error');
    }
}

// Event listeners para el chat
document.addEventListener('DOMContentLoaded', function() {
    // Permitir envío con Enter
    const messageInput = document.getElementById('userMessage');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});