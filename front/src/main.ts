import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { router } from './router';
import App from './App.vue';

createApp(App).use(createVuetify({ icons: { defaultSet: 'mdi' } })).use(router).mount('#app');
