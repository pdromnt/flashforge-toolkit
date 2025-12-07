<template>
    <div class="navbar bg-base-100 shadow-md rounded-box">
        <div class="flex-1">
            <div class="btn btn-ghost text-xl">
                <img :src="currentTheme === 'dark' ? flashforgeDark : flashforgeLight" alt="FlashForge Logo"
                    class="h-8 mr-2" />
                Dashboard
            </div>
        </div>
        <div class="flex-none z-10">
            <ul class="menu menu-horizontal px-1 z-10">
                <li>
                    <details>
                        <summary>Theme</summary>
                        <ul class="p-2 bg-base-100 rounded-t-none">
                            <li><a @click="setAndClose('dark')">Dark</a></li>
                            <li><a @click="setAndClose('light')">Light</a></li>
                        </ul>
                    </details>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import flashforgeDark from '../assets/flashforge-dark.png';
import flashforgeLight from '../assets/flashforge-light.png';

const currentTheme = ref('');

onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Default to system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(systemDark ? 'dark' : 'light', false);
    }
});

const setTheme = (theme: string, save = true) => {
    currentTheme.value = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (save) {
        localStorage.setItem('theme', theme);
    }
};

const setAndClose = (theme: string) => {
    setTheme(theme);
    closeDropdown();
};

const closeDropdown = () => {
    const details = document.querySelector('details');
    if (details) details.removeAttribute('open');
};
</script>
