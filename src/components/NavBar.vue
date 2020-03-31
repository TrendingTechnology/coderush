<template>
  <nav>
    <button @click="mainPage">
      CodeRush
    </button>
    <div v-if="!room.connected" class="createRoom">
      <input
        v-model="roomName"
        min-length="3"
        type="text"
        placeholder="Nazwa"
      >
      <button :disabled="roomName === ''" @click="checkRoom('create')">
        Utwórz pokój
      </button>
      <button :disabled="roomName === ''" @click="checkRoom('join')">
        Dołącz
      </button>
    </div>
    <div v-else>
      <h2>{{ room.name }}</h2>
      <button @click="disconnect">
        Rozłącz
      </button>
    </div>
    <div v-if="askForName && action === 'create'" class="popUp">
      <input v-model="playerName" type="text" placeholder="Nick">
      <p>
        Jesteś właścicielem pokoju {{ roomName }}.
        Wpisz swój nick, który będzie widoczny dla innych graczy.
      </p>
      <button :disabled="!playerName" @click="createRoom">
        Utwórz
      </button>
      <p v-if="room.connected">
        Aby inni mogli dołączyć, udostępnij im ten link:
        <input type="text" disabled :value="`${origin}/join/${roomName}`">
      </p>
      <button @click="askForName = false">
        Zamknij
      </button>
    </div>
    <div v-if="askForName && action === 'join'" class="popUp">
      <input v-model="playerName" type="text" placeholder="Nick">
      <button :disabled="playerName === ''" @click="checkPlayerName">
        Dołącz
      </button>
    </div>

    <router-link v-if="this.$route.path !== '/about'" to="/about">
      O co tu chodzi?
    </router-link>
    <router-link v-if="this.$route.path !== '/contribute'" to="/contribute">
      Wspomóż
    </router-link>

    <label for="userLanguage">Angielski
      <input id="userLanguage" type="checkbox">
    </label>
    <a href="https://clone-it.github.io">Clone-It</a>
  </nav>
</template>

<script>

import { mapGetters } from 'vuex';


export default {
  name: 'NavBar',
  data() {
    return {
      roomName: '',
      playerName: '',
      showRoomCreator: false,
      askForName: false,
      origin: window.location.origin,
    };
  },
  computed: {
    ...mapGetters(['room', 'options', 'language']),
  },
  sockets: {
    connect() {
      console.warn('connected');
    },
    room_created() {
      this.$store.commit('SET_ROOM_PROPERTY', ['connected', true]);
      this.$store.commit('SET_ROOM_PROPERTY', ['name', this.roomName]);
      this.$store.commit('SET_ROOM_PROPERTY', ['myName', this.playerName]);
      this.$store.commit('SET_ROOM_PROPERTY', ['ownerName', this.playerName]);
      this.$store.commit('SET_ROOM_PROPERTY', ['owner', true]);
      this.$store.commit('SET_ROOM_PROPERTY', ['players', {
        [this.playerName]: {
          connected: true,
          ready: false,
          owner: true,
        },
      }]);
    },
    room_exist() {
      if (this.action === 'create') {
        console.error('ROOM ALREADY EXIST');
        this.disconnect();
      } else {
        this.askForName = true;
      }
    },
    room_dont_exist() {
      if (this.action === 'create') {
        this.askForName = true;
      } else {
        console.error('ROOM DONT EXIST');
        this.disconnect();
      }
    },
    player_name_avaible() {
      this.$store.commit('SET_ROOM_PROPERTY', ['myName', this.playerName]);
      this.joinRoom();
    },
    player_name_taken() {
      console.error('PLAYER NAME TAKEN');
    },
  },
  mounted() {
    if (this.$route.params.roomName) {
      this.roomName = this.$route.params.roomName;
      this.checkRoom('join');
      this.$router.push('/');
    }
  },
  methods: {
    mainPage() {
      if (this.room.owner) {
        this.$socket.client.emit('reset');
      }
      this.$router.push('/');
    },
    checkRoom(action) {
      this.action = action;
      this.$socket.client.io.opts.query = { roomName: this.roomName };
      this.$socket.client.open();
    },
    createRoom() {
      this.$socket.client.emit('createRoom', {
        ownerName: this.playerName,
        roomName: this.roomName,
        options: {
          codeLength: this.options.codeLength,
          autoIndent: this.options.autoIndent,
        },
        languageIndex: this.language.index,
      });
    },
    checkPlayerName() {
      this.$socket.client.emit('checkPlayerName', this.playerName);
    },
    joinRoom() {
      this.$socket.client.emit('joinRoom');
      this.askForName = false;
    },
    disconnect() {
      this.$socket.client.close();
      this.$store.commit('SET_ROOM_PROPERTY', ['connected', false]);
      this.$store.commit('SET_ROOM_PROPERTY', ['name', '']);
      this.$store.commit('SET_ROOM_PROPERTY', ['owner', false]);
      this.roomName = '';
    },
  },
};
</script>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
}

.popUp {
  position: absolute;
  z-index: 3;
  transform: translateY(50%);
  padding: 4em;
  margin: 3em;
  background: rgba(30, 30, 30, 0.9);
}

</style>
