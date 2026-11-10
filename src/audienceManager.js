import * as THREE from 'three';
import { createStickman } from './garabatoCharacter.js';

/**
 * Gestor del Público de Garabatos en 3D — Formato Anfiteatro / Arena Circular
 * Cada espectador de TikTok aparece como un personaje 3D en círculos concéntricos.
 * Cuando escriben en el chat, aparece un globo cómic de diálogo sobre su cabeza (Speech Bubble).
 * Soporta comandos de personalización: "chica", "chico", bailes y roles VIP por regalo.
 */
export class AudienceManager {
  constructor(scene) {
    this.scene = scene;
    this.crowd = [];
    this.currentProfile = 'NORMAL';
    this.collectiveEnergy = 50;
    this.isMusicPlaying = false;

    // Colores vibrantes cartoon estilo streaming
    this.palette = [
      0x00f0ff, 0xec4899, 0xfacc15, 0x22c55e, 0x8b5cf6,
      0xf97316, 0x38bdf8, 0x4ade80, 0xa855f7, 0xfb7185
    ];

    this.danceMoves = ['robot', 'salsa', 'jump', 'helicopter', 'wave'];

    // Grupo para auras y focos VIP
    this.highlightGroup = new THREE.Group();
    this.scene.add(this.highlightGroup);

    this.setProfile('NORMAL');
  }

  /**
   * Calcula la posición y rotación de cada espectador en círculos concéntricos
   * mirando hacia la tarima central (0, 0, -2.2) donde se encuentra el comediante.
   * Todos apoyados con los pies firmes sobre el piso en Y = 0.00 (sin hundirse).
   */
  calculateSlotPosition(index) {
    const stageCenterZ = -2.2;
    const rings = [
      { count: 12, radius: 3.5, yOffset: 0.0 },
      { count: 18, radius: 4.8, yOffset: 0.0 },
      { count: 24, radius: 6.2, yOffset: 0.0 },
      { count: 32, radius: 7.8, yOffset: 0.0 },
      { count: 40, radius: 9.6, yOffset: 0.0 }
    ];

    let currentIdx = index;
    let ringIdx = 0;
    while (ringIdx < rings.length - 1 && currentIdx >= rings[ringIdx].count) {
      currentIdx -= rings[ringIdx].count;
      ringIdx++;
    }

    const ring = rings[ringIdx];
    const totalInRing = ring.count;
    // Escalonado angular para máxima visibilidad entre filas
    const stagger = (ringIdx % 2 === 1) ? (Math.PI / totalInRing) : 0;
    let angle = (currentIdx / totalInRing) * Math.PI * 2 + stagger;

    let posX = Math.sin(angle) * ring.radius;
    let posZ = stageCenterZ + Math.cos(angle) * ring.radius;

    // Pasillo despejado para la cámara frontal principal
    if (posZ > 0 && Math.abs(posX) < 0.6) {
      angle += (posX >= 0 ? 0.16 : -0.16);
      posX = Math.sin(angle) * ring.radius;
      posZ = stageCenterZ + Math.cos(angle) * ring.radius;
    }

    // Altura del suelo nivelada para que ningún personaje salga cortado por la mitad
    const posY = 0.0;
    // Mirando exactamente hacia el comediante en el centro de la tarima
    const rotY = Math.atan2(-posX, stageCenterZ - posZ);

    return { posX, posY, posZ, rotY };
  }

  setProfile(profile) {
    this.currentProfile = profile;
    let targetCount = 30;
    if (profile === 'LIGERO') targetCount = 15;
    if (profile === 'FIESTA') targetCount = 50;

    while (this.crowd.length > targetCount) {
      const removed = this.crowd.pop();
      this.scene.remove(removed.mesh);
    }

    while (this.crowd.length < targetCount) {
      this.spawnSpectator();
    }
  }

  spawnSpectator(customName = null) {
    const slot = this.calculateSlotPosition(this.crowd.length);
    const color = this.palette[this.crowd.length % this.palette.length];
    const stickman = createStickman(false, color);

    stickman.position.set(slot.posX, slot.posY, slot.posZ);
    stickman.rotation.y = slot.rotY;

    // Baile aleatorio inicial
    stickman.animController.danceMove = this.danceMoves[Math.floor(Math.random() * this.danceMoves.length)];

    // Etiqueta flotante de nombre de TikTok
    const defaultNames = ['David', 'Andrea', 'Sofi', 'Chema', 'Gerson', 'Cleo', 'Nia', 'Zane', 'Finn', 'Mía', 'Alex', 'Sam'];
    const name = customName || defaultNames[this.crowd.length % defaultNames.length];
    const nameLabel = this.createNameSprite(name);
    nameLabel.position.set(0, 0.72, 0);
    stickman.add(nameLabel);

    this.scene.add(stickman);

    const spectator = {
      mesh: stickman,
      name,
      nameLabel,
      homePos: new THREE.Vector3(slot.posX, slot.posY, slot.posZ),
      homeRotY: slot.rotY,
      isRegisteredInMinigame: false,
      speechBubble: null,
      bubbleTimer: null,
      skirtMesh: null,
      ribbonMesh: null,
      instrumentMesh: null,
      veilMesh: null,
      hatMesh: null,
      crownMesh: null
    };

    this.crowd.push(spectator);
    this.updateViewerCountDOM();
    return spectator;
  }

  createNameSprite(text, isHighlighted = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isHighlighted ? 'rgba(234, 179, 8, 0.95)' : 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(4, 4, 212, 52, 14);
    ctx.fill();

    ctx.strokeStyle = isHighlighted ? '#ffffff' : '#00f0ff';
    ctx.lineWidth = isHighlighted ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = isHighlighted ? '#000000' : '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 110, 30);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.52, 0.14, 1);
    return sprite;
  }

  /**
  /**
   * Crea una viñeta cómica de diálogo (Chat Bubble) 3D sobre la cabeza del espectador
   * con soporte multilínea, cola de bocadillo y borde neón brillante.
   */
  createChatBubbleSprite(text, isVip = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Fondo de la viñeta con colita apuntando al espectador
    const bubbleW = 372;
    const bubbleH = 126;
    const radius = 18;

    ctx.fillStyle = isVip ? 'rgba(30, 20, 50, 0.95)' : 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = isVip ? '#facc15' : '#00f0ff';
    ctx.lineWidth = 4;

    // Cuerpo redondeado de la burbuja
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(6, 6, bubbleW, bubbleH, radius);
    } else {
      ctx.rect(6, 6, bubbleW, bubbleH);
    }
    ctx.fill();
    ctx.stroke();

    // Triangulito de la cola del bocadillo apuntando hacia la cabeza del muñeco
    ctx.beginPath();
    ctx.moveTo(172, bubbleH + 6);
    ctx.lineTo(192, 156);
    ctx.lineTo(212, bubbleH + 6);
    ctx.fillStyle = isVip ? 'rgba(30, 20, 50, 0.95)' : 'rgba(15, 23, 42, 0.94)';
    ctx.fill();
    ctx.stroke();

    // Texto del mensaje con ajuste de líneas
    ctx.fillStyle = isVip ? '#fef08a' : '#ffffff';
    let fontSize = 24;
    const clean = String(text || '').trim();
    if (clean.length > 50) fontSize = 17;
    else if (clean.length > 30) fontSize = 20;

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Algoritmo de partición en líneas
    const words = clean.split(' ');
    const lines = [];
    let currentLine = '';
    const maxLineW = bubbleW - 40;

    for (let w of words) {
      const test = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(test).width <= maxLineW) {
        currentLine = test;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
        if (lines.length >= 2) break;
      }
    }
    if (currentLine && lines.length < 3) lines.push(currentLine);

    const lineH = fontSize * 1.35;
    const startY = 16 + (bubbleH - lines.length * lineH) / 2 + lineH / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 192, startY + i * lineH);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.25, 0.52, 1);
    return sprite;
  }

  /**
   * Muestra el mensaje del chat del espectador directamente flotando ARRIBA DE SU CABEZA
   */
  sayChatMessage(name, text, isVip = false) {
    if (!name || !text) return;
    const cleanUser = String(name).replace(/^@+/, '').trim();
    const cleanText = String(text).trim();

    // 1. Si el espectador no existe en la pista, crearlo de inmediato
    let spec = this.crowd.find(s => s.name.toLowerCase() === cleanUser.toLowerCase());
    if (!spec) {
      spec = this.spawnSpectator(cleanUser);
    }

    // 2. Si ya tenía una viñeta activa, removerla limpiamente
    if (spec.chatBubble) {
      spec.mesh.remove(spec.chatBubble);
      clearTimeout(spec.chatBubbleTimer);
      spec.chatBubble = null;
    }

    // 3. Crear nueva viñeta de diálogo 3D sobre su cabeza
    const bubbleSprite = this.createChatBubbleSprite(cleanText, isVip);
    bubbleSprite.position.set(0, 1.05, 0);
    spec.mesh.add(bubbleSprite);
    spec.chatBubble = bubbleSprite;

    // 4. Animar al muñeco mientras habla (saltito o baile)
    spec.mesh.animController.gesture = 'joy';
    spec.mesh.animController.speedMultiplier = 1.8;
    this.increaseEnergy(6);

    // 5. Destacar con anillo de luz
    this.highlightSpectator(cleanUser, 3000);

    // 6. Temporizador para ocultar la burbuja suavemente a los 6.5 segundos
    spec.chatBubbleTimer = setTimeout(() => {
      if (spec.chatBubble === bubbleSprite) {
        spec.mesh.remove(bubbleSprite);
        spec.chatBubble = null;
        spec.mesh.animController.gesture = 'none';
        spec.mesh.animController.speedMultiplier = 1.0;
      }
    }, 6500);

    return spec;
  }

  /**
   * Genera el Globo Cómic de Diálogo 3D (Speech Bubble)
   */
  createSpeechBubbleSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    const x = 12, y = 10, w = 356, h = 95, r = 18;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    // Flecha / Colita apuntando a la cabeza del personaje
    ctx.lineTo(x + w / 2 + 18, y + h);
    ctx.lineTo(x + w / 2, y + h + 24);
    ctx.lineTo(x + w / 2 - 18, y + h);

    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Texto del mensaje
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 23px "Arial Black", "Impact", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = String(text || '').trim().split(/\s+/);
    const lines = [];
    let curLine = '';
    const maxLineW = 310;

    for (const word of words) {
      const test = curLine ? (curLine + ' ' + word) : word;
      if (ctx.measureText(test).width <= maxLineW) {
        curLine = test;
      } else {
        if (curLine) lines.push(curLine);
        curLine = word;
      }
    }
    if (curLine) lines.push(curLine);

    const displayLines = lines.slice(0, 2);
    if (lines.length > 2) displayLines[1] += '...';

    const lineH = 28;
    const startY = y + h / 2 - ((displayLines.length - 1) * lineH) / 2;
    displayLines.forEach((l, i) => {
      ctx.fillText(l, x + w / 2, startY + i * lineH);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.15, 0.42, 1);
    return sprite;
  }

  showSpeechBubble(spectator, text) {
    if (!spectator || !spectator.mesh) return;

    if (spectator.speechBubble) {
      spectator.mesh.remove(spectator.speechBubble);
      if (spectator.speechBubble.material.map) spectator.speechBubble.material.map.dispose();
      spectator.speechBubble.material.dispose();
      spectator.speechBubble = null;
    }
    if (spectator.bubbleTimer) {
      clearTimeout(spectator.bubbleTimer);
    }

    const bubble = this.createSpeechBubbleSprite(text);
    // Posición flotante sobre el nombre
    bubble.position.set(0, 1.25, 0);
    spectator.mesh.add(bubble);
    spectator.speechBubble = bubble;

    // Animación de hablar / salto
    spectator.mesh.animController.gesture = 'joy';
    spectator.mesh.animController.speedMultiplier = 1.8;

    spectator.bubbleTimer = setTimeout(() => {
      if (spectator.speechBubble) {
        spectator.mesh.remove(spectator.speechBubble);
        if (spectator.speechBubble.material.map) spectator.speechBubble.material.map.dispose();
        spectator.speechBubble.material.dispose();
        spectator.speechBubble = null;
      }
      spectator.mesh.animController.gesture = 'none';
      spectator.mesh.animController.speedMultiplier = 1.0;
    }, 5500);
  }

  /**
   * Cambia la ropa del personaje al escribir "chica" o "chico" en el chat
   */
  changeStyle(name, style) {
    const spec = this.findSpectator(name);
    if (!spec || !spec.mesh) return;

    const lowerStyle = (style || '').toLowerCase();
    const hips = spec.mesh.children.find(c => c.name === 'hips' || c.position.y > 0) || spec.mesh;

    if (lowerStyle.includes('chica') || lowerStyle.includes('mujer') || lowerStyle.includes('vestido')) {
      if (!spec.skirtMesh) {
        const skirtGeo = new THREE.CylinderGeometry(0.08, 0.16, 0.18, 12, 1, true);
        const skirtMat = new THREE.MeshLambertMaterial({ color: 0xec4899, side: THREE.DoubleSide });
        const skirt = new THREE.Mesh(skirtGeo, skirtMat);
        skirt.position.y = -0.06;
        hips.add(skirt);
        spec.skirtMesh = skirt;

        const ribbonGeo = new THREE.BoxGeometry(0.12, 0.05, 0.04);
        const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.position.set(0, 0.42, 0);
        spec.mesh.add(ribbon);
        spec.ribbonMesh = ribbon;
      }
      this.showSpeechBubble(spec, '👗 ¡Ahora soy chica!');
    } else if (lowerStyle.includes('chico') || lowerStyle.includes('hombre')) {
      if (spec.skirtMesh) {
        hips.remove(spec.skirtMesh);
        spec.skirtMesh.geometry.dispose();
        spec.skirtMesh = null;
      }
      if (spec.ribbonMesh) {
        spec.mesh.remove(spec.ribbonMesh);
        spec.ribbonMesh.geometry.dispose();
        spec.ribbonMesh = null;
      }
      this.showSpeechBubble(spec, '👕 ¡Ahora soy chico!');
    }
  }

  /**
   * Promueve al espectador a un Rol VIP según el regalo de TikTok recibido
   * (Músico / Acordeonista, Novia, Novio, Rey de la Sala)
   */
  promoteToVIP(name, role = 'musico') {
    let spec = this.crowd.find(s => s.name.toLowerCase() === (name || '').toLowerCase());
    if (!spec) {
      spec = this.spawnSpectator(name);
    }
    if (!spec || !spec.mesh) return;

    const lowerRole = role.toLowerCase();

    // 1. Músico del Club (Acordeonista) por Rosa
    if (lowerRole.includes('musico') || lowerRole.includes('acordeon')) {
      spec.mesh.position.set(-1.8, 0.05, 1.2);
      spec.mesh.rotation.y = Math.PI * 0.15;

      if (!spec.instrumentMesh) {
        const instGeo = new THREE.BoxGeometry(0.24, 0.18, 0.14);
        const instMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
        const inst = new THREE.Mesh(instGeo, instMat);
        inst.position.set(0, 0.28, 0.12);
        spec.mesh.add(inst);
        spec.instrumentMesh = inst;
      }

      spec.mesh.remove(spec.nameLabel);
      spec.nameLabel = this.createNameSprite(`🪗 ${spec.name} (Músico)`, true);
      spec.nameLabel.position.set(0, 0.76, 0);
      spec.mesh.add(spec.nameLabel);

      this.highlightSpectator(spec.name, 8000);
      this.showSpeechBubble(spec, '🪗 ¡Llegó la música al show!');
    }
    // 2. Novia VIP
    else if (lowerRole.includes('novia')) {
      spec.mesh.position.set(1.8, 0.05, 1.2);
      spec.mesh.rotation.y = -Math.PI * 0.15;

      if (!spec.veilMesh) {
        const veilGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.35, 10, 1, true);
        const veilMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
        const veil = new THREE.Mesh(veilGeo, veilMat);
        veil.position.set(0, 0.40, -0.05);
        spec.mesh.add(veil);
        spec.veilMesh = veil;
      }

      spec.mesh.remove(spec.nameLabel);
      spec.nameLabel = this.createNameSprite(`👰 ${spec.name} (Novia VIP)`, true);
      spec.nameLabel.position.set(0, 0.76, 0);
      spec.mesh.add(spec.nameLabel);

      this.highlightSpectator(spec.name, 9000);
      this.showSpeechBubble(spec, '👰 ¡Soy la Novia del Club!');
    }
    // 3. Novio VIP
    else if (lowerRole.includes('novio')) {
      spec.mesh.position.set(1.8, 0.05, 1.2);
      spec.mesh.rotation.y = -Math.PI * 0.15;

      if (!spec.hatMesh) {
        const hatGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12);
        const hatMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.set(0, 0.46, 0);
        spec.mesh.add(hat);
        spec.hatMesh = hat;
      }

      spec.mesh.remove(spec.nameLabel);
      spec.nameLabel = this.createNameSprite(`🤵 ${spec.name} (Novio VIP)`, true);
      spec.nameLabel.position.set(0, 0.76, 0);
      spec.mesh.add(spec.nameLabel);

      this.highlightSpectator(spec.name, 9000);
      this.showSpeechBubble(spec, '🤵 ¡Soy el Novio de la Fiesta!');
    }
    // 4. Rey de la Noche
    else {
      if (!spec.crownMesh) {
        const crownGeo = new THREE.CylinderGeometry(0.14, 0.11, 0.10, 6);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(0, 0.48, 0);
        spec.mesh.add(crown);
        spec.crownMesh = crown;
      }

      spec.mesh.remove(spec.nameLabel);
      spec.nameLabel = this.createNameSprite(`👑 ${spec.name} (Rey VIP)`, true);
      spec.nameLabel.position.set(0, 0.76, 0);
      spec.mesh.add(spec.nameLabel);

      this.highlightSpectator(spec.name, 12000);
      this.showSpeechBubble(spec, '👑 ¡El Rey de la Noche!');
    }

    this.increaseEnergy(25);
  }

  /**
   * Procesa cualquier mensaje del chat de TikTok
   * y muestra el globo de diálogo en tiempo real.
   */
  speak(name, comment) {
    if (!name || !comment) return;
    const cleanUser = name.replace(/^@+/, '').trim();
    const cleanText = comment.trim();

    let spec = this.crowd.find(s => s.name.toLowerCase() === cleanUser.toLowerCase());
    if (!spec) {
      spec = this.spawnSpectator(cleanUser);
    }

    const lower = cleanText.toLowerCase();

    if (lower.includes('chica') || lower.includes('mujer') || lower.includes('vestido')) {
      this.changeStyle(cleanUser, 'chica');
      return;
    }
    if (lower.includes('chico') || lower.includes('hombre')) {
      this.changeStyle(cleanUser, 'chico');
      return;
    }

    if (lower.includes('perreo') || lower.includes('baile') || lower.includes('salsa') || lower.includes('robot')) {
      spec.mesh.animController.danceMove = lower.includes('robot') ? 'robot' : 'salsa';
      spec.mesh.animController.speedMultiplier = 2.4;
      this.showSpeechBubble(spec, `💃 ¡A bailar! ${cleanText}`);
      return;
    }

    if (lower.includes('entrar') || lower.includes('yo') || lower.includes('llegue')) {
      this.highlightSpectator(cleanUser, 5000);
      this.showSpeechBubble(spec, `👋 ¡Presente en el Club!`);
      return;
    }

    this.showSpeechBubble(spec, cleanText);
    this.increaseEnergy(4);
  }

  highlightSpectator(name, durationMs = 4500) {
    const spec = this.findSpectator(name);
    if (!spec) return null;

    const ringGeo = new THREE.RingGeometry(0.35, 0.55, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(spec.mesh.position.x, 0.05, spec.mesh.position.z);
    this.highlightGroup.add(ring);

    spec.mesh.remove(spec.nameLabel);
    spec.nameLabel = this.createNameSprite(`👑 ${spec.name}`, true);
    spec.nameLabel.position.set(0, 0.76, 0);
    spec.mesh.add(spec.nameLabel);

    spec.mesh.animController.speedMultiplier = 2.6;
    spec.mesh.animController.danceMove = 'jump';
    spec.mesh.animController.gesture = 'joy';

    setTimeout(() => {
      this.highlightGroup.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();

      spec.mesh.remove(spec.nameLabel);
      spec.nameLabel = this.createNameSprite(spec.name, false);
      spec.nameLabel.position.set(0, 0.72, 0);
      spec.mesh.add(spec.nameLabel);

      spec.mesh.animController.speedMultiplier = 1.0;
      spec.mesh.animController.gesture = 'none';
      spec.mesh.animController.danceMove = this.danceMoves[Math.floor(Math.random() * this.danceMoves.length)];
    }, durationMs);

    return spec;
  }

  getSpectatorPosition(name) {
    const spec = this.findSpectator(name);
    if (spec && spec.mesh) {
      return spec.mesh.position.clone().add(new THREE.Vector3(0, 0.6, 0));
    }
    return new THREE.Vector3(0, 0.6, 4.0);
  }

  addViewer(name) {
    let spec = this.crowd.find(s => s.name.toLowerCase() === (name || '').toLowerCase());
    if (!spec) {
      spec = this.spawnSpectator(name);
    }
    this.highlightSpectator(name, 3500);
    this.increaseEnergy(5);
    return spec;
  }

  triggerBaila(name) {
    const target = this.findSpectator(name);
    if (target) {
      target.mesh.animController.danceMove = this.danceMoves[Math.floor(Math.random() * this.danceMoves.length)];
    }
    this.increaseEnergy(2);
  }

  triggerSalta(name) {
    const target = this.findSpectator(name);
    if (target) {
      target.mesh.animController.gesture = 'joy';
      setTimeout(() => {
        target.mesh.animController.gesture = 'none';
      }, 2500);
    }
    this.increaseEnergy(3);
  }

  triggerFrenzy(duration = 6.0) {
    this.increaseEnergy(40);
    for (const spec of this.crowd) {
      spec.mesh.animController.speedMultiplier = 2.4;
      spec.mesh.animController.danceMove = 'jump';
      spec.mesh.animController.gesture = 'joy';
    }

    setTimeout(() => {
      for (const spec of this.crowd) {
        spec.mesh.animController.speedMultiplier = 0.9 + Math.random() * 0.2;
        spec.mesh.animController.gesture = 'none';
        spec.mesh.animController.danceMove = this.danceMoves[Math.floor(Math.random() * this.danceMoves.length)];
      }
    }, duration * 1000);
  }

  registerForCatch(name) {
    const target = this.findSpectator(name) || this.crowd[Math.floor(Math.random() * this.crowd.length)];
    if (target) {
      target.isRegisteredInMinigame = true;
      target.mesh.animController.gesture = 'catch';
      return target;
    }
    return null;
  }

  prepareCatchCrowd() {
    let count = 0;
    for (let spec of this.crowd) {
      if (spec.isRegisteredInMinigame || Math.random() < 0.4) {
        spec.mesh.animController.gesture = 'catch';
        count++;
      }
    }
    return count;
  }

  resetCrowdAfterMinigame() {
    for (let spec of this.crowd) {
      spec.isRegisteredInMinigame = false;
      spec.mesh.animController.gesture = 'none';
      spec.mesh.position.copy(spec.homePos);
    }
  }

  findSpectator(name) {
    if (!name) return this.crowd[Math.floor(Math.random() * this.crowd.length)];
    return this.crowd.find(s => s.name.toLowerCase() === name.toLowerCase()) || this.crowd[0];
  }

  increaseEnergy(amount) {
    this.collectiveEnergy = Math.min(100, this.collectiveEnergy + amount);
  }

  updateViewerCountDOM() {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('crowd-count-badge') || document.getElementById('queue-counts-badge');
    if (badge) {
      badge.textContent = `👥 ${this.crowd.length}`;
      badge.classList.remove('hidden');
    }
  }

  update(time, delta, audioLevels = { bass: 0, mid: 0, overall: 0 }) {
    this.collectiveEnergy = Math.max(10, this.collectiveEnergy - delta * 1.5);

    for (let i = 0; i < this.crowd.length; i++) {
      const s = this.crowd[i];
      s.mesh.animController.update(time, delta, audioLevels);
    }

    if (this.highlightGroup.children.length > 0) {
      this.highlightGroup.children.forEach(ring => {
        ring.rotation.z += delta * 2;
      });
    }
  }
}
