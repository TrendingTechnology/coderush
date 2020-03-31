import Vue from 'vue';
import VueWindowSize from 'vue-window-size';
import VueSocketIOExt from 'vue-socket.io-extended';
import io from 'socket.io-client';
import App from './App.vue';
import router from './router';
import store from './store';

const socket = io(process.env.VUE_APP_URL, {
  autoConnect: false,
  reconnectionAttempts: 3,
  timeout: 10000,
});

Vue.use(VueSocketIOExt, socket, { store }, VueWindowSize);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render(h) { return h(App); },
}).$mount('#app');

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'webpackInvalid') {
    console.clear();
  }
});
