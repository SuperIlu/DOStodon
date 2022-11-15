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

LoadLibrary("curl");
LoadLibrary("jpeg");
LoadLibrary("png");

Include("mstdn");

var CREDS_FILE = "CREDS.JSN";
var TMP_FILE = "TMPIMG";
var SCREEN_HOME = 1;
var SCREEN_NOTIFICATION = 2;
var SCREEN_TOOT = 3;
var SCREEN_TBD = 4;
var MAX_TOOTS_IN_LIST = 50;
var TXT_SIZE = 9;		// text height
var TXT_MAX = 500;		// max length of function
var TXT_LINE_LENGTH = 75; // max length of a line on screen
var IMG_SIZE = 32;

var creds = null;
var m = null;
var frame = 0;	// frame nuber

var home = {
	newest_id: null,	// id of the newest toot
	last_poll: null,	// last time of poll
	current_list: [],	// current list of toots to render
	current_top: 0		// currently displayed toot on top of screen
};

var nots = {
	newest_id: null,	// id of the newest notification
	last_poll: null,	// last time of poll
	current_list: [],	// current list of notification to render
	current_top: 0		// currently displayed notification on top of screen
};

var toot = {
	txt: "",
	images: []
}

var sidebar = {
	current_screen: SCREEN_HOME
}

function Setup() {
	Println("GetLocalIpAddress() = " + JSON.stringify(GetLocalIpAddress()));
	Println("GetNetworkMask()    = " + JSON.stringify(GetNetworkMask()));
	Println("GetDomainname()     = " + JSON.stringify(GetDomainname()));
	Println("GetHostname()       = " + JSON.stringify(GetHostname()));
	Println("Resolve(google.com) = " + JSON.stringify(Resolve("google.com")));

	MouseShowCursor(false);

	if (FileExists(CREDS_FILE)) {
		// read config, re-use login
		creds = JSON.parse(Read(CREDS_FILE));
		m = new Mastodon(creds.url);
		m.SetSecrets(creds.client_id, creds.client_secret, creds.token);
	} else if (ARGS.length >= 4) {
		// try to login with command line parameters
		var instance = ARGS[1];
		var user = ARGS[2];
		var password = ARGS[3];

		creds = {};
		creds.url = formatURL(instance);
		m = new Mastodon(creds.url);
		var resp = m.CreateApp("DOStodon");
		Println(resp.client_id);
		Println(resp.client_secret);
		creds.client_id = resp.client_id;
		creds.client_secret = resp.client_secret;

		// login
		var resp = m.Login(user, password);
		Println(resp.access_token);
		creds.token = resp.access_token;

		// save data
		var f = new File(CREDS_FILE, FILE.WRITE);
		f.WriteString(JSON.stringify(creds));
		f.Close();
	} else {
		// print usage
		msg = "Usage:\n";
		msg += "Please run 'DOStodon <server> <username> <password>'\n";
		msg += "Example:\n";
		msg += "  DOStodon mastodon.social jon@somwhere.sw 1234567890'\n";
		SetExitMessage(msg);
		Stop();
	}
}

function Loop() {
	try {
		ClearScreen(EGA.BLACK);
		switch (sidebar.current_screen) {
			case SCREEN_HOME:
				DisplayHome();
				break;
			case SCREEN_NOTIFICATION:
				DisplayNotifications();
				break;
			case SCREEN_TOOT:
				DisplayMultilineText(0, 0, EGA.GREEN, toot.txt, true, TXT_LINE_LENGTH);
				break;
		}
		DisplaySidebar();
	} catch (e) {
		Println(e);
	}
}

function Input(e) {
	if (e.key != -1) {
		var key = e.key & 0xFF;
		var keyCode = e.key >> 8;

		// Println(key);
		// Println(keyCode + "\n");

		switch (keyCode) {
			case KEY.Code.KEY_F1:
				sidebar.current_screen = SCREEN_HOME;
				break;
			case KEY.Code.KEY_F2:
				sidebar.current_screen = SCREEN_NOTIFICATION;
				break;
			case KEY.Code.KEY_F3:
				sidebar.current_screen = SCREEN_TOOT;
				break;
			case KEY.Code.KEY_F4:
				sidebar.current_screen = SCREEN_TBD;
				break;
		}

		// assemble TOOT if in TOOT-screen
		if (sidebar.current_screen === SCREEN_TOOT) {
			if (keyCode == KEY.Code.KEY_BACKSPACE) {
				// delete last character
				toot.txt = toot.txt.slice(0, toot.txt.length - 1);
			} else if (keyCode == KEY.Code.KEY_ENTER) {
				if (key === 13) {
					// Println("ENTER");
					toot.txt += '\n';
				} else if (key === 10) {
					//Println("CTRL ENTER");
					m.Toot(toot.txt);
					toot.txt = "";
				}
			} else {
				if (key >= CharCode(" ") && (toot.txt.length < TXT_MAX)) {
					// add character if not max length and charcode at least a SPACE
					toot.txt += String.fromCharCode(key);
				}
			}
		}
	}
}

/**
 * try to create a well formated server URL.
 * @param {string} str input string
 * @returns well formated server URL
 */
function formatURL(str) {
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

// TODO: cache groesse!
var cache = {};

function getImage(url) {
	if (cache[url]) {
		return cache[url];
	} else {
		Println('fetching ' + url);
		var ret = new Bitmap(IMG_SIZE, IMG_SIZE);
		var get = new Curl();
		var resp = get.DoRequest(url);
		SetRenderBitmap(ret);
		ClearScreen(EGA.BLACK);
		Line(0, 0, ret.width, ret.height, EGA.RED);
		Line(ret.width, 0, 0, ret.height, EGA.RED);
		if (resp[2] === 200) {
			try {
				var fname = TMP_FILE;
				if (url.toLowerCase().endsWith('.png')) {
					fname += ".PNG";
				} else if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
					fname += ".JPG";
				}
				var f = new File(fname, FILE.WRITE);
				f.WriteInts(resp[0]);
				f.Close();
				var dl = new Bitmap(fname);
				dl.DrawAdvanced(
					0, 0, dl.width, dl.height,
					0, 0, ret.width, ret.height
				);
				//Println("Scaled" + dl.width + "x" + dl.height + " to " + ret.width + "x" + ret.height)
			} catch (e) {
				Println(e);
			}
		}
		SetRenderBitmap(null);
		cache[url] = ret;
		return ret;
	}
}

function DisplayHome() {
	var now = new Date();
	if (!home.last_poll || now - home.last_poll > 30000) {
		// poll if not yet polled or last poll >30s away

		// get toots never that this ID
		var toots = m.TimelineHome(20, home.newest_id);

		Println("\nPolled: " + home.newest_id);
		// Println(JSON.stringify(toots));

		// for (var i = 0; i < toots.length; i++) {
		// 	Println("\nFrom @" + toots[i]['account']['username']);
		// 	Println(removeHTML(toots[i]['content']));
		// }

		// prepend the polled data to the existing data, then truncate to 50 max
		if (toots.length > 0) {
			toots.push.apply(toots, home.current_list);
			home.current_list = toots.slice(0, MAX_TOOTS_IN_LIST);
			home.newest_id = toots[0]['id'];
		}

		// book-keeping
		home.last_poll = now;
	}

	var yPos = 0;
	var current = home.current_top;
	while (yPos < Height) {
		// check if there are toots left
		// Println("Current=" + current);
		if (current >= home.current_list.length) {
			// Println("current entry to large");
			break;
		}

		var minY = yPos + IMG_SIZE;
		// get toot and display it
		var t = home.current_list[current];
		// Println("From @" + t['account']['username']);
		getImage(t['account']['avatar_static']).Draw(0, yPos);
		var from;
		var content;
		if (t['reblog']) {
			from = "@" + t['account']['username'] + " BOOSTED " + t['reblog']['account']['username'];
			content = t['reblog']['content'];
		} else {
			if (t['account']['display_name']) {
				from = "From " + t['account']['display_name'] + " (@" + t['account']['username'] + ")";
			} else {
				from = "From @" + t['account']['username'];
			}
			content = t['content'];
		}
		yPos = DisplayMultilineText(40, yPos, EGA.CYAN, from, false, 70);
		yPos = DisplayMultilineText(40, yPos, EGA.WHITE, removeHTML(content), false, 70);
		if (yPos < minY) {
			yPos = minY;
		}
		Line(0, yPos, 600, yPos, EGA.YELLOW);
		yPos += 4;
		current++;
		// Println(yPos + "<" + Height);
	}
}

function DisplayNotifications() {
	var now = new Date();
	if (!nots.last_poll || now - nots.last_poll > 30000) {
		// poll if not yet polled or last poll >30s away

		// get toots never that this ID
		var toots = m.Notifications(20, nots.newest_id);

		Println("\nPolled: " + nots.newest_id);
		// Println(JSON.stringify(toots));

		// prepend the polled data to the existing data, then truncate to 50 max
		if (toots.length > 0) {
			toots.push.apply(toots, nots.current_list);
			nots.current_list = toots.slice(0, MAX_TOOTS_IN_LIST);
			nots.newest_id = toots[0]['id'];
		}

		// book-keeping
		nots.last_poll = now;
	}

	var yPos = 0;
	var current = nots.current_top;
	while (yPos < Height) {
		// check if there are toots left
		if (current >= nots.current_list.length) {
			break;
		}

		var minY = yPos + IMG_SIZE;
		// get toot and display it
		var n = nots.current_list[current];
		getImage(n['account']['avatar_static']).Draw(0, yPos);
		var header = "";
		var content = "";
		switch (n['type']) {
			case 'follow':
				header = "@" + n['account']['username'] + " followed you";
				break;
			case 'mention':
				header = "@" + n['account']['username'] + " metioned you";
				content = removeHTML(n['status']['content']);
				break;
			case 'reblog':
				header = "@" + n['account']['username'] + " boosted";
				content = removeHTML(n['status']['content']);
				break;
			case 'favourite':
				header = "@" + n['account']['username'] + " favourited";
				content = removeHTML(n['status']['content']);
				break;
			default:
				header = "@" + n['account']['username'] + " " + n['type'];
				if (n['status']) {
					content = removeHTML(n['status']['content']);
				}
				// follow_request = Someone requested to follow you
				// poll = A poll you have voted in or created has ended
				// status = Someone you enabled notifications for has posted a status
				break;
		}

		yPos = DisplayMultilineText(40, yPos, EGA.MAGENTA, header, false, 70);
		if (content.length > 0) {
			yPos = DisplayMultilineText(40, yPos, EGA.WHITE, content, false, 70);
		}
		if (yPos < minY) {
			yPos = minY;
		}
		Line(0, yPos, 600, yPos, EGA.YELLOW);
		yPos += 4;
		current++;
	}
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
		while (cl.length > 75) {
			txt_lines.push(cl.substring(0, maxChars));
			cl = cl.substring(maxChars);
		}
		txt_lines.push(cl);
	}

	// draw the text
	for (l = 0; l < txt_lines.length; l++) {
		yPos = l * TXT_SIZE;
		TextXY(x, y + yPos, txt_lines[l], col, NO_COLOR);
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
			TextXY(x, y + yPos, cursorString, col, NO_COLOR);
		}
		frame++;
	}

	// return current poition on screen
	return y + yPos + TXT_SIZE;
}

function DisplaySidebar() {
	var col;

	// 120 pixel height per box
	Line(600, 0, 600, 480, EGA.BLUE);

	if (sidebar.current_screen === SCREEN_HOME) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	TextXY(600, 60, "F1:", col, NO_COLOR);
	TextXY(600, 68, "Home", col, NO_COLOR);

	Line(600, 120, 640, 120, EGA.BLUE);

	if (sidebar.current_screen === SCREEN_NOTIFICATION) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	TextXY(600, 180, "F2:", col, NO_COLOR);
	TextXY(600, 188, "Noti", col, NO_COLOR);

	Line(600, 240, 640, 240, EGA.BLUE);

	if (sidebar.current_screen === SCREEN_TOOT) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	TextXY(600, 300, "F3:", col, NO_COLOR);
	TextXY(600, 308, "Toot", col, NO_COLOR);

	Line(600, 360, 640, 360, EGA.BLUE);

	if (sidebar.current_screen === SCREEN_TBD) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	TextXY(600, 420, "F4:", col, NO_COLOR);
	TextXY(600, 428, "TBD", col, NO_COLOR);
}

/**
 * try to convert HTML to plain text and remove everything that is not between charactercodes 32 " " and 126 "~".
 * 
 * @param {string} html the html string
 * 
 * @returns plain text
 */
function removeHTML(html) {
	// Println("html  =" + html);
	var noTags = StripTags(html);
	// Println("notags=" + noTags);
	var unEsc = unescapeHTML(noTags);
	// Println("unesc =" + unEsc);
	var uniFree = unEsc.replace(/[^\x20-\xFF]/g, " ");
	// var uniFree = unEsc.replace(/[^\x20-\x7E]/g, " ");
	// Println("unfree=" + uniFree);
	return uniFree;
}

//////
// https://stackoverflow.com/questions/19985667/how-to-convert-html-page-to-plain-text-in-node-js/65739861#65739861
function StripTags(html) {
	//return html.replace(/(&lt;([^>]+)>)/gi, "");
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