# DOStodon
This is the first source drop of DOStodon, a Mastodon client for MS-DOS.

DOStodon is implemented in Javascript and relies on a yet unreleased version of [DOjS](https://github.com/SuperIlu/DOjS) to run.

**You need a VM, real HW or DOSBox-X with a network card an a matching packet driver to use it.
A Pentium 133 or faster with at least 32MiB of RAM is recommended.**

Help on this project is very much apprechiated, contact me on [Twitter](https://twitter.com/dec_hl), [Mastodon](https://mastodon.social/@dec_hl) or in the [DOjS Discord](https://discord.gg/J7MUTap9fM) if you want to help...

The source is split into two files right now:
- `dstdn.js` the "application"
- `home.js` the home timeline
- `imgcache.js` image fetching/caching
- `login.js` server login
- `mstdn.js` contains the Mastodon REST API
- `notific.js` the notification timeline
- `profile.js` profile viewer
- `toot.js` toot creation
- `util.js` support code

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
- `F4`: Unused
- `F5`: Poll/Refresh home/notifications
- `UP/DOWN`: scroll entries in home/notifications
- `p`: Show profile of currently selected entry (for boost the boosters profile)
- `P`: Show profile of currently selected entry (for boost the original profile)
- `B`: Boost/reblog currently selected toot in home screen
- `F`: Favorite/like currently selected toot in home screen
- `CTRL-ENTER`: Send toot in Toot editor
- `1..4`: show media attachment 1 to 4. Any key to close.

## General
- DOStodon is busy while the Mastodon logo is displayed in middle of the screen.
- The Toot editor only supports BACKSPACE, it is not a real text editor.
- DOStodon poll home/notifications every 5 minutes for new entries.

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
