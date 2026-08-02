/**
 * Web Terminal CLI Component
 * Handles CLI command execution, history, auto-completion, and command routing.
 */

import { soundFX } from './soundFx.js';
import { SAMPLE_EXAMS } from './sampleExams.js';

export class WebTerminal {
  constructor(containerEl, appController) {
    this.container = containerEl;
    this.app = appController;
    this.commandHistory = [];
    this.historyIndex = -1;

    this.render();
    this.bindEvents();
    this.printWelcomeMessage();
  }

  render() {
    this.container.innerHTML = `
      <div class="terminal-card" style="height: 100%;">
        <div class="terminal-header">
          <div class="window-dots">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <div>OPEN EXAM SUITE CLI v2.5</div>
          <div style="font-size: 0.7rem; color: var(--accent-cyan);">ONLINE</div>
        </div>

        <div class="terminal-body" id="termOutput"></div>

        <div style="padding: 0.75rem 1rem; background: rgba(0,0,0,0.4); border-top: 1px solid var(--border-color);">
          <div class="terminal-input-row">
            <span class="prompt-symbol">user@exam-term:~$</span>
            <input type="text" class="term-input" id="termInput" placeholder="Escribe 'help' para ver la lista de comandos..." autocomplete="off" spellcheck="false" />
          </div>
        </div>
      </div>
    `;

    this.outputEl = this.container.querySelector('#termOutput');
    this.inputEl = this.container.querySelector('#termInput');
  }

  bindEvents() {
    this.inputEl.addEventListener('keydown', (e) => {
      soundFX.playKeyClick();

      if (e.key === 'Enter') {
        const cmd = this.inputEl.value.trim();
        if (cmd) {
          this.executeCommand(cmd);
          this.commandHistory.push(cmd);
          this.historyIndex = this.commandHistory.length;
          this.inputEl.value = '';
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl.value = this.commandHistory[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.inputEl.value = this.commandHistory[this.historyIndex];
        } else {
          this.historyIndex = this.commandHistory.length;
          this.inputEl.value = '';
        }
      }
    });

    this.container.addEventListener('click', () => {
      this.inputEl.focus();
    });
  }

  printWelcomeMessage() {
    this.println("==========================================================================", "sys");
    this.println("   ⚡ OPEN EXAM SUITE / VCE SIMULATOR TERMINAL ⚡", "cmd");
    this.println("   Simulador de Certificaciones tipo Pass4sure, ExamTopics & Whizlabs", "sys");
    this.println("==========================================================================", "sys");
    this.println("Sistema listo. Selecciona una certificación del panel o carga tu documento (PDF, TXT, VCE).");
    this.println("Escribe <span style='color:var(--accent-cyan);font-weight:bold;'>help</span> o <span style='color:var(--accent-cyan);font-weight:bold;'>list</span> para interactuar con la consola CLI.\n");
  }

  println(text, type = "default") {
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.innerHTML = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  executeCommand(cmdStr) {
    this.println(`user@exam-term:~$ ${cmdStr}`, "cmd");

    const parts = cmdStr.split(' ').filter(Boolean);
    const mainCmd = parts[0].toLowerCase();

    switch (mainCmd) {
      case 'help':
        this.printHelp();
        break;

      case 'clear':
      case 'cls':
        this.outputEl.innerHTML = '';
        break;

      case 'list':
      case 'ls':
        this.println("<b style='color:var(--accent-cyan);'>Exámenes de Certificación Disponibles:</b>");
        Object.values(SAMPLE_EXAMS).forEach(ex => {
          this.println(` • <b style="color:var(--accent-green);">${ex.id}</b>: ${ex.title} [${ex.vendor}]`);
        });
        this.println("\nUsa: <code>load aws-saa</code> o <code>load azure-az900</code> para seleccionar uno.");
        break;

      case 'load':
        if (parts[1] && SAMPLE_EXAMS[parts[1]]) {
          this.app.loadExamObject(SAMPLE_EXAMS[parts[1]]);
          this.println(`[OK] Examen '${SAMPLE_EXAMS[parts[1]].title}' cargado con éxito.`, "success");
          this.println("Escribe <code>start</code> para comenzar la prueba.");
        } else {
          this.app.openUploadModal();
          this.println("[INFO] Abriendo cargador visual de documentos...", "sys");
        }
        break;

      case 'start':
      case 'run':
        let qCount = null;
        let tMins = null;
        let mode = 'exam';

        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === '-q' && parts[i+1]) qCount = parseInt(parts[i+1]);
          if (parts[i] === '-t' && parts[i+1]) tMins = parseInt(parts[i+1]);
          if (parts[i] === '-m' && parts[i+1]) mode = parts[i+1];
        }

        this.app.startCurrentExam({ questionCount: qCount, timeLimitMinutes: tMins, mode: mode });
        this.println("[RUNNING] Examen iniciado. Buena suerte.", "success");
        break;

      case 'theme':
        if (parts[1]) {
          const themeName = parts[1].toLowerCase();
          document.body.className = themeName === 'crt' ? 'theme-crt' : (themeName === 'synth' ? 'theme-synth' : '');
          this.println(`[THEME] Tema cambiado a '${themeName}'.`, "success");
        } else {
          this.println("Uso: theme <default | crt | synth>");
        }
        break;

      case 'stats':
        this.println("Estadísticas de sesión: Exámenes realizados = " + (this.app.examHistory ? this.app.examHistory.length : 0));
        break;

      default:
        this.println(`Comando no reconocido: '${mainCmd}'. Escribe 'help' para obtener asistencia.`, "error");
        soundFX.playError();
        break;
    }
  }

  printHelp() {
    this.println("<b style='color:var(--accent-cyan);'>COMANDOS DISPONIBLES:</b>");
    this.println(" <b>list</b>            : Lista todas las certificaciones precargadas (AWS, Azure, GCP, CompTIA, Cisco, K8s, CISSP, Scrum)");
    this.println(" <b>load [id_banco]</b>  : Carga una certificación (ej. aws-saa, azure-az900, gcp-pca, comptia-sec, ccna-200-301, k8s-cka)");
    this.println(" <b>start [-q num] [-t mins]</b> : Inicia el examen con parámetros personalizados");
    this.println(" <b>theme [name]</b>    : Cambia el estilo retro (default, crt, synth)");
    this.println(" <b>clear</b>            : Limpia la pantalla de la terminal");
    this.println(" <b>help</b>             : Muestra esta ayuda\n");
  }
}
