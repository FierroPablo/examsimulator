/**
 * Results & Analytics View Component
 * Renders score report, pass/fail status, detailed Q&A review, and export/certificate functions.
 */

import { soundFX } from './soundFx.js';

export class ResultsView {
  constructor(containerEl, appController) {
    this.container = containerEl;
    this.app = appController;
  }

  showResults(results) {
    this.results = results;

    const mins = Math.floor(results.timeSpentSeconds / 60);
    const secs = results.timeSpentSeconds % 60;

    this.container.innerHTML = `
      <div class="view-panel" style="height: 100%; display: flex; flex-direction: column; overflow-y: auto;">
        <!-- Results Header Card -->
        <div class="results-card">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">
            Reporte Final de Calificación
          </div>
          <h2 style="color: #fff; font-family: var(--font-mono); font-size: 1.5rem;">${results.examTitle}</h2>

          <!-- Badge -->
          <div class="score-badge ${results.passed ? '' : 'failed'}">
            <div class="score-number">${results.scorePercentage}%</div>
            <div class="score-status ${results.passed ? 'pass-text' : 'fail-text'}">
              ${results.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div style="display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; font-family: var(--font-mono); font-size: 0.95rem;">
            <div>Aciertos: <b style="color:var(--accent-green);">${results.correctCount}</b> / ${results.totalQuestions}</div>
            <div>Tiempo empleado: <b style="color:var(--accent-cyan);">${mins}m ${secs}s</b></div>
            <div>Corte de aprobación: <b style="color:var(--accent-amber);">70%</b></div>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button class="btn btn-primary" id="retryExamBtn">🔄 Repetir Examen</button>
            <button class="btn" id="exportReportBtn">💾 Exportar Reporte</button>
            <button class="btn" id="newExamBtn">📂 Cargar Otro Examen</button>
          </div>
        </div>

        <!-- Question Breakdown Review -->
        <div style="padding: 1.5rem 2rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1.5rem;">
          <h3 style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 1.1rem;">
            🔍 Revisión Detallada Pregunta por Pregunta
          </h3>

          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${results.questions.map((q, idx) => {
              const userAns = results.userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswerIndex;

              return `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}; border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
                  <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.85rem;">
                    <span style="color: #fff; font-weight: bold;">Pregunta ${idx + 1}</span>
                    <span style="color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight: bold;">
                      ${isCorrect ? '✓ CORRECTA' : '✗ INCORRECTA'}
                    </span>
                  </div>

                  <div style="color: #fff; font-size: 1rem; line-height: 1.5;">${q.question}</div>

                  <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    ${q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      let style = 'padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.9rem; font-family: var(--font-mono);';

                      if (optIdx === q.correctAnswerIndex) {
                        style += ' background: rgba(0,255,136,0.15); border: 1px solid var(--accent-green); color: var(--accent-green);';
                      } else if (optIdx === userAns && !isCorrect) {
                        style += ' background: rgba(255,51,102,0.15); border: 1px solid var(--accent-red); color: var(--accent-red);';
                      } else {
                        style += ' background: rgba(255,255,255,0.02); color: var(--text-muted);';
                      }

                      return `<div style="${style}">${letter}) ${opt}</div>`;
                    }).join('')}
                  </div>

                  <div class="explanation-box" style="margin-top: 0.5rem;">
                    <div class="explanation-title">💡 Explicación del Examen:</div>
                    <div>${q.explanation || 'Sin explicación.'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const retryBtn = this.container.querySelector('#retryExamBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        this.app.startCurrentExam();
      });
    }

    const newBtn = this.container.querySelector('#newExamBtn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        this.app.openUploadModal();
      });
    }

    const exportBtn = this.container.querySelector('#exportReportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        soundFX.playKeyClick();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.results, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Exam_Report_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }
  }
}
