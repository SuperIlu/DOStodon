/*
MIT License
Copyright (c) 2022 Andre Seidelt <superilu@yahoo.com>
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

function Notifications() {
	this.last_poll = null;		// last time of poll
	this.current_list = [];		// current list of notification to render
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
	this.doPoll = false;		// poll for new entries next call
}

Notifications.prototype.lazyDrawImage = function (url, x, y) {
	var img = dstdn.cache.GetCachedImage(url);
	if (img) {
		img.Draw(x, y);
	} else {
		if (!this.netop) {
			var url_copy = url;
			this.netop = new NetworkOperation(function () {
				dstdn.cache.FetchListImage(url_copy);
			});
		}
		Box(x, y, x + LIST_IMG_SIZE, y + LIST_IMG_SIZE, EGA.LIGHT_GREY);
	}
}

Notifications.prototype.drawEntries = function () {
	var yPos = 0;
	var current = this.current_top;
	while (yPos < Height - LIST_IMG_SIZE) {
		// check if there are toots left
		if (current >= this.current_list.length) {
			break;
		}

		var minY = yPos + LIST_IMG_SIZE + 4;
		// get toot and display it
		var n = this.current_list[current];

		this.lazyDrawImage(n['account']['avatar_static'], 0, yPos);

		if (!n.dostodon) {
			var header = "";
			var content = "";
			if (n['account']['display_name']) {
				header = RemoveHTML(n['account']['display_name'] + " (@" + n['account']['username'] + ")");
			} else {
				header = RemoveHTML("@" + n['account']['username']);
			}

			switch (n['type']) {
				case 'follow':
					header += " followed you";
					content = RemoveHTML(n['account']['note']);
					break;
				case 'mention':
					header += " metioned you";
					content = RemoveHTML(n['status']['content']);
					break;
				case 'reblog':
					header += " boosted";
					content = RemoveHTML(n['status']['content']);
					break;
				case 'favourite':
					header += " favourited";
					content = RemoveHTML(n['status']['content']);
					break;
				default:
					header += " " + n['type'];
					if (n['status']) {
						content = RemoveHTML(n['status']['content']);
					} else {
						content = "";
					}
					// follow_request = Someone requested to follow you
					// poll = A poll you have voted in or created has ended
					// status = Someone you enabled notifications for has posted a status
					break;
			}
			n.dostodon = { "header": header, "content": content };
		}

		if (current === this.selected) {
			col = EGA.LIGHT_RED;
		} else {
			col = EGA.MAGENTA;
		}

		yPos = DisplayMultilineText(40, yPos, col, n.dostodon.header, false, 70);
		if (n.dostodon.content.length > 0) {
			yPos = DisplayMultilineText(40, yPos, EGA.WHITE, n.dostodon.content, false, 70);
		}
		if (yPos < minY) {
			yPos = minY;
		}
		Line(0, yPos, CONTENT_WIDTH, yPos, EGA.YELLOW);
		yPos += 4;
		this.current_bottom = current;
		current++;
	}
}

Notifications.prototype.pollData = function (older) {
	var poll_id;
	if (older) {
		poll_id = this.current_list[this.current_list.length - 1]['id'];
	} else {
		if (this.current_list.length > 0) {
			poll_id = this.current_list[0]['id'];
		} else {
			poll_id = null;
		}
	}
	var toots = dstdn.m.Notifications(MAX_POLL, poll_id, older);
	Println("NOTI Polled: " + poll_id);

	if (toots.length > 0) {
		dstdn.noti_snd.Play(255, 128, false);

		if (older) {
			this.current_list.push.apply(this.current_list, toots);
		} else {
			// fix up indices
			if (this.selected > 0) {
				this.selected += toots.length;
			}
			if (this.current_top > 0) {
				this.current_top += toots.length;
			}

			// merge lists
			toots.push.apply(toots, this.current_list);
			this.current_list = toots;
		}
	}
}

Notifications.prototype.Draw = function () {
	if (this.doPoll) {
		this.pollData(false);
		this.last_poll = new Date();
		this.doPoll = false;
	}

	this.drawEntries();

	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}

	if (!this.last_poll || (new Date() - this.last_poll > POLL_DELAY)) {
		DrawLogo();
		this.doPoll = true;
	}
	DisplaySidebar();
}

Notifications.prototype.buttonDown = function () {
	if (this.selected < this.current_bottom) {
		this.selected++;
	} else {
		if (this.current_list.length - 1 > this.selected) {
			this.current_top++;
		} else {
			var self = this;
			this.netop = new NetworkOperation(function () {
				self.pollData(true);
			});
		}
	}
}

Notifications.prototype.buttonUp = function () {
	if (this.selected > 0) {
		this.selected--;
	}
	if (this.current_top > 0 && this.selected < this.current_top) {
		this.current_top--;
	}
}

Notifications.prototype.home = function () {
	this.selected = 0;
	this.current_top = 0;
}

Notifications.prototype.end = function () {
	this.selected = this.current_list.length - 1;
	this.current_top = this.selected - 3;
}

Notifications.prototype.pageDown = function () {
	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	var new_selected = Math.min(this.selected + visible_delta, this.current_list.length - 1); // new selected entry is either the old+delta or the max list length
	var selected_delta = new_selected - this.selected; // calculate size of jump

	this.selected = new_selected;		// change selected entry
	this.current_top += selected_delta; // and first displayed entry
}

Notifications.prototype.pageUp = function () {
	// page up is hardest as we don't really know the rendering size of the entries.
	// we try to approximate it by going up 2/3rds of the currently visible entries, but 3 entries minimum

	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	visible_delta = Math.max(3, Math.floor(visible_delta * 2 / 3));

	var new_selected = Math.max(this.selected - visible_delta, 0); // new selected entry is either the old-delta or list top
	var selected_delta = new_selected - this.selected; // calculate size of jump

	this.selected = new_selected;		// change selected entry
	this.current_top += selected_delta; // and first displayed entry

	// safety guard
	if (this.selected < 0) {
		this.selected = 0;
	}
	if (this.current_top < 0) {
		this.current_top = 0;
	}
}

Notifications.prototype.Input = function (key, keyCode, char) {
	var e = this.current_list[this.selected];
	switch (keyCode) {
		case KEY.Code.KEY_DOWN:
			this.buttonDown();
			break;
		case KEY.Code.KEY_UP:
			this.buttonUp();
			break;
		case KEY.Code.KEY_PGDN:
			this.pageDown();
			break;
		case KEY.Code.KEY_PGUP:
			this.pageUp();
			break;
		case KEY.Code.KEY_HOME:
			this.home();
			break;
		case KEY.Code.KEY_END:
			this.end();
			break;
		case KEY.Code.KEY_F5:
			this.last_poll = 0;
			break;
		default:
			switch (char) {
				case "P":
				case "p":
					dstdn.profile.SetProfile(e['account']);
					break;
				case "r":
				case "R":
					if (e['status']) {
						dstdn.toot.Reply(e['status']);
					}
					return true;
					break;
				case "B":
				case "b":
					if (e['status']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.Reblog(e['status']['id']);
							dstdn.boost_snd.Play(255, 128, false);
						});
					}
					break;
				case "F":
				case "f":
					if (e['status']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.Favorite(e['status']['id']);
							dstdn.fav_snd.Play(255, 128, false);
						});
					}
					break;
			}
			break;
	}
	return false;
}

// export functions and version
exports.__VERSION__ = 1;
exports.Notifications = Notifications;
