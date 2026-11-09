import * as THREE from 'three';
import { buildOfficeScene } from './officeBuilder.js';
import { createCartoonCharacter } from './characterFactory.js';
import { PlayerController } from './player.js';
import { InteractionManager } from './interactionManager.js';
import { EMPLOYEES_DATA } from './dialogData.js';

/**
 * OFFICE LIFE 3D — Punto de Entrada Principal
 * Juego de simulación interactiva cartoon en Three.js
 */

// ==========================================
// 1. CONFIGURACIÓN THREE.JS
// ==========================================
const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x93c5fd); // Cielo azul cartoon

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  150
);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ==========================================
// 2. CONSTRUIR ENTORNO DE OFICINA
// ==========================================
const { officeGroup, colliders } = buildOfficeScene(scene);

// ==========================================
// 3. CREAR LOS 5 EMPLEADOS CARTOON
// ==========================================
const employees = [];
const visitedEmployees = new Set();

function setupEmployees() {
  const charConfigs = {
    sofia: {
      skinTone: 'light',
      hairStyle: 'sofia',
      hairColor: 0x2e1065, // Castaño oscuro con recogido
      clothColor: 0xa855f7, // Blusa lila / morada de recepción
      pantsColor: 0x334155, // Falda / pantalón oscuro
      shoeColor: 0x1e1b4b,
      accessory: null,
      initialState: 'working',
      workType: 'reception'
    },
    laura: {
      skinTone: 'light',
      hairStyle: 'laura',
      hairColor: 0x7c2d12, // Pelo castaño rojizo moderno
      clothColor: 0x06b6d4, // Sudadera cian tecnológica
      pantsColor: 0x1e293b,
      shoeColor: 0xffffff,
      hasGlasses: true,
      glassColor: 0x0f172a,
      accessory: null,
      initialState: 'working',
      workType: 'coding'
    },
    carlos: {
      skinTone: 'light',
      hairStyle: 'carlos',
      hairColor: 0x1c1917, // Pelo negro formal peinado
      clothColor: 0xf8fafc, // Camisa ejecutiva blanca
      pantsColor: 0x334155, // Pantalón de vestir
      shoeColor: 0x0f172a,
      hasGlasses: true,
      glassColor: 0x475569,
      accessory: 'tie',
      initialState: 'working',
      workType: 'accounting'
    },
    andres: {
      skinTone: 'tan',
      hairStyle: 'andres',
      hairColor: 0x451a03,
      clothColor: 0xf59e0b, // Polo técnico ámbar
      pantsColor: 0x1e293b,
      shoeColor: 0x334155,
      accessory: 'lanyard',
      initialState: 'working',
      workType: 'it_support'
    },
    mariana: {
      skinTone: 'light',
      hairStyle: 'mariana',
      hairColor: 0xd97706, // Rubio dorado elegante
      clothColor: 0x1e3a8a, // Traje azul marino ejecutivo
      pantsColor: 0x1e3a8a,
      shoeColor: 0x0f172a,
      accessory: 'blazer',
      initialState: 'working',
      workType: 'managing'
    }
  };

  for (const data of EMPLOYEES_DATA) {
    const config = {
      id: data.id,
      ...charConfigs[data.id]
    };

    const characterMesh = createCartoonCharacter(config);
    characterMesh.position.set(data.initialPosition.x, 0, data.initialPosition.z);
    characterMesh.rotation.y = data.rotation || 0;
    scene.add(characterMesh);

    employees.push({
      id: data.id,
      data,
      characterMesh
    });
  }
}

setupEmployees();

// ==========================================
// 4. CONTROLADOR DEL JUGADOR
// ==========================================
const player = new PlayerController(scene, camera, renderer.domElement, colliders);

// ==========================================
// 5. GESTOR DE INTERACCIONES Y DIÁLOGOS
// ==========================================
const interactionManager = new InteractionManager(player, employees, camera);

// Enlazar hook para registrar empleados visitados
const originalStartConv = interactionManager.startConversation.bind(interactionManager);
interactionManager.startConversation = function(emp) {
  originalStartConv(emp);
  if (!visitedEmployees.has(emp.id)) {
    visitedEmployees.add(emp.id);
    updateVisitedUI();
  }
};

// ==========================================
// 6. UI Y MENÚS ADICIONALES
// ==========================================
const introScreen = document.getElementById('intro-screen');
const btnStartGame = document.getElementById('btn-start-game');
const btnDirectory = document.getElementById('btn-directory');
const directoryModal = document.getElementById('directory-modal');
const btnCloseDirectory = document.getElementById('btn-close-directory');
const directoryList = document.getElementById('directory-list');
const visitedCountEl = document.getElementById('visited-count');

btnStartGame.addEventListener('click', () => {
  introScreen.classList.add('hidden');
  player.isLocked = false;
});

btnDirectory.addEventListener('click', () => {
  renderDirectory();
  directoryModal.classList.remove('hidden');
});

btnCloseDirectory.addEventListener('click', () => {
  directoryModal.classList.add('hidden');
});

function updateVisitedUI() {
  visitedCountEl.textContent = visitedEmployees.size.toString();
}

function renderDirectory() {
  directoryList.innerHTML = '';
  for (const emp of employees) {
    const isVisited = visitedEmployees.has(emp.id);
    const item = document.createElement('div');
    item.className = 'dir-item';
    item.innerHTML = `
      <div class="dir-item-avatar" style="background:${emp.data.avatarBg}">
        ${emp.data.avatarEmoji}
      </div>
      <div class="dir-item-details">
        <span class="dir-item-name">${emp.data.name}</span>
        <span class="dir-item-role">${emp.data.role}</span>
      </div>
      <span class="dir-status-pill ${isVisited ? 'visited' : ''}">
        ${isVisited ? '✓ Conocido' : 'Por conocer'}
      </span>
    `;
    directoryList.appendChild(item);
  }
}

// Iniciar con jugador temporalmente bloqueado mientras lee la intro
player.isLocked = true;

// ==========================================
// 7. BUCLE DE ANIMACIÓN (60 FPS)
// ==========================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  // Actualizar jugador (física, controles, cámara)
  player.update(time, delta);

  // Actualizar cada empleado según su estado (working, idle, talking)
  for (const emp of employees) {
    emp.characterMesh.animController.update(time, delta);
  }

  // Comprobar proximidad e interacción
  interactionManager.update();

  renderer.render(scene, camera);
}

animate();

// ==========================================
// 8. REDIMENSIONAMIENTO RESPONSIVO
// ==========================================
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
