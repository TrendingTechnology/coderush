<template>
  <nav>
    <button class="title" @click="mainPage">
      CodeRush
    </button>

    <div class="links">
      <button class="language" @click="$store.commit('USER_LANGUAGE')">
        <fa v-if="userLanguage" :icon="['fas', 'globe-americas']" />
        <fa v-else :icon="['fas', 'globe-europe']" />
        <span class="btn-text">
          {{ userLanguage ? 'English Here' : 'Polska wersja (not yet)' }}
        </span>
      </button>
      <router-link v-if="this.$route.path !== '/about'" to="/about">
        <fa :icon="['fas', 'info']" />
        <span class="btn-text">
          O co tu chodzi?
        </span>
      </router-link>
      <router-link v-if="this.$route.path !== '/contribute'" to="/contribute">
        <fa :icon="['fas', 'file-code']" />
        <span class="btn-text">
          Wyślij swój kod
        </span>
      </router-link>
    </div>
    <div class="room">
      <div v-if="!room.connected" class="roomNotConnected">
        <div class="roomName">
          <fa :icon="['fas', 'server']" />
          <input
            v-model="roomName"
            min-length="3"
            type="text"
            placeholder="Nazwa"
          >
        </div>

        <button :disabled="roomName === ''" @click="checkRoom('create')">
          <span class="btn-text">
            Utwórz pokój (beta)
          </span>
        </button>

        <button :disabled="roomName === ''" @click="checkRoom('join')">
          <span class="btn-text">
            Dołącz
          </span>
        </button>

        <div v-if="askForPlayerName" class="playerName">
          <input v-model="playerName" type="text" placeholder="Nick">          <button v-if="action === 'create'" :disabled="!playerName" @click="createRoom">
            <span class="btn-text">
              Utwórz
            </span>
          </button>
          <button v-else :disabled="playerName === ''" @click="checkPlayerName">
            <span class="btn-text">
              Dołącz
            </span>
          </button>
          <div v-if="room.owner" class="popUp">
            <p>
              Jesteś właścicielem pokoju {{ roomName }}.
              Aby inni mogli dołączyć, udostępnij im ten link:
            </p>
            <fa :icon="['fas', 'copy']" />
            <input type="text" disabled :value="`${origin}/join/${roomName}`">
          </div>
          <button @click="askForPlayerName = false">
            <span class="btn-text">
              Zamknij
            </span>
          </button>
        </div>
      </div>
      <div v-else class="roomConnected">
        <h2>{{ room.name }}</h2>
        <button @click="disconnect">
          <fa :icon="['fas', 'sign-out-alt']" />
          <span class="btn-text">
            Rozłącz
          </span>
        </button>
        <PlayersList v-if="room.connected && $route.path !== '/run'" />
      </div>
    </div>
  </nav>
</template>

<script>
import PlayersList from '@/components/PlayersList.vue';
import { mapGetters } from 'vuex';


export default {
  name: 'NavBar',
  components: {
    PlayersList,
  },
  data() {
    return {
      roomName: '',
      playerName: '',
      showRoomCreator: false,
      askForPlayerName: false,
      origin: window.location.origin,
    };
  },
  computed: {
    ...mapGetters(['room', 'options', 'language', 'userLanguage']),
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
        this.askForPlayerName = true;
      }
    },
    room_dont_exist() {
      if (this.action === 'create') {
        this.askForPlayerName = true;
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
      this.askForPlayerName = false;
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

<style lang="sass" scoped>
nav
  height: 100%
  padding: 6% 3%
  display: flex
  flex-direction: column
  justify-content: flex-start
  background: linear-gradient(340deg, $navy-grey, $navy-grey 20%, $washed-purple)
  // border-radius: 3px
  font-size: 1rem
  position: relative

nav:after
  content: ''
  position: absolute
  pointer-events: none
  @include pos0
  transition: backdrop-filter $nav-trans-dur $nav-trans-timing 0s

.thin:after
  // backdrop-filter: hue-rotate(20deg)
  transition-delay: 1s
  backdrop-filter: hue-rotate(10deg) brightness(80%)

.thin
  .btn-text, .title, .room
    transition-delay: 0s
    opacity: 0
  svg
    transition-delay: $nav-trans-dur
    transform: translateX($nav-move + 1)

.btn-text, .title, .room
  transition: opacity $nav-trans-dur $nav-trans-timing $nav-trans-dur

.title
  font-size: 2rem
  margin-left: .5rem

.links
  margin: 10% 0%
  padding: 0% 4%
  $line: 1px solid $white
  border-top: $line
  border-bottom: $line
  min-height: 40%
  display: flex
  flex-direction: column
  justify-content: space-around

  .btn-text
    margin-left: 1em

svg
  transition: transform $nav-trans-dur $nav-trans-timing 0s

.room
  flex-grow: 1
  padding: 0% 4%

.roomNotConnected
  display: flex
  flex-direction: column
  justify-content: space-between

  .roomName
    display: flex
    justify-content: space-between

    input
      margin-left: 1em

input::placeholder
    color: $grey

button
  margin: 4% 0
  display: block

button:disabled
  cursor: not-allowed


</style>
