<template>
  <div>
    <div class="d-flex align-center mb-6"><div><h1 class="text-h4">Postos</h1><p class="text-medium-emphasis">Consulte os postos importados.</p></div></div>
    <v-card>
      <v-card-text>
        <v-text-field v-model="search" label="Buscar por CNPJ, nome, bandeira ou cidade" prepend-inner-icon="mdi-magnify" clearable hide-details="auto" @keyup.enter="load(1)" @click:clear="load(1)" />
      </v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mx-4 mb-4">{{ error }}</v-alert>
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <v-table v-if="!loading || stations.length">
        <thead><tr><th>Posto</th><th>CNPJ</th><th>Localização</th><th>Bandeira</th><th>Status</th></tr></thead>
        <tbody><tr v-for="station in stations" :key="station.id">
          <td><strong>{{ station.tradeName || station.legalName }}</strong><br><small>{{ station.legalName }}</small></td>
          <td>{{ station.cnpj }}</td><td>{{ station.address.city }} / {{ station.address.state }}</td>
          <td>{{ station.brand?.name || '—' }}</td><td><v-chip size="small" color="success" variant="tonal">{{ station.status }}</v-chip></td>
        </tr><tr v-if="!stations.length"><td colspan="5" class="text-center py-8">Nenhum posto encontrado.</td></tr></tbody>
      </v-table>
      <v-card-actions class="justify-end"><span class="text-caption mr-3">Página {{ page }}</span><v-btn icon="mdi-chevron-left" :disabled="page === 1 || loading" @click="load(page - 1)" /><v-btn icon="mdi-chevron-right" :disabled="!hasNext || loading" @click="load(page + 1)" /></v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getStations } from '../services/stations';
import type { Station } from '../types/station';

const stations = ref<Station[]>([]); const search = ref(''); const page = ref(1); const hasNext = ref(false); const loading = ref(false); const error = ref('');
async function load(nextPage = 1) { loading.value = true; error.value = ''; try { const result = await getStations(nextPage, 10, search.value); stations.value = result.data; page.value = result.pagination.page; hasNext.value = result.pagination.hasNext; } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Erro inesperado ao carregar os postos.'; } finally { loading.value = false; } }
onMounted(() => load());
</script>
