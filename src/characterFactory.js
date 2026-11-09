import * as THREE from 'three';

/**
 * Fábrica de personajes 3D estilo cartoon con jerarquía articulada y animaciones procedurales.
 */

// Paleta de materiales cartoon reutilizables
const skinMaterialLight = new THREE.MeshLambertMaterial({ color: 0xffd1b3 });
const skinMaterialTan = new THREE.MeshLambertMaterial({ color: 0xe0a98b });
const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const eyePupilMaterial = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
const eyeCatchlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x9f1239 });

/**
 * Crea una cara cartoon con ojos expresivos, pupilas con brillo y sonrisa
 */
function attachCartoonFace(headMesh, options = {}) {
  const eyeRadius = 0.07;
  const pupilRadius = 0.035;

  // Ojo izquierdo
  const eyeLeft = new THREE.Mesh(
    new THREE.SphereGeometry(eyeRadius, 16, 16),
    eyeWhiteMaterial
  );
  eyeLeft.position.set(-0.13, 0.05, 0.36);
  eyeLeft.scale.set(1, 1.2, 0.4);
  headMesh.add(eyeLeft);

  const pupilLeft = new THREE.Mesh(
    new THREE.SphereGeometry(pupilRadius, 12, 12),
    eyePupilMaterial
  );
  pupilLeft.position.set(-0.13, 0.05, 0.39);
  pupilLeft.scale.set(1, 1.2, 0.3);
  headMesh.add(pupilLeft);

  // Brillo del ojo
  const catchLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 8, 8),
    eyeCatchlightMaterial
  );
  catchLeft.position.set(-0.11, 0.08, 0.4);
  headMesh.add(catchLeft);

  // Ojo derecho
  const eyeRight = new THREE.Mesh(
    new THREE.SphereGeometry(eyeRadius, 16, 16),
    eyeWhiteMaterial
  );
  eyeRight.position.set(0.13, 0.05, 0.36);
  eyeRight.scale.set(1, 1.2, 0.4);
  headMesh.add(eyeRight);

  const pupilRight = new THREE.Mesh(
    new THREE.SphereGeometry(pupilRadius, 12, 12),
    eyePupilMaterial
  );
  pupilRight.position.set(0.13, 0.05, 0.39);
  pupilRight.scale.set(1, 1.2, 0.3);
  headMesh.add(pupilRight);

  const catchRight = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 8, 8),
    eyeCatchlightMaterial
  );
  catchRight.position.set(0.15, 0.08, 0.4);
  headMesh.add(catchRight);

  // Cejas
  const browMat = new THREE.MeshBasicMaterial({ color: options.browColor || 0x3d2817 });
  const browGeo = new THREE.BoxGeometry(0.12, 0.025, 0.03);

  const browLeft = new THREE.Mesh(browGeo, browMat);
  browLeft.position.set(-0.13, 0.17, 0.37);
  browLeft.rotation.z = 0.05;
  headMesh.add(browLeft);

  const browRight = new THREE.Mesh(browGeo, browMat);
  browRight.position.set(0.13, 0.17, 0.37);
  browRight.rotation.z = -0.05;
  headMesh.add(browRight);

  // Sonrisa amigable
  const mouthGeo = new THREE.TorusGeometry(0.07, 0.02, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeo, mouthMaterial);
  mouth.rotation.x = Math.PI / 2;
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.15, 0.38);
  headMesh.add(mouth);

  // Mejillas sonrosadas
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.5 });
  const blushGeo = new THREE.CircleGeometry(0.05, 12);

  const blushL = new THREE.Mesh(blushGeo, blushMat);
  blushL.position.set(-0.25, -0.06, 0.34);
  blushL.rotation.y = -0.4;
  headMesh.add(blushL);

  const blushR = new THREE.Mesh(blushGeo, blushMat);
  blushR.position.set(0.25, -0.06, 0.34);
  blushR.rotation.y = 0.4;
  headMesh.add(blushR);

  // Si usa gafas (Laura o Carlos)
  if (options.hasGlasses) {
    const frameMat = new THREE.MeshLambertMaterial({ color: options.glassColor || 0x1e293b });
    const frameGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16);

    const glassL = new THREE.Mesh(frameGeo, frameMat);
    glassL.position.set(-0.13, 0.05, 0.4);
    headMesh.add(glassL);

    const glassR = new THREE.Mesh(frameGeo, frameMat);
    glassR.position.set(0.13, 0.05, 0.4);
    headMesh.add(glassR);

    // Puente de las gafas
    const bridgeGeo = new THREE.BoxGeometry(0.1, 0.02, 0.02);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.set(0, 0.05, 0.4);
    headMesh.add(bridge);
  }
}

/**
 * Construye un peinado cartoon distintivo según el personaje
 */
function attachHair(headMesh, style, hairColor) {
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });

  if (style === 'player') {
    // Pelo corto moderno con volumen y flequillo ladeado
    const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), hairMat);
    topHair.position.set(0, 0.12, -0.04);
    topHair.scale.set(1.05, 1.05, 1.1);
    headMesh.add(topHair);

    const bang = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.15), hairMat);
    bang.position.set(-0.06, 0.28, 0.3);
    bang.rotation.z = -0.2;
    headMesh.add(bang);
  } else if (style === 'sofia') {
    // Coleta alta elegante + lazo morado
    const baseHair = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), hairMat);
    baseHair.position.set(0, 0.08, -0.06);
    baseHair.scale.set(1.04, 1.05, 1.12);
    headMesh.add(baseHair);

    // Coleta
    const ponyTail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 12), hairMat);
    ponyTail.position.set(0, 0.25, -0.45);
    ponyTail.rotation.x = -Math.PI / 3;
    headMesh.add(ponyTail);

    // Lazo
    const tieMat = new THREE.MeshLambertMaterial({ color: 0xa855f7 });
    const tieMesh = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 16), tieMat);
    tieMesh.position.set(0, 0.34, -0.38);
    tieMesh.rotation.x = -Math.PI / 4;
    headMesh.add(tieMesh);
  } else if (style === 'laura') {
    // Melena bob moderna geek + auriculares cyan sobre los hombros
    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), hairMat);
    bob.position.set(0, 0.08, -0.04);
    bob.scale.set(1.06, 1.08, 1.15);
    headMesh.add(bob);

    // Mechones laterales
    const strandL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.25), hairMat);
    strandL.position.set(-0.35, -0.1, 0.12);
    headMesh.add(strandL);

    const strandR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.25), hairMat);
    strandR.position.set(0.35, -0.1, 0.12);
    headMesh.add(strandR);
  } else if (style === 'carlos') {
    // Peinado formal de raya al lado para contador
    const formalHair = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), hairMat);
    formalHair.position.set(0, 0.1, -0.04);
    formalHair.scale.set(1.05, 1.02, 1.08);
    headMesh.add(formalHair);

    const sidePart = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.3), hairMat);
    sidePart.position.set(0.08, 0.28, 0.2);
    sidePart.rotation.z = -0.15;
    headMesh.add(sidePart);
  } else if (style === 'andres') {
    // Gorra de técnico naranja/ámbar o pelo rizado informal
    const capMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.43, 16, 16), capMat);
    capDome.position.set(0, 0.12, -0.02);
    capDome.scale.set(1.05, 1.02, 1.08);
    headMesh.add(capDome);

    const capVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16, 1, false, 0, Math.PI), capMat);
    capVisor.position.set(0, 0.15, 0.42);
    capVisor.rotation.x = 0.2;
    headMesh.add(capVisor);

    // Mechones que asoman
    const curls = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.15, 0.3), hairMat);
    curls.position.set(0, -0.05, -0.25);
    headMesh.add(curls);
  } else if (style === 'mariana') {
    // Corte ejecutivo rubio elegante con puntas redondeadas
    const execHair = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), hairMat);
    execHair.position.set(0, 0.1, -0.05);
    execHair.scale.set(1.07, 1.1, 1.15);
    headMesh.add(execHair);

    const execBangs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.2), hairMat);
    execBangs.position.set(0.1, 0.25, 0.28);
    execBangs.rotation.z = -0.12;
    headMesh.add(execBangs);

    // Pendientes dorados
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
    const earringGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 12);
    const earringL = new THREE.Mesh(earringGeo, goldMat);
    earringL.position.set(-0.38, -0.12, 0.05);
    earringL.rotation.y = Math.PI / 2;
    headMesh.add(earringL);

    const earringR = new THREE.Mesh(earringGeo, goldMat);
    earringR.position.set(0.38, -0.12, 0.05);
    earringR.rotation.y = Math.PI / 2;
    headMesh.add(earringR);
  }
}

/**
 * Crea un personaje cartoon completo con jerarquía articulada
 */
export function createCartoonCharacter(config) {
  const group = new THREE.Group();
  group.name = config.id || 'character';

  const skinMat = config.skinTone === 'tan' ? skinMaterialTan : skinMaterialLight;
  const clothMat = new THREE.MeshLambertMaterial({ color: config.clothColor || 0x3b82f6 });
  const pantsMat = new THREE.MeshLambertMaterial({ color: config.pantsColor || 0x1e293b });
  const shoesMat = new THREE.MeshLambertMaterial({ color: config.shoeColor || 0x0f172a });

  // 1. RAÍZ / CADERAS
  const hips = new THREE.Group();
  hips.position.y = 0.85;
  group.add(hips);

  const hipMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.22, 0.22, 16),
    pantsMat
  );
  hips.add(hipMesh);

  // 2. TORSO
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.22;
  hips.add(torsoGroup);

  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.25, 0.52, 16),
    clothMat
  );
  torsoMesh.position.y = 0.26;
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Accesorio de cuello / corbata / tarjeta según el personaje
  if (config.accessory === 'tie') {
    const tieMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
    const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.02), tieMat);
    tieMesh.position.set(0, 0.26, 0.28);
    tieMesh.rotation.x = -0.05;
    torsoGroup.add(tieMesh);
  } else if (config.accessory === 'lanyard') {
    // Cordón y credencial IT
    const strapMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const badgeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const badgeHolder = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.02), badgeMat);
    badgeHolder.position.set(0, 0.16, 0.28);
    torsoGroup.add(badgeHolder);
  } else if (config.accessory === 'blazer') {
    // Solapas de traje ejecutivo
    const lapelMat = new THREE.MeshLambertMaterial({ color: 0x1e1b4b });
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.03), lapelMat);
    lapelL.position.set(-0.12, 0.27, 0.27);
    lapelL.rotation.z = 0.1;
    torsoGroup.add(lapelL);

    const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.03), lapelMat);
    lapelR.position.set(0.12, 0.27, 0.27);
    lapelR.rotation.z = -0.1;
    torsoGroup.add(lapelR);
  }

  // 3. CUELLO Y CABEZA
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), skinMat);
  neckMesh.position.y = 0.55;
  torsoGroup.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.72;
  torsoGroup.add(headGroup);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 20, 20),
    skinMat
  );
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Cara cartoon y cabello
  attachCartoonFace(headMesh, {
    hasGlasses: config.hasGlasses,
    glassColor: config.glassColor,
    browColor: config.hairColor
  });

  attachHair(headMesh, config.hairStyle, config.hairColor);

  // 4. BRAZOS
  function createArm(isLeft) {
    const side = isLeft ? -1 : 1;
    const shoulderGroup = new THREE.Group();
    shoulderGroup.position.set(side * 0.36, 0.44, 0);
    torsoGroup.add(shoulderGroup);

    // Hombro / manga
    const upperArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.08, 0.3, 12),
      clothMat
    );
    upperArmMesh.position.y = -0.15;
    upperArmMesh.castShadow = true;
    shoulderGroup.add(upperArmMesh);

    // Codo y antebrazo
    const elbowGroup = new THREE.Group();
    elbowGroup.position.y = -0.3;
    shoulderGroup.add(elbowGroup);

    const forearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.07, 0.28, 12),
      skinMat
    );
    forearmMesh.position.y = -0.14;
    forearmMesh.castShadow = true;
    elbowGroup.add(forearmMesh);

    // Mano redondeada
    const handMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      skinMat
    );
    handMesh.position.y = -0.3;
    handMesh.scale.set(1, 1.2, 0.8);
    elbowGroup.add(handMesh);

    return { shoulder: shoulderGroup, elbow: elbowGroup, hand: handMesh };
  }

  const armL = createArm(true);
  const armR = createArm(false);

  // 5. PIERNAS
  function createLeg(isLeft) {
    const side = isLeft ? -1 : 1;
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.15, -0.1, 0);
    hips.add(hipJoint);

    // Muslo
    const thighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.09, 0.38, 12),
      pantsMat
    );
    thighMesh.position.y = -0.19;
    thighMesh.castShadow = true;
    hipJoint.add(thighMesh);

    // Rodilla y pantorrilla
    const kneeJoint = new THREE.Group();
    kneeJoint.position.y = -0.38;
    hipJoint.add(kneeJoint);

    const shinMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.075, 0.36, 12),
      pantsMat
    );
    shinMesh.position.y = -0.18;
    shinMesh.castShadow = true;
    kneeJoint.add(shinMesh);

    // Zapato cartoon
    const shoeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.28),
      shoesMat
    );
    shoeMesh.position.set(0, -0.38, 0.05);
    shoeMesh.castShadow = true;
    kneeJoint.add(shoeMesh);

    return { hipJoint, kneeJoint, shoeMesh };
  }

  const legL = createLeg(true);
  const legR = createLeg(false);

  // Sombra proyectada en el suelo
  const shadowGeo = new THREE.CircleGeometry(0.4, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28
  });
  const blobShadow = new THREE.Mesh(shadowGeo, shadowMat);
  blobShadow.rotation.x = -Math.PI / 2;
  blobShadow.position.y = 0.02;
  group.add(blobShadow);

  // ========================================================
  // CONTROLADOR DE ANIMACIONES PROCEDURALES
  // ========================================================
  const animController = {
    state: config.initialState || 'working', // 'idle' | 'walking' | 'working' | 'talking'
    workType: config.workType || 'coding',
    lookTarget: null, // Si está hablando, mira hacia el jugador

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
    },

    setLookTarget(vec3) {
      this.lookTarget = vec3;
    },

    update(time, delta, moveSpeed = 0) {
      // 1. Reset suave de articulaciones
      const lerpFactor = 0.15;

      if (this.state === 'walking' || moveSpeed > 0.05) {
        // ANIMACIÓN DE CAMINAR
        const walkFreq = 8.5;
        const walkCycle = Math.sin(time * walkFreq);
        const cosCycle = Math.cos(time * walkFreq);

        // Piernas
        legL.hipJoint.rotation.x = walkCycle * 0.65;
        legR.hipJoint.rotation.x = -walkCycle * 0.65;
        legL.kneeJoint.rotation.x = Math.max(0, -walkCycle * 0.5);
        legR.kneeJoint.rotation.x = Math.max(0, walkCycle * 0.5);

        // Brazos opuestos al movimiento de piernas
        armL.shoulder.rotation.x = -walkCycle * 0.55;
        armR.shoulder.rotation.x = walkCycle * 0.55;
        armL.shoulder.rotation.z = -0.15;
        armR.shoulder.rotation.z = 0.15;
        armL.elbow.rotation.x = -0.2;
        armR.elbow.rotation.x = -0.2;

        // Rebote del cuerpo al caminar
        hips.position.y = 0.85 + Math.abs(cosCycle) * 0.05;
        torsoGroup.rotation.y = walkCycle * 0.08;
        headGroup.rotation.y = -walkCycle * 0.04;
      } else if (this.state === 'talking') {
        // ANIMACIÓN DE CONVERSACIÓN (expresiva, atenta y gesticulando)
        hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.85, lerpFactor);
        legL.hipJoint.rotation.x = THREE.MathUtils.lerp(legL.hipJoint.rotation.x, 0, lerpFactor);
        legR.hipJoint.rotation.x = THREE.MathUtils.lerp(legR.hipJoint.rotation.x, 0, lerpFactor);

        // Respiración + asentir
        const nod = Math.sin(time * 3.5) * 0.12;
        headGroup.rotation.x = nod;
        headGroup.rotation.z = Math.sin(time * 2.0) * 0.05;

        // Gesto con las manos al hablar
        const gestureL = Math.sin(time * 4.0) * 0.25;
        const gestureR = Math.cos(time * 3.0) * 0.3;

        armL.shoulder.rotation.x = -0.6 + gestureL * 0.3;
        armL.shoulder.rotation.z = -0.4;
        armL.elbow.rotation.x = -0.9 + gestureL * 0.4;

        armR.shoulder.rotation.x = -0.5 - gestureR * 0.3;
        armR.shoulder.rotation.z = 0.35;
        armR.elbow.rotation.x = -0.85 - gestureR * 0.4;

        torsoGroup.rotation.y = Math.sin(time * 1.8) * 0.08;
      } else if (this.state === 'working') {
        // ANIMACIÓN DE TRABAJO SEGÚN EL ROL
        hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.75, lerpFactor); // Sentado o ligeramente inclinado
        legL.hipJoint.rotation.x = THREE.MathUtils.lerp(legL.hipJoint.rotation.x, -1.4, lerpFactor); // Piernas sentadas
        legR.hipJoint.rotation.x = THREE.MathUtils.lerp(legR.hipJoint.rotation.x, -1.4, lerpFactor);
        legL.kneeJoint.rotation.x = THREE.MathUtils.lerp(legL.kneeJoint.rotation.x, 1.4, lerpFactor);
        legR.kneeJoint.rotation.x = THREE.MathUtils.lerp(legR.kneeJoint.rotation.x, 1.4, lerpFactor);

        if (this.workType === 'coding') {
          // Laura tecleando rápido y mirando entre monitores
          const typeSpeed = time * 18;
          armL.shoulder.rotation.x = -0.85;
          armL.shoulder.rotation.z = -0.25;
          armL.elbow.rotation.x = -0.9 + Math.sin(typeSpeed) * 0.08;

          armR.shoulder.rotation.x = -0.85;
          armR.shoulder.rotation.z = 0.25;
          armR.elbow.rotation.x = -0.9 + Math.cos(typeSpeed * 1.2) * 0.08;

          // Cabeza escanea de izquierda a derecha entre 2 monitores
          headGroup.rotation.y = Math.sin(time * 1.2) * 0.28;
          headGroup.rotation.x = 0.08;
        } else if (this.workType === 'accounting') {
          // Carlos calculando y revisando hojas
          const calcTap = Math.sin(time * 8);
          armR.shoulder.rotation.x = -0.85;
          armR.shoulder.rotation.z = 0.2;
          armR.elbow.rotation.x = -0.95 + calcTap * 0.06;

          armL.shoulder.rotation.x = -0.6;
          armL.shoulder.rotation.z = -0.3;
          armL.elbow.rotation.x = -1.1;

          headGroup.rotation.x = 0.2 + Math.sin(time * 2.5) * 0.08;
          headGroup.rotation.y = Math.sin(time * 0.8) * 0.15;
        } else if (this.workType === 'it_support') {
          // Andrés ajustando servidor y equipo
          const toolMove = Math.sin(time * 3);
          armL.shoulder.rotation.x = -0.9 + toolMove * 0.15;
          armL.elbow.rotation.x = -0.8;
          armR.shoulder.rotation.x = -1.1 - toolMove * 0.15;
          armR.elbow.rotation.x = -1.0;

          headGroup.rotation.x = 0.15;
          headGroup.rotation.y = Math.sin(time * 2) * 0.2;
        } else if (this.workType === 'reception') {
          // Sofía en recepción atenta y organizada
          armL.shoulder.rotation.x = -0.7;
          armL.shoulder.rotation.z = -0.2;
          armL.elbow.rotation.x = -0.8;

          armR.shoulder.rotation.x = -0.75 + Math.sin(time * 2.5) * 0.05;
          armR.shoulder.rotation.z = 0.2;
          armR.elbow.rotation.x = -0.85;

          headGroup.rotation.y = Math.sin(time * 0.9) * 0.18;
          headGroup.rotation.x = Math.sin(time * 1.8) * 0.06;
        } else {
          // Mariana gerencia revisando informes y planificando
          armL.shoulder.rotation.x = -0.8;
          armL.shoulder.rotation.z = -0.3;
          armL.elbow.rotation.x = -1.2;

          armR.shoulder.rotation.x = -0.5 + Math.sin(time * 2) * 0.1;
          armR.shoulder.rotation.z = 0.3;
          armR.elbow.rotation.x = -0.7;

          headGroup.rotation.y = Math.sin(time * 1.1) * 0.15;
          headGroup.rotation.x = 0.1;
        }
      } else {
        // IDLE (respiración suave de espera)
        const breathe = Math.sin(time * 2.0);
        hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.85, lerpFactor);
        torsoGroup.position.y = 0.22 + breathe * 0.015;
        torsoMesh.scale.x = 1 + breathe * 0.02;

        legL.hipJoint.rotation.x = THREE.MathUtils.lerp(legL.hipJoint.rotation.x, 0, lerpFactor);
        legR.hipJoint.rotation.x = THREE.MathUtils.lerp(legR.hipJoint.rotation.x, 0, lerpFactor);
        legL.kneeJoint.rotation.x = THREE.MathUtils.lerp(legL.kneeJoint.rotation.x, 0, lerpFactor);
        legR.kneeJoint.rotation.x = THREE.MathUtils.lerp(legR.kneeJoint.rotation.x, 0, lerpFactor);

        armL.shoulder.rotation.x = THREE.MathUtils.lerp(armL.shoulder.rotation.x, 0.05, lerpFactor);
        armL.shoulder.rotation.z = THREE.MathUtils.lerp(armL.shoulder.rotation.z, -0.15, lerpFactor);
        armR.shoulder.rotation.x = THREE.MathUtils.lerp(armR.shoulder.rotation.x, 0.05, lerpFactor);
        armR.shoulder.rotation.z = THREE.MathUtils.lerp(armR.shoulder.rotation.z, 0.15, lerpFactor);

        headGroup.rotation.y = Math.sin(time * 0.6) * 0.08;
      }
    }
  };

  group.animController = animController;
  return group;
}
