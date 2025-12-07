<template>
  <div class="upload-container">
    <h3>Upload to Printer</h3>

    <div class="upload-form">
      <input type="file" @change="onFileChange" accept=".gcode" />
      <button :disabled="!file || uploading" @click="startUpload">
        {{ uploading ? "Uploading..." : "Upload" }}
      </button>
    </div>

    <div v-if="uploading" class="progress">
      <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
    </div>

    <p v-if="status">{{ status }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const file = ref(null);
const uploading = ref(false);
const progressPct = ref(0);
const status = ref("");

const onFileChange = (e: any) => {
  file.value = e.target.files[0];
}

const startUpload = async () => {
  if (!file) return;

  uploading.value = true;
  progressPct.value = 0;
  status.value = "";

  // Create FormData
  const formData = new FormData();
  formData.append("file", file.value!);

  // Start upload request
  const response = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  // Listen to SSE stream
  const reader = response?.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    chunk.split("\n").forEach((line) => {
      if (line.startsWith("data:")) {
        const payload = JSON.parse(line.replace("data: ", ""));
        if (payload.pct) {
          progressPct.value = parseFloat(payload.pct);
        }
        if (payload.done) {
          status.value = "Upload complete!";
          uploading.value = false;
        }
        if (payload.error) {
          status.value = "Error: " + payload.error;
          uploading.value = false;
        }
      }
    });
  }
}
</script>

<style scoped>
.upload-container {
  max-width: 400px;
  margin: auto;
  text-align: center;
}

.upload-form {
  display: flex;
}

.progress {
  width: 100%;
  background: #eee;
  height: 20px;
  margin-top: 10px;
}

.progress-bar {
  height: 100%;
  background: #42b983;
  transition: width 0.2s ease;
}
</style>
