module.exports = async(client, event) => {
    if (event.t === "MESSAGE_REACTION_ADD") return await messageReactionAdd(client, event);
    return;
}

function messageReactionAdd(client, event) {
    let data = event.d;
    let user = client.users.get(data.user_id);
    let channel = client.channels.get(data.channel_id) || await user.createDM();
    if (channel.messages.has(data.message_id)) return;
    let message = await channel.fetchMessage(data.message_id);
    let emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    let reaction = message.reactions.get(emojiKey);
    client.emit("messageReactionAdd", reaction, user);
}