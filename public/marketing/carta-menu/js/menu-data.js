/**
 * DATOS EDITABLES DE LA CARTA / MENÚ - DULCE FE
 * Puedes modificar nombres, descripciones y precios aquí directamente.
 */

window.DULCE_FE_MENU = {
  // LÁMINA 1: Menú de Postres (Galletería y Postres de Cuchara)
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

  // LÁMINA 2: Bocaditos Dulces (Roles, Galletitas, Mini Brownies, Tartaletas)
  sheet2: {
    title: "Dulce Fe",
    subtitle: "Bocaditos",
    tagline: "Sabores que acompañan tus mejores momentos.",
    footerText: "INGREDIENTES DE CALIDAD, SABORES QUE ENAMORAN.",
    categories: [
      {
        id: "roles",
        title: "ROLES DE CANELA",
        icon: "cinnamon-roll",
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
        icon: "cookie-bite",
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
        icon: "brownie-cube",
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
        icon: "tartlet",
        singleTable: [
          { label: "Paquete de 12 un", price: "S/ 25.00" },
          { label: "Paquete de 25 un", price: "S/ 48.00" },
          { label: "Paquete de 50 un", price: "S/ 92.00" }
        ]
      }
    ]
  },

  // LÁMINA 3: Menú de Postres (Bizcochos y Tartas)
  sheet3: {
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
  },

  // LÁMINA 4: Bocaditos Tradicionales & Alfajorcitos
  sheet4: {
    title: "Dulce Fe",
    subtitle: "Bocaditos",
    tagline: "Sabores que acompañan tus mejores momentos.",
    footerText: "INGREDIENTES DE CALIDAD, SABORES QUE ENAMORAN.",
    tradicionales: {
      title: "BOCADITOS TRADICIONALES",
      items: [
        {
          name: "MIL HOJITAS",
          icon: "milhojas",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        },
        {
          name: "OREJITAS",
          icon: "orejitas",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 22.00" },
            { label: "Paquete de 50 un", price: "S/ 40.00" }
          ]
        },
        {
          name: "EMPANADITAS MIXTAS",
          icon: "empanada",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        },
        {
          name: "EMPANADITAS DE CARNE Y POLLO",
          icon: "empanada-dark",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 32.00" },
            { label: "Paquete de 50 un", price: "S/ 60.00" }
          ]
        },
        {
          name: "CANASTILLAS DE ACEITUNAS",
          icon: "canastilla",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        },
        {
          name: "ENROLLADITOS DE HOT DOG",
          icon: "enrolladito",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 28.00" },
            { label: "Paquete de 50 un", price: "S/ 52.00" }
          ]
        }
      ],
      combo: {
        title: "COMBO SURTIDO",
        subtitle: "Combina hasta 4 variedades",
        badge: "Paquete de 50 un (hasta 4 variedades)",
        price: "S/ 55.00",
        itemsList: ["Canastillas de Aceitunas", "Enrolladitos de Hot Dog", "Mil Hojitas", "Empanaditas Mixtas"]
      }
    },
    alfajorcitos: {
      title: "ALFAJORCITOS",
      items: [
        {
          name: "ALFAJORCITOS REGULARES",
          icon: "alfajor-reg",
          subtitle: "REGULARES (12 UNIDADES POR PAQUETE)",
          regularTier: { label: "Paquete de 12 un", price: "S/ 15.00" },
          minisTitle: "MINIS",
          miniTiers: [
            { label: "Paquete de 25 un", price: "S/ 20.00" },
            { label: "Paquete de 50 un", price: "S/ 38.00" },
            { label: "Paquete de 100 un", price: "S/ 70.00" }
          ]
        },
        {
          name: "ALFAJORCITOS CHIPS",
          icon: "alfajor-chips",
          subtitle: "REGULARES (12 UNIDADES POR PAQUETE)",
          regularTier: { label: "Paquete de 12 un", price: "S/ 18.00" },
          minisTitle: "MINIS",
          miniTiers: [
            { label: "Paquete de 25 un", price: "S/ 23.00" },
            { label: "Paquete de 50 un", price: "S/ 42.00" },
            { label: "Paquete de 100 un", price: "S/ 80.00" }
          ]
        },
        {
          name: "MINI TRIPLES",
          icon: "triple",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 40.00" },
            { label: "Paquete de 50 un", price: "S/ 75.00" },
            { label: "Paquete de 100 un", price: "S/ 140.00" }
          ]
        },
        {
          name: "MINI TRIPLES PREMIUM",
          icon: "triple-premium",
          tiers: [
            { label: "Paquete de 25 un", price: "S/ 50.00" },
            { label: "Paquete de 50 un", price: "S/ 95.00" },
            { label: "Paquete de 100 un", price: "S/ 180.00" }
          ]
        }
      ]
    }
  }
};
