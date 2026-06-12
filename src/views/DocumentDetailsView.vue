<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getDocumentFromDb, deleteDocument } from '../services/dbHelper';

const props = defineProps({
  docId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const doc = ref(null);
const loading = ref(true);
const error = ref('');
const showOriginalText = ref(false);

onMounted(async () => {
  try {
    doc.value = await getDocumentFromDb(props.docId);
  } catch (err) {
    console.error('Erro ao buscar detalhes do documento:', err);
    error.value = 'Não foi possível carregar as informações do documento.';
  } finally {
    loading.value = false;
  }
});

async function handleDelete() {
  if (confirm(`Tem certeza que deseja excluir "${doc.value.name}"?`)) {
    try {
      await deleteDocument(doc.value.id);
      router.push({ name: 'Dashboard' });
    } catch (err) {
      alert('Erro ao excluir documento: ' + err.message);
    }
  }
}

function downloadText() {
  if (!doc.value || !doc.value.content) return;
  const blob = new Blob([doc.value.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.value.name.replace(/\.pdf$/i, '') + '_texto.txt';
  link.click();
  URL.revokeObjectURL(url);
}

const riskLabels = { low: 'Baixo Risco', medium: 'Médio Risco', high: 'Alto Risco' };
const riskClass  = { low: 'risk-low',    medium: 'risk-medium',  high: 'risk-high'  };
const borderClass = { low: 'border-risk-low', medium: 'border-risk-medium', high: 'border-risk-high' };
const statusLabels = {
  pending: 'Processando PDF',
  processed: 'PDF Processado',
  analyzing: 'Analisando',
  analyzed: 'Concluído',
  failed: 'Falhou',
};
</script>

<template>
  <div class="details-container">
    <!-- Back -->
    <div class="mb-4">
      <button class="btn btn-sm app-btn-secondary d-inline-flex align-items-center gap-2" @click="router.push({ name: 'Dashboard' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Voltar ao Painel
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5 gap-3">
      <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
      <p class="text-muted small mb-0">Carregando análise...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="app-card text-center py-5">
      <div class="error-icon mx-auto mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" x2="12" y1="8" y2="12"/>
          <line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
      </div>
      <h3 class="detail-title mb-1">Ocorreu um erro</h3>
      <p class="text-muted small mb-3">{{ error }}</p>
      <button class="btn app-btn-primary btn-sm" @click="router.push({ name: 'Dashboard' })">Voltar</button>
    </div>

    <!-- Content -->
    <div v-else-if="doc" class="d-flex flex-column gap-4">

      <!-- Meta card -->
      <div class="app-card">
        <div class="meta-header">
          <div>
            <span class="meta-subtitle">Documento</span>
            <h1 class="detail-h1">{{ doc.name }}</h1>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button class="btn btn-sm app-btn-secondary d-inline-flex align-items-center gap-2" @click="downloadText">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar Texto
            </button>
            <button class="btn btn-sm app-btn-danger d-inline-flex align-items-center gap-2" @click="handleDelete">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Excluir
            </button>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-3 mt-3">
          <div class="d-flex align-items-center gap-2">
            <span class="meta-label">Status:</span>
            <span class="status-badge" :class="`status-${doc.status}`">{{ statusLabels[doc.status] || doc.status }}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="meta-label">Processado em:</span>
            <span class="meta-value">{{ new Date(doc.created_at).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Risk Summary -->
      <div v-if="doc.analysis" class="app-card" :class="borderClass[doc.analysis.risk_level]">
        <div class="summary-header">
          <div class="d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
              class="text-muted">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h2 class="detail-h2 mb-0">Análise de Risco Geral</h2>
          </div>
          <span class="risk-badge risk-badge-lg" :class="riskClass[doc.analysis.risk_level]">
            {{ riskLabels[doc.analysis.risk_level] }}
          </span>
        </div>
        <p class="summary-text mt-3 mb-0">{{ doc.analysis.summary }}</p>
      </div>

      <!-- Clauses -->
      <div v-if="doc.analysis?.clauses?.length">
        <div class="d-flex align-items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h2 class="detail-h2 mb-0">Cláusulas Auditadas</h2>
        </div>
        <div class="row g-3">
          <div
            v-for="(clause, index) in doc.analysis.clauses"
            :key="index"
            class="col-12 col-md-6"
          >
            <div class="app-card clause-card h-100" :class="borderClass[clause.risk_level]">
              <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <h3 class="clause-title mb-1">{{ clause.title }}</h3>
                  <span class="clause-type-badge">{{ clause.type }}</span>
                </div>
                <span class="risk-badge" :class="riskClass[clause.risk_level]">
                  {{ riskLabels[clause.risk_level] }}
                </span>
              </div>
              <p class="clause-desc mb-0">{{ clause.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Extracted Text -->
      <div class="app-card">
        <div class="d-flex align-items-center justify-content-between" style="cursor:pointer" @click="showOriginalText = !showOriginalText">
          <div class="d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            <h2 class="detail-h2 mb-0">Texto Extraído</h2>
          </div>
          <button class="btn btn-sm app-btn-secondary">
            {{ showOriginalText ? 'Esconder' : 'Visualizar' }}
          </button>
        </div>
        <div v-if="showOriginalText" class="text-content-wrapper mt-3">
          <pre class="original-text">{{ doc.content }}</pre>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.detail-h1 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--app-text-primary);
  margin: 0.15rem 0 0;
}

.detail-h2 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-text-primary);
}

.detail-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-text-primary);
}

.meta-subtitle {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--app-text-muted);
}

.meta-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .meta-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.meta-label {
  font-size: 0.8rem;
  color: var(--app-text-muted);
}

.meta-value {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--app-text-secondary);
}

/* Summary / Risk */
.summary-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .summary-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.summary-text {
  font-size: 0.9rem;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

/* Risk border accents */
.border-risk-low    { border-left: 3px solid var(--app-success) !important; }
.border-risk-medium { border-left: 3px solid var(--app-warning) !important; }
.border-risk-high   { border-left: 3px solid var(--app-danger)  !important; }

/* Clause card */
.clause-card {
  border-left: 3px solid var(--app-border);
}

.clause-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--app-text-primary);
}

.clause-type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--app-accent);
  background-color: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
}

.clause-desc {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--app-text-secondary);
}

/* Error icon */
.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 0.6rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--app-danger);
}

/* Extracted text */
.text-content-wrapper {
  background-color: var(--app-bg);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.original-text {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.8rem;
  color: var(--app-text-muted);
  white-space: pre-wrap;
  line-height: 1.6;
  margin: 0;
}
</style>
