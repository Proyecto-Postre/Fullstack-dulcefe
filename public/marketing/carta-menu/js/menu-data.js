/**
 * DATOS EDITABLES DE LA CARTA / MENÚ - DULCE FE
 * 4 Láminas completas idénticas al catálogo original.
 */

window.DULCE_FE_MENU = {
  // LÁMINA 1: Menú de Postres 1 (Galletería y Postres de Cuchara)
  sheet1: {
    title: "MENÚ",
    subtitle: "de Postres",
    tagline: "INGREDIENTES DE CALIDAD, SABORES QUE ENAMORAN",
    sideText: "ENDULZA TU DÍA, COMPARTE FELICIDAD.",
    footerText: "HECHOS CON AMOR",
    sections: [
      {
        id: "galleteria",
        title: "GALLETERÍA",
        items: [
          { name: "Cajita de Galletas chocochip", price: "S/ 15.00", icon: "cookie-chocochip" },
          { name: "Cajita de Galletas de avena con pasas", price: "S/ 15.00", icon: "cookie-oats" },
          { name: "Cajita de Galletas de limón", price: "S/ 15.00", icon: "cookie-lemon" },
          { name: "Cajita de Galletas con jalea", price: "S/ 15.00", icon: "cookie-jelly" },
          { name: "Cajita de Alfajorcitos", price: "S/ 15.00", icon: "alfajor-box" }
        ]
      },
      {
        id: "cuchareables",
        title: "POSTRES DE CUCHARA / FRÍOS",
        badge: "Los postres húmedos, armados en capas",
        items: [
          { name: "Cuchareable de torta 3 Leches", price: "S/ 12.00", icon: "cup-dessert" },
          { name: "Cuchareable de torta Selva negra", price: "S/ 12.00", icon: "cup-dessert" },
          { name: "Cuchareable de torta Mokka", price: "S/ 12.00", icon: "cup-dessert" }
        ]
      }
    ]
  },

  // LÁMINA 2: Dulce Fe Bocaditos 1 (Roles, Galletitas, Mini Brownies, Tartaletitas)
  sheet2: {
    title: "Dulce Fe",
    subtitle: "Bocaditos",
    tagline: "Sabores que acompañan tus mejores momentos.",
    footerText: "INGREDIENTES DE CALIDAD, SABORES QUE ENAMORAN.",
    categories: [
      {
        id: "roles",
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
        id: "galletitas",
        title: "GALLETITAS",
        img: "assets/orig_galletita.png",
        note: "Sabores disponibles:<br>Chips de chocolate, Limón y Avena.",
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
        id: "brownies",
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
        id: "tartaletitas",
        title: "TARTALETITAS Y MINI PAI DE MANZANA",
        img: "assets/orig_tartaleta.png",
        singleTable: [
          { label: "Paquete de 12 un", price: "S/ 25.00" },
          { label: "Paquete de 25 un", price: "S/ 48.00" },
          { label: "Paquete de 50 un", price: "S/ 92.00" }
        ]
      }
    ]
  },

  // LÁMINA 3: Dulce Fe Bocaditos 2 (Tradicionales, Combos, Alfajorcitos & Triples)
  sheet3: {
    title: "Dulce Fe",
    subtitle: "Bocaditos",
    tagline: "Sabores que acompañan tus mejores momentos.",
    footerText: "INGREDIENTES DE CALIDAD, SABORES QUE ENAMORAN.",
    tradicionales: {
      title: "BOCADITOS TRADICIONALES",
      leftItems: [
        {
          name: "MIL HOJITAS",
          img: "assets/orig_milhojas.png",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        },
        {
          name: "EMPANADITAS MIXTAS",
          img: "assets/orig_empanada_mix.png",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        },
        {
          name: "CANASTILLAS DE ACEITUNAS",
          img: "assets/orig_canastilla.png",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        },
        {
          name: "ENROLLADITOS DE HOT DOG",
          img: "assets/orig_enrolladito.png",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        }
      ],
      rightItems: [
        {
          name: "OREJITAS",
          img: "assets/orig_orejitas.png",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 22.00" },
            { label: "Paquete de 50 un", price: "S/ 40.00" }
          ]
        },
        {
          name: "EMPANADITAS DE CARNE Y POLLO",
          img: "assets/orig_empanada_carne.png",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 32.00" },
            { label: "Paquete de 50 un", price: "S/ 60.00" }
          ]
        }
      ],
      combo: {
        title: "COMBO SURTIDO",
        subtitle: "Combina hasta 4 variedades",
        badge: "Paquete de 50 un (hasta 4 variedades)",
        price: "S/ 55.00",
        itemsList: [
          { name: "Canastillas de Aceitunas", img: "assets/orig_canastilla.png" },
          { name: "Enrolladitos de Hot Dog", img: "assets/orig_enrolladito.png" },
          { name: "Mil Hojitas", img: "assets/orig_milhojas.png" },
          { name: "Empanaditas Mixtas", img: "assets/orig_empanada_mix.png" }
        ]
      }
    },
    alfajorcitos: {
      title: "ALFAJORCITOS",
      leftBlock: {
        title: "ALFAJORCITOS REGULARES",
        img: "assets/orig_alfajor_reg.png",
        regularSubtitle: "REGULARES (12 UNIDADES POR PAQUETE)",
        regularTiers: [{ label: "Paquete de 12 un", price: "S/ 15.00" }],
        minisSubtitle: "MINIS",
        minisTiers: [
          { label: "Paquete de 25 un", price: "S/ 20.00" },
          { label: "Paquete de 50 un", price: "S/ 38.00" },
          { label: "Paquete de 100 un", price: "S/ 70.00" }
        ],
        extraTitle: "MINI TRIPLES",
        extraImg: "assets/orig_triple.png",
        extraTiers: [
          { label: "Paquete de 25 un", price: "S/ 40.00" },
          { label: "Paquete de 50 un", price: "S/ 75.00" },
          { label: "Paquete de 100 un", price: "S/ 140.00" }
        ]
      },
      rightBlock: {
        title: "ALFAJORCITOS CHIPS",
        img: "assets/orig_alfajor_chips.png",
        regularSubtitle: "REGULARES (12 UNIDADES POR PAQUETE)",
        regularTiers: [{ label: "Paquete de 12 un", price: "S/ 18.00" }],
        minisSubtitle: "MINIS",
        minisTiers: [
          { label: "Paquete de 25 un", price: "S/ 23.00" },
          { label: "Paquete de 50 un", price: "S/ 42.00" },
          { label: "Paquete de 100 un", price: "S/ 80.00" }
        ],
        extraTitle: "MINI TRIPLES PREMIUM",
        extraImg: "assets/orig_triple_prem.png",
        extraTiers: [
          { label: "Paquete de 25 un", price: "S/ 50.00" },
          { label: "Paquete de 50 un", price: "S/ 95.00" },
          { label: "Paquete de 100 un", price: "S/ 180.00" }
        ]
      }
    }
  },

  // LÁMINA 4: Menú de Postres 2 (Bizcochos y Masas Quebradas / Tartas)
  sheet4: {
    title: "MENÚ",
    subtitle: "de Postres",
    tagline: "INGREDIENTES DE CALIDAD, SABORES QUE ENAMORAN",
    sideText: "ENDULZA TU DÍA, COMPARTE FELICIDAD.",
    footerText: "HECHOS CON AMOR",
    sections: [
      {
        id: "bizcochos",
        title: "BIZCOCHOS Y HORNEADOS",
        items: [
          { name: "Keke de vainilla, chocolate, marmoleado o zanahoria", price: "S/ 22.00", icon: "cake-slice" },
          { name: "Caja de Muffins de chocolate", price: "S/ 30.00", icon: "muffin" },
          { name: "Caja de Muffins de vainilla chips", price: "S/ 30.00", icon: "muffin-chips" },
          { name: "Cajita de Cupcakes decorados", price: "S/ 30.00", icon: "cupcake-frosting" },
          { name: "Caja de Brownies", price: "S/ 20.00", icon: "brownies-box" }
        ]
      },
      {
        id: "tartas",
        title: "MASAS QUEBRADAS / TARTAS",
        items: [
          { name: "Mini tarta de manzana", price: "S/ 20.00", icon: "apple-pie" },
          { name: "Mini tartaletas de fresa o maracuyá", price: "S/ 20.00", icon: "berry-tart" }
        ]
      }
    ]
  }
};
