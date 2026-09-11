/**
 * DULCE FE - RENDERIZADO Y EXPORTACIÓN DEL MENÚ
 */

document.addEventListener('DOMContentLoaded', () => {
  renderAllSheets();
  setupToolbarEvents();
});

// Renderizado de las 4 láminas
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

// LÁMINA 1: Postres 1 (Galletería y Cuchareables)
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
      <!-- Capas de Fondo y Ondas Verdes Laterales -->
      <div class="bg-wave-layer">
        <!-- Onda lateral derecha con pespunte -->
        <svg viewBox="0 0 680 1200" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 450,0 C 490,180 580,260 520,440 C 480,560 610,720 640,880 C 660,980 620,1100 680,1200 L 680,0 Z" fill="#2E3E2B" />
          <path d="M 465,0 C 505,180 595,260 535,440 C 495,560 625,720 655,880 C 675,980 635,1100 680,1190" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
          
          <!-- Onda inferior izquierda -->
          <path d="M 0,980 C 40,1050 80,1100 150,1200 L 0,1200 Z" fill="#2E3E2B" />
          <path d="M 0,965 C 45,1035 90,1085 165,1200" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
        </svg>
      </div>

      <!-- Hojas Botánicas en Esquinas -->
      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-top-left" style="mix-blend-mode: multiply; transform: scaleX(-1) rotate(20deg);" alt="Olivo"/>
      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-bottom-right" style="mix-blend-mode: multiply; transform: rotate(190deg);" alt="Olivo"/>

      <!-- Sello Superior Derecho -->
      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('light')}
      </div>

      <!-- Texto Lateral -->
      <div class="side-quote side-quote-top-right light">
        ENDULZA<br>TU DÍA,<br>COMPARTE<br>FELICIDAD.
      </div>

      <!-- Contenido Central -->
      <div class="sheet-content">
        <!-- Puntos ornamentales a la izquierda -->
        <div class="header-dots">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <div class="menu-header">
          <div style="margin-bottom: 4px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false">${d.subtitle}</span>
          <div>
            <div class="brush-banner">
              <span class="brush-banner-text editable-field" contenteditable="false">${d.tagline}</span>
            </div>
          </div>
          <div class="header-bottom-heart">${icons.sectionLeaves()}</div>
        </div>

        <!-- SECCIÓN 1: GALLETERÍA -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[0].title}</h2>
            <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
          </div>
          <div class="product-items-list">
            ${galleteriaItems}
          </div>
        </div>

        <!-- SECCIÓN 2: POSTRES DE CUCHARA -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <div style="margin-bottom: 4px;">${icons.sectionLeaves()}</div>
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[1].title}</h2>
            <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
            <div class="section-sub-brush editable-field" contenteditable="false">${d.sections[1].badge}</div>
          </div>
          <div class="product-items-list">
            ${cuchareablesItems}
          </div>
        </div>

        <!-- FOOTER -->
        <div class="menu-footer">
          <div>${icons.footerOrnament()}</div>
          <p class="footer-phrase editable-field" contenteditable="false">• ${d.footerText} •</p>
        </div>
      </div>
    </div>
  `;
}

// LÁMINA 2: Bocaditos Dulces
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
              <div class="bocadito-large-icon">${icons.getIcon(cat.icon)}</div>
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
            <div class="bocadito-large-icon">${icons.getIcon(cat.icon)}</div>
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
        <svg viewBox="0 0 680 1200" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 0,0 L 220,0 C 180,100 120,180 0,240 Z" fill="#2E3E2B" />
          <path d="M 0,0 L 235,0 C 195,100 135,180 0,255" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
          
          <path d="M 680,820 C 560,940 500,1050 680,1200 Z" fill="#2E3E2B" />
          <path d="M 680,800 C 545,935 485,1055 680,1200" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
        </svg>
      </div>

      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-top-left" style="mix-blend-mode: multiply; transform: scaleX(-1);" alt="Olivo"/>
      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-bottom-right" style="mix-blend-mode: multiply; transform: rotate(180deg);" alt="Olivo"/>

      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('dark')}
      </div>

      <div class="sheet-content">
        <div class="menu-header">
          <div style="margin-bottom: 4px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false" style="font-size: 4rem;">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false" style="font-size: 4.2rem;">${d.subtitle}</span>
          <p style="font-family: var(--font-serif); font-style: italic; color: #556645; font-size: 0.95rem;">— ${d.tagline} —</p>
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

// LÁMINA 3: Postres 2 (Bizcochos y Tartas)
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
        <svg viewBox="0 0 680 1200" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 0,0 L 230,0 C 190,180 100,260 160,440 C 200,560 70,720 40,880 C 20,980 60,1100 0,1200 Z" fill="#2E3E2B" />
          <path d="M 0,0 L 245,0 C 205,180 115,260 175,440 C 215,560 85,720 55,880 C 35,980 75,1100 0,1190" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
          
          <path d="M 680,980 C 640,1050 600,1100 530,1200 L 680,1200 Z" fill="#2E3E2B" />
          <path d="M 680,965 C 635,1035 590,1085 515,1200" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
        </svg>
      </div>

      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-top-right" style="mix-blend-mode: multiply;" alt="Olivo"/>
      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-bottom-left" style="mix-blend-mode: multiply; transform: scaleX(-1) rotate(190deg);" alt="Olivo"/>

      <div class="stamp-container stamp-pos-top-left">
        ${icons.stamp('light')}
      </div>

      <div class="side-quote side-quote-top-left light">
        ENDULZA<br>TU DÍA,<br>COMPARTE<br>FELICIDAD.
      </div>

      <div class="sheet-content">
        <div class="menu-header" style="margin-left: 60px;">
          <div style="margin-bottom: 4px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false">${d.subtitle}</span>
          <div>
            <div class="brush-banner">
              <span class="brush-banner-text editable-field" contenteditable="false">${d.tagline}</span>
            </div>
          </div>
          <div class="header-bottom-heart">${icons.sectionLeaves()}</div>
        </div>

        <!-- SECCIÓN 1: BIZCOCHOS Y HORNEADOS -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[0].title}</h2>
            <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
          </div>
          <div class="product-items-list">
            ${bizcochosItems}
          </div>
        </div>

        <!-- SECCIÓN 2: MASAS QUEBRADAS / TARTAS -->
        <div class="menu-section">
          <div class="section-title-wrap">
            <div style="margin-bottom: 4px;">${icons.sectionLeaves()}</div>
            <h2 class="section-title editable-field" contenteditable="false">${d.sections[1].title}</h2>
            <div style="margin-top: 4px;">${icons.sectionLeaves()}</div>
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

  const bocaditosCards = d.tradicionales.items.map(item => `
    <div class="tradicional-item-card">
      <div class="product-icon">${icons.getIcon(item.icon)}</div>
      <div class="tradicional-info">
        <div class="tradicional-title editable-field" contenteditable="false">${item.name}</div>
        ${item.tiers.map(t => `
          <div class="tier-row">
            <span class="tier-label editable-field" contenteditable="false">${t.label}</span>
            <span class="tier-dots"></span>
            <span class="tier-price editable-field" contenteditable="false">${t.price}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  const combo = d.tradicionales.combo;

  return `
    <div class="menu-sheet" id="sheet-4" data-sheet="4">
      <div class="bg-wave-layer">
        <svg viewBox="0 0 680 1200" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M 680,880 C 560,980 500,1070 680,1200 Z" fill="#2E3E2B" />
          <path d="M 680,860 C 545,965 485,1065 680,1200" fill="none" stroke="#F4F1E1" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
        </svg>
      </div>

      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-top-left" style="mix-blend-mode: multiply; transform: scaleX(-1);" alt="Olivo"/>
      <img src="assets/botanical_olive_branch.jpg" class="botanical-leaves leaves-bottom-right" style="mix-blend-mode: multiply; transform: rotate(180deg);" alt="Olivo"/>

      <div class="stamp-container stamp-pos-top-right">
        ${icons.stamp('dark')}
      </div>

      <div class="sheet-content">
        <div class="menu-header">
          <div style="margin-bottom: 4px;">${icons.topOrnament()}</div>
          <h1 class="menu-title-main editable-field" contenteditable="false" style="font-size: 3.8rem;">${d.title}</h1>
          <span class="menu-subtitle-script editable-field" contenteditable="false" style="font-size: 4rem;">${d.subtitle}</span>
          <p style="font-family: var(--font-serif); font-style: italic; color: #556645; font-size: 0.95rem;">— ${d.tagline} —</p>
        </div>

        <!-- BOCADITOS TRADICIONALES -->
        <div>
          <div style="text-align: center; margin-bottom: 12px;">
            <div class="bocadito-header-badge editable-field" contenteditable="false">${d.tradicionales.title}</div>
          </div>
          <div class="tradicionales-grid">
            ${bocaditosCards}
            <!-- Recuadro Combo Surtido -->
            <div class="combo-surtido-box">
              <div class="combo-title editable-field" contenteditable="false">🌿 ${combo.title} 🌿</div>
              <div class="combo-subtitle editable-field" contenteditable="false">${combo.subtitle}</div>
              <div class="combo-icons-strip">
                <div class="combo-icon-unit">${icons.getIcon('canastilla')}<br>Canastillas</div>
                <span>+</span>
                <div class="combo-icon-unit">${icons.getIcon('enrolladito')}<br>Enrolladitos</div>
                <span>+</span>
                <div class="combo-icon-unit">${icons.getIcon('milhojas')}<br>Mil Hojitas</div>
                <span>+</span>
                <div class="combo-icon-unit">${icons.getIcon('empanada')}<br>Empanaditas</div>
              </div>
              <div class="tier-row" style="max-width: 320px; margin: 0 auto;">
                <span class="tier-label editable-field" contenteditable="false">${combo.badge}</span>
                <span class="tier-dots"></span>
                <span class="tier-price editable-field" contenteditable="false">${combo.price}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ALFAJORCITOS & TRIPLES -->
        <div style="margin-top: 10px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <div class="bocadito-header-badge editable-field" contenteditable="false">${d.alfajorcitos.title}</div>
          </div>
          <div class="tradicionales-grid">
            <!-- Alfajores Regulares -->
            <div class="tradicional-item-card">
              <div class="product-icon">${icons.getIcon('alfajor-reg')}</div>
              <div class="tradicional-info">
                <div class="tradicional-title editable-field" contenteditable="false">ALFAJORCITOS REGULARES</div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">Paquete de 12 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 15.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">Minis 25 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 20.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">Minis 50 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 38.00</span>
                </div>
              </div>
            </div>

            <!-- Alfajores Chips -->
            <div class="tradicional-item-card">
              <div class="product-icon">${icons.getIcon('alfajor-chips')}</div>
              <div class="tradicional-info">
                <div class="tradicional-title editable-field" contenteditable="false">ALFAJORCITOS CHIPS</div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">Paquete de 12 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 18.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">Minis 25 un</span>
                  <span class="tier-dots"></span>
                  <span class="tier-price editable-field" contenteditable="false">S/ 23.00</span>
                </div>
                <div class="tier-row">
                  <span class="tier-label editable-field" contenteditable="false">Minis 50 un</span>
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

// Configuración de la barra de herramientas
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

  // Botón Exportar PDF
  const btnPdf = document.getElementById('btnExportPdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      window.print();
    });
  }

  // Botón Exportar PNG
  const btnPng = document.getElementById('btnExportPng');
  if (btnPng) {
    btnPng.addEventListener('click', exportActiveSheetAsPng);
  }

  // Botón Modo Editor
  const btnEdit = document.getElementById('btnToggleEdit');
  let isEditing = false;
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      isEditing = !isEditing;
      const editableFields = document.querySelectorAll('.editable-field');
      editableFields.forEach(el => {
        el.contentEditable = isEditing ? "true" : "false";
        el.style.outline = isEditing ? "1px dashed #C5A059" : "none";
        el.style.cursor = isEditing ? "text" : "default";
      });

      btnEdit.innerText = isEditing ? '💾 Finalizar Edición' : '✏️ Modo Edición Rápida';
      btnEdit.style.background = isEditing ? '#C5A059' : '#FFFFFF';
      btnEdit.style.color = isEditing ? '#FFFFFF' : '#2D3E2B';
    });
  }
}

// Exportación a imagen PNG usando html2canvas
function exportActiveSheetAsPng() {
  const visibleSheets = Array.from(document.querySelectorAll('.menu-sheet')).filter(s => s.style.display !== 'none');
  const sheetToExport = visibleSheets[0] || document.querySelector('.menu-sheet');

  if (!sheetToExport) return;

  const originalTransform = sheetToExport.style.transform;
  sheetToExport.style.transform = 'none';

  if (typeof html2canvas === 'undefined') {
    alert('Cargando librería de captura, por favor intente en 2 segundos...');
    return;
  }

  html2canvas(sheetToExport, {
    scale: 2, // 2x para nitidez Retina / WhatsApp
    useCORS: true,
    backgroundColor: '#FAF6ED'
  }).then(canvas => {
    sheetToExport.style.transform = originalTransform;
    const link = document.createElement('a');
    const sheetNum = sheetToExport.getAttribute('data-sheet') || '1';
    link.download = `Dulce_Fe_Menu_Lamina_${sheetNum}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('Error al exportar imagen:', err);
    alert('Hubo un inconveniente al exportar la imagen. Puedes usar la opción de PDF.');
  });
}
