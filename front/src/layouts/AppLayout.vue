<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title>IPDV · Gestão de postos</v-app-bar-title>
      <v-spacer />
      <v-btn v-for="item in menu" :key="item.to" :to="item.to" variant="text" color="white">
        {{ item.label }}
      </v-btn>
    </v-app-bar>
    <v-main class="bg-grey-lighten-4"><v-container class="py-8"><router-view /></v-container></v-main>
  </v-app>
</template>

<script setup lang="ts">
const menu = [
  { label: 'Postos', to: '/stations' },
  { label: 'Importações', to: '/imports' },
];
</script>
