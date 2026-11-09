import * as THREE from 'three';

/**
 * Gestor de interacciones, proximidad y diálogos conversacionales con empleados.
 */
export class InteractionManager {
  constructor(player, employees, camera) {
    this.player = player;
    this.employees = employees;
    this.camera = camera;

    this.activeEmployee = null; // Empleado con el que se está conversando
    this.nearbyEmployee = null; // Empleado cercano disponible para interactuar
    this.interactionRadius = 3.2; // Distancia máxima para activar interacción

    // Referencias a elementos DOM
    this.promptHud = document.getElementById('interaction-prompt');
    this.promptText = document.getElementById('prompt-text');

    this.dialogOverlay = document.getElementById('dialog-overlay');
    this.dialogName = document.getElementById('dialog-name');
    this.dialogRole = document.getElementById('dialog-role');
    this.dialogEmoji = document.getElementById('dialog-emoji');
    this.dialogAvatar = document.getElementById('dialog-avatar');
    this.dialogAnswer = document.getElementById('dialog-answer');
    this.dialogQuestionsList = document.getElementById('dialog-questions-list');
    this.dialogCloseBtn = document.getElementById('dialog-close-btn');

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'e') {
        if (!this.activeEmployee && this.nearbyEmployee) {
          this.startConversation(this.nearbyEmployee);
        }
      } else if (key === 'escape') {
        if (this.activeEmployee) {
          this.closeConversation();
        }
      }
    });

    if (this.dialogCloseBtn) {
      this.dialogCloseBtn.addEventListener('click', () => {
        this.closeConversation();
      });
    }

    // Clic sobre el prompt flotante para móviles o ratón
    if (this.promptHud) {
      this.promptHud.addEventListener('click', () => {
        if (!this.activeEmployee && this.nearbyEmployee) {
          this.startConversation(this.nearbyEmployee);
        }
      });
    }
  }

  update() {
    // Si ya estamos conversando, mantener la atención mutua
    if (this.activeEmployee) {
      const char = this.activeEmployee.characterMesh;
      if (char) {
        // Rotar suavemente al personaje hacia el jugador
        const dir = new THREE.Vector3().subVectors(this.player.position, char.position);
        dir.y = 0;
        const targetAngle = Math.atan2(dir.x, dir.z);
        let diff = targetAngle - char.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        char.rotation.y += diff * 0.1;
      }
      return;
    }

    // Buscar el empleado más cercano
    let closestEmp = null;
    let minDistance = this.interactionRadius;

    for (const emp of this.employees) {
      const dist = this.player.position.distanceTo(emp.characterMesh.position);
      if (dist < minDistance) {
        minDistance = dist;
        closestEmp = emp;
      }
    }

    this.nearbyEmployee = closestEmp;

    if (this.nearbyEmployee) {
      this.promptHud.classList.remove('hidden');
      this.promptText.innerHTML = `Presiona <kbd>E</kbd> para hablar con <strong>${this.nearbyEmployee.data.name}</strong> (${this.nearbyEmployee.data.role})`;
    } else {
      this.promptHud.classList.add('hidden');
    }
  }

  startConversation(emp) {
    this.activeEmployee = emp;
    this.player.isLocked = true;
    this.promptHud.classList.add('hidden');

    // Cambiar estado del NPC a "talking"
    emp.characterMesh.animController.setState('talking');

    // Cargar datos en la UI de diálogo
    const data = emp.data;
    this.dialogName.textContent = data.name;
    this.dialogRole.textContent = data.role;
    this.dialogRole.style.backgroundColor = data.badgeColor || '#0284c7';
    this.dialogEmoji.textContent = data.avatarEmoji || '👤';
    this.dialogAvatar.style.backgroundColor = data.avatarBg || '#e0f2fe';

    // Saludo inicial
    this.dialogAnswer.textContent = `«${data.description} Hazme cualquier pregunta sobre mi trabajo en la empresa.»`;

    // Renderizar las 3 preguntas del empleado
    this.dialogQuestionsList.innerHTML = '';
    data.questions.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = 'dialog-question-btn';
      btn.innerHTML = `<span class="q-icon">💬</span> ${item.q}`;
      btn.addEventListener('click', () => {
        this.selectQuestion(item.a, btn);
      });
      this.dialogQuestionsList.appendChild(btn);
    });

    this.dialogOverlay.classList.remove('hidden');
  }

  selectQuestion(answerText, selectedBtn) {
    // Resaltar botón activo
    const allBtns = this.dialogQuestionsList.querySelectorAll('.dialog-question-btn');
    allBtns.forEach(b => b.classList.remove('active'));
    if (selectedBtn) selectedBtn.classList.add('active');

    // Efecto de mecanografía o despliegue dinámico de respuesta
    this.dialogAnswer.textContent = '';
    this.dialogAnswer.classList.remove('fade-in');
    void this.dialogAnswer.offsetWidth; // Trigger reflow
    this.dialogAnswer.classList.add('fade-in');

    let i = 0;
    const speed = 12; // ms por carácter
    clearInterval(this.typewriterTimer);

    this.typewriterTimer = setInterval(() => {
      if (i < answerText.length) {
        this.dialogAnswer.textContent += answerText.charAt(i);
        i++;
      } else {
        clearInterval(this.typewriterTimer);
      }
    }, speed);
  }

  closeConversation() {
    clearInterval(this.typewriterTimer);
    if (this.activeEmployee) {
      // Devolver al NPC a su estado de trabajo o rotación original
      const emp = this.activeEmployee;
      emp.characterMesh.animController.setState('working');
      emp.characterMesh.rotation.y = emp.data.rotation || 0;
      this.activeEmployee = null;
    }

    this.player.isLocked = false;
    this.dialogOverlay.classList.add('hidden');
  }
}
