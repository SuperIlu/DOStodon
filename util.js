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

var frame = 0;	// frame nuber

function NetworkOperation(f) {
	this.func = f;
	this.state = 0;
}
NetworkOperation.prototype.Process = function () {
	switch (this.state) {
		case 0:
			DrawLogo();
			this.state++;
			return false;
		case 1:
			this.func();
			this.state++;
			return false;
		default:
			return true;
	}
}

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
		var cursorString = "";
		for (var j = 0; j < this.txt.length; j++) {
			cursorString += " ";
		}
		cursorString += "_";
		dstdn.sfont.DrawStringLeft(this.xStart + this.charWidth, this.yStart + dstdn.sfont.height, cursorString, EGA.WHITE, NO_COLOR);
	}
	this.frame++;
}
EnterText.prototype.Input = function (key, keyCode, char) {
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
 * try to create a well formated server URL.
 * @param {string} str input string
 * @returns well formated server URL
 */
function FormatURL(str) {
	if (str.startsWith("http://")) {
		str = str.substring("http://".length);
	}
	if (str.startsWith("https://")) {
		str = str.substring("https://".length);
	}
	if (str.endsWith("/")) {
		str = str.substring(0, str.length - 1);
	}

	return "https://" + str;
}

function FormatTime(tstr) {
	var ts = new Date(tstr);
	// var now = new Date(new Date() - TIMEZONE_DELTA); // TODO: where to get TZ info from?

	// var seconds = Math.floor((now - ts) / 1000);
	// var minutes = Math.floor(seconds / 60);
	// var hours = Math.floor(minutes / 60);
	// var days = Math.floor(hours / 24);

	// if (seconds < 120) {
	// 	return seconds + "s";
	// } else if (minutes < 120) {
	// 	return minutes + "m";
	// } else if (hours < 48) {
	// 	return hours + "h";
	// } else if (days < 7) {
	// 	return days + "d";
	// } else {
	return ts.toLocaleDateString("en-US") + " " + ts.toLocaleTimeString("en-US").split(".")[0] + " UTC";
	// }
}

function DisplayMultilineText(x, y, col, txt, cursor, maxChars) {
	var l;
	var yPos;
	var last_line = "";
	var tmp_lines = txt.split('\n');
	var txt_lines = [];

	// split lines at 75 characters and append result to display array
	for (l = 0; l < tmp_lines.length; l++) {
		var cl = tmp_lines[l];
		while (cl.length > maxChars) {
			txt_lines.push(cl.substring(0, maxChars));
			cl = cl.substring(maxChars);
		}
		txt_lines.push(cl);
	}

	// draw the text
	for (l = 0; l < txt_lines.length; l++) {
		yPos = l * TXT_SIZE;
		dstdn.sfont.DrawStringLeft(x, y + yPos, txt_lines[l], col, NO_COLOR);
		last_line = txt_lines[l];
	}

	if (cursor) {
		// draw blinking cursor
		if (Math.ceil(frame / 10) % 2) {
			var cursorString = "";
			for (var j = 0; j < last_line.length; j++) {
				cursorString += " ";
			}
			cursorString += "_";
			dstdn.sfont.DrawStringLeft(x, y + yPos, cursorString, col, NO_COLOR);
		}
		frame++;
	}

	// return current poition on screen
	return y + yPos + TXT_SIZE;
}

/**
 * draw mastodon logo as busy indicator
 */
function DrawLogo() {
	var logo = dstdn.logo;

	var boxStartX = Width / 2 - logo.width / 2 - 3;
	var boxStartY = Height / 2 - logo.height / 2 - 3;
	var boxWidth = boxStartX + logo.width + 6;
	var boxHeight = boxStartY + logo.height + 6 + dstdn.sfont.height;
	FilledBox(boxStartX, boxStartY, boxWidth, boxHeight, EGA.BLACK);
	// Box(boxStartX, boxStartY, boxWidth, boxHeight, EGA.LIGHT_RED);

	var logoX = Width / 2 - logo.width / 2;
	var logoY = Height / 2 - logo.height / 2;
	logo.DrawTrans(logoX, logoY);
	dstdn.sfont.DrawStringCenter(Width / 2, logoY + logo.height + 2, "BUSY", EGA.LIGHT_RED, NO_COLOR);
}

/**
 * try to convert HTML to plain text and remove everything that is not between charactercodes 32 " " and 255 "~".
 * 
 * @param {string} html the html string
 * 
 * @returns plain text
 */
function RemoveHTML(html) {
	var noTags = StripTags(html);
	var unEsc = unescapeHTML(noTags);
	var uniFree = unEsc.replace(/[^\x20-\xFF]/g, " ");
	return uniFree;
}

//////
// https://stackoverflow.com/questions/19985667/how-to-convert-html-page-to-plain-text-in-node-js/65739861#65739861
function StripTags(html) {
	return html.replace(/\n/ig, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/ig, '')
		.replace(/<head[^>]*>[\s\S]*?<\/head[^>]*>/ig, '')
		.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/ig, '')
		.replace(/<\/\s*(?:p|div)>/ig, '\n')
		.replace(/<br[^>]*\/?>/ig, '\n')
		.replace(/<[^>]*>/ig, '')
		.replace('&nbsp;', ' ')
		.replace(/[^\S\r\n][^\S\r\n]+/ig, ' ')
}
//
//////

//////
// https://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript/39243641#39243641
var htmlEntities = {
	nbsp: ' ',
	cent: '¢',
	pound: '£',
	yen: '¥',
	euro: '€',
	copy: '©',
	reg: '®',
	lt: '<',
	gt: '>',
	quot: '"',
	amp: '&',
	apos: '\''
};

function unescapeHTML(str) {
	return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
		var match;

		if (entityCode in htmlEntities) {
			return htmlEntities[entityCode];
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
			return String.fromCharCode(parseInt(match[1], 16));
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#(\d+)$/)) {
			return String.fromCharCode(~~match[1]);
		} else {
			return entity;
		}
	});
};
//
/////

/**
 * draw the sidebar
 */
function DisplaySidebar() {
	var col;

	var fKeys = [
		[SCR_HOME, 'F1:', 'Home'],
		[SCR_NOTI, 'F2:', 'Noti'],
		[SCR_TAG, 'F3:', 'Tag'],
		[SCR_LOCAL, 'F4:', 'Loc'],
		[SCR_GLOBAL, 'F5:', 'Glbl'],
		[SCR_BMARK, 'F6:', 'BM'],
		[SCR_FAV, 'F7:', 'Fav'],
		[SCR_TOOT, 'F10:', 'Toot'],
		[SCR_INFO, 'F11:', 'Info'],
		[255, 'F12:', 'Refr']
	];

	var xStart = CONTENT_WIDTH;
	var xStartTxt = xStart + 4;
	var fontOffset = dstdn.sfont.height / 2 + 1;
	var ySpace = Height / fKeys.length;
	var ySpace_2 = ySpace / 2;
	yPos = ySpace / 2;

	for (var i = 0; i < fKeys.length; i++) {
		var k = fKeys[i];

		if (dstdn.all_screens[k[0]] === dstdn.current_screen) {
			col = EGA.LIGHT_RED;
			FilledBox(xStart, yPos - ySpace_2 + 2, Width, yPos + ySpace_2, EGA.BLUE);
		} else {
			col = EGA.LIGHT_BLUE;
		}
		dstdn.sfont.DrawStringLeft(xStartTxt, yPos - fontOffset, k[1], col, NO_COLOR);
		dstdn.sfont.DrawStringLeft(xStartTxt, yPos + fontOffset, k[2], col, NO_COLOR);

		Line(xStart, yPos + ySpace_2, Width, yPos + ySpace_2, EGA.LIGHT_BLUE);
		Line(xStart, yPos + ySpace_2 + 1, Width, yPos + ySpace_2 + 1, EGA.BLUE);

		yPos += ySpace;
	}

	// draw vertical divider
	Line(xStart, 0, xStart, Height, EGA.LIGHT_BLUE);
	Line(xStart + 1, 0, xStart + 1, Height, EGA.BLUE);
}

// export functions and version
exports.__VERSION__ = 1;
exports.NetworkOperation = NetworkOperation;
exports.EnterText = EnterText;
exports.FormatURL = FormatURL;
exports.DisplayMultilineText = DisplayMultilineText;
exports.RemoveHTML = RemoveHTML;
exports.DrawLogo = DrawLogo;
exports.FormatTime = FormatTime;
exports.DisplaySidebar = DisplaySidebar;
