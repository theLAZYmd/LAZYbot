class Leaderboard {
    
  getDatabase (page, fromPaginator) {
    let tally = DataManager.getData();
    let array = [];
    for(let i = 1; i < 10; i++) {
      let medal = "";
      if(i === 1) medal = " :first_place:";
      if(i === 2) medal = " :second_place:";
      if(i === 3) medal = " :third_place:";
      array[i - 1] = [];
      array[i - 1][0] = `${tally[i].username}`;
      array[i - 1][1] = (tally[i].bidamount ? tally[i].bidamount : 0) + " :cherry_blossom:" + medal;
    } //generate standard double array used for Embed.leaderboard()
	  let embed = Embed.leaderboard(array, page);
    embed.title = `${this.Search.emojis.get("thehouse")} House Database Positions`;
    embed.footer = Embed.footer(`... dbpositions to see how this all works. ${tally.length - 1} positions available.`);
    if(fromPaginator) return embed; //Constructor, method, embed, maxpages, timeout on pages
    else this.Output.paginator(this, "getDatabase", embed, Math.ceil((tally.length - 1) / 9), 30000);
  }

  getTrivia (page) {
    let arrdatasort = [];
    let _tally = DataManager.getData();
    _tally.sort(function compare(a, b) {
      return (b.triviarating || 1500) - (a.triviarating || 1500);
    });
    for(let i = 0; i < tally.length; i++) {
      if(!tally[i].triviagames || tally[i].triviagames === 0) {
        _tally.remove(i)
      }
    }
    let embed = {
      title: "Trivia Leaderboard",
      color: 53380
    };
    if(args.length === 0) {
      for(let i = 0; i < arrdatasort.length; i++) {
        if(!arrdatasort[i].triviaprovisional) {
          continue;
        } else {
          x++;
          embed.description += `#${i} **${arrdatasort[i].username}** ${arrdatasort[i].triviarating || 1500} ${x < 10 ? "\n" : ""}`
        }
        if(i === 10) break;
      }
    } else
    if(args[0] === 'provisional' || args[0] === 'prov') {
      for(let i = 0; i < arrdatasort.length; i++){
        embed.description += `#${i} **${arrdatasort[i].username}** ${arrdatasort[i].triviarating || 1500}${!arrdatasort[i].triviaprovisional ? "?" : ""} ${x < 10 ? "\n" : ""}`;
        if(i === 10) break;
      }
    }
	  Embed.sender(embed);
  }

  getTriviaRank () {
    this.member = this.args.length === 1 ? this.Search.members.get(this.Search.users.get(this.args[0])) : this.member; 
    Embed.sender({
      title: "Trivia Rating",
      description: `**${this.dbuser.username}** ${this.dbuser.triviarating}${this.dbuser.triviaprovisional ? "" : "?"}`
    });
  }



}