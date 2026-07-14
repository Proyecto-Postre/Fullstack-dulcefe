<script setup lang="ts">
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

async function handleLogin() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });

    if (response.success) {
      await navigateTo("/");
    }
  } catch (err: any) {
    errorMessage.value =
      err.data?.statusMessage || "Correo o contraseña incorrectos.";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#FEF3C7] font-inter text-[#78350F] selection:bg-[#92400E] selection:text-white relative flex items-center justify-center p-6 overflow-hidden">
    <!-- Ambient Liquid Glass Background Effects -->
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#B45309]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none"></div>
    <div class="absolute top-[20%] right-[-10%] w-96 h-96 bg-[#F59E0B]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
    <div class="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-[#92400E]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

    <div class="relative z-10 w-full max-w-md">
      <!-- Glassmorphism Card -->
      <div class="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-[#92400E]/10 border border-white/60 p-10 overflow-hidden relative group">
        <!-- Shine effect on hover -->
        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>

        <div class="text-center mb-10">
          <div class="w-16 h-16 mx-auto bg-gradient-to-tr from-[#92400E] to-[#B45309] rounded-2xl flex items-center justify-center shadow-lg shadow-[#92400E]/30 transform rotate-3 mb-6 transition-transform duration-500 hover:rotate-12 cursor-default">
            <span class="text-3xl drop-shadow-md">🧁</span>
          </div>
          <h1 class="text-4xl font-playfair font-black text-[#92400E] mb-2 tracking-tight">Dulce Fe</h1>
          <p class="text-sm font-semibold text-[#B45309]/70 uppercase tracking-widest">
            Acceso Administrativo
          </p>
        </div>

        <div
          v-if="errorMessage"
          class="mb-8 bg-red-50/90 backdrop-blur-md border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 animate-shake shadow-sm"
        >
          <span class="text-xl">⚠️</span>
          <p>{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6 relative z-20">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-[#92400E]/70 mb-2 pl-1"
              >Correo electrónico</label
            >
            <div class="relative">
              <input
                v-model="email"
                type="email"
                required
                placeholder="jafethworren@gmail.com"
                class="w-full px-5 py-3.5 bg-white/70 border border-[#92400E]/10 rounded-2xl focus:outline-none focus:border-[#92400E]/40 focus:ring-4 focus:ring-[#92400E]/10 transition-all font-medium text-[#78350F] placeholder-[#B45309]/30 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-[#92400E]/70 mb-2 pl-1"
              >Contraseña</label
            >
            <div class="relative">
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-5 py-3.5 bg-white/70 border border-[#92400E]/10 rounded-2xl focus:outline-none focus:border-[#92400E]/40 focus:ring-4 focus:ring-[#92400E]/10 transition-all font-medium text-[#78350F] placeholder-[#B45309]/30 shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="group w-full relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-wide text-white bg-gradient-to-r from-[#92400E] to-[#B45309] rounded-2xl overflow-hidden transition-all shadow-lg shadow-[#92400E]/20 hover:shadow-[#92400E]/40 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            <span class="relative z-10 flex items-center gap-2">
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? "Verificando..." : "Ingresar al Sistema" }}
              <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </form>

        <div class="mt-8 text-center">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 text-sm text-[#92400E]/70 hover:text-[#92400E] font-semibold transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al catálogo
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,700&display=swap');

.font-inter {
  font-family: 'Inter', sans-serif;
}
.font-playfair {
  font-family: 'Playfair Display', serif;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-blob {
  animation: blob 10s infinite;
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
