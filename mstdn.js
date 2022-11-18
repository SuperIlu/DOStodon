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

/**
 * create a Mastodon object.
 * 
 * @param {string} [url] server url, default: "https://mastodon.social"
 */
function Mastodon(url) {
	this.base_url = url || "https://mastodon.social";
	this.client_id = null;
	this.client_secret = null;
	this.token = null;
}

/**
 * Set secrets for server communication (obtained by previous calls to CreateApp() and Login()).
 * 
 * @param {string} cId client id.
 * @param {string} cSecret client secret.
 * @param {string} tkn access token.
 */
Mastodon.prototype.SetSecrets = function (cId, cSecret, tkn) {
	this.client_id = cId;
	this.client_secret = cSecret;
	this.token = tkn;
}

/**
 * create an app on the server. The client id and secret are stored in this Mastodon instance on success.
 * @see https://docs.joinmastodon.org/methods/apps/
 * 
 * @param {string} appName name of the app.
 * 
 * @returns client id and secret.
 */
Mastodon.prototype.CreateApp = function (appName) {
	var post = new Curl();
	post.AddPostData('client_name', appName);
	post.AddPostData('redirect_uris', 'urn:ietf:wg:oauth:2.0:oob');
	post.AddPostData('scopes', 'read write follow push');
	post.SetPost();
	var resp = post.DoRequest(this.base_url + "/api/v1/apps");

	if (resp[2] === 200) {
		var response = JSON.parse(resp[0].ToString());
		this.client_id = response['client_id'];
		this.client_secret = response['client_secret'];
		return response;
	} else {
		throw new Error("Registration failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * Log into the server. The access token is stored in this Mastodon instance on success.
 * @see https://docs.joinmastodon.org/methods/apps/oauth/
 * 
 * @param {string} user account name/eMail address
 * @param {string} pw password
 * 
 * @returns an access token.
 */
Mastodon.prototype.Login = function (user, pw) {
	var post = new Curl();
	post.AddPostData('username', user);
	post.AddPostData('password', pw);
	post.AddPostData('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');
	post.AddPostData('grant_type', 'password');
	post.AddPostData('client_id', this.client_id);
	post.AddPostData('client_secret', this.client_secret);
	post.AddPostData('scope', 'read write follow push');
	post.SetPost();
	var resp = post.DoRequest(this.base_url + "/oauth/token");

	if (resp[2] === 200) {
		var response = JSON.parse(resp[0].ToString());
		this.token = response['access_token'];
		return response;
	} else {
		throw new Error("Login failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * post a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} txt the text to toot.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Toot = function (txt) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var post = new Curl();
	post.AddPostData('status', txt);
	post.SetPost();
	post.AddHeader('Authorization: Bearer ' + this.token);
	var resp = post.DoRequest(this.base_url + "/api/v1/statuses");

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Toot failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * favorite a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Favorite = function (id) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var post = new Curl();
	post.AddPostData('dummy', "data");
	post.SetPost();
	post.AddHeader('Authorization: Bearer ' + this.token);
	var resp = post.DoRequest(this.base_url + "/api/v1/statuses/" + id + "/favourite");

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Favorite failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * boost a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Reblog = function (id) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var post = new Curl();
	post.AddPostData('dummy', "data");
	post.SetPost();
	post.AddHeader('Authorization: Bearer ' + this.token);
	var resp = post.DoRequest(this.base_url + "/api/v1/statuses/" + id + "/reblog");

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Favorite failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get toots from server
 * @see https://docs.joinmastodon.org/methods/timelines/
 * 
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [last] last fetched id, if set only never entries will be fetched
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.TimelineHome = function (limit, last) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var post = new Curl();
	post.SetGet();
	post.AddHeader('Authorization: Bearer ' + this.token);
	var url = this.base_url + "/api/v1/timelines/home?limit=" + limit;
	if (last) {
		url += "&since_id=" + last;
	}
	// Println(new Date() + "poll home start request " + limit + " " + last);
	var resp = post.DoRequest(url);
	// Println(new Date() + "poll home end request ");

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		// Println(new Date() + "poll home parse done");
		return res
	} else {
		throw new Error("Home timeline failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get notifications from server
 * @see https://docs.joinmastodon.org/methods/notifications/
 * 
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [last] last fetched id, if set only never entries will be fetched
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/notification/, an exception is thrown for an error
 */
Mastodon.prototype.Notifications = function (limit, last) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var post = new Curl();
	post.SetGet();
	post.AddHeader('Authorization: Bearer ' + this.token);
	var url = this.base_url + "/api/v1/notifications?limit=" + limit;
	if (last) {
		url += "&since_id=" + last;
	}
	var resp = post.DoRequest(url);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Notifications failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Mastodon = Mastodon;
