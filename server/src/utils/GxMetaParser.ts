import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import { GxMetaData } from '../types/gxMetaData.js';
import { BmpEncoder } from './BmpEncoder.js';

export class GxMetaParser {
    /**
     * Parses G-code content to extract metadata and thumbnail.
     * Compatible with OrcaSlicer output.
     */
    public async parse(gcodeContent: string): Promise<{ meta: GxMetaData; thumbnail: Buffer | null }> {
        const meta: GxMetaData = {
            printTime: 0,
            filamentUsage: 0,
            filamentUsageLeft: 0,
            multiExtruderType: 0,
            layerHeight: 0,
            shells: 0,
            printSpeed: 0,
            bedTemperature: 0,
            printTemperature: 0,
            printTemperatureLeft: 0,
        };

        const lines = gcodeContent.split('\n');
        let thumbnailB64 = '';
        let inThumbnailBlock = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // Metadata Parsing
            if (trimmed.startsWith('; estimated printing time (normal mode) =')) {
                const val = trimmed.split('=')[1] || '';
                let totalSeconds = 0;
                const hMatch = val.match(/(\d+)h/);
                const mMatch = val.match(/(\d+)m/);
                const sMatch = val.match(/(\d+)s/);

                if (hMatch) totalSeconds += parseInt(hMatch[1], 10) * 3600;
                if (mMatch) totalSeconds += parseInt(mMatch[1], 10) * 60;
                if (sMatch) totalSeconds += parseInt(sMatch[1], 10);

                if (totalSeconds > 0) meta.printTime = totalSeconds;
            } else if (trimmed.startsWith('; filament used [mm] =')) {
                const val = trimmed.split('=')[1].trim();
                meta.filamentUsage = parseFloat(val);
            } else if (trimmed.startsWith('; layer_height =')) {
                const val = trimmed.split('=')[1].trim();
                meta.layerHeight = Math.round(parseFloat(val) * 1000);
            } else if (trimmed.startsWith('; nozzle_temperature =')) {
                meta.printTemperature = parseInt(trimmed.split('=')[1].trim(), 10);
            } else if (trimmed.startsWith('; first_layer_bed_temperature =')) {
                meta.bedTemperature = parseInt(trimmed.split('=')[1].trim(), 10);
            } else if (trimmed.startsWith('; outer_wall_speed =')) {
                meta.printSpeed = parseInt(trimmed.split('=')[1].trim(), 10);
            } else if (trimmed.startsWith('; wall_loops =')) {
                meta.shells = parseInt(trimmed.split('=')[1].trim(), 10);
            }

            // Thumbnail Extraction
            if (trimmed.startsWith('; thumbnail begin')) {
                inThumbnailBlock = true;
                continue;
            }
            if (trimmed.startsWith('; thumbnail end')) {
                inThumbnailBlock = false;
                continue;
            }

            if (inThumbnailBlock) {
                // Line content: ; <base64>
                const b64 = trimmed.replace(/^;\s*/, '');
                if (b64.length > 0) {
                    thumbnailB64 += b64;
                }
            }
        }

        let thumbnail: Buffer | null = null;
        if (thumbnailB64.length > 0) {
            try {
                const pngBuffer = Buffer.from(thumbnailB64, 'base64');
                const raw = await sharp(pngBuffer)
                    .resize(80, 60, {
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .ensureAlpha()
                    .raw()
                    .toBuffer({ resolveWithObject: true });

                thumbnail = BmpEncoder.encode(raw.info.width, raw.info.height, raw.data);
            } catch (e) {
                console.error('Failed to process thumbnail:', e);
                throw e;
            }
        }

        return { meta, thumbnail };
    }
}
