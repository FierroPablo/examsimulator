# Generador y simulador de exámenes de certificación (versión fusionada)

Une dos enfoques: generación real de preguntas por IA a partir de un PDF, y
las funciones de simulador de examen (catálogo, modo examen/práctica,
banderas, cronómetro con pausa, navegación por cuadrícula) inspiradas en
otro proyecto revisado.

## Tres formas de cargar un examen

1. **Subir PDF** — la IA lee el PDF real y redacta preguntas nuevas
   (opción múltiple, verdadero/falso, abiertas). Requiere tu API key de
   Anthropic.
2. **Pegar texto** — pega un examen ya formateado (estilo
   `Question 1 / A) ... / Answer: A`) o un JSON. Se procesa localmente con
   patrones, sin IA y sin costo. Si no se detecta la respuesta correcta de
   una pregunta, esa pregunta se convierte en abierta para que te
   autoevalúes, en lugar de asumir una opción al azar.
3. **Catálogo** — un par de exámenes de muestra listos para probar sin
   subir nada.

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior.
- Para la opción "Subir PDF": una **API key de Anthropic** (distinta de tu
  cuenta de claude.ai), obtenida en
  https://console.anthropic.com/settings/keys. Se factura por separado,
  por uso.

## Instalación

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente http://localhost:5173).

## Configuración del examen

- **Cantidad de preguntas**: para PDFs, cuántas genera la IA (5/8/12). Para
  texto pegado o catálogo, cuántas de las detectadas se usan (o todas).
- **Límite de tiempo**: cuenta regresiva en minutos, o sin límite (cuenta
  hacia arriba).
- **Modo**: "Examen real" oculta si acertaste hasta el final; "Práctica"
  te muestra la respuesta correcta y la explicación justo después de
  contestar.

Durante el examen puedes marcar preguntas con la bandera 🏳 para
revisarlas después, saltar entre preguntas con la cuadrícula numerada, y
pausar/reanudar el cronómetro.

## Notas importantes

- La API key queda visible en las peticiones del navegador (herramientas
  de desarrollador). Aceptable para uso personal en tu propia máquina;
  no la compartas ni despliegues esta app públicamente con tu key
  incluida.
- Documentos muy largos pueden requerir tener créditos de uso habilitados
  en tu cuenta de Anthropic (console.anthropic.com), o consumir bastante
  saldo de API — revisa precios en anthropic.com/pricing antes de
  procesar documentos grandes.
