<template>
  <div class="start">
    <SettingsMenu ref="settings" />

    <label>Wrzuć swój kod
      <input
        :checked="customCode.showEditor"
        :disabled="room.connected && !room.owner"
        type="checkbox"
        @input="useCustomCode($event.target.checked)"
      >
    </label>
    <keep-alive>
      <UploadCode v-if="showEditor" class="uploadCode" />
      <LanguagesList v-else />
    </keep-alive>


    <label v-if="room.connected"> Gotowy
      <input
        v-model="isReady"
        type="checkbox"
        :disabled="!language.name && room.owner"
        @input="ready($event.target.checked)"
      >
    </label>
    <button :disabled="!language.name || (room.owner && playersNotReady) || (room.connected && !room.owner) || (room.owner && !isReady)" @click="run">
      START
    </button>

    <p v-if="error">
      {{ error }}
    </p>
  </div>
</template>

<script>
import SettingsMenu from '@/components/SettingsMenu.vue';
import LanguagesList from '@/components/LanguagesList.vue';
import UploadCode from '@/components/UploadCode.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'Start',
  components: {
    SettingsMenu,
    LanguagesList,
    UploadCode,
  },
  data() {
    return {
      showEditor: false,
      error: '',
      isReady: false,
    };
  },
  computed: {
    ...mapGetters(['room', 'language', 'options', 'customCode']),
    playersNotReady() {
      // eslint-disable-next-line no-return-assign
      const notReadyCount = Object.values(this.room.players).reduce((acc, player) => (player.ready ? acc += 1 : acc), 0);
      return this.room.players.length / notReadyCount < 0.4;
    },
  },
  methods: {
    useCustomCode(value) {
      if (!value) {
        this.$store.dispatch('deleteCustomCode');
      }
      if (this.room.owner) {
        this.$socket.client.emit('useCustomCode', value);
      }
      this.showEditor = value;
    },
    run() {
      console.log('run');
      if (this.showEditor) {
        if (this.customCode.text.length < 30 || this.customCode.lines < 4) {
          this.error = 'Wymyśl coś dłuższego';
          return;
        }
        if (this.room.owner) {
          this.$socket.client.emit('customCodeData', this.customCode);
        }
      }
      this.prepareCodeInfo();
      if (this.room.owner) {
        this.$socket.client.emit('start', Date.now());
      }

      this.$router.push('run');
    },
    ready(value) {
      this.$socket.client.emit('playerStateChange', value);
    },
    prepareCodeInfo() {
      let fileIndex = -1;
      if (!this.customCode.text) {
        fileIndex = Math.floor(Math.random() * this.language.files.length);
      }
      this.$store.dispatch('generateCodeInfo', fileIndex);
      if (this.room.owner) {
        this.$socket.client.emit('fileIndex', fileIndex);
      }
    },
  },
  sockets: {
    start(ownerStartTime) {
      this.$store.commit('LATENCY', ownerStartTime);
      this.$router.push('run');
    },
  },
};
</script>

<style scoped>
aside {
  position: absolute;
  top: 5em;
  right: 5em;
}
</style>
