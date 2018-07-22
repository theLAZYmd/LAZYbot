class Paginator {

  static paginator(paginatedpage, maxpages, period) {
    let page = 0;
    paginatedpage.footer = paginatedpage.footer && maxpages === 1 ? paginatedpage.footer : embedfooter(`${page + 1} / ${maxpages}`);
    message.channel.send(paginatedpage.content, {embed: paginatedpage})
    .then(paginatedmessage => {
      if(maxpages < 2) return;
      let reactionsfilter = (reaction, user) => (reaction.emoji.name === "⬅" || reaction.emoji.name === "➡") && !user.bot;
      let pagetracker = 0;
      paginatedmessage.react("⬅");
      setTimeout(() => {
        paginatedmessage.react("➡");
      }, 500);
      let collector = paginatedmessage.createReactionCollector(reactionsfilter, {
        "time": period
      })
      collector.on("collect", (collected) => {
        for(let [key, value] of collected.users) {
          let user = getuser(message.guild, key);
          if(!user.bot) collected.remove(user);
        };
        if(collected.emoji.name === "➡") {
          if(page + 1 >= maxpages) return;
          page++;
          functionname.replace("page", page);
          let evaluated = eval(functionname);
          if(evaluated) [paginatedpage, maxpages] = evaluated;
          paginatedpage.footer = embedfooter(`${page + 1} / ${maxpages}`);
          paginatedmessage.edit(paginatedpage.content, {embed: paginatedpage})
        };
        if(collected.emoji.name === "⬅") {
          if(page - 1 < 0) return;
          page--;
          functionname.replace("page", page); 
          let evaluated = eval(functionname);
          if(evaluated) [paginatedpage, maxpages] = evaluated;
          paginatedpage.footer = embedfooter(`${page + 1} / ${maxpages}`);
          paginatedmessage.edit({embed: paginatedpage})
        };
      });
      collector.on("end", (collected) => {
        paginatedmessage.clearReactions()
      })
    })
    .catch(`Some error somewhere.`);
  }

}