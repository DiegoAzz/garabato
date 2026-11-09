/**
 * Gestor Centralizado de Chistes de Stand-Up Comedy — GARABATO COMEDY CLUB 3D
 * Maneja chistes gratis (desbloqueados por Taps) y chistes VIP (desbloqueados por Regalos de TikTok).
 */

export const TIKTOK_GIFTS = [
  // --- POPULARES Y 1 MONEDA ---
  { id: 'rosa', name: '🌹 Rosa', icon: '🌹', cost: '1 moneda' },
  { id: 'rosa_blanca', name: '🤍 Rosa blanca', icon: '🤍', cost: '1 moneda' },
  { id: 'gg', name: '🎮 GG', icon: '🎮', cost: '1 moneda' },
  { id: 'eres_increible', name: '🐱 Eres increíble', icon: '🐱', cost: '1 moneda' },
  { id: 'te_adoro', name: '🥰 Te adoro', icon: '🥰', cost: '1 moneda' },
  { id: 'tiktok', name: '🎵 TikTok', icon: '🎵', cost: '1 moneda' },
  { id: 'ritmo_tambor', name: '🥁 Ritmo de tambor', icon: '🥁', cost: '1 moneda' },
  { id: 'helado', name: '🍦 Cono de Helado', icon: '🍦', cost: '1 moneda' },
  { id: 'pesa', name: '🏋️ Pesa Fitness', icon: '🏋️', cost: '1 moneda' },

  // --- 5 A 10 MONEDAS ---
  { id: 'corazon_coreano', name: '🫰 Corazón coreano', icon: '🫰', cost: '5 monedas' },
  { id: 'fuegos_mini', name: '🎆 Fuegos artificiales mini', icon: '🎆', cost: '5 monedas' },
  { id: 'subida_nivel', name: '🕹️ Subida de nivel', icon: '🕹️', cost: '10 monedas' },
  { id: 'pequeno_dino', name: '🦖 Pequeño dino', icon: '🦖', cost: '10 monedas' },
  { id: 'oso', name: '🧸 Oso Teddy', icon: '🧸', cost: '10 monedas' },
  { id: 'mariposa', name: '🦋 Mariposa', icon: '🦋', cost: '10 monedas' },

  // --- 30 A 99 MONEDAS ---
  { id: 'capibara', name: '🦫 Capibara', icon: '🦫', cost: '30 monedas' },
  { id: 'dona', name: '🍩 Dona Glaseada', icon: '🍩', cost: '30 monedas' },
  { id: 'beso', name: '💋 Beso de Amor', icon: '💋', cost: '50 monedas' },
  { id: 'cafe', name: '☕ Café Express', icon: '☕', cost: '60 monedas' },
  { id: 'sombrero', name: '🎩 Sombrero & Bigote', icon: '🎩', cost: '99 monedas' },
  { id: 'gorra', name: '🧢 Gorra Urbana', icon: '🧢', cost: '99 monedas' },

  // --- 100 MONEDAS (MEDIANOS PRO) ---
  { id: 'super_gg', name: '🏆 Super GG', icon: '🏆', cost: '100 monedas' },
  { id: 'control_retro', name: '🕹️ Control Retro', icon: '🕹️', cost: '100 monedas' },
  { id: 'micro', name: '🎤 Micrófono de Oro', icon: '🎤', cost: '100 monedas' },
  { id: 'fuego', name: '💖 Corazón de Fuego', icon: '💖', cost: '100 monedas' },
  { id: 'confeti', name: '🎊 Cañón de Confeti', icon: '🎊', cost: '100 monedas' },

  // --- 199 A 500 MONEDAS ---
  { id: 'corona', name: '👑 Corona VIP', icon: '👑', cost: '199 monedas' },
  { id: 'gafas', name: '🕶️ Gafas de Sol VIP', icon: '🕶️', cost: '199 monedas' },
  { id: 'patineta', name: '🛹 Patineta', icon: '🛹', cost: '300 monedas' },
  { id: 'cohete', name: '🚀 Cohete Espacial', icon: '🚀', cost: '500 monedas' },

  // --- 1000+ MONEDAS (ÉLITE Y ÉPICOS) ---
  { id: 'fuegos_pro', name: '🎆 Fuegos Artificiales Pro', icon: '🎆', cost: '1088 monedas' },
  { id: 'galaxia', name: '🪐 Galaxia', icon: '🪐', cost: '1000 monedas' },
  { id: 'tren', name: '🚂 Tren Choo-Choo', icon: '🚂', cost: '899 monedas' },
  { id: 'unicornio', name: '🦄 Unicornio Mágico', icon: '🦄', cost: '5000 monedas' },
  { id: 'avion', name: '✈️ Avión Privado', icon: '✈️', cost: '6000 monedas' },
  { id: 'yate', name: '🛥️ Yate de Lujo', icon: '🛥️', cost: '7499 monedas' },
  { id: 'diamante', name: '💎 Diamante', icon: '💎', cost: '20000 monedas' },
  { id: 'leon', name: '🦁 León Galáctico', icon: '🦁', cost: '29999 monedas' },
  { id: 'universo', name: '🌌 Universo TikTok', icon: '🌌', cost: '34999 monedas' }
];

export const DEFAULT_JOKES = [
  // ==========================================
  // 50 CHISTES TÍPICOS REGIONALES DE COLOMBIA (GRATIS POR TAPS)
  // ==========================================
  {
    id: "regi_n_caribe_1",
    title: "El calor costeño",
    region: "Región Caribe",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué en la Costa no existe el infierno?",
    punch: "¡Porque nadie paga por ir a un sitio más fresco!",
    audioTrackId: null
  },
  {
    id: "regi_n_caribe_2",
    title: "La dieta costeña",
    region: "Región Caribe",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el costeño cuando le recomendaron dejar la fritanga?",
    punch: "¡Que prefería dejar al nutricionista!",
    audioTrackId: null
  },
  {
    id: "regi_n_caribe_3",
    title: "El aire acondicionado",
    region: "Región Caribe",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el costeño le habla bonito al aire acondicionado?",
    punch: "¡Porque es el único que lo trata con frialdad y le gusta!",
    audioTrackId: null
  },
  {
    id: "regi_n_caribe_4",
    title: "La puntualidad",
    region: "Región Caribe",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué significa «ya voy llegando» en la Costa?",
    punch: "¡Que todavía está buscando las chancletas!",
    audioTrackId: null
  },
  {
    id: "regi_n_caribe_5",
    title: "El turista",
    region: "Región Caribe",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué preguntó un turista al llegar a Cartagena?",
    punch: "¿Aquí siempre hace tanto calor? —¡No, compadre, de noche también!",
    audioTrackId: null
  },
  {
    id: "regi_n_paisa_1",
    title: "El paisa emprendedor",
    region: "Región Paisa",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué hizo un paisa cuando le regalaron un calendario?",
    punch: "¡Lo alquiló por días!",
    audioTrackId: null
  },
  {
    id: "regi_n_paisa_2",
    title: "La alcancía",
    region: "Región Paisa",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el paisa puso una alcancía al lado del espejo?",
    punch: "¡Para cobrar por semejante belleza, pues!",
    audioTrackId: null
  },
  {
    id: "regi_n_paisa_3",
    title: "El negocio",
    region: "Región Paisa",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el paisa cuando se quedó sin trabajo?",
    punch: "¡Excelente, ahora tengo tiempo completo para emprender!",
    audioTrackId: null
  },
  {
    id: "regi_n_paisa_4",
    title: "El descuento",
    region: "Región Paisa",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué hace un paisa cuando ve un letrero de 50 % de descuento?",
    punch: "¡Pregunta cuánto le rebajan si compra la mitad!",
    audioTrackId: null
  },
  {
    id: "regi_n_paisa_5",
    title: "El gimnasio",
    region: "Región Paisa",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el paisa no necesita entrenador personal?",
    punch: "¡Porque cada vez que ve una deuda, sale corriendo!",
    audioTrackId: null
  },
  {
    id: "bogot__y_cundinamarca_1",
    title: "El clima bogotano",
    region: "Bogotá y Cundinamarca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué un rolo sale con sombrilla, chaqueta y gafas de sol?",
    punch: "¡Porque va a vivir las cuatro estaciones antes del almuerzo!",
    audioTrackId: null
  },
  {
    id: "bogot__y_cundinamarca_2",
    title: "TransMilenio",
    region: "Bogotá y Cundinamarca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el rolo cuando consiguió asiento en TransMilenio?",
    punch: "¡Voy a llamar a mi mamá, esto merece celebración!",
    audioTrackId: null
  },
  {
    id: "bogot__y_cundinamarca_3",
    title: "El trancón",
    region: "Bogotá y Cundinamarca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Cómo sabe un bogotano que ya llegó a su casa?",
    punch: "¡Cuando reconoce al vendedor del mismo semáforo por tercer día consecutivo!",
    audioTrackId: null
  },
  {
    id: "bogot__y_cundinamarca_4",
    title: "El frío",
    region: "Bogotá y Cundinamarca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué un costeño llevó una cobija a Bogotá?",
    punch: "¡Porque le dijeron que allá el sol trabaja medio tiempo!",
    audioTrackId: null
  },
  {
    id: "bogot__y_cundinamarca_5",
    title: "La distancia",
    region: "Bogotá y Cundinamarca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué significa «eso queda cerquita» en Bogotá?",
    punch: "¡Dos buses, un transbordo y una caminadita de cuarenta minutos!",
    audioTrackId: null
  },
  {
    id: "valle_del_cauca_1",
    title: "La salsa caleña",
    region: "Valle del Cauca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el caleño no usa despertador?",
    punch: "¡Porque hasta la alarma le suena a salsa!",
    audioTrackId: null
  },
  {
    id: "valle_del_cauca_2",
    title: "El gimnasio caleño",
    region: "Valle del Cauca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo el entrenador al caleño?",
    punch: "¡Deje de hacer pasos de salsa entre cada sentadilla!",
    audioTrackId: null
  },
  {
    id: "valle_del_cauca_3",
    title: "La cita",
    region: "Valle del Cauca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué la caleña llegó tarde a la cita?",
    punch: "¡Porque pasó por una tienda, sonó salsa y tocó terminar la canción!",
    audioTrackId: null
  },
  {
    id: "valle_del_cauca_4",
    title: "La fiesta",
    region: "Valle del Cauca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué hace un caleño cuando escucha música en un velorio?",
    punch: "¡Pregunta bajito si eso se puede bailar!",
    audioTrackId: null
  },
  {
    id: "valle_del_cauca_5",
    title: "El GPS",
    region: "Valle del Cauca",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el GPS se desespera en Cali?",
    punch: "¡Porque dice «gire a la derecha» y el conductor responde «después de este pasito»!",
    audioTrackId: null
  },
  {
    id: "santander_1",
    title: "El santandereano directo",
    region: "Santander",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el santandereano cuando le preguntaron si estaba bravo?",
    punch: "¡No estoy bravo! ¡Y deje de preguntarme bobadas!",
    audioTrackId: null
  },
  {
    id: "santander_2",
    title: "El restaurante",
    region: "Santander",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo el mesero al santandereano?",
    punch: "¿La carne bien hecha? —¡Pues claro, no me la vaya a hacer mal!",
    audioTrackId: null
  },
  {
    id: "santander_3",
    title: "Las hormigas culonas",
    region: "Santander",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué una hormiga culona abrió un gimnasio?",
    punch: "¡Porque ya tenía el negocio de las sentadillas ganado!",
    audioTrackId: null
  },
  {
    id: "santander_4",
    title: "La sinceridad",
    region: "Santander",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el santandereano cuando le pidieron una opinión sincera?",
    punch: "¡Siéntese primero, que esto va para largo!",
    audioTrackId: null
  },
  {
    id: "santander_5",
    title: "La discusión",
    region: "Santander",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Cómo sabes que dos santandereanos están hablando tranquilamente?",
    punch: "¡Porque solamente los escuchas a tres cuadras!",
    audioTrackId: null
  },
  {
    id: "tolima_y_huila_1",
    title: "El tamal",
    region: "Tolima y Huila",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el tolimense no abre los regalos con emoción?",
    punch: "¡Porque si no vienen envueltos en hoja de plátano, no le interesan!",
    audioTrackId: null
  },
  {
    id: "tolima_y_huila_2",
    title: "El Sanjuanero",
    region: "Tolima y Huila",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué hace un opita cuando escucha el Sanjuanero?",
    punch: "¡Se le activa el modo fiesta, así esté en una entrevista de trabajo!",
    audioTrackId: null
  },
  {
    id: "tolima_y_huila_3",
    title: "El lechón",
    region: "Tolima y Huila",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo el lechón a la báscula?",
    punch: "¡No me juzgue, que estoy en temporada de fiestas!",
    audioTrackId: null
  },
  {
    id: "tolima_y_huila_4",
    title: "La visita",
    region: "Tolima y Huila",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué la visita no se quería ir de Ibagué?",
    punch: "¡Porque le dijeron «tómese otro cafecito» diecisiete veces!",
    audioTrackId: null
  },
  {
    id: "tolima_y_huila_5",
    title: "El desayuno",
    region: "Tolima y Huila",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el tolimense cuando le ofrecieron cereal?",
    punch: "¿Y ese tamal por qué viene desarmado?",
    audioTrackId: null
  },
  {
    id: "llanos_orientales_1",
    title: "El caballo",
    region: "Llanos Orientales",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el llanero no compra moto?",
    punch: "¡Porque el caballo nunca le cobra gasolina y encima lo saluda!",
    audioTrackId: null
  },
  {
    id: "llanos_orientales_2",
    title: "El joropo",
    region: "Llanos Orientales",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el vecino del llanero a las seis de la mañana?",
    punch: "¡Compadre, deje de zapatear, que me está despertando las gallinas!",
    audioTrackId: null
  },
  {
    id: "llanos_orientales_3",
    title: "El WiFi llanero",
    region: "Llanos Orientales",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el llanero puso el router en el establo?",
    punch: "¡Porque quería una conexión a todo galope!",
    audioTrackId: null
  },
  {
    id: "llanos_orientales_4",
    title: "El despertador",
    region: "Llanos Orientales",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué usa el llanero como alarma?",
    punch: "¡Un gallo que no tiene botón de posponer!",
    audioTrackId: null
  },
  {
    id: "llanos_orientales_5",
    title: "La cita romántica",
    region: "Llanos Orientales",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo el llanero a su pareja?",
    punch: "¡Usted me tiene el corazón galopando y el caballo celoso!",
    audioTrackId: null
  },
  {
    id: "regi_n_pac_fica_1",
    title: "La marimba",
    region: "Región Pacífica",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el músico del Pacífico nunca pierde las llaves?",
    punch: "¡Porque hasta para buscarlas lleva ritmo de marimba!",
    audioTrackId: null
  },
  {
    id: "regi_n_pac_fica_2",
    title: "El pescador",
    region: "Región Pacífica",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el pescador cuando le preguntaron por su mayor logro?",
    punch: "¡Una vez pesqué señal de internet en plena lancha!",
    audioTrackId: null
  },
  {
    id: "regi_n_pac_fica_3",
    title: "La lluvia",
    region: "Región Pacífica",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué en el Chocó no le temen a un aguacero?",
    punch: "¡Porque la lluvia ya es parte del grupo de WhatsApp familiar!",
    audioTrackId: null
  },
  {
    id: "regi_n_pac_fica_4",
    title: "El encocado",
    region: "Región Pacífica",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el coco cuando lo invitaron a almorzar?",
    punch: "¡Espero que no sea nada personal!",
    audioTrackId: null
  },
  {
    id: "regi_n_pac_fica_5",
    title: "La música",
    region: "Región Pacífica",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el tambor no se pudo quedar callado?",
    punch: "¡Porque tenía mucho que contar a punta de golpes!",
    audioTrackId: null
  },
  {
    id: "nari_o_y_pasto_1",
    title: "El Carnaval",
    region: "Nariño y Pasto",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el pastuso llevó una maleta al Carnaval de Negros y Blancos?",
    punch: "¡Porque sabía que iba a volver irreconocible!",
    audioTrackId: null
  },
  {
    id: "nari_o_y_pasto_2",
    title: "El volcán",
    region: "Nariño y Pasto",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo el Galeras al turista?",
    punch: "¡No me haga enojar, que yo sí echo humo de verdad!",
    audioTrackId: null
  },
  {
    id: "nari_o_y_pasto_3",
    title: "La ruana",
    region: "Nariño y Pasto",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué la ruana terminó en una discusión?",
    punch: "¡Porque siempre quería cubrirlo todo!",
    audioTrackId: null
  },
  {
    id: "nari_o_y_pasto_4",
    title: "El cuy",
    region: "Nariño y Pasto",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo el cuy al chef?",
    punch: "¡Yo vine a conocer Pasto, no a quedarme en el menú!",
    audioTrackId: null
  },
  {
    id: "nari_o_y_pasto_5",
    title: "El frío pastuso",
    region: "Nariño y Pasto",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el turista después de salir sin chaqueta en Pasto?",
    punch: "¡Ahora entiendo por qué aquí hasta los abrazos vienen con calefacción!",
    audioTrackId: null
  },
  {
    id: "boyac__1",
    title: "La papa",
    region: "Boyacá",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el boyacense llevó una papa a una entrevista?",
    punch: "¡Porque le dijeron que trajera experiencia en el campo!",
    audioTrackId: null
  },
  {
    id: "boyac__2",
    title: "La ruana boyacense",
    region: "Boyacá",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el boyacense no pierde nunca la ruana?",
    punch: "¡Porque es chaqueta, cobija y oficina portátil!",
    audioTrackId: null
  },
  {
    id: "boyac__3",
    title: "El frío",
    region: "Boyacá",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué le dijo un turista al campesino en Boyacá?",
    punch: "¡Qué frío! —¡Sumercé todavía no ha conocido la madrugada!",
    audioTrackId: null
  },
  {
    id: "boyac__4",
    title: "El mercado",
    region: "Boyacá",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Por qué el boyacense no confía en las aplicaciones del clima?",
    punch: "¡Porque su abuelita mira el cielo y acierta más!",
    audioTrackId: null
  },
  {
    id: "boyac__5",
    title: "El reloj",
    region: "Boyacá",
    category: "FREE_TAPS",
    requiredTaps: 30,
    currentTaps: 0,
    setup: "¿Qué dijo el reloj cuando llegó a Boyacá?",
    punch: "¡Aquí sí que toca trabajar desde tempranito!",
    audioTrackId: null
  },

  // ==========================================
  // RETOS Y CHISTES VIP (DESBLOQUEADOS POR REGALO TIKTOK)
  // ==========================================
  {
    id: 'vip_tomate',
    category: 'VIP_GIFT',
    title: '🍅 Tomatazo al Actor',
    giftId: 'rosa',
    giftName: '🌹 Rosa',
    setup: '¡Alguien mandó una Rosa para castigar al actor con tomates!',
    punch: '¡💥 AUCH! ¡El ojo no compadre!',
    audioTrackId: null
  },
  {
    id: 'vip_1',
    category: 'VIP_GIFT',
    title: 'Jaimito en TikTok',
    giftId: 'rosa_blanca',
    giftName: '🤍 Rosa blanca',
    setup: 'Jaimito entra al LIVE de TikTok y le preguntan: ¿Cuánto es 2 más 2?',
    punch: '¡Depende de cuántas rosas me mandes!',
    audioTrackId: null
  },
  {
    id: 'vip_2',
    category: 'VIP_GIFT',
    title: 'La Dieta del Siglo',
    giftId: 'dona',
    giftName: '🍩 Dona Glaseada',
    setup: 'Empecé una dieta estricta de donas y batidos mágicos...',
    punch: '¡Ya perdí tres días de mi vida buscando la fuerza de voluntad!',
    audioTrackId: null
  },
  {
    id: 'vip_3',
    category: 'VIP_GIFT',
    title: 'El Capibara Filósofo',
    giftId: 'capibara',
    giftName: '🦫 Capibara',
    setup: '¿Por qué el capibara nunca se estresa en el trabajo?',
    punch: '¡Porque nada en aguas tranquilas y le resbala la opinión del jefe!',
    audioTrackId: null
  },
  {
    id: 'vip_4',
    category: 'VIP_GIFT',
    title: 'Gamer en Vivo',
    giftId: 'super_gg',
    giftName: '🏆 Super GG',
    setup: 'Mi novia me dijo: O el juego o yo...',
    punch: '¡Y le dije: GG mi amor, fue un placer conocerte!',
    audioTrackId: null
  },
  {
    id: 'vip_5',
    category: 'VIP_GIFT',
    title: 'Cantante en Ducha',
    giftId: 'micro',
    giftName: '🎤 Micrófono de Oro',
    setup: 'Mi vecino me gritó: ¡Oye, cantas horrible en la ducha!',
    punch: '¡Y yo le dije: Es que el agua está fría y no me sé el tono!',
    audioTrackId: null
  },
  {
    id: 'vip_6',
    category: 'VIP_GIFT',
    title: 'Rey de la Comedia',
    giftId: 'corona',
    giftName: '👑 Corona VIP',
    setup: 'Fui al médico y le dije: Doctor, me siento invisible...',
    punch: 'Y el doctor dijo: ¿Quién dijo eso? ¡Pase el siguiente paciente!',
    audioTrackId: null
  },
  {
    id: 'vip_7',
    category: 'VIP_GIFT',
    title: 'El León en la Oficina',
    giftId: 'leon',
    giftName: '🦁 León Galáctico',
    setup: 'Un león empezó a trabajar de gerente en una oficina...',
    punch: '¡Se comió al jefe y durante 6 meses nadie notó la diferencia!',
    audioTrackId: null
  }
];

const STORAGE_KEY = 'garabato_comedy_jokes_v3';

export class JokeManager {
  constructor(syncBridge = null) {
    this.syncBridge = syncBridge;
    this.jokes = this.loadJokes();
    this.activeFreeJokeId = this.jokes.find(j => j.category === 'FREE_TAPS')?.id || 'regi_n_caribe_1';
  }

  loadJokes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[JokeManager] Error cargando chistes:', e);
    }
    this.saveJokes(DEFAULT_JOKES);
    return JSON.parse(JSON.stringify(DEFAULT_JOKES));
  }

  saveJokes(jokesList) {
    this.jokes = jokesList;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.jokes));
    } catch (e) {}
    if (this.syncBridge) {
      this.syncBridge.send('JOKES_CATALOG_UPDATE', { jokes: this.jokes });
    }
  }

  getJokes() {
    return this.jokes;
  }

  getFreeJokes() {
    return this.jokes.filter(j => j.category === 'FREE_TAPS');
  }

  getVipJokes() {
    return this.jokes.filter(j => j.category === 'VIP_GIFT');
  }

  getJokeById(id) {
    return this.jokes.find(j => j.id === id) || null;
  }

  getActiveFreeJoke() {
    return this.getJokeById(this.activeFreeJokeId) || this.getFreeJokes()[0];
  }

  setActiveFreeJoke(id) {
    this.activeFreeJokeId = id;
    if (this.syncBridge) {
      this.syncBridge.send('SET_ACTIVE_FREE_JOKE', { jokeId: id });
    }
  }

  addTapsToActiveJoke(delta = 1) {
    const joke = this.getActiveFreeJoke();
    if (!joke) return null;

    joke.currentTaps = (joke.currentTaps || 0) + delta;
    const isCompleted = joke.currentTaps >= joke.requiredTaps;

    if (isCompleted) {
      joke.currentTaps = 0; // Reiniciar para poder jugarlo de nuevo
    }

    this.saveJokes(this.jokes);
    return { joke, isCompleted };
  }

  findVipJokeByGift(giftName) {
    if (!giftName) return null;
    const normalize = str => (str || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

    const cleanInput = normalize(giftName);

    return this.getVipJokes().find(j => {
      const gName = normalize(j.giftName);
      const gId = normalize(j.giftId);
      return cleanInput.includes(gId) ||
             cleanInput.includes(gName) ||
             gName.includes(cleanInput) ||
             gId.includes(cleanInput);
    }) || null;
  }

  addJoke(jokeData) {
    const id = 'joke_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newJoke = {
      id,
      category: jokeData.category || 'FREE_TAPS',
      title: jokeData.title || 'Chiste Nuevo',
      region: jokeData.region || null,
      requiredTaps: parseInt(jokeData.requiredTaps, 10) || 30,
      currentTaps: 0,
      giftId: jokeData.giftId || 'rosa',
      giftName: jokeData.giftName || '🌹 Rosa',
      setup: jokeData.setup || '',
      punch: jokeData.punch || '',
      audioTrackId: jokeData.audioTrackId || null
    };

    this.jokes.push(newJoke);
    this.saveJokes(this.jokes);
    return newJoke;
  }

  updateJoke(id, updatedFields) {
    const idx = this.jokes.findIndex(j => j.id === id);
    if (idx !== -1) {
      this.jokes[idx] = { ...this.jokes[idx], ...updatedFields };
      this.saveJokes(this.jokes);
      return this.jokes[idx];
    }
    return null;
  }

  deleteJoke(id) {
    this.jokes = this.jokes.filter(j => j.id !== id);
    this.saveJokes(this.jokes);
  }

  resetToDefaults() {
    this.saveJokes(DEFAULT_JOKES);
  }
}
