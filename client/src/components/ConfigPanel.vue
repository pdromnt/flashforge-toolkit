<template>
  <div class="card bg-base-100 shadow-xl mt-4">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <h2 class="card-title">Printer Configuration</h2>
        <button 
          class="btn btn-sm btn-ghost"
          @click="showConfig = !showConfig"
        >
          {{ showConfig ? 'Hide' : 'Edit' }}
        </button>
      </div>

      <div v-if="!showConfig" class="text-sm opacity-70 mt-2">
        <p>Printer IP: {{ currentConfig.printerIP }}</p>
        <p>Printer Port: {{ currentConfig.printerPort }}</p>
        <p>Debug Mode: {{ currentConfig.debug ? 'Enabled' : 'Disabled' }}</p>
      </div>

      <div v-else class="mt-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Printer IP Address</span>
          </label>
          <input 
            v-model="formConfig.printerIP" 
            type="text" 
            placeholder="192.168.1.100"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.printerIP }"
          />
          <label v-if="errors.printerIP" class="label">
            <span class="label-text-alt text-error">{{ errors.printerIP }}</span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Printer Port</span>
          </label>
          <input 
            v-model.number="formConfig.printerPort" 
            type="number" 
            placeholder="8899"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.printerPort }"
          />
          <label v-if="errors.printerPort" class="label">
            <span class="label-text-alt text-error">{{ errors.printerPort }}</span>
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Debug Mode</span>
            <input 
              v-model="formConfig.debug" 
              type="checkbox" 
              class="checkbox checkbox-primary"
            />
          </label>
        </div>

        <div v-if="status.message" class="alert" :class="status.type">
          <span>{{ status.message }}</span>
        </div>

        <div class="card-actions justify-end">
          <button 
            class="btn btn-primary"
            :disabled="isSaving"
            @click="saveConfiguration"
          >
            <span v-if="isSaving" class="loading loading-spinner"></span>
            {{ isSaving ? 'Saving...' : 'Save Configuration' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';

interface Config {
  printerIP: string;
  printerPort: number;
  serverPort: number;
  debug: boolean;
}

const showConfig = ref(false);
const isSaving = ref(false);
const currentConfig = ref<Config>({
  printerIP: '',
  printerPort: 8899,
  serverPort: 3000,
  debug: false
});
const formConfig = reactive<Config>({
  printerIP: '',
  printerPort: 8899,
  serverPort: 3000,
  debug: false
});
const errors = reactive({
  printerIP: '',
  printerPort: ''
});
const status = reactive({
  message: '',
  type: '' as 'alert-success' | 'alert-error' | ''
});

const apiUrl = import.meta.env.MODE === 'development' 
  ? 'http://localhost:3000/api/config'
  : '/api/config';

const loadConfig = async () => {
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const config = await response.json();
      currentConfig.value = config;
      Object.assign(formConfig, config);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
};

const validateForm = (): boolean => {
  let isValid = true;
  errors.printerIP = '';
  errors.printerPort = '';

  // Validate IP
  const looksLikeIP = /^[\d.]+$/.test(formConfig.printerIP);
  if (looksLikeIP) {
    const octets = formConfig.printerIP.split('.');
    if (octets.length !== 4) {
      errors.printerIP = 'IP address must have 4 octets';
      isValid = false;
    } else {
      for (const octet of octets) {
        const num = parseInt(octet, 10);
        if (num < 0 || num > 255 || isNaN(num)) {
          errors.printerIP = 'Each octet must be between 0 and 255';
          isValid = false;
          break;
        }
      }
    }
  } else {
    // Hostname validation
    const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
    if (!hostnameRegex.test(formConfig.printerIP)) {
      errors.printerIP = 'Invalid IP address or hostname';
      isValid = false;
    }
  }

  // Validate Port
  if (formConfig.printerPort < 1 || formConfig.printerPort > 65535) {
    errors.printerPort = 'Port must be between 1 and 65535';
    isValid = false;
  }

  return isValid;
};

const saveConfiguration = async () => {
  if (!validateForm()) return;

  isSaving.value = true;
  status.message = '';
  status.type = '';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printerIP: formConfig.printerIP,
        printerPort: formConfig.printerPort,
        debug: formConfig.debug
      })
    });

    const result = await response.json();

    if (response.ok) {
      status.message = result.message + '. ' + result.note;
      status.type = 'alert-success';
      Object.assign(currentConfig.value, formConfig);
    } else {
      status.message = result.error || 'Failed to save configuration';
      status.type = 'alert-error';
    }
  } catch (error) {
    status.message = 'Network error - failed to save configuration';
    status.type = 'alert-error';
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>
