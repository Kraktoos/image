import sharp from 'sharp';

export const actions = {
	default: async ({
		request
	}: {
		request: {
			formData: () => Promise<FormData>;
		};
	}) => {
		try {
			const formData = Object.fromEntries(await request.formData());

			const image = formData.image as unknown as File;
			const newWidth = formData.width as string;
			const newHeight = formData.height as string;
			const quality = formData.quality as string;

			const optimizedImageBuffer = await sharp(Buffer.from(await image.arrayBuffer()))
				.resize(parseInt(newWidth), parseInt(newHeight), { fit: 'inside' })
				.webp({ quality: parseInt(quality) })
				.toBuffer();

			return {
				success: true,
				image: optimizedImageBuffer.toString('base64')
			};
		} catch (error) {
			console.log(error);
			return { success: false };
		}
	}
};
