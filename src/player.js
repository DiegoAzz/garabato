import * as THREE from 'three';
import { createCartoonCharacter } from './characterFactory.js';

/**
 * Controlador del Jugador en Tercera Persona con física de colisiones y cámara orbital.
 */
export class PlayerController {
  constructor(scene, camera, domElement, colliders = []) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;

    // Crear modelo del jugador
    this.mesh = createCartoonCharacter({
      id: 'player',
      skinTone: 'light',
      hairStyle: 'player',
      hairColor: 0x4a2e18, // Castaño
      clothColor: 0x2563eb, // Sudadera / polo azul eléctrico
      pantsColor: 0x334155, // Pantalón tejano oscuro
      shoeColor: 0xffffff,  // Zapatillas blancas cartoon
      initialState: 'idle'
    });

    // Posición inicial del jugador en el vestíbulo frente a recepción
    this.position = new THREE.Vector3(0, 0, -4.5);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Parámetros de movimiento y cámara
    this.moveSpeed = 5.2; // Velocidad de caminata
    this.rotationSpeed = 10.0;
    this.radius = 0.45; // Radio de colisión del jugador

    // Estado de cámara orbital en 3ra persona
    this.cameraYaw = 0; // Ángulo horizontal
    this.cameraPitch = 0.35; // Ángulo vertical (inclinación)
    this.cameraDistance = 4.8;
    this.targetCameraDistance = 4.8;
    this.cameraHeight = 1.6;

    // Bloqueo de controles durante diálogos
    this.isLocked = false;

    // Entradas de teclado
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Control de ratón
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };

    this.setupInputs();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.isLocked) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.keys.forward = true;
      if (key === 's' || key === 'arrowdown') this.keys.backward = true;
      if (key === 'a' || key === 'arrowleft') this.keys.left = true;
      if (key === 'd' || key === 'arrowright') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.keys.forward = false;
      if (key === 's' || key === 'arrowdown') this.keys.backward = false;
      if (key === 'a' || key === 'arrowleft') this.keys.left = false;
      if (key === 'd' || key === 'arrowright') this.keys.right = false;
    });

    // Arrastre con ratón para rotar cámara
    this.domElement.addEventListener('pointerdown', (e) => {
      if (e.button === 0 || e.button === 2) {
        this.isDragging = true;
        this.prevMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.prevMousePos.x;
      const deltaY = e.clientY - this.prevMousePos.y;

      const sensitivity = 0.005;
      this.cameraYaw -= deltaX * sensitivity;
      this.cameraPitch = Math.max(0.05, Math.min(0.85, this.cameraPitch + deltaY * sensitivity));

      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    // Zoom suave con la rueda del ratón
    window.addEventListener('wheel', (e) => {
      this.targetCameraDistance = Math.max(2.5, Math.min(8.0, this.targetCameraDistance + e.deltaY * 0.003));
    }, { passive: true });
  }

  /**
   * Comprueba si una posición candidata choca con algún obstáculo
   */
  checkCollision(x, z) {
    const r = this.radius;
    for (const c of this.colliders) {
      if (
        x + r > c.minX &&
        x - r < c.maxX &&
        z + r > c.minZ &&
        z - r < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  update(time, delta) {
    // 1. Calcular dirección de movimiento si no está bloqueado
    let moveX = 0;
    let moveZ = 0;

    if (!this.isLocked) {
      if (this.keys.forward) moveZ -= 1;
      if (this.keys.backward) moveZ += 1;
      if (this.keys.left) moveX -= 1;
      if (this.keys.right) moveX += 1;
    }

    const isMoving = (moveX !== 0 || moveZ !== 0);
    let speed = 0;

    if (isMoving) {
      // Normalizar vector de entrada
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= len;
      moveZ /= len;

      // Transformar según el ángulo de la cámara (Yaw)
      const forwardAngle = this.cameraYaw;
      const worldMoveX = moveX * Math.cos(forwardAngle) - moveZ * Math.sin(forwardAngle);
      const worldMoveZ = moveX * Math.sin(forwardAngle) + moveZ * Math.cos(forwardAngle);

      speed = this.moveSpeed;
      const stepX = worldMoveX * speed * delta;
      const stepZ = worldMoveZ * speed * delta;

      // Desplazamiento con resolución de deslizamiento por colisión (Sliding collision)
      // Primero intentar mover en eje X
      const targetX = this.position.x + stepX;
      if (!this.checkCollision(targetX, this.position.z)) {
        this.position.x = targetX;
      }

      // Luego intentar mover en eje Z
      const targetZ = this.position.z + stepZ;
      if (!this.checkCollision(this.position.x, targetZ)) {
        this.position.z = targetZ;
      }

      this.mesh.position.copy(this.position);

      // Rotar al jugador suavemente hacia la dirección de movimiento
      const targetRotation = Math.atan2(worldMoveX, worldMoveZ);
      // Interpolación angular
      let diff = targetRotation - this.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.mesh.rotation.y += diff * Math.min(1, this.rotationSpeed * delta);

      this.mesh.animController.setState('walking');
    } else {
      this.mesh.animController.setState('idle');
    }

    // Actualizar animación del modelo
    this.mesh.animController.update(time, delta, speed);

    // 2. Actualizar cámara en tercera persona
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.targetCameraDistance, 0.1);

    const camX = this.position.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camY = this.position.y + this.cameraHeight + Math.sin(this.cameraPitch) * this.cameraDistance;
    const camZ = this.position.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    // Suavizado de la cámara
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
    const lookTarget = new THREE.Vector3(this.position.x, this.position.y + 1.2, this.position.z);
    this.camera.lookAt(lookTarget);
  }
}
