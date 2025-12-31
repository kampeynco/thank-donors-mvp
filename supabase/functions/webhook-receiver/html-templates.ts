import { escapeHtml, BRANDING_NOTE } from "./utils.ts";

export function generatePostcardBackHtml(message: string, showBranding: boolean = true): string {
  // Replace literal \n with actual newlines, then escape HTML
  const processedMessage = message.replace(/\\n/g, '\n');
  const escapedMessage = escapeHtml(processedMessage);
  // Refined scaling: 8pt for short messages, down to 5pt for long ones
  const fontSize = Math.max(7, 11 - (processedMessage.length / 500) * 4);
  console.log(`📏 Calculated font size for message (length ${processedMessage.length}): ${fontSize}pt`);

  return `
  <html>
  <head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
    body {
      width: 6in;
      height: 4in;
      margin: 0;
      padding: 0;
      background: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .back-container {
      width: 6in;
      height: 4in;
      position: relative;
      background: white;
      overflow: hidden;
    }
    .content-area {
      position: absolute;
      top: 0.4in;
      left: 0.4in;
      width: 2.125in;
      height: 3.2in;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      box-sizing: border-box;
      overflow: hidden;
      /*border: 2px solid red; /* DEBUG: Verify width and deployment */
    }
    .message-text {
      width: 100%;
      font-size: ${fontSize}pt;
      line-height: 1.4;
      color: #1c1917;
      white-space: pre-wrap;
      word-wrap: break-word;     /* Legacy support */
      word-break: break-word;    /* Standard */
      overflow-wrap: anywhere;   /* Force breaking at any point if necessary */
      margin: 0;
    }
    .branding-note {
      position: absolute;
      bottom: 0.4in;
      left: 0.4in;
      font-size: 8.5pt;
      color: #52525b;
    }
    </style>
  </head>
  <body>
  <div class="back-container">
    <div class="content-area">
      <p class="message-text">${escapedMessage}</p>
    </div>
    ${showBranding ? `
    <div class="branding-note">
    <strong>
      ${BRANDING_NOTE}
    </strong>
    </div>
    ` : ''}
  </div>
  </body>
  </html>
  `.trim();
}

export function generatePostcardFrontHtml(imageUrl: string, disclaimer: string | null, _showBranding: boolean): string {
  const escapedDisclaimer = disclaimer ? escapeHtml(disclaimer) : null;

  return `
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      width: 6in;
      height: 4in;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
      background: #f8fafc;
    }
    .front-container {
      width: 6in;
      height: 4in;
      position: relative;
      background-image: url('${imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .disclaimer-overlay {
      position: absolute;
      bottom: 0.1in;
      left: 0;
      right: 0;
      background-color: transparent;
      color: white;
      padding: 0 0.4in;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 8.5pt;
      line-height: 1.3;
      text-align: center;
      letter-spacing: 0.01em;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
  </style>
</head>
<body>
  <div class="front-container">
    ${escapedDisclaimer ? `<div class="disclaimer-overlay">${escapedDisclaimer}</div>` : ''}
  </div>
</body>
</html>
`.trim();
}