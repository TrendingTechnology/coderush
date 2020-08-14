<template>
  <div class="container">
    <div class="countdown">
      <h2> {{ countdownText }} </h2>
    </div>
    <button class="reset" :disabled="room.connected" @click="$emit('reset')">
      Reset
    </button>
    <button :disabled="room.connected" @click="completed()">
      Finish now
    </button>
    <div class="code" :class="{ready: editorsReady, completed: isCompleted, heatMap: heatMapReady}">
      <codemirror
        id="original"
        v-model="originalCode"
        :options="cmOptions"
        @ready="onOriginalCmReady"
      />

      <codemirror
        id="editor"
        ref="editor"
        v-model="editorCode"
        :options="cmOptions"
        @ready="onEditorCmReady"
        @changes="onCmCodeChange"
        @beforeChange="onBeforeChange"
        @blur="onUnFocus"
        @scroll="onScroll"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { codemirror } from 'vue-codemirror';

import { loadMode, loadTheme } from '@/cmLoader';

import 'codemirror/lib/codemirror.css';
// import 'codemirror/addon/edit/closebrackets';
// import 'codemirror/addon/selection/active-line';

// eslint-disable-next-line no-unused-vars
import stats from '../stats';

export default {
  components: {
    codemirror,
  },
  data() {
    return {
      countdown: 3,
      countdownText: 3,
      originalCm: {},
      editorCm: {},
      originalCode: '',
      editorCode: '',
      started: false,
      isCompleted: false,
      editorsReady: false,
      heatMapReady: false,
      toFix: 0,
      markers: [],
      currentLineNr: 0,
      currentChange: {},
      stats: {
        history: [],
        cheat: false,
        firstCharTime: 0,
      },
    };
  },
  computed: {
    ...mapGetters(['language', 'options', 'codeInfo', 'customCode', 'room']),
    cmOptions() {
      return {
        undoDepth: 0,
        tabSize: this.tabWidth,
        styleActiveLine: false,
        lineNumbers: this.options.lineNumbers,
        styleSelectedText: false,
        lineWrapping: true,
        matchBrackets: false,
        dragDrop: false,
        autoCloseBrackets: false,
        cursorBlinkRate: 320,
        smartIndent: false,
        lint: false,
        spellcheck: false,
        autocorrect: false,
        showCursorWhenSelecting: true,
        theme: this.options.selectedTheme,
        cursorScrollMargin: 100,
        // scrollbarStyle: null,
        extraKeys: {
          Backspace: () => {
            console.log(`backspace: ${this.toFix}`);
            if (this.toFix > 0) {
              this.editorCm.execCommand('delCharBefore');
              this.toFix -= 1;
            }
          },
          Tab: () => this.editorCm.execCommand('insertSoftTab'),
          Enter: () => {
            if (this.editorCm.getLine(this.currentLineNr).slice(0, -1) === this.originalCm.getLine(this.currentLineNr)) {
              console.log('goLineDown');
              this.editorCm.replaceSelection('\n');
              this.currentLineNr += 1;
              if (!this.originalCm.getLine(this.currentLineNr)) {
                console.warn('mark');
                this.hiddenUnderscore = this.editorCm.markText({ line: this.currentLineNr, ch: 0 }, { line: this.currentLineNr, ch: 1 }, { className: 'underScoreHidden' });
              } else {
                if (this.hiddenUnderscore) {
                  this.hiddenUnderscore.clear();
                }
                if (this.options.autoIndent) {
                  const indentText = this.originalCm.getLine(this.currentLineNr).match('[^\\S]*')[0];
                  this.editorCm.replaceSelection(indentText);
                }
              }

              if (!this.stats.oneThirdTime && this.currentLineNr === Math.floor(this.codeInfo.lines / 3)) {
                this.stats.oneThirdCharsCount = this.editorCode.length - 1;
                this.stats.oneThirdTime = this.timeElapsed();
              } else if (!this.stats.lastThirdStartTime && this.currentLineNr === Math.floor(this.codeInfo.lines / 3 * 2)) {
                this.stats.lastThirdCharsCount = this.originalCode.length - this.editorCode.length - 1;
                this.stats.lastThirdStartTime = this.timeElapsed();
              }
            }
          },
          Insert: () => {
            if (this.currentLineNr < this.codeInfo.lines) {
              this.stats.cheat = true;
              const text = `${this.originalCm.getLine(this.currentLineNr)}\n`;
              this.editorCm.replaceRange(text, { line: this.currentLineNr, ch: 0 });
              this.currentLineNr += 1;
            }
          },
          // disable keys
          Up: () => {},
          Down: () => {},
          Left: () => {},
          Right: () => {},
          Delete: () => {},
          Home: () => { this.completed(); },
          End: () => {
            this.editorCode = this.originalCode;
            this.completed(false);
          },
          PageUp: () => {},
          PageDown: () => {},
          'Ctrl-A': () => {},
        },
      };
    },
    tabWidth() {
      return this.customCode.tabSize ? this.customCode.tabSize : this.codeInfo.tabSize;
    },
  },
  mounted() {
    console.log('mounted');
  },
  methods: {
    onOriginalCmReady(cm) {
      cm.setOption('readOnly', true);
      this.originalCm = cm;
      console.log('originalCmReady ', Date.now());
      console.time('ready');
    },
    onEditorCmReady(cm) {
      this.editorCm = cm;
      console.log('editorCmReady ', Date.now());
      this.init();
    },
    onUnFocus(_, ev) {
      console.log('BLUR');
      if (!this.isCompleted) {
        if (ev.relatedTarget !== null && ev.relatedTarget.tagName !== 'INPUT' && ev.relatedTarget.tagName !== 'BUTTON' && !this.isCompleted) {
          this.editorCm.focus();
          ev.preventDefault();
        } else if (ev.relatedTarget === null) {
          this.editorCm.focus();
          ev.preventDefault();
        } else {
          this.started = false;
          this.countdown = 'Przerwałeś';
        }
      }
    },
    onScroll() {
      console.log('SCROLL');
      this.originalCm.scrollIntoView(this.editorCm.getCursor(), 100);
    },
    registerKeyStrokes(ev) {
      this.currentKeyEv = {
        key: ev.key,
        keyCode: ev.keyCode,
        shift: ev.shiftKey,
        alt: ev.altKey,
        ctrl: ev.ctrlKey,
        meta: ev.metaKey,
      };
    },
    onBeforeChange(_, change) {
      console.log(change);
      console.log(`change origin: ${change.origin}`);
      const o = change.origin;
      if (o === 'undo' || o === 'cut' || o === 'paste') {
        console.log('UNALLOWED EVENT');
        change.cancel();
        if (o === 'cut') {
          // codemirror lib edgecase
          this.editorCm.execCommand('goLineUp');
          this.originalCm.execCommand('goLineUp');
          this.editorCm.execCommand('goLineEnd');
        }
      } else if (change.origin !== 'setValue') {
        const from = {
          line: change.from.line,
          ch: change.from.ch,
        };

        const text = change.text[0];

        const to = {
          line: from.line,
          ch: from.ch + text.length,
        };

        const expectedText = this.originalCm.getRange(from, to);

        this.currentChange = {
          ...this.currentChange,
          time: this.timeElapsed(),
          position: {
            from,
            to,
          },
        };

        console.log(`change '${text}'`);
        if (text !== '' && this.started) {
          if (this.editorCm.getLine(this.currentLineNr).length - 1 >= this.originalCm.getLine(this.currentLineNr).length) {
            console.log(`cancel change end of line ${this.originalCm.getLine(this.currentLineNr).length}`);
            this.currentChange.type = 'lineEnd';

            change.cancel();
          } else if (text !== expectedText) {
            console.warn(`'${text}' dont match '${expectedText}'`);

            this.toFix += text.length;

            this.currentTextMark = [
              from,
              to,
              { className: 'mark' },
            ];

            this.currentChange = {
              ...this.currentChange,
              type: 'mistake',
              fixQueuePos: this.toFix,
              expectedText,
            };
          } else if (this.toFix > 0) {
            // force user to correct previous mistakes
            console.log('fix mistakes first');
            this.currentChange.type = 'leftUnfixed';
            change.cancel();
          } else {
            this.currentChange.type = 'correct';
          }
        } else {
          this.currentChange.type = 'backspace';
        }
      }
    },
    async onCmCodeChange(_, [change]) {
      if (this.toFix > 0 && this.currentTextMark.length === 3) {
        // console.warn(`NEW MARKER: line: ${this.currentTextMark[0].line}, from: ${this.currentTextMark[0].ch}, to: ${this.currentTextMark[1].ch}`);
        this.markers.unshift(this.editorCm.markText(...this.currentTextMark));
        this.currentTextMark = [];
      }
      if (!this.stats.firstCharTime) {
        this.stats.firstCharTime = Date.now();
      }

      if (this.currentChange.type === 'correct' || this.currentChange.type === 'mistake') {
        this.currentChange = {
          ...this.currentChange,
          ...this.currentKeyEv,
          text: change.text[0],
        };
      }

      this.stats.history.push(this.currentChange);
      this.currentChange = {};

      if (this.toFix === 0 && this.editorCode.length - 1 === this.originalCode.length) {
        this.completed();
      }
    },
    async getCode() {
      if (!this.codeInfo.name) {
        console.log('USING CUSTOM CODE');
        return this.customCode.text;
      }
      console.warn(process.env.VUE_APP_URL);
      const url = `${process.env.VUE_APP_URL}/code/${this.language.name.replace('#', '_sharp')}/${this.codeInfo.name}.${this.language.ext}`;
      console.warn(url);
      try {
        const resp = await axios.get(url);
        return resp.data;
      } catch (err) {
        if (err.request) {
          throw new Error('No internet');
        } else {
          throw err;
        }
      }
    },
    start(interval) {
      clearInterval(interval);
      this.countdownText = 'START';
      this.started = true;
      this.editorCm.focus();
      console.log('START');
      this.stats.startTime = Date.now();
      this.$refs.editor.$el.addEventListener('keydown', this.registerKeyStrokes);
    },
    init() {
      const initTime = Date.now();
      const interval = setInterval(() => {
        this.countdown -= 0.5;
        this.countdownText = Math.ceil(this.countdown);
        if (this.countdown === 2) {
          if (!this.editorsReady || !this.originalCode) {
            this.countdown += 0.5;
            console.warn(Date.now() - initTime);
            if ((Date.now() - initTime) / 1000 < 5) {
              this.countdownText = 'Just a moment...';
            } else {
              console.warn('Long loading time');
              this.countdownText = 'It probably crash but You can wait a few seconds just in case';
            }
          }
        } else if (this.countdown === 0) {
          this.editorCm.replaceSelection(this.options.underScore ? '_' : ' ');
          if (this.options.underScore) {
            this.editorCm.markText({ line: this.currentLineNr, ch: 0 }, { line: this.currentLineNr, ch: 1 }, { className: 'underScore' });
          }
          this.editorCm.execCommand('goColumnLeft');
          this.start(interval);
        }
      }, 450);


      console.log('loadMode ', Date.now());

      Promise.all([this.getCode(), loadTheme(this.options.selectedTheme), loadMode(this.originalCm, this.language.mode)])
        .then((resp) => {
          console.log(resp);
          [this.originalCode] = resp;
          this.editorCm.setOption('mode', this.language.mode);
          this.editorsReady = true;
          console.timeEnd('ready');
        })
        .catch((err) => {
          clearInterval(interval);
          console.log(err);
          if (err.message === 'No internet') {
            this.countdownText = 'Connection with server not available.';
          } else {
            this.countdownText = 'Please try again later';
          }
        });
    },
    completed(currentStats = true) {
      if (this.$route.path === '/results') {
        return;
      }
      console.warn('COMPLETED');
      this.editorCm.setOption('readOnly', true);
      this.$socket.client.emit('completed', Date.now());
      this.$refs.editor.$el.removeEventListener('mousedown', this.registerKeyStrokes);

      this.editorCm.setOption('cursorBlinkRate', -1);

      if (currentStats) {
        this.stats = {
          ...this.stats,
          timeFromFirstInput: this.timeElapsed(),
          codeLength: this.editorCode.length,
          file: this.codeInfo,
        };
      } else {
        this.stats = stats;
      }


      console.warn(`TOTAL TIME: ${this.stats.timeFromFirstInput}`);
      console.log(JSON.parse(JSON.stringify(this.stats)));

      this.$router.replace('/results');

      this.$emit('completed', this.stats);
      console.log('completed class', this.timeElapsed());
      this.isCompleted = true;
      setTimeout(this.generateHeatMap, 60);
    },
    generateHeatMap() {
      const arr = this.stats.history;
      for (let i = 1; i < arr.length; i += 1) {
        let from;
        let to;
        if (arr[i].type === 'mistake') {
          from = arr[i].position.from;
          for (let j = i + 1; j < arr.length; j += 1) {
            if (arr[j].type !== 'mistake') {
              to = arr[j - 1].position.to;
              i = j;
              break;
            }
          }
          this.originalCm.markText(from, to, { className: 'mark' });
        }
      }
      console.log('heatmap ready', this.timeElapsed());
      this.heatMapReady = true;
    },
    timeElapsed() {
      return Date.now() - this.stats.firstCharTime;
    },
  },
};
</script>

<style lang="sass" scoped>
.container
  position: relative


.info h4
  color: lightgray


.code
  opacity: 0
  transition: opacity .5s ease-in
  position: relative


.ready
  opacity: 1

.code
  margin-top: 10px
  // pointer-events: none !important
  position: relative


.code ::v-deep .CodeMirror-line
  line-break: anywhere !important


.code ::v-deep .CodeMirror
  // height: 70vh !important
  height: 500px !important


.completed ::v-deep .CodeMirror
  height: 100% !important


.completed
    overflow-y: auto
    max-height: 70vh

#editor
  position: absolute
  width: 90%
  top: 0


#editor ::v-deep .CodeMirror-linenumber
  opacity: 0


#original ::v-deep .CodeMirror-line
  z-index: 0
  opacity: 0.7
  will-change: filter
  filter: saturate(80%)
  transition: opacity 2s, filter 2s


.heatMap #original
  opacity: 1


.heatMap #original
  // filter: blur(9px)


.heatMap #editor ::v-deep .CodeMirror-linenumber
  opacity: 1


.completed #original ::v-deep .CodeMirror-code span
  color: transparent !important


.completed ::v-deep .mark
  opacity: 0


#editor ::v-deep .CodeMirror,#editor ::v-deep .CodeMirror-gutters
  background: transparent


.code ::v-deep .mark
  background-color: rgba(255, 255, 255, .3)


.heatMap ::v-deep .mark
  // background-color: rgba(11, 192, 238, 0.8) !important
  background-color: var(--accent1)
  outline: 0.2em solid var(--accent1)
  // background-color: rgba(255, 255, 255, 0.0)
  // outline-offset: 1px
  // outline: 8px solid rgba(255, 255, 255, 1)
  opacity: 1
  transition: opacity .7s ease-out


.heatMap #original ::v-deep .CodeMirror-linenumber
  opacity: 0


.heatMap #original ::v-deep .CodeMirror-line
  opacity: 1


#editor ::v-deep .underScoreHidden
  opacity: 0


#editor ::v-deep .underScore
  display: inline-block
  font-size: 0.9em
  transform: translateY(4px) !important
  filter: saturate(70%)


.reset
  margin-right: 1em
  margin-top: .5em
</style>
