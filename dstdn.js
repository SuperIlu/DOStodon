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

//DEBUG = true;
LoadLibrary("curl");
LoadLibrary("jpeg");
LoadLibrary("png");
LoadLibrary("sqlite");
LoadLibrary("webp");

Include("evchain");

Include("mstdn.js");
Include("splash.js");
Include("home.js");
Include("toot.js");
Include("notific.js");
Include("profile.js");
Include("util.js");
Include("info.js");
Include("lrucache.js");
Include("imgcache.js");
Include("dialogs.js");
Include("config.js");
Include("filesel.js");

var CREDS_FILE = "CREDS.JSN";
var TMP_FILE = "TMPIMG";
var SPLASH_SCREEN = "splash.png"
var MASTODON_LOGO = "MLOGO.PNG";

var MAX_TOOTS_IN_LIST = 50;
var TXT_SIZE = 9;		// text height
var TXT_MAX = 500;		// max length of function
var TXT_LINE_LENGTH = 73; // max length of a line on screen
var LIST_IMG_SIZE = 32;
var PROFILE_IMG_SIZE = 200;
var CONTENT_WIDTH = 600;
var PROGRESS_HEIGHT = 10;

var LIST_IMAGE_SPACING = LIST_IMG_SIZE + LIST_IMG_SIZE / 2 + 8;

var INDENT_CHARS = 1;

var SCR_HOME = 0;
var SCR_NOTI = 1;
var SCR_TAG = 2;
var SCR_LOCAL = 3;
var SCR_GLOBAL = 4;
var SCR_BMARK = 5;
var SCR_FAV = 6;
var SCR_TOOT = 9;
var SCR_INFO = 10;

var HOME_HOME = 1;
var HOME_LOCAL = 2;
var HOME_GLOBAL = 3;
var HOME_TAG = 4;
var HOME_BMARK = 5;
var HOME_FAV = 6;
var HOME_CONTEXT = 7;
var HOME_ACCOUNT = 8;

// extra keycodes
var KEY_CTRL_1 = 7170;
var KEY_CTRL_2 = 7426;
var KEY_CTRL_3 = 7682;
var KEY_CTRL_4 = 7938;

var KEY_CTRL_A = 257;
var KEY_CTRL_B = 514;
var KEY_CTRL_C = 771;
var KEY_CTRL_H = 2056;
var KEY_CTRL_L = 3084;
var KEY_CTRL_M = 3341;
var KEY_CTRL_P = 4112;
var KEY_CTRL_S = 4883;
var KEY_CTRL_T = 5140;
var KEY_CTRL_W = 5911;

// contains all instance data
var dstdn = {
	m: null,
	c: null,
	creds: null,
	logo: null,
	tfont: null,
	sfont: null,
	lfont: null,
	profile: null,
	current_screen: null,
	dialog: null,
	file_sel: null,
	all_screens: [],
	screenshot_count: 1,
	return_to: null
};

function sslTest(url) {
	Println("+++ Trying " + url)

	var https = new Curl();
	var resp = https.DoRequest(url);
	if (resp[2] != 200) {
		Println("+++ FAIL " + url)
	} else {
		Println("+++ OK  " + url)
	}
}

/*
** This function is called once when the script is started.
*/

function Setup() {
	Println("Resolve(google.com) = " + JSON.stringify(Resolve("google.com")));
	Println("Date/Time           = " + new Date());

	// simple https get
	// sslTest("https://mastodon.social/about");
	// sslTest("https://retrochat.online/about");
	// sslTest("https://bitbang.social/about");
	// sslTest("https://raw.githubusercontent.com/SuperIlu/DOjSHPackages/master/dojs/index.json");
	// sslTest("https://curl.se");
	// sslTest("https://www.shdon.com/");
	// sslTest("https://www.heise.de");

	Println("DOJS_ENCODING=" + DOJS_ENCODING);
	SetMissingCharacter(" ");

	MouseShowCursor(false);
	dstdn.current_screen = new Splash();
}

function Loop() {
	try {
		ClearScreen(EGA.BLACK);
		if (!dstdn.profile || !dstdn.profile.Draw()) {
			dstdn.current_screen.Draw();
		}
	} catch (e) {
		Println(e);
	}
	if (dstdn.all_screens[SCR_INFO]) {
		dstdn.all_screens[SCR_INFO].Update();
	}

	if (dstdn.dialog) {
		dstdn.dialog.Draw();
	}
}

function Input(e) {
	if (e.key != -1) {
		var key = e.key & 0xFF;
		var keyCode = e.key >> 8;
		var char = String.fromCharCode(key);

		// Println("\nEventKey:" + e.key);
		// Println("Key:" + key);
		// Println("KeyCode:" + keyCode);
		// Println("Char:" + char);

		if (e.key == KEY_CTRL_S) {
			SavePngImage(dstdn.screenshot_count + ".PNG");
			dstdn.screenshot_count++;
		} else if (e.key == KEY_CTRL_C) {
			// TODO: show config
			dstdn.dialog = new Settings();
		} else if (e.key == KEY_CTRL_P) {
			if (!dstdn.dialog) {
				var outer = this;
				dstdn.dialog = new SearchField("Enter name/handle", outer.search_handle ? outer.search_handle : "",
					function (txt) {
						if (txt) {
							var res = dstdn.m.FindAccounts(txt);
							res.forEach(function (e) {
								e['dstdn_list_name'] = RemoveHTML("@" + e['acct'] + " (" + e['display_name'] + ")").substring(0, 60);
							});
							return res;
						} else {
							dstdn.dialog = null;
						}
					},
					function (e) {
						return e['dstdn_list_name'];
					},
					function (a) {
						if (a) {
							if (dstdn.current_screen === dstdn.all_screens[SCR_TOOT]) {
								dstdn.current_screen.txt += " @" + a['acct'];
							} else {
								dstdn.profile.SetProfile(a);
							}
						}
						dstdn.dialog = null;
					});
			}
		} else {
			if (dstdn.dialog) {
				dstdn.dialog.Input(key, keyCode, char, e.key);
			} else if (!dstdn.profile || !dstdn.profile.Input(key, keyCode, char, e.key)) {
				switch (keyCode) {
					case KEY.Code.KEY_F1:
					case KEY.Code.KEY_F2:
					case KEY.Code.KEY_F3:
					case KEY.Code.KEY_F4:
					case KEY.Code.KEY_F5:
					case KEY.Code.KEY_F6:
					case KEY.Code.KEY_F7:
					case KEY.Code.KEY_F8:
					case KEY.Code.KEY_F9:
					case KEY.Code.KEY_F10:
					case KEY.Code.KEY_F11:
						var idx = keyCode - KEY.Code.KEY_F1;
						if (dstdn.all_screens[idx]) {
							dstdn.current_screen = dstdn.all_screens[idx];
							return_to = null;
						}
						break;
					default:
						var res = dstdn.current_screen.Input(key, keyCode, char, e.key);
						if (res) {
							dstdn.current_screen = dstdn.all_screens[SCR_TOOT];
						}
						break;
				}
			}
		}
	}
}
