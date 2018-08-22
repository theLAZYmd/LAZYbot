# LAZYbot

Discord bot operating in [the House server](http://dscrd.me/housechessvariants) to further lazy's understanding of basic js.
Written in JavaScript, hosted on glitch.com.

It's main modules are:
- A profile generator which includes:
  - Integration with the lichess and chess.com API to support account linking;
  - Customisable finger notes;
  - Count messages sent in the server;
- Handles Mod Mail DM-ed to the bot;
- Has a custom reactions system:
  - Responding with either set phrases, embeds, or reacting with emojis;
- Displays all commands with `!commands` and individual help messages with `!help`;
- Stores and returns embeds which are editable:
  - Some of which are multiple pages long;
  - Accepts emoji reactions as acceptable inputs to turn pages;
- Runs an 'election':
  - Registers candidates, registers voters;
  - Validates votes and stores them;
  - Countes them and parses them using an AV (Instant Run-Off system);
  - Outputs winners;
- Allows users to change their only username colour;

**In active development**

- More modules available on a (shoddy) previous version, the bot is currently in the transition to a rewrite to the class-based system.
- The repo available on this remote origin is the rewritten class based version.