<script lang="ts">
	import { enhance } from '$app/forms';
	import { FileDropzone, LightSwitch, RangeSlider } from '@skeletonlabs/skeleton';
	import 'iconify-icon';
	import { onMount } from 'svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { invalidateAll, goto } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';
	import ImageCompare from '$lib/components/ImageCompare.svelte';
	import ImageComparisonPanZoom from '$lib/components/ImageComparisonPanZoom.svelte';

	const toastStore = getToastStore();

	let selectedFile: File | null;
	let width: number | null;
	let height: number | null;
	let quality = 80;

	const handleFileInputChange = (event: Event) => {
		if (!event.target) return;
		if (!(event.target instanceof HTMLInputElement)) return;
		if (!event.target.files) return;
		selectedFile = event.target.files[0];

		// set max width and height to the image's current dimensions
		const image = new Image();
		image.src = URL.createObjectURL(selectedFile);
		image.onload = () => {
			width = image.width;
			height = image.height;
		};
	};

	export let form;
	export let data;

	let actualDimensions: any;

	function getImageDimensions(file: File) {
		if (!file) return;
		return new Promise<{ width: number; height: number }>((resolve) => {
			const image = new Image();
			image.src = URL.createObjectURL(file);
			image.onload = () => {
				resolve({ width: image.width, height: image.height });
			};
		});
	}

	$: getImageDimensions(selectedFile!)?.then((dimensions) => {
		actualDimensions = dimensions;
	});

	function handleWidthChange(event: Event) {
		if (!width) {
			height = null;
			return;
		}
		height = Math.round((width / actualDimensions.width) * actualDimensions.height);
	}

	function handleHeightChange(event: Event) {
		if (!height) {
			width = null;
			return;
		}
		width = Math.round((height / actualDimensions.height) * actualDimensions.width);
	}

	// when the form is received, prompt the user to download the file
	$: if (form?.success && form?.image && selectedFile) {
		let a = document.createElement('a');
		a.href = 'data:image/webp;base64,' + form.image.toString();
		a.download = `${selectedFile?.name.split('.')[0] || 'optimized'}-${width}x${height}.${
			selectedFile?.name.split('.')[1] || 'webp'
		}`;
		a.click();
		a.remove();

		toastStore.trigger({
			message: 'Image was successfully optimized.',
			background: 'variant-filled-success'
		});
	}

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

		window.addEventListener('drop', function (e: DragEvent) {
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

				// set max width and height to the image's current dimensions
				const image = new Image();
				image.src = URL.createObjectURL(selectedFile);
				image.onload = () => {
					width = image.width;
					height = image.height;
				};
			}
		});
	});

	async function handleSubmit(event: Event) {
		const data = new FormData();
		if (!selectedFile) {
			toastStore.trigger({
				message: 'Please select an image.',
				background: 'variant-filled-error'
			});
			return;
		}
		data.append('image', selectedFile);
		data.append('width', width!.toString());
		data.append('height', height!.toString());
		data.append('quality', quality.toString());

		const response = await fetch(this.action, {
			method: 'POST',
			body: data
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = deserialize(await response.text());

		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);
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

	{#if !form?.success || !form?.image || !selectedFile}
		<form method="POST" enctype="multipart/form-data" on:submit|preventDefault={handleSubmit}>
			<div style="visibility:hidden; opacity:0" id="dropzone">
				<div id="textnode">Drop anywhere!</div>
			</div>

			<FileDropzone id="image" name="image" accept="image/*" on:change={handleFileInputChange}>
				<svelte:fragment slot="lead">
					<iconify-icon icon="material-symbols:image" class="mx-auto text-6xl" />
				</svelte:fragment>
				<svelte:fragment slot="message">
					<p>Drop an image here or click to select a file.</p>
					<p>Supported formats: PNG, JPEG, WEBP</p>
				</svelte:fragment>
				<svelte:fragment slot="meta">
					<p>Max file size: 10MB</p>
				</svelte:fragment>
			</FileDropzone>

			<div class="flex mt-4 gap-2 justify-between">
				<div class="input-group input-group-divider grid-cols-[auto_1fr]">
					<div class="input-group-shim">
						<iconify-icon icon="material-symbols:width" class="text-2xl" />
					</div>
					<input
						type="number"
						id="width"
						name="width"
						bind:value={width}
						placeholder="New Width"
						on:change={handleWidthChange}
					/>
				</div>

				<div class="input-group input-group-divider grid-cols-[auto_1fr]">
					<div class="input-group-shim">
						<iconify-icon icon="material-symbols:height" class="text-2xl" />
					</div>
					<input
						type="number"
						id="height"
						name="height"
						bind:value={height}
						placeholder="New Height"
						on:change={handleHeightChange}
					/>
				</div>
			</div>

			<div class="flex mt-4 gap-2 justify-between">
				<RangeSlider
					name="quality"
					id="quality"
					min={5}
					max={100}
					bind:value={quality}
					step={5}
					ticked
					class="flex-1"
				>
					<div class="flex justify-between items-center">
						<div class="font-bold">Quality</div>
						<div class="text-xs">{quality} / 100</div>
					</div>
				</RangeSlider>

				<button type="submit" class="btn variant-filled">Optimize Image</button>
			</div>

			<div>
				{#if actualDimensions}
					<p>Current Dimensions: {actualDimensions.width}x{actualDimensions.height}</p>
				{/if}
				{#if selectedFile}
					{#if selectedFile.size > 1024 * 1024}
						<p>
							Current file size: {selectedFile.size
								? (selectedFile.size / 1024 / 1024).toFixed(2)
								: 'unknown'}
							MB
						</p>
					{:else}
						<p>
							Current file size: {selectedFile.size
								? (selectedFile.size / 1024).toFixed(2)
								: 'unknown'}
							KB
						</p>
					{/if}
				{/if}
			</div>
		</form>
	{:else}
		<div class="flex flex-col gap-4">
			<!-- <ImageCompare class="max-w-fll w-full">
				<img src={URL.createObjectURL(selectedFile)} alt="Original" slot="left" />
				<img src={'data:image/webp;base64,' + form.image.toString()} alt="Optimized" slot="right" />
			</ImageCompare> -->
			<ImageComparisonPanZoom
				image1={{
					src: URL.createObjectURL(selectedFile),
					width: actualDimensions.width,
					height: actualDimensions.height
				}}
				image2={{
					src: 'data:image/webp;base64,' + form.image.toString(),
					width: width,
					height: height
				}}
			/>

			<!-- Show old image size and new -->
			<div class="flex justify-between">
				<div>
					<p>
						Original Size: {selectedFile.size ? (selectedFile.size / 1024).toFixed(2) : 'unknown'} KB
					</p>
					<p>
						Optimized Size: {form.image
							? (((form.image.toString('base64').length / 1024) * 3) / 4).toFixed(2)
							: 'unknown'} KB
					</p>
				</div>
				<div>
					<p>
						{Math.round(
							((selectedFile.size ? selectedFile.size : 0) / (form.image ? form.image.length : 0)) *
								100
						)}
						% Smaller
					</p>
				</div>
			</div>

			<div class="flex justify-center">
				<button
					class="btn variant-filled"
					on:click={() => {
						selectedFile = null;
						width = null;
						height = null;
						quality = 80;
						form = null;
					}}
				>
					Optimize Another
				</button>
			</div>
		</div>
	{/if}
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
