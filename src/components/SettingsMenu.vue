<template>
  <main @input.capture="updateOption">
    <h2>How do you want to play?</h2>
    <p class="select-text">
      Game mode
    </p>
    <div ref="modesList" class="modes list">
      <label
        v-for="(mode, index) in modesList"
        :key="mode[0]"
        :class="{'selected': index+1 === selectedMode, 'small': customCode.showEditor}"
        class="mode"
      >
        <div class="container">
          <span>{{ mode[0] }}</span>
          <span class="modeDesc">{{ mode[1] }}</span>
        </div>

        <input
          v-model="selectedMode"
          name="mode"
          :value="index+1"
          type="radio"
        >
      </label>
    </div>
    <p class="select-text">
      Source code theme
    </p>
    <div ref="themesList" class="themes list">
      <label
        v-for="(theme) in themesList"
        :key="theme[0]"
        :class="{'selected': theme[0] === selectedTheme}"
        class="theme"
      >
        <span>{{ theme[1] }}</span>
        <input
          v-model="selectedTheme"
          :value="theme[0]"
          type="radio"
        >
      </label>
    </div>
    <div class="toggles">
      <label>
        <span>Highlight next character</span>
        <input v-model="underScore" type="checkbox">
        <div class="slider" />
      </label>
      <label>
        <span>Auto-indent new line</span>
        <input
          v-model="autoIndent"
          :disabled="block"
          name="autoIndent"
          type="checkbox"
        >
        <div class="slider" />
      </label>
      <label>
        <span>Only short levels</span>
        <input
          v-model="codeLength"
          :disabled="block"
          name="codeLength"
          type="checkbox"
        >
        <div class="slider" />
      </label>
      <label>
        <span>Number the lines</span>
        <input v-model="lineNumbers" type="checkbox">
        <div class="slider" />
      </label>
    </div>
  </main>
</template>

<script>
import { mapGetters } from 'vuex';
import { createHelpers } from 'vuex-map-fields';

const { mapFields } = createHelpers({
  getterType: 'getOption',
  mutationType: 'UPDATE_OPTION',
});
export default {
  name: 'SettingsMenu',
  data() {
    return {
      themesList: [
        ['material-darker', 'Material Dark'],
        ['one-dark', 'Atom One Dark'],
        ['Base2Tone-Suburb-dark', 'Base2Tone Suburb Dark'],
        ['', 'Plain white'],
      ],
      modesList: [
        ['Normal', 'Write down provided source code as quickly as you can.'],
        ['Hardcore', 'Just don\'t make any mistakes.'],
        ['CodeRush', 'See how much code you are able to write in 100 seconds'],
      ],
    };
  },
  computed: {
    ...mapGetters(['room', 'customCode']),
    ...mapFields(['selectedTheme', 'selectedMode', 'underScore', 'codeLength', 'lineNumbers', 'autoIndent']),
    block() {
      return this.room.connected && !this.room.owner;
    },
  },
  activated() {
    this.$store.commit('ADD_TRACKED_CONTAINER', this.$refs.modesList);
    this.$store.commit('ADD_TRACKED_CONTAINER', this.$refs.themesList);
  },
  deactivated() {
    this.$store.commit('REMOVE_TRACKED_CONTAINER', this.$refs.modesList.className);
    this.$store.commit('REMOVE_TRACKED_CONTAINER', this.$refs.themesList.className);
  },
  methods: {
    updateOption(ev) {
      if (this.room.owner && ev.target.name) {
        this.$socket.client.emit('optionChange', { name: ev.target.name, value: ev.target.checked });
      }
    },
  },
};
</script>

<style lang="sass" scoped>
main
  display: flex
  flex-direction: column
  justify-content: flex-start
  height: 100%

// .fold
//   overflow: hidden
//   .themes, .toggles
//     display: none

h2
  margin: $grid-gap 0 $grid-gap $grid-gap

.select-text
  text-align: right
  color: $grey
  margin: 1em 2 * $grid-gap $grid-gap 0

$purple-gradient-colors: $purple, mix($light-purple, $grid-color, 80)

.list
  padding: $grid-gap
  display: grid
  grid-gap: $grid-gap
  background: transparent radial-gradient(250px at var(--mouse-x) var(--mouse-y), rgba($white, 0.2) 10%, transparent 90%) no-repeat 0 0
  text-align: center
  margin-bottom: $gap

  label
    position: relative
    cursor: pointer
    opacity: 0.95
    box-shadow: 0px 0px 2px 2px rgba(black, .1)
    display: flex
    flex-direction: column
    justify-content: space-around
    align-items: center
    min-height: 40px
    background: linear-gradient(to right, $purple-gradient-colors 49.8%, $grid-color 49.8%)
    background-size: 200%
    background-position: 99.8% 0 // 1px glitch
    transition: background .2s ease-in

    .container
      margin-top: 2em
      width: 12vw
      display: flex
      flex-direction: column
      align-items: center
      justify-content: space-around

    span
      margin: 2em 0.5em


    .modeDesc
      margin: 0
      color: #bbb
      font-size: 0.9em
      width: 80%
      text-align: center
      display: block


  .selected
    transition: background .4s ease-in-out
    background-position: left

.small
  .container
    margin-top: 0 !important

.modes
  flex-shrink: 2
  flex-grow: 2
  max-height: 250px
  grid-template-columns: repeat(3, minmax(max-content, 1fr))

.themes
  grid-template-columns: repeat(2, 1fr)
  grid-template-rows: 50px 50px

.toggles
  width: 100%
  position: relative
  padding: 0 3 * $grid-gap 0 2 * $grid-gap
  overflow: hidden // omg zabij sie

  label
    display: flex
    justify-content: space-between
    width: 100%
    position: relative
    cursor: pointer
    margin-top: $gap

  $width: 70px
  $trans-duration: .15s
  .slider
    position: relative
    width: $width
    height: 20px
    background: linear-gradient(to right, $purple, $light-purple 50%, $grey 50% 100%)
    background-size: 200%
    background-position: right
    @include shadow(0.5)
    transition: background $trans-duration ease-in-out, transform 0.07s ease-in-out

  .slider:after
    content: ''
    z-index: 3
    left: -0.5rem
    top: calc((1.6rem - 20px) / -2)
    width: 1rem
    height: 1.6rem
    position: absolute
    background-color: $white
    @include shadow()
    transition: transform $trans-duration ease-in-out

  input:active + .slider:after
    transform: scale(0.75)

  input:checked + .slider
    background-position: left

  input:checked + .slider:after
    transform: translateX($width)

@media (max-height: 700px)
  .toggles
    label
      margin-top: 1em
  .list
    margin-bottom: 1em

</style>
