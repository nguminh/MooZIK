// Throwaway learning script. Run: node scratch-radio.js lofi
// Delete once the real provider exists.

const BASE = 'https://de1.api.radio-browser.info';

async function searchStations(name) {
	// 1. Build the URL. URLSearchParams escapes spaces/&/etc. for you.
	const params = new URLSearchParams({
		name,                    // what to search for
		limit: '25',             // autocomplete max is 25, so match it
		order: 'clickcount',     // most-listened first
		reverse: 'true',
		hidebroken: 'true',      // server-side filter for dead streams
	});
	const url = `${BASE}/json/stations/search?${params}`;

	// 2. Make the request. fetch() returns a Promise -> await it.
	const res = await fetch(url, {
		headers: { 'User-Agent': 'moozik-bot/1.0' },
	});

	// 3. fetch does NOT throw on 404/500 - you must check yourself.
	if (!res.ok) {
		throw new Error(`Radio Browser returned ${res.status} ${res.statusText}`);
	}

	// 4. Body arrives as a stream; .json() awaits + parses it.
	return res.json();
}

async function main() {
	const query = process.argv[2] || 'jazz';
	const stations = await searchStations(query);

	console.log(`Found ${stations.length} station(s) for "${query}"\n`);

	for (const s of stations.slice(0, 5)) {
		console.log(`  name         ${s.name.trim()}`);
		console.log(`  uuid         ${s.stationuuid}`);        // -> autocomplete value
		console.log(`  url_resolved ${s.url_resolved}`);       // -> what you feed ffmpeg
		console.log(`  country      ${s.country}`);
		console.log(`  codec/bitrate ${s.codec} ${s.bitrate}kbps`);
		console.log(`  lastcheckok  ${s.lastcheckok}`);        // 1 = alive at last check
		console.log('');
	}
}

main().catch((err) => {
	console.error('Request failed:', err.message);
	process.exitCode = 1;
});
