<script lang="ts">
	import ImageCompare from '$lib/components/ImageCompare.svelte';
	import { panzoom, type Options } from 'svelte-pan-zoom';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let cx: CanvasRenderingContext2D;
	let left: HTMLImageElement;
	let right: HTMLImageElement;
	let options: Options = {
		width: 1920,
		height: 1080,
		render
	};

	let scaleWidth: number;
	let scaleHeight: number;
	let x: number;
	let y: number;

	function render(ctx: CanvasRenderingContext2D) {
		if (!left) return;

		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw the left image at the calculated position and size
		ctx.drawImage(left, x, y, scaleWidth, scaleHeight);

		cx.save();
		cx.resetTransform();
		canvas.width = ctx.canvas.width;
		canvas.height = ctx.canvas.height;
		cx.setTransform(ctx.getTransform());

		// Draw the right image at the same position and size as the left image
		cx.drawImage(right, x, y, scaleWidth, scaleHeight);

		cx.restore();
	}

	function loadImage(src: string) {
		return new Promise<HTMLImageElement>((resolve) => {
			const image = new Image();

			image.onload = () => resolve(image);
			image.src = src;
		});
	}

	export let image1: {
		src: string;
	};
	export let image2: {
		src: string;
	};

	onMount(async () => {
		[left, right] = await Promise.all([loadImage(image1.src), loadImage(image2.src)]);
		cx = canvas.getContext('2d')!;

		const aspectRatioLeft = left.width / left.height;
		const aspectRatioRight = right.width / right.height;

		if (aspectRatioLeft > aspectRatioRight) {
			// If left image is wider, scale based on width
			scaleWidth = canvas.width;
			scaleHeight = canvas.width / aspectRatioLeft;
		} else {
			// If right image is wider or they have the same aspect ratio, scale based on height
			scaleHeight = canvas.height;
			scaleWidth = canvas.height * aspectRatioLeft;
		}

		// Calculate the position to center the scaled image within the canvas
		x = (canvas.width - scaleWidth) / 2;
		y = (canvas.height - scaleHeight) / 2;

		options = {
			width: canvas.width,
			height: canvas.height,
			render
		};
	});
</script>

<ImageCompare class="w-full h-[32rem] mt-4">
	<canvas use:panzoom={options} slot="left" />
	<canvas bind:this={canvas} slot="right" id="right" />
</ImageCompare>

<style>
	canvas {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		user-select: none;
		touch-action: none;
		background-color: #666;
		overscroll-behavior: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	#right {
		pointer-events: none;
	}
</style>
