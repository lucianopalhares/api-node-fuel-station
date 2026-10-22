<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h1 class="text-h4">Importações</h1><p class="text-medium-emphasis">Acompanhe o resultado dos arquivos processados.</p></div>
      <v-btn prepend-icon="mdi-refresh" variant="outlined" :loading="loading" @click="loadImports">Atualizar</v-btn>
    </div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-card v-if="!loading || imports.length">
      <v-table>
        <thead>
          <tr>
            <th>Arquivo</th><th>Status</th><th>Total processadas</th><th>Criadas</th><th>Atualizadas</th><th>Com erro</th><th>Iniciada em</th>
            <th class="text-right actions-header">
              <span class="text-caption text-medium-emphasis font-weight-regular">
                Baixar erros gera a mesma planilha somente com as <br>linhas com erro para corrigir e tentar novamente.
              </span>
            </th>
          </tr>  
        </thead>
        <tbody>
          <tr v-for="item in imports" :key="item.id">
            <td class="font-weight-medium">{{ item.filename }}</td>
            <td><v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ statusLabel(item.status) }}</v-chip></td>
            <td>{{ item.totalRows }}</td><td class="text-success">{{ item.importedRows }}</td><td class="text-info">{{ item.updatedRows }}</td><td class="text-error">{{ item.errorRows }}</td>
            <td>{{ formatDate(item.startedAt) }}</td>
            <td class="text-right">
              <v-btn
                size="small"
                variant="text"
                color="primary"
                prepend-icon="mdi-download"
                :href="getImportExportUrl(item.id)"
              >
                Baixar planilha
              </v-btn>
              <v-btn
                v-if="item.errorRows > 0"
                size="small"
                variant="text"
                color="error"
                prepend-icon="mdi-download"
                :href="getImportErrorExportUrl(item.id)"
              >
                Baixar erros
              </v-btn>
              <v-btn size="small" variant="text" @click="openDetails(item)">Ver detalhes</v-btn>
            </td>
          </tr>
          <tr v-if="!imports.length"><td colspan="8" class="text-center py-8">Nenhuma importação encontrada.</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="detailsOpen" max-width="1100">
      <v-card>
        <v-card-title class="d-flex align-center"><span class="text-truncate">{{ selected?.filename || 'Detalhes da importação' }}</span><v-spacer /><v-btn icon="mdi-close" variant="text" @click="detailsOpen = false" /></v-card-title>
        <v-card-text>
          <v-alert v-if="detailsError" type="error" variant="tonal" class="mb-4">{{ detailsError }}</v-alert>
          <div v-if="selected" class="summary-grid mb-5">
            <div v-for="metric in metrics(selected)" :key="metric.label" class="summary-item"><span class="text-caption text-medium-emphasis">{{ metric.label }}</span><strong :class="metric.class">{{ metric.value }}</strong></div>
          </div>
          <v-select v-model="rowStatus" label="Filtrar linhas" :items="rowStatusOptions" item-title="label" item-value="value" clearable hide-details="auto" class="mb-4" @update:model-value="loadDetails(1)" />
          <v-progress-linear v-if="detailsLoading" indeterminate color="primary" class="mb-3" />
          <v-table density="comfortable">
            <thead><tr><th>Linha</th><th>Status</th><th>Posto</th><th>CNPJ</th><th>Erro</th></tr></thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id"><td>{{ row.rowNumber }}</td><td><v-chip size="small" :color="rowStatusColor(row.status)" variant="tonal">{{ rowStatusLabel(row.status) }}</v-chip></td><td>{{ row.stationName || '—' }}</td><td>{{ row.cnpj || '—' }}</td><td>{{ row.errors.map((item) => item.message).filter(Boolean).join('; ') || '—' }}</td></tr>
              <tr v-if="!detailsLoading && !rows.length"><td colspan="5" class="text-center py-6">Nenhuma linha encontrada para este filtro.</td></tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="justify-end"><span class="text-caption mr-3">Página {{ detailsPage }}</span><v-btn icon="mdi-chevron-left" :disabled="detailsPage === 1 || detailsLoading" @click="loadDetails(detailsPage - 1)" /><v-btn icon="mdi-chevron-right" :disabled="!detailsHasNext || detailsLoading" @click="loadDetails(detailsPage + 1)" /></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getImportDetails, getImportErrorExportUrl, getImportExportUrl, getImports } from '../services/imports';
import type { ImportRow, ImportRowStatus, ImportSummary } from '../types/import';

const route = useRoute();

const imports = ref<ImportSummary[]>([]); const loading = ref(false); const error = ref('');
const detailsOpen = ref(false); const detailsLoading = ref(false); const detailsError = ref('');
const selected = ref<ImportSummary | null>(null); const rows = ref<ImportRow[]>([]); const rowStatus = ref<ImportRowStatus | null>(null);
const detailsPage = ref(1); const detailsHasNext = ref(false);
const rowStatusOptions = [{ label: 'Criadas', value: 'imported' }, { label: 'Atualizadas', value: 'updated' }, { label: 'Ignoradas', value: 'skipped' }, { label: 'Com erro', value: 'invalid' }];

async function loadImports() {
  loading.value = true; error.value = '';
  try {
    const importId = typeof route.query.importId === 'string' ? route.query.importId : undefined;
    imports.value = await getImports(20, importId);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Erro inesperado ao carregar as importações.';
  } finally { loading.value = false; }
}

async function openDetails(item: ImportSummary) { selected.value = item; detailsOpen.value = true; rowStatus.value = null; await loadDetails(1); }
async function loadDetails(page: number) {
  if (!selected.value) return;
  detailsLoading.value = true; detailsError.value = '';
  try { const result = await getImportDetails(selected.value.id, page, 10, rowStatus.value || undefined); rows.value = result.rows; detailsPage.value = result.pagination.page; detailsHasNext.value = result.pagination.hasNext; }
  catch (cause) { detailsError.value = cause instanceof Error ? cause.message : 'Erro inesperado ao carregar os detalhes.'; }
  finally { detailsLoading.value = false; }
}
function metrics(item: ImportSummary) { return [{ label: 'Total processadas', value: item.totalRows, class: '' }, { label: 'Criadas', value: item.importedRows, class: 'text-success' }, { label: 'Atualizadas', value: item.updatedRows, class: 'text-info' }, { label: 'Com erro', value: item.errorRows, class: 'text-error' }]; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }
function statusLabel(value: string) {
  return ({
    queued: 'Na fila',
    processing: 'Processando',
    completed: 'Concluída',
    completed_with_errors: 'Concluída com erros',
    failed: 'Falhou',
  }[value] || value);
}

function statusColor(value: string) {
  return value === 'completed'
    ? 'success'
    : value === 'completed_with_errors' || value === 'failed'
      ? 'error'
      : value === 'processing'
        ? 'info'
        : 'warning';
}
function rowStatusLabel(value: ImportRowStatus) { return ({ imported: 'Criada', updated: 'Atualizada', skipped: 'Ignorada', invalid: 'Com erro' }[value]); }
function rowStatusColor(value: ImportRowStatus) { return value === 'imported' ? 'success' : value === 'updated' ? 'info' : value === 'invalid' ? 'error' : 'warning'; }
watch(() => route.query.importId, () => { void loadImports(); });
onMounted(() => { void loadImports(); });
</script>

<style scoped>
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.summary-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; border: 1px solid rgba(0, 0, 0, .12); border-radius: 8px; }
.summary-item strong { font-size: 1.4rem; }
@media (max-width: 760px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
