export interface GifResult {
    id: string;
    slug: string;
    title: string;
    url: string;
    preview: string;
    width: number;
    height: number;
}

export interface GifsResponse {
    results: GifResult[];
    next: string | null;
}

export interface GifTagsResponse {
    tags: { name: string; preview: string }[];
}

export function resolveGifSendUrl(gif: GifResult): string {
    const isKlipy = gif.url.includes("klipy.com") || gif.slug;
    return isKlipy ? `https://klipy.com/gifs/${gif.slug}` : gif.url;
}

export const GIF_ONLY_URL_PATTERN =
    /^https?:\/\/(klipy\.com\/gifs\/|tenor\.com\/|c\.tenor\.com\/|media\.tenor\.com\/|giphy\.com\/|media\.giphy\.com\/|i\.giphy\.com\/|imgur\.com\/|i\.imgur\.com\/|redgifs\.com\/|.*\.gif(\?\S*)?$)\S*$/i;

export function isGifOnlyContent(
    content: string | null | undefined,
    hasGifEmbed: boolean,
): boolean {
    return (
        hasGifEmbed &&
        !!content &&
        GIF_ONLY_URL_PATTERN.test(content.trim()) &&
        content.trim().split(/\s+/).length === 1
    );
}

export const MESSAGE_GIF_MAX_WIDTH = 400;
export const MESSAGE_GIF_MAX_HEIGHT = 300;
export const MESSAGE_GIF_HORIZONTAL_INSET = 142;

export function computeContainedSize(
    naturalWidth: number,
    naturalHeight: number,
    maxWidth: number,
    maxHeight: number,
) {
    if (!naturalWidth || !naturalHeight) {
        return {
            width: maxWidth,
            height: Math.min(Math.round(maxWidth * 0.56), maxHeight),
        };
    }

    const scale = Math.min(
        maxWidth / naturalWidth,
        maxHeight / naturalHeight,
        1,
    );

    return {
        width: Math.max(1, Math.round(naturalWidth * scale)),
        height: Math.max(1, Math.round(naturalHeight * scale)),
    };
}

export function getMessageGifMaxWidth(windowWidth: number) {
    return Math.min(
        windowWidth - MESSAGE_GIF_HORIZONTAL_INSET,
        MESSAGE_GIF_MAX_WIDTH,
    );
}

