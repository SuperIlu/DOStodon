var TEXT_START_OFFSET = 10;

function Toot() {
	this.txt = "";
	this.images = [];
	this.reply = null;
}

Toot.prototype.lazyDrawImage = function (url, x, y) {
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

Toot.prototype.Draw = function () {
	var yPos = TEXT_START_OFFSET;

	if (this.reply) {
		var minY = yPos + LIST_IMG_SIZE + TEXT_START_OFFSET;

		var t = this.reply;

		this.lazyDrawImage(t['account']['avatar_static'], 0, yPos);

		if (!t.dostodon) {
			var header = "";
			var content = "";
			if (t['account']['display_name']) {
				header = RemoveHTML("From " + t['account']['display_name'] + " (@" + t['account']['username'] + ")");
			} else {
				header = RemoveHTML("From @" + t['account']['username']);
			}
			content = RemoveHTML(t['content']);
			t.dostodon = { "header": header, "content": content };
		}
		var col = EGA.CYAN;
		yPos = DisplayMultilineText(40, yPos, col, t.dostodon.header, false, 70);
		yPos = DisplayMultilineText(40, yPos, EGA.WHITE, t.dostodon.content, false, 70);

		// render media images
		var media;
		media = t['media_attachments'];
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
		yPos += TEXT_START_OFFSET;
	}

	DisplayMultilineText(TEXT_START_OFFSET, yPos, EGA.GREEN, this.txt, true, TXT_LINE_LENGTH);

	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}
}

Toot.prototype.Input = function (key, keyCode, char) {
	if (keyCode == KEY.Code.KEY_BACKSPACE) {
		// delete last character
		this.txt = this.txt.slice(0, this.txt.length - 1);
	} else if (keyCode == KEY.Code.KEY_DEL) {
		// undo 'reply to' and all text
		this.txt = ""
		this.reply = null;
	} else if (keyCode == KEY.Code.KEY_ENTER) {
		if (key === 13) {
			// Println("ENTER");
			this.txt += '\n';
		} else if (key === 10) {
			//Println("CTRL ENTER");
			var replyId = null;
			if (this.reply) {
				replyId = this.reply['id'];
			}
			m.Toot(this.txt, replyId);
			toot_snd.Play(255, 128, false);
			this.txt = "";
			this.reply = null;
		}
	} else {
		if (key >= CharCode(" ") && (this.txt.length < TXT_MAX)) {
			// add character if not max length and charcode at least a SPACE
			this.txt += char;
		}
	}
	return false;
}

Toot.prototype.Reply = function (e) {
	if (e['reblog']) {
		e = e['reblog'];
	}

	this.reply = e;
	this.txt = "@" + this.reply['account']['acct'] + " ";
}

// export functions and version
exports.__VERSION__ = 1;
exports.Toot = Toot;
