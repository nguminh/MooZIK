const { SlashCommandBuilder } = require('discord.js');
const { radioApi } = require('../../config.json');

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

async function searchStations(name, country, orderBy) {
	if (orderBy != null) {
		orderBy = orderBy.toLowerCase();
	}
	if (orderBy != 'votes' && orderBy != 'clickcount') {
		orderBy = 'clickcount';
	}
	const params = new URLSearchParams({
		name: name ? name : '',                    // what to search for
		country: capitalizeFirstLetter(country),
		limit: '25',             // autocomplete max is 25, so match it
		order: orderBy,     // most-listened first
		reverse: 'true',
		hidebroken: 'true',      // server-side filter for dead streams
	});
	const url = `${radioApi}/json/stations/search?${params}`;

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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search radio stations by name and/or country.')
		.addStringOption((option) => option.setName('name').setDescription('The term to search radio stations with.').setRequired(false))
		.addStringOption((option) => option.setName('country').setDescription('The country to filter the search by.').setRequired(false))
		.addStringOption((option) => option.setName('order-by').setDescription(`Order by 'vote' or by 'clickcount.`).setRequired(false)),
	async execute(interaction) {
		const name = interaction.options.getString('name');
		const country = interaction.options.getString('country');
		const orderBy = interaction.options.getString('order-by');

		if (!name && !country) {
			await interaction.reply({
				content: "Enter at least one of 'name' or 'country'.",
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		try {
			const stations = await searchStations(name, country, orderBy);

			if (stations.length === 0) {
				await interaction.editReply(`No stations found for search term "${name ? name : ''}" or country "${country ? country : ''}".`);
				return;
			}

			const lines = stations.slice(0, 10).map((s) => [
				`${s.name.trim()}`,
				`location: ${s.country || 'N/A'}, ${s.state || 'N/A'}`,
				`language: ${s.language || 'N/A'}`,
				`votes: ${s.votes}`,
				`homepage: <${s.homepage || 'N/A'}>`,
				`codec: ${s.codec || 'N/A'} ${s.bitrate}kbps`,
				`stream: <${s.url_resolved}>`,
			].join('\n'));

			await interaction.editReply(
				`Found ${stations.length} station(s) for "${name}":\n\n${lines.join('\n\n')}`,
			);
		}
		catch (error) {
			await interaction.editReply(
				`There was an error while searching the term \`${name}\`:\n\`${error.message}\``,
			);
		}
	},
};