<template>
  <div>
    <div class="settings">
      <div v-if="$route.path === '/contribute'" class="">
        <label>Nazwa</label>
        <input v-model="name" type="text">
      </div>
      <label>Język
        <select id="language" v-model="languageIndex" name="language">
          <option disabled selected :value="null">Wybierz</option>
          <option v-for="(language, index) in languagesList" :key="index" :value="index">{{ language.name.replace('_', ' ') }}</option>
        </select>
      </label>
      <label>Rozmiar Tab'a: {{ tabWidth }}
        <input v-model="tabSize" type="checkbox">
      </label>
    </div>
    <p>{{ loadingMsg }}</p>
    <div class="code" :class="{ready: editorReady}">
      <codemirror
        v-model="code"
        :options="cmOptions"
        @ready="onCmReady"
        @input="useCustomCode"
      />
    </div>

    <div class="buttons">
      <button v-if="$route.path === '/contribute'" @click="sendCustomCode">
        Wyślij
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { codemirror } from 'vue-codemirror';
import axios from 'axios';
import { loadMode, loadTheme } from '@/cmLoader';

export default {
  name: 'UploadCode',
  components: {
    codemirror,
  },
  data() {
    return {
      code: '',
      languageIndex: null,
      currentLanguage: undefined,
      loadingMsg: '',
      confirmMsg: '',
      name: '',
      timeout: 0,
      editorReady: false,
      tabSize: false,
    };
  },
  computed: {
    ...mapGetters(['room', 'languagesList', 'language']),
    cmOptions() {
      return {
        tabSize: this.tabWidth,
        lineNumbers: true,
        mathBrackets: true,
        styleSelectedText: true,
        styleActiveLine: false,
        lineWrapping: true,
        theme: 'material-darker',
      };
    },
    tabWidth() {
      return this.tabSize ? '4' : '2';
    },
    numberOfLines() {
      return this.code.split(/\r\n|\r|\n/).length;
    },
  },
  watch: {
    async languageIndex() {
      this.loadingMsg = 'Ładowanie edytora...';
      try {
        this.currentLanguage = this.languagesList[this.languageIndex];
        console.log('WATCHER');
        await loadMode(this.cm, this.currentLanguage.mode);
        this.editorReady = true;
        this.loadingMsg = 'Wklej kod tutaj: ';
      } catch (e) {
        this.loadingMsg = 'Error';
        console.error(e);
      }
      this.$store.commit('SET_LANGUAGE', this.currentLanguage);
    },
  },
  created() {
    this.$store.dispatch('loadLanguagesList');
    loadTheme();
  },
  activated() {
    console.log(this.languageIndex);
    if (this.language.index) {
      this.languageIndex = this.language.index;
      console.log(this.languageIndex);
    }
    if (this.code) {
      this.useCustomCode();
    }
  },
  methods: {
    onCmReady(cm) {
      console.log('cm ready');
      this.cm = cm;
    },
    useCustomCode() {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.$store.commit('SET_CUSTOM_CODE', {
          text: this.code,
          tabSize: this.tabWidth,
          lines: this.numberOfLines,
        });
      }, 600);
    },
    sendCustomCode() {
      if (this.numberOfLines >= 5) {
        const data = {
          code: this.code,
          languageIndex: this.languageIndex,
          name: this.name ? this.name : Math.floor(Math.random() * 10000),
          ext: this.currentLanguage.ext,
          tabSize: this.tabWidth,
          numberOfLines: this.numberOfLines,
        };
        const url = `${window.location.origin}/upload`;
        axios.post(url, data)
          .then((res) => {
            console.log(res);
          })
          .catch((res) => {
            console.warn(res);
          });
      } else {
        console.log('CUSTOM CODE TOO SHORT');
        this.confirmMsg = 'Co taki krótki?';
      }
    },
  },
};
</script>

<style scoped>
.buttons {
  margin-top: 3em;
  z-index: 10;
}

.code {
  opacity: 0;
  transition: opacity .5s ease-in;
}

.code.ready {
  opacity: 1;
}
</style>
