import * as THREE from 'three';

/**
 * Constructor del Escenario 3D de Discoteca / Club Nocturno Real para GARABATO FEST 3D
 * Inspirado en los 3 estilos de discoteca club isométrico:
 * 1. Tarima elevada de DJ con barandas de seguridad metálicas, bocinas gigantes y tornamesas.
 * 2. Pista de baile central de LED iluminada con baldosas que parpadean al ritmo de los bajos (estilo disco grid).
 * 3. Barra de bar VIP iluminada con estantería de botellas neón y taburetes altos.
 * 4. Mesas altas de cóctel VIP en el área lounge.
 * 5. Bola de discoteca giratoria de espejos y focos móviles volumétricos.
 */
export function buildDiscoStage(scene) {
  const stageGroup = new THREE.Group();
  stageGroup.name = 'DiscoStage';

  const stageCenterZ = -3.8;
  const stageElevation = 0.55;

  // ==========================================
  // 1. PISO GENERAL DEL CLUB NOCTURNO
  // ==========================================
  const mainFloorGeo = new THREE.PlaneGeometry(32, 36);
  const mainFloorMat = new THREE.MeshStandardMaterial({
    color: 0x070b14,
    roughness: 0.35,
    metalness: 0.65
  });
  const mainFloor = new THREE.Mesh(mainFloorGeo, mainFloorMat);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.set(0, 0, 0);
  mainFloor.receiveShadow = true;
  stageGroup.add(mainFloor);

  // Pared de fondo acústica del club con luces arquitectónicas verticales
  const backWallGeo = new THREE.BoxGeometry(26, 12, 0.5);
  const backWallMat = new THREE.MeshStandardMaterial({ color: 0x050811, roughness: 0.9 });
  const backWall = new THREE.Mesh(backWallGeo, backWallMat);
  backWall.position.set(0, 6, -7.5);
  stageGroup.add(backWall);

  // Columnas arquitectónicas con tiras de neón verticales
  for (let x = -10; x <= 10; x += 4) {
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 11, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0b1120, metalness: 0.8 })
    );
    col.position.set(x, 5.5, -7.2);
    stageGroup.add(col);

    const neonStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 10, 0.04),
      new THREE.MeshBasicMaterial({ color: x % 8 === 0 ? 0x00f0ff : 0xec4899 })
    );
    neonStrip.position.set(x, 5.5, -6.88);
    stageGroup.add(neonStrip);
  }

  // ==========================================
  // 1.5. PANTALLA GIGANTE DE ESPECTRO DE AUDIO LED 3D (RTA EQUALIZER WALL)
  // Ubicada directamente detrás del DJ, visible en todos los ángulos de cámara
  // ==========================================
  const spectrumColumns = [];
  const spectrumWallGroup = new THREE.Group();
  spectrumWallGroup.position.set(0, 3.4, -5.8);

  // Marco de fibra de carbono del visualizador
  const specFrameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 2.7, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x070b14, roughness: 0.35, metalness: 0.85 })
  );
  spectrumWallGroup.add(specFrameMesh);

  // Borde exterior de neón cian
  const specBorderMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.68, 2.78, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  specBorderMesh.position.z = -0.04;
  spectrumWallGroup.add(specBorderMesh);

  // 22 Columnas de Ecualizador Neón Reactivas
  const numEqCols = 22;
  const colSpacing = 0.27;
  const startX = -((numEqCols - 1) * colSpacing) / 2;
  const maxBarH = 2.1;

  const eqColors = [
    0xec4899, 0xec4899, 0xf43f5e, 0xf43f5e, // Sub-bajos (Hot Pink / Red)
    0xd946ef, 0xa855f7, 0x8b5cf6, 0x6366f1, // Bajos & Medios (Violeta / Indigo)
    0x3b82f6, 0x0ea5e9, 0x06b6d4, 0x00f0ff, // Medios Vocales & Sintetizadores (Cian / Sky)
    0x14b8a6, 0x10b981, 0x22c55e, 0x84cc16, // Medios-Altos (Verde Neón)
    0xeab308, 0xfacc15, 0xf59e0b, 0xf97316, 0xef4444, 0xffffff // Agudos & Percusiones
  ];

  for (let c = 0; c < numEqCols; c++) {
    const colGroup = new THREE.Group();
    const colX = startX + c * colSpacing;
    colGroup.position.set(colX, -1.05, 0.08); // Anclado en la base

    // Barra de color LED
    const barGeo = new THREE.BoxGeometry(0.18, maxBarH, 0.06);
    const barMat = new THREE.MeshBasicMaterial({
      color: eqColors[c % eqColors.length]
    });
    const barMesh = new THREE.Mesh(barGeo, barMat);
    barMesh.position.y = maxBarH / 2; // Desplazar para que el pivote sea la base
    colGroup.add(barMesh);

    // Indicador Flotante de Pico (Peak Hold Cap)
    const capGeo = new THREE.BoxGeometry(0.20, 0.045, 0.08);
    const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(colX, -1.05 + 0.06, 0.1);
    spectrumWallGroup.add(capMesh);

    spectrumWallGroup.add(colGroup);

    spectrumColumns.push({
      colGroup,
      capMesh,
      baseY: -1.05,
      currentH: 0.05,
      peakH: 0.05,
      peakHold: 0,
      index: c
    });
  }

  stageGroup.add(spectrumWallGroup);

  // ==========================================
  // 2. PISTA DE BAILE CENTRAL DE LED ILUMINADA (DISCO LED GRID)
  // ==========================================
  // Cuadrícula de 8x10 baldosas de LED que pulsan y cambian de color con la música
  const ledTiles = [];
  const tileCols = 8;
  const tileRows = 10;
  const tileSize = 0.95;
  const tileGap = 0.05;
  const gridW = tileCols * (tileSize + tileGap);
  const gridD = tileRows * (tileSize + tileGap);
  const gridOriginX = -gridW / 2 + tileSize / 2;
  const gridOriginZ = -2.2;

  const tilePalette = [0x00f0ff, 0xec4899, 0xa855f7, 0xfacc15, 0x10b981, 0x3b82f6];

  for (let r = 0; r < tileRows; r++) {
    for (let c = 0; c < tileCols; c++) {
      const posX = gridOriginX + c * (tileSize + tileGap);
      const posZ = gridOriginZ + r * (tileSize + tileGap);

      // Marco oscuro de la baldosa
      const frameGeo = new THREE.BoxGeometry(tileSize + 0.02, 0.04, tileSize + 0.02);
      const frameMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(posX, 0.02, posZ);
      stageGroup.add(frameMesh);

      // Superficie translúcida luminosa de la baldosa LED
      const initialColor = tilePalette[(r + c) % tilePalette.length];
      const tileMat = new THREE.MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: 0.65
      });
      const tileMesh = new THREE.Mesh(new THREE.BoxGeometry(tileSize * 0.92, 0.045, tileSize * 0.92), tileMat);
      tileMesh.position.set(posX, 0.025, posZ);
      stageGroup.add(tileMesh);

      ledTiles.push({
        mesh: tileMesh,
        mat: tileMat,
        row: r,
        col: c,
        baseColor: initialColor
      });
    }
  }

  // Marco exterior de neón brillante alrededor de la pista (4 barras finas en el perímetro)
  const borderGroup = new THREE.Group();
  const borderPistaMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const borderThick = 0.08;
  const borderH = 0.05;
  const minZ = gridOriginZ - (tileSize / 2);
  const maxZ = gridOriginZ + gridD - (tileSize / 2);
  const lenZ = maxZ - minZ;

  // Borde Frontal
  const borderFront = new THREE.Mesh(new THREE.BoxGeometry(gridW + borderThick * 2, borderH, borderThick), borderPistaMat);
  borderFront.position.set(0, borderH / 2, maxZ + borderThick / 2);
  borderGroup.add(borderFront);

  // Borde Trasero
  const borderBack = new THREE.Mesh(new THREE.BoxGeometry(gridW + borderThick * 2, borderH, borderThick), borderPistaMat);
  borderBack.position.set(0, borderH / 2, minZ - borderThick / 2);
  borderGroup.add(borderBack);

  // Borde Izquierdo
  const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(borderThick, borderH, lenZ), borderPistaMat);
  borderLeft.position.set(-gridW / 2 - borderThick / 2, borderH / 2, minZ + lenZ / 2);
  borderGroup.add(borderLeft);

  // Borde Derecho
  const borderRight = new THREE.Mesh(new THREE.BoxGeometry(borderThick, borderH, lenZ), borderPistaMat);
  borderRight.position.set(gridW / 2 + borderThick / 2, borderH / 2, minZ + lenZ / 2);
  borderGroup.add(borderRight);

  stageGroup.add(borderGroup);

  // ==========================================
  // 3. TARIMA ELEVADA DEL DJ CON BARANDAS METÁLICAS
  // ==========================================
  const stageW = 8.5;
  const stageD = 3.6;
  const stagePlatGeo = new THREE.BoxGeometry(stageW, stageElevation, stageD);
  const stagePlatMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.25,
    metalness: 0.75
  });
  const stagePlat = new THREE.Mesh(stagePlatGeo, stagePlatMat);
  stagePlat.position.set(0, stageElevation / 2, stageCenterZ);
  stagePlat.receiveShadow = true;
  stageGroup.add(stagePlat);

  // Línea de neón frontal de la tarima
  const stageNeonFront = new THREE.Mesh(
    new THREE.BoxGeometry(stageW + 0.1, 0.06, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xec4899 })
  );
  stageNeonFront.position.set(0, stageElevation, stageCenterZ + stageD / 2);
  stageGroup.add(stageNeonFront);

  // Barandas metálicas de discoteca (lado izquierdo, derecho y trasero)
  function createMetalRailing(x1, z1, x2, z2) {
    const railGroup = new THREE.Group();
    const length = Math.hypot(x2 - x1, z2 - z1);
    const angle = Math.atan2(x2 - x1, z2 - z1);

    // Barra superior
    const topBarGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 12);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const topBar = new THREE.Mesh(topBarGeo, metalMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.rotation.y = angle;
    topBar.position.set((x1 + x2) / 2, stageElevation + 0.75, (z1 + z2) / 2);
    railGroup.add(topBar);

    // Postes verticales
    const postCount = Math.max(2, Math.floor(length / 1.0));
    for (let p = 0; p <= postCount; p++) {
      const t = p / postCount;
      const px = x1 + (x2 - x1) * t;
      const pz = z1 + (z2 - z1) * t;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 10), metalMat);
      post.position.set(px, stageElevation + 0.375, pz);
      railGroup.add(post);
    }
    stageGroup.add(railGroup);
  }

  // Baranda lateral izquierda y derecha de la tarima
  createMetalRailing(-stageW / 2 + 0.1, stageCenterZ - stageD / 2, -stageW / 2 + 0.1, stageCenterZ + stageD / 2);
  createMetalRailing(stageW / 2 - 0.1, stageCenterZ - stageD / 2, stageW / 2 - 0.1, stageCenterZ + stageD / 2);
  // Baranda trasera
  createMetalRailing(-stageW / 2 + 0.1, stageCenterZ - stageD / 2 + 0.1, stageW / 2 - 0.1, stageCenterZ - stageD / 2 + 0.1);

  // ==========================================
  // 4. CABINA PROFESIONAL DEL DJ (BOOTH, TORNAMESAS, MEZCLADOR)
  // ==========================================
  const djBoothGroup = new THREE.Group();
  djBoothGroup.position.set(0, stageElevation, stageCenterZ + 0.3);

  // Mueble de la cabina
  const deskGeo = new THREE.BoxGeometry(2.4, 0.98, 0.95);
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3, metalness: 0.8 });
  const deskMesh = new THREE.Mesh(deskGeo, deskMat);
  deskMesh.position.y = 0.98 / 2;
  deskMesh.castShadow = true;
  djBoothGroup.add(deskMesh);

  // Borde neón de la mesa
  const neonDeskBorder = new THREE.Mesh(
    new THREE.BoxGeometry(2.44, 0.05, 0.98),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  neonDeskBorder.position.y = 0.98;
  djBoothGroup.add(neonDeskBorder);

  // Cartel LED frontal brillante del club
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const signCtx = signCanvas.getContext('2d');
  signCtx.fillStyle = '#050811';
  signCtx.fillRect(0, 0, 512, 128);
  signCtx.strokeStyle = '#ec4899';
  signCtx.lineWidth = 6;
  signCtx.strokeRect(6, 6, 500, 116);
  signCtx.fillStyle = '#ffffff';
  signCtx.font = '900 46px sans-serif';
  signCtx.textAlign = 'center';
  signCtx.textBaseline = 'middle';
  signCtx.fillText('🎧 DJ LIVE CLUB 🔥', 256, 64);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.46), signMat);
  signMesh.position.set(0, 0.52, 0.49);
  djBoothGroup.add(signMesh);

  // Plato DJ Izquierdo (Tornamesa Jog Wheel)
  const platterGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.04, 24);
  const platterMatL = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
  const platterL = new THREE.Mesh(platterGeo, platterMatL);
  platterL.position.set(-0.68, 1.0, 0.06);
  djBoothGroup.add(platterL);

  const ringL = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.27, 24),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
  );
  ringL.rotation.x = -Math.PI / 2;
  ringL.position.y = 0.022;
  platterL.add(ringL);

  // Plato DJ Derecho (Tornamesa Jog Wheel)
  const platterMatR = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
  const platterR = new THREE.Mesh(platterGeo, platterMatR);
  platterR.position.set(0.68, 1.0, 0.06);
  djBoothGroup.add(platterR);

  const ringR = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.27, 24),
    new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide })
  );
  ringR.rotation.x = -Math.PI / 2;
  ringR.position.y = 0.022;
  platterR.add(ringR);

  // Mezclador Central (Mixer Unit)
  const mixerGeo = new THREE.BoxGeometry(0.5, 0.03, 0.65);
  const mixerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
  const mixerMesh = new THREE.Mesh(mixerGeo, mixerMat);
  mixerMesh.position.set(0, 1.0, 0.06);
  djBoothGroup.add(mixerMesh);

  // Vúmetros LED
  const vuLeds = [];
  const vuColors = [0x22c55e, 0x22c55e, 0x22c55e, 0xfacc15, 0xfacc15, 0xef4444];
  for (let ch = -1; ch <= 1; ch += 2) {
    for (let l = 0; l < 6; l++) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.015, 0.025),
        new THREE.MeshBasicMaterial({ color: vuColors[l] })
      );
      led.position.set(ch * 0.08, 1.02, -0.15 + l * 0.045);
      djBoothGroup.add(led);
      vuLeds.push({ mesh: led, level: (l + 1) / 6 });
    }
  }

  // Laptop del DJ
  const laptopBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.02, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
  );
  laptopBase.position.set(-0.76, 1.03, -0.22);
  laptopBase.rotation.y = 0.25;
  djBoothGroup.add(laptopBase);

  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.24, 0.015),
    new THREE.MeshBasicMaterial({ color: 0x0284c7 })
  );
  laptopScreen.position.set(-0.76, 1.15, -0.33);
  laptopScreen.rotation.x = -0.25;
  laptopScreen.rotation.y = 0.25;
  djBoothGroup.add(laptopScreen);

  stageGroup.add(djBoothGroup);

  // ==========================================
  // 5. BOCINAS GIGANTES DE CONCIERTO (CONOS PULSANTES)
  // ==========================================
  const speakers = [];
  function createSpeakerTower(x, z, rotY) {
    const spkGroup = new THREE.Group();
    spkGroup.position.set(x, stageElevation + 1.6, z);
    spkGroup.rotation.y = rotY;

    // Caja acústica de madera negra
    const boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 3.2, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x090d16 })
    );
    boxMesh.castShadow = true;
    spkGroup.add(boxMesh);

    // Borde de neón en la bocina
    const spkNeon = new THREE.Mesh(
      new THREE.BoxGeometry(1.44, 0.04, 1.24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    spkNeon.position.y = 1.6;
    spkGroup.add(spkNeon);

    // Cono de subwoofer grande (inferior)
    const coneGeo = new THREE.CylinderGeometry(0.48, 0.2, 0.22, 24);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.3, roughness: 0.5 });
    const subCone = new THREE.Mesh(coneGeo, coneMat);
    subCone.rotation.x = Math.PI / 2;
    subCone.position.set(0, -0.65, 0.55);
    spkGroup.add(subCone);

    // Cono de subwoofer mediano (centro)
    const midCone = new THREE.Mesh(coneGeo, coneMat);
    midCone.rotation.x = Math.PI / 2;
    midCone.position.set(0, 0.2, 0.55);
    spkGroup.add(midCone);

    // Trompeta de agudos (superior)
    const tweetCone = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.35, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    tweetCone.position.set(0, 1.05, 0.56);
    spkGroup.add(tweetCone);

    stageGroup.add(spkGroup);
    speakers.push({ group: spkGroup, subCone, midCone });
  }

  createSpeakerTower(-3.6, stageCenterZ + 0.4, 0.25);
  createSpeakerTower(3.6, stageCenterZ + 0.4, -0.25);

  // ==========================================
  // 6. BARRA DE BAR VIP ILUMINADA (ESTILO NIGHTCLUB REAL)
  // ==========================================
  const barGroup = new THREE.Group();
  const barX = -5.8;
  const barZStart = -4.5;
  const barZEnd = 2.5;
  const barLength = Math.abs(barZEnd - barZStart);

  // Mostrador del Bar (Bar Counter)
  const counterGeo = new THREE.BoxGeometry(1.1, 1.15, barLength);
  const counterMat = new THREE.MeshStandardMaterial({
    color: 0x0c1322,
    roughness: 0.2,
    metalness: 0.7
  });
  const counterMesh = new THREE.Mesh(counterGeo, counterMat);
  counterMesh.position.set(barX, 1.15 / 2, (barZStart + barZEnd) / 2);
  counterMesh.receiveShadow = true;
  barGroup.add(counterMesh);

  // Cubierta superior del bar (mármol negro pulido)
  const topBarMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.08, barLength + 0.1),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.1, metalness: 0.9 })
  );
  topBarMesh.position.set(barX, 1.18, (barZStart + barZEnd) / 2);
  barGroup.add(topBarMesh);

  // Tira de neón debajo del mostrador del bar
  const barNeon = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, barLength),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  barNeon.position.set(barX + 0.58, 1.12, (barZStart + barZEnd) / 2);
  barGroup.add(barNeon);

  // Reposapiés metálico cromado del bar
  const footRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, barLength, 12),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
  );
  footRail.position.set(barX + 0.62, 0.22, (barZStart + barZEnd) / 2);
  barGroup.add(footRail);

  // Estantería trasera de botellas iluminadas (Back-Bar Shelves)
  const shelfX = barX - 1.2;
  const shelfBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 3.2, barLength),
    new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.4 })
  );
  shelfBack.position.set(shelfX, 1.9, (barZStart + barZEnd) / 2);
  barGroup.add(shelfBack);

  // 3 Niveles de estantes con botellas de colores iluminadas
  const bottlePalette = [0x00f0ff, 0xec4899, 0x22c55e, 0xfacc15, 0xa855f7, 0xef4444];
  for (let s = 0; s < 3; s++) {
    const shelfY = 0.9 + s * 0.8;
    const shelfBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.04, barLength - 0.2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    shelfBoard.position.set(shelfX + 0.15, shelfY, (barZStart + barZEnd) / 2);
    barGroup.add(shelfBoard);

    // Botellas en el estante
    for (let b = 0; b < 14; b++) {
      const bZ = barZStart + 0.4 + b * ((barLength - 0.8) / 14);
      const bColor = bottlePalette[(s * 3 + b) % bottlePalette.length];
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8),
        new THREE.MeshBasicMaterial({ color: bColor })
      );
      bottle.position.set(shelfX + 0.15, shelfY + 0.14, bZ);
      barGroup.add(bottle);
    }
  }

  // Cartel de Neón sobre el bar
  const barSignCanvas = document.createElement('canvas');
  barSignCanvas.width = 384;
  barSignCanvas.height = 96;
  const bctx = barSignCanvas.getContext('2d');
  bctx.fillStyle = '#0f172a';
  bctx.fillRect(0, 0, 384, 96);
  bctx.fillStyle = '#38bdf8';
  bctx.font = '900 36px sans-serif';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText('🍸 VIP LOUNGE', 192, 48);
  const barSignTex = new THREE.CanvasTexture(barSignCanvas);
  const barSignMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.6),
    new THREE.MeshBasicMaterial({ map: barSignTex, transparent: true })
  );
  barSignMesh.position.set(barX, 3.8, (barZStart + barZEnd) / 2);
  barSignMesh.rotation.y = Math.PI / 2;
  barGroup.add(barSignMesh);

  // Taburetes de bar cromados frente al mostrador
  const stoolCount = 6;
  for (let st = 0; st < stoolCount; st++) {
    const stZ = barZStart + 0.6 + st * ((barLength - 1.2) / (stoolCount - 1));
    const stoolGroup = new THREE.Group();
    stoolGroup.position.set(barX + 1.0, 0, stZ);

    // Pata cromada y base
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.65, 10),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    leg.position.y = 0.65 / 2;
    stoolGroup.add(leg);

    const baseStool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    baseStool.position.y = 0.015;
    stoolGroup.add(baseStool);

    // Asiento circular de cuero rojo o azul
    const seat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: st % 2 === 0 ? 0xef4444 : 0x0284c7, roughness: 0.4 })
    );
    seat.position.y = 0.65;
    stoolGroup.add(seat);

    barGroup.add(stoolGroup);
  }

  stageGroup.add(barGroup);

  // ==========================================
  // 7. MESAS ALTAS DE CÓCTEL VIP (LOUNGE LATERAL DERECHO)
  // ==========================================
  const vipTables = [];
  const vipTableCoords = [
    { x: 5.4, z: -3.0 },
    { x: 5.6, z: -1.0 },
    { x: 5.4, z: 1.0 },
    { x: 5.6, z: 3.0 }
  ];

  vipTableCoords.forEach(pos => {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(pos.x, 0, pos.z);

    // Base y pedestal cromado
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    pedestal.position.y = 1.05 / 2;
    tableGroup.add(pedestal);

    const tBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    tBase.position.y = 0.015;
    tableGroup.add(tBase);

    // Tapa de cristal circular con borde de neón
    const topGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 })
    );
    topGlass.position.y = 1.05;
    tableGroup.add(topGlass);

    const tableNeonRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.02, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xec4899 })
    );
    tableNeonRim.rotation.x = Math.PI / 2;
    tableNeonRim.position.y = 1.06;
    tableGroup.add(tableNeonRim);

    // Botella y copa en la mesa
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    bottle.position.set(0.12, 1.18, 0.05);
    tableGroup.add(bottle);

    stageGroup.add(tableGroup);
    vipTables.push(tableGroup);
  });

  // ==========================================
  // 8. BOLA DE DISCOTECA GIRATORIA DE ESPEJOS
  // ==========================================
  const discoBallGroup = new THREE.Group();
  discoBallGroup.position.set(0, 6.8, 0.5);

  const ballGeo = new THREE.SphereGeometry(0.85, 24, 24);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.95,
    roughness: 0.1,
    flatShading: true
  });
  const discoBall = new THREE.Mesh(ballGeo, ballMat);
  discoBallGroup.add(discoBall);

  // Varilla cromada al techo
  const rodGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.5, 8);
  const rod = new THREE.Mesh(rodGeo, new THREE.MeshBasicMaterial({ color: 0x475569 }));
  rod.position.y = 1.25;
  discoBallGroup.add(rod);

  stageGroup.add(discoBallGroup);

  // ==========================================
  // 9. CUATRO FOCOS MÓVILES VOLUMÉTRICOS (LIGHT CONES)
  // ==========================================
  const spotLights = [];
  const spotColors = [0x00f0ff, 0xec4899, 0xa855f7, 0xfacc15];

  for (let i = 0; i < 4; i++) {
    const spotGroup = new THREE.Group();
    const xPos = -4.5 + i * 3.0;
    spotGroup.position.set(xPos, 6.2, -4.8);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    spotGroup.add(base);

    const headPivot = new THREE.Group();
    headPivot.position.y = -0.2;
    spotGroup.add(headPivot);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    headPivot.add(headMesh);

    const coneGeo = new THREE.ConeGeometry(1.8, 10, 16, 1, true);
    coneGeo.translate(0, -5.0, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: spotColors[i],
      transparent: true,
      opacity: 0.25,
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
  // 10. SISTEMA DE CONFETI CELEBRATORIO
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

  function burstConfetti(origin = new THREE.Vector3(0, 4.0, stageCenterZ)) {
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
  // 11. ILUMINACIÓN AMBIENTAL DE DISCOTECA
  // ==========================================
  const stageAmbient = new THREE.AmbientLight(0x38bdf8, 0.7);
  scene.add(stageAmbient);

  const stageDirectional = new THREE.DirectionalLight(0xffffff, 1.3);
  stageDirectional.position.set(2, 10, 8);
  stageDirectional.castShadow = true;
  scene.add(stageDirectional);

  scene.add(stageGroup);

  let isExtremeMode = false;
  let extremeTimer = 0;

  function triggerExtremeDisco(duration = 6.0) {
    isExtremeMode = true;
    extremeTimer = duration;
    burstConfetti(new THREE.Vector3(0, 5, stageCenterZ));
  }

  // ==========================================
  // API PÚBLICA DEL ESCENARIO
  // ==========================================
  return {
    stageGroup,
    setLedData() {},
    burstConfetti,
    triggerExtremeDisco,
    update(time, delta, audioLevels = { bass: 0, mid: 0, overall: 0 }) {
      if (isExtremeMode) {
        extremeTimer -= delta;
        if (extremeTimer <= 0) {
          isExtremeMode = false;
        }
      }

      // 0. Tornamesas girando en tiempo real y Vúmetros reactivos al beat
      const platterSpeed = 3.5 + (audioLevels.bass || 0) * 4.5;
      platterL.rotation.y += platterSpeed * delta;
      platterR.rotation.y += platterSpeed * 0.9 * delta;

      const vuLevel = Math.min(1.0, (audioLevels.bass || 0) * 1.35 + (audioLevels.mid || 0) * 0.4);
      for (let v of vuLeds) {
        v.mesh.visible = vuLevel >= (v.level * 0.7);
      }

      // 1. Bola de discoteca rotando
      const ballSpeed = isExtremeMode ? 3.5 : 0.8;
      discoBall.rotation.y += ballSpeed * delta;

      // 2. Focos móviles barriendo el club
      for (let i = 0; i < spotLights.length; i++) {
        const spot = spotLights[i];
        const sweepSpeed = isExtremeMode ? 6.0 : 2.2;
        const sweepX = Math.sin(time * sweepSpeed + i * 1.2) * 0.45;
        const sweepZ = Math.cos(time * (sweepSpeed * 0.8) + i * 1.5) * 0.35;
        spot.headPivot.rotation.z = sweepX;
        spot.headPivot.rotation.x = 0.4 + sweepZ;

        if (isExtremeMode) {
          spot.coneMat.opacity = Math.sin(time * 24 + i) > 0 ? 0.45 : 0.05;
        } else {
          spot.coneMat.opacity = 0.18 + audioLevels.mid * 0.35;
        }
      }

      // 3. Subwoofers bombeando físicamente con el bajo
      const bassPunch = 1.0 + (audioLevels.bass || 0) * 0.45;
      for (let s of speakers) {
        s.subCone.scale.set(bassPunch, bassPunch, 1.0 + audioLevels.bass * 0.8);
        if (s.midCone) s.midCone.scale.set(bassPunch * 0.9, bassPunch * 0.9, 1.0 + audioLevels.bass * 0.5);
      }

      // 4. Baldosas LED de la pista iluminándose al ritmo de la música
      const wave = time * 4.5;
      const bassEnergy = audioLevels.bass || 0;
      for (let i = 0; i < ledTiles.length; i++) {
        const t = ledTiles[i];
        const dist = Math.hypot(t.col - 3.5, t.row - 4.5);
        const pulse = Math.sin(wave - dist * 0.75) * 0.5 + 0.5;

        if (bassEnergy > 0.45) {
          // Pulso explosivo de bajo
          t.mat.opacity = 0.4 + bassEnergy * 0.55;
        } else {
          t.mat.opacity = 0.2 + pulse * 0.55;
        }
      }

      // 5. Partículas de confeti
      for (let c = 0; c < confettiPool.length; c++) {
        const p = confettiPool[c];
        if (!p.mesh.visible) continue;
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
          continue;
        }
        p.velocity.y -= 4.5 * delta;
        p.velocity.x *= 0.98;
        p.velocity.z *= 0.98;
        p.mesh.position.addScaledVector(p.velocity, delta);

        p.mesh.rotation.x += p.rotSpeed.x * delta;
        p.mesh.rotation.y += p.rotSpeed.y * delta;
      }

      // 6. Ecualizador de Espectro Neón Gigante 3D (RTA Spectrum Wall)
      const hasAudio = (audioLevels.overall || 0) > 0.04;
      const bassLvl = audioLevels.bass || 0;
      const midLvl = audioLevels.mid || 0;
      const trebLvl = audioLevels.treble || 0;

      for (let i = 0; i < spectrumColumns.length; i++) {
        const col = spectrumColumns[i];
        let targetH = 0.04; // Altura mínima en reposo

        if (hasAudio) {
          // Curva de frecuencia espectral por bandas
          const normIdx = i / (spectrumColumns.length - 1);
          let bandVal = 0;
          if (normIdx < 0.3) {
            // Banda de bajos (columnas 0-6)
            bandVal = bassLvl * 1.1 + Math.sin(time * 14 + i * 0.8) * 0.12;
          } else if (normIdx < 0.7) {
            // Banda de medios (columnas 7-14)
            bandVal = midLvl * 1.15 + Math.cos(time * 16 + i * 0.9) * 0.15;
          } else {
            // Banda de agudos (columnas 15-21)
            bandVal = trebLvl * 1.25 + Math.sin(time * 20 + i * 1.1) * 0.14;
          }
          targetH = Math.min(1.0, Math.max(0.05, bandVal));
        }

        // Interpolación fluida (spring decay)
        const lerpSpeed = targetH > col.currentH ? 24 : 10;
        col.currentH += (targetH - col.currentH) * Math.min(1.0, delta * lerpSpeed);
        col.colGroup.scale.y = col.currentH;

        // Fisiología del indicador de pico flotante (Peak-Hold)
        if (col.currentH >= col.peakH) {
          col.peakH = col.currentH;
          col.peakHold = 0.18; // Retener pico por 180ms
        } else {
          if (col.peakHold > 0) {
            col.peakHold -= delta;
          } else {
            col.peakH = Math.max(col.currentH, col.peakH - delta * 1.4);
          }
        }

        col.capMesh.position.y = col.baseY + col.peakH * maxBarH + 0.04;
      }
    }
  };
}