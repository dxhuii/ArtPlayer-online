<script setup>
import { ref, onMounted, onUnmounted, toRaw, nextTick } from 'vue';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const editorRef = ref(null);
const editorInstance = ref(null);
const emit = defineEmits(['getInstance', 'update:modelValue'])
const prop = defineProps({
	language: String,
	modelValue: {
		type: String,
		default: ''
	}
})

onMounted(() => {
	if (editorRef.value && !editorInstance.value) {
		editorInstance.value = monaco.editor.create(editorRef.value, {
			value: prop.modelValue,
			language: prop.language,
			lineNumbers: true,
			theme: 'vs-dark',
			tabSize: 2,
			minimap: { enabled: false },
		});

		editorInstance.value.onDidChangeModelContent(v => {
			emit('update:modelValue', toRaw(editorInstance.value).getValue())
		})
	}
	nextTick(() => {
		emit('getInstance', toRaw(editorInstance.value))
	})
});

onUnmounted(() => toRaw(editorInstance.value)?.dispose());
</script>

<template>
	<div class="editor" ref="editorRef" />
</template>

<style scoped>
.editor {
	/* width: 100%; */
	height: 100px;
}
</style>