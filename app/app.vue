<template>
  <div>
    <NuxtPage />
  </div>
</template>

<style>
/* Estilos globales para los scrollbars (Neo-Brutalismo Botánico) */
.custom-scrollbar::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #F4F1E1;
  border-radius: 10px;
  border: 2px solid rgba(74, 93, 35, 0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4A5D23;
  border-radius: 10px;
  border: 3px solid #F4F1E1; /* Efecto encapsulado flotante */
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #2A321B;
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #4A5D23 #F4F1E1;
}

/* Quitar flechas de incremento/decremento en inputs numéricos globalmente */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -moz-appearance: textfield;
}

/* Transiciones de Página (Neo-Brutalismo) */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

/* Transiciones de Lista (Staggered Pop-ins) */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.list-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Transiciones de Popups (Calendario, Hora) */
.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* Transiciones para items del carrito */
.cart-item-move,
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.cart-item-leave-active {
  overflow: hidden;
  max-height: 200px; /* Permite que la altura se anime a 0 */
}
.cart-item-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(100%);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
  border-width: 0;
}

/* Transiciones del Drawer (Panel Lateral) */
.drawer-root-enter-active .drawer-backdrop,
.drawer-root-leave-active .drawer-backdrop,
.drawer-root-enter-active .drawer-panel,
.drawer-root-leave-active .drawer-panel {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.drawer-root-enter-from .drawer-backdrop,
.drawer-root-leave-to .drawer-backdrop {
  opacity: 0;
}

.drawer-root-enter-from .drawer-panel,
.drawer-root-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
