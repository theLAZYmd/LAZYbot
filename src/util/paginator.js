const Parse = require("./parse.js");

class Paginator extends Parse {
  constructor(message) {
    super(message);
  }

  /*VALID INPUTS FOR PAGINATOR

  Paginator takes an embed an adds ⬅ ➡ reactions to it. When these are clicked, a message is edited with another (similar looking embed)
  i.e. the 'second page' of that embed.

  Paginator takes input arguments of the constructor and method to purely produce a page embed.
  That method must take no input values except page.
  Both constructor and method are used because method might draw on inputs from constructor to function.

  Third inpute is the maximum number of pages on the function. Needed to create the footer.
  
  Fourth input is the time period to await ⬅ ➡ reactions.
  Can be modified in the future to use client.on('MessageReaction', () => {}) instead of .awaitReactions

  When paginator is triggered, it loads page 0 of the series.
  Upon MessageReaction, it changes the pagecount to either ++ or -- and calls the given Constructor.method() to return an embed.
  If a null value is returned, this must be because the maxpages value for that series is exceeded (i.e. trying to call the 3rd page when there are only 2).
  If null value therefore, the pagecount is lowered again. Otherwise, the original message is edited with the new embed.
  */

}

module.exports = Paginator;