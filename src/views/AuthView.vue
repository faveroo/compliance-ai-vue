<script setup>
import { ref } from 'vue';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMsg = ref('');
const loading = ref(false);

async function handleSubmit() {
  errorMsg.value = '';
  
  if (!email.value || !password.value) {
    errorMsg.value = 'Por favor, preencha todos os campos.';
    return;
  }
  
  if (!isLogin.value && password.value !== confirmPassword.value) {
    errorMsg.value = 'As senhas não coincidem.';
    return;
  }
  
  loading.value = true;
  try {
    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
    }
  } catch (error) {
    console.error('Erro na autenticação:', error.code, error.message);
    switch (error.code) {
      case 'auth/invalid-email':
        errorMsg.value = 'Formato de e-mail inválido.';
        break;
      case 'auth/user-disabled':
        errorMsg.value = 'Esta conta de usuário foi desativada.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMsg.value = 'E-mail ou senha incorretos.';
        break;
      case 'auth/email-already-in-use':
        errorMsg.value = 'Este e-mail já está em uso.';
        break;
      case 'auth/weak-password':
        errorMsg.value = 'A senha deve conter no mínimo 6 caracteres.';
        break;
      case 'auth/configuration-not-found':
        errorMsg.value = 'O provedor de E-mail/Senha não está ativado no seu Firebase Console. Ative-o em Authentication > Sign-in method.';
        break;
      default:
        errorMsg.value = 'Ocorreu um erro ao processar sua solicitação.';
    }
  } finally {
    loading.value = false;
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value;
  errorMsg.value = '';
  password.value = '';
  confirmPassword.value = '';
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="glass-card auth-card">
      <div class="auth-header">
        <span class="auth-logo">🛡️</span>
        <h2>{{ isLogin ? 'Acessar Compliance AI' : 'Criar Nova Conta' }}</h2>
        <p>{{ isLogin ? 'Analise seus contratos em segundos' : 'Comece a analisar seus documentos com IA' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input 
            id="email" 
            type="email" 
            v-model="email" 
            placeholder="seu@email.com" 
            class="input-control" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input 
            id="password" 
            type="password" 
            v-model="password" 
            placeholder="••••••••" 
            class="input-control" 
            required 
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="confirmPassword">Confirmar Senha</label>
          <input 
            id="confirmPassword" 
            type="password" 
            v-model="confirmPassword" 
            placeholder="••••••••" 
            class="input-control" 
            required 
          />
        </div>

        <div v-if="errorMsg" class="form-error-box">
          ⚠️ {{ errorMsg }}
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Registrar') }}
        </button>
      </form>

      <div class="auth-footer">
        <button class="btn-link" @click="toggleMode">
          {{ isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.form-error-box {
  background-color: var(--color-high-bg);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

.w-full {
  width: 100%;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.btn-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}
</style>
