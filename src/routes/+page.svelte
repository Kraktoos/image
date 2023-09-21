<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		FileButton,
		FileDropzone,
		LightSwitch,
		RangeSlider,
		SlideToggle
	} from '@skeletonlabs/skeleton';
	import 'iconify-icon';
	import { onMount } from 'svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { invalidateAll, goto } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';
	import ImageComparisonPanZoom from '$lib/components/ImageComparisonPanZoom.svelte';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import { images } from '$lib/stores/images.js';
	import { Buffer } from 'buffer';

	const DEFAULT_QUALITIES = {
		avif: 50,
		webp: 75,
		jpeg: 75
		// jxl: 75
	};
	const DEFAULT_FORMAT = 'webp';
	const DEFAULT_QUALITY = DEFAULT_QUALITIES[DEFAULT_FORMAT as CodecFormat];

	const toastStore = getToastStore();

	let selectedFile: File | null;
	let width: number | null;
	let height: number | null;
	let quality = DEFAULT_QUALITY;
	let format = DEFAULT_FORMAT;

	let lastTarget: any = null;

	function isFile(evt: DragEvent) {
		let dt = evt.dataTransfer;
		if (!dt) return false;

		for (var i = 0; i < dt.types.length; i++) {
			if (dt.types[i] === 'Files') {
				return true;
			}
		}
		return false;
	}

	onMount(() => {
		window.Buffer = Buffer;

		window.addEventListener('paste', async function (e) {
			if (!e.clipboardData) return;
			if (!e.clipboardData.files) return;
			if (e.clipboardData.files.length > 0) {
				// check if file is an image
				if (!e.clipboardData.files[0].type.startsWith('image/')) {
					toastStore.trigger({
						message: 'Please paste an image.',
						background: 'variant-filled-error'
					});
					return;
				}

				selectedFile = e.clipboardData.files[0];

				// images.add(Buffer.from(await selectedFile.arrayBuffer()));
				images.add(
					`data:${selectedFile.type};base64,${Buffer.from(
						await selectedFile.arrayBuffer()
					).toString('base64')}`
				);

				goto('/crop-and-optimize');
			}
		});

		const dropzone = document.querySelector('#dropzone') as HTMLElement;
		const textnode = document.querySelector('#textnode') as HTMLElement;
		window.addEventListener('dragenter', function (e) {
			if (isFile(e)) {
				lastTarget = e.target;
				dropzone.style.visibility = '';
				dropzone.style.opacity = '100%';
				textnode.style.fontSize = '48px';
			}
		});
		window.addEventListener('dragleave', function (e) {
			e.preventDefault();
			if (e.target === lastTarget || e.target === document) {
				dropzone.style.visibility = 'hidden';
				dropzone.style.opacity = '0%';
				textnode.style.fontSize = '42px';
			}
		});

		window.addEventListener('dragover', function (e) {
			e.preventDefault();
		});

		window.addEventListener('drop', async function (e: DragEvent) {
			e.preventDefault();
			dropzone.style.visibility = 'hidden';
			dropzone.style.opacity = '0%';
			textnode.style.fontSize = '42px';

			if (!e.dataTransfer) return;
			if (e.dataTransfer.files.length > 0) {
				// check if file is an image
				if (!e.dataTransfer.files[0].type.startsWith('image/')) {
					toastStore.trigger({
						message: 'Please drop an image.',
						background: 'variant-filled-error'
					});
					return;
				}

				selectedFile = e.dataTransfer.files[0];

				images.add(
					`data:${selectedFile.type};base64,${Buffer.from(
						await selectedFile.arrayBuffer()
					).toString('base64')}`
				);

				goto('/crop-and-optimize');
			}
		});
	});

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files) return;
		if (!target.files.length) return;

		selectedFile = target.files[0];

		images.add(
			`data:${selectedFile.type};base64,${Buffer.from(await selectedFile.arrayBuffer()).toString(
				'base64'
			)}`
		);

		goto('/crop-and-optimize');
	}
</script>

<svelte:head>
	<title>Image Optimizer</title>
</svelte:head>

<main class="p-5 flex w-full h-screen items-center justify-center flex-col flex-1">
	<h1 class="h1 flex items-center justify-center gap-6 mb-3">
		Image Optimizer <LightSwitch class="inline-block mt-2" />
	</h1>
	<h4 class="text-xl mb-5">Instantly optimize your images for the web.</h4>

	<FileButton name="image" on:change={handleFileChange} />

	<div style="visibility:hidden; opacity:0" id="dropzone">
		<div id="textnode">Drop anywhere!</div>
	</div>
</main>

<style>
	main {
		text-align: center;
		max-width: 52rem;
		margin: 0 auto;
	}
	div#dropzone {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999999999;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		transition: visibility 175ms, opacity 175ms;
		display: table;
		text-shadow: 1px 1px 2px #000;
		color: #fff;
		background: rgba(0, 0, 0, 0.45);
		font: bold 42px Oswald, DejaVu Sans, Tahoma, sans-serif;
	}
	div#textnode {
		display: table-cell;
		text-align: center;
		vertical-align: middle;
		transition: font-size 175ms;
	}
</style>
