<template>
  <div>
    <div class="search">
      <input
        v-model="searchText"
        type="text"
        placeholder="Search"
        class="searchInput"
        maxlength="12"
        autofocus
        @keydown.enter.stop="selectFirstFromSearch"
      >
      <div>
        <span v-show="searchText && filteredList.length === languagesList.length" class="nothing-found-text">(nothing found)</span>
        <button v-show="searchText" class="clear-btn" @click="clear">
          Clear
        </button>
      </div>
    </div>
    <div ref="languagesList" class="languages list" :class="{'showStats': !($route.path !== '/' || (room.connected && !room.owner))} ">
      <button
        :disabled="room.connected && !room.owner"
        class="language random"
        :class="{'selected': language.index === null}"
        @click="selectRandom"
      >
        <span class="language-name">
          Random
        </span>
      </button>
      <label
        v-for="(filteredLanguage, index) in filteredList"
        :key="filteredLanguage.name === 'Loading...' ? index : filteredLanguage.name"
        class="language"
        :class="{'selected':language.index === filteredLanguage.index}"
        :data-index="index"
      >
        <input
          v-model="language"
          type="radio"
          class="language-radio"
          :disabled="room.connected && !room.owner"
          :value="languagesList[filteredLanguage.index]"
          :data-index="index"
          @input="setRoomLanguage"
        >
        <span class="language-name" :class="{'greyed-out': options.codeLength && !filteredLanguage.files.some((code) => code.lines <= 17 )}">{{ filteredLanguage.name.replace('_', ' ') }}</span>
        <span class="stat"><span>{{ filteredLanguage.total || 0 }}</span><fa class="icon" :icon="['fas', 'users']" /></span>
      </label>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { createHelpers } from 'vuex-map-fields';

const { mapFields } = createHelpers({
  getterType: 'getLanguage',
  mutationType: 'UPDATE_LANGUAGE',
});
export default {
  data() {
    return {
      searchText: '',
    };
  },
  computed: {
    ...mapGetters(['languagesList', 'room', 'options']),
    ...mapFields(['language']),
    filteredList() {
      if (this.languagesList.length) {
        const search = this.searchText.toLowerCase();
        const filtered = this.languagesList
          .filter((language) => language.name.toLowerCase().includes(search))
          .sort((a, b) => (b.name.toLowerCase().startsWith(search) ? 1 : -1));
        return filtered.length > 0 ? filtered : this.languagesList;
      }
      return [...Array(29)].map(() => ({ name: 'Loading...' }));
    },
  },
  watch: {
    'room.owner': {
      deep: true,
      handler(current) {
        if (current && this.language.index) {
          this.$socket.client.emit('languageChange', this.language.index);
        }
      },
    },
    'language.index': {
      deep: true,
      handler(current) {
        if (this.room.connected && !this.room.owner && current) {
          this.$refs.languagesList.querySelector(`label[data-index="${current}"]`).scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          });
        }
      },
    },
  },
  activated() {
    this.$store.commit('ADD_TRACKED_CONTAINER', this.$refs.languagesList);
  },
  deactivated() {
    this.$store.commit('REMOVE_TRACKED_CONTAINER', this.$refs.languagesList.className);
  },
  methods: {
    clear() {
      this.searchText = '';
    },
    selectRandom() {
      const index = Math.floor(Math.random() * this.filteredList.length);
      if (this.filteredList[index].index === this.language.index && this.filteredList.length > 1) {
        this.selectRandom();
      } else {
        if (this.options.codeLength && !this.filteredList[index].files.some((code) => code.lines <= 17)) {
          this.selectRandom();
        }
        this.language = this.filteredList[index];
        if (this.room.owner) {
          this.$socket.client.emit('languageChange', index);
        }
        this.$refs.languagesList.querySelector(`label[data-index="${index}"]`).scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
    },
    selectFirstFromSearch() {
      if (this.filteredList.length !== 0 && this.filteredList.length < this.languagesList.length) {
        [this.language] = this.filteredList;
      } else {
        this.clear();
      }
    },
    setRoomLanguage(ev) {
      if (this.room.owner) {
        this.$nextTick(() => this.$socket.client.emit('languageChange', ev.target.getAttribute('data-index')));
      }
    },
  },
};
</script>

<style lang="sass" scoped>
.search
  display: flex
  justify-content: space-between
  position: relative
  padding: $thin-gap
  margin: 0 $thin-gap $thin-gap $thin-gap
  border-bottom: $thin-gap solid $navy-grey
  height: 40px


  &:focus-within
    border-image: linear-gradient(to right, $light-blue, $navy-grey 90%) 1

  input
    max-width: 40%

  input::placeholder, .nothing-found-text
    color: $grey

  div
    overflow: hidden

  .clear-btn
    background: $navy-grey
    box-shadow: 0px 0px 2px 2px rgba(black, .1)
    padding: $thin-gap 4 * $thin-gap
    margin-left: 1em
    height: 100%

.list
  @include cursor-shadow()
  display: grid
  flex-grow: 1
  position: relative
  padding: $thin-gap
  overflow-y: auto
  text-align: center
  grid-gap: $thin-gap
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))


  &::-webkit-scrollbar
    width: $gap / 2
  &::-webkit-scrollbar-thumb
    background: linear-gradient(to top, $blue-gradient-colors)
  &::-webkit-scrollbar-track
    background-color: $navy-grey
    margin-top: $thin-gap
    // border-top: 20px solid white
  &::-webkit-scrollbar-corner
    background-color: $navy-grey

.language-radio
  display: none

.showStats .language:hover:not(.random)
  & > .language-name
    transform: translateX(-25%)
  & > .stat
    opacity: 1

.language
  display: flex
  align-items: center
  justify-content: space-around
  position: relative
  background: $navy-grey
  background: linear-gradient(to right, $blue-gradient-colors 49.8%, $navy-grey 49.8%)
  background-position: 99.8% 0 // 1px glitch
  background-size: 200%
  box-shadow: 0px 0px 2px 2px rgba(black, .1)
  cursor: pointer
  opacity: 0.95
  min-height: 40px
  transition: background .1s ease-in

  &:hover
    opacity: 0.85

  .language-name
    transition: transform .2s ease-in-out
    &.greyed-out
      color: $grey

  .stat
    display: flex
    align-items: center
    justify-content: space-around
    position: absolute
    right: 1em
    font-size: 0.9em
    color: #ddd
    opacity: 0
    height: 100%
    transition: opacity .1s ease-out .1s

    .icon
      margin-left: 1em

  &.selected
    background-position: left
    transition: background 0.3s ease-in-out
</style>
