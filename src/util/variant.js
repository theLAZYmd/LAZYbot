const config = require('../config.json');
const AC = require('lazy-aho-corasick');
let sources = new AC(Object.keys(config.sources));
let variants = new AC(Object.keys(config.variants));

module.exports = async (content, channel, args, argsInfo) => {
	try {
		const active = /-a|--active/gi.test(content.toLowerCase());												//Checks if 'active' flag should be set if content contained active flag
		let source = sources.search(content.replace(/[^a-z]/gi, '').toLowerCase(), {return: 'first'});			//looks for all occurrences of source names in the message
		let variant = variants.search(content.toLowerCase(), {return: 'first'});								//looks for all occurrences of variant names in the mesage
		let cvariant = variants.search((channel.name || '').toLowerCase(), {return: 'first'}) || variants.search((channel.topic || '').toLowerCase(), {return: 'first'});	//checks to see if the channel matches a variant
		if (!variant && !cvariant) throw 'Couldn\'t find matching variant';										//if no variants have been found in the message or name, sets it equal to null
		if (variant && cvariant && variant !== cvariant) throw 'Wrong channel to summon this leaderboard!';		//if user specifically tries to call a leaderboard for a variant in a different channel, sends them an error
		variant = config.variants[variant || cvariant];															//renders foundString to a variant object
		if (source) source = config.sources[source];															//renders sourceString to a source object
		if (source && !variant[source.key]) throw `Variant ${variant.name} is not played on ${source.name}`;	//if user explicitly specified a source and that source is incompatible with the variant, throws an error
		if (!source) source = Object.values(config.sources).find(s => variant[s.key]);							//otherwise finds a default source for that variant
		return {variant, source, active, argsInfo};
	} catch (e) {
		if (e) throw e;
	}
};