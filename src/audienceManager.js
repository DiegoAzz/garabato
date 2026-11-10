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

    // Variedad de pasos de baile festivos (Salsa, Cumbia, Perreo, Festival Jump, Conga Train)
    this.danceMoves = ['salsa', 'cumbia', 'perreo', 'jump', 'conga', 'wave', 'helicopter'];

    // Grupo para auras y focos VIP
    this.highlightGroup = new THREE.Group();
    this.scene.add(this.highlightGroup);

    this.setProfile('NORMAL');
  }

  /**
   * Calcula la posición y rotación de cada espectador en una discoteca real multi-zona
   * con capacidad perfecta para hasta 200+ espectadores sin colisiones ni desfases.
   * 
   * ZONA 1 (0 a 119): Pista de baile central LED en filas escalonadas frente al DJ.
   * ZONA 2 (120 a 159): Zona VIP Lounge de mesas de cóctel iluminadas (ala derecha).
   * ZONA 3 (160 a 199): Barra de bar del club y taburetes altos (ala izquierda).
   * ZONA 4 (200+): Alas laterales y balcones del club.
   */
  calculateSlotPosition(index) {
    const djStageZ = -3.5;
    let posX = 0;
    let posY = 0.0;
    let posZ = 0;
    let rotY = 0;

    // ==========================================
    // ZONA 1: PISTA DE BAILE CENTRAL LED (Hasta 120 personas)
    // Distribución armónica: llena la pista uniformemente desde el centro hacia afuera
    // ==========================================
    if (index < 120) {
      const rows = [
        { z: -1.7, width: 5.6 },
        { z: -0.9, width: 6.0 },
        { z: -0.1, width: 6.4 },
        { z:  0.7, width: 6.8 },
        { z:  1.5, width: 7.0 },
        { z:  2.3, width: 7.2 },
        { z:  3.1, width: 7.4 }
      ];

      const numRows = rows.length;
      const rIdx = index % numRows;
      const colIdx = Math.floor(index / numRows);
      const row = rows[rIdx];

      // Expansión radial simétrica desde el centro: 0, +step, -step, +2*step, -2*step...
      const step = 0.68;
      const sign = (colIdx % 2 === 1) ? 1 : -1;
      const dist = Math.ceil(colIdx / 2);
      const stagger = (rIdx % 2 === 1) ? 0.32 : 0;

      let calcX = (colIdx === 0) ? 0 : (sign * dist * step) + (sign * stagger);
      const maxHalfW = row.width / 2;
      if (Math.abs(calcX) > maxHalfW) {
        calcX = (calcX > 0 ? 1 : -1) * (maxHalfW - (index % 5) * 0.2);
      }

      posX = calcX;
      posZ = row.z;

      // Pasillo central frontal sutil para la cámara
      if (Math.abs(posX) < 0.25 && posZ > 0.8) {
        posX += (colIdx % 2 === 0 ? 0.35 : -0.35);
      }

      // Mirando hacia la cabina del DJ en tarima
      rotY = Math.atan2(-posX, djStageZ - posZ);
    }
    // ==========================================
    // ZONA 2: VIP LOUNGE & MESAS DE CÓCTEL (40 personas: idx 120 a 159)
    // ==========================================
    else if (index < 160) {
      const vipIdx = index - 120;
      const tableIdx = Math.floor(vipIdx / 8); // 5 mesas (8 personas por mesa)
      const slotAroundTable = vipIdx % 8;
      const tableCoords = [
        { x: 5.2, z: -2.8 },
        { x: 5.5, z: -1.2 },
        { x: 5.3, z:  0.6 },
        { x: 5.5, z:  2.4 },
        { x: 5.3, z:  4.0 }
      ];
      const table = tableCoords[tableIdx % tableCoords.length];
      const tableRadius = 0.95;
      const angle = (slotAroundTable / 8) * Math.PI * 2;

      posX = table.x + Math.sin(angle) * tableRadius;
      posZ = table.z + Math.cos(angle) * tableRadius;
      // Mirando hacia el centro del club o la mesa
      rotY = Math.atan2(-posX, 0 - posZ);
    }
    // ==========================================
    // ZONA 3: BARRA DE BAR DEL CLUB (40 personas: idx 160 a 199)
    // ==========================================
    else if (index < 200) {
      const barIdx = index - 160;
      const isSeated = barIdx < 16;
      if (isSeated) {
        // En taburetes o de pie junto a la barra
        const stepZ = 6.0 / 16;
        posX = -4.8;
        posZ = -3.8 + barIdx * stepZ;
        rotY = Math.PI * 0.45; // Mirando hacia la pista / DJ
      } else {
        // Segunda línea en la barra de cócteles
        const stepZ = 6.0 / 24;
        posX = -4.0;
        posZ = -3.8 + (barIdx - 16) * stepZ;
        rotY = Math.PI * 0.35;
      }
    }
    // ==========================================
    // ZONA 4: BALCONES Y ALAS LATERALES (200+)
    // ==========================================
    else {
      const extraIdx = index - 200;
      const side = extraIdx % 2 === 0 ? 1 : -1;
      const rowNum = Math.floor(extraIdx / 2);
      posX = side * (4.5 + (rowNum % 4) * 0.7);
      posZ = 4.2 + Math.floor(rowNum / 4) * 0.8;
      rotY = Math.atan2(-posX, djStageZ - posZ);
    }

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
   * Crea una viñeta cómica de diálogo (Chat Bubble) 3D gigante y ultra contrastada
   * directamente sobre la cabeza del espectador, visible desde cualquier ángulo y zoom.
   */
  createChatBubbleSprite(name, text, isVip = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const bubbleX = 14;
    const bubbleY = 12;
    const bubbleW = 484;
    const bubbleH = 168;
    const radius = 24;

    ctx.save();

    // Sombra exterior para despegar la viñeta del fondo 3D
    ctx.shadowColor = isVip ? 'rgba(234, 179, 8, 0.6)' : 'rgba(0, 240, 255, 0.55)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    // Fondo luminoso de alta visibilidad (Blanco puro cómic o Amarillo oro VIP)
    const bgGrad = ctx.createLinearGradient(0, bubbleY, 0, bubbleY + bubbleH);
    if (isVip) {
      bgGrad.addColorStop(0, '#fef08a');
      bgGrad.addColorStop(1, '#eab308');
      ctx.strokeStyle = '#78350f';
    } else {
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(1, '#f1f5f9');
      ctx.strokeStyle = '#090d16';
    }

    ctx.fillStyle = bgGrad;
    ctx.lineWidth = 6;

    // Cuerpo redondeado de la burbuja
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, radius);
    } else {
      ctx.rect(bubbleX, bubbleY, bubbleW, bubbleH);
    }
    ctx.fill();
    ctx.stroke();

    // Colita / Flecha cómica apuntando abajo hacia la cabeza del personaje
    ctx.beginPath();
    ctx.moveTo(224, bubbleY + bubbleH);
    ctx.lineTo(256, bubbleY + bubbleH + 46);
    ctx.lineTo(288, bubbleY + bubbleH);
    ctx.fillStyle = isVip ? '#eab308' : '#f1f5f9';
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Cabecera: Nombre del espectador en píldora distintiva
    const cleanUser = String(name || 'Espectador').replace(/^@+/, '').trim();
    ctx.font = '900 24px "Montserrat", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isVip ? '#9a3412' : '#0284c7';
    ctx.fillText(`${isVip ? '👑' : '💬'} @${cleanUser}`, 256, bubbleY + 28);

    // Separador sutil
    ctx.beginPath();
    ctx.moveTo(bubbleX + 30, bubbleY + 46);
    ctx.lineTo(bubbleX + bubbleW - 30, bubbleY + 46);
    ctx.strokeStyle = isVip ? 'rgba(120, 53, 15, 0.25)' : 'rgba(15, 23, 42, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto del mensaje: Letra negra azabache extra gruesa para contraste total
    const cleanMsg = String(text || '').trim();
    let fontSize = 28;
    if (cleanMsg.length > 55) fontSize = 20;
    else if (cleanMsg.length > 35) fontSize = 23;

    ctx.font = `900 ${fontSize}px "Arial Black", "Montserrat", "Impact", sans-serif`;
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Algoritmo de partición en líneas
    const words = cleanMsg.split(/\s+/);
    const lines = [];
    let currentLine = '';
    const maxLineW = bubbleW - 50;

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
    if (lines.length > 2) lines[1] += '...';

    const lineH = fontSize * 1.35;
    const textStartY = bubbleY + 54 + (bubbleH - 58 - lines.length * lineH) / 2 + lineH / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 256, textStartY + i * lineH);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.renderOrder = 99999;
    sprite.scale.set(2.6, 1.3, 1);
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
      if (spec.chatBubble.material.map) spec.chatBubble.material.map.dispose();
      spec.chatBubble.material.dispose();
      clearTimeout(spec.chatBubbleTimer);
      spec.chatBubble = null;
    }
    if (spec.speechBubble) {
      spec.mesh.remove(spec.speechBubble);
      if (spec.speechBubble.material.map) spec.speechBubble.material.map.dispose();
      spec.speechBubble.material.dispose();
      clearTimeout(spec.bubbleTimer);
      spec.speechBubble = null;
    }

    // 3. Crear nueva viñeta de diálogo 3D gigante y contrastada sobre su cabeza
    const bubbleSprite = this.createChatBubbleSprite(cleanUser, cleanText, isVip);
    bubbleSprite.position.set(0, 1.55, 0);
    spec.mesh.add(bubbleSprite);
    spec.chatBubble = bubbleSprite;
    spec.speechBubble = bubbleSprite;

    // 4. Animar al muñeco mientras habla (salto de fiesta y alegría)
    spec.mesh.animController.gesture = 'joy';
    spec.mesh.animController.danceMove = 'jump';
    spec.mesh.animController.speedMultiplier = 2.4;
    this.increaseEnergy(8);

    // 5. Destacar con anillo de luz en sus pies
    this.highlightSpectator(cleanUser, 5500);

    // 6. Temporizador para ocultar la burbuja a los 6.5 segundos
    spec.chatBubbleTimer = setTimeout(() => {
      if (spec.chatBubble === bubbleSprite) {
        spec.mesh.remove(bubbleSprite);
        if (bubbleSprite.material.map) bubbleSprite.material.map.dispose();
        bubbleSprite.material.dispose();
        spec.chatBubble = null;
        spec.speechBubble = null;
        spec.mesh.animController.gesture = 'none';
        spec.mesh.animController.speedMultiplier = 1.0;
        spec.mesh.animController.danceMove = this.danceMoves[Math.floor(Math.random() * this.danceMoves.length)];
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
    if (!spectator || !spectator.name) return;
    this.sayChatMessage(spectator.name, text, false);
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

    if (lower.includes('perreo') || lower.includes('drop')) {
      spec.mesh.animController.danceMove = 'perreo';
      spec.mesh.animController.speedMultiplier = 2.4;
      this.showSpeechBubble(spec, `🔥 ¡Soltando el bajo! ${cleanText}`);
      return;
    }
    if (lower.includes('salsa') || lower.includes('cumbia') || lower.includes('merengue')) {
      spec.mesh.animController.danceMove = 'salsa';
      spec.mesh.animController.speedMultiplier = 2.2;
      this.showSpeechBubble(spec, `💃 ¡Sabor latino! ${cleanText}`);
      return;
    }
    if (lower.includes('conga') || lower.includes('tren') || lower.includes('rueda')) {
      spec.mesh.animController.danceMove = 'conga';
      spec.mesh.animController.speedMultiplier = 2.0;
      this.showSpeechBubble(spec, `🚂 ¡Súmate al tren de baile!`);
      return;
    }
    if (lower.includes('baile') || lower.includes('bailar') || lower.includes('jump') || lower.includes('fiesta')) {
      spec.mesh.animController.danceMove = 'jump';
      spec.mesh.animController.speedMultiplier = 2.4;
      this.showSpeechBubble(spec, `⚡ ¡A bailar! ${cleanText}`);
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

    // Ajustar la velocidad y energía colectiva de baile al ritmo de la música y del bajo del DJ
    const beatEnergy = (audioLevels.bass || 0) * 1.8 + (audioLevels.overall || 0) * 1.2;
    const dynamicDanceSpeed = 1.0 + Math.min(2.0, beatEnergy * 1.6);

    for (let i = 0; i < this.crowd.length; i++) {
      const s = this.crowd[i];
      // Si el personaje no está en una animación bloqueada, bailar al compás del DJ
      if (s.mesh.animController.gesture === 'none') {
        s.mesh.animController.speedMultiplier = dynamicDanceSpeed;
      }
      s.mesh.animController.update(time, delta, audioLevels);
    }

    if (this.highlightGroup.children.length > 0) {
      this.highlightGroup.children.forEach(ring => {
        ring.rotation.z += delta * 2;
      });
    }
  }
}
