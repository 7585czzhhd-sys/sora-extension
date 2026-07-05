/**
 * LACartoons Ultimate Brute-Force Local Scraper
 * Bypasses all strict structural layout assumptions
 */

const BASE_URL = "https://www.lacartoons.com";

/**
 * searchResults
 * Blindly grabs any image and link combo matching the keyword
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `${BASE_URL}/?s=${encodedKeyword}`;
        
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const results = [];
        
        // Strategy 1: Find every standard text/image link element on the page broadly
        const genericLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        
        while ((match = genericLinkRegex.exec(html)) !== null) {
            const href = match[1];
            const content = match[2];
            
            // Extract text content and clean out internal tags
            const cleanText = content.replace(/<[^>]*>/g, '').trim();
            
            // Check if either the URL link or the visible text matches your keyword
            if (href.toLowerCase().includes(keyword.toLowerCase()) || cleanText.toLowerCase().includes(keyword.toLowerCase())) {
                if (href === BASE_URL || href.includes('/?s=') || href.includes('wp-content')) continue;

                // Try to find an image tag buried near or inside that link
                const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
                const imgMatch = content.match(imgRegex);
                const finalImg = imgMatch ? imgMatch[1] : `${BASE_URL}/favicon.ico`;

                results.push({
                    title: cleanText || 'Ver Contenido',
                    image: finalImg,
                    href: href
                });
            }
        }

        // Remove exact duplicate links
        const uniqueResults = Array.from(new Map(results.map(item => [item.href, item])).values());
        return JSON.stringify(uniqueResults);
        
    } catch (error) {
        console.log('Brute search error:', error);
        return JSON.stringify([]);
    }
}

/**
 * extractDetails
 */
async function extractDetails(url) {
    return JSON.stringify([{
        description: "Contenido de Series de Animación de LACartoons.",
        aliases: "Idioma: Español Latino",
        airdate: "Estado: Activo"
    }]);
}

/**
 * extractEpisodes
 */
async function extractEpisodes(url) {
    return JSON.stringify([{ href: url, number: 1 }]);
}

/**
 * extractStreamUrl
 */
async function extractStreamUrl(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return null;

        // Searches blindly for ANY standard iframe source on the page layout
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
