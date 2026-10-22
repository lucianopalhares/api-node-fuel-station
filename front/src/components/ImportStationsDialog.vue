<!--
centraliza o diálogo e o fluxo de envio CSV para ser usado em StationsPage e ImportsPage.
--> 
<template>
  <v-dialog v-model="dialog" max-width="520">
    <v-card>
      <v-card-title>Importar postos</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">Selecione um arquivo CSV no formato padrão de postos. O arquivo será validado e processado pela API.</p>
        <p class="text-body-2 mb-4">
          Se preferir, <a href="/csv-example.csv" download="csv-example.csv">baixe a planilha de modelo</a>.
        </p>
        <v-file-input
          v-model="file"
          label="Arquivo CSV"
          accept=".csv,text/csv,application/csv,application/vnd.ms-excel"
          prepend-icon="mdi-file-delimited"
          show-size
          clearable
          :error-messages="error"
          :disabled="uploading"
          @update:model-value="handleFileChange"
        />
        <v-alert v-if="success" type="success" variant="tonal" class="mt-3">{{ success }}</v-alert>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="uploading" @click="dialog = false">{{ success ? 'Fechar' : 'Cancelar' }}</v-btn>
        <v-btn color="secondary" :loading="uploading" :disabled="!file" @click="uploadFile">Enviar arquivo</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { uploadStations } from '../services/imports';

const emit = defineEmits<{ imported: [] }>();
const dialog = ref(false);
const file = ref<File | null>(null);
const uploading = ref(false);
const error = ref('');
const success = ref('');

function open() {
  file.value = null;
  error.value = '';
  success.value = '';
  dialog.value = true;
}

function handleFileChange(value: File | File[] | null) {
  file.value = Array.isArray(value) ? value[0] ?? null : value;
  error.value = '';
  if (file.value) success.value = '';
}

async function uploadFile() {
  const selectedFile = file.value;
  if (!selectedFile) {
    error.value = 'Selecione um arquivo CSV para continuar.';
    return;
  }
  if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
    error.value = 'Selecione um arquivo com extensão .csv.';
    return;
  }

  uploading.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await uploadStations(selectedFile);
    success.value = `Arquivo recebido com sucesso e enviado para processamento. Código da importação: ${result.id}.`;
    file.value = null;
    emit('imported');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Não foi possível importar o arquivo. Confira o CSV e tente novamente.';
  } finally {
    uploading.value = false;
  }
}

defineExpose({ open });
</script>

