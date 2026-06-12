<script setup>
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const user = ref(null);
const router = useRouter();

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
  });
});

async function handleLogout() {
  try {
    await signOut(auth);
    router.push({ name: 'Login' });
  } catch (error) {
    console.error('Erro ao sair:', error);
  }
}
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <!-- Navbar -->
    <nav class="navbar navbar-dark app-navbar border-bottom">
      <div class="container-xl">
        <!-- Brand -->
        <router-link class="navbar-brand d-flex align-items-center gap-2" :to="{ name: 'Dashboard' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="text-primary">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span class="fw-semibold">Compliance AI</span>
        </router-link>

        <!-- Nav links -->
        <div class="d-flex align-items-center gap-2">
          <router-link
            :to="{ name: 'Dashboard' }"
            class="nav-link px-3 py-2 rounded"
            active-class="nav-link-active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            Dashboard
          </router-link>
        </div>

        <!-- User info + logout -->
        <div class="d-flex align-items-center gap-3">
          <span class="user-email text-secondary small">{{ user?.email }}</span>
          <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" @click="handleLogout">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-grow-1 py-4">
      <div class="container-xl">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-navbar {
  background-color: var(--app-nav-bg);
  border-color: var(--app-border) !important;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}

.navbar-brand {
  color: var(--app-text-primary) !important;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}

.navbar-brand svg {
  color: var(--app-accent);
}

.nav-link {
  color: var(--app-text-secondary) !important;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.15s, background-color 0.15s;
  display: flex;
  align-items: center;
}

.nav-link:hover {
  color: var(--app-text-primary) !important;
  background-color: var(--app-hover-bg);
}

.nav-link-active {
  color: var(--app-text-primary) !important;
  background-color: var(--app-hover-bg);
}

.user-email {
  color: var(--app-text-muted) !important;
}
</style>
