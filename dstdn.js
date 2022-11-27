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

Include("mstdn.js");
Include("login.js");
Include("home.js");
Include("toot.js");
Include("notific.js");
Include("profile.js");
Include("imgcache.js");
Include("util.js");
Include("info.js");

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

var m = null;
var creds = null;
var splash = null;
var logo = null;
var sfont = null;
var lfont = null;

// screens
var home = null;
var profile = null;
var toot = null;
var notifications = null;
var info = null;
var current_screen = null;

function Setup() {
	Println("Resolve(google.com) = " + JSON.stringify(Resolve("google.com")));

	MouseShowCursor(false);

	// load images
	splash = new Bitmap(SPLASH_SCREEN);
	logo = new Bitmap(MASTODON_LOGO);

	// load fonts
	sfont = new Font(JSBOOTPATH + "fonts/pc8x8.fnt");
	lfont = new Font(JSBOOTPATH + "fonts/pc8x16.fnt");

	// load sounds
	home_snd = new Sample("invplop.wav");
	noti_snd = new Sample("plop.wav");
	toot_snd = new Sample("toot.wav");
	boost_snd = new Sample("boost.wav");
	fav_snd = new Sample("fav.wav");

	// create screens
	home = new Home();
	toot = new Toot();
	notifications = new Notifications();
	profile = new Profile();
	info = new Info();

	current_screen = home;

	// sfont = new Font(JSBOOTPATH + "fonts/unir08.fnt");
	// sfont = new Font(JSBOOTPATH + "fonts/unir09.fnt");
}

function Loop() {
	// startup+splash
	if (splash) {
		ClearScreen(EGA.BLACK);
		splash.Draw(0, 0);
		sfont.DrawStringCenter(Width / 2, Height / 4, "Loggin in...", EGA.BLACK, NO_COLOR);
		splash = null;
	} else if (!m) {
		// login
		m = Login();
	} else {
		try {
			ClearScreen(EGA.BLACK);
			if (!profile.Draw()) {
				current_screen.Draw();
			}
			DisplaySidebar();
		} catch (e) {
			Println(e);
		}
		info.Update();
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
				current_screen = home;
				break;
			case KEY.Code.KEY_F2:
				current_screen = notifications;
				break;
			case KEY.Code.KEY_F3:
				current_screen = toot;
				break;
			case KEY.Code.KEY_F4:
				current_screen = info;
				break;
			default:
				profile.Input(key, keyCode, String.fromCharCode(key));
				var res = current_screen.Input(key, keyCode, String.fromCharCode(key));
				if (res) {
					current_screen = toot;
				}
				break;
		}
	}
}

function DisplaySidebar() {
	var col;

	var xStart = CONTENT_WIDTH;
	var xStartTxt = xStart + 4;

	// 120 pixel height per box
	Line(xStart, 0, xStart, 480, EGA.BLUE);

	if (current_screen === home) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	sfont.DrawStringLeft(xStartTxt, 60, "F1:", col, NO_COLOR);
	sfont.DrawStringLeft(xStartTxt, 68, "Home", col, NO_COLOR);

	Line(xStart, 120, Width, 120, EGA.BLUE);

	if (current_screen === notifications) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	sfont.DrawStringLeft(xStartTxt, 180, "F2:", col, NO_COLOR);
	sfont.DrawStringLeft(xStartTxt, 188, "Noti", col, NO_COLOR);

	Line(xStart, 240, Width, 240, EGA.BLUE);

	if (current_screen === toot) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	sfont.DrawStringLeft(xStartTxt, 300, "F3:", col, NO_COLOR);
	sfont.DrawStringLeft(xStartTxt, 308, "Toot", col, NO_COLOR);

	Line(xStart, 360, Width, 360, EGA.BLUE);

	if (current_screen === info) {
		col = EGA.LIGHT_RED;
	} else {
		col = EGA.LIGHT_BLUE;
	}
	sfont.DrawStringLeft(xStartTxt, 420, "F4:", col, NO_COLOR);
	sfont.DrawStringLeft(xStartTxt, 428, "Info", col, NO_COLOR);
}
