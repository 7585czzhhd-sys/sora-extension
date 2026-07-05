/** * LACartoons Sora Module
 * Built using the Soru/Sora custom fetch runtime template
 */

const BASE_URL = "https://www.lacartoons.com";

/** searchResults
 * Searches for cartoons based on a keyword using Sora's network wrapper.
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        // soraFetch returns the raw HTML string directly
        const html = await soraFetch(`${BASE_URL}/?s=${encodedKeyword}`);
        if (!html) return JSON.stringify([]);

        const results = [];
        // WordPress / web-scraping regex to pull matching posts
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
        console.log('Search error:', error);
        return JSON.stringify([]);
    }
}

/** extractDetails
 * Extracts details from the cartoon's main overview page.
 */
async function extractDetails(url) {
    try {
        const html = await soraFetch(url);
        if (!html) return JSON.stringify([]);

        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) || html.match(/<p>([\s\S]*?)<\/p>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "No description available.";

        const transformedResults = [{
            description: description,
            aliases: "Language: Spanish",
            airdate: "Status: Available"
        }];
        
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{ description: 'Error loading details', aliases: '', airdate: '' }]);
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
        // Scrapes anchors targeting streaming lists or specific player endpoints
        const epRegex = /<a[^+]+href=["']([^"']+)["'][^>]*>([\s\S]*?Capitulo\s*\d+|[\s\S]*?Episode\s*\d+[^<]*)<\/a>/gi;

        let match;
        let count = 1;
        while ((match = epRegex.exec(html)) !== null) {
            episodes.push({
                href: match[1],
                number: count++
            });
        }

        // Fallback: If no distinct grid links match, treat the source page as Episode 1
        if (episodes.length === 0) {
            episodes.push({ href: url, number: 1 });
        }

        return JSON.stringify(episodes);
    } catch (error) {
        console.log('Episodes error:', error);
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

        // Hunt down embedded standard iframe player sources
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
        const match = html.match(iframeRegex);
        
        if (match) {
            let src = match[1];
            if (src.startsWith('//')) src = 'https:' + src;
            return src;
        }
        
        // Secondary fallback for raw media source allocations
        const scriptVideoRegex = /file\s*:\s*["'](http[s]?:\/\/[^"']+)["']/i;
        const fileMatch = html.match(scriptVideoRegex);
        return fileMatch ? fileMatch[1] : null;

    } catch (error) {
        console.log('Stream fetch error:', error);
        return null;
    }
}

/** * Sora Environment Compatibility Layer
 * Intercepts network calls safely via Sora's underlying native platform hook
 */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);
    } catch(e) {
        try {
            const res = await fetch(url, options);
            return await res.text();
        } catch(error) {
            console.log('soraFetch native fallback error: ' + error.message);
            return null;
        }
    }
}
