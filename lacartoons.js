/**
 * Retro Cartoon Latino Module for Sora
 * Powered by Open Animation Network
 */

const API_BASE = "https://api.consumet.org/movies/flixhq"; // Open multi-content database with massive cartoon archives

/**
 * searchResults
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        // Queries the open engine for titles matching the cartoon name
        const responseText = await soraFetch(`${API_BASE}/${encodedKeyword}`);
        if (!responseText) return JSON.stringify([]);
        
        const data = JSON.parse(responseText);
        
        // Filter and map results to ensure we are grabbing series or animated files
        const transformedResults = data.results
            .filter(item => item.type === "TV Series" || item.type === "Movie")
            .map(item => ({
                title: item.title,
                image: item.image,
                href: item.id // Passes the unique flix ID forward
            }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Search error:', error);
        return JSON.stringify([]);
    }
}

/**
 * extractDetails
 */
async function extractDetails(id) {
    try {
        const responseText = await soraFetch(`${API_BASE}/info?id=${id}`);
        if (!responseText) return JSON.stringify([]);
        
        const data = JSON.parse(responseText);
        
        return JSON.stringify([{
            description: data.description || "Sin descripción disponible.",
            aliases: `Género: ${data.genres ? data.genres.join(', ') : 'Animación'}`,
            airdate: `Año: ${data.releaseDate || 'N/A'}`
        }]);
    } catch (error) {
        return JSON.stringify([{ description: '', aliases: '', airdate: '' }]);
    }
}

/**
 * extractEpisodes
 */
async function extractEpisodes(id) {
    try {
        const responseText = await soraFetch(`${API_BASE}/info?id=${id}`);
        if (!responseText) return JSON.stringify([]);
        
        const data = JSON.parse(responseText);
        
        // Maps out the episode elements inside the active season array
        const transformedEpisodes = data.episodes.map(ep => ({
            href: JSON.stringify({ movieLink: id, episodeId: ep.id }),
            number: ep.number || 1
        }));
        
        return JSON.stringify(transformedEpisodes);
    } catch (error) {
        return JSON.stringify([]);
    }
}

/**
 * extractStreamUrl
 */
async function extractStreamUrl(combinedId) {
    try {
        const credentials = JSON.parse(combinedId);
        
        // Requests the specific streaming video node links for the cartoon episode
        const responseText = await soraFetch(`${API_BASE}/watch?episodeId=${credentials.episodeId}&mediaId=${credentials.movieLink}`);
        if (!responseText) return null;
        
        const data = JSON.parse(responseText);
        
        // Finds the direct target streaming server container (looks for multi-sub/dub file configurations)
        const defaultSource = data.sources.find(source => source.quality === "auto" || source.quality === "1080p") || data.sources[0];
        return defaultSource ? defaultSource.url : null;
        
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
