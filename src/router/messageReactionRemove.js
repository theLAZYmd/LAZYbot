module.exports = (client, messageReaction, user) => {
	if (user.bot) return;
	client.emit('messageReactionAdd', messageReaction, user);
};