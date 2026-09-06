const { SlashCommandBuilder } = require('discord.js');
const { radioApi } = require('../../config.json');

async function getCountry(country) {
    // const params = URLSearchParams({
    //     name
    // });
	const url = `${radioApi}/json/countries/${country || ''}`;

	const res = await fetch(url, {
		headers: { 'User-Agent': 'moozik-bot/1.0' },
	});

	if (!res.ok) {
		throw new Error(`Radio Browser returned ${res.status} ${res.statusText}`);
	}

	return res.json();
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('country')
		.setDescription('All countries that has a radio station.')
		.addStringOption((option) => option.setName('name').setDescription('Filter a country').setRequired(false)),
	async execute(interaction) {
		const query = interaction.options.getString('name', false);

		await interaction.deferReply();

		try {
			const countries = await getCountry(query);

			if (countries.length === 0) {
				await interaction.editReply(`No country with name "${query}" was found.`);
				return;
			}

			const lines = countries.map((s) => [
                `name: ${s.name}`,
                `code: ${s.iso_3166_1}`,
                `"stationcount: ${s.stationcount}"`,
			].join('\n'));

			await interaction.editReply(lines.join('\n\n'));
		}
		catch (error) {
			await interaction.editReply(
				`There was an error while searching the name \`${query}\`:\n\`${error.message}\``,
			);
		}
	},
};