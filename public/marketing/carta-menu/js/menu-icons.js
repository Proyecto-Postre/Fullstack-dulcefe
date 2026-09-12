/**
 * DULCE FE - ICONOGRAFÍA Y ORNAMENTOS SVG VECTORIALES
 * 100% libre de emojis. Calidad editorial y de imprenta.
 */

window.DULCE_FE_ICONS = {
  // Sello Circular "HECHOS CON DEDICACIÓN" con Batidor
  // Con texto inferior al derecho y legible (antihorario)
  stamp: function(variant = 'dark') {
    const color = variant === 'light' ? '#FFFFFF' : '#333A18';
    const subColor = variant === 'light' ? 'rgba(255,255,255,0.85)' : '#4A5D23';
    return `
      <svg class="stamp-svg" viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <!-- Semicírculo superior en sentido horario -->
          <path id="circle-top" d="M 28,100 A 72,72 0 0,1 172,100" fill="none" />
          <!-- Semicírculo inferior en sentido antihorario para que el texto DEDICACIÓN quede al derecho -->
          <path id="circle-bottom" d="M 28,100 A 72,72 0 0,0 172,100" fill="none" />
        </defs>
        <!-- Círculos concéntricos ornamentales -->
        <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.8"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="${color}" stroke-width="1.2" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2,3" opacity="0.6"/>
        
        <!-- Texto superior arqueado -->
        <text fill="${color}" font-family="'Playfair Display', Georgia, serif" font-size="14" font-weight="600" letter-spacing="3.5">
          <textPath href="#circle-top" startOffset="50%" text-anchor="middle">HECHOS CON</textPath>
        </text>

        <!-- Texto inferior arqueado (al derecho) -->
        <text fill="${color}" font-family="'Playfair Display', Georgia, serif" font-size="13" font-weight="600" letter-spacing="4">
          <textPath href="#circle-bottom" startOffset="50%" text-anchor="middle">DEDICACIÓN</textPath>
        </text>

        <!-- Puntitos laterales -->
        <circle cx="27" cy="100" r="2.5" fill="${subColor}" />
        <circle cx="173" cy="100" r="2.5" fill="${subColor}" />

        <!-- Batidor manual central ilustrado -->
        <g transform="translate(85, 62) scale(0.65)" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <rect x="21" y="2" width="6" height="32" rx="3" fill="${color}"/>
          <circle cx="24" cy="5" r="2" fill="${variant === 'light' ? '#333A18' : '#ffffff'}"/>
          <line x1="19" y1="34" x2="29" y2="34" stroke-width="3"/>
          <path d="M 24,35 C 10,48 5,65 14,84 C 20,96 28,96 34,84 C 43,65 38,48 24,35 Z" stroke-width="2"/>
          <path d="M 24,35 C 15,50 12,68 18,82 C 22,90 26,90 30,82 C 36,68 33,50 24,35 Z" stroke-width="1.6"/>
          <line x1="24" y1="35" x2="24" y2="88" stroke-width="1.8"/>
        </g>
      </svg>
    `;
  },

  // Ornamento superior con corazón y hojitas
  topOrnament: function() {
    return `
      <svg class="ornament-svg" viewBox="0 0 160 30" width="130" height="25" fill="#3D4F37">
        <path d="M80,18 C78,13 71,11 68,16 C65,21 78,28 80,30 C82,28 95,21 92,16 C89,11 82,13 80,18 Z" fill="#4A5D23"/>
        <path d="M66,19 C55,18 42,16 30,14" stroke="#4A5D23" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M58,18 C57,14 52,13 50,16 C53,18 57,18 58,18 Z"/>
        <path d="M48,16 C47,11 41,11 40,14 C43,16 47,16 48,16 Z"/>
        <path d="M38,15 C37,9 30,10 29,13 C32,15 37,15 38,15 Z"/>
        <circle cx="24" cy="14" r="1.8"/>
        <path d="M94,19 C105,18 118,16 130,14" stroke="#4A5D23" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M102,18 C103,14 108,13 110,16 C107,18 103,18 102,18 Z"/>
        <path d="M112,16 C113,11 119,11 120,14 C117,16 113,16 112,16 Z"/>
        <path d="M122,15 C123,9 130,10 131,13 C128,15 123,15 122,15 Z"/>
        <circle cx="136" cy="14" r="1.8"/>
      </svg>
    `;
  },

  // Corazón con dos ramitas laterales (exacto al de debajo del banner de pincelada)
  heartSprigs: function() {
    return `
      <svg viewBox="0 0 100 24" width="80" height="20" fill="#586749">
        <!-- Corazón central -->
        <path d="M50,16 C48,11 43,9 41,13 C39,17 48,22 50,24 C52,22 61,17 59,13 C57,9 52,11 50,16 Z" fill="#586749"/>
        <!-- Ramita izquierda con 2 hojas -->
        <path d="M39,17 C31,17 25,18 20,20" stroke="#586749" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <path d="M32,17 C30,12 24,13 24,17 C27,17 30,17 32,17 Z" fill="#586749"/>
        <path d="M22,19 C18,16 14,18 15,21 C17,21 20,20 22,19 Z" fill="#586749"/>
        <!-- Ramita derecha con 2 hojas -->
        <path d="M61,17 C69,17 75,18 80,20" stroke="#586749" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <path d="M68,17 C70,12 76,13 76,17 C73,17 70,17 68,17 Z" fill="#586749"/>
        <path d="M78,19 C82,16 86,18 85,21 C83,21 80,20 78,19 Z" fill="#586749"/>
      </svg>
    `;
  },

  // Ornamento de footer con corazón y arabescos finos
  footerOrnament: function() {
    return `
      <svg class="footer-ornament-svg" viewBox="0 0 280 40" width="220" height="32" fill="#3D4F37">
        <path d="M140,24 C137,18 128,16 125,22 C121,29 138,37 140,40 C142,37 159,29 155,22 C152,16 143,18 140,24 Z" fill="#3D4F37"/>
        <path d="M120,24 C95,23 75,32 50,30 C35,29 25,20 20,20" stroke="#3D4F37" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M20,20 C16,20 12,24 16,28 C20,31 25,26 22,23" stroke="#3D4F37" stroke-width="1.2" fill="none"/>
        <path d="M160,24 C185,23 205,32 230,30 C245,29 255,20 260,20" stroke="#3D4F37" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M260,20 C264,20 268,24 264,28 C260,31 255,26 258,23" stroke="#3D4F37" stroke-width="1.2" fill="none"/>
        <path d="M105,24 C100,19 90,20 92,25 C97,26 103,25 105,24 Z"/>
        <path d="M75,27 C70,22 62,24 64,28 C68,29 73,28 75,27 Z"/>
        <path d="M175,24 C180,19 190,20 188,25 C183,26 177,25 175,24 Z"/>
        <path d="M205,27 C210,22 218,24 216,28 C212,29 207,28 205,27 Z"/>
      </svg>
    `;
  },

  // Pequeño ramo de 3 hojitas
  sectionLeaves: function() {
    return `
      <svg viewBox="0 0 60 20" width="38" height="14" fill="#4A5D23">
        <path d="M30,12 C28,7 20,6 18,10 C16,14 28,19 30,20 C32,19 44,14 42,10 C40,6 32,7 30,12 Z"/>
        <path d="M20,12 C14,8 8,11 11,15 C14,15 18,13 20,12 Z"/>
        <path d="M40,12 C46,8 52,11 49,15 C46,15 42,13 40,12 Z"/>
      </svg>
    `;
  },

  // Icono lineal fino de la cajita de repostería (para los paquetes de bocaditos)
  boxPackage: function() {
    return `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="#353916" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 5px;">
        <path d="M12 3 L21 7.5 L12 12 L3 7.5 Z"></path>
        <path d="M3 7.5 L3 16.5 L12 21 L12 12"></path>
        <path d="M21 7.5 L21 16.5 L12 21"></path>
        <path d="M7.5 5.25 L16.5 9.75"></path>
      </svg>
    `;
  },

  // Colección de Íconos Lineales Ilustrados en Circulito para Postres (Láminas 1 y 4)
  getIcon: function(name) {
    const stroke = "#353916";
    const bgCircle = `<circle cx="28" cy="28" r="26" fill="none" stroke="${stroke}" stroke-width="1.4" opacity="0.65"/>`;
    
    let inner = '';
    switch(name) {
      case 'cookie-chocochip':
        inner = `
          <circle cx="28" cy="28" r="16" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-dasharray="2,2"/>
          <circle cx="28" cy="28" r="15" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="24" cy="22" r="1.8" fill="${stroke}"/>
          <circle cx="32" cy="24" r="2.2" fill="${stroke}"/>
          <circle cx="23" cy="31" r="1.8" fill="${stroke}"/>
          <circle cx="31" cy="33" r="1.6" fill="${stroke}"/>
          <circle cx="27" cy="28" r="1.5" fill="${stroke}"/>
        `;
        break;
      case 'cookie-oats':
        inner = `
          <circle cx="28" cy="28" r="16" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M22,23 Q24,21 26,23" stroke="${stroke}" stroke-width="1.5" fill="none"/>
          <path d="M30,22 Q32,20 34,22" stroke="${stroke}" stroke-width="1.5" fill="none"/>
          <path d="M23,32 Q25,30 27,32" stroke="${stroke}" stroke-width="1.5" fill="none"/>
          <path d="M29,31 Q31,29 33,31" stroke="${stroke}" stroke-width="1.5" fill="none"/>
          <ellipse cx="28" cy="27" rx="2.5" ry="3.5" fill="${stroke}"/>
        `;
        break;
      case 'cookie-lemon':
        inner = `
          <circle cx="28" cy="28" r="16" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <circle cx="28" cy="28" r="13" fill="none" stroke="${stroke}" stroke-width="1"/>
          <line x1="28" y1="15" x2="28" y2="41" stroke="${stroke}" stroke-width="1"/>
          <line x1="15" y1="28" x2="41" y2="28" stroke="${stroke}" stroke-width="1"/>
          <line x1="19" y1="19" x2="37" y2="37" stroke="${stroke}" stroke-width="1"/>
          <line x1="19" y1="37" x2="37" y2="19" stroke="${stroke}" stroke-width="1"/>
        `;
        break;
      case 'cookie-jelly':
        inner = `
          <circle cx="28" cy="28" r="16" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-dasharray="3,1.5"/>
          <path d="M28,24 C26,20 20,20 20,24 C20,27 28,33 28,33 C28,33 36,27 36,24 C36,20 30,20 28,24 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
        `;
        break;
      case 'alfajor-box':
        inner = `
          <ellipse cx="28" cy="23" rx="13" ry="4" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M15,23 C15,25 17,28 28,28 C39,28 41,25 41,23" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M16,26 Q28,30 40,26" stroke="${stroke}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="28" cy="31" rx="13" ry="4" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M15,31 C15,33 17,35 28,35 C39,35 41,33 41,31" fill="none" stroke="${stroke}" stroke-width="1.5"/>
        `;
        break;
      case 'cup-dessert':
        inner = `
          <!-- Copita / Vaso Cuchareable Facetado con Capas y Crema -->
          <path d="M19,23 L22,39 C22,41.5 24,42.5 28,42.5 C32,42.5 34,41.5 34,39 L37,23 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M20,28 Q28,30 36,28" stroke="${stroke}" stroke-width="1.2" fill="none"/>
          <path d="M21,34 Q28,36 35,34" stroke="${stroke}" stroke-width="1.2" fill="none"/>
          <!-- Espuma / crema superior con cereza -->
          <path d="M19,23 C18,18 23,17 28,17 C33,17 38,18 37,23" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="28" cy="14.5" r="2.2" fill="${stroke}"/>
        `;
        break;
      case 'cake-slice':
        inner = `
          <path d="M16,34 L40,34 L38,22 L16,34 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M16,28 L39,28" stroke="${stroke}" stroke-width="1.2"/>
          <circle cx="36" cy="19" r="2.5" fill="${stroke}"/>
          <line x1="16" y1="38" x2="40" y2="38" stroke="${stroke}" stroke-width="1.5"/>
        `;
        break;
      case 'muffin':
      case 'muffin-chips':
        inner = `
          <path d="M19,27 L22,40 L34,40 L37,27 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="24" y1="27" x2="25" y2="40" stroke="${stroke}" stroke-width="1"/>
          <line x1="28" y1="27" x2="28" y2="40" stroke="${stroke}" stroke-width="1"/>
          <line x1="32" y1="27" x2="31" y2="40" stroke="${stroke}" stroke-width="1"/>
          <path d="M18,27 C15,24 17,19 22,18 C25,14 31,14 34,18 C39,19 41,24 38,27 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          ${name === 'muffin-chips' ? `
            <circle cx="25" cy="21" r="1.2" fill="${stroke}"/>
            <circle cx="31" cy="22" r="1.2" fill="${stroke}"/>
            <circle cx="28" cy="24" r="1.2" fill="${stroke}"/>
          ` : ''}
        `;
        break;
      case 'cupcake-frosting':
        inner = `
          <path d="M20,28 L22,41 L34,41 L36,28 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="25" y1="28" x2="26" y2="41" stroke="${stroke}" stroke-width="1"/>
          <line x1="31" y1="28" x2="30" y2="41" stroke="${stroke}" stroke-width="1"/>
          <path d="M19,28 C18,23 23,24 28,24 C33,24 38,23 37,28 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M21,24 C22,19 26,19 28,19 C30,19 34,19 35,24" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="28" cy="16" r="2.5" fill="${stroke}"/>
        `;
        break;
      case 'brownies-box':
        inner = `
          <path d="M16,24 L28,18 L40,24 L28,30 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M16,24 L16,33 L28,39 L28,30 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M40,24 L40,33 L28,39 L28,30 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <circle cx="25" cy="23" r="1" fill="${stroke}"/>
          <circle cx="31" cy="22" r="1.2" fill="${stroke}"/>
          <circle cx="28" cy="26" r="1" fill="${stroke}"/>
        `;
        break;
      case 'apple-pie':
        inner = `
          <ellipse cx="28" cy="30" rx="14" ry="6" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M14,30 C14,34 18,37 28,37 C38,37 42,34 42,30" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M22,27 C24,24 28,24 30,27" stroke="${stroke}" stroke-width="1.4" fill="none"/>
          <path d="M26,29 C28,26 32,26 34,29" stroke="${stroke}" stroke-width="1.4" fill="none"/>
        `;
        break;
      case 'berry-tart':
        inner = `
          <ellipse cx="28" cy="31" rx="13" ry="5" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M15,31 C15,35 18,37 28,37 C38,37 41,35 41,31" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M28,17 C25,21 23,26 28,28 C33,26 31,21 28,17 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M26,17 C27,15 29,15 30,17" stroke="${stroke}" stroke-width="1.2" fill="none"/>
        `;
        break;
      default:
        inner = `<circle cx="28" cy="28" r="8" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;
    }

    return `
      <svg class="product-icon-svg" viewBox="0 0 56 56" width="46" height="46">
        ${bgCircle}
        ${inner}
      </svg>
    `;
  }
};
