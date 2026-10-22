<script setup lang="ts">
import { useHead, useSeoMeta } from 'nuxt/app'
import FaqAccordion, { type FaqItem } from '~/components/ui/FaqAccordion.vue'

useSeoMeta({
  title: 'Preguntas Frecuentes — Dulce Fe Taller Artesanal',
  description: 'Conoce nuestras políticas de elaboración artesanal, tiempos de anticipación, modalidades de entrega y métodos de pago en Dulce Fe.'
})

useHead({
  title: 'Preguntas Frecuentes — Dulce Fe'
})

const faqList: FaqItem[] = [
  {
    id: 'anticipacion',
    question: '¿Con cuánta anticipación debo hacer mi pedido?',
    answer: 'Recomendamos realizar tu pedido con al menos 36 a 48 horas de anticipación para garantizar horneado fresco y decoración artesanal con insumos de alta calidad.\n\nSi requieres un pedido con menor tiempo (por ejemplo, queques caseros tradicionales para el día siguiente o primera hora), puedes coordinarlo directamente con nosotros por WhatsApp para confirmar disponibilidad inmediata en el taller.'
  },
  {
    id: 'envios',
    question: '¿Cómo funciona el envío o la entrega?',
    answer: 'Ofrecemos dos modalidades de entrega:\n\n1. Delivery a Domicilio: Llevamos tu pedido directamente a tu dirección. El costo de envío se coordina vía WhatsApp según la distancia de tu distrito y el volumen del postre.\n\n2. Punto de Encuentro Acordado: Sin costo adicional con previa coordinación para pedidos de fácil transporte. Pedidos grandes requieren un costo de envío y se coordinan por WhatsApp.'
  },
  {
    id: 'conservacion',
    question: '¿Cómo debo conservar mi postre o torta?',
    answer: 'Los queques artesanales tradicionales y alfajores se conservan frescos a temperatura ambiente en un lugar seco y fresco hasta por 4 días.\n\nLas tortas con rellenos de crema pastelera, frutos frescos, tres leches o cheesecakes deben mantenerse en refrigeración continua (entre 4°C y 8°C) y retirarse 15 minutos antes de degustar para una textura óptima.'
  },
  {
    id: 'pagos',
    question: '¿Cuáles son las formas de pago aceptadas?',
    answer: 'Aceptamos transferencias y pagos directos mediante Yape y Plin escaneando el código QR oficial de Dulce Fe o utilizando nuestro número de contacto y adjuntando la captura en el checkout.\n\nTambién admitimos efectivo contra entrega en puntos de encuentro acordados.'
  },
  {
    id: 'cambios',
    question: '¿Puedo cambiar la hora de entrega o agregar dedicatoria?',
    answer: 'Sí. Puedes escribir tu mensaje de dedicatoria en las notas del checkout al momento de comprar.\n\nSi necesitas ajustar la hora o coordinar una entrega antes de lo previsto, solo escríbenos a nuestro WhatsApp con tu número de pedido y coordinamos el horario con total flexibilidad.'
  }
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
    <!-- Encabezado Editorial -->
    <div class="text-center space-y-3 mb-10 sm:mb-12">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cream/80 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider">
        <Icon name="lucide:help-circle" class="w-4 h-4" />
        <span>Centro de Respuestas</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-sans font-bold text-brand-secondary tracking-tight">
        Preguntas Frecuentes
      </h1>
      <p class="text-xs sm:text-base text-brand-secondary/70 max-w-xl mx-auto leading-relaxed">
        Todo lo que necesitas saber sobre nuestros procesos de horneado, tiempos de taller y opciones de entrega.
      </p>
    </div>

    <!-- Acordeón de Preguntas -->
    <FaqAccordion :items="faqList" />

    <!-- Tarjeta de Contacto Directo WhatsApp -->
    <div class="mt-12 bg-surface p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-brand-primary/15 text-center space-y-4 shadow-soft-sm">
      <div class="w-12 h-12 mx-auto rounded-full bg-brand-cream flex items-center justify-center text-brand-primary">
        <Icon name="lucide:message-circle" class="w-6 h-6" />
      </div>
      <div class="space-y-1">
        <h2 class="text-base sm:text-lg font-sans font-bold text-brand-secondary">
          ¿Tienes una consulta específica o pedido personalizado?
        </h2>
        <p class="text-xs sm:text-sm text-brand-secondary/70 max-w-md mx-auto">
          Escríbenos directamente a nuestro WhatsApp para coordinar sabores, tamaños a medida o entregas en horarios especiales.
        </p>
      </div>
      <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <NuxtLink
          to="/menu"
          class="w-full sm:w-auto px-6 py-2.5 rounded-full border border-brand-primary/30 text-brand-secondary text-xs sm:text-sm font-bold hover:bg-brand-cream/50 transition-colors"
        >
          Explorar la Carta
        </NuxtLink>
        <a
          href="https://wa.me/51999999999?text=Hola%20Dulce%20Fe,%20tengo%20una%20consulta%20sobre%20un%20pedido"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full sm:w-auto px-6 py-2.5 rounded-full bg-brand-primary text-white text-xs sm:text-sm font-bold hover:bg-brand-secondary transition-colors inline-flex items-center justify-center gap-2"
        >
          <Icon name="lucide:message-circle" class="w-4 h-4" />
          <span>Consultar por WhatsApp</span>
        </a>
      </div>
    </div>
  </div>
</template>
