<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import ImageComparisonPanZoom from '$lib/components/ImageComparisonPanZoom.svelte';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import { images } from '$lib/stores/images';
	import { RangeSlider, getToastStore } from '@skeletonlabs/skeleton';
	import type Cropper from 'cropperjs';
	import { onMount } from 'svelte';

	const DEFAULT_QUALITIES = {
		avif: 50,
		webp: 75,
		jpeg: 75
		// jxl: 75
	};
	const DEFAULT_FORMAT = 'webp';
	const DEFAULT_QUALITY = DEFAULT_QUALITIES[DEFAULT_FORMAT as CodecFormat];

	let originalImage: string | null = null;

	let width: number | null;
	let height: number | null;
	let newWidth: number | null;
	let newHeight: number | null;
	let quality = DEFAULT_QUALITY;
	let format = DEFAULT_FORMAT;

	$: {
		newWidth = width;
		newHeight = height;
	}

	const toastStore = getToastStore();

	let cropperInstance: Cropper;

	export let form;

	let actualDimensions: any;

	function getImageDimensions() {
		return new Promise<{ width: number; height: number }>((resolve) => {
			const image = new Image();
			image.src = $images[$images.length - 1];
			image.onload = () => {
				resolve({ width: image.width, height: image.height });
			};
		});
	}

	onMount(() => {
		getImageDimensions().then((dimensions) => {
			actualDimensions = dimensions;
			if (!width) {
				width = dimensions.width;
			}
			if (!height) {
				height = dimensions.height;
			}
		});
	});

	function handleWidthChange() {
		if (!width) {
			height = null;
			return;
		}
		height = Math.round((width / actualDimensions.width) * actualDimensions.height);
	}

	function handleHeightChange() {
		if (!height) {
			width = null;
			return;
		}
		width = Math.round((height / actualDimensions.height) * actualDimensions.width);
	}

	$: if (form?.success && form?.image) {
		let a = document.createElement('a');
		a.href =
			`data:image/${format}
		;base64,` + form.image.toString();
		a.download = `${'optimized'}-${width}x${height}.${
			{ avif: 'avif', webp: 'webp', jpeg: 'jpg' }[format]
		}`;
		a.click();
		a.remove();

		toastStore.trigger({
			message: 'Image was successfully optimized.',
			background: 'variant-filled-success'
		});

		goto('/');
	}

	async function handleSubmit(event: Event) {
		const data = new FormData();
		if (!$images.length) {
			toastStore.trigger({
				message: 'Please select an image.',
				background: 'variant-filled-error'
			});
			return;
		}
		data.append(
			'image',
			cropperInstance.getCroppedCanvas().toDataURL()
				? cropperInstance.getCroppedCanvas().toDataURL().split(',')[1]
				: $images[$images.length - 1].split(',')[1]
		);
		data.append('width', newWidth!.toString());
		data.append('height', newHeight!.toString());
		data.append('quality', quality.toString());
		data.append('format', format);

		//@ts-ignore
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

	function handleFormatChange(event: Event) {
		const newFormat = (event.target as HTMLInputElement).value;
		quality = DEFAULT_QUALITIES[newFormat as CodecFormat];
	}
</script>

<svelte:head>
	<title>Crop & Optimize the Image</title>
</svelte:head>

<div class="w-screen h-screen px-5 pt-5 pb-[5rem] absolute">
	{#if $images.length === 0}
		<p class="text-2xl font-bold">No image selected</p>
	{:else}
		<ImageCropper
			src={$images[$images.length - 1]}
			bind:originalImage
			bind:cropperInstance
			on:cropend={(event) => {
				actualDimensions = {
					width: Math.round(event.detail.width),
					height: Math.round(event.detail.height)
				};
				width = Math.round(event.detail.width);
				height = Math.round(event.detail.height);
			}}
		/>

		{#if !form?.success || !form?.image}
			<form
				method="POST"
				enctype="multipart/form-data"
				on:submit|preventDefault={handleSubmit}
				class="relative z-10 w-full flex justify-center"
			>
				<div class="flex mt-4 gap-2">
					<div class="input-group input-group-divider grid-cols-[auto_1fr] w-32">
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

					<div class="input-group input-group-divider grid-cols-[auto_1fr] w-32">
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

					<div class="flex gap-2 items-center w-72">
						<RangeSlider
							name="quality"
							id="quality"
							min={5}
							max={100}
							bind:value={quality}
							step={5}
							ticked
							class="flex-1"
						/>
					</div>

					<select
						name="format"
						id="format"
						class="select select-bordered select-accent w-24"
						bind:value={format}
						on:change={handleFormatChange}
					>
						<option value="avif">AVIF</option>
						<option value="webp">WebP</option>
						<option value="jpeg">JPEG</option>
					</select>

					<button type="submit" class="btn variant-filled mb-2">Optimize Image</button>
				</div>
			</form>
		{/if}
	{/if}
</div>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
