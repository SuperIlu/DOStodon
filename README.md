# DOStodon
This is the source of DOStodon, a Mastodon client for MS-DOS.

DOStodon is implemented in Javascript and relies on a yet unreleased version of [DOjS](https://github.com/SuperIlu/DOjS) to run.

# Quick start
- **You need a VM, real HW or DOSBox-X with a network card an a matching packet driver to use it.**
- **A Pentium 133 or faster with at least 32MiB of RAM is recommended.**
- **Packet drivers can e.g. be found on [packetdriversdos.net](http://packetdriversdos.net/) (make sure to download the driver from the "PC/TCP PACKET DRIVERS" section) or on [crynwr.com](http://crynwr.com/drivers/) or [www.georgpotthast.de](http://www.georgpotthast.de/sioux/packet.htm)**
- **Make sure you read the section about the limitations!**
- **see "DOSBox-X config" for an example config that works (for me) with DOSBox-X**

Just [download](https://github.com/SuperIlu/DOStodon/archive/refs/heads/main.zip) the whole repository.

Help on this project is very much appreciated, contact me on [Twitter](https://twitter.com/dec_hl), [Mastodon](https://mastodon.social/@dec_hl) or in the [DOjS Discord](https://discord.gg/J7MUTap9fM) if you want to help...

# Usage
## First start
Please run `DOStodon <server> <username> <password>`

Example: `DOStodon mastodon.social jon@somwhere.sw 1234567890`

The access tokens are stored in `CREDS.JSN` if the login is successful.

## subsequent starts
Just run `DOStodon`.

## Keys
- `ESC`: Quit DOStodon
- `F1`: Switch to home timeline
- `F2`: Switch to notifications
- `F3`: Switch to Toot composer
- `F4`: Info screen
- `F5`: Poll/Refresh home/notifications
- `UP/DOWN, Page UP/DOWN, HOME/END`: scroll entries in home/notifications
- `p`: Show profile of currently selected entry (for boost the boosters profile)
- `P`: Show profile of currently selected entry (for boost the original profile)
- `b`: Boost/reblog currently selected toot in home screen
- `B`: UN-Boost/reblog currently selected toot in home screen
- `f`: Favorite/like currently selected toot in home screen
- `F`: UN-Favorite/like currently selected toot in home screen
- `m`: Bookmark currently selected toot in home screen
- `M`: UN-Bookmark currently selected toot in home screen
- `R`: reply to selected toot in home screen
- `D`: Print JSON of selected toot in home screen to logfile
- `C`: Toggle toots with content warning
- `DEL`: delete toot composer text and reply-to toot
- `CTRL-ENTER`: Send toot in Toot editor
- `1..4`: show media attachment 1 to 4. Any key to close.

## General
- DOStodon is busy while the Mastodon logo is displayed in middle of the screen. Don't hit keys like crazy, every keypress will be queued :)
- DOStodon poll home/notifications every 5 minutes for new entries.
- To add a content warning/spoiler to a toot start the toot with "cw:". The first line of the toot will be the content warning, all subsequent lines will be the body text of the toot.
- If you press DOWN on the last entry in home/notifications older entries are fetched.

## Limitations
- Disabled TLS/SSL certificate verification for now. DOStodon is not able to verify the certificate of https://mastodon.social anymore and I need to dive deeper into the reason for that.
- Can only display the home timeline and notifications. No support for hashtags, local or global timelines.
- 2FA is not supported right now!
- logging in with passwords that contain characters outside 7bit ASCII might not be possible
- HTTPS requests can take quite a lot of time, be patient!
- Can't play videos/audio
- Image attachements are just drawn at the upper left corner
- No support for HTML tags, they are (badly) filtered out
- No support for emojis (replaced by spaces)
- No support for characters like umlauts, etc.
- Hashtags or usernames are not highlighted.
- The toot composer only supports BACKSPACE, it is not a real text editor.
- No fetching of older entries when you scroll down (yet)
- The image cache is never cleared during runtime, DOStodon will eventually run out of memory
- **NO REAL TESTING/QUALITY ASSURANCE!** Folks, this is a **fun project**, if you need a production ready client contribute or use something real! If it works for you, it works, but don't blame me for broken commits or missing features...

# Hacking/contributions
The source is split into several files right now:
- `dstdn.js` the "application"
- `home.js` the home timeline
- `imgcache.js` image fetching/caching
- `info.js` info screen display
- `splash.js` splash screen
- `mstdn.js` contains the Mastodon REST API
- `notific.js` the notification timeline
- `profile.js` profile viewer
- `toot.js` toot creation
- `util.js` support code

DOStodon is implemented using DOjS native API (no p5js emulation). Network operations block the input processing/rendering.

# DOSBox-staging config
I use [DOSBox Staging](https://github.com/dosbox-staging/dosbox-staging/releases/tag/v0.79.1) to test this version of DOStodon. A NE2000 packet driver can be found on [this](http://www.georgpotthast.de/sioux/packet.htm) page [here](http://www.georgpotthast.de/sioux/pktdrv/ne2000.zip).

**DO NOT use DOSBox-X right now, it has a known bug in file io which creates broken SQLite databases**

My `dosbox-staging.conf` looks like this:
```
[dosbox]
memsize = 64

[cpu]
cputype = pentium_slow
cycles  = max

[ethernet]
ne2000  = true
nicbase = 300
nicirq  = 3
macaddr = AC:DE:48:88:99:AA

[autoexec]
mount c E:\_DEVEL\GitHub\DOStodon
PATH=d:;%PATH%
c:
ne2000 0x60 3 0x300
```

# TODO
- Display image descriptions
- Add image-upload
- Add Local/Global/Hashtag-Timelines
- Look into character-encoding again
- Have fun

# Changelog
## 20. Dec 2022
- Updated README regarding DOSBox (switched from DOSBox-X to DOSBox-staging)
- Added UnBoost and UnFav
- Added Bookmarks
- Added boost/fav/bookmark markers
- Added splash screen

## 19. Dec 2022
- Updated README regarding DOSBox-X
- Added debug timestamp during startup
- Fixed 486 incompatibility (hopefully)

## 17. Dec 2022
- Switched compiler for DOjS from GCC 7.2.0 to 12.2.0
- Added UTC date of toots

## 15. Dec 2022
- Fixed a time() bug in DOjS and re-enabled certificate validation.

## 14. Dec 2022
- Switched from nanojpeg to libjpeg to be able to load progressive JPEGs
- Added toot stat display to home screen

## 13. Dec 2022
- Disabled TLS/SSL certificate verification for now. DOStodon is not able to verify the certificate of https://mastodon.social anymore and I need to dive deeper into the reason for that.
- Added Page UP/DOWN and HOME/END to home and notifications
- Added content warnings/spoilers to the toot composer
- Added fetching of older entries when viewing home/notifications

## 11. Dec 2022
- Fixed a memory corruption in DOjS
- Images are no longer saved into TMP files
- Images are now scaled to fit the screen when displayed

## 4. Dec 2022
- implemented LRU cache for images
- fixed some quirks with key handlings
- DOjS now uses cURL 7.86.0

## 2. Dec 2022
- Blurhash is now implemented in C

## 1. Dec 2022
- added `<CW>` for content warnings, you can toggle the toot with `C`
- added media indicator for non-images (e.g. `<video>`)

## 30. Nov 2022
- added JS based blurhash

## 27. Nov 2022
- implemented connection reuse
- you can now reply to toots by pressing R
- you can now clear the toot-composer by pressing DEL
- improved display of boosted toots
- added sounds

## 26. Nov 2022
- DOjS now uses mbedTLS instead of OpenSSL
- changed display of user handles
- added info screen
- reworked Mastodon-API, prepared it to re-use cURL objects (doesn't work yet)
- now shows a busy indicator when fetchingt iages during scrolling
- disabled alpha channel to speed up rendering

## 18. Nov 2022
- code cleanup
- several fixes all over the place
- added splash screen
- added entry scrolling
- added manual reload with F5
- changed polling time from 1min to 5min
- added profile viewer
- added media preview
- added media showing
- added liking
- added boosting
- added "busy" indicator

## 16. Nov 2022
- added some help in README.md
- first working version

## 14. Nov 2022
- first public release
- didn't work
