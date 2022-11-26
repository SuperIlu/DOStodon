function Home() {
	this.newest_id = null;		// id of the newest toot
	this.last_poll = null;		// last time of poll
	this.current_list = [];		// current list of toots to render
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
	this.doPoll = false;		// poll for new entries next call
}

Home.prototype.lazyDrawImage = function (url, x, y) {
	var img = GetCachedImage(url);
	if (img) {
		img.Draw(x, y);
	} else {
		if (!this.netop) {
			var url_copy = url;
			this.netop = new NetworkOperation(function () {
				FetchImage(url_copy);
			});
		}
		Box(x, y, x + LIST_IMG_SIZE, y + LIST_IMG_SIZE, EGA.LIGHT_GREY);
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

		this.lazyDrawImage(t['account']['avatar_static'], 0, yPos);

		if (!t.dostodon) {
			var header = "";
			var content = "";
			if (t['reblog']) {
				header = RemoveHTML("@" + t['account']['username'] + " BOOSTED " + t['reblog']['account']['username']);
				content = RemoveHTML(t['reblog']['content']);
			} else {
				if (t['account']['display_name']) {
					header = RemoveHTML("From " + t['account']['display_name'] + " (@" + t['account']['username'] + ")");
				} else {
					header = RemoveHTML("From @" + t['account']['username']);
				}
				content = RemoveHTML(t['content']);
			}
			t.dostodon = { "header": header, "content": content };
		}
		var col;
		if (current === this.selected) {
			col = EGA.LIGHT_RED;
		} else {
			col = EGA.CYAN;
		}
		yPos = DisplayMultilineText(40, yPos, col, t.dostodon.header, false, 70);
		yPos = DisplayMultilineText(40, yPos, EGA.WHITE, t.dostodon.content, false, 70);

		// render media images
		var media;
		if (t['reblog']) {
			media = t['reblog']['media_attachments'];
		} else {
			media = t['media_attachments'];
		}
		if (media && media.length > 0) {
			var media_rendered = false;
			var xPos = LIST_IMG_SIZE * 2;
			for (var i = 0; i < media.length; i++) {
				var m = media[i];
				if (m['type'] === "image") {
					this.lazyDrawImage(m['preview_url'], xPos, yPos);
					xPos += LIST_IMG_SIZE * 2;
					media_rendered = true;
				}
			}
			if (media_rendered) {
				yPos += LIST_IMG_SIZE;
			}
		}

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

Home.prototype.pollData = function () {
	// get toots never that this ID
	var toots = m.TimelineHome(20, this.newest_id);

	Println("HOME Polled: " + this.newest_id);

	// prepend the polled data to the existing data, then truncate to 50 max
	if (toots.length > 0) {
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
		//this.current_list = toots.slice(0, MAX_TOOTS_IN_LIST);
		this.newest_id = toots[0]['id'];
	}
}

Home.prototype.Draw = function () {
	if (this.doPoll) {
		this.pollData();
		this.last_poll = new Date();
		this.doPoll = false;
	}

	this.drawEntries();

	if (this.image_preview) {
		this.image_preview.Draw(0, 0);
	}

	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}

	if (!this.last_poll || (new Date() - this.last_poll > POLL_DELAY)) {
		DrawLogo();
		this.doPoll = true;
	}
}

Home.prototype.buttonDown = function () {
	if (this.selected < this.current_bottom) {
		this.selected++;
	} else {
		if (this.current_list.length - 1 > this.selected) {
			this.current_top++;
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

Home.prototype.Input = function (key, keyCode, char) {
	if (this.image_preview) {
		this.image_preview = null;
	} else {
		var e = home.current_list[home.current_top + home.selected];
		switch (keyCode) {
			case KEY.Code.KEY_DOWN:
				this.buttonDown();
				break;
			case KEY.Code.KEY_UP:
				this.buttonUp();
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
						if (e['reblog']) {
							profile.SetProfile(e['reblog']['account']);
						} else {
							profile.SetProfile(e['account']);
						}
						break;
					case "p":
						profile.SetProfile(e['account']);
						break;
					case "B":
					case "b":
						this.netop = new NetworkOperation(function () { m.Reblog(e['id']); });
						break;
					case "F":
					case "f":
						this.netop = new NetworkOperation(function () { m.Favorite(e['id']); });
						break;
				}
				break;
		}
	}
}

Home.prototype.setPreview = function (e, idx) {
	if (e['reblog']) {
		e = e['reblog'];
	}
	if (e['media_attachments'] && e['media_attachments'][idx] && e['media_attachments'][idx]['type'] === "image") {
		var outer = this;
		this.netop = new NetworkOperation(function () {
			outer.image_preview = GetImage(e['media_attachments'][idx]['preview_url']);
		});
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Home = Home;
