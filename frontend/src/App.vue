<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1><span class="icon">📋</span> Доска задач</h1>
        <p class="task-counter">Всего задач: <span class="task-count">{{ tasks.length }}</span></p>
      </div>
    </header>

    <main class="content">
      <div class="task-form-container">
        <div class="task-form">
          <input
            v-model="newTask"
            @keyup.enter="addTask"
            placeholder="Что нужно сделать?"
            class="task-input"
          />
          <button @click="addTask" class="btn btn-add">
            <span class="btn-text">Добавить</span>
            <span class="btn-icon">➕</span>
          </button>
        </div>
      </div>

      <div class="tasks-container">
        <transition-group name="task-list" tag="div">
          <div v-for="task in tasks" :key="task.id" class="task-card">
            <div class="task-content">
              <span class="task-text">{{ task.title }}</span>
              <button @click="deleteTask(task.id)" class="btn btn-delete">
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Удалить</span>
              </button>
            </div>
          </div>
        </transition-group>

        <div v-if="!tasks.length" class="no-tasks">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Нет задач</h3>
            <p>Добавьте свою первую задачу!</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      tasks: [],
      newTask: '',
    };
  },
  mounted() {
    this.loadTasks();
  },
  methods: {
    async loadTasks() {
      const response = await axios.get('/api/tasks');
      this.tasks = response.data;
    },
    async addTask() {
      if (!this.newTask.trim()) return;

      await axios.post('/api/tasks', { title: this.newTask });
      this.newTask = '';
      this.loadTasks();
    },
    async deleteTask(id) {
      await axios.delete(`/api/tasks/${id}`);
      this.loadTasks();
    }
  }
};
</script>

<style scoped>
/* Основные стили */
:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --danger-color: #ef4444;
  --danger-hover: #dc2626;
  --success-color: #10b981;
  --success-hover: #059669;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --bg-color: #f9fafb;
  --card-bg: #ffffff;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --transition: all 0.2s ease-in-out;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-color);
}

.app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  max-width: 800px;
  margin: 0 auto; /* Горизонтальное центрирование */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Шапка */
.header {
  background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
  color: white;
  padding: 2rem 0;
  box-shadow: var(--shadow-md);
  margin-bottom: 2rem;
}

.header-content {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
}

.header h1 {
  font-size: 2.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header .icon {
  font-size: 2rem;
}

.task-counter {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
}

.task-count {
  font-weight: 700;
  color: white;
}

/* Основное содержимое */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center; /* Центрирование дочерних элементов */
  padding: 0 2rem;
  width: 100%;
}

.task-form-container {
  width: 100%;
  max-width: 600px; /* Ограничение ширины формы */
}

.task-form {
  display: flex;
  gap: 1rem;
}

.task-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.task-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* Кнопки */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.btn-add {
  background-color: var(--success-color);
  color: white;
}

.btn-add:hover {
  background-color: var(--success-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-delete {
  background-color: var(--danger-color);
  color: white;
}

.btn-delete:hover {
  background-color: var(--danger-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-text {
  display: inline-block;
}

/* Список задач */
.tasks-container {
  width: 100%;
  max-width: 600px; /* Ограничение ширины списка задач */
}

.task-card {
  background-color: var(--card-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1rem;
  overflow: hidden;
  transition: var(--transition);
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.task-text {
  font-size: 1.125rem;
  font-weight: 500;
  flex: 1;
}

/* Состояние "нет задач" */
.no-tasks {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.empty-state {
  text-align: center;
  color: var(--text-light);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.empty-state p {
  font-size: 1rem;
}

/* Анимации */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.5s ease;
}
.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.task-list-move {
  transition: transform 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .task-form {
    flex-direction: column;
  }
  
  .btn-text {
    display: none;
  }
}
</style>