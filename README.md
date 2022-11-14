# DOStodon
This is the first source drop of DOStodon, a Mastodon client for MS-DOS.

DOStodon is implemented in Javascript and relies on a yet unreleased version of [DOjS](https://github.com/SuperIlu/DOjS) to run.

You need a VM, real HW or DOSBox-X with a network card an a matching packet driver to use it.

Help on this project is very much apprechiated, contact me on [Twitter](https://twitter.com/dec_hl), [Mastodon](https://mastodon.social/@dec_hl) or in the [DOjS Discord](https://discord.gg/J7MUTap9fM) if you want to help...

The source is split into two files right now:
- `mstdn.js` contains the Mastodon REST API
- `dstdn.js` the "application"

# Usage
## First start
Please run `DOStodon <server> <username> <password>`
Example:
`DOStodon mastodon.social jon@somwhere.sw 1234567890`
The access tokens are stored in `CREDS.JSN` if the login is successful.

## subsequent starts
Just run `DOStodon`.
