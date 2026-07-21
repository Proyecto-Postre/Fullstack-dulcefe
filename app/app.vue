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
</style>
