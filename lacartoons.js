/**
 * LACartoons Sora Local Scraper Module
 * Bypasses Cloudflare by running directly on your residential device connection
 */

const BASE_URL = "https://www.lacartoons.com";

/**
 * searchResults
 * Downloads the HTML search page directly on your device and extracts titles
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `${BASE_URL}/?s=${encodedKeyword}`;
        
        // Fetch the raw page HTML using Sora's native network layer
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const results = [];
        
        // Regex pattern to extract article links, images, and titles from the page HTML
        const articleRegex = /<article[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
        
        let match;
        while ((match = articleRegex.exec(html)) !== null) {
            const href = match[1];
            const img = match[2];
            // Remove any leftover HTML tags inside the title string
            const title = match[3].replace(/<[^>]*>/g, '').trim();

            if (href && title) {
                results.push({
                    title: title,
                    image: img || `${BASE_URL}/favicon.ico`,
                    href: href
                });
            }
        }

        return JSON.stringify(results);
        
    } catch (error) {
        console.log('Local search processing error:', error);
        return JSON.stringify([]);
    }
}

/**
 * extractDetails
 * Loads metadata descriptions for the active card layout
 */
async function extractDetails(url) {
    try {
        return JSON.stringify([{
            description: "Contenido disponible en LACartoons.",
            aliases: "Idioma: Español Latino",
            airdate: "Estado: Completo"
        }]);
    } catch (error) {
        return JSON.stringify([{ description: '', aliases: '', airdate: '' }]);
    }
}

/**
 * extractEpisodes
 * Passes the target page container directly down to the stream hook
 */
async function extractEpisodes(url) {
    try {
        return JSON.stringify([{ href: url, number: 1 }]);
    } catch (error) {
        return JSON.stringify([]);
    }
}

/**
 * extractStreamUrl
 * Grabs the direct video server frame from inside the webpage contents
 */
async function extractStreamUrl(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return null;

        // Finds the streaming iframe source container on the page
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
        const match = html.match(iframeRegex);
        
        if (match) {
            let src = match[1];
            if (src.startsWith('//')) src = 'https:' + src;
            return src;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Sora Environment Compatibility Layer
 */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);
    } catch(e) {
        try {
            const res = await fetch(url, options);
            return await res.text();
        } catch(error) {
            return null;
        }
    }
}
