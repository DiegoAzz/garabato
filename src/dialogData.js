/**
 * Base de datos de diálogos y perfiles para los empleados de OFFICE LIFE 3D
 */
export const EMPLOYEES_DATA = [
  {
    id: 'sofia',
    name: 'Sofía Martínez',
    role: 'Recepcionista & Experiencia de Oficina',
    badgeColor: '#a855f7',
    avatarBg: '#f3e8ff',
    avatarEmoji: '💁‍♀️',
    description: 'La primera sonrisa que ves al entrar. Coordina visitas, correspondencia y el bienestar general.',
    initialPosition: { x: 0, z: -8.5 },
    chairPosition: { x: 0, z: -9.4 },
    rotation: 0, // Mirando hacia la entrada (+Z)
    workType: 'reception',
    questions: [
      {
        q: '¿Cuáles son tus principales funciones diarias?',
        a: '¡Hola! Mi labor principal es ser el primer punto de contacto de la empresa. Gestiono el acceso de clientes, proveedores y nuevos talentos, administro la correspondencia, organizo salas de reuniones y me aseguro de que el ambiente de la oficina sea acogedor y funcional para todo el equipo.'
      },
      {
        q: '¿Qué habilidades consideras más importantes en tu cargo?',
        a: 'La comunicación asertiva, la empatía y una alta capacidad de organización multitarea. En un solo día puedo estar coordinando una visita internacional mientras resuelvo la logística de un evento corporativo y asisto al equipo directivo. ¡Mantener la calma con una sonrisa es clave!'
      },
      {
        q: '¿Cómo organizas los eventos y la logística general?',
        a: 'Utilizo herramientas de gestión de calendarios compartidos, checklists digitales y mantengo contacto constante con proveedores locales de catering e insumos. Mi lema es anticiparse a las necesidades del equipo antes de que surja cualquier imprevisto.'
      }
    ]
  },
  {
    id: 'laura',
    name: 'Laura Gómez',
    role: 'Desarrolladora Full-Stack Senior',
    badgeColor: '#06b6d4',
    avatarBg: '#cffafe',
    avatarEmoji: '👩‍💻',
    description: 'Arquitecta de software. Convierte requerimientos complejos en código limpio, escalable y eficiente.',
    initialPosition: { x: -8, z: -1 },
    chairPosition: { x: -8, z: -1.8 },
    rotation: 0, // Mirando hacia sus monitores (+Z)
    workType: 'coding',
    questions: [
      {
        q: '¿En qué tecnologías estás trabajando actualmente?',
        a: '¡Buenas! Ahora mismo estoy refactorizando nuestra plataforma principal. Trabajo con JavaScript moderno (ES Modules), Three.js para visualización de datos 3D, Node.js para microservicios y bases de datos distribuidas. Siempre busco que el código sea modular, testeable y rápido.'
      },
      {
        q: '¿Cómo es tu flujo de trabajo al crear una nueva funcionalidad?',
        a: 'Primero analizo los requerimientos con Mariana (la gerente) y el equipo de diseño. Luego diseño la arquitectura técnica, creo prototipos rápidos, escribo pruebas unitarias y finalmente programo la solución. Tras un exhaustivo code review con mis compañeros, lo desplegamos a producción.'
      },
      {
        q: '¿Qué consejo le darías a alguien que quiere ser programador?',
        a: 'Que no tema cometer errores y que construya proyectos reales desde el primer día. La curiosidad constante y aprender a leer documentación oficial valen más que memorizar sintaxis. Y sobre todo: ¡mantener el código simple y limpio!'
      }
    ]
  },
  {
    id: 'carlos',
    name: 'Carlos Mendoza',
    role: 'Contador & Analista Financiero',
    badgeColor: '#10b981',
    avatarBg: '#d1fae5',
    avatarEmoji: '👨‍💼',
    description: 'El guardián de los números. Supervisa presupuestos, nóminas, balances e impuestos.',
    initialPosition: { x: -8, z: 5 },
    chairPosition: { x: -8, z: 4.2 },
    rotation: Math.PI, // Mirando hacia su escritorio
    workType: 'accounting',
    questions: [
      {
        q: '¿Qué responsabilidades manejas en el área financiera?',
        a: 'Saludos. Me encargo de la salud fiscal de la compañía: elaboro balances generales, estados de resultados, gestión de flujo de caja, pago puntual de nóminas y cumplimiento tributario. Mi objetivo es que cada peso invertido maximice el crecimiento sostenible de la empresa.'
      },
      {
        q: '¿Qué herramientas utilizas para el análisis de datos?',
        a: 'Combino hojas de cálculo avanzadas con macros financieras, software ERP integrado y herramientas de Business Intelligence (BI) para modelado predictivo. La automatización nos ahorra horas de conciliación manual.'
      },
      {
        q: '¿Por qué es vital una buena gestión contable para una empresa moderna?',
        a: 'Porque sin métricas financieras claras, ninguna estrategia de negocio puede tomar decisiones acertadas. Un buen control financiero permite saber con precisión cuándo contratar personal, cuándo expandirse a nuevos mercados y cómo mitigar riesgos económicos.'
      }
    ]
  },
  {
    id: 'andres',
    name: 'Andrés Silva',
    role: 'Especialista en Soporte TI & Servidores',
    badgeColor: '#f59e0b',
    avatarBg: '#fef3c7',
    avatarEmoji: '👨‍🔧',
    description: 'Resuelve fallas de hardware, asegura las redes internas y mantiene los servidores 24/7.',
    initialPosition: { x: 8, z: 5 },
    chairPosition: { x: 8, z: 4.2 },
    rotation: Math.PI,
    workType: 'it_support',
    questions: [
      {
        q: '¿Qué tipo de problemas resuelves comúnmente en la oficina?',
        a: '¡Hey! Desde el clásico "reinicié el router y no conecta" hasta mantenimiento preventivo de servidores rack, configuración de firewalls, políticas de ciberseguridad, backups automáticos y ensamblaje de estaciones de trabajo para los nuevos ingresos.'
      },
      {
        q: '¿Cómo garantizas la seguridad informática de la empresa?',
        a: 'Implementamos autenticación multifactor (MFA), segmentación de redes VLAN para visitantes y empleados, cifrado de discos punto a punto y monitoreo en tiempo real de tráfico anómalo. Además, capacito al equipo contra ataques de phishing.'
      },
      {
        q: '¿Cuál es la regla de oro en soporte técnico?',
        a: 'Dos reglas fundamentales: 1) Si no tiene backup probado, el archivo no existe realmente. 2) Primero revisa lo más simple: cableado físico, energía y permisos antes de desmontar el servidor entero. ¡Ahorra horas de dolores de cabeza!'
      }
    ]
  },
  {
    id: 'mariana',
    name: 'Mariana Duarte',
    role: 'Gerente de Operaciones & Estrategia',
    badgeColor: '#ef4444',
    avatarBg: '#fee2e2',
    avatarEmoji: '👩‍💼',
    description: 'Lidera la visión del equipo, alinea proyectos interdepartamentales e impulsa la cultura de la empresa.',
    initialPosition: { x: 7, z: -5.5 },
    chairPosition: { x: 7, z: -6.4 },
    rotation: 0,
    workType: 'managing',
    questions: [
      {
        q: '¿Cuál es tu rol como Gerente de Operaciones?',
        a: '¡Bienvenido! Mi función es articular a todas las áreas de la empresa —desde tecnología y finanzas hasta operaciones y atención al cliente— para que nuestros objetivos estratégicos se cumplan en tiempo y forma, cuidando la motivación y el bienestar del equipo.'
      },
      {
        q: '¿Cómo manejas la toma de decisiones complejas en la oficina?',
        a: 'Me baso en datos concretos, pero también escucho activamente la experiencia directa de los líderes de área. Fomento una cultura de transparencia donde los problemas se plantean de inmediato con propuestas de solución, nunca con culpas.'
      },
      {
        q: '¿Qué hace que un equipo de trabajo sea verdaderamente exitoso?',
        a: 'La confianza mutua, la comunicación abierta y un propósito compartido claro. Cuando cada miembro comprende el impacto directo de su trabajo en la visión general de la empresa, la creatividad y la productividad florecen de manera natural.'
      }
    ]
  }
];
