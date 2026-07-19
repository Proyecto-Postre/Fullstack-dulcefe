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
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative flex items-center justify-center p-6 overflow-hidden">
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.04] -rotate-12" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.04] rotate-45" />
      <Icon name="lucide:leaf" class="absolute top-[30%] left-[10%] w-64 h-64 text-[#4A5D23]/[0.02] rotate-[120deg]" />
      <div class="absolute top-0 right-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
      <div class="absolute top-0 left-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
    </div>

    <div class="relative z-10 w-full max-w-md">
      <!-- High Contrast Card -->
      <div class="bg-white rounded-[2rem] border-2 border-[#4A5D23] shadow-[8px_8px_0px_#4A5D23] p-10 lg:p-12 overflow-hidden relative">

        <div class="text-center mb-10">
          <div class="w-14 h-14 mx-auto border border-[#4A5D23] bg-[#F4F1E1] rounded-full flex items-center justify-center text-[#4A5D23] shadow-[3px_3px_0px_#4A5D23] mb-6">
            <Icon name="lucide:wheat" class="w-6 h-6" />
          </div>
          <h1 class="text-3xl font-playfair font-black text-[#2A321B] mb-2 tracking-tight">Dulce Fe</h1>
          <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest flex items-center justify-center gap-2">
            <span class="w-6 h-px bg-[#4A5D23]/40"></span>
            Administración
            <span class="w-6 h-px bg-[#4A5D23]/40"></span>
          </p>
        </div>

        <div
          v-if="errorMessage"
          class="mb-8 bg-white border-2 border-red-800 text-red-900 px-5 py-4 rounded-xl text-[13px] font-medium flex items-center gap-3 shadow-[4px_4px_0px_#991B1B] animate-shake"
        >
          <Icon name="lucide:circle-alert" class="w-5 h-5 shrink-0" />
          <p class="leading-snug">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5 relative z-20">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-[#4A5D23] mb-2 pl-1"
              >Correo electrónico</label
            >
            <div class="relative">
              <Icon name="lucide:mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5D23]/60" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="usuario@dulcefe.com"
                class="w-full pl-11 pr-5 py-3.5 bg-white border border-[#4A5D23]/30 rounded-xl focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 transition-all font-medium text-[#2A321B] placeholder-[#4A5D23]/30"
              />
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-[#4A5D23] mb-2 pl-1"
              >Contraseña</label
            >
            <div class="relative">
              <Icon name="lucide:lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5D23]/60" />
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full pl-11 pr-5 py-3.5 bg-white border border-[#4A5D23]/30 rounded-xl focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 transition-all font-medium text-[#2A321B] placeholder-[#4A5D23]/30"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="group w-full relative inline-flex items-center justify-center px-8 py-4 text-[13px] font-bold tracking-widest uppercase text-[#F4F1E1] bg-[#4A5D23] hover:bg-[#3C4A1C] border border-[#2A321B] rounded-xl overflow-hidden transition-all shadow-[4px_4px_0px_#2A321B] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            <span class="relative z-10 flex items-center gap-2">
              <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              {{ isLoading ? "Verificando..." : "Ingresar" }}
              <Icon v-if="!isLoading" name="lucide:arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </form>

        <div class="mt-8 text-center border-t border-dashed border-[#4A5D23]/30 pt-8">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 text-[12px] font-bold text-[#4A5D23]/70 hover:text-[#4A5D23] transition-colors group"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
