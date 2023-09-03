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
			const useAvif = Boolean(formData.useAvif);

			const sharpInstance = await sharp(Buffer.from(await image.arrayBuffer())).resize(
				parseInt(newWidth),
				parseInt(newHeight),
				{ fit: 'inside' }
			);

			if (useAvif) {
				sharpInstance.avif({
					quality: parseInt(quality),
					lossless: false,
					chromaSubsampling: '4:2:0',
					effort: 4
				});
			} else {
				sharpInstance.webp({
					quality: parseInt(quality),
					lossless: false,
					effort: 4,
					alphaQuality: 100,
					smartSubsample: true
				});
			}

			const optimizedImageBuffer = await sharpInstance.toBuffer();

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
