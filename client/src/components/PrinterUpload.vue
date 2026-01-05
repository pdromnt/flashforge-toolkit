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
import { uploadFile } from '../services/uploadService';

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

const resetState = () => {
  status.value = "";
  file.value = null;
}

const startUpload = async () => {
  if (!file.value) return;

  uploading.value = true;
  progressPct.value = 0;
  status.value = "";

  await uploadFile(
    file.value,
    (pct) => {
      progressPct.value = pct;
    },
    () => {
      status.value = "Upload complete!";
      uploading.value = false;
      progressPct.value = 0;
      setTimeout(resetState, 3000);
    },
    (err) => {
      status.value = "Upload failed: " + err;
      uploading.value = false;
      progressPct.value = 0;
      setTimeout(resetState, 3000);
    }
  );
}
</script>
