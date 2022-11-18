function Toot() {
	this.txt = "";
	this.images = [];
}

Toot.prototype.Draw = function () {
	DisplayMultilineText(0, 0, EGA.GREEN, this.txt, true, TXT_LINE_LENGTH);
}

Toot.prototype.Input = function (key, keyCode, char) {
	if (keyCode == KEY.Code.KEY_BACKSPACE) {
		// delete last character
		this.txt = this.txt.slice(0, this.txt.length - 1);
	} else if (keyCode == KEY.Code.KEY_ENTER) {
		if (key === 13) {
			// Println("ENTER");
			this.txt += '\n';
		} else if (key === 10) {
			//Println("CTRL ENTER");
			m.Toot(this.txt);
			this.txt = "";
		}
	} else {
		if (key >= CharCode(" ") && (this.txt.length < TXT_MAX)) {
			// add character if not max length and charcode at least a SPACE
			this.txt += char;
		}
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Toot = Toot;
