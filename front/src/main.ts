import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { router } from './router';
import App from './App.vue';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

createApp(App)
  .use(createVuetify({
    components,
    directives,
    icons: { defaultSet: 'mdi' },
  }))
  .use(router)
  .mount('#app');