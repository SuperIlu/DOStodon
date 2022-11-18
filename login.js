
function Login() {
	var m;

	Print("Logging in...");
	if (FileExists(CREDS_FILE)) {
		// read config, re-use login
		creds = JSON.parse(Read(CREDS_FILE));
		m = new Mastodon(creds.url);
		m.SetSecrets(creds.client_id, creds.client_secret, creds.token);
		Println("Using CREDS.JSN");
		CurlRandom();
		Sleep(1000);
		CurlRandom();
		return m;
	} else if (ARGS.length >= 4) {
		// try to login with command line parameters
		var instance = ARGS[1];
		var user = ARGS[2];
		var password = ARGS[3];

		creds = {};
		creds.url = FormatURL(instance);
		m = new Mastodon(creds.url);
		var resp = m.CreateApp("DOStodon");
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
