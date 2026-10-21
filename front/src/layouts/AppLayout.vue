<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title>IPDV · Gestão de postos</v-app-bar-title>
      <v-spacer />
      <v-btn
        v-for="item in menu"
        :key="item.label"
        :to="item.to"
        :href="item.href"
        :target="item.href ? '_blank' : undefined"
        :rel="item.href ? 'noopener noreferrer' : undefined"
        variant="text"
        color="white"
      >
        {{ item.label }}
      </v-btn>
    </v-app-bar>
    <v-main class="bg-grey-lighten-4"><v-container class="py-8"><router-view /></v-container></v-main>
  </v-app>
</template>

<script setup lang="ts">

type MenuItem = {
  label: string;
  to?: string;
  href?: string;
};

const menu: MenuItem[] = [
  { label: 'Postos', to: '/stations' },
  { label: 'Importações', to: '/imports' },
  //{ label: 'RabbitMQ', href: import.meta.env.VITE_QUEUE_URL || 'http://localhost:15673' },
  { label: 'Logs', href: import.meta.env.VITE_OBSERVABILITY_URL || 'http://localhost:9999' },
];
</script>
