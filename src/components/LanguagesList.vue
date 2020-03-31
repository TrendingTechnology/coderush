<template>
  <div class="choose-language">
    <h2>Wybierz język</h2>
    <div class="controls">
      <input
        v-model="searchText"
        type="text"
        placeholder="Filtruj"
      >
      <button :disabled="room.connected && !room.owner" @click="selectRandom">
        Wylosuj
      </button>
    </div>
    <div class="languages-list-container">
      <transition>
        <div v-if="!languagesList" class="languages-list-loading">
          Loading
        </div>
      </transition>
      <div class="languages-list">
        <label
          v-for="filteredLanguage in filteredList"
          :id="filteredLanguage.index"
          :key="filteredLanguage.name"
          :class="{'highlight':language.index == filteredLanguage.index}"
        >
          <input
            v-model="language"
            type="radio"
            name="language-radio"
            :disabled="room.connected && !room.owner"
            :index="filteredLanguage.index"
            :value="languagesList[filteredLanguage.index]"
            @input="setRoomLanguage"
          >
          <span class="language-name">{{ filteredLanguage.name.replace('_', ' ') }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { createHelpers } from 'vuex-map-fields';

// The getter and mutation types we're providing
// here, must be the same as the function names we've
// used in the store.
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
    ...mapGetters(['languagesList', 'room']),
    ...mapFields(['language']),
    filteredList() {
      return this.languagesList.filter((language) => language.name.toLowerCase().includes(this.searchText.toLowerCase()));
    },
    // selectedLanguageIndex: {
    //   get() {
    //     if (this.language.index) {
    //       console.warn('updating selected language');
    //       return this.language.index;
    //     }
    //     return null;
    //   },
    //   set(index) {
    //     this.$store.commit('SET_LANGUAGE', { ...this.languagesList[index] });
    //     if (this.room.owner) {
    //       this.$socket.client.emit('language_change', index);
    //     }
    //   },
    // },
  },
  created() {
    this.$store.dispatch('loadLanguagesList');
  },
  // activated() {
  //   if (this.language.index) {
  //     console.warn('updating selected language');
  //     this.selected = this.language.index;
  //   }
  // },
  methods: {
    selectRandom() {
      const index = Math.floor(Math.random() * this.filteredList.length);
      const newLanguageIndex = this.languagesList[index].index;
      if (newLanguageIndex === this.index && this.filteredList.length > 1) {
        this.selectRandom();
      } else {
        this.index = newLanguageIndex;
      }
    },
    setRoomLanguage(ev) {
      if (this.room.owner) {
        this.$nextTick(() => this.$socket.client.emit('languageChange', ev.target.getAttribute('index')));
      }
    },
  },
};
</script>

<style scoped>
.languages-list {
  padding: .5em 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .5em;
}

input[type="radio"] {
  display: none;
}

label {
  border: 2px solid;
  border-radius: 5px;
  border-image: linear-gradient(30deg, var(--accent1), var(--accent2)) 1;
  padding: 1em;
  text-align: center;
}

label:hover {
  background: linear-gradient(30deg, rgba(145, 28, 213, .4), rgba(96, 67, 253, .4));
}

label.highlight {
  background: linear-gradient(30deg, var(--accent1), var(--accent2));
}

</style>
