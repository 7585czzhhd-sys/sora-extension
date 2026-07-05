const BASE_URL = "https://www.lacartoons.com";

/**
 * Search content
 * @returns {Promise<string>} - JSON array string: [{title, image, href}, ...]
 */
export async function searchResults(keyword) {
    try {
        // Enforce URL encoding for spaces and special characters in search terms
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(keyword)}`;
        const response = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (!response.ok) return JSON.stringify([]);
        const html = await response.text();

        const results = [];
        // Matches typical cartoon entry structures on WordPress/Streaming sites
        const articleRegex = /<article[^>]*>[\s\S]*?href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][\s\S]*?src=["']([^"']+)["']/gi;
        
        let match;
        while ((match = articleRegex.exec(html)) !== null) {
            results.push({
                title: match[2].trim(),
                image: match[3],
                href: match[1]
            });
        }

        return JSON.stringify(results);
    } catch (error) {
        console.error("[LACartoons] Search failed:", error);
        return JSON.stringify([]);
    }
}

/**
 * Extract item details
 * @returns {Promise<string>} - JSON string: {description, aliases, airdate}
 */
export async function extractDetails(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return JSON.stringify({});
        const html = await response.text();

        // Extract description from meta tags or post content
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) || html.match(/<p>([\s\S]*?)<\/p>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "No description available.";

        return JSON.stringify({
            description: description,
            aliases: "",
            airdate: ""
        });
    } catch (error) {
        return JSON.stringify({});
    }
}

/**
 * Extract episodes
 * @returns {Promise<string>} - JSON array string: [{href, number}, ...]
 */
export async function extractEpisodes(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return JSON.stringify([]);
        const html = await response.text();

        const episodes = [];
        // Regex looks for episode/video anchors linked inside the grid or list layouts
        const epRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?Capitulo\s*\d+|[\s\S]*?Episode\s*\d+[^<]*)<\/a>/gi;

        let match;
        let count = 1;
        while ((match = epRegex.exec(html)) !== null) {
            episodes.push({
                href: match[1],
                number: count++
            });
        }

        // If no structured list matches, fallback to returning the main URL as episode 1
        if (episodes.length === 0) {
            episodes.push({ href: url, number: 1 });
        }

        return JSON.stringify(episodes);
    } catch (error) {
        return JSON.stringify([]);
    }
}

/**
 * Get stream URL
 * @returns {Promise<string|object>} - Multi-server streams object
 */
export async function extractStreamUrl(url) {
    try {
        const response = await fetch(url, {
            headers: { 'Referer': BASE_URL }
        });
        if (!response.ok) return JSON.stringify({ streams: [] });
        const html = await response.text();

        const streams = [];

        // 1. Gather iframe mirrors
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
        let match;
        while ((match = iframeRegex.exec(html)) !== null) {
            let src = match[1];
            if (src.startsWith('//')) src = 'https:' + src;
            if (src.startsWith('/')) src = BASE_URL + src;

            let name = "External Mirror";
            if (src.includes("vidhide")) name = "VidHide";
            if (src.includes("streamtape")) name = "StreamTape";
            if (src.includes("fembed")) name = "Fembed";

            streams.push({
                title: name,
                streamUrl: src,
                headers: { "Referer": BASE_URL }
            });
        }

        // 2. Gather raw source direct streams if available
        const scriptVideoRegex = /file\s*:\s*["'](http[s]?:\/\/[^"']+)["']/gi;
        while ((match = scriptVideoRegex.exec(html)) !== null) {
            streams.push({
                title: "Direct Stream",
                streamUrl: match[1],
                headers: { "Referer": BASE_URL }
            });
        }

        return {
            streams: streams
        };
    } catch (error) {
        return { streams: [] };
    }
}
