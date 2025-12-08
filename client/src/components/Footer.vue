<template>
    <footer class="footer footer-center p-4 bg-base-300 text-base-content text-xs opacity-70 mt-auto">
        <div v-if="info">
            <div class="flex gap-4">
                <span>Printer: {{ info.machineName }}</span>
                <span>Firmware: {{ info.firmware }}</span>
                <span>Serial Number: {{ info.serialNumber }}</span>
            </div>
        </div>
        <div v-else>
            <p>Waiting for printer information...</p>
        </div>
    </footer>
</template>

<script setup lang="ts">
import type { PrinterInfo } from '../types/printerData';

defineProps<{
    info?: PrinterInfo
}>();
</script>
