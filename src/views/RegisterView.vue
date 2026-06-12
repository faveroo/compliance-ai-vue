<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMsg = ref('');
const loading = ref(false);

async function handleSubmit() {
  errorMsg.value = '';

  if (!email.value || !password.value || !confirmPassword.value) {
    errorMsg.value = 'Por favor, preencha todos os campos.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'As senhas não coincidem.';
    return;
  }

  loading.value = true;
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    router.push({ name: 'Dashboard' });
  } catch (error) {
    switch (error.code) {
      case 'auth/invalid-email':
        errorMsg.value = 'Formato de e-mail inválido.';
        break;
      case 'auth/email-already-in-use':
        errorMsg.value = 'Este e-mail já está em uso.';
        break;
      case 'auth/weak-password':
        errorMsg.value = 'A senha deve conter no mínimo 6 caracteres.';
        break;
      case 'auth/configuration-not-found':
        errorMsg.value = 'Provedor de E-mail/Senha não está ativado no Firebase Console.';
        break;
      default:
        errorMsg.value = 'Ocorreu um erro ao processar sua solicitação.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-items-center justify-content-center min-vh-100">
    <div class="auth-card">
      <!-- Header -->
      <div class="text-center mb-4">
        <div class="auth-icon-wrap mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 class="auth-title">Criar Conta</h1>
        <p class="auth-subtitle">Comece a analisar seus documentos com IA</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate>
        <div class="mb-3">
          <label for="email" class="form-label app-label">E-mail</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="seu@email.com"
            class="form-control app-input"
            required
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label app-label">Senha</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="form-control app-input"
            required
          />
        </div>

        <div class="mb-3">
          <label for="confirmPassword" class="form-label app-label">Confirmar Senha</label>
          <input
            id="confirmPassword"
            type="password"
            v-model="confirmPassword"
            placeholder="••••••••"
            class="form-control app-input"
            required
          />
        </div>

        <div v-if="errorMsg" class="alert app-alert-danger d-flex align-items-center gap-2 py-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span>{{ errorMsg }}</span>
        </div>

        <button type="submit" class="btn app-btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ loading ? 'Criando conta...' : 'Criar Conta' }}
        </button>
      </form>

      <!-- Footer -->
      <div class="text-center mt-4">
        <span class="text-secondary small">Já tem uma conta? </span>
        <router-link :to="{ name: 'Login' }" class="app-link small">Faça Login</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  background-color: var(--app-bg);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--app-card-bg);
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  padding: 2.25rem 2rem;
}

.auth-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 0.6rem;
  background-color: var(--app-hover-bg);
  border: 1px solid var(--app-border);
  color: var(--app-accent);
}

.auth-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  margin-bottom: 0;
}
</style>
