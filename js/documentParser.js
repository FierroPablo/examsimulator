/**
 * Web Exam Suite - Document & Exam Parser
 * Extracts structured questions from PDF, TXT, VCE Exam Dumps, JSON, CSV, or raw text documents.
 */

export class DocumentParser {
  /**
   * Parse a raw text or document string into structured exam format
   */
  static parseText(text, fileName = "Documento Cargado") {
    if (!text || typeof text !== 'string') {
      throw new Error("El texto proporcionado no es válido.");
    }

    const trimmed = text.trim();

    // 1. Try parsing JSON format
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const json = JSON.parse(trimmed);
        const questions = Array.isArray(json) ? json : (json.questions || []);
        if (questions.length > 0) {
          return {
            title: json.title || fileName.replace(/\.[^/.]+$/, ""),
            description: json.description || `Examen generado desde ${fileName}`,
            timeLimitMinutes: json.timeLimitMinutes || 30,
            passingScorePercentage: json.passingScorePercentage || 70,
            questions: this.normalizeQuestions(questions)
          };
        }
      } catch (e) {
        // Not JSON, continue to standard text parsing
      }
    }

    // 2. Parse Standard VCE / ExamTopics / Pass4Sure Text Dump Format
    const questions = this.extractQuestionsFromTextDump(trimmed);

    if (questions.length > 0) {
      return {
        title: `Examen: ${fileName.replace(/\.[^/.]+$/, "")}`,
        description: `Extraído automáticamente con ${questions.length} preguntas detectadas.`,
        timeLimitMinutes: Math.max(10, Math.ceil(questions.length * 1.5)),
        passingScorePercentage: 70,
        questions: questions
      };
    }

    // 3. Fallback: Auto-Generate Quiz Questions from General Text Study Material
    const generatedQuestions = this.autoGenerateQuestionsFromStudyMaterial(trimmed);
    return {
      title: `Simulador Inteligente: ${fileName.replace(/\.[^/.]+$/, "")}`,
      description: `Generado a partir del contenido de tu documento.`,
      timeLimitMinutes: Math.max(10, Math.ceil(generatedQuestions.length * 1.5)),
      passingScorePercentage: 70,
      questions: generatedQuestions
    };
  }

  /**
   * Regex-based extractor for VCE / ExamTopics pattern:
   * Question 1: ...
   * A. Option 1
   * B. Option 2
   * Answer: A
   * Explanation: ...
   */
  static extractQuestionsFromTextDump(text) {
    const questions = [];
    
    // Split by question markers (Question X, Pregunta X, Q1., ITEM 1)
    const blocks = text.split(/(?=(?:QUESTION|PREGUNTA|ITEM|Q)\s*\d+[\s.:])/i);

    blocks.forEach((block, index) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return;

      // Extract Question Text
      const qMatch = trimmedBlock.match(/(?:QUESTION|PREGUNTA|ITEM|Q)\s*\d+[\s.:]*([\s\S]*?)(?=(?:\n\s*[A-E][).:\s]|\n\s*ANSWER|\n\s*RESPUESTA|$))/i);
      let questionText = qMatch ? qMatch[1].trim() : "";

      if (!questionText && trimmedBlock.length > 20) {
        // Alternative line extraction
        const lines = trimmedBlock.split('\n');
        questionText = lines[0].replace(/^(?:QUESTION|PREGUNTA|ITEM|Q)\s*\d+[\s.:]*/i, '').trim();
      }

      if (!questionText) return;

      // Extract Options: A), B), C), D) or A., B., C.
      const optionMatches = [...trimmedBlock.matchAll(/(?:^|\n)\s*([A-E])[).:\s]+([^\n]+)/gi)];
      const options = [];
      let optionLetters = [];

      optionMatches.forEach(m => {
        const letter = m[1].toUpperCase();
        const content = m[2].trim();
        if (content && !optionLetters.includes(letter)) {
          options.push(content);
          optionLetters.push(letter);
        }
      });

      // Extract Correct Answer
      const ansMatch = trimmedBlock.match(/(?:ANSWER|RESPUESTA|CORRECT ANSWER|KEY)[\s.:]*([A-E])/i);
      let correctAnswerIndex = 0;
      if (ansMatch) {
        const letter = ansMatch[1].toUpperCase();
        correctAnswerIndex = optionLetters.indexOf(letter);
        if (correctAnswerIndex === -1) correctAnswerIndex = 0;
      }

      // Extract Explanation
      const expMatch = trimmedBlock.match(/(?:EXPLANATION|EXPLICACIÓN|NOTE|NOTAS)[\s.:]*([\s\S]*?)$/i);
      const explanation = expMatch ? expMatch[1].trim() : "Revisa el material de estudio para validar esta respuesta.";

      if (options.length >= 2) {
        questions.push({
          id: questions.length + 1,
          question: questionText,
          options: options,
          correctAnswerIndex: correctAnswerIndex,
          explanation: explanation,
          domain: "Comprensión del Documento"
        });
      }
    });

    return questions;
  }

  /**
   * Generates Q&A from raw notes if no explicit quiz structure exists.
   */
  static autoGenerateQuestionsFromStudyMaterial(text) {
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 200);

    if (sentences.length === 0) {
      return [
        {
          id: 1,
          question: "¿Cuál es el concepto principal tratado en el documento cargado?",
          options: [
            "Resumen general y fundamentos del tema",
            "Configuración avanzada de sistemas",
            "Análisis de requerimientos secundarios",
            "Ninguna de las anteriores"
          ],
          correctAnswerIndex: 0,
          explanation: "Basado en la lectura global del archivo.",
          domain: "General"
        }
      ];
    }

    const generated = [];
    const step = Math.max(1, Math.floor(sentences.length / 10));

    for (let i = 0; i < sentences.length && generated.length < 10; i += step) {
      const sentence = sentences[i];
      const words = sentence.split(" ");
      if (words.length < 6) continue;

      // Create a fill-in-the-blank style key question
      const keyIndex = Math.floor(words.length / 2);
      const keyWord = words[keyIndex];
      const maskedSentence = words.map((w, idx) => idx === keyIndex ? "________" : w).join(" ");

      generated.push({
        id: generated.length + 1,
        question: `De acuerdo al documento, completa el enunciado: "${maskedSentence}"`,
        options: [
          keyWord,
          "configuración",
          "proceso",
          "estructura"
        ],
        correctAnswerIndex: 0,
        explanation: `Texto original del documento: "${sentence}".`,
        domain: "Comprensión Lectora"
      });
    }

    return generated;
  }

  /**
   * Helper to normalize raw question objects
   */
  static normalizeQuestions(rawList) {
    return rawList.map((q, idx) => ({
      id: idx + 1,
      question: q.question || q.prompt || `Pregunta ${idx + 1}`,
      options: Array.isArray(q.options) ? q.options : ["Opción A", "Opción B"],
      correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
      explanation: q.explanation || "Sin explicación adicional.",
      domain: q.domain || "General"
    }));
  }
}
