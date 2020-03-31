<template>
  <div class="container">
    <div>
      <h2>Ta strona jest mobile-friendly...<br><br>...Ale ty nie masz szans na takim ekranie</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SmallScreen',
};
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

div {
  text-align: center;
}
</style
