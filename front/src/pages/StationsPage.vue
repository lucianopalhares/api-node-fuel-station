<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h1 class="text-h4">Postos</h1><p class="text-medium-emphasis">Consulte os postos importados.</p></div>
      <div class="d-flex ga-2">
        <v-btn color="secondary" prepend-icon="mdi-upload" @click="importDialogRef?.open()">Importar postos</v-btn>
        <v-btn color="primary" prepend-icon="mdi-download" :loading="exporting" @click="exportError = ''; exportDialog = true">Exportar postos</v-btn>
      </div>
    </div>
    <v-card>
      <v-card-text>
        <v-text-field v-model="search" label="Buscar por CNPJ, nome, bandeira ou cidade" prepend-inner-icon="mdi-magnify" clearable hide-details="auto" @keyup.enter="load(1)" @click:clear="load(1)" />
      </v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mx-4 mb-4">{{ error }}</v-alert>
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <v-table v-if="!loading || stations.length">
        <thead><tr><th>Posto</th><th>CNPJ</th><th>Localização</th><th>Bandeira</th><th>Status</th><th>Atualizado em</th><th>Última importação</th><th>Ações</th></tr></thead>
        <tbody><tr v-for="station in stations" :key="station.id">
          <td><strong>{{ station.tradeName || station.legalName }}</strong><br><small>{{ station.legalName }}</small></td>
          <td>{{ station.cnpj }}</td><td>{{ station.address.city }} / {{ station.address.state }}</td>
          <td>{{ station.brand?.name || '—' }}</td><td><v-chip size="small" color="success" variant="tonal">{{ station.status }}</v-chip></td>
          <td>{{ formatDate(station.updatedAt) }}</td>
          <td>
            <RouterLink v-if="station.lastImport" :to="{ path: '/imports', query: { importId: station.lastImport.id } }">
              {{ formatDate(station.lastImport.date) }}
            </RouterLink>
            <span v-else>—</span>
          </td>
          <td>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click="openDetails(station)">
              Ver detalhes
            </v-btn>
          </td>
        </tr><tr v-if="!stations.length"><td colspan="8" class="text-center py-8">Nenhum posto encontrado.</td></tr></tbody>
      </v-table>
      <v-card-actions class="justify-end"><span class="text-caption mr-3">Página {{ page }}</span><v-btn icon="mdi-chevron-left" :disabled="page === 1 || loading" @click="load(page - 1)" /><v-btn icon="mdi-chevron-right" :disabled="!hasNext || loading" @click="load(page + 1)" /></v-card-actions>
    </v-card>
    <v-dialog v-model="exportDialog" max-width="420" persistent>
      <v-card>
        <v-card-title>Exportar postos</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">Escolha quantos postos deseja exportar.</p>
          <v-text-field v-model.number="exportLimit" label="Quantidade" type="number" min="1" step="1" :error-messages="exportError" autofocus @keyup.enter="exportStationsCsv" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="exporting" @click="exportDialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="exporting" @click="exportStationsCsv">Exportar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ImportStationsDialog ref="importDialogRef" @imported="load(1)" />

    <v-dialog v-model="detailsDialog" max-width="1100">
      <v-card v-if="selectedStation">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Detalhes do posto</span>
          <v-btn icon="mdi-close" variant="text" aria-label="Fechar detalhes" @click="detailsDialog = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 py-2">Identificação</v-card-title>
                <v-list density="compact" lines="two" class="py-0 text-body-2">
                  <v-list-item title="Razão social" :subtitle="selectedStation.legalName" />
                  <v-list-item title="Nome fantasia" :subtitle="selectedStation.tradeName || '—'" />
                  <v-list-item title="CNPJ" :subtitle="selectedStation.cnpj" />
                  <v-list-item title="Bandeira" :subtitle="selectedStation.brand?.name || '—'" />
                  <v-list-item title="Status" :subtitle="selectedStation.status" />
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 py-2">Endereço</v-card-title>
                <v-list density="compact" lines="two" class="py-0 text-body-2">
                  <v-list-item title="Logradouro" :subtitle="[selectedStation.address.street, selectedStation.address.number].filter(Boolean).join(', ') || '—'" />
                  <v-list-item title="Complemento" :subtitle="selectedStation.address.complement || '—'" />
                  <v-list-item title="Bairro" :subtitle="selectedStation.address.neighborhood || '—'" />
                  <v-list-item title="Município / UF" :subtitle="`${selectedStation.address.city} / ${selectedStation.address.state}`" />
                  <v-list-item title="CEP" :subtitle="selectedStation.address.postalCode || '—'" />
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 py-2">Responsável</v-card-title>
                <v-list density="compact" lines="two" class="py-0 text-body-2">
                  <v-list-item title="Nome" :subtitle="selectedStation.responsible?.name || '—'" />
                  <v-list-item title="CPF" :subtitle="selectedStation.responsible?.cpf || '—'" />
                  <v-list-item title="Email" :subtitle="selectedStation.responsible?.email || '—'" />
                  <v-list-item title="Cargo" :subtitle="selectedStation.responsible?.position || '—'" />
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title class="text-subtitle-2 py-2">Operação</v-card-title>
                <v-list density="compact" lines="two" class="py-0 text-body-2">
                  <v-list-item title="Combustíveis" :subtitle="selectedStation.fuels.join(', ') || '—'" />
                  <v-list-item title="Data de inauguração" :subtitle="formatDateOnly(selectedStation.openingDate)" />
                  <v-list-item title="Quantidade de bicos" :subtitle="String(selectedStation.pumpCount ?? '—')" />
                  <v-list-item title="Quantidade de pistas" :subtitle="String(selectedStation.laneCount ?? '—')" />
                  <v-list-item title="Observações" :subtitle="selectedStation.notes || '—'" />
                  <v-list-item title="Atualizado em" :subtitle="formatDate(selectedStation.updatedAt)" />
                  <v-list-item v-if="selectedStation.lastImport" title="Última importação" :subtitle="formatDate(selectedStation.lastImport.date)" />
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="primary" @click="detailsDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { exportStations, getStations } from '../services/stations';
import type { Station } from '../types/station';
import ImportStationsDialog from '../components/ImportStationsDialog.vue';

const stations = ref<Station[]>([]); const search = ref(''); const page = ref(1); const hasNext = ref(false); const loading = ref(false); const error = ref('');
const exportDialog = ref(false); const exportLimit = ref(100); const exporting = ref(false); const exportError = ref('');

const detailsDialog = ref(false); const selectedStation = ref<Station | null>(null);

const importDialogRef = ref<InstanceType<typeof ImportStationsDialog> | null>(null);

async function load(nextPage = 1) { loading.value = true; error.value = ''; try { const result = await getStations(nextPage, 10, search.value); stations.value = result.data; page.value = result.pagination.page; hasNext.value = result.pagination.hasNext; } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Erro inesperado ao carregar os postos.'; } finally { loading.value = false; } }

async function exportStationsCsv() {
  if (!Number.isInteger(exportLimit.value) || exportLimit.value < 1) {
    exportError.value = 'Informe uma quantidade inteira maior que zero.';
    return;
  }

  exporting.value = true;
  exportError.value = '';
  try {
    await exportStations(exportLimit.value);
    exportDialog.value = false;
  } catch (cause) {
    exportError.value = cause instanceof Error ? cause.message : 'Erro inesperado ao exportar os postos.';
  } finally {
    exporting.value = false;
  }
}

function openDetails(station: Station) {
  selectedStation.value = station;
  detailsDialog.value = true;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatDateOnly(value: string | null) {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

onMounted(() => load());
</script>
