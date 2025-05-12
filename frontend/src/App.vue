<template>
  <div id="app">
    <h1>Задачи</h1>

    <p>Всего задач: {{ tasks.length }}</p>

    <div>
      <input v-model="newTask" @keyup.enter="addTask" placeholder="Новая задача" />
      <button @click="addTask">Добавить</button>
    </div>

    <ul v-if="tasks.length">
      <li v-for="task in tasks" :key="task.id">
        {{ task.title }} — 
        <button @click="deleteTask(task.id)">Удалить</button>
      </li>
    </ul>

    <p v-else>Нет задач</p>
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 60px;
}

input {
  padding: 8px;
  margin-right: 10px;
  width: 200px;
}

button {
  padding: 8px 12px;
  cursor: pointer;
}

ul {
  list-style-type: none;
  padding: 0;
  max-width: 300px;
  margin: 20px auto;
}

li {
  display: flex;
  justify-content: space-between;
  background: #f0f0f0;
  margin: 5px 0;
  padding: 10px;
  border-radius: 4px;
}
</style>