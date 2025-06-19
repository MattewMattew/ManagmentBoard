<template>
  <div :class="['settings', { dark: isDarkMode }]">
    <h2 :class="{ dark: isDarkMode }">Настройки</h2>
    <div class="theme-settings">
      <h3>Тема</h3>
      <button @click="toggleTheme" :class="['theme-toggle', isDarkMode ? 'dark' : 'light']">
        {{ isDarkMode ? 'Светлая тема' : 'Тёмная тема' }}
      </button>
    </div>
    <div class="other-settings">
      <h3>Прочие настройки</h3>
      <p>Здесь можно добавить дополнительные параметры.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  props: {
    isDarkMode: {
      type: Boolean,
      required: true,
    },
    toggleTheme: {
      type: Function,
      required: true,
    },
  },
};
</script>

<style>
.settings {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: #333;
  transition: background 0.3s, color 0.3s;
}

.settings.dark {
  background: #34495e;
  color: #ecf0f1;
}

.settings h2 {
  font-size: 22px;
  margin-bottom: 16px;
  color: #333; /* Цвет для светлой темы */
  transition: color 0.3s;
}

.settings h2.dark {
  color: #ecf0f1; /* Цвет для темной темы */
}

.theme-settings h3,
.other-settings h3 {
  font-size: 18px;
  margin-bottom: 12px;
}

.theme-toggle {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s, transform 0.2s, box-shadow 0.2s;
}

.theme-toggle.light {
  background: #34495e;
  color: #fff;
}

.theme-toggle.light:hover {
  background: #2c3e50;
}

.theme-toggle.dark {
  background: #ecf0f1;
  color: #34495e;
}

.theme-toggle.dark:hover {
  background: #bdc3c7;
}
</style>