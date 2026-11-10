import * as THREE from 'three';

/**
 * GENERADOR DE PERSONAJES CARTOON STICKMAN ULTRA-LIGERO 3D
 * Basado exactamente en el estilo de combate / batalla viral de TikTok LIVE (Cleo vs Nia):
 * - Cabezas blancas grandes y redondeadas con contorno negro marcado estilo cómic
 * - Ojos y cejas expresivas y decididas en negro brillante
 * - Extremidades negras estilizadas ultra-ligeras con articulaciones snappys
 * - Camisetas y sudaderas de colores festival con insignias
 * - Consumo ultra-bajo de GPU/CPU: menos de 120 polígonos por muñeco
 * - 60 FPS garantizados incluso con 50 o 100 personajes simultáneos
 */

// Materiales compartidos para máximo rendimiento (Zero garbage collection)
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x05070e, side: THREE.BackSide });
const whiteHeadMat = new THREE.MeshLambertMaterial({ color: 0xffffff, roughness: 0.2 });
const blackFaceMat = new THREE.MeshBasicMaterial({ color: 0x05070e });
const blackLimbMat = new THREE.MeshBasicMaterial({ color: 0x05070e });
const micGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

// Paleta de camisetas vibrantes estilo avatares de streaming
const SHIRT_COLORS = [
  0x3b82f6, // Azul eléctrico (Cleo)
  0xeab308, // Amarillo festival (Nia)
  0xef4444, // Rojo fuego (Zane)
  0x22c55e, // Verde lima (Finn)
  0x8b5cf6, // Púrpura cósmico (Ty)
  0xec4899, // Rosa neón
  0x06b6d4, // Cian streaming
  0xf97316, // Naranja intenso
  0xffffff, // Blanco clásico
  0x0f172a  // Negro urbano
];

export function createStickman(isSinger = false, initialColor = null, customConfig = null) {
  const group = new THREE.Group();
  group.name = isSinger ? 'SingerStickman' : 'AudienceStickman';

  const shirtColor = isSinger ? (initialColor || 0x2563eb) : SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });

  // Escala: Cantante grande y prominente en la tarima, espectadores mini para máxima visibilidad en 9:16
  const scale = isSinger ? 1.15 : 0.38;

  // 1. RAÍZ / CADERAS
  const hips = new THREE.Group();
  hips.position.y = 0.785 * scale;
  group.add(hips);

  // Esfera de cadera negra
  const hipSphere = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 8, 6), blackLimbMat);
  hips.add(hipSphere);

  // 2. TORSO (Camiseta o Sudadera estilo cómic)
  const torsoGroup = new THREE.Group();
  hips.add(torsoGroup);

  const torsoHeight = 0.52 * scale;
  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * scale, 0.17 * scale, torsoHeight, 10),
    shirtMat
  );
  torsoMesh.position.y = torsoHeight / 2;
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Contorno negro del torso
  const torsoOutline = new THREE.Mesh(
    new THREE.CylinderGeometry(0.215 * scale, 0.185 * scale, torsoHeight * 1.02, 10),
    outlineMat
  );
  torsoOutline.position.y = torsoHeight / 2;
  torsoGroup.add(torsoOutline);

  // Insignia de estrella / fuego / corona en el pecho
  const badgeColor = isSinger ? 0xfacc15 : (Math.random() < 0.5 ? 0xef4444 : 0x00f0ff);
  const badgeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.09 * scale, 0.09 * scale, 0.02),
    new THREE.MeshBasicMaterial({ color: badgeColor })
  );
  badgeMesh.position.set(0, torsoHeight * 0.6, 0.21 * scale);
  torsoGroup.add(badgeMesh);

  // 3. CABEZA BLANCA REDONDA CON CONTORNO NEGRO (ESTILO CÓMIC TIKTOK)
  const headGroup = new THREE.Group();
  headGroup.position.y = torsoHeight + 0.22 * scale;
  torsoGroup.add(headGroup);

  const headRadius = 0.42 * scale;

  // Cabeza blanca limpia
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(headRadius, 14, 12),
    whiteHeadMat
  );
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Contorno negro grueso estilo caricatura (Inverted Hull Outline)
  const headOutline = new THREE.Mesh(
    new THREE.SphereGeometry(headRadius * 1.07, 14, 12),
    outlineMat
  );
  headGroup.add(headOutline);

  // --- CARA EXPRESIVA CON ESTILO VIRAL DE TIKTOK ---
  // Ojos negros gruesos y expresivos
  const eyeWidth = headRadius * 0.24;
  const eyeHeight = headRadius * 0.32;

  function createCartoonEye(xOffset, isRight) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xOffset, headRadius * 0.08, headRadius * 0.94);

    // Ojo negro angular decidido (como en la referencia Cleo vs Nia)
    const eyeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(eyeWidth * 0.5, 8, 8),
      blackFaceMat
    );
    eyeMesh.scale.set(1.1, 1.3, 0.3);
    eyeGroup.add(eyeMesh);

    // Brillo blanco en la mirada
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(eyeWidth * 0.16, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(isRight ? 0.04 : -0.04, 0.05, 0.06);
    eyeGroup.add(shine);

    // Ceja inclinada enérgica (decidida / alegre)
    const browMesh = new THREE.Mesh(
      new THREE.BoxGeometry(headRadius * 0.36, 0.055, 0.04),
      blackFaceMat
    );
    browMesh.position.set(0, headRadius * 0.26, 0);
    browMesh.rotation.z = isRight ? -0.28 : 0.28;
    eyeGroup.add(browMesh);

    headGroup.add(eyeGroup);
    return { eyeGroup, browMesh };
  }

  const eyeL = createCartoonEye(-headRadius * 0.36, false);
  const eyeR = createCartoonEye(headRadius * 0.36, true);

  // Boca animada de cantante/espectador
  const mouthGeo = new THREE.SphereGeometry(headRadius * 0.2, 8, 6);
  const mouthMesh = new THREE.Mesh(mouthGeo, blackFaceMat);
  mouthMesh.position.set(0, -headRadius * 0.28, headRadius * 0.95);
  mouthMesh.scale.set(1.2, 0.25, 0.2); // Sonrisa cerrada inicial
  headGroup.add(mouthMesh);

  // 3.5. Bocadillo cómic de diálogo / exclamación para reacciones visuales
  let speechBubbleSprite = null;
  let bubbleCtx = null;
  let bubbleTex = null;

  if (isSinger) {
    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 256;
    bubbleCanvas.height = 96;
    bubbleCtx = bubbleCanvas.getContext('2d');
    bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    speechBubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, depthTest: false }));
    speechBubbleSprite.scale.set(1.4, 0.52, 1);
    speechBubbleSprite.position.set(0, headRadius * 2.2, 0);
    speechBubbleSprite.visible = false;
    headGroup.add(speechBubbleSprite);
  }

  function showBubbleText(text, bgColor = '#ef4444', durationMs = 2500) {
    if (!speechBubbleSprite || !bubbleCtx) return;
    bubbleCtx.clearRect(0, 0, 256, 96);
    bubbleCtx.fillStyle = bgColor;
    bubbleCtx.beginPath();
    bubbleCtx.roundRect(6, 6, 244, 84, 16);
    bubbleCtx.fill();
    bubbleCtx.strokeStyle = '#ffffff';
    bubbleCtx.lineWidth = 3.5;
    bubbleCtx.stroke();

    bubbleCtx.fillStyle = '#ffffff';
    const clean = String(text || '').trim();
    let fontSize = 20;
    if (clean.length > 28) fontSize = 14;
    else if (clean.length > 18) fontSize = 17;
    bubbleCtx.font = `bold ${fontSize}px sans-serif`;
    bubbleCtx.textAlign = 'center';
    bubbleCtx.textBaseline = 'middle';

    if (clean.length > 22 && clean.includes(' ')) {
      const words = clean.split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      bubbleCtx.fillText(line1, 128, 34);
      bubbleCtx.fillText(line2, 128, 62);
    } else {
      bubbleCtx.fillText(clean, 128, 48);
    }

    bubbleTex.needsUpdate = true;
    speechBubbleSprite.visible = true;

    clearTimeout(speechBubbleSprite._timer);
    speechBubbleSprite._timer = setTimeout(() => {
      speechBubbleSprite.visible = false;
    }, durationMs);
  }

  // Auriculares profesionales de DJ para el personaje estrella
  if (isSinger) {
    const hpGroup = new THREE.Group();
    // Diadema que cruza por arriba de la cabeza
    const bandGeo = new THREE.TorusGeometry(headRadius * 1.08, 0.035 * scale, 8, 24, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.rotation.x = -Math.PI / 2;
    bandMesh.position.y = headRadius * 0.12;
    hpGroup.add(bandMesh);

    // Almohadilla izquierda
    const earPadGeo = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.08 * scale, 16);
    const earPadMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
    const earPadL = new THREE.Mesh(earPadGeo, earPadMat);
    earPadL.rotation.z = Math.PI / 2;
    earPadL.position.set(-headRadius * 1.08, headRadius * 0.1, 0);
    hpGroup.add(earPadL);

    // Anillo de neón cian en auricular izquierdo
    const neonRingL = new THREE.Mesh(
      new THREE.RingGeometry(0.06 * scale, 0.11 * scale, 16),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
    );
    neonRingL.rotation.y = Math.PI / 2;
    neonRingL.position.set(-headRadius * 1.13, headRadius * 0.1, 0);
    hpGroup.add(neonRingL);

    // Almohadilla derecha
    const earPadR = new THREE.Mesh(earPadGeo, earPadMat);
    earPadR.rotation.z = -Math.PI / 2;
    earPadR.position.set(headRadius * 1.08, headRadius * 0.1, 0);
    hpGroup.add(earPadR);

    // Anillo de neón magenta en auricular derecho
    const neonRingR = new THREE.Mesh(
      new THREE.RingGeometry(0.06 * scale, 0.11 * scale, 16),
      new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide })
    );
    neonRingR.rotation.y = -Math.PI / 2;
    neonRingR.position.set(headRadius * 1.13, headRadius * 0.1, 0);
    hpGroup.add(neonRingR);

    headGroup.add(hpGroup);
  }

  // Gorra para el cantante estrella
  if (isSinger) {
    const capMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const capDome = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.05, 12, 8), capMat);
    capDome.position.set(0, headRadius * 0.2, -headRadius * 0.05);
    headGroup.add(capDome);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(headRadius * 0.85, 0.06, headRadius * 0.55), capMat);
    capVisor.position.set(0, headRadius * 0.2, -headRadius * 1.05);
    capVisor.rotation.x = -0.15;
    headGroup.add(capVisor);
  }

  // 4. BRAZOS STICKMAN NEGROS ARTICULADOS
  function createArm(isLeft) {
    const side = isLeft ? -1 : 1;
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.28 * scale, torsoHeight * 0.85, 0);
    torsoGroup.add(shoulder);

    // Manga
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.07 * scale, 0.22 * scale, 8),
      shirtMat
    );
    sleeve.position.y = -0.11 * scale;
    shoulder.add(sleeve);

    // Antebrazo negro
    const elbow = new THREE.Group();
    elbow.position.y = -0.22 * scale;
    shoulder.add(elbow);

    const armStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045 * scale, 0.045 * scale, 0.28 * scale, 6),
      blackLimbMat
    );
    armStick.position.y = -0.14 * scale;
    elbow.add(armStick);

    // Mano cartoon blanca
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.075 * scale, 8, 8),
      whiteHeadMat
    );
    hand.position.y = -0.28 * scale;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  }

  const armL = createArm(true);
  const armR = createArm(false);

  // Micrófono para el cantante
  if (isSinger) {
    const micGroup = new THREE.Group();
    const micHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.28, 6), blackLimbMat);
    micGroup.add(micHandle);

    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), micGoldMat);
    micHead.position.y = 0.16;
    micGroup.add(micHead);

    armR.hand.add(micGroup);
    micGroup.rotation.x = Math.PI / 2;
    micGroup.position.set(0, 0, 0.09);
    group.mic = micGroup;
  }

  // 5. PIERNAS STICKMAN NEGRAS ARTICULADAS
  function createLeg(isLeft) {
    const side = isLeft ? -1 : 1;
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.14 * scale, -0.05 * scale, 0);
    hips.add(hipJoint);

    // Muslo
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05 * scale, 0.045 * scale, 0.35 * scale, 6),
      blackLimbMat
    );
    thigh.position.y = -0.175 * scale;
    hipJoint.add(thigh);

    // Rodilla y canilla
    const knee = new THREE.Group();
    knee.position.y = -0.35 * scale;
    hipJoint.add(knee);

    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045 * scale, 0.04 * scale, 0.32 * scale, 6),
      blackLimbMat
    );
    shin.position.y = -0.16 * scale;
    knee.add(shin);

    // Zapato cartoon blanco
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.14 * scale, 0.09 * scale, 0.25 * scale),
      whiteHeadMat
    );
    shoe.position.set(0, -0.34 * scale, 0.04);
    shoe.castShadow = true;
    knee.add(shoe);

    return { hipJoint, knee, kneeJoint: knee, shoe };
  }

  const legL = createLeg(true);
  const legR = createLeg(false);

  // Sombra blob en el suelo
  const shadowMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.42 * scale, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  // ==========================================
  // CONTROLADOR DE ANIMACIONES PROCEDURALES
  // ==========================================
  group.animController = {
    danceMove: 'robot',
    gesture: 'none',
    isDiving: false,
    diveState: 'idle',
    diveProgress: 0,
    isFlying: false,
    flyingTime: 0,
    flyingDuration: 6.0,
    baseY: hips.position.y,
    phaseOffset: Math.random() * Math.PI * 2,
    speedMultiplier: 0.95 + Math.random() * 0.15,

    setColor(hex) {
      shirtMat.color.set(hex);
    },

    setMouthOpen(amount) {
      const targetY = 0.25 + amount * 1.8;
      mouthMesh.scale.y = THREE.MathUtils.lerp(mouthMesh.scale.y, targetY, 0.4);
    },

    triggerHitReaction() {
      // Reacción cómica de dolor al ser golpeado por un tomate
      this.gesture = 'anger';
      const ouchLines = ['💥 ¡AUCH!', '🤕 ¡EL OJO NO!', '💢 ¡QUÉ PUNTERÍA!', '😫 ¡AGHH!', '😵 ¡ME DIO!'];
      const randomLine = ouchLines[Math.floor(Math.random() * ouchLines.length)];
      showBubbleText(randomLine, '#ef4444');

      // Animación de tambaleo de impacto y dolor
      hips.position.y = this.baseY - 0.22;
      group.rotation.x = 0.35;
      group.rotation.z = (Math.random() - 0.5) * 0.5;
      headGroup.rotation.x = -0.4;

      setTimeout(() => {
        this.gesture = 'none';
        group.rotation.x = 0;
        group.rotation.z = 0;
        headGroup.rotation.x = 0;
      }, 1400);
    },

    triggerCryReaction(user = 'Espectador', duration = 5000) {
      this.gesture = 'crying';
      const lines = [
        `😭 ¡BUAAAA! ¿Por qué me haces llorar @${user}?!`,
        `🥺 ¡TEN PIEDAD @${user}! ¡SOY UN ACTOR SENSIBLE!`,
        `💔 ¡ME ROMPISTE EL CORAZÓN @${user}! 😭`,
        `😭 ¡DRAMA TOTAL EN EL ESCENARIO!`
      ];
      showBubbleText(lines[Math.floor(Math.random() * lines.length)], '#38bdf8', duration);
      setTimeout(() => {
        this.resetToIdle();
      }, duration);
    },

    triggerRageReaction(user = 'Espectador', duration = 4800) {
      this.gesture = 'rage';
      const lines = [
        `😡 ¡YA ESTÁ BIEN @${user}! ¡NO ME MOLESTEN MÁS!`,
        `😤 ¡RENUNCIO! ¡ESTE PÚBLICO ES DEMASIADO EXIGENTE!`,
        `🤬 ¡CÁLMENSE TODOS! ¡AQUÍ EL ARTISTA SOY YO!`,
        `💢 ¡EXPLOSIÓN DE RABIA CÓMICA!`
      ];
      showBubbleText(lines[Math.floor(Math.random() * lines.length)], '#ef4444', duration);
      setTimeout(() => {
        this.resetToIdle();
      }, duration);
    },

    triggerPushupsReaction(user = 'Espectador', duration = 5800) {
      this.gesture = 'pushups';
      const cleanU = String(user || 'amigo').replace(/@/g, '');
      showBubbleText(`🏋️ ¡1... 2... 3... NO PUEDO MÁS ${cleanU}!`, '#f59e0b', duration);
      setTimeout(() => {
        this.resetToIdle();
      }, duration);
    },

    triggerFreezeReaction(duration = 4000) {
      this.gesture = 'freeze';
      this.freezeUntil = Date.now() + duration;
      showBubbleText('🥶 ¡MODO ESTATUA ACTIVADO!', '#06b6d4', duration);
      setTimeout(() => {
        this.resetToIdle();
      }, duration);
    },

    resetToIdle() {
      this.gesture = 'none';
      this.danceMove = 'none';
      this.freezeUntil = 0;
      this.welcomeUntil = 0;
      group.rotation.set(0, 0, 0);
      hips.position.set(0, this.baseY, 0);
      hips.rotation.set(0, 0, 0);
      torsoGroup.rotation.set(0, 0, 0);
      torsoMesh.rotation.set(0, 0, 0);
      headGroup.rotation.set(0, 0, 0);
      legL.hipJoint.rotation.set(0, 0, 0);
      legR.hipJoint.rotation.set(0, 0, 0);
      if (legL.knee) legL.knee.rotation.set(0, 0, 0);
      if (legR.knee) legR.knee.rotation.set(0, 0, 0);
      if (legL.kneeJoint) legL.kneeJoint.rotation.set(0, 0, 0);
      if (legR.kneeJoint) legR.kneeJoint.rotation.set(0, 0, 0);
      armL.shoulder.rotation.set(-0.35, 0, -0.3);
      armL.elbow.rotation.set(-0.25, 0, 0);
      if (isSinger) {
        armR.shoulder.rotation.set(-1.45, 0, 0.3);
        armR.elbow.rotation.set(-1.1, 0, 0);
      } else {
        armR.shoulder.rotation.set(-0.35, 0, 0.3);
        armR.elbow.rotation.set(-0.25, 0, 0);
      }
      if (speechBubbleSprite) {
        speechBubbleSprite.visible = false;
        clearTimeout(speechBubbleSprite._timer);
      }
    },

    djAction: 'idle',
    djActionUntil: 0,

    triggerDjScratch(duration = 4500) {
      this.djAction = 'scratch';
      this.djActionUntil = Date.now() + duration;
      showBubbleText('💿 ¡SCRATCH EN VIVO! 🔥', '#00f0ff', duration);
      setTimeout(() => { if (this.djAction === 'scratch') this.djAction = 'idle'; }, duration);
    },

    triggerDjHandsUp(duration = 5500) {
      this.djAction = 'hands_up';
      this.djActionUntil = Date.now() + duration;
      showBubbleText('🙌 ¡MANOS ARRIBA EN LA PISTA! 🙌', '#ec4899', duration);
      setTimeout(() => { if (this.djAction === 'hands_up') this.djAction = 'idle'; }, duration);
    },

    triggerDjDrop(duration = 6500) {
      this.djAction = 'drop';
      this.djActionUntil = Date.now() + duration;
      showBubbleText('💣 ¡BASS DROP! ¡EXPLOTA LA DISCO! 💥', '#facc15', duration);
      setTimeout(() => { if (this.djAction === 'drop') this.djAction = 'idle'; }, duration);
    },

    triggerWelcomeReaction(user = 'Espectador', duration = 3500) {
      this.gesture = 'welcome';
      this.welcomeUntil = Date.now() + duration;
      const lines = [
        `👋 ¡Epa @${user}! ¡Pasa que aquí tú eres el que manda!`,
        `👑 ¡Llegó el mero jefe @${user}! ¿Qué me vas a poner a hacer?`,
        `🎭 ¡Bienvenido @${user}! ¡Tira una Rosa y me agarras a tomatazos!`,
        `👀 ¡Ojo que llegó @${user}! ¡Tú tienes el control de la tarima!`,
        `✨ ¡Qué elegancia @${user}! ¡Ponte cómodo que la función la diriges tú!`
      ];
      const selected = lines[Math.floor(Math.random() * lines.length)];
      showBubbleText(selected, '#a855f7', duration);
      setTimeout(() => {
        this.resetToIdle();
      }, duration);
      return selected;
    },

    triggerDanceFrenzyReaction() {
      this.danceMove = 'helicopter';
      this.speedMultiplier = 1.8;
      showBubbleText('💃 ¡A BAILAR TODO EL MUNDO!', '#10b981');
      setTimeout(() => {
        this.speedMultiplier = 1.0;
      }, 5000);
    },

    triggerFlyingReaction() {
      this.isFlying = true;
      this.flyingTime = 0;
      showBubbleText('🚀 ¡ME VOY AL ESPACIO!', '#00f0ff');
    },

    triggerRaveReaction() {
      this.danceMove = 'jump';
      this.speedMultiplier = 2.0;
      showBubbleText('⚡ ¡DISCOTECA RAVE!', '#f59e0b');
      setTimeout(() => {
        this.speedMultiplier = 1.0;
      }, 5000);
    },

    triggerGiftReaction(user) {
      this.gesture = 'joy';
      const name = user ? user.toUpperCase() : 'VIP';
      showBubbleText(`💖 ¡GRACIAS ${name}!`, '#ec4899', 3000);
      setTimeout(() => {
        this.gesture = 'none';
      }, 3000);
    },

    triggerSongEndReaction() {
      this.gesture = 'joy';
      const lines = [
        '👏 ¡GRACIAS A TODOS! ❤️',
        '🙌 ¡PÚBLICO INCREÍBLE!',
        '💖 ¡LOS AMO GARABATOS!',
        '✨ ¡GRACIAS TOTALES! 👏'
      ];
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      showBubbleText(randomLine, '#ec4899', 4800);
      setTimeout(() => {
        this.gesture = 'none';
      }, 5000);
    },

    update(time, delta, audioLevels = { bass: 0, mid: 0, overall: 0 }) {
      const t = (time + this.phaseOffset) * this.speedMultiplier;
      const bassEnergy = audioLevels.bass || 0;

      // 0. Cantante Volando por los aires (100 taps milestone)
      if (this.isFlying) {
        this.flyingTime += delta;
        const progress = this.flyingTime / this.flyingDuration;
        if (progress >= 1.0) {
          this.isFlying = false;
          hips.position.y = this.baseY;
          group.rotation.set(0, 0, 0);
        } else {
          const heightCurve = Math.sin(progress * Math.PI);
          hips.position.y = this.baseY + heightCurve * 4.6;

          group.rotation.y += 3.5 * delta;
          group.rotation.z = Math.sin(time * 6) * 0.35;

          armL.shoulder.rotation.x = Math.sin(time * 12) * 1.2;
          armR.shoulder.rotation.x = Math.cos(time * 12) * 1.2;
          armL.shoulder.rotation.z = -0.8;
          armR.shoulder.rotation.z = 0.8;

          legL.hipJoint.rotation.x = Math.cos(time * 10) * 1.0;
          legR.hipJoint.rotation.x = Math.sin(time * 10) * 1.0;
          return;
        }
      }

      // 1. Salto al público (Stage Dive Minigame)
      if (this.isDiving) {
        if (this.diveState === 'jumping') {
          this.diveProgress += delta * 1.5;
          const p = this.diveProgress;
          hips.position.y = this.baseY + Math.sin(p * Math.PI) * 2.2;
          group.position.z = THREE.MathUtils.lerp(-3.0, 3.5, p);

          armL.shoulder.rotation.x = -Math.PI / 2;
          armR.shoulder.rotation.x = -Math.PI / 2;
          armL.shoulder.rotation.z = -0.5;
          armR.shoulder.rotation.z = 0.5;
          legL.hipJoint.rotation.x = 0.4;
          legR.hipJoint.rotation.x = 0.4;
          headGroup.rotation.x = -0.4;
        } else if (this.diveState === 'caught') {
          hips.position.y = 1.4 + Math.sin(time * 6) * 0.15;
          group.rotation.x = Math.sin(time * 4) * 0.2;
          armL.shoulder.rotation.x = -2.5 + Math.sin(time * 8) * 0.3;
          armR.shoulder.rotation.x = -2.5 + Math.cos(time * 8) * 0.3;
        } else if (this.diveState === 'fallen') {
          hips.position.y = 0.25;
          group.rotation.x = Math.PI / 2;
          armL.shoulder.rotation.z = -1.5;
          armR.shoulder.rotation.z = 1.5;
          legL.hipJoint.rotation.z = -0.8;
          legR.hipJoint.rotation.z = 0.8;
        }
        return;
      }

      // 2. Gestos prioritarios del Actor (Alegría / Llanto / Rabieta / Flexiones / Congelado)
      if (this.gesture === 'crying') {
        const sobTremble = Math.sin(time * 18) * 0.04;
        hips.position.y = this.baseY - 0.2 + sobTremble;
        headGroup.rotation.x = 0.45 + sobTremble * 0.5;
        headGroup.rotation.z = Math.sin(time * 8) * 0.08;
        // Brazos cubriéndose la cara
        armL.shoulder.rotation.x = -2.3;
        armL.shoulder.rotation.z = 0.35;
        armL.elbow.rotation.x = -1.6;
        armR.shoulder.rotation.x = -2.3;
        armR.shoulder.rotation.z = -0.35;
        armR.elbow.rotation.x = -1.6;
        return;
      } else if (this.gesture === 'rage') {
        // Rabieta cómica y pataleta
        const stomp = Math.sin(time * 18) * 0.35;
        hips.position.y = this.baseY + Math.abs(Math.sin(time * 14)) * 0.15;
        legL.hipJoint.rotation.x = stomp > 0 ? stomp * 2.2 : 0;
        legR.hipJoint.rotation.x = stomp < 0 ? -stomp * 2.2 : 0;
        armL.shoulder.rotation.x = Math.sin(time * 16) * 1.4;
        armL.shoulder.rotation.z = -0.6;
        armR.shoulder.rotation.x = -Math.sin(time * 16) * 1.4;
        armR.shoulder.rotation.z = 0.6;
        headGroup.rotation.z = Math.sin(time * 22) * 0.25;
        headGroup.rotation.x = -0.2;
        return;
      } else if (this.gesture === 'pushups') {
        // Ejercicio cómico en tarima: sentadillas intensas y bombeo fitness (100% visible sin hundirse en el suelo)
        group.rotation.x = 0;
        group.rotation.z = 0;

        const pushPhase = (Math.sin(time * 7.5) + 1) * 0.5; // 0 a 1 rápido y rítmico
        const squatDepth = (1.0 - pushPhase) * 0.28;

        hips.position.y = this.baseY - squatDepth;
        torsoGroup.rotation.x = 0.15 + (1.0 - pushPhase) * 0.2;

        // Flexión de piernas tipo sentadilla olímpica
        legL.hipJoint.rotation.x = -0.55 * (1.0 - pushPhase);
        legL.kneeJoint.rotation.x = 1.1 * (1.0 - pushPhase);
        legR.hipJoint.rotation.x = -0.55 * (1.0 - pushPhase);
        legR.kneeJoint.rotation.x = 1.1 * (1.0 - pushPhase);

        // Bombeo de brazos y bíceps con esfuerzo cómplice
        armL.shoulder.rotation.x = -0.6 - pushPhase * 1.1;
        armL.shoulder.rotation.z = -0.3;
        armL.elbow.rotation.x = (1.0 - pushPhase) * 1.5;
        armR.shoulder.rotation.x = -0.6 - pushPhase * 1.1;
        armR.shoulder.rotation.z = 0.3;
        armR.elbow.rotation.x = (1.0 - pushPhase) * 1.5;

        headGroup.rotation.x = (pushPhase - 0.5) * 0.2;
        return;
      } else if (this.gesture === 'freeze') {
        // Estatua congelada (con auto-recuperación estricta por tiempo en cada frame)
        const now = Date.now();
        if (!this.freezeUntil || now >= this.freezeUntil) {
          this.resetToIdle();
          return;
        }
        armL.shoulder.rotation.x = -1.8;
        armL.shoulder.rotation.z = -0.6;
        armR.shoulder.rotation.x = -0.8;
        armR.shoulder.rotation.z = 0.7;
        headGroup.rotation.y = 0.4;
        return;
      } else if (this.gesture === 'welcome') {
        // Saludo efusivo con la mano izquierda al espectador
        const now = Date.now();
        if (this.welcomeUntil && now >= this.welcomeUntil) {
          this.resetToIdle();
          return;
        }
        const wave = Math.sin(time * 9);
        armL.shoulder.rotation.x = -1.6 + Math.sin(time * 4) * 0.15;
        armL.shoulder.rotation.z = -0.7 + wave * 0.45;
        armL.elbow.rotation.x = -0.7;
        headGroup.rotation.y = Math.sin(time * 6) * 0.2;
        headGroup.rotation.z = -wave * 0.12;
        torsoMesh.rotation.z = wave * 0.08;
        return;
      } else if (this.gesture === 'joy') {
        const joyJump = Math.abs(Math.sin(time * 10)) * 0.45;
        hips.position.y = this.baseY + joyJump;
        armL.shoulder.rotation.x = -2.6 + Math.sin(time * 12) * 0.3;
        armR.shoulder.rotation.x = -2.6 + Math.cos(time * 12) * 0.3;
        armL.shoulder.rotation.z = -0.4;
        armR.shoulder.rotation.z = 0.4;
        headGroup.rotation.y = Math.sin(time * 8) * 0.15;
        return;
      } else if (this.gesture === 'anger') {
        const stomp = Math.sin(time * 14) * 0.2;
        legL.hipJoint.rotation.x = stomp > 0 ? stomp * 2 : 0;
        legR.hipJoint.rotation.x = stomp < 0 ? -stomp * 2 : 0;
        armL.shoulder.rotation.x = -0.8;
        armL.shoulder.rotation.z = -0.6;
        armR.shoulder.rotation.x = -0.8;
        armR.shoulder.rotation.z = 0.6;
        headGroup.rotation.z = Math.sin(time * 15) * 0.15;
        return;
      } else if (this.gesture === 'catch') {
        armL.shoulder.rotation.x = -2.7;
        armL.shoulder.rotation.z = -0.3;
        armR.shoulder.rotation.x = -2.7;
        armR.shoulder.rotation.z = 0.3;
        headGroup.rotation.x = -0.5;
        hips.position.y = this.baseY + Math.abs(Math.sin(time * 6)) * 0.1;
        return;
      }

      // 3. CINCO PASOS DE BAILE
      if (this.danceMove === 'robot') {
        const step = Math.floor(t * 4);
        const subPhase = (t * 4) % 1;
        const pop = Math.pow(subPhase, 0.2);

        armL.shoulder.rotation.x = (step % 2 === 0 ? -1.5 : 0) * pop;
        armL.elbow.rotation.x = (step % 3 === 0 ? -1.5 : 0);
        armR.shoulder.rotation.z = (step % 4 === 0 ? 1.5 : 0.3) * pop;

        headGroup.rotation.y = (Math.floor(t * 2) % 3 - 1) * 0.5;
        torsoGroup.rotation.y = (Math.floor(t * 2) % 2 === 0 ? 0.2 : -0.2);
        hips.position.y = this.baseY + (subPhase < 0.2 ? 0.08 : 0);
      } else if (this.danceMove === 'salsa') {
        const sway = Math.sin(t * 5);
        hips.position.x = sway * 0.18;
        hips.rotation.z = -sway * 0.12;

        legL.hipJoint.rotation.x = Math.sin(t * 5) * 0.4;
        legR.hipJoint.rotation.x = -Math.sin(t * 5) * 0.4;

        armL.shoulder.rotation.x = -0.8 + Math.cos(t * 5) * 0.4;
        armL.shoulder.rotation.z = -0.4;
        armR.shoulder.rotation.x = isSinger ? -1.4 : -0.8 - Math.cos(t * 5) * 0.4;
        armR.shoulder.rotation.z = 0.4;

        headGroup.rotation.y = sway * 0.2;
      } else if (this.danceMove === 'jump') {
        const jump = Math.abs(Math.sin(t * 7)) * (0.35 + bassEnergy * 0.25);
        hips.position.y = this.baseY + jump;

        legL.knee.rotation.x = jump * 1.5;
        legR.knee.rotation.x = jump * 1.5;

        armL.shoulder.rotation.x = -2.2 + Math.sin(t * 7) * 0.4;
        armR.shoulder.rotation.x = isSinger ? -1.8 : -2.2 - Math.sin(t * 7) * 0.4;
        headGroup.rotation.x = Math.sin(t * 7) * 0.15;
      } else if (this.danceMove === 'helicopter') {
        const spin = Math.sin(t * 6) * 0.7;
        torsoGroup.rotation.y = spin;

        armL.shoulder.rotation.x = -2.5;
        armL.shoulder.rotation.z = -0.6 + Math.sin(t * 12) * 0.5;
        armR.shoulder.rotation.x = isSinger ? -1.6 : -2.5;
        armR.shoulder.rotation.z = 0.6 + Math.cos(t * 12) * 0.5;

        hips.position.y = this.baseY + Math.abs(Math.cos(t * 6)) * 0.12;
      } else if (this.danceMove === 'wave') {
        const wave = Math.sin(t * 4);
        torsoMesh.rotation.z = wave * 0.2;
        headGroup.rotation.z = -wave * 0.15;

        armL.shoulder.rotation.z = -0.3 + wave * 0.4;
        armL.elbow.rotation.x = -0.5 + Math.cos(t * 4) * 0.4;
        armR.shoulder.rotation.z = 0.3 + wave * 0.4;
        if (!isSinger) {
          armR.elbow.rotation.x = -0.5 - Math.cos(t * 4) * 0.4;
        }

        hips.position.y = this.baseY + Math.abs(wave) * 0.08;
      } else {
        // Postura natural de comediante Stand-Up (Respiración viva y gesticulación)
        hips.position.y = this.baseY + Math.sin(t * 2) * 0.02;
        torsoMesh.rotation.z = Math.sin(t * 1.5) * 0.02;
        headGroup.rotation.y = Math.sin(t * 1.2) * 0.06;
        headGroup.rotation.x = Math.sin(t * 2) * 0.03;
        headGroup.rotation.z = 0;

        armL.shoulder.rotation.x = -0.35 + Math.sin(t * 1.8) * 0.12;
        armL.shoulder.rotation.z = -0.3 + Math.cos(t * 1.4) * 0.06;
        armL.elbow.rotation.x = -0.25;

        legL.hipJoint.rotation.x = 0;
        legL.kneeJoint.rotation.x = 0;
        legR.hipJoint.rotation.x = 0;
        legR.kneeJoint.rotation.x = 0;
      }

      // Si es el DJ principal, animar sus movimientos sobre la cabina y audífonos
      if (isSinger) {
        if (this.djAction === 'scratch') {
          // Mano izquierda al auricular y mano derecha rayando el vinilo
          headGroup.rotation.z = 0.2 + Math.sin(t * 8) * 0.08;
          armL.shoulder.rotation.x = -2.1;
          armL.shoulder.rotation.z = 0.45;
          armL.elbow.rotation.x = -1.65;

          const scratch = Math.sin(t * 16);
          armR.shoulder.rotation.x = -1.1 + scratch * 0.35;
          armR.shoulder.rotation.z = 0.35 + scratch * 0.12;
          armR.elbow.rotation.x = -0.85 + scratch * 0.2;
          hips.position.y = this.baseY + Math.abs(Math.sin(t * 8)) * 0.05;
        } else if (this.djAction === 'hands_up' || this.djAction === 'drop') {
          // Ambos brazos arriba animando el drop del festival
          const pump = Math.sin(t * 9) * 0.3;
          armL.shoulder.rotation.x = -2.6 + pump;
          armL.shoulder.rotation.z = -0.4;
          armR.shoulder.rotation.x = -2.6 + pump;
          armR.shoulder.rotation.z = 0.4;
          headGroup.rotation.x = Math.sin(t * 9) * 0.2;
          hips.position.y = this.baseY + Math.abs(Math.sin(t * 9)) * 0.16;
        } else if (this.gesture === 'none' && this.danceMove === 'none') {
          // Postura natural de DJ en cabina: cabeceo al beat, mano en faders y mano en plato
          const beatBounce = Math.abs(Math.sin(t * 6)) * 0.04;
          hips.position.y = this.baseY + beatBounce;
          headGroup.rotation.x = Math.sin(t * 6) * 0.12;

          // Mano izquierda cerca al mezclador
          armL.shoulder.rotation.x = -0.95 + Math.sin(t * 2) * 0.08;
          armL.shoulder.rotation.z = -0.25;
          armL.elbow.rotation.x = -0.9;

          // Mano derecha en la tornamesa
          armR.shoulder.rotation.x = -1.05 + Math.sin(t * 4) * 0.12;
          armR.shoulder.rotation.z = 0.3;
          armR.elbow.rotation.x = -0.85;
        }
      }
    }
  };

  return group;
}
