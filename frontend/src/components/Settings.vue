<template>
  <transition name="fade-slide">
    <div :class="['settings', { dark: isDarkMode }]" key="settings">
      <div class="theme-settings">
        <h3>Тема</h3>
        <button
          @click="toggleTheme"
          :class="['theme-toggle', isDarkMode ? 'dark' : 'light']"
        >
          <span class="theme-icon" v-if="isDarkMode">🌙</span>
          <span class="theme-icon" v-else>☀️</span>
          {{ isDarkMode ? 'Светлая тема' : 'Тёмная тема' }}
        </button>
      </div>
      <div class="other-settings">
        <h3>Порядок и видимость графиков</h3>
        <ul class="chart-order-list">
          <li
            v-for="(chart, idx) in chartOrder"
            :key="chart"
            :class="{
              dragging: draggingIdx === idx,
              'drag-over': dragOverIdx === idx && draggingIdx !== null
            }"
            draggable="true"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop="onDrop(idx)"
            @dragend="onDragEnd"
          >
            <span class="drag-handle" title="Перетащите для изменения порядка">☰</span>
            <input
              type="checkbox"
              :id="'chart-enabled-' + chart"
              :checked="chartEnabled[chart]"
              @change="setChartEnabled(chart, $event.target.checked)"
            />
            <label :for="'chart-enabled-' + chart">{{ chartNames[chart] }}</label>
          </li>
        </ul>
        <div class="hint">☰ — перетащите для изменения порядка</div>
      </div>
      <div class="other-settings">
        <h3>Цвета проектов</h3>
        <ul class="project-colors-list">
          <li v-for="project in projectList" :key="project" class="project-color-item">
            <span class="project-name">{{ project }}</span>
            <input
              type="color"
              :value="projectColors[project] || defaultProjectColor"
              @input="onProjectColorChange(project, $event.target.value)"
              class="color-picker"
              :style="{ background: projectColors[project] || defaultProjectColor }"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="projectAlpha[project] ?? defaultProjectAlpha"
              @input="onProjectAlphaChange(project, $event.target.value)"
              class="alpha-slider"
              style="width: 70px; margin-left: 8px;"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              :value="projectAlpha[project] ?? defaultProjectAlpha"
              @input="onProjectAlphaChange(project, $event.target.value)"
              class="alpha-input"
              style="width: 48px; margin-left: 6px;"
            />
            <span
              class="color-preview"
              :style="{ background: getPreviewColor(project) }"
            ></span>
          </li>
        </ul>
      </div>
      <div class="other-settings">
        <h3>Прочие настройки</h3>
        <p>Здесь можно добавить дополнительные параметры.</p>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Settings',
  props: {
    isDarkMode: { type: Boolean, required: true },
    toggleTheme: { type: Function, required: true },
    chartOrder: { type: Array, required: true },
    setChartOrder: { type: Function, required: true },
    chartEnabled: { type: Object, required: true },
    setChartEnabled: { type: Function, required: true },
    // Новые пропсы для цветов проектов
    projectColors: { type: Object, required: true },
    setProjectColor: { type: Function, required: true },
    projectList: { type: Array, required: true },
    projectAlpha: { type: Object, required: true },
    setProjectAlpha: { type: Function, required: true },
  },
  data() {
    return {
      chartNames: {
        issues: 'Поступление задач',
        closed: 'Закрытые задачи',
        inProgress: 'В работе инженера сопровождения',
      },
      draggingIdx: null,
      dragOverIdx: null,
      defaultProjectColor: '#d3d3d3',
      defaultProjectAlpha: 0.6,
    };
  },
  methods: {
    onDragStart(idx) {
      this.draggingIdx = idx;
    },
    onDragOver(idx) {
      this.dragOverIdx = idx;
    },
    onDrop(idx) {
      if (this.draggingIdx === null || this.draggingIdx === idx) {
        this.draggingIdx = null;
        this.dragOverIdx = null;
        return;
      }
      const newOrder = [...this.chartOrder];
      const [moved] = newOrder.splice(this.draggingIdx, 1);
      newOrder.splice(idx, 0, moved);
      this.setChartOrder(newOrder);
      this.draggingIdx = null;
      this.dragOverIdx = null;
    },
    onDragEnd() {
      this.draggingIdx = null;
      this.dragOverIdx = null;
    },
    onProjectColorChange(project, color) {
      this.setProjectColor(project, color);
    },
    onProjectAlphaChange(project, alpha) {
      this.setProjectAlpha(project, parseFloat(alpha));
    },
    getPreviewColor(project) {
      // Превью цвета с прозрачностью
      const color = this.projectColors[project] || this.defaultProjectColor;
      const alpha = this.projectAlpha[project] ?? this.defaultProjectAlpha;
      const hex = color.replace('#', '');
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r},${g},${b},${alpha})`;
    },
  },
};
</script>

<style scoped>
.settings {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 40px 40px 32px 32px;
  background: #fff;
  border-radius: 14px;
  box-shadow: none;
  color: #333;
  transition: background 0.4s, color 0.4s;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  animation: settings-pop-in 0.5s cubic-bezier(.68,-0.55,.27,1.55);
}

.settings.dark {
  background: #34495e;
  color: #ecf0f1;
  box-shadow: none;
}

.theme-settings h3,
.other-settings h3 {
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.theme-toggle {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
  transition: background 0.3s, color 0.3s, transform 0.15s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle.light {
  background: #34495e;
  color: #fff;
}

.theme-toggle.light:hover {
  background: #2c3e50;
  transform: translateY(-2px) scale(1.04);
}

.theme-toggle.dark {
  background: #ecf0f1;
  color: #34495e;
}

.theme-toggle.dark:hover {
  background: #bdc3c7;
  transform: translateY(-2px) scale(1.04);
}

.theme-icon {
  font-size: 1.3em;
  vertical-align: middle;
}

.chart-order-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  width: 100%;
  min-width: 220px;
}

.chart-order-list li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f5f7fa;
  transition: background 0.3s, box-shadow 0.3s, border 0.2s;
  box-shadow: 0 1px 4px rgba(44, 62, 80, 0.04);
  width: 100%;
  cursor: grab;
  border: 2px solid transparent;
  position: relative;
}

.settings.dark .chart-order-list li {
  background: #2c3e50;
  color: #fff;
}

.settings.dark .chart-order-list label {
  color: #fff;
}

.settings.dark .chart-order-list input[type="checkbox"] {
  accent-color: #ecf0f1;
  background: #223047;
}

.chart-order-list li.dragging {
  opacity: 0.7;
  background: #dbe6f3;
  border: 2px dashed #3498db;
  z-index: 2;
}
.settings.dark .chart-order-list li.dragging {
  background: #223047;
  border: 2px dashed #6bb9f0;
}

.li-dark {
  background: #2c3e50;
  color: #ecf0f1;
}

.chart-order-list input[type="checkbox"] {
  margin-right: 8px;
  accent-color: #34495e;
  width: 18px;
  height: 18px;
  transition: accent-color 0.3s;
}

.settings.dark .chart-order-list input[type="checkbox"] {
  accent-color: #ecf0f1;
  background: #223047;
}

.drag-handle {
  cursor: grab;
  font-size: 1.2em;
  margin-right: 8px;
  color: #bbb;
  user-select: none;
  transition: color 0.2s;
}
.chart-order-list li:hover .drag-handle {
  color: #3498db;
}
.settings.dark .chart-order-list li:hover .drag-handle {
  color: #6bb9f0;
}

.hint {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
  margin-left: 2px;
}
.settings.dark .hint {
  color: #bfc9d1;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(.68,-0.55,.27,1.55);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}

@keyframes settings-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(40px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 600px) {
  .settings {
    padding: 16px 6px 12px 6px;
    max-width: 100%;
    border-radius: 0;
  }
  .chart-order-list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 8px 4px;
  }
}

.chart-order-list li.drag-over {
  border: 2px dashed #3498db;
  background: #eaf6fb;
}
.settings.dark .chart-order-list li.drag-over {
  border: 2px dashed #6bb9f0;
  background: #223047;
}

.project-colors-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.project-color-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 6px 12px;
  margin-bottom: 4px;
  box-shadow: 0 1px 4px rgba(44, 62, 80, 0.04);
  transition: background 0.3s, color 0.3s;
}
.settings.dark .project-color-item {
  background: #2c3e50;
  color: #ecf0f1;
  box-shadow: 0 1px 4px rgba(44, 62, 80, 0.10);
}
.settings.dark .project-color-item:hover {
  background: #2c3a4e;
}
.project-name {
  min-width: 120px;
  font-size: 15px;
}
.color-picker {
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  box-shadow: 0 1px 4px rgba(44, 62, 80, 0.04);
  transition: box-shadow 0.2s;
}
.color-picker:hover {
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
}
.settings.dark .color-picker {
  box-shadow: 0 1px 4px rgba(44, 62, 80, 0.10);
  background: #223047;
}
.color-preview {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-left: 4px;
  background: #fff;
  transition: border 0.2s, background 0.2s;
}
.settings.dark .color-preview {
  border: 1px solid #6bb9f0;
  background: #223047;
}
.alpha-slider {
  accent-color: #3498db;
  background: transparent;
  height: 4px;
  border-radius: 2px;
}
.settings.dark .alpha-slider {
  accent-color: #6bb9f0;
  background: #223047;
}
.alpha-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 13px;
  height: 28px;
  box-sizing: border-box;
  text-align: right;
  background: #fff;
  color: #333;
  transition: background 0.2s, color 0.2s, border 0.2s;
}
.settings.dark .alpha-input {
  background: #223047;
  color: #ecf0f1;
  border: 1px solid #6bb9f0;
}
</style>