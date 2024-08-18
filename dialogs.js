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
	this.netop = null;

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

	if (this.netop && this.netop.Process()) {
		this.netop = null;
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
			var outer = this;
			this.netop = new NetworkOperation(function () {
				outer.current_list = outer.onEnter(outer.txt);
				outer.current_top = 0;
				outer.current_bottom = 0;
				outer.selected = 0;
			});
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
 * @param {boolean} multi true top allow selection of multiple entries (using INS)
 */
function ListField(title, list, onRender, onClose, multi) {
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

	if (multi) {
		this.multi = [];			// all selected entries
	} else {
		this.multi = null;
	}
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
		case KEY.Code.KEY_INSERT:
			if (this.multi) {
				var index = this.multi.indexOf(this.selected);
				if (index > -1) {
					this.multi.splice(index, 1);
				} else {
					this.multi.push(this.selected);
				}
			}
			break;
		case KEY.Code.KEY_ENTER:
			if (this.multi) {
				this.onClose(this.multi);
			} else {
				this.onClose(e);
			}
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

		var selected = false;
		if ((!this.multi && (current === this.selected)) || (this.multi && (this.multi.indexOf(current) > -1))) {
			selected = true;
		}

		if (current === this.selected) {
			col = EGA.LIGHT_RED;
		} else {
			col = EGA.LIGHT_BLUE;
		}

		var txt = this.onRender(this.current_list[current], selected);

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

function HashTagDialog(outer) {
	if (!dstdn.dialog) {
		dstdn.dialog = new EnterText("Enter hashtag", outer.tag ? "#" + outer.tag : "#", function (txt) {
			if (txt) {
				if (txt.startsWith("#")) {
					txt = txt.substring(1);
				}

				if (outer.tag !== txt) {
					outer.last_poll = null;
					outer.tag = txt;
					outer.current_list = [];

					dstdn.c.Set("lastTag", txt);
					dstdn.c.Save();
				}
			}
			dstdn.dialog = null;
		});
	}
}

////////
// bool field
function BoolField(x, y, txt, field) {
	this.x = x;
	this.y = y;
	this.txt = txt;
	this.field = field;

	this.active = false;
	this.value = dstdn.c.Get(this.field);
}
BoolField.prototype.Draw = function () {
	var txt = this.txt;
	if (this.value) {
		txt += "[X]";
	} else {
		txt += "[ ]";
	}
	dstdn.sfont.DrawStringLeft(this.x, this.y, txt, this.active ? EGA.RED : EGA.WHITE, NO_COLOR);

	if (this.active) {
		dstdn.sfont.DrawStringRight(this.x + 75 * 8, this.y, "<SPACE to change>", EGA.YELLOW, NO_COLOR);
	}
}
BoolField.prototype.Input = function (key, keyCode, char, eventKey) {
	if (char === ' ') {
		this.value = !this.value;
	}
}
BoolField.prototype.Store = function () {
	dstdn.c.Set(this.field, this.value);
}

////////
// int field
function NumField(x, y, txt, field, minimum, maximum, step) {
	this.x = x;
	this.y = y;
	this.txt = txt;
	this.field = field;
	this.min = minimum;
	this.max = maximum;
	this.step = step;

	this.active = false;
	this.value = dstdn.c.Get(field);
}
NumField.prototype.Draw = function () {
	dstdn.sfont.DrawStringLeft(this.x, this.y, this.txt + this.value, this.active ? EGA.RED : EGA.WHITE, NO_COLOR);

	if (this.active) {
		dstdn.sfont.DrawStringRight(this.x + 75 * 8, this.y, "<PAGE UP/DOWN to change>", EGA.YELLOW, NO_COLOR);
	}
}
NumField.prototype.Input = function (key, keyCode, char, eventKey) {
	switch (keyCode) {
		case KEY.Code.KEY_PGDN:
			this.value -= this.step;
			if (this.value < this.min) {
				this.value = this.min;
			}
			break;
		case KEY.Code.KEY_PGUP:
			this.value += this.step;
			if (this.value > this.max) {
				this.value = this.max;
			}
			break;
	}
}
NumField.prototype.Store = function () {
	dstdn.c.Set(this.field, this.value);
}

////////
// settings dialog
function Settings() {
	this.fntSize = dstdn.sfont.height;

	this.xStart = this.fntSize;
	this.yStart = this.fntSize;
	this.xEnd = Width - 2 * this.fntSize;
	this.yEnd = Height - 2 * this.fntSize;

	this.widgets = [];
	this.active = 0;
	this.yPos = this.yStart + this.fntSize;

	this.widgets.push(new NumField(this.xStart + this.fntSize, this.yPos, "Auto reload delay [s]   : ", "autoReloadDelay", 5, 600, 5));
	this.yPos += this.fntSize;
	this.widgets.push(new NumField(this.xStart + this.fntSize, this.yPos, "Fetch size              : ", "maxPoll", 1, 30, 1));
	this.yPos += this.fntSize;
	this.widgets.push(new NumField(this.xStart + this.fntSize, this.yPos, "Small img cache size    : ", "smallCacheSize", 2, 150, 2));
	this.yPos += this.fntSize;
	this.widgets.push(new NumField(this.xStart + this.fntSize, this.yPos, "Profile img cache size  : ", "profileCacheSize", 2, 150, 2));
	this.yPos += this.fntSize;
	this.widgets.push(new NumField(this.xStart + this.fntSize, this.yPos, "Large img cache size    : ", "largeCacheSize", 2, 150, 2));
	this.yPos += this.fntSize;
	this.widgets.push(new NumField(this.xStart + this.fntSize, this.yPos, "Disk cache max age [d]  : ", "diskCacheMaxAge", 2, 150, 2));
	this.yPos += this.fntSize;
	this.widgets.push(new BoolField(this.xStart + this.fntSize, this.yPos, "Always show posts w/ CW : ", "ignoreCw", 2, 150, 2));
	this.yPos += this.fntSize * 3;

	this.widgets[this.active].active = true;
}

Settings.prototype.Draw = function () {
	FilledBox(this.xStart, this.yStart, this.xEnd, this.yEnd, Color(32));
	Box(this.xStart, this.yStart, this.xEnd, this.yEnd, EGA.LIGHT_BLUE);

	for (var i = 0; i < this.widgets.length; i++) {
		this.widgets[i].Draw();
	}

	dstdn.sfont.DrawStringCenter(Width / 2, this.yPos, "<ENTER to save&exit, DEL to exit&discard, UP/DOWN to select>", EGA.YELLOW, NO_COLOR);
}

Settings.prototype.Input = function (key, keyCode, char, eventKey) {
	switch (keyCode) {
		case KEY.Code.KEY_DOWN:
			this.active++;
			if (this.active >= this.widgets.length) {
				this.active = 0;
			}
			break;
		case KEY.Code.KEY_UP:
			this.active--;
			if (this.active < 0) {
				this.active = this.widgets.length - 1;
			}
			break;
		case KEY.Code.KEY_DEL:
			// leave
			dstdn.dialog = null;
			break;
		case KEY.Code.KEY_ENTER:
			// store and leave
			for (var i = 0; i < this.widgets.length; i++) {
				this.widgets[i].Store();
			}
			dstdn.c.Save();
			dstdn.dialog = null;
			break;
		default:
			this.widgets[this.active].Input(key, keyCode, char, eventKey);
			break;
	}


	// make sure the right one is considered 'active'
	for (var i = 0; i < this.widgets.length; i++) {
		this.widgets[i].active = false;
	}
	this.widgets[this.active].active = true;
}

//////
// editor for ALT text
function AltEditor(txt, onEnter) {
	this.txt = txt || "";
	this.onEnter = onEnter;
}

AltEditor.prototype.Draw = function () {
	var fntSize = dstdn.sfont.height;

	var xStart = fntSize;
	var yStart = fntSize;
	var xEnd = Width - 2 * fntSize;
	var yEnd = Height - 2 * fntSize;

	FilledBox(xStart, yStart, xEnd, yEnd, Color(32));
	Box(xStart, yStart, xEnd, yEnd, EGA.LIGHT_BLUE);

	DisplayMultilineToot(xStart + fntSize, yStart + fntSize, EGA.GREEN, this.txt, true, 70);
}

AltEditor.prototype.Input = function (key, keyCode, char, eventKey) {
	if (keyCode == KEY.Code.KEY_BACKSPACE) {
		// delete last character
		this.txt = this.txt.slice(0, this.txt.length - 1);
	} else if (keyCode == KEY.Code.KEY_DEL) {
		// cancel
		this.onEnter(null);
	} else if (keyCode == KEY.Code.KEY_ENTER) {
		if (key === 13) {
			// Println("ENTER");
			this.txt += '\n';
		} else if (key === 10) {
			// take text
			this.onEnter(this.txt);
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
exports.SearchField = SearchField;
exports.EnterText = EnterText;
exports.ListField = ListField;
exports.Settings = Settings;
exports.HashTagDialog = HashTagDialog;
exports.AltEditor = AltEditor;
