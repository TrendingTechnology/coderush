<template>
  <div>
    <div class="settings" @input.capture="updateOption">
      <h2>Jak chcesz grać?</h2>
      <div class="basic">
        <h2>Ustawienia</h2>
        <label for="select-theme">Motyw</label>
        <select
          id="select-theme"
          v-model="theme"
        >
          <option value="material-darker">
            Material Dark
          </option>
          <option value="one-dark">
            Atom One Dark
          </option>
          <option value="">
            None (hardcore)
          </option>
        </select>
        <label>Podkreśl następny znak
          <input v-model="underScore" type="checkbox">
        </label>
        <label>Tylko krótkie
          <input
            v-model="codeLength"
            :disabled="block"
            name="codeLength"
            type="checkbox"
          >
        </label>
      </div>
      <div class="advanced">
        <!-- 0 / 1 slider button -->
        <label>Numeruj linie
          <input v-model="lineNumbers" type="checkbox">
        </label>
        <label>Automatyczne wcięcie nowej lini
          <input
            v-model="autoIndent"
            :disabled="block"
            name="autoIndent"
            type="checkbox"
          >
        </label>
      </div>
    </div>
  </div>
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
  computed: {
    ...mapGetters(['room']),
    ...mapFields(['theme', 'underScore', 'codeLength', 'lineNumbers', 'autoIndent']),
    block() {
      return this.room.connected && !this.room.owner;
    },
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

<style scoped>


</style>
