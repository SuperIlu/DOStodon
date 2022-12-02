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

function Login() {
	var m;

	Print("Logging in...");
	if (FileExists(CREDS_FILE)) {
		// read config, re-use login
		creds = JSON.parse(Read(CREDS_FILE));
		m = new Mastodon(creds.url);
		m.SetSecrets(creds.client_id, creds.client_secret, creds.token);
		Println("Using CREDS.JSN");
		Sleep(1000);
		return m;
	} else if (ARGS.length >= 4) {
		// try to login with command line parameters
		var instance = ARGS[1];
		var user = ARGS[2];
		var password = ARGS[3];

		creds = {};
		creds.url = FormatURL(instance);
		m = new Mastodon(creds.url);
		var resp = m.CreateApp("DOStodon", "https://github.com/SuperIlu/DOStodon");
		creds.client_id = resp.client_id;
		creds.client_secret = resp.client_secret;

		// login
		var resp = m.Login(user, password);
		creds.token = resp.access_token;

		// save data
		var f = new File(CREDS_FILE, FILE.WRITE);
		f.WriteString(JSON.stringify(creds));
		f.Close();
		Println("Created CREDS.JSN");
		return m;
	} else {
		// print usage
		msg = "Usage:\n";
		msg += "Please run 'DOStodon <server> <username> <password>'\n";
		msg += "Example:\n";
		msg += "  DOStodon mastodon.social jon@somwhere.sw 1234567890'\n";
		SetExitMessage(msg);
		Println("No credentials");
		Stop();
		return null;
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Login = Login;
