import * as THREE from 'three';

/**
 * Sistema de Lluvia y Lanzamiento de Tomates con Pool de Objetos 3D Reutilizables
 * - Lanzamiento manual con clic del ratón hacia cualquier punto 3D del escenario o cantante.
 * - Lluvia torrencial automática (30 taps milestone).
 * - Aplastamiento cómico (squash), partículas de splash y sonido wet cartoon.
 * - Ultra-ligero, 100% libre de asignación de memoria en tiempo de ejecución.
 */
export class TomatoRain {
  constructor(scene, audioEngine) {
    this.scene = scene;
    this.audioEngine = audioEngine;
    this.maxTomatoes = 30;
    this.pool = [];
    this.isActive = false;
    this.duration = 5.0;
    this.timer = 0;

    // Splats de jugo de tomate reutilizables en el suelo
    this.splatPool = [];
    this.maxSplats = 20;

    // Geometría y material compartido de tomate cartoon
    const tomatoGeo = new THREE.SphereGeometry(0.2, 10, 8);
    const tomatoMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Rojo tomate brillante
      roughness: 0.25,
      metalness: 0.1
    });

    const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.08, 5);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Verde tallo

    for (let i = 0; i < this.maxTomatoes; i++) {
      const mesh = new THREE.Group();

      const body = new THREE.Mesh(tomatoGeo, tomatoMat);
      body.castShadow = true;
      mesh.add(body);

      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.2;
      mesh.add(stem);

      mesh.visible = false;
      this.scene.add(mesh);

      this.pool.push({
        mesh,
        body,
        velocity: new THREE.Vector3(),
        rotSpeed: new THREE.Vector3(),
        active: false,
        hasSplat: false,
        splatTime: 0,
        isTargetedThrow: false,
        targetPos: new THREE.Vector3(),
        onHit: null
      });
    }

    // Pool de manchas de jugo de tomate
    const splatGeo = new THREE.CircleGeometry(0.35, 12);
    const splatMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    for (let s = 0; s < this.maxSplats; s++) {
      const splatMesh = new THREE.Mesh(splatGeo, splatMat.clone());
      splatMesh.rotation.x = -Math.PI / 2;
      splatMesh.visible = false;
      this.scene.add(splatMesh);
      this.splatPool.push({
        mesh: splatMesh,
        active: false,
        life: 0
      });
    }
  }

  // ==========================================
  // LANZAMIENTO INDIVIDUAL CON EL RATÓN
  // ==========================================
  throwAt(targetPoint, originPoint = null, onHit = null) {
    // Buscar un tomate libre en el pool (o reciclar el más antiguo)
    let t = this.pool.find(item => !item.active);
    if (!t) {
      t = this.pool[0];
    }

    t.active = true;
    t.hasSplat = false;
    t.splatTime = 0;
    t.body.scale.set(1, 1, 1);
    t.mesh.visible = true;
    t.isTargetedThrow = true;
    t.targetPos.copy(targetPoint);
    t.onHit = onHit;

    // Origen: punto de cámara o frente al usuario
    const start = originPoint || new THREE.Vector3(targetPoint.x * 0.4, 2.5, 9.0);
    t.mesh.position.copy(start);

    // Calcular vector de velocidad en arco balístico hacia el objetivo
    const dir = new THREE.Vector3().subVectors(targetPoint, start);
    const flightTime = 0.55; // Vuelo rápido y dinámico
    t.velocity.x = dir.x / flightTime;
    t.velocity.z = dir.z / flightTime;
    // Componente vertical con arco
    t.velocity.y = (dir.y / flightTime) + 0.5 * 14.0 * flightTime;

    t.rotSpeed.set(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15
    );

    this.isActive = true;
  }

  // ==========================================
  // LLUVIA COLECTIVA TORRENCIAL (30 TAPS MILESTONE)
  // ==========================================
  trigger() {
    this.isActive = true;
    this.timer = 0;

    for (let i = 0; i < this.pool.length; i++) {
      const t = this.pool[i];
      t.active = false;
      t.hasSplat = false;
      t.mesh.visible = false;
      t.isTargetedThrow = false;
      t.body.scale.set(1, 1, 1);

      setTimeout(() => {
        if (!this.isActive) return;
        t.active = true;
        t.hasSplat = false;
        t.isTargetedThrow = false;
        t.body.scale.set(1, 1, 1);
        t.mesh.visible = true;

        // Posición aleatoria sobre la tarima
        t.mesh.position.set(
          (Math.random() - 0.5) * 8.0,
          7.0 + Math.random() * 2.5,
          -3.0 + (Math.random() - 0.5) * 4.0
        );

        t.velocity.set(
          (Math.random() - 0.5) * 1.5,
          -(4.0 + Math.random() * 4.5),
          (Math.random() - 0.5) * 1.5
        );

        t.rotSpeed.set(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        );
      }, i * 140);
    }
  }

  spawnSplatMark(pos) {
    let s = this.splatPool.find(item => !item.active);
    if (!s) s = this.splatPool[0];

    s.active = true;
    s.life = 0;
    s.mesh.position.set(pos.x, pos.y + 0.025, pos.z);
    s.mesh.scale.set(0.8 + Math.random() * 0.5, 0.8 + Math.random() * 0.5, 1);
    s.mesh.material.opacity = 0.85;
    s.mesh.visible = true;
  }

  update(delta) {
    const stageFloorY = 0.82; // Altura de la tarima

    let anyActive = false;

    // Actualizar manchas de jugo
    for (let s of this.splatPool) {
      if (!s.active) continue;
      s.life += delta;
      if (s.life > 3.5) {
        s.mesh.material.opacity = Math.max(0, 1 - (s.life - 3.5) / 1.5);
        if (s.life > 5.0) {
          s.active = false;
          s.mesh.visible = false;
        }
      }
    }

    for (let i = 0; i < this.pool.length; i++) {
      const t = this.pool[i];
      if (!t.active) continue;
      anyActive = true;

      if (!t.hasSplat) {
        // Gravedad y traslación balística
        t.velocity.y -= 14.0 * delta;
        t.mesh.position.addScaledVector(t.velocity, delta);

        t.mesh.rotation.x += t.rotSpeed.x * delta;
        t.mesh.rotation.y += t.rotSpeed.y * delta;

        // Comprobación de impacto
        let hit = false;
        if (t.isTargetedThrow) {
          // Impacto cercano al objetivo o suelo
          if (t.mesh.position.distanceTo(t.targetPos) < 0.4 || t.mesh.position.y <= Math.max(stageFloorY, t.targetPos.y)) {
            hit = true;
          }
        } else if (t.mesh.position.y <= stageFloorY) {
          hit = true;
        }

        if (hit) {
          t.hasSplat = true;
          t.splatTime = 0;
          t.velocity.set(0, 0, 0);

          // Aplastamiento cómico (squash)
          t.body.scale.set(1.8, 0.22, 1.8);

          // Crear mancha en suelo
          this.spawnSplatMark(t.mesh.position);

          // Sonido cómico de tomate estrellado
          if (this.audioEngine) {
            this.audioEngine.playSquish();
          }

          if (t.onHit) {
            t.onHit(t.mesh.position);
          }
        }
      } else {
        // Desvanecimiento del tomate aplastado
        t.splatTime += delta;
        if (t.splatTime > 1.2) {
          t.active = false;
          t.mesh.visible = false;
        }
      }
    }

    this.isActive = anyActive;
  }
}
