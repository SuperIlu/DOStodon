# DOStodon
This is the source of DOStodon, a Mastodon client for MS-DOS.

DOStodon is implemented in Javascript and relies on a yet unreleased version of [DOjS](https://github.com/SuperIlu/DOjS) to run.

# Quick start
- **You need a VM, real HW or DOSBox-X with a network card an a matching packet driver to use it.**
- **A Pentium 133 or faster with at least 32MiB of RAM is recommended.**
- **Packet drivers can e.g. be found on [packetdriversdos.net](http://packetdriversdos.net/) (make sure to download the driver from the "PC/TCP PACKET DRIVERS" section) or on [crynwr.com](http://crynwr.com/drivers/) or [www.georgpotthast.de](http://www.georgpotthast.de/sioux/packet.htm)**
- **Make sure you read the section about the limitations!**
- **see "DOSBox-staging config" for an example config that works (for me) with DOSBox-staging**

Just [download](https://github.com/SuperIlu/DOStodon/archive/refs/heads/main.zip) the whole repository.

Help on this project is very much appreciated, contact me on [Twitter](https://twitter.com/dec_hl), [Mastodon](https://mastodon.social/@dec_hl) or in the [DOjS Discord](https://discord.gg/J7MUTap9fM) if you want to help or have questions...

<img src="https://github.com/SuperIlu/DOStodon/raw/main/images/timeline.png" alt="DOStodon timeline" width="200">
<img src="https://github.com/SuperIlu/DOStodon/raw/main/images/profile.png" alt="DOStodon profile" width="200">
<img src="https://github.com/SuperIlu/DOStodon/raw/main/images/find_user.png" alt="DOStodon find user" width="200">
<img src="https://github.com/SuperIlu/DOStodon/raw/main/images/hashtag.png" alt="DOStodon hashtag" width="200">

# Usage
## First start
Please run `DOStodon <server> <email> <password>`

- `server`: the URL of the server you want to connect to (e.g. `mastodon.social` or `https://bitbang.social`). Can be with or without `https://` prefix.
- `email`: the email address used for registration (shown on the `Preferences -> Account` page in the web).
- `password`: Your server password. 2FA is not supported. Your password should not contain any non 7bit ASCII characters.

Example: `DOStodon mastodon.social jon@somwhere.com 123abcABC`

The access tokens are stored in `CREDS.JSN` if the login is successful.

## subsequent starts
Just run `DOStodon`.

## Keys
### Common
- `ESC`: Quit DOStodon
- `F1`: Switch to home timeline
- `F2`: Switch to notifications
- `F3`: Switch to hashtag timeline
- `F4`: Switch to local timeline
- `F5`: Switch to global timeline
- `F6`: Switch to bookmarks list (last 40)
- `F7`: Switch to favourites list (last 40)
- `F10`: Switch to Toot composer
- `F11`: Info screen
- `F12`: Poll/Refresh home/notification timelines
- `UP/DOWN, Page UP/DOWN, HOME/END`: scroll entries in home/notifications
- `p`: Show profile of currently selected entry (for boosts the boosters profile)
- `P`: Show profile of currently selected entry (for boosts the original profile)
- `CTRL-S`: Save screenshot as PNG. Screenshots are numbered, starting with `1.PNG`.
- `CTRL-P`: Search for a user/profile. The profile is displayed when pressing `ENTER`.
- `DEL`: close dialog

### Timelines
- `b`: Boost/reblog currently selected toot in home screen
- `B`: UN-Boost/reblog currently selected toot in home screen
- `f`: Favorite/like currently selected toot in home screen
- `F`: UN-Favorite/like currently selected toot in home screen
- `m`: Bookmark currently selected toot in home screen
- `M`: UN-Bookmark currently selected toot in home screen
- `R`/`r`: reply to selected toot in home screen
- `D`/`d`: Print JSON of selected toot in home screen to logfile
- `C`/`c`: Toggle toots with content warning
- `1..4`: show media attachment 1 to 4. Any key to close.
- `CTRL-1..4`: show image description of media attachment 1 to 4. Any key to close.
- `ENTER`: show thread view of current entry, `ENTER` or `BACKSPACE` to return to timeline.

### Tag timeline
- `T`/`t`: change tag
- `ENTER`: confirm tag in tag editor
- `BACKSPACE`: delete character in tag editor

### Editor
- `CTRL-ENTER`: Send toot in Toot editor
- `BACKSPACE`: delete character
- `DEL`: delete toot composer text and reply-to toot

### Profile screen
- `ENTER`: close profile
- `f`: follow
- `F`: unfollow
- `b`: block
- `B`: unblock
- `m`: mute
- `M`: unmute

## General
- DOStodon is busy while the Mastodon logo is displayed in middle of the screen. Don't hit keys like crazy, every keypress will be queued :)
- DOStodon polls home/notifications every 5 minutes for new entries. Countdown is in the lower right corner.
- To add a content warning/spoiler to a toot start the toot with "cw:". The first line of the toot will be the content warning, all subsequent lines will be the body text of the toot.
- If you press DOWN on the last entry in home/notifications older entries are fetched.
- Favourite/boost/bookmark status ([FBM]) is displayed below the profile picture of each toot.
- The selected hashtag is displayed in the upper right corner of the hashtag timeline.
- When first selecting the hashtag timeline you have to enter a hashtag.

## Limitations
- 2FA is not supported right now!
- logging in with passwords that contain characters outside 7bit ASCII might not be possible
- HTTPS requests can take quite a lot of time, be patient!
- Can't play videos/audio
- Image attachements are just drawn at the upper left corner
- No support for HTML tags, they are (badly) filtered out
- No support for emojis (replaced by spaces)
- No support for characters like umlauts, etc.
- The toot composer only supports BACKSPACE, it is not a real text editor.
- Bookmarks and favourites do not support pagination (yet).
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
- `dialogs.js` all input fields

DOStodon is implemented using DOjS native API (no p5js emulation). Network operations block the input processing/rendering.

# DOSBox-staging config
I use [DOSBox Staging](https://github.com/dosbox-staging/dosbox-staging/releases/tag/v0.79.1) to test this version of DOStodon. A NE2000 packet driver can be found on [this](http://www.georgpotthast.de/sioux/packet.htm) page [here](http://www.georgpotthast.de/sioux/pktdrv/ne2000.zip).

**DO NOT use DOSBox-X right now, it has a known bug in file io which creates broken SQLite databases**
**DOSBox-staging has a problem with mouse support, thats why I disabled that in the example config!**

My `dosbox-staging.conf` looks like this:
```
[sdl]
capture_mouse = nomouse

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
- Add image-upload
- NTP access for toot age
- Notification filtering by type
- Look into character-encoding again
- Busy indicator is missing for some network operations
- Have fun

# Changelog
## 8. jan 2023
- Updated DOjS, new curl, new jpeg decoder and bugfixes
- Tinkered a little bit on the splash screen
- You can now press `t` to select a hashtag from the current toot and display the hashtags timeline
- You can now press `F1`/`F2` in profile view to show a list of followers/following accounts.

## 7. jan 2023
- Added 'LOCKED' and 'BOT' info to profile screen.
- Used a smaller font for timeline timestamps and toot stats
- You can now search for a user (profile) by pressing `CTRL-P`
- Lots of small internal optimizations, especially text rendering

## 6. jan 2023
- New, experimental word wrapping algorithm with support for coloring hashtags and handles

## 1. jan 2023
- Reworked the "login" section in the README
- You can now save PNG screenshots using `CTRL-S`

## 29. Dec 2022
- Added scroll indicators `^` and `v` at the very right of the screen
- Added thread view for toots.
- Fixed bug with toggling content warnings on toots with no spoiler text
- Added image description viewing
- Added help screen when pressing `H`

## 28. Dec 2022
- Added local timeline
- Added global timeline
- Added hashtag timeline
- Added 'view bookmarks'
- Added 'view favorites'
- Added text input field
- Reworked sidebar
- Added auto refresh countdown

## 26. Dec 2022
- Fixed issue with the image cache
- Fixed issue with profile screen follow/block/mute function
- Fixed wrong sound being played
- Added Makefile to create DOSTODON.ZIP

## 22. Dec 2022
- Added follow/mute/block info to profile screen
- Added (un) follow/mute/block keys to profile screen (yet untested)

## 20. Dec 2022
- Updated README regarding DOSBox (switched from DOSBox-X to DOSBox-staging)
- Added UnBoost and UnFav
- Added Bookmarks
- Added boost/fav/bookmark markers
- Added splash screen
- Added SQLite based image cache. Images are deleted from cache after 28 days.

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
