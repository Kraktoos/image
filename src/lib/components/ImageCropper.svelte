<script lang="ts">
	import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
	import Cropper from 'cropperjs';

	export let cropperInstance: Cropper;
	let image: HTMLImageElement;

	export let originalImage;

	const dispatch = createEventDispatcher();

	// Props
	export let src: string;
	export let options = {
		autoCropArea: 1,
		cropend: () => {
			if (!cropperInstance) return;
			const data = cropperInstance.getData();
			dispatch('cropend', data);
		}
	};

	onMount(async () => {
		originalImage = src;
		cropperInstance = new Cropper(image, options);

		await import('cropperjs/dist/cropper.min.css');
	});

	afterUpdate(() => {
		// Update Cropper.js when the `src` or `options` change
		if (cropperInstance) {
			cropperInstance.destroy();
			cropperInstance = new Cropper(image, options);
		}
	});
</script>

<div class="cropper-container">
	<img bind:this={image} {src} alt="Crop Image" />
</div>

<style>
	.cropper-container {
		width: 100%;
		height: 100%;
	}

	.cropper-container img {
		object-fit: contain; /* Optional: Use 'contain' to maintain aspect ratio */
	}
</style>
