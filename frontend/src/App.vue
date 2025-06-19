<template>
  <div :class="['dashboard', { dark: isDarkMode }]">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 :class="{ dark: isDarkMode }">Меню</h2>
        <button 
          @click="toggleTheme" 
          :class="['theme-toggle', isDarkMode ? 'dark' : 'light']">
          {{ isDarkMode ? 'Светлая тема' : 'Тёмная тема' }}
        </button>
      </div>
      <ul>
        <li><a href="#" @click.prevent="switchTab('charts')">Графики</a></li>
        <li><a href="#" @click.prevent="switchTab('reports')">Отчёты</a></li>
        <li><a href="#" @click.prevent="switchTab('settings')">Настройки</a></li>
      </ul>
    </aside>
    <main class="main-content">
      <header class="dashboard-header">
        <h1 v-if="currentTab === 'charts'">График поступления задач</h1>
        <h1 v-if="currentTab === 'reports'">Отчёты</h1>
        <h1 v-if="currentTab === 'settings'">Настройки</h1>
      </header>
      <div v-if="isLoading" class="loading">
        <p>Загрузка данных...</p>
      </div>
      <!-- Графики отображаются только на вкладке "Графики" -->
      <section v-if="currentTab === 'charts'" class="block">
        <div class="chart-container">
          <canvas ref="issuesChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas ref="closedChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas ref="inProgressChart"></canvas>
        </div>
      </section>
      <!-- Вкладка "Настройки" -->
      <section v-if="currentTab === 'settings'" class="block">
        <Settings :isDarkMode="isDarkMode" :toggleTheme="toggleTheme" />
      </section>
      <!-- Модальное окно -->
      <div v-if="selectedWeek" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <button class="modal-close" @click="closeModal">&times;</button>
          <h2>Детальная информация о неделе: {{ selectedWeek }}</h2>
          <ul>
            <li v-for="(count, project) in weeklyDetails[selectedWeek]" :key="project">
              {{ project }}: {{ count }} задач
            </li>
          </ul>
        </div>
      </div>
      <div
        v-if="overlayVisible"
        :class="['loader-overlay', { hidden: !isUpdating }]"
        @animationend="handleAnimationEnd"
      >
        <div class="loader"></div>
      </div>
    </main>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import Settings from './components/Settings.vue'; // Добавляем компонент "Настройки"
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement
);

export default defineComponent({
  name: 'App',
  components: {
    Settings, // Регистрируем компонент "Настройки"
  },
  setup() {
    const currentTab = ref('charts'); // Добавляем состояние для текущей вкладки
    const isLoading = ref(true);
    const issuesChart = ref(null);
    const closedChart = ref(null);
    const inProgressChart = ref(null);
    const chartInstance = ref(null);
    const closedChartInstance = ref(null);
    const inProgressChartInstance = ref(null);
    const selectedWeek = ref(null);
    const weeklyDetails = ref({});
    const isDarkMode = ref(false);
    const isUpdating = ref(false); // Новое состояние для лоадера
    const overlayVisible = ref(false); // Новое состояние для управления видимостью оверлея

    const getTextColor = () => (isDarkMode.value ? '#ecf0f1' : '#333');

    const drawSumAboveBar = (chart) => {
      const { ctx, data, scales } = chart;
      ctx.save();
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';

      // Используем функцию для получения цвета текста в зависимости от темы
      ctx.fillStyle = getTextColor();

      data.labels.forEach((label, i) => {
        let sum = 0;
        let topY = null;

        // Ищем самый верхний видимый сегмент столбца
        for (let d = data.datasets.length - 1; d >= 0; d--) {
          const ds = data.datasets[d];
          const meta = chart.getDatasetMeta(d);

          // Исключаем кривую закрытых тикетов
          if (meta && meta.data[i] && !meta.hidden && ds.label !== 'Закрытые тикеты') {
            sum += ds.data[i] || 0;
            if (topY === null) {
              topY = meta.data[i].y;
            }
          }
        }

        if (topY !== null) {
          ctx.fillText(sum, scales.x.getPixelForValue(i), topY - 8);
        }
      });

      ctx.restore();
    };

    const fetchData = async () => {
      try {
        isUpdating.value = true; // Включаем лоадер
        overlayVisible.value = true; // Делаем оверлей видимым

        const response = await axios.get('http://localhost:5000/issues');
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Некорректный формат данных');
        }
        const issues = response.data;

        // Группировка по неделям (создано)
        const weeklyData = {};
        // Группировка по неделям (закрыто)
        const closedWeeklyData = {};
        // Группировка по неделям (в работе)
        const inProgressWeeklyData = {};
        // Данные для кривой закрытых тикетов
        const closedCurveData = {};

        issues.forEach((issue) => {
          const createdOn = issue.data?.created_on;
          const closedOn = issue.data?.closed_on;
          const projectName = issue.data?.project?.name;
          const statusName = issue.data?.status?.name;

          // График поступления задач
          if (createdOn && projectName) {
            const week = moment(createdOn).startOf('isoWeek').format('YYYY-MM-DD');
            if (!weeklyData[week]) {
              weeklyData[week] = {};
            }
            weeklyData[week][projectName] = (weeklyData[week][projectName] || 0) + 1;
          }

          // График закрытых задач
          if (closedOn && projectName) {
            const closedWeek = moment(closedOn).startOf('isoWeek').format('YYYY-MM-DD');
            if (!closedWeeklyData[closedWeek]) {
              closedWeeklyData[closedWeek] = {};
            }
            closedWeeklyData[closedWeek][projectName] = (closedWeeklyData[closedWeek][projectName] || 0) + 1;

            // Данные для кривой закрытых тикетов
            closedCurveData[closedWeek] = (closedCurveData[closedWeek] || 0) + 1;
          }

          // График "В работе инженера сопровождения"
          if (
            statusName === 'В работе инженера сопровождения' &&
            projectName &&
            createdOn
          ) {
            const week = moment(createdOn).startOf('isoWeek').format('YYYY-MM-DD');
            if (!inProgressWeeklyData[week]) {
              inProgressWeeklyData[week] = {};
            }
            inProgressWeeklyData[week][projectName] = (inProgressWeeklyData[week][projectName] || 0) + 1;
          }
        });

        weeklyDetails.value = weeklyData;

        // Для всех графиков — общий список недель и проектов
        let allWeeks = Array.from(
          new Set([
            ...Object.keys(weeklyData),
            ...Object.keys(closedWeeklyData),
            ...Object.keys(inProgressWeeklyData),
            ...Object.keys(closedCurveData),
          ])
        ).sort((a, b) => new Date(a) - new Date(b));

        // Оставляем только последние 30 недель
        if (allWeeks.length > 30) {
          allWeeks = allWeeks.slice(-30);
        }
        const labels = allWeeks;

        const projectNames = new Set();
        [weeklyData, closedWeeklyData, inProgressWeeklyData].forEach((data) => {
          Object.values(data).forEach((weekData) => {
            Object.keys(weekData).forEach((projectName) => {
              projectNames.add(projectName);
            });
          });
        });

        // Дatasets для поступления задач
        const datasets = Array.from(projectNames).map((projectName) => {
          const data = labels.map((week) => weeklyData[week]?.[projectName] || 0);
          return {
            label: projectName,
            data,
            backgroundColor: getProjectColor(projectName),
          };
        });

        // Дatasets для закрытых задач
        const closedDatasets = Array.from(projectNames).map((projectName) => {
          const data = labels.map((week) => closedWeeklyData[week]?.[projectName] || 0);
          return {
            label: projectName,
            data,
            backgroundColor: getProjectColor(projectName),
          };
        });

        // Дatasets для "В работе инженера сопровождения" (столбцы)
        const inProgressDatasets = Array.from(projectNames).map((projectName) => {
          const data = labels.map((week) => inProgressWeeklyData[week]?.[projectName] || 0);
          return {
            label: projectName,
            data,
            backgroundColor: getProjectColor(projectName),
            stack: 'inProgress',
          };
        });

        // Данные для кривой закрытых тикетов
        const closedCurveDataset = {
          label: 'Закрытые тикеты',
          data: labels.map((week) => closedCurveData[week] || 0),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          type: 'line',
          fill: false,
          tension: 0.4,
        };

        // Функция для вывода суммы над столбцом
        const drawSumAboveBar = (chart) => {
          const { ctx, data, scales } = chart;
          ctx.save();
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';

          // Используем функцию для получения цвета текста в зависимости от темы
          ctx.fillStyle = getTextColor();

          data.labels.forEach((label, i) => {
            let sum = 0;
            let topY = null;

            // Ищем самый верхний видимый сегмент столбца
            for (let d = data.datasets.length - 1; d >= 0; d--) {
              const ds = data.datasets[d];
              const meta = chart.getDatasetMeta(d);

              // Исключаем кривую закрытых тикетов по её индексу или другим характеристикам
              if (meta && meta.data[i] && !meta.hidden && ds.label !== 'Закрытые тикеты') {
                sum += ds.data[i] || 0;
                if (topY === null) {
                  topY = meta.data[i].y;
                }
              }
            }

            if (topY !== null) {
              ctx.fillText(sum, scales.x.getPixelForValue(i), topY - 8);
            }
          });

          ctx.restore();
        };

        // Первый график (поступление + кривая закрытых тикетов)
        const ctx = issuesChart.value?.getContext('2d');
        if (ctx) {
          if (chartInstance.value) chartInstance.value.destroy();
          chartInstance.value = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [...datasets, closedCurveDataset],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Поступление задач по неделям и проектам',
                  font: {
                    weight: 'bold',
                  },
                  color: getTextColor(),
                },
                legend: {
                  position: 'top',
                  labels: {
                    color: getTextColor(),
                  },
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleFont: {
                    size: 14,
                    weight: 'bold',
                    color: getTextColor(),
                  },
                  bodyFont: {
                    size: 12,
                    color: getTextColor(),
                  },
                },
              },
              scales: {
                x: {
                  stacked: true,
                  title: {
                    display: false,
                  },
                  ticks: {
                    color: getTextColor(),
                  },
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  grace: '20%',
                  title: {
                    display: false,
                  },
                  ticks: {
                    color: getTextColor(),
                  },
                },
              },
              animation: {
                duration: 1000,
                easing: 'easeOutBounce',
              },
              onClick: (event, elements) => {
                if (elements.length > 0) {
                  const index = elements[0].index;
                  const week = labels[index];
                  selectedWeek.value = week;
                }
              },
            },
            plugins: [{
              afterDatasetsDraw: drawSumAboveBar
            }]
          });
        }

        // Второй график (закрытые)
        const closedCtx = closedChart.value?.getContext('2d');
        if (closedCtx) {
          if (closedChartInstance.value) closedChartInstance.value.destroy();
          closedChartInstance.value = new Chart(closedCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: closedDatasets,
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Закрытые задачи по неделям и проектам',
                  font: {
                    weight: 'bold',
                  },
                  color: getTextColor(),
                },
                legend: {
                  position: 'top',
                  labels: {
                    color: getTextColor(),
                  },
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleFont: {
                    size: 14,
                    weight: 'bold',
                    color: getTextColor(),
                  },
                  bodyFont: {
                    size: 12,
                    color: getTextColor(),
                  },
                },
              },
              scales: {
                x: {
                  stacked: true,
                  title: {
                    display: false,
                  },
                  ticks: {
                    color: getTextColor(),
                  },
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  grace: '20%',
                  title: {
                    display: false,
                  },
                  ticks: {
                    color: getTextColor(),
                  },
                },
              },
              animation: {
                duration: 1000,
                easing: 'easeOutBounce',
              },
            },
            plugins: [{
              afterDatasetsDraw: drawSumAboveBar
            }]
          });
        }

        // Третий график ("В работе инженера сопровождения")
        const inProgressCtx = inProgressChart.value?.getContext('2d');
        if (inProgressCtx) {
          if (inProgressChartInstance.value) inProgressChartInstance.value.destroy();
          inProgressChartInstance.value = new Chart(inProgressCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: inProgressDatasets,
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Динамика тикетов "В работе инженера сопровождения" по неделям',
                  font: {
                    weight: 'bold',
                  },
                  color: getTextColor(),
                },
                legend: {
                  position: 'top',
                  labels: {
                    color: getTextColor(),
                  },
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleFont: {
                    size: 14,
                    weight: 'bold',
                    color: getTextColor(),
                  },
                  bodyFont: {
                    size: 12,
                    color: getTextColor(),
                  },
                },
              },
              scales: {
                x: {
                  stacked: true,
                  title: {
                    display: false,
                  },
                  ticks: {
                    color: getTextColor(),
                  },
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  grace: '20%',
                  title: {
                    display: false,
                  },
                  ticks: {
                    color: getTextColor(),
                  },
                },
              },
              animation: {
                duration: 1000,
                easing: 'easeOutBounce',
              },
            },
            plugins: [
              {
                afterDatasetsDraw: drawSumAboveBar, // Применяем функцию для отображения суммы
              },
            ],
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error.message);
        alert('Не удалось загрузить данные. Попробуйте позже.');
      } finally {
        isLoading.value = false;
        isUpdating.value = false;
      }
    };

    const closeModal = () => {
      selectedWeek.value = null;
    };

    const getProjectColor = (projectName) => {
      const projectColors = {
        'МСП ЯНАО-89': 'rgba(144, 238, 144, 0.6)',
        'МФЦ Томск-70': 'rgba(173, 216, 230, 0.6)',
        'МФЦ ЯНАО-89': 'rgba(255, 182, 193, 0.6)',
        'МФЦ Приморье-25': 'rgba(255, 239, 213, 0.6)',
        'МФЦ ЧАО-87': 'rgba(221, 160, 221, 0.6)',
        'МФЦ Камчатка-41': 'rgba(240, 230, 140, 0.6)',
        'МФЦ Тула-71': 'rgba(250, 218, 221, 0.6)',
        'Внутренние задачи': 'rgba(200, 200, 200, 0.6)',
        'СПЛП ЯНАО-89': 'rgba(204, 229, 255, 0.6)',
      };
      return projectColors[projectName] || 'rgba(211, 211, 211, 0.6)';
    };

    const toggleTheme = async () => {
      isUpdating.value = true; // Включаем лоадер
      overlayVisible.value = true; // Делаем оверлей видимым
      isDarkMode.value = !isDarkMode.value;

      try {
        await fetchData(); // Перезагрузка графиков
      } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
      } finally {
        isUpdating.value = false; // Выключаем лоадер
        overlayVisible.value = false; // Скрываем оверлей
      }
    };

    const handleAnimationEnd = () => {
      if (!isUpdating.value) {
        overlayVisible.value = false; // Убираем оверлей из DOM
      }
    };

    const destroyChart = (chartInstance) => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    };
 
    const switchTab = async (tab) => {
      isUpdating.value = true; // Включаем лоадер
      overlayVisible.value = true; // Делаем оверлей видимым
      currentTab.value = tab;

      if (tab === 'charts') {
        try {
          await fetchData(); // Повторный вызов fetchData при переключении на вкладку "Графики"
        } catch (error) {
          console.error('Ошибка при загрузке данных:', error);
        } finally {
          isUpdating.value = false; // Выключаем лоадер
          overlayVisible.value = false; // Скрываем оверлей
        }
      } else {
        isUpdating.value = false; // Выключаем лоадер
        overlayVisible.value = false; // Скрываем оверлей
      }
    };

    onMounted(() => {
      fetchData();
    });

    onUnmounted(() => {
      destroyChart(chartInstance.value);
      destroyChart(closedChartInstance.value);
      destroyChart(inProgressChartInstance.value);
    });

    return {
      currentTab, // Возвращаем состояние текущей вкладки
      isLoading,
      issuesChart,
      closedChart,
      inProgressChart,
      selectedWeek,
      weeklyDetails,
      closeModal,
      isDarkMode,
      toggleTheme,
      isUpdating,
      overlayVisible, // Возвращаем новое состояние
      handleAnimationEnd,
      switchTab,
    };
  },
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa, #e6f0ff);
}

.dashboard {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard.dark {
  background: #2c3e50;
}

.sidebar {
  width: 220px;
  background: #e3e9f7;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-radius: 0 12px 12px 0;
  position: sticky;      
  top: 0;                
  height: 100vh;         
  z-index: 10;
  overflow-y: auto;
}

.sidebar.dark {
  background: #34495e;
}

.sidebar h2 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #2c3e50;
  font-weight: bold;
}

.sidebar h2.dark {
  color: #ecf0f1; /* Цвет для тёмной темы */
}

.sidebar ul {
  list-style: none;
  padding: 0;
  width: 100%;
}

.sidebar li {
  margin-bottom: 10px;
}

.sidebar a {
  color: #2c3e50;
  text-decoration: none;
  font-size: 15px;
  padding: 6px 10px;
  border-radius: 6px;
  display: block;
  transition: background 0.2s;
}

.sidebar a:hover {
  background: #dbe6f3;
}

.sidebar.dark a {
  color: #ecf0f1;
}

.sidebar.dark a:hover {
  background: #3b5998;
}

.theme-toggle {
  margin-top: auto;
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
  background: #34495e;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.theme-toggle.dark {
  background: #ecf0f1;
  color: #34495e;
}

.theme-toggle.dark:hover {
  background: #ecf0f1;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.theme-toggle:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dashboard.dark .theme-toggle {
  --button-bg: #34495e;
  --button-hover-bg: #2c3e50;
  --button-text: #ecf0f1;
}

.dashboard.light .theme-toggle {
  --button-bg: #007bff;
  --button-hover-bg: #0056b3;
  --button-text: #fff;
}

.main-content {
  flex: 1;
  padding: 24px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 18px;
}

.dashboard-header {
  margin-bottom: 18px;
  text-align: left;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.04);
}

.block {
  border-radius: 10px;
  padding: 16px 14px 14px 14px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 0;
  gap: 8px;
}

.block h2 {
  font-size: 16px;
  color: #3a3a3a;
  margin-bottom: 10px;
  text-align: left;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 420px; 
  border-radius: 6px;
  padding: 8px;
  margin: 0;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loading {
  font-size: 15px;
  color: #666;
  text-align: center;
  margin-top: 10px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(44, 62, 80, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: #fff;
  box-shadow: 0 4px 32px rgba(0,0,0,0.12);
  padding: 28px 32px;
  border-radius: 14px;
  width: 50%;
  min-height: 50%;
  position: relative;
  animation: slideIn 0.2s;
}

.modal-content h2 {
  color: #222;
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 18px;
}

.modal-close {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin: 4px 0;
  font-size: 15px;
  color: #6c757d;
}

.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out; /* Анимация появления */
}

.loader-overlay.hidden {
  animation: fadeOut 0.3s ease-in; /* Анимация исчезновения */
  pointer-events: none; /* Убираем блокировку */
  opacity: 0; /* Устанавливаем прозрачность */
  visibility: hidden; /* Скрываем элемент */
}

/* HTML: <div class="loader"></div> */
.loader {
  height: 80px;
  aspect-ratio: 1;
  box-sizing: border-box;
  position: relative;
  mask: 
    radial-gradient(#0000 47%,#000 48% 71%,#0000 72%) exclude,
    conic-gradient(#000 0 0) no-clip;
  animation: l11 1.5s linear infinite;
}
.loader:before {
  content: "";
  position: absolute;
  inset: 0 35% 70%;
  border-radius: 50%;
  background: #000;
  filter: blur(15px);
}
@keyframes l11 {
  to {rotate: 1turn}
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }

  .main-content {
    padding: 12px;
  }

  .chart-container {
    height: 300px;
  }
}
</style>