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
		sfont.DrawStringLeft(x, y + yPos, txt_lines[l], col, NO_COLOR);
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
			sfont.DrawStringLeft(x, y + yPos, cursorString, col, NO_COLOR);
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
	var boxStartX = Width / 2 - logo.width / 2 - 3;
	var boxStartY = Height / 2 - logo.height / 2 - 3;
	var boxWidth = boxStartX + logo.width + 6;
	var boxHeight = boxStartY + logo.height + 6 + sfont.height;
	FilledBox(boxStartX, boxStartY, boxWidth, boxHeight, EGA.BLACK);
	// Box(boxStartX, boxStartY, boxWidth, boxHeight, EGA.LIGHT_RED);

	var logoX = Width / 2 - logo.width / 2;
	var logoY = Height / 2 - logo.height / 2;
	logo.DrawTrans(logoX, logoY);
	sfont.DrawStringCenter(Width / 2, logoY + logo.height + 2, "BUSY", EGA.RED, NO_COLOR);
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

// export functions and version
exports.__VERSION__ = 1;
exports.FormatURL = FormatURL;
exports.DisplayMultilineText = DisplayMultilineText;
exports.RemoveHTML = RemoveHTML;
exports.DrawLogo = DrawLogo;
exports.NetworkOperation = NetworkOperation;
