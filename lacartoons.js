/** * LACartoons Sora Module
 * Optimized with flexible web-scraping fallbacks
 */

const BASE_URL = "https://www.lacartoons.com";

/** searchResults
 * Searches for cartoons based on a keyword.
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const html = await soraFetch(`${BASE_URL}/?s=${encodedKeyword}`);
        if (!html) return JSON.stringify([]);

        const results = [];
        
        // A much broader regex that looks for any link containing an image and a title/alt tag inside standard search result layouts
        const broadRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/gi;
        
        let match;
        while ((match = broadRegex.exec(html)) !== null) {
            results.push({
                title: match[3].trim(),
                image: match[2],
                href: match[1]
            });
        }

        // Fallback layout check if the site uses standalone titles next to images
        if (results.length === 0) {
            const fallbackRegex = /<h[23][^>]*><a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a><\/h[23]>/gi;
            while ((match = fallbackRegex.exec(html)) !== null) {
                results.push({
                    title: match[2].trim(),
                    image: "https://www.lacartoons.com/favicon.ico", // Fallback thumbnail if image matches fail
                    href: match[1]
                });
            }
        }

        return JSON.stringify(results);
    } catch (error) {
        console.log('Search error:', error);
        return JSON.stringify([]);
    }
}

/** extractDetails
 * Extracts description data from the series page.
 */
async function extractDetails(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) || html.match(/<p>([\s\S]*?)<\/p>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "LACartoons Series";

        const transformedResults = [{
            description: description,
            aliases: "Language: Spanish",
            airdate: "Status: Available"
        }];
        
        return JSON.stringify(transformedResults);
    } catch (error) {
        return JSON.stringify([{ description: 'LACartoons Series', aliases: '', airdate: '' }]);
    }
}

/** extractEpisodes
 * Gathers the lists of individual stream links/episodes.
 */
async function extractEpisodes(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const episodes = [];
        
        // Looks for links that contain text like "Capitulo", "Capítulo", or "Episode"
        const epRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?Cap[ií]tulo\s*\d+|[\s\S]*?Episode\s*\d+[^<]*)<\/a>/gi;

        let match;
        let count = 1;
        while ((match = epRegex.exec(html)) !== null) {
            episodes.push({
                href: match[1],
                number: count++
            });
        }

        // Fallback: If no distinct episode anchors match, treat the source page itself as the player video container
        if (episodes.length === 0) {
            episodes.push({ href: url, number: 1 });
        }

        return JSON.stringify(episodes);
    } catch (error) {
        return JSON.stringify([]);
    }
}

/** extractStreamUrl
 * Grabs embed strings or direct media links.
 */
async function extractStreamUrl(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return null;

        // Extract raw iframe players
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
        const match = html.match(iframeRegex);
        
        if (match) {
            let src = match[1];
            if (src.startsWith('//')) src = 'https:' + src;
            return src;
        }
        
        const scriptVideoRegex = /file\s*:\s*["'](http[s]?:\/\/[^"']+)["']/i;
        const fileMatch = html.match(scriptVideoRegex);
        return fileMatch ? fileMatch[1] : null;

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
