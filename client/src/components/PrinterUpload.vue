<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Upload G-Code</h2>

      <div v-if="!uploading" class="form-control w-full">
        <label class="label">
          <span class="label-text">Select file</span>
        </label>
        <input type="file" @change="onFileChange" accept=".gcode" class="file-input file-input-bordered w-full" />
      </div>

      <div v-if="!status" class="card-actions justify-end mt-4">
        <button class="btn btn-primary" :disabled="!file || uploading" @click="startUpload">
          <span v-if="uploading" class="loading loading-spinner"></span>
          {{ uploading ? "Uploading..." : "Upload" }}
        </button>
      </div>

      <div v-if="uploading || progressPct > 0" class="mt-4">
        <progress class="progress progress-primary w-full" :value="progressPct" max="100"></progress>
      </div>

      <div v-if="status" class="alert mt-4" :class="status.includes('Error') ? 'alert-error' : 'alert-success'">
        <span>{{ status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const file = ref<File | null>(null);
const uploading = ref(false);
const progressPct = ref(0);
const status = ref("");

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    file.value = target.files[0];
  }
}

const startUpload = async () => {
  if (!file.value) return;

  uploading.value = true;
  progressPct.value = 0;
  status.value = "";

  // Create FormData
  const formData = new FormData();
  formData.append("file", file.value);

  try {
    // Start upload request
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    // Listen to SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunk.split("\n").forEach((line) => {
        if (line.startsWith("data:")) {
          try {
            const payload = JSON.parse(line.replace("data: ", ""));
            if (payload.pct) {
              progressPct.value = parseFloat(payload.pct);
            }
            if (payload.done) {
              status.value = "Upload complete!";
              uploading.value = false;
              progressPct.value = 0;

              setTimeout(() => {
                status.value = "";
                file.value = null;
              }, 3000);
            }
            if (payload.error) {
              status.value = "Error: " + payload.error;
              uploading.value = false;
              progressPct.value = 0;

              setTimeout(() => {
                status.value = "";
                file.value = null;
              }, 3000);
            }
          } catch (e) {
            console.error("Error parsing JSON", e);
          }
        }
      });
    }
  } catch (err: any) {
    status.value = "Upload failed: " + err.message;
    uploading.value = false;
  }
}
</script>
