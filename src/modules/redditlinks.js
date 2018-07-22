const Output = 

class redditlinks {

  static link(message) {
    let subreddits = message.content.match(/^|\b\/*r\/([a-z]{2,21})/gi);
    for(let i = 0; i < subreddits.length; i++) {
      Output.generic(`[${subreddits[i]}](http://www.reddit.com/r/${subreddits[i]})`)
    }
  }

}