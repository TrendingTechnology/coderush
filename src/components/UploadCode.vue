<template>
  <div class="wrapper">
    <p v-if="!language.index">
      Choose language
    </p>
    <p v-else-if="!editorReady">
      Loading code editor...
    </p>
    <div class="settings">
      <div v-if="$route.path === '/contribute'" class="">
        <label>Code functionality (or product name)</label>
        <input v-model="name" type="text">
      </div>
      <label>Tab size: {{ tabWidth }}
        <input v-model="tabSize" type="checkbox">
      </label>
    </div>
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
        Send
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
      confirmMsg: '',
      name: '',
      timeout: 0,
      editorReady: false,
      tabSize: false,
      cursorScrollMargin: 100,
      viewportMargin: Infinity,
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
    async language() {
      this.editorReady = false;
      await loadMode(this.cm, this.language.mode);
      this.editorReady = true;
    },
  },
  created() {
    loadTheme();
  },
  mounted() {
    console.log('Activated');
    console.log(this.language.index);
    if (this.language.index) {
      loadMode(this.cm, this.language.mode);
      this.editorReady = true;
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
        this.confirmMsg = 'Code needs to be a little bit longer.';
      }
    },
  },
};
</script>

<style lang="sass"  scoped>
.wrapper
  padding-top: 2em
  display: flex
  justify-content: space-between
  flex-direction: column
  position: relative


.buttons
  margin-top: 3em

.code
  opacity: 0
  flex-grow: 1
  margin-top: $gap
  transition: opacity .5s ease-in

.vue-codemirror
  position: relative
  height: 55vh
  display: flex
  flex-direction: column

.vue-codemirror >>> .CodeMirror
  // flex-grow: 1

.code.ready
  opacity: 1

</style>
