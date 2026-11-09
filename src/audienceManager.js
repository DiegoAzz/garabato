import * as THREE from 'three';
import { createStickman } from './garabatoCharacter.js';

/**
 * Gestor del Público de Garabatos (Público Muy Animado)
 * Permite audiencia ilimitada creciendo hacia atrás en filas organizadas,
 * nombres siempre visibles, y resaltado/enfoque de espectadores individuales
 * sin obstruir al cantante ni la tarima.
 */
export class AudienceManager {
  constructor(scene) {
    this.scene = scene;
    this.crowd = [];
    this.currentProfile = 'NORMAL'; // 'LIGERO' | 'NORMAL' | 'FIESTA'
    this.collectiveEnergy = 50; // 0 a 100%
    this.isMusicPlaying = false;

    // Colores vibrantes cartoon para el público
    this.palette = [
      0x00f0ff, 0xec4899, 0xfacc15, 0x22c55e, 0x8b5cf6,
      0xf97316, 0x38bdf8, 0x4ade80, 0xa855f7, 0xfb7185
    ];

    this.danceMoves = ['robot', 'salsa', 'jump', 'helicopter', 'wave'];

    // Grupo para auras y focos de espectadores destacados
    this.highlightGroup = new THREE.Group();
    this.scene.add(this.highlightGroup);

    this.setProfile('NORMAL');
  }

  setProfile(profile) {
    this.currentProfile = profile;
    let targetCount = 30;
    if (profile === 'LIGERO') targetCount = 15;
    if (profile === 'FIESTA') targetCount = 50;

    // Eliminar personajes sobrantes
    while (this.crowd.length > targetCount) {
      const removed = this.crowd.pop();
      this.scene.remove(removed.mesh);
    }

    // Agregar personajes necesarios
    while (this.crowd.length < targetCount) {
      this.spawnSpectator();
    }
  }

  spawnSpectator(customName = null) {
    const color = this.palette[this.crowd.length % this.palette.length];
    const stickman = createStickman(false, color);

    // Posicionamiento organizado en filas que crecen hacia atrás (Z positivo)
    // 6 columnas uniformes centradas de X = -3.2 a X = 3.2
    // Distancia inicial Z = 2.8 para NO tapar NUNCA la tarima ni al cantante
    const cols = 6;
    const row = Math.floor(this.crowd.length / cols);
    const col = this.crowd.length % cols;
    const posX = -3.0 + (col / (cols - 1)) * 6.0;
    const posZ = 2.8 + row * 1.15;

    stickman.position.set(posX, 0, posZ);
    // Mirando hacia el cantante / escenario (-Z)
    stickman.rotation.y = Math.PI;

    // Asignar baile aleatorio
    stickman.animController.danceMove = this.danceMoves[Math.floor(Math.random() * this.danceMoves.length)];

    // Crear etiqueta de nombre flotante SIEMPRE visible sobre la cabeza
    const defaultNames = ['Cleo', 'Nia', 'Zane', 'Finn', 'Ty', 'Leo', 'Mía', 'Dani', 'Gara', 'Nova', 'Alex', 'Sam'];
    const name = customName || defaultNames[this.crowd.length % defaultNames.length];
    const nameLabel = this.createNameSprite(name);
    nameLabel.position.set(0, 0.70, 0);
    stickman.add(nameLabel);
    nameLabel.visible = true; // Siempre visible

    this.scene.add(stickman);

    const spectator = {
      mesh: stickman,
      name,
      nameLabel,
      homePos: new THREE.Vector3(posX, 0, posZ),
      isRegisteredInMinigame: false,
      highlightRing: null
    };

    this.crowd.push(spectator);
    return spectator;
  }

  createNameSprite(text, isHighlighted = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 56;
    const ctx = canvas.getContext('2d');

    // Fondo redondeado estilo avatar TikTok compacto
    ctx.fillStyle = isHighlighted ? 'rgba(234, 179, 8, 0.95)' : 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(4, 4, 192, 48, 14);
    ctx.fill();

    ctx.strokeStyle = isHighlighted ? '#ffffff' : '#00f0ff';
    ctx.lineWidth = isHighlighted ? 3 : 2;
    ctx.stroke();

    // Texto del nombre
    ctx.fillStyle = isHighlighted ? '#000000' : '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 100, 28);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.48, 0.14, 1);
    return sprite;
  }

  /**
   * Resalta a un espectador específico con aura dorada, salto y badge VIP
   * sin tapar la vista del cantante.
   */
  highlightSpectator(name, durationMs = 4500) {
    const spec = this.findSpectator(name);
    if (!spec) return null;

    // Crear anillo de luz en el suelo bajo sus pies
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

    // Actualizar cartelito sobre su cabeza a versión VIP destacada
    spec.mesh.remove(spec.nameLabel);
    spec.nameLabel = this.createNameSprite(`👑 ${spec.name}`, true);
    spec.nameLabel.position.set(0, 0.76, 0);
    spec.mesh.add(spec.nameLabel);

    // Animación de salto / euforia
    spec.mesh.animController.speedMultiplier = 2.6;
    spec.mesh.animController.danceMove = 'jump';
    spec.mesh.animController.gesture = 'joy';

    // Limpieza al terminar la duración
    setTimeout(() => {
      this.highlightGroup.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();

      spec.mesh.remove(spec.nameLabel);
      spec.nameLabel = this.createNameSprite(spec.name, false);
      spec.nameLabel.position.set(0, 0.70, 0);
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

  // ==========================================
  // COMANDOS DE INTERACCIÓN SIMULADOS / TIKTOK
  // ==========================================
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
      target.nameLabel.visible = true;
    }
    this.increaseEnergy(2);
  }

  triggerSalta(name) {
    const target = this.findSpectator(name);
    if (target) {
      target.mesh.animController.gesture = 'joy';
      target.nameLabel.visible = true;
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
      target.nameLabel.visible = true;
      return target;
    }
    return null;
  }

  prepareCatchCrowd() {
    let count = 0;
    for (let spec of this.crowd) {
      if (spec.isRegisteredInMinigame || Math.random() < 0.4) {
        spec.mesh.animController.gesture = 'catch';
        spec.nameLabel.visible = true;
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

  onMusicStateChange(isPlaying) {
    this.isMusicPlaying = isPlaying;
    if (!isPlaying) {
      for (let s of this.crowd) {
        if (Math.random() < 0.5) {
          s.mesh.animController.gesture = 'anger';
        } else {
          s.mesh.animController.gesture = 'none';
        }
      }
    } else {
      for (let s of this.crowd) {
        s.mesh.animController.gesture = 'none';
      }
    }
  }

  update(time, delta, audioLevels = { bass: 0, mid: 0, overall: 0 }) {
    this.collectiveEnergy = Math.max(10, this.collectiveEnergy - delta * 1.5);

    for (let i = 0; i < this.crowd.length; i++) {
      const s = this.crowd[i];
      s.mesh.animController.update(time, delta, audioLevels);
    }

    // Animar auras de resaltado
    if (this.highlightGroup.children.length > 0) {
      this.highlightGroup.children.forEach(ring => {
        ring.rotation.z += delta * 2;
      });
    }
  }
}
