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

var CREDS_FILE = "CREDS.JSN";
var TMP_FILE = "TMPIMG";
var SPLASH_SCREEN = "splash.png"
var MASTODON_LOGO = "MLOGO.PNG";

var MAX_TOOTS_IN_LIST = 50;
var TXT_SIZE = 9;		// text height
var TXT_MAX = 500;		// max length of function
var TXT_LINE_LENGTH = 73; // max length of a line on screen
var POLL_DELAY = (5 * 60 * 1000)
var LIST_IMG_SIZE = 32;
var PROFILE_IMG_SIZE = 200;
var CONTENT_WIDTH = 600;
var MAX_POLL = 30;
var PROGRESS_HEIGHT = 10;

var SCR_HOME = 0;
var SCR_NOTI = 1;
var SCR_TAG = 2;
var SCR_LOCAL = 3;
var SCR_GLOBAL = 4;
var SCR_BMARK = 5;
var SCR_FAV = 6;
var SCR_TOOT = 9;
var SCR_INFO = 10;

// contains all instance data
var dstdn = {
	m: null,
	creds: null,
	logo: null,
	sfont: null,
	lfont: null,
	profile: null,
	current_screen: null,
	get_text: null,
	all_screens: []
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

	if (dstdn.get_text) {
		dstdn.get_text.Draw();
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
		// Println("Char:" + String.fromCharCode(key));

		if (dstdn.get_text) {
			dstdn.get_text.Input(key, keyCode, char);
		} else if (!dstdn.profile || !dstdn.profile.Input(key, keyCode, char)) {
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
					}
					break;
				default:
					var res = dstdn.current_screen.Input(key, keyCode, char);
					if (res) {
						dstdn.current_screen = dstdn.all_screens[SCR_TOOT];
					}
					break;
			}
		}
	}
}
