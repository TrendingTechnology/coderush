<template>
  <div class="wrapper">
    <div class="warning">
      <span v-if="!language.index">
        Choose language <fa class="arrow" :icon="['fas', 'play']" />
      </span>
    </div>
    <div class="settings">
      <div v-if="$route.path === '/contribute'" class="">
        <label>Code functionality (or product name)</label>
        <input v-model="name" type="text">
      </div>
      <label>Tab size: {{ tabWidth }}
        <input v-model="tabSize" type="checkbox">
      </label>
      <p v-if="language.index && !editorReady ">
        Loading...
      </p>
    </div>
    <codemirror
      ref="codemirror"
      v-model="code"
      class="codemirror"
      :class="{ready: editorReady}"
      :options="cmOptions"
      @ready="onCmReady"
      @input="useCustomCode"
    />

    <div v-if="$route.path === '/contribute'" class="buttons">
      <button @click="sendCustomCode">
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
        viewportMargin: Infinity,
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
      this.fixHeight();
      window.addEventListener('resize', this.fixHeight);
    },
    fixHeight() {
      if (this.timeout) window.clearTimeout(this.timeout);
      this.timeout = window.setTimeout(() => {
        this.rafActive = false;
        const scroll = this.$refs.codemirror.$el.getElementsByClassName('CodeMirror-scroll')[0];
        scroll.style.maxHeight = `${this.$refs.codemirror.$el.offsetHeight}px`;
      }, 100);
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
.warning
  position: absolute
  width: 100%
  text-align: right

  .arrow
    margin: 0 1em

.codemirror
  flex-grow: 1
  opacity: 0
  margin-top: $gap
  transition: opacity .5s ease-in
  position: relative

.ready
  opacity: 1

.buttons
  margin-top: 3em

</style>
