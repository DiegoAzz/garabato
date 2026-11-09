import * as THREE from 'three';

/**
 * Constructor del Escenario 3D de Discoteca para GARABATO FEST 3D
 * Tarima, pantalla LED dinámica, bola de discoteca, bocinas con bajos físicos,
 * focos móviles simulados, pista iluminada y confeti.
 */
export function buildDiscoStage(scene) {
  const stageGroup = new THREE.Group();
  stageGroup.name = 'DiscoStage';

  // ==========================================
  // 1. TARIMA CENTRAL
  // ==========================================
  const stageWidth = 10;
  const stageDepth = 6;
  const stageHeight = 0.8;

  // Base de la tarima
  const stageGeo = new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth);
  const stageMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.25,
    metalness: 0.6
  });
  const stageMesh = new THREE.Mesh(stageGeo, stageMat);
  stageMesh.position.set(0, stageHeight / 2, -3);
  stageMesh.receiveShadow = true;
  stageGroup.add(stageMesh);

  // Borde neon brillante alrededor de la tarima
  const rimGeo = new THREE.BoxGeometry(stageWidth + 0.1, 0.1, stageDepth + 0.1);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(0, stageHeight + 0.05, -3);
  stageGroup.add(rimMesh);

  // ==========================================
  // 2. FONDO ELEGANTE DE TEATRO STAND-UP (Cero parpadeos ni pantallas molestas)
  // ==========================================
  const backWallGeo = new THREE.BoxGeometry(16, 9, 0.4);
  const backWallMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f1d,
    roughness: 0.9,
    metalness: 0.1
  });
  const backWallMesh = new THREE.Mesh(backWallGeo, backWallMat);
  backWallMesh.position.set(0, 4.5, -6.0);
  stageGroup.add(backWallMesh);

  // Paneles acústicos decorativos oscuros y elegantes (sin texto que parpadee)
  for (let i = -6; i <= 6; i += 2.4) {
    const panelGeo = new THREE.BoxGeometry(1.6, 7.5, 0.1);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x060913,
      roughness: 0.95
    });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(i, 4.2, -5.8);
    stageGroup.add(panel);
  }

  let ledData = {
    singerName: 'EL GARABATO',
    personality: 'COMEDY CLUB',
    songTitle: '',
    subtitles: ''
  };

  function updateLedScreen() {
    // Pantalla de texto eliminada a petición del usuario (fondo 100% limpio y sin parpadeos)
  }

  // ==========================================
  // 3. BOLA DE DISCOTECA GIRATORIA
  // ==========================================
  const discoBallGroup = new THREE.Group();
  discoBallGroup.position.set(0, 6.8, 0);

  const ballGeo = new THREE.SphereGeometry(0.8, 20, 20);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.95,
    roughness: 0.1,
    flatShading: true
  });
  const discoBall = new THREE.Mesh(ballGeo, ballMat);
  discoBallGroup.add(discoBall);

  // Varilla de sujeción al techo
  const rodGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8);
  const rodMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.y = 1.25;
  discoBallGroup.add(rod);

  stageGroup.add(discoBallGroup);

  // ==========================================
  // 4. BOCINAS CON BAJOS FÍSICOS (PULSAN CON EL AUDIO)
  // ==========================================
  const speakers = [];

  function createSpeaker(x, z, rotY) {
    const spkGroup = new THREE.Group();
    spkGroup.position.set(x, 1.4, z);
    spkGroup.rotation.y = rotY;

    // Caja de madera negra
    const boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.8, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x0f172a })
    );
    boxMesh.castShadow = true;
    spkGroup.add(boxMesh);

    // Cono de subwoofer grande
    const coneGeo = new THREE.CylinderGeometry(0.48, 0.2, 0.2, 24);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.3, roughness: 0.5 });
    const subCone = new THREE.Mesh(coneGeo, coneMat);
    subCone.rotation.x = Math.PI / 2;
    subCone.position.set(0, -0.4, 0.55);
    spkGroup.add(subCone);

    // Cono de agudos mediano
    const tweetCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.12, 0.15, 20),
      coneMat
    );
    tweetCone.rotation.x = Math.PI / 2;
    tweetCone.position.set(0, 0.65, 0.55);
    spkGroup.add(tweetCone);

    stageGroup.add(spkGroup);
    speakers.push({ group: spkGroup, subCone, tweetCone });
  }

  createSpeaker(-5.8, -2.5, 0.25);
  createSpeaker(5.8, -2.5, -0.25);

  // ==========================================
  // 5. CUATRO FOCOS MÓVILES SIMULADOS (LIGHT CONES)
  // ==========================================
  const spotLights = [];
  const spotColors = [0x00f0ff, 0xec4899, 0xa855f7, 0xfacc15];

  for (let i = 0; i < 4; i++) {
    const spotGroup = new THREE.Group();
    const xPos = -4.5 + i * 3.0;
    spotGroup.position.set(xPos, 5.8, -4.5);

    // Base del foco móvil
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    spotGroup.add(base);

    // Cabeza giratoria
    const headPivot = new THREE.Group();
    headPivot.position.y = -0.2;
    spotGroup.add(headPivot);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    headPivot.add(headMesh);

    // Haz de luz cónico volumétrico ligero con blending aditivo
    const coneGeo = new THREE.ConeGeometry(1.6, 9, 16, 1, true);
    coneGeo.translate(0, -4.5, 0); // Ajustar origen en la punta
    const coneMat = new THREE.MeshBasicMaterial({
      color: spotColors[i],
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    headPivot.add(lightCone);

    stageGroup.add(spotGroup);
    spotLights.push({ group: spotGroup, headPivot, coneMat, colorIdx: i });
  }

  // ==========================================
  // 6. PISTA DE BAILE DE DISCOTECA (TILES ILUMINADOS)
  // ==========================================
  const floorTiles = [];
  const gridX = 14;
  const gridZ = 22;
  const tileSize = 1.35;

  const danceFloorGroup = new THREE.Group();
  danceFloorGroup.position.set(0, 0.01, 11.5);

  for (let ix = -gridX / 2; ix < gridX / 2; ix++) {
    for (let iz = -gridZ / 2; iz < gridZ / 2; iz++) {
      const tileGeo = new THREE.PlaneGeometry(tileSize * 0.94, tileSize * 0.94);
      const isAlt = (Math.abs(ix) + Math.abs(iz)) % 2 === 0;
      const tileMat = new THREE.MeshBasicMaterial({
        color: isAlt ? 0x1e1b4b : 0x0f172a
      });
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(ix * tileSize + tileSize / 2, 0, iz * tileSize + tileSize / 2);
      danceFloorGroup.add(tile);
      floorTiles.push({ mesh: tile, mat: tileMat, ix, iz });
    }
  }
  stageGroup.add(danceFloorGroup);

  // ==========================================
  // 7. SISTEMA DE CONFETI CELEBRATORIO
  // ==========================================
  const confettiCount = 80;
  const confettiGeo = new THREE.PlaneGeometry(0.12, 0.18);
  const confettiColors = [0xec4899, 0x00f0ff, 0xfacc15, 0x22c55e, 0x8b5cf6, 0xffffff];
  const confettiPool = [];

  for (let c = 0; c < confettiCount; c++) {
    const mat = new THREE.MeshBasicMaterial({
      color: confettiColors[c % confettiColors.length],
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(confettiGeo, mat);
    mesh.visible = false;
    stageGroup.add(mesh);
    confettiPool.push({
      mesh,
      velocity: new THREE.Vector3(),
      rotSpeed: new THREE.Vector3(),
      life: 0,
      maxLife: 2.5
    });
  }

  function burstConfetti(origin = new THREE.Vector3(0, 4.5, -2)) {
    for (let c = 0; c < confettiCount; c++) {
      const p = confettiPool[c];
      p.mesh.position.copy(origin);
      p.mesh.position.x += (Math.random() - 0.5) * 4;
      p.mesh.visible = true;
      p.life = 0;
      p.maxLife = 2.0 + Math.random() * 1.5;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      p.velocity.set(
        Math.cos(angle) * speed,
        2.5 + Math.random() * 4.5,
        Math.sin(angle) * speed
      );
      p.rotSpeed.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );
    }
  }

  // ==========================================
  // 8. ILUMINACIÓN AMBIENTAL DE DISCOTECA
  // ==========================================
  const stageAmbient = new THREE.AmbientLight(0x38bdf8, 0.65);
  scene.add(stageAmbient);

  const stageDirectional = new THREE.DirectionalLight(0xffffff, 1.2);
  stageDirectional.position.set(0, 10, 8);
  stageDirectional.castShadow = true;
  scene.add(stageDirectional);

  scene.add(stageGroup);

  let isExtremeMode = false;
  let extremeTimer = 0;

  function triggerExtremeDisco(duration = 6.0) {
    isExtremeMode = true;
    extremeTimer = duration;
    burstConfetti(new THREE.Vector3(0, 5, -2));
  }

  // ==========================================
  // API PÚBLICA DEL ESCENARIO
  // ==========================================
  return {
    stageGroup,
    setLedData(data) {
      ledData = { ...ledData, ...data };
    },
    burstConfetti,
    triggerExtremeDisco,
    update(time, delta, audioLevels = { bass: 0, mid: 0, overall: 0 }) {
      if (isExtremeMode) {
        extremeTimer -= delta;
        if (extremeTimer <= 0) {
          isExtremeMode = false;
        }
      }

      // 1. Bola de discoteca rotando (más rápida en modo extremo)
      const ballSpeed = isExtremeMode ? 3.5 : 0.8;
      discoBall.rotation.y += ballSpeed * delta;

      // 2. Focos móviles barriendo el escenario en patrones armónicos
      for (let i = 0; i < spotLights.length; i++) {
        const spot = spotLights[i];
        const sweepSpeed = isExtremeMode ? 6.0 : 2.2;
        const sweepX = Math.sin(time * sweepSpeed + i * 1.2) * 0.45;
        const sweepZ = Math.cos(time * (sweepSpeed * 0.8) + i * 1.5) * 0.35;
        spot.headPivot.rotation.z = sweepX;
        spot.headPivot.rotation.x = 0.4 + sweepZ;

        // Pulso de intensidad o estroboscopio en modo extremo
        if (isExtremeMode) {
          spot.coneMat.opacity = Math.sin(time * 24 + i) > 0 ? 0.45 : 0.05;
        } else {
          spot.coneMat.opacity = 0.15 + audioLevels.mid * 0.35;
        }
      }

      // 3. Subwoofers bombeando físicamente con los graves
      const bassPunch = 1.0 + (audioLevels.bass || 0) * 0.45;
      for (let s of speakers) {
        s.subCone.scale.set(bassPunch, bassPunch, 1.0 + audioLevels.bass * 0.8);
      }

      // 4. Tiles de la pista iluminándose con ondas rítmicas
      const waveSpeed = time * 5;
      for (let i = 0; i < floorTiles.length; i++) {
        const tile = floorTiles[i];
        const dist = Math.sqrt(tile.ix * tile.ix + tile.iz * tile.iz);
        const wave = Math.sin(waveSpeed - dist * 0.6);
        if (wave > 0.4) {
          tile.mat.color.setHSL((time * 0.1 + dist * 0.05) % 1, 0.85, 0.45);
        } else {
          tile.mat.color.setHex((Math.abs(tile.ix) + Math.abs(tile.iz)) % 2 === 0 ? 0x111827 : 0x070913);
        }
      }

      // 5. Actualizar partículas de confeti
      for (let c = 0; c < confettiPool.length; c++) {
        const p = confettiPool[c];
        if (!p.mesh.visible) continue;
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
          continue;
        }
        p.velocity.y -= 4.5 * delta; // Gravedad suave
        p.velocity.x *= 0.98;
        p.velocity.z *= 0.98;
        p.mesh.position.addScaledVector(p.velocity, delta);

        p.mesh.rotation.x += p.rotSpeed.x * delta;
        p.mesh.rotation.y += p.rotSpeed.y * delta;
      }

      // 6. Actualizar pantalla LED
      updateLedScreen(time, audioLevels);
    }
  };
}
