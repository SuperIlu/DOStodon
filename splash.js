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

function Splash() {
	this.splash = new Bitmap(SPLASH_SCREEN);
	this.txt = "Startup...";
	this.chain = new EvalChain();

	var outer = this;

	this.chain.Add(function () { outer.txt = "Loading Config..."; });
	this.chain.Add(function () { dstdn.c = new Config(); });

	this.chain.Add(function () { outer.txt = "Loading Logo..."; });
	this.chain.Add(function () { dstdn.logo = new Bitmap(MASTODON_LOGO); });

	this.chain.Add(function () { outer.txt = "Loading tiny font..."; });
	this.chain.Add(function () { dstdn.tfont = new Font(JSBOOTPATH + "fonts/pc6x8.fnt"); });

	this.chain.Add(function () { outer.txt = "Loading small font..."; });
	this.chain.Add(function () { dstdn.sfont = new Font(); });

	this.chain.Add(function () { outer.txt = "Loading large font..."; });
	this.chain.Add(function () { dstdn.lfont = new Font(JSBOOTPATH + "fonts/univ14.fnt"); });

	this.chain.Add(function () { outer.txt = "Loading home sound..."; });
	this.chain.Add(function () { dstdn.home_snd = new Sample("invplop.wav"); });

	this.chain.Add(function () { outer.txt = "Loading notification sound..."; });
	this.chain.Add(function () { dstdn.noti_snd = new Sample("plop.wav"); });

	this.chain.Add(function () { outer.txt = "Loading toot sound..."; });
	this.chain.Add(function () { dstdn.toot_snd = new Sample("toot.wav"); });

	this.chain.Add(function () { outer.txt = "Loading boost sound..."; });
	this.chain.Add(function () { dstdn.boost_snd = new Sample("boost.wav"); });

	this.chain.Add(function () { outer.txt = "Loading fav sound..."; });
	this.chain.Add(function () { dstdn.fav_snd = new Sample("fav.wav"); });

	this.chain.Add(function () { outer.txt = "Creating file selector..."; });
	this.chain.Add(function () { dstdn.file_sel = new FileSelector(); });

	this.chain.Add(function () { outer.txt = "Creating HOME screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_HOME] = new Home(function (outer, max, id, older) { return dstdn.m.TimelineHome(max, id, older); }, HOME_HOME); });

	this.chain.Add(function () { outer.txt = "Creating LOCAL screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_LOCAL] = new Home(function (outer, max, id, older) { return dstdn.m.TimelinePublic(true, max, id, older); }, HOME_LOCAL); });

	this.chain.Add(function () { outer.txt = "Creating GLOBAL screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_GLOBAL] = new Home(function (outer, max, id, older) { return dstdn.m.TimelinePublic(false, max, id, older); }, HOME_GLOBAL); });

	this.chain.Add(function () { outer.txt = "Creating TAG screen..."; });
	this.chain.Add(function () {
		dstdn.all_screens[SCR_TAG] = new Home(
			function (outer, max, id, older) {
				if (outer.tag) {
					if (outer.tag.length > 0) {
						return dstdn.m.TimelineTag(outer.tag, max, id, older);
					}
				} else {
					HashTagDialog(outer);
				}
				return [];
			}, HOME_TAG);
	});

	this.chain.Add(function () { outer.txt = "Creating BOOKMARK screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_BMARK] = new Home(function (outer, max, id, older) { outer.current_list = []; return dstdn.m.Bookmarks(); }, HOME_BMARK); });

	this.chain.Add(function () { outer.txt = "Creating FAVORITES screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_FAV] = new Home(function (outer, max, id, older) { outer.current_list = []; return dstdn.m.Favourites(); }, HOME_FAV); });

	this.chain.Add(function () { outer.txt = "Creating NOTIFICATION screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_NOTI] = new Notifications(); });

	this.chain.Add(function () { outer.txt = "Creating TOOT screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_TOOT] = new Toot(); });

	this.chain.Add(function () { outer.txt = "Creating INFO screen..."; });
	this.chain.Add(function () { dstdn.all_screens[SCR_INFO] = new Info(); });

	this.chain.Add(function () { outer.txt = "Creating PROFILE screen..."; });
	this.chain.Add(function () { dstdn.profile = new Profile(); });

	this.chain.Add(function () { outer.txt = "Creating ImageCache..."; });
	this.chain.Add(function () { dstdn.cache = new ImageCache(); });

	this.chain.Add(function () { outer.txt = "Logging in..."; });
	this.chain.Add(function () { outer.login(); });

	this.chain.Add(function () { outer.txt = "DONE!"; });
	this.chain.Add(function () { Sleep(1); });

	this.length = this.chain.Size();
	this.stepSize = (640 - 2 * LIST_IMG_SIZE) / this.length;
}

Splash.prototype.Draw = function () {
	this.splash.Draw(0, 0);
	TextXY(LIST_IMG_SIZE, LIST_IMG_SIZE, this.txt, EGA.BLACK, NO_COLOR);
	TextXY(LIST_IMG_SIZE, Height - LIST_IMG_SIZE, "(c) 2022-2023 by <superilu@yahoo.com>", EGA.BLACK, NO_COLOR);

	var boxWidth = (this.length - this.chain.Size()) * this.stepSize;
	FilledBox(LIST_IMG_SIZE, 2 * LIST_IMG_SIZE, 20 + boxWidth, 2 * LIST_IMG_SIZE + PROGRESS_HEIGHT, EGA.RED);

	Box(LIST_IMG_SIZE, 2 * LIST_IMG_SIZE, 20 + this.length * this.stepSize, 2 * LIST_IMG_SIZE + PROGRESS_HEIGHT, EGA.BLACK);

	if (!this.chain.Step()) {
		this.splash = null;
		dstdn.current_screen = dstdn.all_screens[SCR_HOME];
	}
}

Splash.prototype.login = function () {
	Println("Logging in...");
	if (FileExists(CREDS_FILE)) {
		// read config, re-use login
		dstdn.creds = JSON.parse(Read(CREDS_FILE));
		dstdn.m = new Mastodon(dstdn.creds.url);
		dstdn.m.SetSecrets(dstdn.creds.client_id, dstdn.creds.client_secret, dstdn.creds.token);
		Println("Using CREDS.JSN");
	} else if (ARGS.length >= 4) {
		// try to login with command line parameters
		var instance = ARGS[1];
		var user = ARGS[2];
		var password = ARGS[3];

		dstdn.creds = {};
		dstdn.creds.url = FormatURL(instance);
		dstdn.m = new Mastodon(dstdn.creds.url);
		var resp = dstdn.m.CreateApp("DOStodon", "https://github.com/SuperIlu/DOStodon");
		dstdn.creds.client_id = resp.client_id;
		dstdn.creds.client_secret = resp.client_secret;

		// login
		var resp = dstdn.m.Login(user, password);
		dstdn.creds.token = resp.access_token;

		// save data
		var f = new File(CREDS_FILE, FILE.WRITE);
		f.WriteString(JSON.stringify(dstdn.creds));
		f.Close();
		Println("Created CREDS.JSN");
	} else {
		// print usage
		msg = "Usage:\n";
		msg += "Please run 'DOStodon <server> <username> <password>'\n";
		msg += "Example:\n";
		msg += "  DOStodon mastodon.social jon@somwhere.sw 1234567890'\n";
		SetExitMessage(msg);
		Println("No credentials");
		Stop();
	}

	// Println(JSON.stringify(dstdn.m.GetMarker(true)));
	// Println(JSON.stringify(dstdn.m.GetMarker(false)));
}

Splash.prototype.Input = function (key, keyCode, char, eventKey) {
	return false;
}

var messages = [
	"grooming the unicorns",
	"licking the tootsie roll",
	"pedicuring the mastodon",
	"blowing out the trunk",
	"brushing the fur",
	"sharpening tusks",
	"staring into the void",
	"hunting cave men",
	"memorising random facts",
	"considering the history of proboscideans",
	"tooting into the void",
	"avoiding the monolith",
	"bathing in mud",
	"following the herd",
	"regaling the young",
	"patrolling the jungle",
	"grazing the field of toots",
	"greeting joane mastodon",
	"checking for quote toots",
	"thanking the moderators"
];

// export functions and version
exports.__VERSION__ = 1;
exports.Splash = Splash;
