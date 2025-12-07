<template>
    <div class="flex flex-col gap-4">
        <!-- Printer Status -->
        <div class="collapse collapse-arrow bg-base-100 shadow-xl">
            <input type="radio" name="status-accordion" checked />
            <div class="collapse-title text-xl font-medium flex items-center gap-2">
                <span v-if="connection === 'Connected'" class="badge badge-success badge-xs"></span>
                <span v-else class="badge badge-error badge-xs"></span>
                Printer Status
            </div>
            <div class="collapse-content">
                <div class="stats stats-vertical shadow w-full">
                    <div class="stat">
                        <div class="stat-title">Connection</div>
                        <div class="stat-value text-lg"
                            :class="connection === 'Connected' ? 'text-success' : 'text-error'">
                            {{ connection }}
                        </div>
                    </div>

                    <div class="stat">
                        <div class="stat-title">State</div>
                        <div class="stat-value text-lg text-primary">{{ status || 'Unknown' }}</div>
                    </div>

                    <div class="stat">
                        <div class="stat-title">Extruder Temperature</div>
                        <div class="stat-value text-lg text-secondary">{{ temp || 'Unknown' }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Progress -->
        <div class="collapse collapse-arrow bg-base-100 shadow-xl">
            <input type="radio" name="status-accordion" />
            <div class="collapse-title text-xl font-medium">
                Printing Progress
            </div>
            <div class="collapse-content">
                <div class="py-4">
                    <div class="flex justify-between mb-2">
                        <span class="font-bold">Progress</span>
                        <span>{{ (progress / 10).toFixed(1) }}%</span>
                    </div>
                    <progress class="progress progress-primary w-full h-4" :value="progress" max="1000">
                    </progress>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    connection: string;
    status: string;
    temp: string;
    progress: number;
}>();
</script>
