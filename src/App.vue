<template>
  <div id="app">
    <template v-if="!tooSmall">
      <NavBar />
      <keep-alive :exclude="['Run', 'Results']">
        <router-view />
      </keep-alive>
      <PlayersList v-if="room.connected && $route.path !== '/run'" />
    </template>
    <SmallScreen v-else />
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue';
import PlayersList from '@/components/PlayersList.vue';
import SmallScreen from '@/views/SmallScreen.vue';
import { mapGetters } from 'vuex';

export default {
  components: {
    NavBar,
    SmallScreen,
    PlayersList,
  },
  computed: {
    ...mapGetters(['room']),
    tooSmall() {
      return this.windowWidth < 640 || this.windowHeight < 480;
    },
  },
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --accent1: #911cd5;
  --accent2: #6043fd;
}

body {
  font-family: 'Montserrat', sans-serif;
}

#app {
  margin: 0;
  position: relative;
  width: 100%;
  min-height: 100vh;
  color: white;
  padding: .5% 5%;
  letter-spacing: 2px;
  background: linear-gradient(0, #2b1e33, #2f2a44);
  /* background: #464646; */
}

a {
  color: grey;
}
input {
  margin: 4px;
}

button, input, select {
  outline: 0;
  border: 2px solid;
  border-radius: 5px;
  border-image: linear-gradient(30deg, var(--accent1), var(--accent2)) 1;
  padding: .5em 1em;
  color: white;
  background: none;
}

option {
  color: purple;
  background: none;
}

button:active {
  background: linear-gradient(30deg, var(--accent1), var(--accent2));
}

.CodeMirror, .CodeMirror-gutters {
  font-size: 1.5rem;
  height: auto !important;
  color: white;
  background: transparent !important;
}

.CodeMirror-Line {
  /* if no theme loaded */
  color: white !important;
}

.CodeMirror-linenumber {
  width: 1rem !important;
}

.cm-error:not(.mark) {
  background-color: transparent !important;
}

</style>
