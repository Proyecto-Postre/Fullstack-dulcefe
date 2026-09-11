/**
 * DULCE FE - RENDERIZADO DE ALTA FIDELIDAD
 * 100% libre de emojis, con colores e ilustraciones idénticas a la imagen original.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderAllSheets();
  setupToolbarEvents();
});

function renderAllSheets() {
  const container = document.getElementById('sheetsContainer');
  if (!container) return;

  container.innerHTML = `
    ${renderSheet1()}
    ${renderSheet2()}
    ${renderSheet3()}
    ${renderSheet4()}
  `;
}

// LÁMINA 1: Menú de Postres (Galletería y Cuchareables)
function renderSheet1() {
  const d = window.DULCE_FE_MENU.sheet1;
  const icons = window.DULCE_FE_ICONS;

  const galleteriaItems = d.sections[0].items.map(item => `
    <div class="product-item-row">
      <div class="product-icon">${icons.getIcon(item.icon)}</div>
      <div class="product-name editable-field" contenteditable="false">${item.name}</div>
      <div class="product-dots"></div>
      <div class="product-badge-price editable-field" contenteditable="false">${item.price}</div>
    </div>
  `).join('');

  const cuchareablesItems = d.sections[1].items.map(item => `
    <div class="product-item-row">
      <div class="product-icon">${icons.getIcon(item.icon)}</div>
      <div class="product-name editable-field" contenteditable="false">${item.name}</div>
      <div class="product-dots"></div>
      <div class="product-badge-price editable-field" contenteditable="false">${item.price}</div>
    </div>
  `).join('');

  return `
    <div class="menu-sheet" id="sheet-1" data-sheet="1">
      <!-- Ondas Verdes Laterales en SVG con Pespunte Exacto -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 576 1024" width="100%" height="100%" preserveAspectRatio="none">
          <!-- Onda derecha verde olivo -->
          <path d="M 390,0 C 420,150 490,220 440,380 C 400,480 515,620 540,750 C 560,840 525,940 576,1024 L 576,0 Z" fill="#4D4D29" />
          <path d="M 405,0 C 435,150 505,220 455,380 C 415,480 530,620 555,750 C 575,840 540,940 576,1015" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
          
          <!-- Onda inferior izquierda -->
          <path d="M 0,830 C 35,890 70,940 130,1024 L 0,1024 Z" fill="#4D4D29" />
          <path d="M 0,815 C 40,875 75,925 140,1024" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
        </svg>
      </div>

      <!-- Ilustraciones Botánicas Originales Transparentes -->
      <img src="assets/orig_leaves_top_left.png" class="botanical-leaves leaves-top-left" alt="Ramas de Olivo"/>
      <img src="assets/orig_leaves_bottom_right.png" class="botanical-leaves leaves-bottom-right" alt="Ramas de Olivo"/>

      <!-- Sello Superior Derecho -->
      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('light')}
      </div>

      <!-- Frase Vertical Lateral -->
      <div class="side-quote side-quote-top-right light">
        ENDULZA<br>TU DÍA,<br>COMPARTE<br>FELICIDAD.
      </div>

      <!-- Contenido Central -->
      <div class="sheet-content">
        <div class="header-dots">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <div class="menu-header">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false">${d.subtitle}</span>
          
          <!-- Banner Pincelada Original -->
          <div class="brush-banner-exact"></div>
          
          <div class="header-bottom-heart">${icons.heartSprigs()}</div>
        </div>

        <!-- SECCIÓN 1: GALLETERÍA -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[0].title}</h2>
            <div style="margin-top: 3px;">${icons.sectionLeaves()}</div>
          </div>
          <div class="product-items-list">
            ${galleteriaItems}
          </div>
        </div>

        <!-- SECCIÓN 2: POSTRES DE CUCHARA -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <div style="margin-bottom: 3px;">${icons.heartSprigs()}</div>
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[1].title}</h2>
            <div style="margin-top: 3px;">${icons.sectionLeaves()}</div>
            <div class="section-sub-brush editable-field" contenteditable="false">${d.sections[1].badge}</div>
          </div>
          <div class="product-items-list">
            ${cuchareablesItems}
          </div>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="menu-footer">
          <div>${icons.footerOrnament()}</div>
          <p class="footer-phrase editable-field" contenteditable="false">• ${d.footerText} •</p>
        </div>
      </div>
    </div>
  `;
}

// LÁMINA 2: Dulce Fe Bocaditos
function renderSheet2() {
  const d = window.DULCE_FE_MENU.sheet2;
  const icons = window.DULCE_FE_ICONS;

  const categories = [
    {
      title: "ROLES DE CANELA",
      img: "assets/orig_rol_canela.png",
      tables: {
        regular: [
          { label: "Paquete de 4 un", price: "S/ 24.00" },
          { label: "Paquete de 6 un", price: "S/ 34.00" }
        ],
        mini: [
          { label: "Paquete de 12 un", price: "S/ 24.00" },
          { label: "Paquete de 25 un", price: "S/ 48.00" }
        ]
      }
    },
    {
      title: "GALLETITAS",
      img: "assets/orig_galletita.png",
      note: "Sabores disponibles:<br>Chips de chocolate,<br>Limón y Avena.",
      tables: {
        regular: [
          { label: "Paquete de 12 un", price: "S/ 15.00" }
        ],
        mini: [
          { label: "Paquete de 25 un", price: "S/ 15.00" },
          { label: "Paquete de 50 un", price: "S/ 28.00" }
        ]
      }
    },
    {
      title: "MINI BROWNIES",
      img: "assets/orig_brownie.png",
      tables: {
        regular: [
          { label: "Paquete de 4 un", price: "S/ 22.00" },
          { label: "Paquete de 9 un", price: "S/ 45.00" }
        ],
        mini: [
          { label: "Paquete de 25 un", price: "S/ 25.00" },
          { label: "Paquete de 50 un", price: "S/ 48.00" }
        ]
      }
    },
    {
      title: "TARTALETITAS Y MINI PAI DE MANZANA",
      img: "assets/orig_tartaleta.png",
      singleTable: [
        { label: "Paquete de 12 un", price: "S/ 25.00" },
        { label: "Paquete de 25 un", price: "S/ 48.00" },
        { label: "Paquete de 50 un", price: "S/ 92.00" }
      ]
    }
  ];

  const categoriesHtml = categories.map(cat => {
    if (cat.singleTable) {
      const rows = cat.singleTable.map(r => `
        <div class="tier-row">
          <span class="tier-label editable-field" contenteditable="false">${r.label}</span>
          <span class="tier-dots"></span>
          <span class="tier-price editable-field" contenteditable="false">${r.price}</span>
        </div>
      `).join('');

      return `
        <div class="bocadito-block">
          <div class="bocadito-header-badge editable-field" contenteditable="false">${cat.title}</div>
          <div class="bocadito-content-grid single-col">
            <div class="bocadito-left-art">
              <img src="${cat.img}" class="bocadito-art-img" alt="${cat.title}"/>
            </div>
            <div>${rows}</div>
          </div>
        </div>
      `;
    }

    const regularRows = cat.tables.regular.map(r => `
      <div class="tier-row">
        <span class="tier-label editable-field" contenteditable="false">${r.label}</span>
        <span class="tier-dots"></span>
        <span class="tier-price editable-field" contenteditable="false">${r.price}</span>
      </div>
    `).join('');

    const miniRows = cat.tables.mini.map(r => `
      <div class="tier-row">
        <span class="tier-label editable-field" contenteditable="false">${r.label}</span>
        <span class="tier-dots"></span>
        <span class="tier-price editable-field" contenteditable="false">${r.price}</span>
      </div>
    `).join('');

    return `
      <div class="bocadito-block">
        <div class="bocadito-header-badge editable-field" contenteditable="false">${cat.title}</div>
        <div class="bocadito-content-grid">
          <div class="bocadito-left-art">
            <img src="${cat.img}" class="bocadito-art-img" alt="${cat.title}"/>
            ${cat.note ? `<span class="bocadito-subnote editable-field" contenteditable="false">${cat.note}</span>` : ''}
          </div>
          <div>
            <div class="tier-column-title">${icons.sectionLeaves()} Regular</div>
            ${regularRows}
          </div>
          <div>
            <div class="tier-column-title">${icons.sectionLeaves()} Mini</div>
            ${miniRows}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="menu-sheet" id="sheet-2" data-sheet="2">
      <!-- Ondas Verdes en Esquinas Opuestas -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 576 1024" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 0,0 L 190,0 C 150,90 100,160 0,210 Z" fill="#4D4D29" />
          <path d="M 0,0 L 205,0 C 165,90 115,160 0,225" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
          
          <path d="M 576,700 C 470,800 420,900 576,1024 Z" fill="#4D4D29" />
          <path d="M 576,680 C 455,795 405,895 576,1024" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
        </svg>
      </div>

      <img src="assets/orig_leaves_top_left.png" class="botanical-leaves leaves-top-left" style="transform: scale(0.9);" alt="Olivo"/>
      <img src="assets/orig_leaves_bottom_right.png" class="botanical-leaves leaves-bottom-right" style="transform: scale(0.9) rotate(180deg);" alt="Olivo"/>

      <!-- Sello Original sobre fondo Crema -->
      <div class="stamp-container stamp-pos-top-right">
        <img src="assets/orig_stamp_light.png" style="width: 100%; height: 100%; object-fit: contain;" alt="Sello Dedicación"/>
      </div>

      <div class="sheet-content">
        <div class="menu-header">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false" style="font-size: 3.8rem;">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false" style="font-size: 4rem;">${d.subtitle}</span>
          <p style="font-family: var(--font-serif); font-style: italic; color: #736429; font-size: 0.92rem;">— ${d.tagline} —</p>
        </div>

        <div>
          ${categoriesHtml}
        </div>

        <div class="menu-footer">
          <div>${icons.footerOrnament()}</div>
          <p class="footer-phrase editable-field" contenteditable="false">${d.footerText}</p>
        </div>
      </div>
    </div>
  `;
}

// LÁMINA 3: Menú de Postres 2 (Bizcochos y Tartas)
function renderSheet3() {
  const d = window.DULCE_FE_MENU.sheet3;
  const icons = window.DULCE_FE_ICONS;

  const bizcochosItems = d.sections[0].items.map(item => `
    <div class="product-item-row">
      <div class="product-icon">${icons.getIcon(item.icon)}</div>
      <div class="product-name editable-field" contenteditable="false">${item.name}</div>
      <div class="product-dots"></div>
      <div class="product-badge-price editable-field" contenteditable="false">${item.price}</div>
    </div>
  `).join('');

  const tartasItems = d.sections[1].items.map(item => `
    <div class="product-item-row">
      <div class="product-icon">${icons.getIcon(item.icon)}</div>
      <div class="product-name editable-field" contenteditable="false">${item.name}</div>
      <div class="product-dots"></div>
      <div class="product-badge-price editable-field" contenteditable="false">${item.price}</div>
    </div>
  `).join('');

  return `
    <div class="menu-sheet" id="sheet-3" data-sheet="3">
      <!-- Onda lateral izquierda -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 576 1024" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 0,0 L 200,0 C 160,150 90,220 140,380 C 180,480 60,620 35,750 C 15,840 50,940 0,1024 Z" fill="#4D4D29" />
          <path d="M 0,0 L 215,0 C 175,150 105,220 155,380 C 195,480 75,620 50,750 C 30,840 65,940 0,1015" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
          
          <path d="M 576,830 C 540,890 505,940 445,1024 L 576,1024 Z" fill="#4D4D29" />
          <path d="M 576,815 C 535,875 500,925 435,1024" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
        </svg>
      </div>

      <img src="assets/orig_leaves_top_left.png" class="botanical-leaves leaves-top-right" style="transform: scaleX(-1);" alt="Olivo"/>
      <img src="assets/orig_leaves_bottom_right.png" class="botanical-leaves leaves-bottom-left" alt="Olivo"/>

      <div class="stamp-container stamp-pos-top-left">
        ${icons.stamp('light')}
      </div>

      <div class="side-quote side-quote-top-left light">
        ENDULZA<br>TU DÍA,<br>COMPARTE<br>FELICIDAD.
      </div>

      <div class="sheet-content">
        <div class="menu-header" style="margin-left: 50px;">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false">${d.subtitle}</span>
          <div class="brush-banner-exact"></div>
          <div class="header-bottom-heart">${icons.heartSprigs()}</div>
        </div>

        <!-- SECCIÓN 1: BIZCOCHOS -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[0].title}</h2>
            <div style="margin-top: 3px;">${icons.sectionLeaves()}</div>
          </div>
          <div class="product-items-list">
            ${bizcochosItems}
          </div>
        </div>

        <!-- SECCIÓN 2: MASAS QUEBRADAS -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <div style="margin-bottom: 3px;">${icons.heartSprigs()}</div>
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[1].title}</h2>
            <div style="margin-top: 3px;">${icons.sectionLeaves()}</div>
          </div>
          <div class="product-items-list">
            ${tartasItems}
          </div>
        </div>

        <div class="menu-footer">
          <div>${icons.footerOrnament()}</div>
          <p class="footer-phrase editable-field" contenteditable="false">• ${d.footerText} •</p>
        </div>
      </div>
    </div>
  `;
}

// LÁMINA 4: Bocaditos Tradicionales & Alfajorcitos
function renderSheet4() {
  const d = window.DULCE_FE_MENU.sheet4;
  const icons = window.DULCE_FE_ICONS;

  const tradicionalItems = [
    { name: "MIL HOJITAS", img: "assets/orig_milhojas.png", tiers: [{ l: "Paquete de 25 un", p: "S/ 28.00" }, { l: "Paquete de 50 un", p: "S/ 52.00" }] },
    { name: "OREJITAS", img: "assets/orig_orejitas.png", tiers: [{ l: "Paquete de 25 un", p: "S/ 22.00" }, { l: "Paquete de 50 un", p: "S/ 40.00" }] },
    { name: "EMPANADITAS MIXTAS", img: "assets/orig_empanadita.png", tiers: [{ l: "Paquete de 25 un", p: "S/ 28.00" }, { l: "Paquete de 50 un", p: "S/ 52.00" }] },
    { name: "EMPANADITAS DE CARNE Y POLLO", img: "assets/orig_empanadita_carne.png", tiers: [{ l: "Paquete de 25 un", p: "S/ 32.00" }, { l: "Paquete de 50 un", p: "S/ 60.00" }] },
    { name: "CANASTILLAS DE ACEITUNAS", img: "assets/orig_canastilla.png", tiers: [{ l: "Paquete de 25 un", p: "S/ 28.00" }, { l: "Paquete de 50 un", p: "S/ 52.00" }] },
    { name: "ENROLLADITOS DE HOT DOG", img: "assets/orig_enrolladito.png", tiers: [{ l: "Paquete de 25 un", p: "S/ 28.00" }, { l: "Paquete de 50 un", p: "S/ 52.00" }] }
  ];

  const bocaditosCards = tradicionalItems.map(item => `
    <div class="tradicional-item-card">
      <img src="${item.img}" class="tradicional-item-img" alt="${item.name}"/>
      <div class="tradicional-info">
        <div class="tradicional-title editable-field" contenteditable="false">${item.name}</div>
        ${item.tiers.map(t => `
          <div class="tier-row">
            <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.l}</span>
            <span class="tier-dots"></span>
            <span class="tier-price editable-field" contenteditable="false">${t.p}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="menu-sheet" id="sheet-4" data-sheet="4">
      <div class="bg-wave-layer">
        <svg viewBox="0 0 576 1024" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 576,750 C 470,850 420,930 576,1024 Z" fill="#4D4D29" />
          <path d="M 576,730 C 455,835 405,925 576,1024" fill="none" stroke="#E4D4BC" stroke-width="1.4" stroke-dasharray="3.5,3.5" opacity="0.85" />
        </svg>
      </div>

      <img src="assets/orig_leaves_top_left.png" class="botanical-leaves leaves-top-left" style="transform: scale(0.85);" alt="Olivo"/>
      <img src="assets/orig_leaves_bottom_right.png" class="botanical-leaves leaves-bottom-right" style="transform: scale(0.85) rotate(180deg);" alt="Olivo"/>

      <div class="stamp-container stamp-pos-top-right">
        <img src="assets/orig_stamp_light.png" style="width: 100%; height: 100%; object-fit: contain;" alt="Sello"/>
      </div>

      <div class="sheet-content">
        <div class="menu-header">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false" style="font-size: 3.6rem;">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false" style="font-size: 3.8rem;">${d.subtitle}</span>
          <p style="font-family: var(--font-serif); font-style: italic; color: #736429; font-size: 0.9rem;">— ${d.tagline} —</p>
        </div>

        <div>
          <div style="text-align: center; margin-bottom: 10px;">
            <div class="bocadito-header-badge editable-field" contenteditable="false">${d.tradicionales.title}</div>
          </div>
          <div class="tradicionales-grid">
            ${bocaditosCards}

            <!-- Recuadro Combo Surtido con ilustraciones originales -->
            <div class="combo-surtido-box">
              <div class="combo-title editable-field" contenteditable="false">
                ${icons.sectionLeaves()} COMBO SURTIDO ${icons.sectionLeaves()}
              </div>
              <div class="combo-subtitle editable-field" contenteditable="false">Combina hasta 4 variedades</div>
              <div class="combo-icons-strip">
                <div class="combo-icon-unit"><img src="assets/orig_canastilla.png"/><br>Canastillas</div>
                <span>+</span>
                <div class="combo-icon-unit"><img src="assets/orig_enrolladito.png"/><br>Enrolladitos</div>
                <span>+</span>
                <div class="combo-icon-unit"><img src="assets/orig_milhojas.png"/><br>Mil Hojitas</div>
                <span>+</span>
                <div class="combo-icon-unit"><img src="assets/orig_empanadita.png"/><br>Empanaditas</div>
              </div>
              <div class="tier-row" style="max-width: 320px; margin: 0 auto;">
                <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Paquete de 50 un (hasta 4 variedades)</span>
                <span class="tier-dots"></span>
                <span class="tier-price editable-field" contenteditable="false">S/ 55.00</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ALFAJORCITOS & TRIPLES -->
        <div style="margin-top: 8px;">
          <div style="text-align: center; margin-bottom: 6px;">
            <div class="bocadito-header-badge editable-field" contenteditable="false">${d.alfajorcitos.title}</div>
          </div>
          <div class="tradicionales-grid">
            <!-- Alfajores Regulares -->
            <div class="tradicional-item-card">
              <img src="assets/orig_alfajor_reg.png" class="tradicional-item-img" alt="Alfajorcitos"/>
              <div class="tradicional-info">
                <div class="tradicional-title editable-field" contenteditable="false">ALFAJORCITOS REGULARES</div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Paquete de 12 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 15.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Minis 25 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 20.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Minis 50 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 38.00</span>
                </div>
              </div>
            </div>

            <!-- Alfajores Chips -->
            <div class="tradicional-item-card">
              <img src="assets/orig_alfajor_chips.png" class="tradicional-item-img" alt="Alfajorcitos Chips"/>
              <div class="tradicional-info">
                <div class="tradicional-title editable-field" contenteditable="false">ALFAJORCITOS CHIPS</div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Paquete de 12 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 18.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Minis 25 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 23.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} Minis 50 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 42.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="menu-footer">
          <div>${icons.footerOrnament()}</div>
          <p class="footer-phrase editable-field" contenteditable="false">${d.footerText}</p>
        </div>
      </div>
    </div>
  `;
}

function setupToolbarEvents() {
  const tabButtons = document.querySelectorAll('.nav-tabs button');
  const sheets = document.querySelectorAll('.menu-sheet');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-target');
      sheets.forEach(sheet => {
        if (target === 'all') {
          sheet.style.display = 'flex';
        } else {
          sheet.style.display = sheet.getAttribute('data-sheet') === target ? 'flex' : 'none';
        }
      });
    });
  });

  const btnPdf = document.getElementById('btnExportPdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => window.print());
  }

  const btnPng = document.getElementById('btnExportPng');
  if (btnPng) {
    btnPng.addEventListener('click', exportActiveSheetAsPng);
  }

  const btnEdit = document.getElementById('btnToggleEdit');
  let isEditing = false;
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      isEditing = !isEditing;
      const editableFields = document.querySelectorAll('.editable-field');
      editableFields.forEach(el => {
        el.contentEditable = isEditing ? "true" : "false";
        el.style.outline = isEditing ? "1px dashed #736429" : "none";
        el.style.cursor = isEditing ? "text" : "default";
      });

      btnEdit.innerText = isEditing ? '💾 Finalizar Edición' : '✏️ Modo Edición Rápida';
      btnEdit.style.background = isEditing ? '#736429' : '#FFFFFF';
      btnEdit.style.color = isEditing ? '#FFFFFF' : '#353916';
    });
  }
}

function exportActiveSheetAsPng() {
  const visibleSheets = Array.from(document.querySelectorAll('.menu-sheet')).filter(s => s.style.display !== 'none');
  const sheetToExport = visibleSheets[0] || document.querySelector('.menu-sheet');
  if (!sheetToExport) return;

  const originalTransform = sheetToExport.style.transform;
  sheetToExport.style.transform = 'none';

  if (typeof html2canvas === 'undefined') {
    alert('Cargando librería de exportación...');
    return;
  }

  html2canvas(sheetToExport, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#F1E2CD'
  }).then(canvas => {
    sheetToExport.style.transform = originalTransform;
    const link = document.createElement('a');
    const sheetNum = sheetToExport.getAttribute('data-sheet') || '1';
    link.download = `Dulce_Fe_Menu_Lamina_${sheetNum}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('Error:', err);
    alert('Error al exportar PNG. Puedes usar Imprimir / PDF.');
  });
}
