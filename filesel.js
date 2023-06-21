var drives = [
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
	'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
	'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
	'Y', 'Z'
];

var MSG_BORDER = 3;
var FONT_SPACING = 1;
var PREVIEW_WIDTH = 210;

/**
 * create new FileSelector. Start directory is 'current dir'.
 */
function FileSelector() {
	this.drives = [];
	this.onClose = null;
	this.dirFont = new Font(JSBOOTPATH + "fonts/cour16b.fnt");
	this.msgBoxHeight = this.dirFont.height + 2 * MSG_BORDER;

	this.selWidth = SizeX() - PREVIEW_WIDTH;

	// create list of possible drive letters (hack)
	for (var i = 0; i < drives.length; i++) {
		try {
			List(drives[i] + ":\\");
			this.drives.push(drives[i]);
		} catch (e) { }
	}
	this.currentDir = this.initDirInfo("./");
}

/**
 * create a 'dir info' object containing all information about the current directory.
 * 
 * @param {string} dir path to the directory
 * 
 * @returns {*} 'dir info' object.
 */
FileSelector.prototype.initDirInfo = function (dir) {
	// create directory object
	var ret = {
		path: dir,
		top: 0,
		cursor: 0,
		rows: Math.floor((SizeY() - this.msgBoxHeight) / (this.dirFont.height + FONT_SPACING)),
		list: [],
		info: {}
	};

	// fill 'list' and 'info' properties
	ret.list = List(ret.path);
	ret.list.sort();
	var self = ret.list.indexOf(".");
	ret.list.splice(self, 1);
	for (var l = 0; l < ret.list.length; l++) {
		var name = ret.list[l];
		ret.info[name] = Stat(ret.path + "/" + name);
	}

	return ret;
}

/**
 * concatenate path with directory, handle ".." for parent directory.
 * 
 * @param {*} orig current path, must end with a "/"
 * @param {*} sub directory to concatenate or ".." for parent.
 */
FileSelector.prototype.concatPath = function (orig, sub) {
	if (sub == "..") {
		var parts = orig.split("/");
		if (parts.length >= 2) {
			parts.splice(-2, 1);
			return parts.join("/");
		} else {
			return orig;	// this is just a drive letter
		}
	} else {
		return orig + sub + "/";
	}
}

/**
 * draw a preview of the currently selected file.
 */
FileSelector.prototype.drawPreview = function () {
	if (!this.preview) {
		var idx = this.currentDir.top + this.currentDir.cursor;
		var name = this.currentDir.list[idx];
		var filename = null;

		if (name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png")) {
			filename = this.currentDir.path + name;
		}

		try {
			if (!filename) {
				throw "";
			}
			var dl = new Bitmap(filename);
			var previewWidth = PREVIEW_WIDTH;
			var previewHeight = Height / 2;

			var w = dl.width;
			var h = dl.height;

			if (w > previewWidth) {
				var factor = w / previewWidth;
				w = previewWidth;
				h = h / factor;
			}
			if (h > previewHeight) {
				var factor = h / previewHeight;
				h = previewHeight;
				w = w / factor;
			}

			this.preview = new Bitmap(w, h);
			SetRenderBitmap(this.preview);
			dl.DrawAdvanced(
				0, 0, dl.width, dl.height,
				0, 0, this.preview.width, this.preview.height
			);
		} catch (e) {
			this.preview = new Bitmap(PREVIEW_WIDTH, PREVIEW_WIDTH);
			SetRenderBitmap(this.preview);
			ClearScreen(EGA.BLACK);
			Line(0, 0, this.preview.width, this.preview.height, EGA.RED);
			Line(this.preview.width, 0, 0, this.preview.height, EGA.RED);
			Box(0, 0, this.preview.width - 1, this.preview.height - 1, EGA.RED);
		}
		SetRenderBitmap(null);
	}

	this.preview.Draw(this.selWidth + 1, 0);
}

/**
 * draw file description. NYI
 */
FileSelector.prototype.drawImgDesc = function () {
}

/**
 * store the selected file (if any) in the value attribute and hide the selector.
 * 
 * @param {string} file the file name to store or null for no file.
 */
FileSelector.prototype.selectFile = function (file) {
	dstdn.dialog = null;
	this.value = file;
	if (this.onClose) {
		this.onClose(file);
	}
}

/**
 * display the selector.
 * 
 * @param onClose function to call when the selector closes.
 */
FileSelector.prototype.Activate = function (onClose) {
	this.onClose = onClose;
	this.value = null;
	dstdn.dialog = dstdn.file_sel;
}

/**
 * draw file selector box.
 */
FileSelector.prototype.drawFileBox = function () {
	Box(0, 0, this.selWidth, SizeY() - this.msgBoxHeight, EGA.RED);

	for (var r = 0; r < this.currentDir.rows; r++) {
		var idx = r + this.currentDir.top;
		if (idx >= this.currentDir.list.length) {
			break;
		}
		var name = this.currentDir.list[idx];
		var filCol = EGA.DARK_GRAY;
		if (name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png")) {
			filCol = EGA.LIGHT_GRAY;
		} else if (this.currentDir.info[name]["is_directory"]) {
			name += "/";
			filCol = EGA.WHITE;
		}

		var yPos = r * (this.dirFont.height + FONT_SPACING);

		if (r == this.currentDir.cursor) {
			FilledBox(0, yPos, this.selWidth, yPos + this.dirFont.height, EGA.LIGHT_BLUE);
		}

		this.dirFont.DrawStringLeft(MSG_BORDER, yPos, name, filCol, NO_COLOR);
	}
}

/**
 * draw message box with cursor position and current path.
 */
FileSelector.prototype.drawMsgBox = function () {
	FilledBox(0, SizeY() - this.msgBoxHeight, this.selWidth, SizeY(), EGA.LIGHT_GREEN);

	var txt = "[" + (this.currentDir.top + this.currentDir.cursor + 1) + "/" + this.currentDir.list.length + "] " + this.currentDir.path;
	this.dirFont.DrawStringLeft(MSG_BORDER, SizeY() - this.dirFont.height - MSG_BORDER, txt, EGA.BLACK, NO_COLOR);
}

/**
 * move one page up in file list.
 */
FileSelector.prototype.cursorPageUp = function () {
	if (this.currentDir.top > this.currentDir.rows) {
		this.currentDir.top -= this.currentDir.rows;
	} else if (this.currentDir.top == 0) {
		this.currentDir.cursor = 0;
		this.preview = null;
	} else {
		this.currentDir.top = 0;
	}
}

/**
 * move one page down in file list.
 */
FileSelector.prototype.cursorPageDown = function () {
	if (this.currentDir.list.length < this.currentDir.rows) {
		this.currentDir.cursor = this.currentDir.list.length - 1;
		this.preview = null;
	} else if (this.currentDir.top == this.currentDir.list.length - this.currentDir.rows) {
		this.currentDir.cursor = this.currentDir.rows - 1;
		this.preview = null;
	} else {
		this.currentDir.top = Math.min(this.currentDir.top + this.currentDir.rows, this.currentDir.list.length - this.currentDir.rows);
	}
}

/**
 * move one file up in file list.
 */
FileSelector.prototype.cursorUp = function () {
	if (this.currentDir.cursor > 0) {
		this.currentDir.cursor--;
		this.preview = null;
	} else {
		if (this.currentDir.top > 0) {
			this.currentDir.top--;
		}
	}
}

/**
 * move one file down in file list.
 */
FileSelector.prototype.cursorDown = function () {
	if ((this.currentDir.cursor < this.currentDir.rows - 1) && (this.currentDir.cursor < this.currentDir.list.length - 1)) {
		this.currentDir.cursor++;
		this.preview = null;
	} else {
		if (this.currentDir.top + this.currentDir.rows < this.currentDir.list.length) {
			this.currentDir.top++;
		}
	}
}

/**
 * either play file or enter directory
 */
FileSelector.prototype.onEnter = function () {
	var idx = this.currentDir.top + this.currentDir.cursor;
	var name = this.currentDir.list[idx];

	if (this.currentDir.info[name]["is_directory"]) {
		this.currentDir = this.initDirInfo(this.concatPath(this.currentDir.path, name));
	} else if (name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png")) {
		this.selectFile(this.currentDir.path + name);
	}
}

/**
 * render file selector.
 */
FileSelector.prototype.Draw = function () {
	ClearScreen(EGA.BLACK);
	this.drawFileBox();
	this.drawMsgBox();
	this.drawImgDesc();
	this.drawPreview();
}

/*
** This function is called on any input.
*/
FileSelector.prototype.Input = function (key, keyCode, char, eventKey) {
	switch (keyCode) {
		case KEY.Code.KEY_ENTER:
			this.onEnter();
			break;
		case KEY.Code.KEY_DEL:
			this.selectFile(null);
			break;
		case KEY.Code.KEY_UP:
			this.cursorUp();
			break;
		case KEY.Code.KEY_DOWN:
			this.cursorDown();
			break;
		case KEY.Code.KEY_PGUP:
			this.cursorPageUp();
			break;
		case KEY.Code.KEY_PGDN:
			this.cursorPageDown();
			break;
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.FileSelector = FileSelector;
