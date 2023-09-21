import sharp from 'sharp';
import { images } from '$lib/stores/images.js';

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

			const image = formData.image as string;
			const newWidth = formData.width as string;
			const newHeight = formData.height as string;
			const quality = formData.quality as string;
			const format = formData.format as CodecFormat;

			console.log('image', image);

			// const sharpInstance = await sharp(Buffer.from(await image.arrayBuffer())).resize(
			const sharpInstance = await sharp(Buffer.from(image, 'base64')).resize(
				parseInt(newWidth),
				parseInt(newHeight),
				{
					fit: 'inside'
				}
			);

			if (format === 'avif') {
				sharpInstance.avif({
					quality: parseInt(quality),
					lossless: false,
					chromaSubsampling: '4:2:0',
					effort: 4
				});
			} else if (format === 'webp') {
				sharpInstance.webp({
					quality: parseInt(quality),
					lossless: false,
					effort: 4,
					alphaQuality: 100,
					smartSubsample: true
				});
			} else if (format === 'jpeg') {
				sharpInstance.jpeg({
					quality: parseInt(quality),
					progressive: true,
					chromaSubsampling: '4:2:0',
					trellisQuantisation: true,
					overshootDeringing: true,
					optimizeScans: true,
					optimizeCoding: true,
					quantizationTable: 3,
					mozjpeg: true
				});
			}

			// LEAVE COMMENTED FOR NOW
			// else if (format === 'jxl') {
			// 	sharpInstance.jxl({
			// 		quality: parseInt(quality),
			// 		distance: 0,
			// 		decodingTier: 0,
			// 		lossless: false,
			// 		effort: 4
			// 	});
			// }

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
