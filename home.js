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

function Home() {
	this.last_poll = null;		// last time of poll
	this.current_list = [];		// current list of toots to render
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
	this.doPoll = false;		// poll for new entries next call
}

Home.prototype.lazyDrawImage = function (url, bhash, x, y) {
	var img = dstdn.cache.GetCachedImage(url);
	if (img) {
		img.Draw(x, y);
		Box(x, y, x + LIST_IMG_SIZE, y + LIST_IMG_SIZE, EGA.BLACK);
	} else {
		if (!this.netop) {
			var url_copy = url;
			this.netop = new NetworkOperation(function () {
				dstdn.cache.FetchListImage(url_copy);
			});
		}
		if (bhash) {
			dstdn.cache.GetHashedImage(bhash).Draw(x, y);
		} else {
			Box(x, y, x + LIST_IMG_SIZE, y + LIST_IMG_SIZE, EGA.LIGHT_GREY);
		}
	}
}

Home.prototype.drawEntries = function () {
	var yPos = 0;
	var current = this.current_top;
	while (yPos < Height - LIST_IMG_SIZE) {
		// check if there are toots left
		if (current >= this.current_list.length) {
			break;
		}

		var minY = yPos + LIST_IMG_SIZE + 4;
		// get toot and display it
		var t = this.current_list[current];

		var e = t;
		if (t['reblog']) {
			e = t['reblog'];
		}

		this.lazyDrawImage(t['account']['avatar_static'], null, 0, yPos);
		if (t['reblog']) {
			this.lazyDrawImage(e['account']['avatar_static'], null, LIST_IMG_SIZE / 2, yPos);
		}

		// filter all displayed strings only once and store them in 'dostodon' key
		if (!t.dostodon) {
			var header = "";
			var content = "";
			if (t['reblog']) {
				header = RemoveHTML("@" + t['account']['username'] + " BOOSTED " + e['account']['username']);
			} else {
				if (t['account']['display_name']) {
					header = RemoveHTML("From " + t['account']['display_name'] + " (@" + t['account']['username'] + ")");
				} else {
					header = RemoveHTML("From @" + t['account']['username']);
				}
			}
			content = RemoveHTML(e['content']);
			sens_indi = e['sensitive'];
			sens_txt = RemoveHTML(e['spoiler_text']);
			stats = "boosts:" + e['reblogs_count'] + ", favs:" + e['favourites_count'] + ", replies:" + e['replies_count'];
			tstamp = FormatTime(e['created_at']);
			t.dostodon = {
				"header": header,
				"content": content,
				"sensitive_txt": sens_txt,
				"sensitive_indicator": sens_indi,
				"stats": stats,
				"tstamp": tstamp
			};
		}
		// render toot header and text
		var col;
		if (current === this.selected) {
			col = EGA.LIGHT_RED;
		} else {
			col = EGA.CYAN;
		}
		yPos = DisplayMultilineText(LIST_IMG_SIZE + LIST_IMG_SIZE / 2 + 8, yPos, col, t.dostodon.header, false, 68);
		if (t.dostodon.sensitive_indicator) {
			yPos = DisplayMultilineText(LIST_IMG_SIZE + LIST_IMG_SIZE / 2 + 8, yPos, EGA.LIGHT_BLUE, "<CW> " + t.dostodon.sensitive_txt, false, 68);
		} else {
			yPos = DisplayMultilineText(LIST_IMG_SIZE + LIST_IMG_SIZE / 2 + 8, yPos, EGA.WHITE, t.dostodon.content, false, 68);
		}

		// render media images
		var media = e['media_attachments'];;
		if (!t.dostodon.sensitive_indicator) {
			if (media && media.length > 0) {
				var media_rendered = false;
				var xPos = LIST_IMG_SIZE * 2;
				var media_str = "";
				for (var i = 0; i < media.length; i++) {
					var m = media[i];
					if (m['type'] === "image") {
						this.lazyDrawImage(m['preview_url'], m['blurhash'], xPos, yPos);
						xPos += LIST_IMG_SIZE * 2;
						media_rendered = true;
					} else {
						media_str += "<" + m['type'] + "> "
					}
				}
				if (media_rendered) {
					yPos += LIST_IMG_SIZE + 2;
				}
				if (media_str.length > 0) {
					// render media indicator for non-pictures
					yPos = DisplayMultilineText(LIST_IMG_SIZE + LIST_IMG_SIZE / 2 + 8, yPos, EGA.LIGHT_GREY, media_str, false, 68);
				}
			}
		}

		var statusY = minY > yPos ? minY : yPos;

		// display fav/boost/bookmark state
		var fstate = "[";
		if (e['favourited']) {
			fstate += "F";
		} else {
			fstate += " ";
		}
		if (e['reblogged']) {
			fstate += "B";
		} else {
			fstate += " ";
		}
		if (e['bookmarked']) {
			fstate += "M";
		} else {
			fstate += " ";
		}
		fstate += "]";
		DisplayMultilineText(0, statusY, EGA.YELLOW, fstate, false, 10);

		// display timestamp
		DisplayMultilineText(LIST_IMG_SIZE + LIST_IMG_SIZE / 2 + 8, statusY, EGA.LIGHT_GREY, t.dostodon.tstamp, false, 68);

		// display toot stats
		yPos = DisplayMultilineText(300, statusY, EGA.LIGHT_GREY, t.dostodon.stats, false, 68);

		// increase yPos to minimum height and draw line
		if (yPos < minY) {
			yPos = minY;
		}
		Line(0, yPos, CONTENT_WIDTH, yPos, EGA.YELLOW);
		yPos += 4;
		this.current_bottom = current;
		current++;
	}
}

Home.prototype.pollData = function (older) {
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
	var toots = dstdn.m.TimelineHome(MAX_POLL, poll_id, older);
	Println("HOME Polled: " + poll_id);

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

Home.prototype.Draw = function () {
	if (this.doPoll) {
		this.pollData(false);
		this.last_poll = new Date();
		this.doPoll = false;
	}

	this.drawEntries();

	if (this.image_preview) {
		this.image_preview.img.DrawAdvanced(
			0, 0,
			this.image_preview.img.width, this.image_preview.img.height,
			0, 0,
			this.image_preview.width, this.image_preview.height);
	}

	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}

	if (!this.last_poll || (new Date() - this.last_poll > POLL_DELAY)) {
		DrawLogo();
		this.doPoll = true;
	}
	DisplaySidebar();
}

Home.prototype.buttonDown = function () {
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

Home.prototype.buttonUp = function () {
	if (this.selected > 0) {
		this.selected--;
	}
	if (this.current_top > 0 && this.selected < this.current_top) {
		this.current_top--;
	}
}

Home.prototype.home = function () {
	this.selected = 0;
	this.current_top = 0;
}

Home.prototype.end = function () {
	this.selected = this.current_list.length - 1;
	this.current_top = this.selected - 3;
}

Home.prototype.pageDown = function () {
	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	var new_selected = Math.min(this.selected + visible_delta, this.current_list.length - 1); // new selected entry is either the old+delta or the max list length
	var selected_delta = new_selected - this.selected; // calculate size of jump

	this.selected = new_selected;		// change selected entry
	this.current_top += selected_delta; // and first displayed entry
}

Home.prototype.pageUp = function () {
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

Home.prototype.Input = function (key, keyCode, char) {
	if (this.image_preview) {
		this.image_preview = null;
	} else {
		var t = this.current_list[this.selected];
		var e = t;
		if (t['reblog']) {
			e = t['reblog'];
		}
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
					case "1":
						this.setPreview(e, 0);
						break;
					case "2":
						this.setPreview(e, 1);
						break;
					case "3":
						this.setPreview(e, 2);
						break;
					case "4":
						this.setPreview(e, 3);
						break;
					case "P":
						dstdn.profile.SetProfile(e['account']);
						break;
					case 'c':
					case 'C':
						if (t['dostodon']['sensitive_txt'].length > 0) {
							t['dostodon']['sensitive_indicator'] = !e['dostodon']['sensitive_indicator'];
						}
						break
					case "p":
						dstdn.profile.SetProfile(t['account']);
						break;
					case "r":
					case "R":
						dstdn.toot.Reply(e);
						return true;
						break;
					case "d":
					case "D":
						Println(JSON.stringify(e));
						break;
					case "B":
						if (e['reblogged']) {
							this.netop = new NetworkOperation(function () {
								dstdn.m.UnReblog(e['id']);
								e['reblogged'] = false;
							});
						}
						break;
					case "b":
						if (!e['reblogged']) {
							this.netop = new NetworkOperation(function () {
								dstdn.m.Reblog(e['id']);
								dstdn.boost_snd.Play(255, 128, false);
								e['reblogged'] = true;
							});
						}
						break;
					case "F":
						if (e['favourited']) {
							this.netop = new NetworkOperation(function () {
								dstdn.m.UnFavorite(e['id']);
								e['favourited'] = false;
							});
						}
						break;
					case "f":
						if (!e['favourited']) {
							this.netop = new NetworkOperation(function () {
								dstdn.m.Favorite(e['id']);
								dstdn.fav_snd.Play(255, 128, false);
								e['favourited'] = true;
							});
						}
						break;
					case "M":
						if (e['bookmarked']) {
							this.netop = new NetworkOperation(function () {
								dstdn.m.UnBookmark(e['id']);
								e['bookmarked'] = false;
							});
						}
						break;
					case "m":
						if (!e['bookmarked']) {
							this.netop = new NetworkOperation(function () {
								dstdn.m.Bookmark(e['id']);
								e['bookmarked'] = true;
							});
						}
						break;
				}
				break;
		}
	}
	return false;
}

Home.prototype.setPreview = function (e, idx) {
	if (e['reblog']) {
		e = e['reblog'];
	}
	if (e['media_attachments'] && e['media_attachments'][idx] && e['media_attachments'][idx]['type'] === "image") {
		var media = e['media_attachments'][idx];
		var outer = this;

		var w = media['meta']['small']['width'];
		var h = media['meta']['small']['height'];

		if (w > Width) {
			var factor = w / Width;
			w = Width;
			h = h / factor;
		}
		if (h > Height) {
			var factor = h / Height;
			h = Height;
			w = w / factor;
		}

		outer.image_preview = {
			"img": new Bitmap(media['blurhash'], w, h),
			"width": w,
			"height": h
		};
		this.netop = new NetworkOperation(function () {
			outer.image_preview = {
				"img": dstdn.cache.FetchLargeImage(media['preview_url']),
				"width": w,
				"height": h
			};
		});
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Home = Home;
