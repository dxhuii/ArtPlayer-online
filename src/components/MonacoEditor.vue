<script setup>
import { ref, onMounted, onUnmounted, toRaw, nextTick } from 'vue';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const editorRef = ref(null);
const editorInstance = ref(null);
const emit = defineEmits(['getInstance'])

onMounted(() => {
	if (editorRef.value && !editorInstance.value) {
		editorInstance.value = monaco.editor.create(editorRef.value, {
			value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
			language: 'javascript',
			lineNumbers: true,
			theme: 'vs-dark'
		});
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
	height: 300px;
}
</style>