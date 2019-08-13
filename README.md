# LAZYbot

Discord bot operating in [the House server](http://dscrd.me/housechessvariants), servicing over 1,300 members [March 2019].
Written in Node.JS.
Currently not available on multiple servers.

This bot has also spawned off [LAZYmail](https://github.com/theLAZYmd/LAZYbot/tree/modmail), a version of the bot with just the below-mentioned ModMail module. This is in use in the official [IBO Discord server](https://discord.gg/IBO) and services over 13,800 members [March 2019]. 

### Hosting
- **Provider:** Amazon EC2 Instance
- **Region:** eu-west-2a
- **Instance Type:** t2.small
- **OS:** Windows (for now)
- **Running Cost:** £0.28 [November 2018]

### Highlights
- [Election module](https://github.com/theLAZYmd/LAZYbot/tree/master/src/modules/Election/) - runs a fully-automated election system on Discord with no third-party libs that, in order:
  - Allow choosing of customisable settings, such as date, voting system, scope of election, electorate list, various rules such as whether to find and exclude dupe accounts, where to set a minimum threshold on messages, on sponsors required for nominations, on number of elections able to run for (if holding several at the several time), and who the voters are.
  - Allows a 'sponsoring' system to nominate candidates
  - Registers candidates, registers votes (based on members in Discord server)
  - Sends round customisable ballots
  - Receives votes through DM channels (for secret ballots), parses the information, and stores them
  - Counts them and parses results
  - Outputs winners using an 'emoji react' system - when a sufficient number of emojis are pressed, results are revealed
- [Profile module](https://github.com/theLAZYmd/LAZYbot/blob/master/src/modules/Profile/profile.js) - creates a 'profile' for each Discord user with:
  - Basic administratory information (user ID, date joined and the like from Discord API)
  - Integration with the lichess and chess.com API to support account linking
  - Customisable finger notes
  - Count messages sent in the server
  - Ability for moderators to add Trophies to certain users
- [ModMail module](https://github.com/theLAZYmd/LAZYbot/tree/master/src/modules/ModMail) - new modmail created from scratch that's intuitive, aesthetic, and easy to use
  - Specifically designed to not rely on a database of messages
  - Allows actions on mods' side: 'close', 'reply anonymously', 'reply', 'warn user', 'timeout user'
  - Supports image attachment
  - Display basic user information
- Systemised event handler through the [router module](https://github.com/theLAZYmd/LAZYbot/tree/master/src/router/)
  - Handles events generated from the Discord client in an expandable and readable way
- An effective [Parse API](https://github.com/theLAZYmd/LAZYbot/blob/master/src/util/parse.js) that takes data stored in a Discord message and parses it into a useful object that can be interacted with for the purposes of the bot
- An effective [Search-resolvable API](https://github.com/theLAZYmd/LAZYbot/blob/master/src/util/search.js) where functions using Discord members, channels, servers, roles, and emojis can search for them by ID, tag, username, aliases, or nickname.
- [Permissions system](https://github.com/theLAZYmd/LAZYbot/blob/master/src/util/permissions.js) that allows limitations on certain commands to who can use them
- [Linking of Discord account](https://github.com/theLAZYmd/LAZYbot/tree/master/src/modules/Chess/tracker) with Lichess and Chess.com, parsing data from their APIs
  - Parses rating data and automatically updates it, available through `!profile`
  - Parses other personal information (like name, country) and makes it available through `!profile`
  - Compares that data in the database with that of other users, for comparison in [leaderboards](https://github.com/theLAZYmd/LAZYbot/blob/master/src/modules/Chess/leaderboard.js) through the command `!lb`
  - Allows users to use `!myrank` to display one's ranking compared to all other users for all variants

### Other features (src/modules)
- Custom reactions system  with either set phrases, embeds, or emojis
- Help modules with `!commands` and individual messages with `!help`
- Stores and returns embeds which are editable:
  - Some of which are [multiple pages](https://github.com/theLAZYmd/LAZYbot/blob/master/src/modules/paginator.js) long;
  - Accepts emoji reactions as acceptable inputs to turn pages
- Backs up data periodically
- Allows users to change their username colour
- Extends the native maths library to include:
  - Combinations and permuations
  - Binomial calculations
  - Random generators
- Reddit API to detect when subreddits are mentioned and provide a link to them
- [Odds generator](https://github.com/theLAZYmd/LAZYbot/blob/master/src/modules/Calculation/odds.js) for betting between any two matches based on percentage change of winning a single game
- Uses an API from [chessvariants.training](https://chessvariants.training) to get, parse, and generate random puzzles from the `!puzzle` command. Also, displays the daily puzzle from lichess by crawling the lichess puzzle
- Handles, parses, and generates boards using the chess.com API from FENs (Forsyth-Edwards Notation, a format of representing a position on a chess board)
- Utility functions such as setting bot username, nickname, streaming link and title, bot version
- As well as basic utility functions such as get ping, uptime, and quote messages
- As well as developers utility functions such as convert a Discord Embed to raw JSON, convert Discord text to Markdown, output JSONs, output various strings and errors

# In active development
