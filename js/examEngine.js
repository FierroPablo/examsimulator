/**
 * Interactive Exam Engine Component
 * Controls question rendering, real-time timer countdown, practice/exam modes, and answer tracking.
 */

import { soundFX } from './soundFx.js';

export class ExamEngine {
  constructor(containerEl, appController) {
    this.container = containerEl;
    this.app = appController;

    this.examData = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = {}; // { questionId: selectedIndex }
    this.flaggedQuestions = new Set();
    this.mode = 'exam'; // 'exam' or 'practice'

    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isPaused = false;
  }

  startExam(examData, config = {}) {
    this.examData = examData;
    this.mode = config.mode || 'exam';
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.flaggedQuestions.clear();

    // Configure questions subset if requested
    let activeQuestions = [...examData.questions];
    if (config.questionCount && config.questionCount > 0 && config.questionCount < activeQuestions.length) {
      activeQuestions = activeQuestions.slice(0, config.questionCount);
    }
    this.activeQuestions = activeQuestions;

    // Configure Timer
    const mins = config.timeLimitMinutes || examData.timeLimitMinutes || 30;
    this.timerSeconds = mins * 60;

    this.render();
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      this.timerSeconds--;
      this.updateTimerDisplay();

      if (this.timerSeconds <= 0) {
        clearInterval(this.timerInterval);
        alert("⏰ El tiempo del examen ha finalizado. Generando reporte de calificaciones...");
        this.finishExam();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isPaused = !this.isPaused;
    const btn = this.container.querySelector('#pauseTimerBtn');
    if (btn) btn.innerHTML = this.isPaused ? '▶ Reanudar' : '⏸ Pausar';
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerEl = this.container.querySelector('#timerDisplay');
    if (!timerEl) return;

    const mins = Math.floor(Math.max(0, this.timerSeconds) / 60);
    const secs = Math.max(0, this.timerSeconds) % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    timerEl.textContent = formatted;

    if (this.timerSeconds < 300) { // Less than 5 minutes
      timerEl.parentElement.classList.add('urgent');
    }
  }

  render() {
    if (!this.activeQuestions || this.activeQuestions.length === 0) {
      this.container.innerHTML = `<div class="view-panel" style="padding: 2rem; text-align: center;">No hay preguntas disponibles.</div>`;
      return;
    }

    const currentQ = this.activeQuestions[this.currentQuestionIndex];
    const selectedOption = this.userAnswers[currentQ.id];
    const isFlagged = this.flaggedQuestions.has(currentQ.id);

    this.container.innerHTML = `
      <div class="view-panel" style="height: 100%; display: flex; flex-direction: column;">
        <!-- Header Toolbar -->
        <div class="exam-bar">
          <div class="exam-title-badge">
            <span style="color:var(--accent-cyan);">📁 ${this.examData.title}</span>
            <span class="brand-badge">${this.mode.toUpperCase()} MODE</span>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="timer-box">
              ⏱ <span id="timerDisplay">00:00</span>
            </div>
            <button class="btn" id="pauseTimerBtn">⏸ Pausar</button>
            <button class="btn btn-danger" id="finishExamBtn">Finalizar y Evaluar</button>
          </div>
        </div>

        <!-- Question Body -->
        <div class="question-container">
          <div class="question-meta">
            <div>
              Pregunta <span class="question-num">${this.currentQuestionIndex + 1}</span> de <span>${this.activeQuestions.length}</span>
              ${currentQ.domain ? `<span style="margin-left: 1rem; color: var(--accent-purple);">[${currentQ.domain}]</span>` : ''}
            </div>

            <button class="flag-btn ${isFlagged ? 'flagged' : ''}" id="flagBtn">
              ${isFlagged ? '🚩 Marcada para revisión' : '🏳 Marcar Pregunta'}
            </button>
          </div>

          <div class="question-text">${currentQ.question}</div>

          <!-- Options -->
          <div class="options-list">
            ${currentQ.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === idx;
              
              let extraClass = '';
              if (isSelected) extraClass += ' selected';

              // If Practice Mode & answered, show correct/wrong immediately
              if (this.mode === 'practice' && selectedOption !== undefined) {
                if (idx === currentQ.correctAnswerIndex) extraClass += ' correct-answer';
                else if (isSelected) extraClass += ' wrong-answer';
              }

              return `
                <div class="option-card ${extraClass}" data-index="${idx}">
                  <div class="option-letter">${letter}</div>
                  <div class="option-content">${opt}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Practice Mode Explanation -->
          ${(this.mode === 'practice' && selectedOption !== undefined) ? `
            <div class="explanation-box">
              <div class="explanation-title">💡 Explicación del Examen:</div>
              <div>${currentQ.explanation || 'Revisa la documentación técnica recomendada.'}</div>
            </div>
          ` : ''}
        </div>

        <!-- Navigation Footer -->
        <div class="exam-footer">
          <button class="btn" id="prevQBtn" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>← Anterior</button>

          <!-- Matrix Grid Navigation -->
          <div class="question-nav-grid">
            ${this.activeQuestions.map((q, idx) => {
              const isAns = this.userAnswers[q.id] !== undefined;
              const isFlg = this.flaggedQuestions.has(q.id);
              const isAct = idx === this.currentQuestionIndex;

              let dotClass = 'nav-dot';
              if (isAct) dotClass += ' active';
              if (isAns) dotClass += ' answered';
              if (isFlg) dotClass += ' flagged';

              return `<div class="${dotClass}" data-goto="${idx}">${idx + 1}</div>`;
            }).join('')}
          </div>

          <button class="btn btn-primary" id="nextQBtn">
            ${this.currentQuestionIndex === this.activeQuestions.length - 1 ? 'Revisar Final →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateTimerDisplay();
  }

  bindEvents() {
    // Select Option
    const optionCards = this.container.querySelectorAll('.option-card');
    optionCards.forEach(card => {
      card.addEventListener('click', () => {
        soundFX.playKeyClick();
        const idx = parseInt(card.getAttribute('data-index'));
        const currentQ = this.activeQuestions[this.currentQuestionIndex];
        this.userAnswers[currentQ.id] = idx;
        this.render();
      });
    });

    // Flag Question
    const flagBtn = this.container.querySelector('#flagBtn');
    if (flagBtn) {
      flagBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        const currentQ = this.activeQuestions[this.currentQuestionIndex];
        if (this.flaggedQuestions.has(currentQ.id)) {
          this.flaggedQuestions.delete(currentQ.id);
        } else {
          this.flaggedQuestions.add(currentQ.id);
        }
        this.render();
      });
    }

    // Previous Button
    const prevBtn = this.container.querySelector('#prevQBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        if (this.currentQuestionIndex > 0) {
          this.currentQuestionIndex--;
          this.render();
        }
      });
    }

    // Next Button
    const nextBtn = this.container.querySelector('#nextQBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        if (this.currentQuestionIndex < this.activeQuestions.length - 1) {
          this.currentQuestionIndex++;
          this.render();
        } else {
          if (confirm("¿Deseas finalizar la prueba y ver tus resultados?")) {
            this.finishExam();
          }
        }
      });
    }

    // Grid Navigation
    const navDots = this.container.querySelectorAll('[data-goto]');
    navDots.forEach(dot => {
      dot.addEventListener('click', () => {
        soundFX.playKeyClick();
        const goto = parseInt(dot.getAttribute('data-goto'));
        this.currentQuestionIndex = goto;
        this.render();
      });
    });

    // Pause Timer
    const pauseBtn = this.container.querySelector('#pauseTimerBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        this.pauseTimer();
      });
    }

    // Finish Exam
    const finishBtn = this.container.querySelector('#finishExamBtn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        if (confirm("¿Estás seguro de finalizar el examen ahora?")) {
          this.finishExam();
        }
      });
    }
  }

  finishExam() {
    this.stopTimer();

    // Calculate score
    let correctCount = 0;
    this.activeQuestions.forEach(q => {
      if (this.userAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / this.activeQuestions.length) * 100);
    const passed = scorePercentage >= (this.examData.passingScorePercentage || 70);

    const results = {
      examTitle: this.examData.title,
      totalQuestions: this.activeQuestions.length,
      correctCount: correctCount,
      scorePercentage: scorePercentage,
      passed: passed,
      questions: this.activeQuestions,
      userAnswers: this.userAnswers,
      timeSpentSeconds: (this.examData.timeLimitMinutes * 60) - this.timerSeconds
    };

    if (passed) soundFX.playSuccess();
    else soundFX.playError();

    this.app.showResults(results);
  }
}
