/** * LACartoons Sora Module
 * Re-architected with independent DOM property fallback parsing
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

        // Pattern 1: Target common clean anchor layouts with titles and nested thumbnails
        const cardRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/gi;
        let match;
        while ((match = cardRegex.exec(html)) !== null) {
            results.push({
                title: match[3].trim(),
                image: match[2],
                href: match[1]
            });
        }

        // Pattern 2 Fallback: If layout mapping fails, parse generic title headers + links raw
        if (results.length === 0) {
            // Catches standard headers or specific post link structures
            const linkRegex = /href=["']([^"']+)["'][^>]*title=["']([^"']+)["']/gi;
            while ((match = linkRegex.exec(html)) !== null) {
                // Ignore structural framework links (privacy pages, home, etc.)
                if (match[1].includes('/category/') || match[1] === BASE_URL || match[1] === `${BASE_URL}/`) continue;
                
                results.push({
                    title: match[2].trim(),
                    image: "https://www.lacartoons.com/favicon.ico",
                    href: match[1]
                });
            }
        }

        // Pattern 3 Final Fallback: Parse generic textual links if titles are buried in child nodes
        if (results.length === 0) {
            const basicRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
            while ((match = basicRegex.exec(html)) !== null) {
                const titleText = match[2].trim();
                if (titleText.length > 3 && !match[1].includes('/tag/') && !match[1].includes('/category/')) {
                    results.push({
                        title: titleText,
                        image: "https://www.lacartoons.com/favicon.ico",
                        href: match[1]
                    });
                }
            }
        }

        // De-duplicate results matching the exact same target link
        const uniqueResults = Array.from(new Map(results.map(item => [item.href, item])).values());
        return JSON.stringify(uniqueResults);

    } catch (error) {
        console.log('Search parser error:', error);
        return JSON.stringify([]);
    }
}

/** extractDetails
 * Extracts overview information.
 */
async function extractDetails(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) || html.match(/<p>([\s\S]*?)<\/p>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "LACartoons Content";

        return JSON.stringify([{
            description: description,
            aliases: "Language: Español (Latino)",
            airdate: "Status: Active"
        }]);
    } catch (error) {
        return JSON.stringify([{ description: 'LACartoons Content', aliases: '', airdate: '' }]);
    }
}

/** extractEpisodes
 * Gathers target stream index arrays.
 */
async function extractEpisodes(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const episodes = [];
        // Matches classic streaming link lists
        const epRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?Cap[ií]tulo\s*\d+|[\s\S]*?Episode\s*\d+[^<]*)<\/a>/gi;

        let match;
        let count = 1;
        while ((match = epRegex.exec(html)) !== null) {
            episodes.push({
                href: match[1],
                number: count++
            });
        }

        if (episodes.length === 0) {
            episodes.push({ href: url, number: 1 });
        }

        return JSON.stringify(episodes);
    } catch (error) {
        return JSON.stringify([]);
    }
}

/** extractStreamUrl
 * Resolves source strings for the media framework.
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
