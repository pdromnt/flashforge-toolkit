<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { checkNotification as fetchNotification, sendResponse as postResponse, type Notification } from '../services/notificationService';

const notification = ref<Notification | null>(null);

const checkNotification = async () => {
    try {
        const data = await fetchNotification();
        if (data) {
            notification.value = data;
        }
    } catch (e) {
        console.error('Failed to fetch notifications', e);
    }
};

const sendResponse = async (answer: 'yes' | 'no') => {
    try {
        await postResponse(answer);
        notification.value = null; // Hide immediately
    } catch (e) {
        console.error('Failed to send response', e);
    }
};

let intervalId: number;

onMounted(() => {
    checkNotification();
    intervalId = setInterval(checkNotification, 3000) as unknown as number;
});

onUnmounted(() => {
    clearInterval(intervalId);
});
</script>

<template>
    <div v-if="notification && notification.type === 'uploadComplete'" class="toast toast-end z-50">
        <div class="alert alert-info shadow-lg flex flex-col md:flex-row gap-4 items-center">
            <div>
                <h3 class="font-bold">Upload Complete!</h3>
                <div class="text-xs">File: {{ notification.data.filename }}</div>
                <div class="text-sm">Do you want to start printing now?</div>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-sm btn-ghost" @click="sendResponse('no')">Dismiss</button>
                <button class="btn btn-sm btn-primary" @click="sendResponse('yes')">Start Print</button>
            </div>
        </div>
    </div>
</template>
