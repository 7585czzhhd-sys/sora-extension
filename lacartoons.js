/** * LACartoons Sora Module
 * Powered by your personal Vercel API Mirror
 */

// Your live Vercel base endpoint
const API_URL = "https://lacartoons-api.vercel.app/api";

/** searchResults
 * Connects directly to your Vercel serverless function
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        
        // Hits your Vercel API mirror to get clean, structured JSON
        const responseText = await soraFetch(`${API_URL}/search?keyword=${encodedKeyword}`);
        if (!responseText) return JSON.stringify([]);
        
        const data = JSON.parse(responseText);
        
        // Formats the data perfectly into what Sora expects
        const transformedResults = data.animes.map(anime => ({
            title: anime.name,
            image: anime.img,
            href: `https://www.lacartoons.com/${anime.id}`
        }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('API Search error:', error);
        return JSON.stringify([]);
    }
}

/** extractDetails
 * Fallback placeholders for series structure
 */
async function extractDetails(url) {
    try {
        return JSON.stringify([{
            description: "Contenido de LACartoons",
            aliases: "Idioma: Español Latino",
            airdate: "Estado: Activo"
        }]);
    } catch (error) {
        return JSON.stringify([{ description: '', aliases: '', airdate: '' }]);
    }
}

/** extractEpisodes
 * Returns the current link container as the target stream link
 */
async function extractEpisodes(url) {
    try {
        return JSON.stringify([{ href: url, number: 1 }]);
    } catch (error) {
        return JSON.stringify([]);
    }
}

/** extractStreamUrl
 * Scrapes standard iframe sources directly from the page hook
 */
async function extractStreamUrl(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return null;

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

/** * Sora Environment Compatibility Layer
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
