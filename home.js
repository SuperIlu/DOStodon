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

function Home(poll_func, type) {
	this.last_poll = null;		// last time of poll
	this.current_list = [];		// current list of toots to render
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
	this.doPoll = false;		// poll for new entries next call
	this.poll_func = poll_func; // function to use to poll new entries
	this.type = type;			// what kind of timeline is this
	this.tag = dstdn.c.Get('lastTag');	// current tag
	this.textOverlay = null;	// text overlay
	this.ntp = null;			// ntp date tuple
	this.tree = null;
	this.highlight = null;		// highlighted entry for thread view
	this.return_to = null;		// return to this screen after thread-view
	this.lastPoll = 0;			// poll identifier

	this.showBoosts = true;
	this.showToots = true;
	this.onlyMedia = false;
}

Home.prototype.lazyDrawImage = function (url, bhash, x, y, hl) {
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
		if (bhash) {
			dstdn.cache.GetHashedImage(bhash).Draw(x, y);
		}
	}
	Box(x, y, x + LIST_IMG_SIZE, y + LIST_IMG_SIZE, hl ? EGA.MAGENTA : EGA.LIGHT_GREY);
}

/**
 * try to fetch YT info data once.
 * @param {object} yt yt object in a toot
 */
Home.prototype.lazyFetchYoutube = function (yt) {
	if (!yt.info) {
		if (!this.netop) {
			var yt_copy = yt;
			this.netop = new NetworkOperation(function () {
				yt_copy.info = {};
				yt.info = dstdn.m.FetchYtInfo(yt_copy.id);
				yt.title = RemoveHTML(yt.info.title);
				yt.author_name = RemoveHTML(yt.info.author_name);
			});
		}
	}
}

Home.prototype.drawEntries = function () {
	var indent_pixels = 8 * INDENT_CHARS;
	var indent_pixels_2 = indent_pixels / 2;

	var yPos = 0;
	var current = this.current_top;
	var indentationEnds = {};
	if (this.current_top == 0) {
		indentationEnds[0] = LIST_IMG_SIZE;
	} else {
		indentationEnds[0] = 0;
	}
	while (yPos < Height - LIST_IMG_SIZE) {
		var yStart = yPos;

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

		var xPos = 0;
		var txtPos = xPos + LIST_IMAGE_SPACING;
		var charLength = 68;
		if (t.indentLevel) {
			xPos = t.indentLevel * indent_pixels;
			charLength -= t.indentLevel * INDENT_CHARS;
			indentationEnds[t.indentLevel] = yStart + LIST_IMG_SIZE;
		}

		// filter all displayed strings only once and store them in 'dostodon' key
		if (!e.dostodon) {
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
			var youTube = null;
			var youTubeId = ExtractYtUrl(content);
			if (youTubeId) {
				youTube = { "id": youTubeId, "preview": CreateYtThumbnail(youTubeId), "info": null };
			}
			sens_indi = e['sensitive'];
			sens_txt = RemoveHTML(e['spoiler_text']);
			stats = "boosts:" + e['reblogs_count'] + ", favs:" + e['favourites_count'] + ", replies:" + e['replies_count'] + ", visibility:" + e['visibility'].toUpperCase().substring(0, 3);
			e.dostodon = {
				"header": header,
				"content": content,
				"youTube": youTube,
				"sensitive_txt": sens_txt,
				"sensitive_indicator": sens_indi,
				"stats": stats
			};
		}

		if (((t['reblog'] && this.showBoosts) || (!t['reblog'] && this.showToots)) && (!this.onlyMedia || (this.onlyMedia && e['media_attachments'] && (e['media_attachments'].length > 0)))) {
			this.lazyDrawImage(t['account']['avatar_static'], null, xPos, yPos, e['id'] === this.highlight);
			if (t['reblog']) {
				this.lazyDrawImage(e['account']['avatar_static'], null, xPos + (LIST_IMG_SIZE / 2), yPos, false);
			}

			// render toot header and text
			var col;
			if (current === this.selected) {
				col = EGA.LIGHT_RED;
			} else if (e['id'] === this.highlight) {
				col = EGA.MAGENTA;
			} else {
				col = EGA.CYAN;
			}

			// highlight DMs
			var textColor = EGA.WHITE;
			if (e.visibility == 'direct') {
				textColor = EGA.YELLOW;
			}

			yPos = DisplayMultilineToot(txtPos, yPos, col, e.dostodon.header, false, charLength);
			if (e.dostodon.sensitive_indicator) {
				yPos = DisplayMultilineToot(txtPos, yPos, EGA.LIGHT_BLUE, "<CW> " + e.dostodon.sensitive_txt, false, charLength);
			} else {
				yPos = DisplayMultilineToot(txtPos, yPos, textColor, e.dostodon.content, false, charLength);
			}

			// render media images
			var media = e['media_attachments'];
			if (!e.dostodon.sensitive_indicator) {
				if (media && media.length > 0) {
					var media_rendered = false;
					var imgX = xPos + LIST_IMG_SIZE * 2;
					var media_str = "";
					for (var i = 0; i < media.length; i++) {
						var m = media[i];
						if (m['type'] === "image") {
							this.lazyDrawImage(m['preview_url'], m['blurhash'], imgX, yPos, false);
							imgX += LIST_IMG_SIZE * 2;
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
						yPos = DisplayMultilineToot(txtPos, yPos, EGA.LIGHT_GREY, media_str, false, 68);
					}
				}
			}

			// render YT preview
			var yt = e.dostodon.youTube;
			if (yt) {
				var ytX = xPos + LIST_IMG_SIZE * 2;
				this.lazyFetchYoutube(yt);

				var author_name = "Author: ";
				var title = "Title: ";
				if (yt.author_name && yt.title) {
					author_name += yt.author_name;
					title += yt.title;
				}
				yPos = DisplayText(ytX, yPos, EGA.LIGHT_GREY, author_name, dstdn.tfont);
				yPos = DisplayText(ytX, yPos, EGA.LIGHT_GREY, title, dstdn.tfont);
				this.lazyDrawImage(yt.preview, null, ytX, yPos, false);
				yPos += LIST_IMG_SIZE + 2;
			}

			// draw thread view lines
			if (t.indentLevel) {
				var indentColor = HSBColor(255 / this.tree.maxindent * t.indentLevel, 255, 255, 255);
				var linePos = yStart + (LIST_IMG_SIZE / 2);
				Line(xPos - indent_pixels_2, linePos, xPos, linePos, indentColor);
				Line(xPos - indent_pixels_2, linePos, xPos - indent_pixels_2, indentationEnds[t.indentLevel - 1], indentColor);
			}

			// render poll info (no multiple choice polls are supported)
			var highlight_color;
			if (e.poll) {
				for (var p = 0; p < e.poll.options.length; p++) {
					var current_vote = e.poll.options[p];
					var vote_option = "";
					if (e.poll.voted && e.poll.own_votes.indexOf(p) != -1) {
						highlight_color = EGA.YELLOW;
						if (e.poll.multiple) {
							vote_option += "<X> ";
						} else {
							vote_option += "[X] ";
						}
					} else {
						highlight_color = EGA.LIGHT_GREY;
						if (e.poll.multiple) {
							vote_option += "< > ";
						} else {
							vote_option += "[ ] ";
						}
					}
					vote_option += current_vote.title + " " + (100 * current_vote.votes_count / e.poll.voters_count).toFixed(2) + "% (" + current_vote.votes_count + ")";
					yPos = DisplayText(txtPos, yPos, highlight_color, vote_option, dstdn.tfont);			// vote option
				}

				var vote_sumary = e.poll.voters_count + " voters, " + (e.poll.expired ? "ended " : "") + FormatTime(e.poll.expires_at, this.ntp);
				yPos = DisplayText(txtPos, yPos, EGA.DARK_GREY, vote_sumary, dstdn.tfont);			// vote sumary
			}

			// display fav/boost/bookmark state
			var statusY = minY > yPos ? minY : yPos;
			var fstate = "";
			if (t['in_reply_to_id']) {
				fstate += "<[";
			} else {
				fstate += " [";
			}
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
			DisplayText(xPos, statusY, EGA.YELLOW, fstate, dstdn.tfont);

			if (t.pollId == this.lastPoll) {
				highlight_color = EGA.LIGHT_RED;
			} else {
				highlight_color = EGA.DARK_GREY;
			}

			DisplayText(txtPos, statusY, highlight_color, FormatTime(e['created_at'], this.ntp), dstdn.tfont);	// display timestamp
			yPos = DisplayText(300, statusY, highlight_color, e.dostodon.stats, dstdn.tfont);			// display toot stats

			// increase yPos to minimum height and draw line
			if (yPos < minY) {
				yPos = minY;
			}

			Line(0, yPos, CONTENT_WIDTH, yPos, highlight_color);
			yPos += 4;
			this.current_bottom = current;
		}
		current++;
	}
}

Home.prototype.pollData = function (older) {
	var poll_id;

	this.lastPoll++;

	if (older) {
		poll_id = this.current_list[this.current_list.length - 1]['id'];
	} else {
		if (this.current_list.length > 0) {
			poll_id = this.current_list[0]['id'];
		} else {
			// var marker = dstdn.m.GetMarker(true);
			// if (marker && marker['home'] && marker['home']['last_read_id']) {
			// 	poll_id = marker['home']['last_read_id'];
			// } else {
			// 	poll_id = null;
			// }
			poll_id = null;
		}
	}

	// poll toots
	var toots = this.poll_func(this, dstdn.c.Get("maxPoll"), poll_id, older);

	var lastPoll = this.lastPoll;
	toots.forEach(function (e) { e['pollId'] = lastPoll; })

	// and NTP date
	this.ntp = NtpDate();

	if (toots.length > 0) {
		dstdn.home_snd.Play(255, 128, false);

		if (this.type === HOME_CONTEXT) {
			// just put the returned list into 'current', scroll positions is already setup by poll_func()
			this.current_list = toots;

			// make tree and calculate indent
			this.toTree();
		} else {
			if (older) {
				this.current_list = AppendArray(this.current_list, toots);
			} else {
				// fix up indices
				if (this.selected > 0) {
					this.selected += toots.length;
				}
				if (this.current_top > 0) {
					this.current_top += toots.length;
				}

				// merge lists
				this.current_list = AppendArray(toots, this.current_list);
			}
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

	var pollDelay = dstdn.c.Get("autoReloadDelay") * 1000;

	if (!this.last_poll || (new Date() - this.last_poll > pollDelay)) {
		DrawLogo();
		this.doPoll = true;
	}

	if (this.type === HOME_CONTEXT) {
		DisplaySidebar("CTX");
	} else if (this.type === HOME_ACCOUNT) {
		DisplaySidebar("PROF");
	} else {
		DisplaySidebar(null);
	}

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

	// draw TAG or NAME
	if (this.type === HOME_TAG && this.tag) {
		var tag = "#" + this.tag;
		var tagWidth = dstdn.sfont.StringWidth(tag);
		FilledBox(CONTENT_WIDTH - tagWidth, 0, CONTENT_WIDTH - 1, dstdn.sfont.height, Color(64, 32, 32));
		dstdn.sfont.DrawStringRight(CONTENT_WIDTH - 1, 0, tag, EGA.YELLOW, NO_COLOR);
	} else if (this.type === HOME_ACCOUNT && this.profile) {
		var name = "@" + this.profile['acct'];
		var nameWidth = dstdn.sfont.StringWidth(name);
		FilledBox(CONTENT_WIDTH - nameWidth, 0, CONTENT_WIDTH - 1, dstdn.sfont.height, Color(64, 32, 32));
		dstdn.sfont.DrawStringRight(CONTENT_WIDTH - 1, 0, name, EGA.YELLOW, NO_COLOR);
	}

	// draw filter string
	var filters = "[";
	filters += this.showBoosts ? "B" : " ";
	filters += this.showToots ? "T" : " ";
	filters += this.onlyMedia ? "M" : " ";
	filters += "]";
	var filterWidth = dstdn.sfont.StringWidth(filters);
	FilledBox(0, Height - dstdn.sfont.height, filterWidth, Height, Color(64, 32, 32));
	dstdn.sfont.DrawStringLeft(0, Height - dstdn.sfont.height, filters, EGA.YELLOW, NO_COLOR);

	if (this.textOverlay) {
		TextOverlay(this.textOverlay, EGA.WHITE);
	}
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

Home.prototype.Input = function (key, keyCode, char, eventKey) {
	if (this.textOverlay) {
		this.textOverlay = null;
	} else {
		if (this.image_preview) {
			this.image_preview = null;
		} else {
			var t = this.current_list[this.selected];
			var e = t;
			if (t && t['reblog']) {
				e = t['reblog'];
			}

			if (eventKey == KEY_CTRL_1) {
				this.setDescription(e, 0);
				return false;
			} else if (eventKey == KEY_CTRL_2) {
				this.setDescription(e, 1);
				return false;
			} else if (eventKey == KEY_CTRL_3) {
				this.setDescription(e, 2);
				return false;
			} else if (eventKey == KEY_CTRL_4) {
				this.setDescription(e, 3);
				return false;
			} else if (eventKey == KEY_CTRL_B) {
				if (this.showBoosts && this.showToots) {
					this.showBoosts = true;
					this.showToots = false;
				} else if (this.showBoosts && !this.showToots) {
					this.showBoosts = false;
					this.showToots = true;
				} else {
					this.showBoosts = true;
					this.showToots = true;
				}
			} else if (eventKey == KEY_CTRL_M) {
				this.onlyMedia = !this.onlyMedia;
			} else if (eventKey == KEY_CTRL_W) {
				this.netop = new NetworkOperation(function () {
					Println(JSON.stringify(dstdn.m.SetMarker(t['id'], true)));
				});
				return false;
			} else if (eventKey == KEY_CTRL_L) {
				this.netop = new NetworkOperation(function () {
					Println(JSON.stringify(dstdn.m.GetMarker(true)));
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
					case KEY.Code.KEY_DEL:
					case KEY.Code.KEY_BACKSPACE:
						if (this.type == HOME_CONTEXT) {
							dstdn.current_screen = this.return_to;
						} else if (this.type == HOME_ACCOUNT) {
							dstdn.current_screen = this.return_to;
							dstdn.profile.SetProfile(this.profile);
						}
						break;
					case KEY.Code.KEY_ENTER:
						dstdn.current_screen = new Home(
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
								ret.push(Clone(e));

								// append descendants
								AppendArray(ret, ctx['descendants']);

								return ret;
							}, HOME_CONTEXT);
						dstdn.current_screen.return_to = this;
						dstdn.current_screen.highlight = e['id'];
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
							case "5":
								this.setPreview(e, 4);
								break;
							case "P":
								dstdn.profile.SetProfile(e['account']);
								break;
							case 'c':
							case 'C':
								if (e['sensitive']) {
									e['dostodon']['sensitive_indicator'] = !e['dostodon']['sensitive_indicator'];
								}
								break
							case "p":
								dstdn.profile.SetProfile(t['account']);
								break;
							case "r":
							case "R":
								dstdn.all_screens[SCR_TOOT].Reply(e);
								dstdn.return_to = this;
								return true;
								break;
							case "d":
							case "D":
								Println(JSON.stringify(e));
								break;
							case "t":
								if (e['tags'].length) {
									dstdn.dialog = new ListField("Select tag [ENTER=OK, DEL=Cancel]", e['tags'],
										function (e) {
											return "#" + e['name'];
										},
										function (e) {
											if (e) {
												var txt = e['name'];
												var tagScreen = dstdn.all_screens[SCR_TAG];
												tagScreen.last_poll = null;
												tagScreen.tag = txt;
												tagScreen.current_list = [];

												dstdn.c.Set("lastTag", txt);
												dstdn.c.Save();
												dstdn.current_screen = tagScreen;
											}
											dstdn.dialog = null;
										});
								}
								break;
							case "T":
								if (this.type === HOME_TAG) {
									HashTagDialog(this);
								}
								break;
							case "v":
							case "V":
								if (e.poll && !e.poll.voted) {
									var outer = this;
									var options = [];
									for (var p = 0; p < e.poll.options.length; p++) {
										options.push({ title: e.poll.options[p].title, idx: p });
									}
									dstdn.dialog = new ListField("Select vote [ENTER=OK, DEL=Cancel]", options,
										function (le, sel) {
											if (e.poll.multiple) {
												if (sel) {
													return "<X> " + le.title;
												} else {
													return "< > " + le.title;
												}
											} else {
												if (sel) {
													return "[X] " + le.title;
												} else {
													return "[ ] " + le.title;
												}
											}
										},
										function (le) {
											if (le) {
												if (e.poll.multiple) {
													outer.netop = new NetworkOperation(function () {
														dstdn.m.Vote(e.poll.id, le);
														e.poll.voted = true;
														e.poll.own_votes = le;
														for (var i = 0; i < le.length; i++) {
															e.poll.options[le[i]].votes_count++;
														}
														e.poll.voters_count++;
														e.poll.votes_count++;
													});
												} else {
													outer.netop = new NetworkOperation(function () {
														dstdn.m.Vote(e.poll.id, [le.idx]);
														e.poll.voted = true;
														e.poll.own_votes = [le.idx];
														e.poll.options[le.idx].votes_count++;
														e.poll.voters_count++;
														e.poll.votes_count++;
													});
												}
											}
											dstdn.dialog = null;
										}, e.poll.multiple);
								}
								break;
							case "h":
							case "H":
							case "?":
								this.textOverlay = "Timeline screen HELP\n\n";
								this.textOverlay += "- `1..4`         : Show media attachment 1 to 4. Any key to close\n";
								this.textOverlay += "- `5`            : Show YouTube preview image. Any key to close\n";
								this.textOverlay += "- `CTRL-1..4`    : Image description of media. Any key to close\n";
								this.textOverlay += "- `b`            : Boost selected toot\n";
								this.textOverlay += "- `B`            : UN-Boost selected toot\n";
								this.textOverlay += "- `C`/`c`        : Toggle toots with content warning.\n";
								this.textOverlay += "- `D`/`d`        : Print JSON of selected toot to logfile\n";
								this.textOverlay += "- `f`            : Favorite selected toot\n";
								this.textOverlay += "- `F`            : UN-Favorite selected toot\n";
								this.textOverlay += "- `m`            : Bookmark selected toot\n";
								this.textOverlay += "- `M`            : UN-Bookmark selected toot\n";
								this.textOverlay += "- `p`            : Profile of current entry (the boosters profile)\n";
								this.textOverlay += "- `P`            : Profile of current entry (the original profile)\n";
								this.textOverlay += "- `R`/`r`        : Reply to selected toot\n";
								this.textOverlay += "- `t`            : Select tag from current toot\n";
								this.textOverlay += "- `v / V`        : Vote\n";
								this.textOverlay += "- `CTRL-P`       : Search user\n";
								this.textOverlay += "- `STRL-S`       : Save screenshot\n";
								this.textOverlay += "- `CTRL-C`       : Show settings dialog\n";
								this.textOverlay += "- `CTRL-B`       : Toggle toots&boosts, boosts only, toots only\n";
								this.textOverlay += "- `CTRL-M`       : Toggle showing posts with media only\n";
								this.textOverlay += "- `UP/DOWN`      : scroll entries\n";
								this.textOverlay += "- `Page UP/DOWN` : scroll entries page wise\n";
								this.textOverlay += "- `HOME/END`     : got to first/last entry\n";
								this.textOverlay += "- `ENTER`        : Thread view of current entry, `ENTER` to exit\n";
								this.textOverlay += "- `DEL`          : close/cancel dialog\n";
								if (this.type === HOME_TAG) {
									this.textOverlay += "- `T`            : change tag dialog\n";
									this.textOverlay += "- `ENTER`        : confirm tag in tag editor\n";
									this.textOverlay += "- `BACKSPACE`    : delete character in tag editor\n";
								}
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
		}
	}
	return false;
}

Home.prototype.setPreview = function (e, idx) {
	if (e['reblog']) {
		e = e['reblog'];
	}
	var outer = this;
	if (e.dostodon.youTube && idx === 4) {
		// fetch YT image
		this.netop = new NetworkOperation(function () {
			outer.image_preview = {
				"img": dstdn.cache.FetchLargeImage(e.dostodon.youTube.preview),
				"width": 640,
				"height": 480
			};
		});
	} else if (e['media_attachments'] && e['media_attachments'][idx] && e['media_attachments'][idx]['type'] === "image") {
		// fetch media image
		var media = e['media_attachments'][idx];

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

Home.prototype.setDescription = function (e, idx) {
	if (e['reblog']) {
		e = e['reblog'];
	}
	if (e['media_attachments'] && e['media_attachments'][idx] && e['media_attachments'][idx]['type'] === "image") {
		var media = e['media_attachments'][idx];
		var txt = "Image description #" + (idx + 1) + "\n\n";
		if (media['description']) {
			txt += media['description'];
		} else {
			txt += "<NO DESCRIPTION>";
		}

		this.textOverlay = txt;
	}
}

Home.prototype.calculateIndentation = function (node, lvl) {
	node['indentLevel'] = lvl;
	var ret = lvl;
	for (var i = 0; i < node.replies.length; i++) {
		ret = Math.max(ret, this.calculateIndentation(node.replies[i], lvl + 1));
	}
	return ret;
}

Home.prototype.toTree = function () {
	var root = this.current_list[0];	// first toot is root

	// create ip->toot mapping and add a 'replies' list to each toot
	var mapped = {};
	for (var i = 0; i < this.current_list.length; i++) {
		var e = this.current_list[i];
		mapped[e.id] = e;
		e['replies'] = [];
	}

	for (var i = 0; i < this.current_list.length; i++) {
		var e = this.current_list[i];
		if (e.in_reply_to_id) {
			var p = mapped[e.in_reply_to_id];
			if (p) {
				p.replies.push(e);
			} else {
				Println("Could not find toot parent: " + e.in_reply_to_id);
			}
		}
	}

	this.tree = root;
	root['maxindent'] = this.calculateIndentation(this.tree, 0);
}

// export functions and version
exports.__VERSION__ = 1;
exports.Home = Home;
