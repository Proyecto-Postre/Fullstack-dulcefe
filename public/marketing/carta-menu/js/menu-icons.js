/**
 * DULCE FE - ICONOGRAFÍA Y ORNAMENTOS SVG VECTORIALES
 * Calidad de imprenta (Vectorial sin pérdida de resolución)
 */

window.DULCE_FE_ICONS = {
  // Sello Circular "HECHOS CON DEDICACIÓN" con Batidor
  stamp: function(variant = 'dark') {
    const color = variant === 'light' ? '#ffffff' : '#2D3E2B';
    const subColor = variant === 'light' ? 'rgba(255,255,255,0.85)' : '#4A5D23';
    return `
      <svg class="stamp-svg" viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <path id="circle-top" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
          <path id="circle-bottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />
        </defs>
        <!-- Círculos concéntricos ornamentales -->
        <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.7"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="${color}" stroke-width="1.2" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2,3" opacity="0.6"/>
        
        <!-- Texto superior arqueado -->
        <text fill="${color}" font-family="'Playfair Display', serif" font-size="14" font-weight="600" letter-spacing="3.5">
          <textPath href="#circle-top" startOffset="50%" text-anchor="middle">HECHOS CON</textPath>
        </text>

        <!-- Texto inferior arqueado -->
        <text fill="${color}" font-family="'Playfair Display', serif" font-size="13" font-weight="600" letter-spacing="4">
          <textPath href="#circle-bottom" startOffset="50%" text-anchor="middle">DEDICACIÓN</textPath>
        </text>

        <!-- Puntitos laterales -->
        <circle cx="28" cy="100" r="2.5" fill="${subColor}" />
        <circle cx="172" cy="100" r="2.5" fill="${subColor}" />

        <!-- Batidor manual central ilustrado -->
        <g transform="translate(85, 62) scale(0.65)" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <!-- Mango -->
          <rect x="21" y="2" width="6" height="32" rx="3" fill="${color}"/>
          <circle cx="24" cy="5" r="2" fill="${variant === 'light' ? '#2D3E2B' : '#ffffff'}"/>
          <line x1="19" y1="34" x2="29" y2="34" stroke-width="3"/>
          <!-- Alambres del globo -->
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
      <svg class="ornament-svg" viewBox="0 0 160 30" width="120" height="24" fill="#3D4F37">
        <path d="M80,18 C78,13 71,11 68,16 C65,21 78,28 80,30 C82,28 95,21 92,16 C89,11 82,13 80,18 Z" fill="#4A5D23"/>
        <!-- Ramitas izquierda -->
        <path d="M66,19 C55,18 42,16 30,14" stroke="#4A5D23" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M58,18 C57,14 52,13 50,16 C53,18 57,18 58,18 Z"/>
        <path d="M48,16 C47,11 41,11 40,14 C43,16 47,16 48,16 Z"/>
        <path d="M38,15 C37,9 30,10 29,13 C32,15 37,15 38,15 Z"/>
        <circle cx="24" cy="14" r="1.8"/>
        <!-- Ramitas derecha -->
        <path d="M94,19 C105,18 118,16 130,14" stroke="#4A5D23" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M102,18 C103,14 108,13 110,16 C107,18 103,18 102,18 Z"/>
        <path d="M112,16 C113,11 119,11 120,14 C117,16 113,16 112,16 Z"/>
        <path d="M122,15 C123,9 130,10 131,13 C128,15 123,15 122,15 Z"/>
        <circle cx="136" cy="14" r="1.8"/>
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
        <!-- Hojitas delicadas -->
        <path d="M105,24 C100,19 90,20 92,25 C97,26 103,25 105,24 Z"/>
        <path d="M75,27 C70,22 62,24 64,28 C68,29 73,28 75,27 Z"/>
        <path d="M175,24 C180,19 190,20 188,25 C183,26 177,25 175,24 Z"/>
        <path d="M205,27 C210,22 218,24 216,28 C212,29 207,28 205,27 Z"/>
      </svg>
    `;
  },

  // Pequeñas hojitas para separadores de sección
  sectionLeaves: function() {
    return `
      <svg viewBox="0 0 60 20" width="40" height="14" fill="#4A5D23">
        <path d="M30,12 C28,7 20,6 18,10 C16,14 28,19 30,20 C32,19 44,14 42,10 C40,6 32,7 30,12 Z"/>
        <path d="M20,12 C14,8 8,11 11,15 C14,15 18,13 20,12 Z"/>
        <path d="M40,12 C46,8 52,11 49,15 C46,15 42,13 40,12 Z"/>
      </svg>
    `;
  },

  // Colección de Íconos Lineales Ilustrados en Circulito
  getIcon: function(name) {
    const stroke = "#2D3E2B";
    const bgCircle = `<circle cx="28" cy="28" r="26" fill="none" stroke="${stroke}" stroke-width="1.3" opacity="0.6"/>`;
    
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
          <!-- Gajos de limón -->
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
      case 'alfajor-reg':
        inner = `
          <ellipse cx="28" cy="22" rx="14" ry="4" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M14,22 C14,24 16,27 28,27 C40,27 42,24 42,22" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <!-- Relleno manjar blanco -->
          <path d="M15,25 Q28,29 41,25" stroke="${stroke}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="28" cy="30" rx="14" ry="4" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M14,30 C14,32 16,35 28,35 C40,35 42,32 42,30" fill="none" stroke="${stroke}" stroke-width="1.5"/>
        `;
        break;
      case 'cup-dessert':
        inner = `
          <!-- Vasito -->
          <path d="M20,22 L22,39 C22,41 24,42 28,42 C32,42 34,41 34,39 L36,22 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <!-- Capas -->
          <path d="M21,27 Q28,29 35,27" stroke="${stroke}" stroke-width="1.2" fill="none"/>
          <path d="M21.5,33 Q28,35 34.5,33" stroke="${stroke}" stroke-width="1.2" fill="none"/>
          <!-- Copete y cereza -->
          <path d="M20,22 C20,17 25,16 28,16 C31,16 36,17 36,22" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="28" cy="14" r="2.2" fill="${stroke}"/>
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
          <!-- Base capacillo -->
          <path d="M19,27 L22,40 L34,40 L37,27 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="24" y1="27" x2="25" y2="40" stroke="${stroke}" stroke-width="1"/>
          <line x1="28" y1="27" x2="28" y2="40" stroke="${stroke}" stroke-width="1"/>
          <line x1="32" y1="27" x2="31" y2="40" stroke="${stroke}" stroke-width="1"/>
          <!-- Domo esponjoso -->
          <path d="M18,27 C15,24 17,19 22,18 C25,14 31,14 34,18 C39,19 41,24 38,27 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
        `;
        break;
      case 'cupcake-frosting':
        inner = `
          <path d="M20,28 L22,41 L34,41 L36,28 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="25" y1="28" x2="26" y2="41" stroke="${stroke}" stroke-width="1"/>
          <line x1="31" y1="28" x2="30" y2="41" stroke="${stroke}" stroke-width="1"/>
          <!-- Frosting en espiral -->
          <path d="M19,28 C18,23 23,24 28,24 C33,24 38,23 37,28 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M21,24 C22,19 26,19 28,19 C30,19 34,19 35,24" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <circle cx="28" cy="16" r="2.5" fill="${stroke}"/>
        `;
        break;
      case 'brownies-box':
      case 'brownie-cube':
        inner = `
          <path d="M16,24 L28,18 L40,24 L28,30 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M16,24 L16,33 L28,39 L28,30 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M40,24 L40,33 L28,39 L28,30 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <!-- Textura de chispas en el brownie -->
          <circle cx="25" cy="23" r="1" fill="${stroke}"/>
          <circle cx="31" cy="22" r="1.2" fill="${stroke}"/>
          <circle cx="28" cy="26" r="1" fill="${stroke}"/>
        `;
        break;
      case 'apple-pie':
      case 'tartlet':
        inner = `
          <!-- Molde rizado -->
          <ellipse cx="28" cy="30" rx="14" ry="6" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M14,30 C14,34 18,37 28,37 C38,37 42,34 42,30" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <!-- Rebanadas de manzana en roseta -->
          <path d="M22,27 C24,24 28,24 30,27" stroke="${stroke}" stroke-width="1.4" fill="none"/>
          <path d="M26,29 C28,26 32,26 34,29" stroke="${stroke}" stroke-width="1.4" fill="none"/>
        `;
        break;
      case 'berry-tart':
        inner = `
          <ellipse cx="28" cy="31" rx="13" ry="5" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M15,31 C15,35 18,37 28,37 C38,37 41,35 41,31" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <!-- Fresa en la cima -->
          <path d="M28,17 C25,21 23,26 28,28 C33,26 31,21 28,17 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M26,17 C27,15 29,15 30,17" stroke="${stroke}" stroke-width="1.2" fill="none"/>
        `;
        break;
      case 'cinnamon-roll':
        inner = `
          <ellipse cx="28" cy="27" rx="15" ry="11" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <path d="M28,21 C33,21 38,24 38,27 C38,32 32,34 27,34 C21,34 18,30 18,27 C18,23 22,23 26,23 C30,23 32,25 32,27 C32,29 30,30 28,30" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round"/>
        `;
        break;
      case 'cookie-bite':
        inner = `
          <path d="M38,22 C34,22 34,26 31,26 C28,26 28,30 31,31 C34,32 35,35 38,34 C36,40 31,43 25,41 C17,38 14,28 17,21 C21,14 30,14 37,18" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <circle cx="23" cy="24" r="1.6" fill="${stroke}"/>
          <circle cx="28" cy="28" r="1.8" fill="${stroke}"/>
          <circle cx="22" cy="32" r="1.5" fill="${stroke}"/>
        `;
        break;
      case 'milhojas':
        inner = `
          <path d="M16,23 L28,17 L40,23 L28,29 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M16,27 L28,33 L40,27" fill="none" stroke="${stroke}" stroke-width="1.2"/>
          <path d="M16,31 L28,37 L40,31" fill="none" stroke="${stroke}" stroke-width="1.2"/>
          <line x1="16" y1="23" x2="16" y2="35" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="28" y1="29" x2="28" y2="41" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="40" y1="23" x2="40" y2="35" stroke="${stroke}" stroke-width="1.5"/>
        `;
        break;
      case 'orejitas':
        inner = `
          <!-- Forma de corazón de hojaldre doble -->
          <path d="M28,36 C22,30 16,24 16,19 C16,15 19,13 22,14 C25,15 26,18 26,20" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M28,36 C34,30 40,24 40,19 C40,15 37,13 34,14 C31,15 30,18 30,20" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M20,18 C19,21 23,26 28,30 C33,26 37,21 36,18" fill="none" stroke="${stroke}" stroke-width="1.2"/>
        `;
        break;
      case 'empanada':
      case 'empanada-dark':
        inner = `
          <path d="M14,32 C14,18 42,18 42,32 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <!-- Repulgue rizado -->
          <path d="M14,32 C17,30 20,34 23,32 C26,30 29,34 32,32 C35,30 38,34 42,32" stroke="${stroke}" stroke-width="1.6" fill="none"/>
        `;
        break;
      case 'canastilla':
        inner = `
          <path d="M17,26 L20,38 L36,38 L39,26 Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <line x1="22" y1="26" x2="24" y2="38" stroke="${stroke}" stroke-width="1"/>
          <line x1="28" y1="26" x2="28" y2="38" stroke="${stroke}" stroke-width="1"/>
          <line x1="34" y1="26" x2="32" y2="38" stroke="${stroke}" stroke-width="1"/>
          <!-- Aceitunitas redondas -->
          <circle cx="24" cy="22" r="3.2" fill="none" stroke="${stroke}" stroke-width="1.4"/>
          <circle cx="32" cy="22" r="3.2" fill="none" stroke="${stroke}" stroke-width="1.4"/>
          <circle cx="28" cy="18" r="3" fill="${stroke}"/>
        `;
        break;
      case 'enrolladito':
        inner = `
          <ellipse cx="20" cy="30" rx="4" ry="7" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M20,23 L36,20 C38,20 40,24 40,27 C40,30 38,34 36,34 L20,37" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <!-- Relleno salchicha -->
          <ellipse cx="20" cy="30" rx="2" ry="4" fill="${stroke}"/>
          <!-- Estrías de masa -->
          <path d="M26,22 C28,24 28,33 26,36" stroke="${stroke}" stroke-width="1.2" fill="none"/>
          <path d="M32,21 C34,23 34,31 32,35" stroke="${stroke}" stroke-width="1.2" fill="none"/>
        `;
        break;
      case 'triple':
      case 'triple-premium':
        inner = `
          <path d="M18,22 L38,18 L38,36 L18,40 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>
          <line x1="18" y1="28" x2="38" y2="24" stroke="${stroke}" stroke-width="1.3"/>
          <line x1="18" y1="34" x2="38" y2="30" stroke="${stroke}" stroke-width="1.3"/>
          <!-- Topping decorativo -->
          <circle cx="28" cy="14" r="2" fill="${stroke}"/>
          <path d="M28,16 L28,19" stroke="${stroke}" stroke-width="1.5"/>
        `;
        break;
      case 'alfajor-chips':
        inner = `
          <ellipse cx="28" cy="22" rx="14" ry="4" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M15,25 Q28,29 41,25" stroke="${stroke}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="28" cy="30" rx="14" ry="4" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <path d="M14,30 C14,32 16,35 28,35 C40,35 42,32 42,30" fill="none" stroke="${stroke}" stroke-width="1.5"/>
          <!-- Chispas -->
          <circle cx="24" cy="21" r="1.2" fill="${stroke}"/>
          <circle cx="32" cy="22" r="1.2" fill="${stroke}"/>
          <circle cx="28" cy="30" r="1.2" fill="${stroke}"/>
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
