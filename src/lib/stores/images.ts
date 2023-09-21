import { persisted } from 'svelte-local-storage-store';

function createImages() {
	const { subscribe, set, update } = persisted('images', [] as string[]);

	return {
		subscribe,
		add: (image: string) => update((images) => [...images, image]),
		remove: (index: number) => update((images) => images.filter((_, i) => i !== index)),
		set
	};
}

export const images = createImages();
