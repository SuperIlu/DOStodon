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
	this.current_list = [];		// current list of notification to render (filtered)
	this.full_list = [];		// current list of notification to render (everything)
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
	this.doPoll = false;		// poll for new entries next call
	this.context = null;		// thread context
	this.textOverlay = null;	// text overlay
	this.lastPoll = 0;			// poll identifier

	// default filter settings
	this.showLikes = true;
	this.showBoosts = true;
	this.showFollows = true;
	this.showMentions = true;
	this.showVotes = true;
	this.showOthers = true;
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
				case 'poll':
					header += " poll ended";
					content = "";
					for (var p = 0; p < n.status.poll.options.length; p++) {
						var current_vote = n.status.poll.options[p];
						var vote_option = "";
						if (n.status.poll.voted && n.status.poll.own_votes.indexOf(p) != -1) {
							if (n.status.poll.multiple) {
								vote_option += "<X> ";
							} else {
								vote_option += "[X] ";
							}
						} else {
							if (n.status.poll.multiple) {
								vote_option += "< > ";
							} else {
								vote_option += "[ ] ";
							}
						}
						vote_option += current_vote.title + " " + (100 * current_vote.votes_count / n.status.poll.voters_count).toFixed(2) + "% (" + current_vote.votes_count + ")";
						content += vote_option + "\n";
					}

					content += n.status.poll.voters_count + " voters, " + (n.status.poll.expired ? "ended " : "") + FormatTime(n.status.poll.expires_at, this.ntp);
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

		var highlight_color;
		if (n.pollId == this.lastPoll) {
			highlight_color = EGA.LIGHT_RED;
		} else {
			highlight_color = EGA.DARK_GREY;
		}

		// highlight DMs
		var textColor = EGA.WHITE;
		if (n.visibility == 'direct') {
			textColor = EGA.YELLOW;
		}

		yPos = DisplayMultilineToot(40, yPos, col, n.dostodon.header, false, 70);
		if (n.dostodon.content.length > 0) {
			yPos = DisplayMultilineToot(40, yPos, textColor, n.dostodon.content, false, 70);
		}

		yPos = DisplayText(LIST_IMAGE_SPACING, yPos, highlight_color, FormatTime(n['created_at'], this.ntp), dstdn.tfont);	// display timestamp

		if (yPos < minY) {
			yPos = minY;
		}
		Line(0, yPos, CONTENT_WIDTH, yPos, highlight_color);
		yPos += 4;
		this.current_bottom = current;
		current++;
	}
}

Notifications.prototype.pollData = function (older) {
	var poll_id;

	this.lastPoll++;

	if (older) {
		poll_id = this.full_list[this.full_list.length - 1]['id'];
	} else {
		if (this.full_list.length > 0) {
			poll_id = this.full_list[0]['id'];
		} else {
			poll_id = null;
		}
	}

	// poll notification
	var toots = dstdn.m.Notifications(dstdn.c.Get("maxPoll"), poll_id, older);

	var lastPoll = this.lastPoll;
	toots.forEach(function (e) { e['pollId'] = lastPoll; })

	// and NTP date
	this.ntp = NtpDate();

	if (toots.length > 0) {
		dstdn.noti_snd.Play(255, 128, false);

		if (older) {
			this.full_list = AppendArray(this.full_list, toots);
		} else {
			// fix up indices
			if (this.selected > 0) {
				this.selected += toots.length;
			}
			if (this.current_top > 0) {
				this.current_top += toots.length;
			}

			// merge lists
			this.full_list = AppendArray(toots, this.full_list);
		}
	}
	this.reFilter(false);
}

Notifications.prototype.Draw = function () {
	if (this.context) {
		this.context.Draw();
	} else {
		if (this.doPoll) {
			this.pollData(false);
			this.last_poll = new Date();
			this.doPoll = false;
		}

		this.drawEntries();

		if (this.netop && this.netop.Process()) {
			this.netop = null;
		}

		var pollDelay = dstdn.c.Get("autoReloadDelay") * 1000;

		if (!this.last_poll || (new Date() - this.last_poll > pollDelay)) {
			DrawLogo();
			this.doPoll = true;
		}
		DisplaySidebar(null);

		// draw list indicators
		if (this.current_top != 0) {
			dstdn.sfont.DrawStringRight(Width, 0, "^", EGA.LIGHT_RED, NO_COLOR);
		}
		if (this.current_bottom < this.current_list.length - 1) {
			dstdn.sfont.DrawStringRight(Width, Height - dstdn.sfont.height, "v", EGA.LIGHT_RED, NO_COLOR);
		}

		if (this.last_poll) {
			var delta = Math.floor((pollDelay - (new Date() - this.last_poll)) / 1000);
			var deltaWidth = dstdn.sfont.StringWidth("0000");
			FilledBox(CONTENT_WIDTH - deltaWidth, Height - dstdn.sfont.height, CONTENT_WIDTH - 1, Height, Color(64, 32, 32));
			dstdn.sfont.DrawStringRight(CONTENT_WIDTH - 1, Height - dstdn.sfont.height, delta, EGA.LIGHT_GREEN, NO_COLOR);
		}

		// draw filter string
		var filters = "[";
		filters += this.showLikes ? "L" : " ";
		filters += this.showBoosts ? "B" : " ";
		filters += this.showFollows ? "F" : " ";
		filters += this.showMentions ? "M" : " ";
		filters += this.showVotes ? "V" : " ";
		filters += this.showOthers ? "O" : " ";
		filters += "]";
		var filterWidth = dstdn.sfont.StringWidth(filters);
		FilledBox(0, Height - dstdn.sfont.height, filterWidth, Height, Color(64, 32, 32));
		dstdn.sfont.DrawStringLeft(0, Height - dstdn.sfont.height, filters, EGA.YELLOW, NO_COLOR);

		if (this.textOverlay) {
			TextOverlay(this.textOverlay, EGA.WHITE);
		}
	}
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

Notifications.prototype.reFilter = function (changed) {
	this.current_list = [];

	for (var i = 0; i < this.full_list.length; i++) {
		var n = this.full_list[i];

		switch (n['type']) {
			case 'follow':
				if (this.showFollows) {
					this.current_list.push(n);
				}
				break;
			case 'mention':
				if (this.showMentions) {
					this.current_list.push(n);
				}
				break;
			case 'reblog':
				if (this.showBoosts) {
					this.current_list.push(n);
				}
				break;
			case 'favourite':
				if (this.showLikes) {
					this.current_list.push(n);
				}
				break;
			case 'poll':
				if (this.showVotes) {
					this.current_list.push(n);
				}
				break;
			default:
				if (this.showOthers) {
					this.current_list.push(n);
				}
				break;
		}
	}

	// reset list positions
	if (changed) {
		this.current_top = 0;
		this.current_bottom = 0;
		this.selected = 0;
	}
}

Notifications.prototype.Input = function (key, keyCode, char, eventKey) {
	if (this.textOverlay) {
		this.textOverlay = null;
	} else if (this.context) {
		if (keyCode == KEY.Code.KEY_ENTER || keyCode == KEY.Code.KEY_BACKSPACE) {
			this.context = null;
		} else {
			return this.context.Input(key, keyCode, char, eventKey);
		}
	} else {
		var e = this.current_list[this.selected];
		if (eventKey == KEY_CTRL_W) {
			this.netop = new NetworkOperation(function () {
				Println(JSON.stringify(dstdn.m.SetMarker(e['id'], false)));
			});
			return false;
		} else if (eventKey == KEY_CTRL_L) {
			this.netop = new NetworkOperation(function () {
				Println(JSON.stringify(dstdn.m.GetMarker(false)));
			});
			return false;
		} else {
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
				case KEY.Code.KEY_F12:
					this.last_poll = 0;
					break;
				case KEY.Code.KEY_ENTER:
					if (e['status']) {
						e = e['status'];
						this.context = new Home(
							function (outer, max, id, older) {
								var ctx = dstdn.m.Context(e['id']);

								// append ancestors
								var ret = ctx['ancestors'];

								// append selected entry and mark as current entry
								outer.selected = ret.length;
								outer.current_top = ret.length - 3;
								if (outer.current_top < 0) {
									outer.current_top = 0;
								}
								ret.push(e);

								// append descendants
								ret = AppendArray(ret, ctx['descendants']);

								return ret;
							}, HOME_CONTEXT);
					}
					break;
				default:
					switch (char) {
						case "d":
						case "D":
							Println(JSON.stringify(e));
							break;
						case "P":
						case "p":
							dstdn.profile.SetProfile(e['account']);
							break;
						case "r":
						case "R":
							if (e['status']) {
								dstdn.all_screens[SCR_TOOT].Reply(e['status']);
							}
							break;
						case "l":
						case "L":
							this.showLikes = !this.showLikes;
							this.reFilter(true);
							break;
						case "b":
						case "B":
							this.showBoosts = !this.showBoosts;
							this.reFilter(true);
							break;
						case "f":
						case "F":
							this.showFollows = !this.showFollows;
							this.reFilter(true);
							break;
						case "m":
						case "M":
							this.showMentions = !this.showMentions;
							this.reFilter(true);
							break;
						case "v":
						case "V":
							this.showVotes = !this.showVotes;
							this.reFilter(true);
							break;
						case "o":
						case "O":
							this.showOthers = !this.showOthers;
							this.reFilter(true);
							break;
						case " ":
							// default filter settings
							this.showLikes = true;
							this.showBoosts = true;
							this.showFollows = true;
							this.showMentions = true;
							this.showVotes = true;
							this.showOthers = true;
							this.reFilter(true);
							break;
						case "h":
						case "H":
						case "?":
							this.textOverlay = "Notification screen HELP\n\n";
							this.textOverlay += "- `p`            : Profile of current entry (the boosters profile)\n";
							this.textOverlay += "- `P`            : Profile of current entry (the original profile)\n";
							this.textOverlay += "- `L`/`l`        : Toggle showing of favorites\n";
							this.textOverlay += "- `B`/`b`        : Toggle showing of boosts\n";
							this.textOverlay += "- `F`/`f`        : Toggle showing of follows\n";
							this.textOverlay += "- `M`/`m`        : Toggle showing of mentions\n";
							this.textOverlay += "- `V`/`v`        : Toggle showing of polls\n";
							this.textOverlay += "- `O`/`o`        : Toggle showing of other notifications\n";
							this.textOverlay += "- `SPACE`        : Reset all filters\n";
							this.textOverlay += "- `CTRL-P`       : Search user\n";
							this.textOverlay += "- `CTRL-S`       : Save screenshot\n";
							this.textOverlay += "- `CTRL-C`       : Show settings dialog\n";
							this.textOverlay += "- `UP/DOWN`      : scroll entries\n";
							this.textOverlay += "- `Page UP/DOWN` : scroll entries page wise\n";
							this.textOverlay += "- `HOME/END`     : got to first/last entry\n";
							this.textOverlay += "- `DEL`          : close/cancel dialog\n";
							this.textOverlay += "- `ENTER`        : Thread view of current entry, `ENTER` to exit\n";
							break;
					}
					break;
			}
		}
	}
	return false;
}

// export functions and version
exports.__VERSION__ = 1;
exports.Notifications = Notifications;
