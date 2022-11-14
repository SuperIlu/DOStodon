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

function Mastodon(url) {
	this.base_url = url || "https://mastodon.social";
	this.client_id = null;
	this.client_secret = null;
	this.token = null;
}

Mastodon.prototype.SetSecrets = function (cId, cSecret, tkn) {
	this.client_id = cId;
	this.client_secret = cSecret;
	this.token = tkn;
}

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

Mastodon.prototype.Toot = function (txt) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var post = new Curl();
	post.AddPostData('redirect_uris', 'urn:ietf:wg:oauth:2.0:oob');
	post.AddPostData('scopes', 'read write follow push');
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
	var resp = post.DoRequest(url);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Home timeline failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

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
