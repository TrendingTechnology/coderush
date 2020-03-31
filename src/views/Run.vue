<template>
  <div class="run">
    <div v-if="requestReset" class="requestReset">
      <h2>Właściciel pokoju chce zacząć nową grę</h2>
      <p>Zostaniesz przeniesiony do poczekalni</p>
      <button @click="$router.push('/')">
        OK
      </button>
      <button @click="disconnect">
        Opuść pokój
      </button>
    </div>
    <div class="info">
      <h2>{{ languageName }}</h2>
      <h4 v-if="codeInfo.name">
        {{ codeInfo.name }}.{{ language.ext }}
      </h4>
      <h4>{{ codeSource }}</h4>
    </div>
    <!-- Changing key remounts component -->
    <div class="main">
      <div class="code">
        <CodeEditor
          v-if="language.name"
          :key="componentKey"
          @reset="reset"
          @completed="completed"
        />
      </div>
      <transition>
        <Results v-if="$route.path === '/results' && stats" :stats="stats" />
      </transition>
    </div>
  </div>
</template>

<script>
import CodeEditor from '@/components/CodeEditor.vue';
import Results from '@/views/Results.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'Run',
  components: {
    CodeEditor,
    Results,
  },
  data() {
    return {
      componentKey: 1,
      stats: false,
      requestReset: false,
    };
  },
  computed: {
    ...mapGetters(['language', 'customCode', 'codeInfo', 'room']),
    codeSource() {
      if (this.codeInfo.name) {
        return this.codeInfo.source === 'own' ? 'Kod własny' : this.codeInfo.source;
      } if (this.room.connected && !this.room.owner) {
        return 'Kod właściciela pokoju';
      }
      return 'Twój kod';
    },
    languageName() {
      return this.language.name.replace('_', ' ');
    },
  },
  created() {
    if (!this.language.name) {
      this.$router.push('/');
    }
  },
  sockets: {
    reset() {
      this.requestReset = true;
    },
  },
  methods: {
    reset() {
      this.componentKey += 1;
      if (this.$route.path === '/results') {
        this.$router.push('/run');
      }
    },
    completed(stats) {
      this.stats = stats;
    },
    disconnect() {
      this.requestReset = false;
      this.$socket.client.disconnect();
      this.$store.commit('SET_ROOM_PROPERTY', ['connected', false]);
      this.$store.commit('SET_ROOM_PROPERTY', ['ready', false]);
    },
  },
};

</script>

<style scoped>
.main {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  min-height: 100%;
}

.code {
  flex-grow: 1;
}

@media (max-width: 900) {
  .main {
    display: block;
  }
}

</style>
