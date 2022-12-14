/**
 * display an input field and (on ENTER) a list.
 * 
 * @param {string} title search field title
 * @param {string} txt start text in input
 * @param {function} onEnter callback for ENTER in input
 * @param {function} onRender converts entry to text in list
 * @param {function} onClose callback for ENTER in list
 */
function SearchField(title, txt, onEnter, onRender, onClose) {
	this.txt = txt;
	this.title = title;
	this.maxChars = 60;
	this.yStart = 5 * dstdn.sfont.height;
	this.yEnd = Height - 5 * dstdn.sfont.height;
	this.charWidth = dstdn.sfont.StringWidth(" ");
	this.xStart = Width / 2 - (this.maxChars / 2 + 1) * this.charWidth;
	this.xEnd = Width / 2 + (this.maxChars / 2 + 1) * this.charWidth;
	this.onEnter = onEnter;
	this.onRender = onRender;
	this.onClose = onClose;
	this.frame = 0;

	this.current_list = null;
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
}

SearchField.prototype.Draw = function () {
	FilledBox(this.xStart, this.yStart - dstdn.sfont.height, this.xEnd, this.yEnd, Color(32));
	Box(this.xStart, this.yStart, this.xEnd, this.yEnd, EGA.LIGHT_BLUE);
	dstdn.sfont.DrawStringCenter(Width / 2, this.yStart - dstdn.sfont.height / 2, this.title, EGA.YELLOW, NO_COLOR);

	var txtCol = EGA.WHITE;
	if (this.current_list) {
		txtCol = EGA.LIGHT_GREY;
	}

	dstdn.sfont.DrawStringLeft(this.xStart + this.charWidth, this.yStart + dstdn.sfont.height, this.txt, txtCol, NO_COLOR);
	var linepos = this.yStart + dstdn.sfont.height * 2.5;
	Line(this.xStart, linepos, this.xEnd, linepos, EGA.LIGHT_BLUE);
	linepos += dstdn.sfont.height / 2;

	if (this.current_list) {
		this.drawEntries(linepos);
	} else {
		// draw blinking cursor
		if (Math.ceil(this.frame / 10) % 2) {
			var strWidth = dstdn.sfont.StringWidth(this.txt);
			dstdn.sfont.DrawStringLeft(this.xStart + this.charWidth + strWidth, this.yStart + dstdn.sfont.height, "_", EGA.WHITE, NO_COLOR);
		}
		this.frame++;
	}
}

SearchField.prototype.Input = function (key, keyCode, char, eventKey) {
	if (this.current_list) {
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
			case KEY.Code.KEY_ENTER:
				this.onClose(e);
				break;
			case KEY.Code.KEY_DEL:
				this.current_list = null;
				break;
		}
	} else {
		if (keyCode == KEY.Code.KEY_BACKSPACE) {
			// delete last character
			this.txt = this.txt.slice(0, this.txt.length - 1);
		} else if (keyCode == KEY.Code.KEY_DEL) {
			// undo 'reply to' and all text
			this.onClose(null);
		} else if (keyCode == KEY.Code.KEY_ENTER) {
			this.current_list = this.onEnter(this.txt);
			this.current_top = 0;
			this.current_bottom = 0;
			this.selected = 0;
		} else {
			if (key >= CharCode(" ") && (this.txt.length < this.maxChars)) {
				// add character if not max length and charcode at least a SPACE
				this.txt += char;
			}
		}
	}
	return false;
}

SearchField.prototype.drawEntries = function (linePos) {
	var yPos = linePos;
	var current = this.current_top;
	while (yPos < this.yEnd - dstdn.sfont.height) {
		// check if there are toots left
		if (current >= this.current_list.length) {
			break;
		}

		var txt = this.onRender(this.current_list[current]);

		if (current === this.selected) {
			col = EGA.LIGHT_RED;
		} else {
			col = EGA.LIGHT_BLUE;
		}

		yPos = DisplayMultilineText(this.xStart + this.charWidth, yPos, col, txt, false, 70);
		yPos += 4;
		this.current_bottom = current;
		current++;
	}

	// draw list indicators
	if (this.current_top != 0) {
		dstdn.sfont.DrawStringRight(this.xEnd, this.yStart, "^", EGA.LIGHT_RED, NO_COLOR);
	}
	if (this.current_bottom < this.current_list.length - 1) {
		dstdn.sfont.DrawStringRight(this.xEnd, this.yEnd - dstdn.sfont.height, "v", EGA.LIGHT_RED, NO_COLOR);
	}
}

SearchField.prototype.buttonDown = function () {
	if (this.selected >= this.current_bottom) {
		if (this.current_list.length - 1 > this.selected) {
			this.current_top++;
		}
	}
	this.selected++;
}

SearchField.prototype.buttonUp = function () {
	if (this.selected > 0) {
		this.selected--;
	}
	if (this.current_top > 0 && this.selected < this.current_top) {
		this.current_top--;
	}
}

SearchField.prototype.home = function () {
	this.selected = 0;
	this.current_top = 0;
}

SearchField.prototype.end = function () {
	this.selected = this.current_list.length - 1;
	this.current_top = this.selected - 28;
}

SearchField.prototype.pageDown = function () {
	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	var new_selected = Math.min(this.selected + visible_delta, this.current_list.length - 1); // new selected entry is either the old+delta or the max list length
	var selected_delta = new_selected - this.selected; // calculate size of jump

	this.selected = new_selected;		// change selected entry
	this.current_top += selected_delta; // and first displayed entry
}

SearchField.prototype.pageUp = function () {
	// page up is hardest as we don't really know the rendering size of the entries.
	// we try to approximate it by going up 2/3rds of the currently visible entries, but 3 entries minimum

	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	visible_delta = Math.max(28, Math.floor(visible_delta * 2 / 3));

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

/**
 * display a text input field
 * @param {string} title field title
 * @param {string} txt start text in input
 * @param {function} onClose callback for ENTER 
 */
function EnterText(title, txt, onClose) {
	this.txt = txt;
	this.title = title;
	this.maxChars = 60;
	this.yStart = Height / 2 - dstdn.sfont.height;
	this.yEnd = Height / 2 + dstdn.sfont.height * 2;
	this.charWidth = dstdn.sfont.StringWidth(" ");
	this.xStart = Width / 2 - (this.maxChars / 2 + 1) * this.charWidth;
	this.xEnd = Width / 2 + (this.maxChars / 2 + 1) * this.charWidth;
	this.onClose = onClose;
	this.frame = 0;
}

EnterText.prototype.Draw = function () {
	FilledBox(this.xStart, this.yStart - dstdn.sfont.height, this.xEnd, this.yEnd, Color(32));
	Box(this.xStart, this.yStart, this.xEnd, this.yEnd, EGA.LIGHT_BLUE);
	dstdn.sfont.DrawStringCenter(Width / 2, this.yStart - dstdn.sfont.height / 2, this.title, EGA.YELLOW, NO_COLOR);
	dstdn.sfont.DrawStringLeft(this.xStart + this.charWidth, this.yStart + dstdn.sfont.height, this.txt, EGA.WHITE, NO_COLOR);

	// draw blinking cursor
	if (Math.ceil(this.frame / 10) % 2) {
		var strWidth = dstdn.sfont.StringWidth(this.txt);
		dstdn.sfont.DrawStringLeft(this.xStart + this.charWidth + strWidth, this.yStart + dstdn.sfont.height, "_", EGA.WHITE, NO_COLOR);
	}
	this.frame++;
}

EnterText.prototype.Input = function (key, keyCode, char, eventKey) {
	if (keyCode == KEY.Code.KEY_BACKSPACE) {
		// delete last character
		this.txt = this.txt.slice(0, this.txt.length - 1);
	} else if (keyCode == KEY.Code.KEY_DEL) {
		// undo 'reply to' and all text
		this.onClose(null);
	} else if (keyCode == KEY.Code.KEY_ENTER) {
		this.onClose(this.txt);
	} else {
		if (key >= CharCode(" ") && (this.txt.length < this.maxChars)) {
			// add character if not max length and charcode at least a SPACE
			this.txt += char;
		}
	}
	return false;
}

/**
 * show a list of items.
 * 
 * @param {string} title title
 * @param {function} onRender converts entry to text in list
 * @param {function} onClose callback for ENTER in list
 */
function ListField(title, list, onRender, onClose) {
	this.title = title;
	this.maxChars = 60;
	this.yStart = 5 * dstdn.sfont.height;
	this.yEnd = Height - 5 * dstdn.sfont.height;
	this.charWidth = dstdn.sfont.StringWidth(" ");
	this.xStart = Width / 2 - (this.maxChars / 2 + 1) * this.charWidth;
	this.xEnd = Width / 2 + (this.maxChars / 2 + 1) * this.charWidth;

	this.onRender = onRender;
	this.onClose = onClose;
	this.frame = 0;

	this.current_list = list;
	this.current_top = 0;		// currently displayed entry on top of screen
	this.current_bottom = 0;	// currently displayed entry on bottom of screen
	this.selected = 0;			// currently selected entry
}

ListField.prototype.Draw = function () {
	FilledBox(this.xStart, this.yStart - dstdn.sfont.height, this.xEnd, this.yEnd, Color(32));
	Box(this.xStart, this.yStart, this.xEnd, this.yEnd, EGA.LIGHT_BLUE);
	dstdn.sfont.DrawStringCenter(Width / 2, this.yStart - dstdn.sfont.height / 2, this.title, EGA.YELLOW, NO_COLOR);

	this.drawEntries(this.yStart + dstdn.sfont.height / 2);
}

ListField.prototype.Input = function (key, keyCode, char, eventKey) {
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
		case KEY.Code.KEY_ENTER:
			this.onClose(e);
			break;
		case KEY.Code.KEY_DEL:
			this.onClose(null);
			break;
	}
	return false;
}

ListField.prototype.drawEntries = function (linePos) {
	var yPos = linePos;
	var current = this.current_top;
	while (yPos < this.yEnd - dstdn.sfont.height) {
		// check if there are toots left
		if (current >= this.current_list.length) {
			break;
		}

		var txt = this.onRender(this.current_list[current]);

		if (current === this.selected) {
			col = EGA.LIGHT_RED;
		} else {
			col = EGA.LIGHT_BLUE;
		}

		yPos = DisplayMultilineText(this.xStart + this.charWidth, yPos, col, txt, false, 70);
		yPos += 4;
		this.current_bottom = current;
		current++;
	}

	// draw list indicators
	if (this.current_top != 0) {
		dstdn.sfont.DrawStringRight(this.xEnd, this.yStart, "^", EGA.LIGHT_RED, NO_COLOR);
	}
	if (this.current_bottom < this.current_list.length - 1) {
		dstdn.sfont.DrawStringRight(this.xEnd, this.yEnd - dstdn.sfont.height, "v", EGA.LIGHT_RED, NO_COLOR);
	}
}

ListField.prototype.buttonDown = function () {
	if (this.selected >= this.current_bottom) {
		if (this.current_list.length - 1 > this.selected) {
			this.current_top++;
		}
	}
	this.selected++;
}

ListField.prototype.buttonUp = function () {
	if (this.selected > 0) {
		this.selected--;
	}
	if (this.current_top > 0 && this.selected < this.current_top) {
		this.current_top--;
	}
}

ListField.prototype.home = function () {
	this.selected = 0;
	this.current_top = 0;
}

ListField.prototype.end = function () {
	this.selected = this.current_list.length - 1;
	this.current_top = this.selected - 29;
}

ListField.prototype.pageDown = function () {
	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	var new_selected = Math.min(this.selected + visible_delta, this.current_list.length - 1); // new selected entry is either the old+delta or the max list length
	var selected_delta = new_selected - this.selected; // calculate size of jump

	this.selected = new_selected;		// change selected entry
	this.current_top += selected_delta; // and first displayed entry
}

ListField.prototype.pageUp = function () {
	// page up is hardest as we don't really know the rendering size of the entries.
	// we try to approximate it by going up 2/3rds of the currently visible entries, but 3 entries minimum

	var visible_delta = this.current_bottom - this.current_top; // calc number of entries between first and last displayed entry
	visible_delta = Math.max(29, Math.floor(visible_delta * 2 / 3));

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



// export functions and version
exports.__VERSION__ = 1;
exports.SearchField = SearchField;
exports.EnterText = EnterText;
exports.ListField = ListField;
