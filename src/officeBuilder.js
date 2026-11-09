import * as THREE from 'three';

/**
 * Constructor de la Oficina 3D estilo cartoon moderna.
 * Retorna el grupo con todos los elementos y el array de colisionadores para la física de navegación.
 */
export function buildOfficeScene(scene) {
  const officeGroup = new THREE.Group();
  officeGroup.name = 'OfficeEnvironment';

  const colliders = [];

  // Función auxiliar para registrar colisionadores AABB (en el plano XZ)
  function addCollider(minX, maxX, minZ, maxZ, label = 'obstacle') {
    colliders.push({ minX, maxX, minZ, maxZ, label });
  }

  // ==========================================
  // 1. MATERIALES CARTOON
  // ==========================================
  const floorWoodMat = new THREE.MeshLambertMaterial({ color: 0xd6c2a8 }); // Madera clara cálida
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }); // Blanco roto moderno
  const wallAccentMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 }); // Acento cian
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.35
  });
  const deskWoodMat = new THREE.MeshLambertMaterial({ color: 0xeadbc8 });
  const metalMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
  const plantLeafMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
  const potMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });

  // ==========================================
  // 2. SUELO Y ALFOMBRAS DE ZONAS
  // ==========================================
  const officeWidth = 28;
  const officeDepth = 24;

  // Suelo principal
  const floorGeo = new THREE.PlaneGeometry(officeWidth, officeDepth);
  const floorMesh = new THREE.Mesh(floorGeo, floorWoodMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  officeGroup.add(floorMesh);

  // Alfombras zonales para distinguir departamentos
  function createCarpet(x, z, w, d, color) {
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, z);
    mesh.receiveShadow = true;
    officeGroup.add(mesh);
  }

  createCarpet(0, -9, 8, 5, 0xede9fe);     // Alfombra recepción (lila suave)
  createCarpet(-8, -1, 7, 5, 0xcffafe);    // Alfombra Laura (cian tech)
  createCarpet(-8, 5, 7, 5, 0xd1fae5);     // Alfombra Carlos (verde finanzas)
  createCarpet(8, 5, 7, 5, 0xfef3c7);      // Alfombra Andrés (ámbar IT)
  createCarpet(8, -6, 8, 8, 0xfee2e2);     // Alfombra Mariana (rosa/coral ejecutivo)
  createCarpet(0, 5, 5, 8, 0xe2e8f0);      // Pasillo central

  // ==========================================
  // 3. PAREDES EXTERIORES Y LÍMITES
  // ==========================================
  const wallHeight = 4.0;
  const wallThickness = 0.5;

  function createWall(x, z, w, d, height = wallHeight, material = wallMat, registerCol = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    officeGroup.add(mesh);

    if (registerCol) {
      addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 'wall');
    }
    return mesh;
  }

  // Pared Norte (Z = -12) con puerta de entrada abierta al centro
  createWall(-8.5, -12, 11, wallThickness);
  createWall(8.5, -12, 11, wallThickness);
  // Registro de colisión para la pared norte (excepto entrada en X [-3, 3])
  // Pared Sur (Z = +12)
  createWall(0, 12, officeWidth, wallThickness);
  // Pared Oeste (X = -14)
  createWall(-14, 0, wallThickness, officeDepth);
  // Pared Este (X = +14)
  createWall(14, 0, wallThickness, officeDepth);

  // Límites perimetrales de seguridad para el jugador
  addCollider(-15, -13.5, -13, 13, 'bound_W');
  addCollider(13.5, 15, -13, 13, 'bound_E');
  addCollider(-15, 15, 11.5, 13, 'bound_S');
  addCollider(-15, 15, -13, -11.5, 'bound_N');

  // ==========================================
  // 4. VENTANAS Y CIUDAD CARTOON EXTERIOR
  // ==========================================
  // Grandes ventanales en la pared Oeste con vistas a edificios cartoon
  for (let i = -8; i <= 8; i += 5.5) {
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 2.5, 3.8),
      glassMat
    );
    windowFrame.position.set(-13.9, 2.2, i);
    officeGroup.add(windowFrame);
  }

  // Edificios y cielo cartoon visibles por las ventanas
  const skyMesh = new THREE.Mesh(
    new THREE.BoxGeometry(60, 30, 60),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.BackSide })
  );
  skyMesh.position.y = 12;
  officeGroup.add(skyMesh);

  // Bloques de rascacielos cartoon de fondo
  const cityColors = [0x93c5fd, 0xa5b4fc, 0xbfdbfe, 0xc7d2fe];
  for (let j = 0; j < 12; j++) {
    const bh = 10 + Math.random() * 15;
    const bw = 3 + Math.random() * 4;
    const bd = 3 + Math.random() * 4;
    const bColor = cityColors[j % cityColors.length];
    const bMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshLambertMaterial({ color: bColor })
    );
    bMesh.position.set(-24 - Math.random() * 10, bh / 2 - 2, (j - 6) * 6);
    officeGroup.add(bMesh);
  }

  // ==========================================
  // 5. DIVISIONES INTERNAS (OFICINA GERENCIA & SALA REUNIONES)
  // ==========================================
  // Pared divisoria para la oficina de Mariana (Gerencia en X > 3, Z de -12 a -2)
  createWall(8.5, -2, 11, 0.2, 3.5, wallMat);
  createWall(3.2, -6, 0.2, 5, 3.5, wallMat); // Muro con cristal
  // Ventanal de cristal divisorio en el despacho
  const execGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.4, 3.0),
    glassMat
  );
  execGlass.position.set(3.2, 1.8, -9.5);
  officeGroup.add(execGlass);
  addCollider(3.0, 3.4, -11, -8.0, 'exec_glass');

  // Letrero elegante "GERENCIA"
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.4, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x1e293b })
  );
  signMesh.position.set(3.2, 2.6, -4.5);
  officeGroup.add(signMesh);

  // ==========================================
  // 6. MUEBLES: RECEPCIÓN (Sofía)
  // ==========================================
  // Mostrador curvo de recepción moderno
  const deskCenter = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.15, 0.9),
    new THREE.MeshLambertMaterial({ color: 0x3b82f6 })
  );
  deskCenter.position.set(0, 1.15 / 2, -7.5);
  deskCenter.castShadow = true;
  deskCenter.receiveShadow = true;
  officeGroup.add(deskCenter);

  // Encimera superior de madera elegante
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.1, 1.1),
    deskWoodMat
  );
  deskTop.position.set(0, 1.18, -7.5);
  deskTop.castShadow = true;
  officeGroup.add(deskTop);

  // Logotipo en el frente del mostrador "OFFICE 3D"
  const logoPlacard = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  logoPlacard.position.set(0, 0.65, -7.02);
  officeGroup.add(logoPlacard);

  addCollider(-2.4, 2.4, -8.2, -6.8, 'reception_desk');

  // Monitor de recepción
  createMonitor(0, 1.25, -7.5, Math.PI, 0x0284c7);

  // Sofá de espera en recepción
  createSofa(-4.5, -9.5, 0);
  addCollider(-5.5, -3.5, -10.5, -8.5, 'reception_sofa');

  // Mesita de centro de espera
  const coffeeTable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.45, 24),
    deskWoodMat
  );
  coffeeTable.position.set(-4.5, 0.22, -8.2);
  coffeeTable.castShadow = true;
  officeGroup.add(coffeeTable);
  addCollider(-5.2, -3.8, -8.9, -7.5, 'coffee_table');

  // ==========================================
  // 7. MUEBLES: PUESTOS DE TRABAJO (Laura & Carlos)
  // ==========================================
  // Función constructora de escritorio completo con monitores y accesorios
  function createWorkstation(x, z, rotY, isLaura = false) {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(x, 0, z);
    deskGroup.rotation.y = rotY;

    // Tablero del escritorio
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.1, 1.4),
      deskWoodMat
    );
    top.position.y = 0.85;
    top.castShadow = true;
    deskGroup.add(top);

    // Patas de metal
    for (let dx of [-1.25, 1.25]) {
      for (let dz of [-0.55, 0.55]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12), metalMat);
        leg.position.set(dx, 0.85 / 2, dz);
        leg.castShadow = true;
        deskGroup.add(leg);
      }
    }

    // Panel separador acústico
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.6, 0.06),
      new THREE.MeshLambertMaterial({ color: isLaura ? 0x06b6d4 : 0x10b981 })
    );
    divider.position.set(0, 1.15, -0.65);
    divider.castShadow = true;
    deskGroup.add(divider);

    // Monitores
    if (isLaura) {
      // Dos monitores grandes con código fluorescente
      createMonitor(-0.55, 0.9, -0.2, 0, 0x0f172a, deskGroup);
      createMonitor(0.55, 0.9, -0.2, -0.15, 0x0f172a, deskGroup);
      // Teclado mecánico
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.22), metalMat);
      kb.position.set(0, 0.91, 0.2);
      deskGroup.add(kb);
      // Taza de café
      createMug(0.7, 0.9, 0.25, 0xef4444, deskGroup);
    } else {
      // Carlos: Monitor con hoja de cálculo + archivador de carpetas
      createMonitor(0, 0.9, -0.2, 0, 0x10b981, deskGroup);
      // Archivador de carpetas
      const folderMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.3, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x3b82f6 })
      );
      folderMesh.position.set(-0.85, 1.05, 0);
      deskGroup.add(folderMesh);
      // Calculadora
      const calc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.3), metalMat);
      calc.position.set(0.5, 0.91, 0.2);
      deskGroup.add(calc);
      createMug(-0.5, 0.9, 0.3, 0x3b82f6, deskGroup);
    }

    // Silla de oficina ergonómica
    createOfficeChair(0, 0, 0.75, Math.PI, deskGroup);

    officeGroup.add(deskGroup);

    // Collider en coordenadas globales aproximadas
    addCollider(x - 1.6, x + 1.6, z - 1.2, z + 1.2, isLaura ? 'desk_laura' : 'desk_carlos');
  }

  // Puesto de Laura (Desarrolladora)
  createWorkstation(-8, -1, 0, true);
  // Puesto de Carlos (Contador)
  createWorkstation(-8, 5, Math.PI, false);

  // ==========================================
  // 8. MUEBLES: SOPORTE TI & RACK DE SERVIDORES (Andrés)
  // ==========================================
  const itGroup = new THREE.Group();
  itGroup.position.set(8, 0, 5);

  // Banco de trabajo técnico
  const itBenchTop = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 1.4), deskWoodMat);
  itBenchTop.position.y = 0.85;
  itBenchTop.castShadow = true;
  itGroup.add(itBenchTop);

  for (let dx of [-1.35, 1.35]) {
    for (let dz of [-0.55, 0.55]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 12), metalMat);
      leg.position.set(dx, 0.85 / 2, dz);
      itGroup.add(leg);
    }
  }

  // Torre de PC desarmada con componentes visibles
  const pcTower = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.55, 0.55),
    new THREE.MeshLambertMaterial({ color: 0x1e293b })
  );
  pcTower.position.set(-0.85, 1.15, -0.1);
  itGroup.add(pcTower);

  // Monitor de diagnósticos y terminal
  createMonitor(0.2, 0.9, -0.2, 0, 0xf59e0b, itGroup);

  // Caja de herramientas roja
  const toolBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.25, 0.3),
    new THREE.MeshLambertMaterial({ color: 0xdc2626 })
  );
  toolBox.position.set(0.9, 1.0, 0.2);
  itGroup.add(toolBox);

  // Silla ergonómica de Andrés
  createOfficeChair(0, 0, 0.75, Math.PI, itGroup);

  officeGroup.add(itGroup);
  addCollider(6.4, 9.6, 3.8, 6.2, 'desk_it');

  // Rack de Servidores con luces LED parpadeantes
  const serverRack = new THREE.Group();
  serverRack.position.set(11.5, 0, 5);

  const rackFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.8, 1.0),
    new THREE.MeshLambertMaterial({ color: 0x0f172a })
  );
  rackFrame.position.y = 1.4;
  rackFrame.castShadow = true;
  serverRack.add(rackFrame);

  // Filas de servidores en el interior con leds
  for (let k = 0; k < 6; k++) {
    const unitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.25, 0.85),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    unitMesh.position.set(0, 0.5 + k * 0.38, 0.05);
    serverRack.add(unitMesh);

    // LEDs luminosos
    const ledMat = new THREE.MeshBasicMaterial({ color: k % 2 === 0 ? 0x22c55e : 0x06b6d4 });
    const ledMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.02), ledMat);
    ledMesh.position.set(0.3, 0.5 + k * 0.38, 0.5);
    serverRack.add(ledMesh);
  }

  officeGroup.add(serverRack);
  addCollider(10.7, 12.3, 4.3, 5.7, 'server_rack');

  // ==========================================
  // 9. MUEBLES: OFICINA DE GERENCIA (Mariana)
  // ==========================================
  const execGroup = new THREE.Group();
  execGroup.position.set(7.5, 0, -6.5);

  // Escritorio de dirección grande
  const execDesk = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.12, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x3f2e20 })
  );
  execDesk.position.y = 0.88;
  execDesk.castShadow = true;
  execGroup.add(execDesk);

  // Faldón de madera noble del escritorio
  const modestyPanel = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.7, 0.06),
    new THREE.MeshLambertMaterial({ color: 0x4a3728 })
  );
  modestyPanel.position.set(0, 0.45, 0.6);
  execGroup.add(modestyPanel);

  // Laptop ejecutiva ultrafina
  const laptopBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.02, 0.34),
    new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
  );
  laptopBase.position.set(0, 0.95, -0.1);
  execGroup.add(laptopBase);

  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.32, 0.02),
    new THREE.MeshLambertMaterial({ color: 0x0f172a })
  );
  laptopScreen.position.set(0, 1.1, -0.26);
  laptopScreen.rotation.x = -0.2;
  execGroup.add(laptopScreen);

  // Silla ejecutiva imponente
  createOfficeChair(0, 0, -0.75, 0, execGroup, 0x1e1b4b);

  // Pizarra con gráficos en la pared del fondo
  const whiteboard = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.4, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  whiteboard.position.set(0, 2.2, -4.9);
  execGroup.add(whiteboard);

  // Gráfico de barras cartoon en la pizarra
  const barMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  for (let b = 0; b < 4; b++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2 + b * 0.18, 0.02), barMat);
    bar.position.set(-0.6 + b * 0.4, 1.8 + b * 0.09, -4.85);
    execGroup.add(bar);
  }

  officeGroup.add(execGroup);
  addCollider(5.8, 9.2, -7.5, -5.5, 'exec_desk');

  // ==========================================
  // 10. SALA DE REUNIONES Y LOUNGE
  // ==========================================
  const meetingGroup = new THREE.Group();
  meetingGroup.position.set(0, 0, 7.5);

  // Mesa de conferencias ovalada / rectangular redondeada
  const confTable = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.1, 32),
    deskWoodMat
  );
  confTable.position.y = 0.85;
  confTable.scale.set(1.6, 1, 1);
  confTable.castShadow = true;
  meetingGroup.add(confTable);

  const confLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.85, 16), metalMat);
  confLeg.position.y = 0.42;
  meetingGroup.add(confLeg);

  // Sillas de conferencia alrededor de la mesa
  const chairPositions = [
    { x: -1.8, z: 0, r: Math.PI / 2 },
    { x: 1.8, z: 0, r: -Math.PI / 2 },
    { x: -0.9, z: -1.2, r: 0 },
    { x: 0.9, z: -1.2, r: 0 },
    { x: -0.9, z: 1.2, r: Math.PI },
    { x: 0.9, z: 1.2, r: Math.PI }
  ];

  for (let cp of chairPositions) {
    createOfficeChair(cp.x, 0, cp.z, cp.r, meetingGroup, 0x64748b);
  }

  officeGroup.add(meetingGroup);
  addCollider(-2.6, 2.6, 6.0, 9.0, 'meeting_table');

  // Dispensador de agua y máquina de café (Coffee Lounge en X ≈ -2.5, Z ≈ 2.5)
  const coffeeStation = new THREE.Group();
  coffeeStation.position.set(-3.5, 0, 2.5);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.8), deskWoodMat);
  counter.position.y = 0.45;
  coffeeStation.add(counter);

  // Cafetera cartoon
  const coffeeMaker = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.45, 0.35),
    new THREE.MeshLambertMaterial({ color: 0xef4444 })
  );
  coffeeMaker.position.set(-0.25, 0.9 + 0.22, 0);
  coffeeStation.add(coffeeMaker);

  // Dispensador de agua con botella azul transparente
  const waterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16), metalMat);
  waterBase.position.set(0.35, 0.9 + 0.35, 0);
  coffeeStation.add(waterBase);

  const waterBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.5, 16),
    new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })
  );
  waterBottle.position.set(0.35, 0.9 + 0.85, 0);
  coffeeStation.add(waterBottle);

  officeGroup.add(coffeeStation);
  addCollider(-4.4, -2.6, 1.9, 3.1, 'coffee_counter');

  // ==========================================
  // 11. PLANTAS DECORATIVAS CARTOON
  // ==========================================
  function createPottedPlant(x, z, scale = 1.0) {
    const plant = new THREE.Group();
    plant.position.set(x, 0, z);
    plant.scale.setScalar(scale);

    // Maceta naranja cálida
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.24, 0.5, 16),
      potMat
    );
    pot.position.y = 0.25;
    pot.castShadow = true;
    plant.add(pot);

    // Hojas redondeadas cartoon superpuestas
    const leafGeo = new THREE.SphereGeometry(0.25, 12, 12);
    leafGeo.scale(1, 1.8, 0.3);

    for (let l = 0; l < 5; l++) {
      const angle = (l / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeo, plantLeafMat);
      leaf.position.set(Math.cos(angle) * 0.18, 0.55 + (l % 2) * 0.1, Math.sin(angle) * 0.18);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.35;
      leaf.castShadow = true;
      plant.add(leaf);
    }

    officeGroup.add(plant);
    addCollider(x - 0.45 * scale, x + 0.45 * scale, z - 0.45 * scale, z + 0.45 * scale, 'plant');
  }

  // Plantas en esquinas y pasillos
  createPottedPlant(-12.5, -10.5, 1.2);
  createPottedPlant(12.5, -10.5, 1.2);
  createPottedPlant(-12.5, 10.5, 1.3);
  createPottedPlant(12.5, 10.5, 1.3);
  createPottedPlant(2.2, -7.5, 0.9);
  createPottedPlant(-2.2, -7.5, 0.9);
  createPottedPlant(-3.5, 5, 0.9);
  createPottedPlant(3.5, 5, 0.9);

  // ==========================================
  // 12. ILUMINACIÓN INTERIOR
  // ==========================================
  // Luz de sol ambiental que entra por los ventanales
  const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
  sunLight.position.set(-15, 18, -8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // Luz de relleno cálida de oficina
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  // Puntos de luz en zonas de escritorio
  const lightReception = new THREE.PointLight(0x60a5fa, 1.2, 8);
  lightReception.position.set(0, 3.2, -7.5);
  scene.add(lightReception);

  const lightMeeting = new THREE.PointLight(0xfef08a, 1.2, 10);
  lightMeeting.position.set(0, 3.2, 7.5);
  scene.add(lightMeeting);

  scene.add(officeGroup);
  return { officeGroup, colliders };
}

// ==========================================
// HELPERS PARA PROPS
// ==========================================
function createMonitor(x, y, z, rotY = 0, screenColor = 0x0284c7, parent = null) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.03, 16), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
  group.add(base);

  // Pie
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0x334155 }));
  stand.position.y = 0.11;
  group.add(stand);

  // Marco de la pantalla
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.52, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x0f172a })
  );
  frame.position.y = 0.35;
  frame.castShadow = true;
  group.add(frame);

  // Pantalla con brillo
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.46),
    new THREE.MeshBasicMaterial({ color: screenColor })
  );
  screen.position.set(0, 0.35, 0.022);
  group.add(screen);

  if (parent) parent.add(group);
  return group;
}

function createOfficeChair(x, y, z, rotY = 0, parent = null, seatColor = 0x0284c7) {
  const chair = new THREE.Group();
  chair.position.set(x, y, z);
  chair.rotation.y = rotY;

  const seatMat = new THREE.MeshLambertMaterial({ color: seatColor });
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

  // Asiento
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.52), seatMat);
  seat.position.y = 0.48;
  chair.add(seat);

  // Respaldo
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.6, 0.08), seatMat);
  back.position.set(0, 0.78, -0.22);
  chair.add(back);

  // Pata central
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), frameMat);
  post.position.y = 0.22;
  chair.add(post);

  // Ruedas en estrella
  const baseStar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 5), frameMat);
  baseStar.position.y = 0.04;
  chair.add(baseStar);

  if (parent) parent.add(chair);
  return chair;
}

function createSofa(x, z, rotY = 0) {
  const sofa = new THREE.Group();
  sofa.position.set(x, 0, z);
  sofa.rotation.y = rotY;

  const couchMat = new THREE.MeshLambertMaterial({ color: 0x6366f1 });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.85), couchMat);
  base.position.y = 0.22;
  base.castShadow = true;
  sofa.add(base);

  // Respaldo
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 0.25), couchMat);
  back.position.set(0, 0.65, -0.32);
  back.castShadow = true;
  sofa.add(back);

  // Reposabrazos
  for (let s of [-1.1, 1.1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.85), couchMat);
    arm.position.set(s, 0.45, 0);
    sofa.add(arm);
  }

  return sofa;
}

function createMug(x, y, z, color = 0xef4444, parent = null) {
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12),
    new THREE.MeshLambertMaterial({ color })
  );
  mug.position.set(x, y + 0.05, z);
  if (parent) parent.add(mug);
  return mug;
}
