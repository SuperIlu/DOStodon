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

var TEXT_START_OFFSET = 10;

function Toot() {
	this.textOverlay = null;
	this.txt = "";
	this.altEdit = null;
	this.images = [];
	this.reply = null;
	this.visibility = "public"; // public, unlisted, private, direct
}

Toot.prototype.lazyDrawImage = function (url, bhash, x, y) {
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

Toot.prototype.Draw = function () {
	var yPos = TEXT_START_OFFSET;

	yPos = DisplayMultilineToot(TEXT_START_OFFSET, yPos, EGA.LIGHT_RED, "Visibility: " + this.visibility, false, TXT_LINE_LENGTH);
	Line(0, yPos, CONTENT_WIDTH, yPos, EGA.RED);
	yPos += TEXT_START_OFFSET;


	if (this.reply) {
		var minY = yPos + LIST_IMG_SIZE + TEXT_START_OFFSET;

		var t = this.reply;

		this.lazyDrawImage(t['account']['avatar_static'], null, 0, yPos);

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
		yPos = DisplayMultilineToot(40, yPos, col, t.dostodon.header, false, 70);
		yPos = DisplayMultilineToot(40, yPos, EGA.WHITE, t.dostodon.content, false, 70);

		// render media images
		var media;
		media = t['media_attachments'];
		if (media && media.length > 0) {
			var media_rendered = false;
			var xPos = LIST_IMG_SIZE * 2;
			for (var i = 0; i < media.length; i++) {
				var m = media[i];
				if (m['type'] === "image") {
					this.lazyDrawImage(m['preview_url'], m['blurhash'], xPos, yPos);
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

	if (this.images.length > 0) {
		for (var i = 0; i < this.images.length; i++) {
			yPos = DisplayMultilineToot(TEXT_START_OFFSET, yPos, EGA.LIGHT_GREY, this.images[i].name + (this.images[i].alt ? " [ALT]" : ""), false, TXT_LINE_LENGTH);
		}
		Line(0, yPos, CONTENT_WIDTH, yPos, EGA.BLUE);
		yPos += TEXT_START_OFFSET;
	}

	DisplayMultilineToot(TEXT_START_OFFSET, yPos, EGA.GREEN, this.txt, true, TXT_LINE_LENGTH);

	DisplaySidebar(null);

	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}
	if (this.textOverlay) {
		TextOverlay(this.textOverlay, EGA.WHITE);
	}
	if (this.altEdit) {
		this.altEdit.Draw();
	}
}

Toot.prototype.Help = function () {
	this.textOverlay = "Toot screen HELP\n\n";
	this.textOverlay += "- `CTRL-ENTER`: Send toot in Toot editor.\n";
	this.textOverlay += "- `CTRL-A`    : Open ALT-test editor for the last added image.\n";
	this.textOverlay += "- `CTRL-P`    : Open account search, ENTER puts the selected account\n";
	this.textOverlay += "                into the toot.\n";
	this.textOverlay += "- `BACKSPACE` : delete character.\n";
	this.textOverlay += "- `DEL`       : delete toot composer text and reply-to toot.\n";
	this.textOverlay += "- `TAB`       : switch toot visibility between `public`, `unlisted`,\n";
	this.textOverlay += "                `private` and `direct`.\n";
	this.textOverlay += "- `INSERT`    : Image selector for image attachments to the toot.\n";
	this.textOverlay += "\n";
	this.textOverlay += "To add a content warning/spoiler to a toot start the toot with 'cw:'.\n";
	this.textOverlay += "The first line of the toot will be the content warning, all subsequent\n";
	this.textOverlay += "lines will be the body text of the toot.\n";
}

Toot.prototype.Input = function (key, keyCode, char, eventKey) {
	if (this.textOverlay) {
		this.textOverlay = null;
	} else if (this.altEdit) {
		this.altEdit.Input(key, keyCode, char, eventKey);
	} else {
		if (eventKey == KEY_CTRL_H) {
			this.Help();
			return false;
		} else if (eventKey == KEY_CTRL_A) {
			if (this.images.length > 0) {
				var outer = this;
				this.altEdit = new AltEditor(this.images[this.images.length - 1].alt, function (res) {
					outer.images[outer.images.length - 1].alt = res;
					outer.altEdit = null;
				});
			}
			return false;
		} else {
			if (keyCode == KEY.Code.KEY_BACKSPACE) {
				// delete last character
				this.txt = this.txt.slice(0, this.txt.length - 1);
			} else if (keyCode == KEY.Code.KEY_DEL) {
				// undo 'reply to' and all text
				this.txt = "";
				this.reply = null;
				this.images = [];
				this.previousScreen();
			} else if (keyCode == KEY.Code.KEY_TAB) {
				switch (this.visibility) {
					case 'public':
						this.visibility = "unlisted";
						break;
					case 'unlisted':
						this.visibility = "private";
						break;
					case 'private':
						this.visibility = "direct";
						break;
					default:
						this.visibility = "public";
						break;
				}
			} else if (keyCode == KEY.Code.KEY_INSERT) {
				// open image selector if there are less than 4 images
				if (this.images.length < 4) {
					var outer = this;
					dstdn.file_sel.Activate(function (fname) {
						if (fname) {
							outer.images.push({ name: fname, alt: null });
						}
					});
				}
			} else if (keyCode == KEY.Code.KEY_ENTER) {
				if (key === 13) {
					// Println("ENTER");
					this.txt += '\n';
				} else if (key === 10) {
					//Println("CTRL ENTER");
					this.toot();
				}
			} else {
				if (key >= CharCode(" ") && (this.txt.length < TXT_MAX)) {
					// add character if not max length and charcode at least a SPACE
					this.txt += char;
				}
			}
		}
		return false;
	}
}

Toot.prototype.previousScreen = function () {
	if (dstdn.return_to) {
		dstdn.current_screen = dstdn.return_to;
		dstdn.return_to = null;
	}
}

Toot.prototype.toot = function () {
	var replyId = null;
	if (this.reply) {
		replyId = this.reply['id'];
	}

	var spoiler = null;
	var txt = this.txt;
	if (txt.startsWith("cw:")) {
		var nl = this.txt.indexOf("\n");
		spoiler = this.txt.substring("cw:".length, nl).trim();
		txt = this.txt.substring(nl).trim();
	}

	if (txt.length > 0) {
		var outer = this;
		this.netop = new NetworkOperation(function () {
			var mediaIds = [];
			if (outer.images.length > 0) {
				for (var i = 0; i < outer.images.length; i++) {
					var media = dstdn.m.Media(outer.images[i].name, outer.images[i].alt);	// upload image
					mediaIds.push(media.id);
				}
			}

			dstdn.m.Toot(ToUTF8(txt), outer.visibility, mediaIds, replyId, spoiler);
			dstdn.toot_snd.Play(255, 128, false);
			outer.txt = "";
			outer.reply = null;
			outer.images = [];
			outer.previousScreen();
		});
	}
}

Toot.prototype.Reply = function (e) {
	if (e['reblog']) {
		e = e['reblog'];
	}

	this.reply = e;
	this.txt = "";
	if (e['sensitive'] && e['spoiler_text']) {
		this.txt += "cw: " + e['spoiler_text'] + "\n";
	}
	this.txt += "@" + this.reply['account']['acct'] + " ";
}

Toot.prototype.TootTo = function (a) {
	this.txt = "";
	this.txt += "@" + a['acct'] + " ";
}

// export functions and version
exports.__VERSION__ = 1;
exports.Toot = Toot;
