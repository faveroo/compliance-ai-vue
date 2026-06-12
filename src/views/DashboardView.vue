<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../config/firebase';
import {
  createDocumentInDb,
  deleteDocument,
  subscribeToUserDocuments,
} from '../services/dbHelper';
import { processAndAnalyzeDocument } from '../services/pipeline';

const router = useRouter();

const documents = ref([]);
const fileInput = ref(null);
const uploadLoading = ref(false);
const uploadError = ref('');
const processingDocs = ref({});
const isDragging = ref(false);

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let unsubscribe = () => {};

onMounted(() => {
  const user = auth.currentUser;
  if (!user) return;

  unsubscribe = subscribeToUserDocuments(
    user.uid,
    (docs) => { documents.value = docs; },
    (err) => { console.error('Erro ao buscar documentos:', err); }
  );
});

onUnmounted(() => { unsubscribe(); });

async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) await uploadAndProcess(file);
}

function onDragOver(e) { e.preventDefault(); isDragging.value = true; }
function onDragLeave() { isDragging.value = false; }

async function onDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    await uploadAndProcess(file);
  } else {
    uploadError.value = 'Por favor, envie apenas arquivos PDF.';
  }
}

async function uploadAndProcess(file) {
  if (file.type !== 'application/pdf') {
    uploadError.value = 'O arquivo deve ser um PDF.';
    return;
  }

  uploadLoading.value = true;
  uploadError.value = '';
  let docId = null;

  try {
    const user = auth.currentUser;
    docId = await createDocumentInDb(user.uid, file.name);

    if (fileInput.value) fileInput.value.value = '';
    uploadLoading.value = false;

    processingDocs.value[docId] = true;
    processAndAnalyzeDocument(docId, file, apiKey.trim())
      .catch((err) => console.error('Background processing failed:', err))
      .finally(() => { delete processingDocs.value[docId]; });
  } catch (error) {
    console.error('Erro no processamento:', error);
    uploadError.value = 'Erro ao processar o arquivo: ' + (error.message || error);
    uploadLoading.value = false;
    if (docId) deleteDocument(docId);
  }
}

async function handleReprocess(doc) {
  processingDocs.value[doc.id] = true;
  try {
    await processAndAnalyzeDocument(doc.id, null, apiKey.trim(), doc.content);
  } catch (error) {
    alert('Erro ao reprocessar: ' + error.message);
  } finally {
    delete processingDocs.value[doc.id];
  }
}

async function handleDelete(doc) {
  if (confirm(`Tem certeza que deseja excluir "${doc.name}"?`)) {
    try {
      await deleteDocument(doc.id);
    } catch (error) {
      alert('Erro ao deletar documento: ' + error.message);
    }
  }
}

// Status / Risk labels
const statusLabels = {
  pending: 'Processando PDF',
  processed: 'PDF Processado',
  analyzing: 'Analisando',
  analyzed: 'Concluído',
  failed: 'Falhou',
};

const riskLabels = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};
</script>

<template>
  <div class="row g-4">
    <!-- Left Column: Upload -->
    <div class="col-12 col-md-4">
      <div class="app-card h-100">
        <h2 class="section-title mb-1">Novo Documento</h2>
        <p class="section-desc mb-4">Envie um contrato em PDF para análise por inteligência artificial.</p>

        <!-- Dropzone -->
        <div
          class="dropzone"
          :class="{ 'dropzone-active': isDragging }"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @click="fileInput.click()"
        >
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            accept="application/pdf"
            style="display: none"
          />
          <div class="dropzone-body">
            <div class="dropzone-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <span class="dropzone-text">
              {{ uploadLoading ? 'Carregando...' : 'Arraste o PDF ou clique para selecionar' }}
            </span>
            <span class="dropzone-sub">Apenas arquivos PDF são suportados</span>
          </div>
        </div>

        <div v-if="uploadError" class="alert app-alert-danger d-flex align-items-center gap-2 py-2 mt-3 mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span class="small">{{ uploadError }}</span>
        </div>
      </div>
    </div>

    <!-- Right Column: Document List -->
    <div class="col-12 col-md-8">
      <div class="app-card h-100">
        <h2 class="section-title mb-4">Arquivos Enviados</h2>

        <!-- Empty state -->
        <div v-if="documents.length === 0" class="empty-state">
          <div class="empty-icon mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p class="empty-title">Nenhum documento enviado</p>
          <p class="empty-sub">Faça o upload do seu primeiro PDF no painel ao lado.</p>
        </div>

        <!-- Document list -->
        <div v-else class="doc-list">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="doc-item"
          >
            <div class="doc-info" @click="doc.status === 'analyzed' && router.push({ name: 'DocumentDetails', params: { id: doc.id } })">
              <div class="d-flex align-items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="text-muted flex-shrink-0">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="doc-name" :class="{ 'doc-name-clickable': doc.status === 'analyzed' }">
                  {{ doc.name }}
                </span>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="status-badge" :class="`status-${doc.status}`">
                  {{ statusLabels[doc.status] || doc.status }}
                </span>
                <span v-if="doc.analysis" class="risk-badge" :class="`risk-${doc.analysis.risk_level}`">
                  {{ riskLabels[doc.analysis.risk_level] }}
                </span>
                <span class="doc-date">{{ new Date(doc.created_at).toLocaleDateString() }}</span>
              </div>
              <div v-if="doc.errorMessage" class="doc-error small mt-1">
                {{ doc.errorMessage }}
              </div>
            </div>

            <div class="doc-actions">
              <button
                v-if="doc.status === 'analyzed'"
                class="btn btn-sm app-btn-secondary"
                @click="router.push({ name: 'DocumentDetails', params: { id: doc.id } })"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Ver
              </button>

              <button
                v-if="['completed', 'failed', 'analyzed'].includes(doc.status) || doc.errorMessage"
                class="btn btn-sm app-btn-secondary"
                :disabled="processingDocs[doc.id]"
                @click="handleReprocess(doc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
                {{ processingDocs[doc.id] ? 'Processando...' : 'Reprocessar' }}
              </button>

              <button
                class="btn btn-sm app-btn-danger"
                :disabled="processingDocs[doc.id]"
                @click="handleDelete(doc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 0;
}

.section-desc {
  font-size: 0.85rem;
  color: var(--app-text-muted);
}

/* Dropzone */
.dropzone {
  border: 1.5px dashed var(--app-border);
  border-radius: 0.6rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  background-color: var(--app-hover-bg);
  transition: border-color 0.15s, background-color 0.15s;
}

.dropzone:hover,
.dropzone-active {
  border-color: var(--app-accent);
  background-color: rgba(99, 102, 241, 0.04);
}

.dropzone-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.dropzone-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  background-color: var(--app-card-bg);
  border: 1px solid var(--app-border);
  color: var(--app-text-muted);
  margin-bottom: 0.25rem;
}

.dropzone-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--app-text-secondary);
}

.dropzone-sub {
  font-size: 0.75rem;
  color: var(--app-text-muted);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 0.75rem;
  background-color: var(--app-hover-bg);
  border: 1px solid var(--app-border);
  color: var(--app-text-muted);
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--app-text-secondary);
  margin-bottom: 0.25rem;
}

.empty-sub {
  font-size: 0.82rem;
  color: var(--app-text-muted);
}

/* Document List */
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.doc-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  background-color: var(--app-hover-bg);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  transition: border-color 0.15s;
}

.doc-item:hover {
  border-color: rgba(255,255,255,0.12);
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--app-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-name-clickable {
  cursor: pointer;
}

.doc-name-clickable:hover {
  color: var(--app-accent);
  text-decoration: underline;
}

.doc-date {
  font-size: 0.72rem;
  color: var(--app-text-muted);
}

.doc-error {
  color: var(--app-danger);
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}
</style>
