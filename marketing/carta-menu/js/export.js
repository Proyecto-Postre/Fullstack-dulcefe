/**
 * DULCE FE - RENDERIZADO DE ALTA FIDELIDAD
 * Totalmente limpio: cero textos fantasmas, sellos vectoriales al derecho,
 * proporciones idénticas a las imágenes originales, iconografía auténtica.
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

// LÁMINA 1: Menú de Postres 1 (Galletería y Cuchareables)
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
      <!-- Ondas Verdes Laterales con Pespunte Exacto -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 660 1173" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 380,0 C 430,160 550,220 500,430 C 455,560 580,690 615,830 C 640,930 610,1040 660,1173 L 660,0 Z" fill="#3D411F" />
          <path d="M 395,0 C 445,160 565,220 515,430 C 470,560 595,690 630,830 C 655,930 625,1040 660,1155" fill="none" stroke="#E8DAC4" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.85" />
          
          <path d="M 0,930 C 50,1010 90,1070 170,1173 L 0,1173 Z" fill="#3D411F" />
          <path d="M 0,915 C 55,995 95,1055 180,1173" fill="none" stroke="#E8DAC4" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.85" />
        </svg>
      </div>

      <!-- Ramas Botánicas Limpias sin letras -->
      <img src="assets/olive_branch_corner.png" class="botanical-leaves leaves-top-left" alt="Olivo"/>
      <img src="assets/olive_branch_ascending.png" class="botanical-leaves leaves-bottom-right" alt="Olivo"/>

      <!-- Sello Superior Derecho Vectorial (Al derecho, nítido) -->
      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('light')}
      </div>

      <!-- Frase Vertical Lateral -->
      <div class="side-quote side-quote-top-right light">
        <div style="font-size: 0.75rem; margin-bottom: 2px;">❖</div>
        <div style="width: 24px; height: 1px; background: rgba(255,255,255,0.4); margin: 3px auto 5px auto;"></div>
        ENDULZA<br>TU DÍA,<br>COMPARTE<br>FELICIDAD.
        <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
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
          
          <div class="brush-banner-box">
            <img src="assets/exact_original_banner.png" class="brush-banner-img" alt="${d.tagline}"/>
          </div>
          
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
            <div class="cuchara-banner-box">
              <img src="assets/orig_cuchara_banner.png" class="cuchara-banner-img" alt="${d.sections[1].badge}"/>
            </div>
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

// LÁMINA 2: Dulce Fe Bocaditos 1 (Roles, Galletitas, Mini Brownies, Tartaletas)
function renderSheet2() {
  const d = window.DULCE_FE_MENU.sheet2;
  const icons = window.DULCE_FE_ICONS;

  const categoriesHtml = d.categories.map(cat => {
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
      <div class="bocaditos-divider-line"></div>
    `;
  }).join('');

  return `
    <div class="menu-sheet" id="sheet-2" data-sheet="2">
      <!-- Ondas Verdes en Esquinas Opuestas con Pespunte -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 660 1173" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 0,0 L 180,0 C 140,85 85,150 0,220 Z" fill="#3D411F" />
          <path d="M 0,0 L 195,0 C 150,85 95,150 0,232" fill="none" stroke="#E8DAC4" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.85" />
          
          <path d="M 660,860 C 540,960 490,1060 660,1173 Z" fill="#3D411F" />
          <path d="M 660,840 C 525,955 475,1065 660,1173" fill="none" stroke="#E8DAC4" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.85" />
        </svg>
      </div>

      <img src="assets/olive_branch_corner.png" class="botanical-leaves leaves-top-left" alt="Olivo"/>
      <img src="assets/olive_branch_ascending.png" class="botanical-leaves leaves-bottom-right" style="transform: rotate(180deg);" alt="Olivo"/>

      <!-- Sello Vectorial sobre fondo Crema -->
      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('dark')}
      </div>

      <div class="sheet-content">
        <div class="menu-header">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false" style="font-size: 4rem;">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false" style="font-size: 4.2rem;">${d.subtitle}</span>
          <p style="font-family: var(--font-serif); font-style: italic; color: #7A692C; font-size: 0.95rem;">— ${d.tagline} —</p>
          <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
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

// LÁMINA 3: Dulce Fe Bocaditos 2 (Tradicionales, Combos, Alfajorcitos & Triples)
function renderSheet3() {
  const d = window.DULCE_FE_MENU.sheet3;
  const icons = window.DULCE_FE_ICONS;

  // Items columna izquierda (4 ítems tradicionales)
  const leftCards = d.tradicionales.leftItems.map(item => `
    <div class="tradicional-item-card">
      <div class="trad-circle-icon">
        <img src="${item.img}" alt="${item.name}"/>
      </div>
      <div class="tradicional-info">
        <div class="tradicional-title editable-field" contenteditable="false">${item.name}</div>
        ${item.tiers.map(t => `
          <div class="tier-row">
            <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
            <span class="tier-dots"></span>
            <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Items columna derecha (2 ítems + COMBO SURTIDO)
  const rightCards = d.tradicionales.rightItems.map(item => `
    <div class="tradicional-item-card">
      <div class="trad-circle-icon">
        <img src="${item.img}" alt="${item.name}"/>
      </div>
      <div class="tradicional-info">
        <div class="tradicional-title editable-field" contenteditable="false">${item.name}</div>
        ${item.tiers.map(t => `
          <div class="tier-row">
            <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
            <span class="tier-dots"></span>
            <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  const combo = d.tradicionales.combo;
  const comboHtml = `
    <div class="combo-surtido-box">
      <div class="combo-title editable-field" contenteditable="false">
        ${icons.sectionLeaves()} ${combo.title} ${icons.sectionLeaves()}
      </div>
      <div class="combo-subtitle editable-field" contenteditable="false">${combo.subtitle}</div>
      <div class="combo-icons-strip">
        ${combo.itemsList.map((it, idx) => `
          <div class="combo-icon-unit">
            <div class="combo-mini-circle"><img src="${it.img}" alt="${it.name}"/></div>
            <span>${it.name.split(' ')[0]}</span>
          </div>
          ${idx < 3 ? '<span class="combo-plus">+</span>' : ''}
        `).join('')}
      </div>
      <div class="tier-row" style="margin-top: 6px;">
        <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${combo.badge}</span>
        <span class="tier-dots"></span>
        <span class="tier-price editable-field" contenteditable="false">${combo.price}</span>
      </div>
    </div>
  `;

  // Sección Alfajorcitos y Triples (2 columnas completas)
  const alfLeft = d.alfajorcitos.leftBlock;
  const alfRight = d.alfajorcitos.rightBlock;

  return `
    <div class="menu-sheet" id="sheet-3" data-sheet="3">
      <!-- Ondas Verdes y Ramas Esquinas -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 660 1173" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 660,940 C 560,1020 510,1090 660,1173 Z" fill="#3D411F" />
          <path d="M 660,925 C 545,1010 495,1085 660,1173" fill="none" stroke="#E8DAC4" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.85" />
        </svg>
      </div>

      <img src="assets/olive_branch_corner.png" class="botanical-leaves leaves-top-left" alt="Olivo"/>
      <img src="assets/olive_branch_ascending.png" class="botanical-leaves leaves-bottom-right" style="transform: rotate(180deg);" alt="Olivo"/>
      <img src="assets/olive_branch_ascending.png" class="botanical-leaves leaves-bottom-left" style="transform: scaleX(-1); width: 90px; height: 320px;" alt="Olivo"/>

      <!-- Sello Vectorial sobre fondo Crema -->
      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('dark')}
      </div>

      <div class="sheet-content">
        <div class="menu-header">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false" style="font-size: 4.2rem;">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false" style="font-size: 4.4rem;">${d.subtitle}</span>
          <p style="font-family: var(--font-serif); font-style: italic; color: #7A692C; font-size: 0.95rem;">• — ${d.tagline} — •</p>
        </div>

        <!-- SECCIÓN 1: BOCADITOS TRADICIONALES -->
        <div>
          <div style="text-align: center; margin-bottom: 8px;">
            <div class="tradicionales-section-badge editable-field" contenteditable="false">
              ${icons.sectionLeaves()} ${d.tradicionales.title} ${icons.sectionLeaves()}
            </div>
          </div>
          <div class="tradicionales-layout-grid">
            <div class="tradicional-column">
              ${leftCards}
            </div>
            <div class="tradicional-column">
              ${rightCards}
              ${comboHtml}
            </div>
          </div>
        </div>

        <div style="border-bottom: 1px dotted rgba(176, 163, 130, 0.6); margin: 6px 0;"></div>

        <!-- SECCIÓN 2: ALFAJORCITOS & TRIPLES -->
        <div>
          <div style="text-align: center; margin-bottom: 8px;">
            <div class="tradicionales-section-badge editable-field" contenteditable="false">
              ${icons.sectionLeaves()} ${d.alfajorcitos.title} ${icons.sectionLeaves()}
            </div>
          </div>
          <div class="tradicionales-layout-grid">
            <!-- Columna Izquierda: Alfajores Regulares + Mini Triples -->
            <div class="tradicional-column">
              <div class="tradicional-item-card">
                <div class="trad-circle-icon"><img src="${alfLeft.img}" alt="${alfLeft.title}"/></div>
                <div class="tradicional-info">
                  <div class="alfajores-block-header editable-field" contenteditable="false">${alfLeft.title}</div>
                  <div class="alfajores-sub-header editable-field" contenteditable="false">${alfLeft.regularSubtitle}</div>
                  ${alfLeft.regularTiers.map(t => `
                    <div class="tier-row">
                      <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
                      <span class="tier-dots"></span>
                      <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
                    </div>
                  `).join('')}
                  <div class="alfajores-sub-header editable-field" contenteditable="false" style="margin-top: 4px;">${alfLeft.minisSubtitle}</div>
                  ${alfLeft.minisTiers.map(t => `
                    <div class="tier-row">
                      <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
                      <span class="tier-dots"></span>
                      <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Mini Triples -->
              <div class="tradicional-item-card" style="margin-top: 4px;">
                <div class="trad-circle-icon"><img src="${alfLeft.extraImg}" alt="${alfLeft.extraTitle}"/></div>
                <div class="tradicional-info">
                  <div class="alfajores-block-header editable-field" contenteditable="false">${alfLeft.extraTitle}</div>
                  ${alfLeft.extraTiers.map(t => `
                    <div class="tier-row">
                      <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
                      <span class="tier-dots"></span>
                      <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Alfajores Chips + Mini Triples Premium -->
            <div class="tradicional-column">
              <div class="tradicional-item-card">
                <div class="trad-circle-icon"><img src="${alfRight.img}" alt="${alfRight.title}"/></div>
                <div class="tradicional-info">
                  <div class="alfajores-block-header editable-field" contenteditable="false">${alfRight.title}</div>
                  <div class="alfajores-sub-header editable-field" contenteditable="false">${alfRight.regularSubtitle}</div>
                  ${alfRight.regularTiers.map(t => `
                    <div class="tier-row">
                      <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
                      <span class="tier-dots"></span>
                      <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
                    </div>
                  `).join('')}
                  <div class="alfajores-sub-header editable-field" contenteditable="false" style="margin-top: 4px;">${alfRight.minisSubtitle}</div>
                  ${alfRight.minisTiers.map(t => `
                    <div class="tier-row">
                      <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
                      <span class="tier-dots"></span>
                      <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Mini Triples Premium -->
              <div class="tradicional-item-card" style="margin-top: 4px;">
                <div class="trad-circle-icon"><img src="${alfRight.extraImg}" alt="${alfRight.extraTitle}"/></div>
                <div class="tradicional-info">
                  <div class="alfajores-block-header editable-field" contenteditable="false">${alfRight.extraTitle}</div>
                  ${alfRight.extraTiers.map(t => `
                    <div class="tier-row">
                      <span class="tier-label editable-field" contenteditable="false">${icons.boxPackage()} ${t.label}</span>
                      <span class="tier-dots"></span>
                      <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="menu-footer">
          <div style="font-size: 0.8rem; margin-bottom: 2px;">❖</div>
          <p class="footer-phrase editable-field" contenteditable="false">${d.footerText}</p>
          <div style="margin-top: 2px;">${icons.heartSprigs()}</div>
        </div>
      </div>
    </div>
  `;
}

// LÁMINA 4: Menú de Postres 2 (Bizcochos y Masas Quebradas / Tartas)
function renderSheet4() {
  const d = window.DULCE_FE_MENU.sheet4;
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
    <div class="menu-sheet" id="sheet-4" data-sheet="4">
      <!-- Onda lateral izquierda con sombra y esquina inferior derecha -->
      <div class="bg-wave-layer">
        <svg viewBox="0 0 660 1173" width="100%" height="100%" preserveAspectRatio="none" style="filter: drop-shadow(4px 0 10px rgba(0,0,0,0.12));">
          <path d="M 0,0 L 185,0 C 150,130 110,250 140,430 C 165,560 90,720 45,860 C 20,940 40,1050 0,1173 Z" fill="#323B22" />
          
          <!-- Onda inferior derecha -->
          <path d="M 660,940 C 580,1020 530,1080 660,1173 Z" fill="#323B22" />
          <path d="M 660,925 C 565,1010 515,1075 660,1173" fill="none" stroke="#E8DAC4" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.85" />
        </svg>
      </div>

      <img src="assets/olive_branch_top_right.png" class="botanical-leaves leaves-top-right" alt="Olivo"/>
      <img src="assets/olive_branch_ascending.png" class="botanical-leaves leaves-bottom-left" style="transform: scaleX(-1); width: 100px; height: 380px;" alt="Olivo"/>

      <!-- Sello Superior Izquierdo Vectorial -->
      <div class="stamp-container stamp-pos-top-left" style="top: 40px; left: 28px;">
        ${icons.stamp('light')}
      </div>

      <!-- Frase Vertical Lateral en Onda Izquierda -->
      <div class="side-quote side-quote-top-left light" style="top: 155px; left: 22px;">
        <div style="font-size: 0.75rem; margin-bottom: 2px;">❖</div>
        <div style="width: 24px; height: 1px; background: rgba(255,255,255,0.4); margin: 3px auto 5px auto;"></div>
        ENDULZA<br>TU DÍA,<br>COMPARTE<br>FELICIDAD.
        <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
      </div>

      <!-- Puntitos a la derecha -->
      <div class="header-dots right-side" style="top: 360px; right: 22px;">
        <span></span><span></span><span></span><span></span><span></span>
      </div>

      <div class="sheet-content" style="padding-left: 60px; padding-right: 20px;">
        <div class="menu-header">
          <div style="margin-bottom: 2px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false">${d.subtitle}</span>
          
          <div class="brush-banner-box">
            <img src="assets/exact_original_banner.png" class="brush-banner-img" alt="${d.tagline}"/>
          </div>
          
          <div class="header-bottom-heart">${icons.heartSprigs()}</div>
        </div>

        <!-- SECCIÓN 1: BIZCOCHOS -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[0].title}</h2>
            <div style="margin-top: 3px;">${icons.sectionLeaves()}</div>
          </div>
          <div class="product-items-list" style="max-width: 480px; margin: 0 auto;">
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
          <div class="product-items-list" style="max-width: 480px; margin: 0 auto;">
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
        el.style.outline = isEditing ? "1px dashed #7A692C" : "none";
        el.style.cursor = isEditing ? "text" : "default";
      });

      btnEdit.innerText = isEditing ? '💾 Finalizar Edición' : '✏️ Modo Edición Rápida';
      btnEdit.style.background = isEditing ? '#7A692C' : '#FFFFFF';
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
    backgroundColor: '#F3E7D6'
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
