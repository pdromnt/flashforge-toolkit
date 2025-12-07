<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getPrinterData } from './services/printerStatusService';

import Navbar from './components/Navbar.vue';
import WebcamPanel from './components/WebcamPanel.vue';
import StatusPanel from './components/StatusPanel.vue';
import PrinterUpload from './components/PrinterUpload.vue';

const connectionStatus = ref('Connecting...');
const printerStatus = ref('Unknown');
const printProgress = ref(0);
const extruderTemperature = ref('Unknown');
const printerAddress = ref('');



onMounted(() => {
  getPrinterData().then(res => {
    connectionStatus.value = res.printerConnection;
    printerStatus.value = res.printerStatus;
    printProgress.value = res.printProgress;
    extruderTemperature.value = res.extruderTemperature;
    printerAddress.value = res.printerAddress;
  }).catch(() => {
    connectionStatus.value = 'No response...';
  });

  setInterval(() => {
    getPrinterData();
  }, 10 * 1000);
});
</script>

<template>
  <div class="min-h-screen bg-base-200 p-4">
    <!-- Layout will go here -->
    <Navbar />
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <div class="lg:col-span-2">
        <WebcamPanel :address="printerAddress" />
      </div>
      <div>
        <StatusPanel :connection="connectionStatus" :status="printerStatus" :temp="extruderTemperature"
          :progress="printProgress" />
        <PrinterUpload class="mt-4" />
      </div>
    </div>
  </div>
</template>

<style>
/* Global styles if needed, but prefer Tailwind utility classes */
</style>
