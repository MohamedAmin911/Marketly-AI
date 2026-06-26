/**
 * Adapter service to convert Growth Engine data to Image Generation format
 */

import type { GrowthProjectRecord } from "@/features/growth-engine/types";

export type ImageGenerationPreset = {
    prompt: string;
    context: {
        brandName: string;
        campaign: string;
        scene: string;
    };
};

/**
 * Generate image generation prompts from storyboard scenes
 */
export function generateImagePromptsFromStoryboards(
    project: GrowthProjectRecord | null
): ImageGenerationPreset[] {
    if (!project?.storyboards?.length) {
        return [];
    }

    const presets: ImageGenerationPreset[] = [];

    project.storyboards.forEach((board, campaignIdx) => {
        const scenes = Array.isArray(board) ? board : [board];

        scenes.forEach((scene, sceneIdx) => {
            const s = scene as Record<string, unknown>;
            const sceneTitle = s.sceneTitle ?? s.title ?? `Scene ${sceneIdx + 1}`;
            const imagePrompt = s.imagePrompt ?? s.script ?? s.description ?? "";
            const campaign = project.campaigns?.[campaignIdx] as Record<string, unknown>;
            const campaignTitle = campaign?.title ?? campaign?.name ?? `Campaign ${campaignIdx + 1}`;

            // Build comprehensive prompt for image generation
            const brandContext = project.brandName ? `Brand: ${project.brandName}` : "";
            const campaignContext = `Campaign: ${campaignTitle}`;
            const sceneContext = `Scene: ${sceneTitle}`;

            const prompt = [
                brandContext,
                campaignContext,
                sceneContext,
                "",
                "Image Description:",
                imagePrompt,
                "",
                "Requirements:",
                "- Photorealistic quality",
                "- Professional advertising style",
                "- Commercial photography",
                "- Brand-aligned aesthetic",
                "- High detail and clarity",
            ]
                .filter(Boolean)
                .join("\n");

            presets.push({
                prompt,
                context: {
                    brandName: project.brandName,
                    campaign: String(campaignTitle),
                    scene: String(sceneTitle),
                },
            });
        });
    });

    return presets;
}

/**
 * Get the primary scene for image generation (usually first scene of first campaign)
 */
export function getPrimaryImageGenerationPreset(
    project: GrowthProjectRecord | null
): ImageGenerationPreset | null {
    const presets = generateImagePromptsFromStoryboards(project);
    return presets.length > 0 ? presets[0] : null;
}

/**
 * Create a URL-friendly encoded state for passing to Creator Studio
 */
export function encodeImageGenerationState(preset: ImageGenerationPreset): string {
    return btoa(JSON.stringify(preset));
}

/**
 * Decode state from URL parameter
 */
export function decodeImageGenerationState(encoded: string): ImageGenerationPreset | null {
    try {
        return JSON.parse(atob(encoded));
    } catch {
        return null;
    }
}
