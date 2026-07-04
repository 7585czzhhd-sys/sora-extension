class LACartoonsExtension {
    constructor() {
        this.name = "LACartoons";
        this.baseUrl = "https://www.lacartoons.com";
    }

    async extractEpisode(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const html = await response.text();

            const titleMatch = html.match(/<h1>(.*?)<\/h1>/i);
            const title = titleMatch ? titleMatch[1].trim() : "Unknown Episode";

            const streams = [];

            const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
            let match;
            while ((match = iframeRegex.exec(html)) !== null) {
                let src = match[1];
                if (src.startsWith('//')) src = 'https:' + src;
                if (src.startsWith('/')) src = this.baseUrl + src;

                streams.push({
                    name: this.determineSource(src),
                    url: src,
                    type: "embed"
                });
            }

            const scriptVideoRegex = /file\s*:\s*["'](http[s]?:\/\/[^"']+)["']/gi;
            while ((match = scriptVideoRegex.exec(html)) !== null) {
                streams.push({
                    name: "Direct Stream",
                    url: match[1],
                    type: "direct"
                });
            }

            return {
                title: title,
                originalUrl: url,
                streams: streams
            };

        } catch (error) {
            console.error(`[LACartoons] Extraction failed:`, error);
            return null;
        }
    }

    determineSource(url) {
        if (url.includes("vidhide")) return "VidHide";
        if (url.includes("streamtape")) return "StreamTape";
        if (url.includes("fembed")) return "Fembed";
        return "External Mirror";
    }
}

export default new LACartoonsExtension();
