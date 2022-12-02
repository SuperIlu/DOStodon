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
- `UP/DOWN`: scroll entries in home/notifications
- `p`: Show profile of currently selected entry (for boost the boosters profile)
- `P`: Show profile of currently selected entry (for boost the original profile)
- `B`: Boost/reblog currently selected toot in home screen
- `F`: Favorite/like currently selected toot in home screen
- `R`: reply to selected toot in home screen
- `D`: Print JSON of selected toot in home screen to logfile
- `C`: Toggle toots with content warning
- `DEL`: delete toot composer text and reply-to toot
- `CTRL-ENTER`: Send toot in Toot editor
- `1..4`: show media attachment 1 to 4. Any key to close.

## General
- DOStodon is busy while the Mastodon logo is displayed in middle of the screen. Don't hit keys like crazy, every keypress will be queued :)
- DOStodon poll home/notifications every 5 minutes for new entries.

## Limitations
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
- The toot editor only supports BACKSPACE, it is not a real text editor.
- No fetching of older entries when you scroll down (yet)
- The image cache is never cleared during runtime, DOStodon will eventually run out of memory
- **NO REAL TESTING/QUALITY ASSURANCE!** Folks, this is a **fun project**, if you need a production ready client contribute or use something real! If it works for you, it works, but don't blame me for broken commits or missing features...

# Hacking/contributions
The source is split into several files right now:
- `dstdn.js` the "application"
- `home.js` the home timeline
- `imgcache.js` image fetching/caching
- `info.js` info screen display
- `login.js` server login
- `mstdn.js` contains the Mastodon REST API
- `notific.js` the notification timeline
- `profile.js` profile viewer
- `toot.js` toot creation
- `util.js` support code

DOStodon is implemented using DOjS native API (no p5js emulation). Network operations block the input processing/rendering.

# DOSBox-X config
I used "dosbox-x-mingw-win64-20220901233004.zip" of [DOSBox-X](https://github.com/joncampbell123/dosbox-x/releases) to test this version of DOStodon.
My `dosbox.conf` looks like this:
```
[sdl]
windowresolution = 1024x768
output = opengl

[dosbox]
machine  = svga_s3
captures = capture
memsize  = 64

[cpu]
cycles = max

[ne2000]
ne2000=true
nicirq=10
backend=slirp


[autoexec]
mount c C:\Users\ilu\Documents\_DEVEL\DOStodon
c:
ne2000 0x60 10 0x300
```

# Changelog
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
