<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { printerSocket } from './services/printerSocketService';

import Navbar from './components/Navbar.vue';
import WebcamPanel from './components/WebcamPanel.vue';
import StatusPanel from './components/StatusPanel.vue';
import PrinterUpload from './components/PrinterUpload.vue';
import ConfigPanel from './components/ConfigPanel.vue';
import Footer from './components/Footer.vue';
import NotificationToast from './components/NotificationToast.vue';
import type { PrinterInfo, PrinterData } from './types/printerData';

const connectionStatus = ref('Connecting...');
const printerStatus = ref('Unknown');
const printProgress = ref(0);
const extruderTemperature = ref('Unknown');
const printerAddress = ref('');
const printerInfo = ref<PrinterInfo | undefined>(undefined);
const isSocketConnected = ref(false);

const updateData = (data: PrinterData) => {
  connectionStatus.value = data.printerConnection || 'No response...';
  printerStatus.value = data.printerStatus || 'Unknown';
  printProgress.value = data.printProgress || 0;
  extruderTemperature.value = data.extruderTemperature || 'Unknown';
  printerAddress.value = data.printerAddress || '';
  printerInfo.value = data.printerInfo;
};

onMounted(() => {
  // Set up socket event handlers
  printerSocket.onStatus(updateData);
  
  printerSocket.onConnect(() => {
    isSocketConnected.value = true;
    console.log('[APP] Socket connected');
  });
  
  printerSocket.onDisconnect((reason) => {
    isSocketConnected.value = false;
    console.log('[APP] Socket disconnected:', reason);
    connectionStatus.value = 'Disconnected';
  });
  
  printerSocket.onError((error) => {
    console.error('[APP] Socket error:', error);
    connectionStatus.value = 'Connection Error';
  });
  
  // Connect to the server
  printerSocket.connect();
});

onUnmounted(() => {
  printerSocket.disconnect();
});
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col">
    <div class="p-4 flex-grow">
      <Navbar />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div class="lg:col-span-2">
          <WebcamPanel :address="printerAddress" />
        </div>
        <div>
          <StatusPanel :connection="connectionStatus" :status="printerStatus" :temp="extruderTemperature"
            :progress="printProgress" />
          <PrinterUpload class="mt-4" />
          <ConfigPanel />
        </div>
      </div>
    </div>
    <Footer :info="printerInfo" />
    <NotificationToast />
  </div>
</template>
