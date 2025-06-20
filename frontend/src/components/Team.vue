<template>
  <div :class="['team-block', { dark: isDarkMode }]">
    <h2>Наша команда</h2>
    <ul>
      <li>Test - Test</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'Team',
  props: {
    isDarkMode: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style scoped>
.team-block {
  border-radius: 10px;
  padding: 16px 14px 14px 14px;
  background: #fff;
  color: #222;
  transition: background 0.3s, color 0.3s;
}
.team-block.dark {
  background: #34495e;
  color: #ecf0f1;
}
.team-block h2,
.team-block li {
  color: inherit;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 4px 0;
  font-size: 15px;
}
</style>