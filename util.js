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

function FormatTime(tstr, ntp) {
	var ts = new Date(tstr);
	if (ntp) {
		// calculate current UTC from local time difference		
		var now = ntp.ntp.getTime() + (new Date() - ntp.local);

		var seconds = Math.floor((now - ts) / 1000);
		var minutes = Math.floor(seconds / 60);
		var hours = Math.floor(minutes / 60);
		var days = Math.floor(hours / 24);

		if (seconds < 120) {
			return seconds + "s ago";
		} else if (minutes < 120) {
			return minutes + "m ago";
		} else if (hours < 48) {
			return hours + "h ago";
		} else if (days < 7) {
			return days + "d ago";
		}
	}

	// fallback
	return ts.toLocaleDateString("en-US") + " " + ts.toLocaleTimeString("en-US").split(".")[0] + " UTC";
}

function TextOverlay(txt, col) {
	var fntSize = dstdn.sfont.height;

	var xStart = fntSize;
	var yStart = fntSize;
	var xEnd = Width - 2 * fntSize;
	var yEnd = Height - 2 * fntSize;

	FilledBox(xStart, yStart, xEnd, yEnd, Color(32));
	Box(xStart, yStart, xEnd, yEnd, EGA.LIGHT_BLUE);

	DisplayMultilineText(xStart + fntSize, yStart + fntSize, col, txt, false, 70);
}

function DisplayText(x, y, col, txt, fnt) {
	fnt.DrawStringLeft(x, y, txt, col, NO_COLOR);
	return y + fnt.height;
}

function DisplayMultilineToot(x, y, col, txt, cursor, maxChars) {
	var words = txt.split(/\s*([\n\s])\s*/);

	var yPos = y;
	var xPos = x;
	var lineLength = 0;
	for (var i = 0; i < words.length; i++) {
		if (words[i] == " ") {
			// handled by word printing
		} else if (words[i] == "\n") {
			// next line
			yPos += TXT_SIZE;
			xPos = x;
			lineLength = 0;
		} else {
			var wtxt = words[i] + " ";
			var c = col;
			if (wtxt.startsWith("#")) {
				c = EGA.LIGHT_GREEN;
			} else if (wtxt.startsWith("@")) {
				c = EGA.LIGHT_BLUE;
			}

			// split single token into parts of maxLength
			wparts = [];
			while (wtxt.length > maxChars) {
				wparts.push(wtxt.substring(0, maxChars));
				wtxt = wtxt.substring(maxChars);
			}
			wparts.push(wtxt);

			for (j = 0; j < wparts.length; j++) {
				var w = wparts[j];
				if (lineLength + w.length > maxChars) {
					// next line
					yPos += TXT_SIZE;
					xPos = x;
					lineLength = 0;
				}
				dstdn.sfont.DrawStringLeft(xPos, yPos, w, c, NO_COLOR);
				xPos += dstdn.sfont.StringWidth(w);
				lineLength += w.length;
			}
		}
	}

	if (cursor) {
		// draw blinking cursor
		if (Math.ceil(frame / 10) % 2) {
			dstdn.sfont.DrawStringLeft(xPos - dstdn.sfont.StringWidth(" "), yPos, "_", col, NO_COLOR);
		}
		frame++;
	}

	// return current poition on screen
	return yPos + TXT_SIZE;
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
function DisplaySidebar(txt) {
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

	if (!txt) {
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
	} else {
		DisplayMultilineText(xStartTxt, yPos, EGA.YELLOW, " <\n" + txt + "\nVIEW\n\n P\n R\n E\n S\n S\n\n D\n E\n L", false, 10);
	}
	// draw vertical divider
	Line(xStart, 0, xStart, Height, EGA.LIGHT_BLUE);
	Line(xStart + 1, 0, xStart + 1, Height, EGA.BLUE);
}

/**
 * append a to b (changing a in the process), return a.
 * 
 * @param {object[]} a array to append to.
 * @param {object[]} b array to append.
 * 
 * @returns returns a for convenience.
 */
function AppendArray(a, b) {
	for (var i = 0; i < b.length; i++) {
		a.push(b[i]);
	}

	return a;
}

/**
 * get an object containing the NTP and the local time as Date()
 * 
 * @returns an object caontaining the "local" and "ntp" Date()
 */
function NtpDate() {
	try {
		var NTP_TIMESTAMP_DELTA = 2208988800;	// Time in seconds since Jan, 1970 for UNIX epoch.

		var udp = UdpSocket("pool.ntp.org", 123);
		udp.WriteBytes([
			0x1B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 8
		]);
		udp.WaitFlush();
		udp.WaitInput();
		var res = udp.ReadInts(48);
		udp.Close();

		// parse seconds
		var ntpSeconds = 0;
		ntpSeconds += res.Get(40) & 0xFF;
		ntpSeconds *= 256;
		ntpSeconds += res.Get(41) & 0xFF;
		ntpSeconds *= 256;
		ntpSeconds += res.Get(42) & 0xFF;
		ntpSeconds *= 256;
		ntpSeconds += res.Get(43) & 0xFF;
		var epoch = (ntpSeconds - NTP_TIMESTAMP_DELTA); // convert NTP time to epoch

		// return combination of local and ntp date
		return {
			"ntp": new Date(epoch * 1000),
			"local": new Date()
		};
	} catch (e) {
		Println(e);
		return null;
	}
}

/**
 * deep clone a JS object.
 * 
 * @param {object} o the object to clone
 * 
 * @returns a deep clone of the object
 */
function Clone(o) {
	return JSON.parse(JSON.stringify(o));
}

/**
 * check if txt caontains a YT URL.
 * 
 * @param {string} txt the text to parse.
 * 
 * @returns the first YT URL found in txt or null. 
 */
function ExtractYtUrl(txt) {
	var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;

	var m = re.exec(txt);
	if (m) {
		return m[1];
	} else {
		return null;
	}
}

/**
 * create thumbnail ID.
 * 
 * @see https://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
 * 
 * @param {string} id video id
 * 
 * @returns thumbnail URL.
 */
function CreateYtThumbnail(id) {
	return "https://img.youtube.com/vi/" + id + "/sddefault.jpg";
}

// export functions and version
exports.__VERSION__ = 1;
exports.NetworkOperation = NetworkOperation;
exports.FormatURL = FormatURL;
exports.DisplayMultilineText = DisplayMultilineText;
exports.DisplayMultilineToot = DisplayMultilineToot;
exports.RemoveHTML = RemoveHTML;
exports.DrawLogo = DrawLogo;
exports.FormatTime = FormatTime;
exports.DisplaySidebar = DisplaySidebar;
exports.AppendArray = AppendArray;
exports.TextOverlay = TextOverlay;
exports.DisplayText = DisplayText;
exports.NtpDate = NtpDate;
exports.Clone = Clone;
exports.ExtractYtUrl = ExtractYtUrl;
exports.CreateYtThumbnail = CreateYtThumbnail;
