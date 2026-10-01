<script setup lang="ts">
import { useTheme } from './context';
const theme = useTheme();
</script>
<template><slot v-if="theme.status !== 'loading'" /></template>
