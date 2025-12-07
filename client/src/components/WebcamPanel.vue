<template>
    <div class="card bg-base-100 shadow-xl h-full">
        <div class="card-body p-0 overflow-hidden relative group">
            <img v-if="isStreaming && address" :src="streamUrl" @error="handleError" class="w-full h-full object-cover"
                alt="Printer Stream" />

            <div v-else
                class="flex flex-col items-center justify-center h-full min-h-[400px] bg-base-300 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mb-4 opacity-20" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span class="text-lg font-semibold">Camera Offline</span>
                <button v-if="!address" @click="retry" class="btn btn-sm btn-ghost mt-4">Retry Connection</button>
            </div>

            <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="badge badge-neutral">Onboard Camera Live View</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    address: string;
}>();

const isStreaming = ref(true);
const streamUrl = computed(() => `http://${props.address}:8080/?action=stream`);

const handleError = () => {
    isStreaming.value = false;
};

const retry = () => {
    isStreaming.value = true;
};

watch(() => props.address, () => {
    if (props.address) {
        isStreaming.value = true;
    }
});
</script>
