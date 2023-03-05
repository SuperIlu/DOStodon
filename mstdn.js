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
	this.num_requests = 0;
	this.req_time = 0;
	this.failed_requests = 0;

	this.get = new Curl();

	this.post = new Curl();
}

/**
 * do post request with header and post-data.
 * 
 * @param {string[][]} header array of key-value-pairs as 2 element arrays
 * @param {string[][]} postdata array of key-value-pairs as 2 element arrays
 * @param {string} url the server url
 * 
 * @returns the https-response like Curl.DoRequest()
 */
Mastodon.prototype.DoPost = function (header, postdata, url) {
	// Println("POST:" + url);
	// this.post = new Curl();
	this.post.ClearHeaders();
	for (var i = 0; i < header.length; i++) {
		this.post.AddHeader(header[i][0]);
	}

	this.post.ClearPostData();
	for (var i = 0; i < postdata.length; i++) {
		this.post.AddPostData(postdata[i][0], postdata[i][1]);
	}

	// do request and track numbers/time
	var start = new Date();
	this.post.SetPost();
	var resp = this.post.DoRequest(url);
	var end = new Date();
	this.num_requests++;
	this.req_time += (end - start);
	if (resp[2] !== 200) {
		this.failed_requests++;
	}
	// Println("POST:" + resp[0].ToString());
	// Println("POST:" + resp[1].ToString());
	// Println("POST:" + resp[2]);
	return resp;
}

/**
 * do get request with header.
 * 
 * @param {string[][]} header array of key-value-pairs as 2 element arrays
 * @param {string} url the server url
 * 
 * @returns the https-response like Curl.DoRequest()
 */
Mastodon.prototype.DoGet = function (header, url) {
	// Println("GET:" + url);
	// this.get = new Curl();
	this.get.ClearHeaders();
	for (var i = 0; i < header.length; i++) {
		this.get.AddHeader(header[i][0]);
	}

	// do request and track numbers/time
	var start = new Date();
	this.get.SetGet();
	var resp = this.get.DoRequest(url);
	var end = new Date();
	this.num_requests++;
	this.req_time += (end - start);
	if (resp[2] !== 200) {
		this.failed_requests++;
	}
	// Println("GET:" + resp[0].ToString());
	// Println("GET:" + resp[1].ToString());
	// Println("GET:" + resp[2]);
	return resp;
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
 * @param {string} [website] the website of the application
 * 
 * @returns client id and secret.
 */
Mastodon.prototype.CreateApp = function (appName, website) {
	var headers = [];
	var postdata = [
		['client_name', appName],
		['redirect_uris', 'urn:ietf:wg:oauth:2.0:oob'],
		['scopes', 'read write follow push']
	];

	if (website) {
		postdata.push(['website', website]);
	}

	var resp = this.DoPost(headers, postdata, this.base_url + "/api/v1/apps");

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
	var headers = [];
	var postdata = [
		['username', user],
		['password', pw],
		['redirect_uri', 'urn:ietf:wg:oauth:2.0:oob'],
		['grant_type', 'password'],
		['client_id', this.client_id],
		['client_secret', this.client_secret],
		['scope', 'read write follow push']
	];

	var resp = this.DoPost(headers, postdata, this.base_url + "/oauth/token");

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
 * @param {string} [reply_id] id of a toot to reply to.
 * @param {string} [spoiler] a spoiler text. Sets this status to 'sensitive=true'.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Toot = function (txt, reply_id, spoiler) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];
	var postdata = [
		['status', txt]
	];

	// append reply id (if any)
	if (reply_id) {
		postdata.push(['in_reply_to_id', reply_id]);
	}

	// append spoiler/sensitive info
	if (spoiler) {
		postdata.push(['sensitive', true]);
		postdata.push(['spoiler_text', spoiler]);
	}

	var resp = this.DoPost(headers, postdata, this.base_url + "/api/v1/statuses");

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Toot failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * run opration on toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * @param {string} op the opration.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.changeStatus = function (id, op) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];
	var postdata = [
		['dummy', "data"]
	];

	var resp = this.DoPost(headers, postdata, this.base_url + "/api/v1/statuses/" + id + "/" + op);


	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error(op + " failed: " + resp[2] + ": " + resp[0].ToString());
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
	return this.changeStatus(id, "favourite");
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
	return this.changeStatus(id, "reblog");
}

/**
 * bookmark a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Bookmark = function (id) {
	return this.changeStatus(id, "bookmark");
}

/**
 * unfavorite a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.UnFavorite = function (id) {
	return this.changeStatus(id, "unfavourite");
}

/**
 * unboost a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.UnReblog = function (id) {
	return this.changeStatus(id, "unreblog");
}

/**
 * unbookmark a toot (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.UnBookmark = function (id) {
	return this.changeStatus(id, "unbookmark");
}

/**
 * get toots from server: home
 * @see https://docs.joinmastodon.org/methods/timelines/
 * 
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [id] last fetched id, if set only never entries will be fetched
 * @param {bool} [older] if true, entries older than id are fetched, if false entries newer than id.
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.TimelineHome = function (limit, id, older) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/timelines/home?limit=" + limit;
	if (id) {
		if (older) {
			url += "&max_id=" + id;
		} else {
			url += "&since_id=" + id;
		}
	}

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Home timeline failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get toots from server: tag
 * @see https://docs.joinmastodon.org/methods/timelines/
 * 
 * @param {string} tag the tag to search for (without leading '#')
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [id] last fetched id, if set only never entries will be fetched
 * @param {bool} [older] if true, entries older than id are fetched, if false entries newer than id.
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.TimelineTag = function (tag, limit, id, older) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/timelines/tag/" + tag + "?limit=" + limit;
	if (id) {
		if (older) {
			url += "&max_id=" + id;
		} else {
			url += "&since_id=" + id;
		}
	}

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Tag timeline failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get toots from server: account
 * @see https://docs.joinmastodon.org/methods/accounts/#statuses
 * 
 * @param {string} account the account id to fetch statuses from
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [id] last fetched id, if set only never entries will be fetched
 * @param {bool} [older] if true, entries older than id are fetched, if false entries newer than id.
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.TimelineAccount = function (account, limit, id, older) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/accounts/" + account + "/statuses?limit=" + limit;
	if (id) {
		if (older) {
			url += "&max_id=" + id;
		} else {
			url += "&since_id=" + id;
		}
	}

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Account timeline failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get toots from server: public
 * @see https://docs.joinmastodon.org/methods/timelines/
 * 
 * @param {boolean} local get local (true) or global (false) timeline.
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [id] last fetched id, if set only never entries will be fetched
 * @param {bool} [older] if true, entries older than id are fetched, if false entries newer than id.
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.TimelinePublic = function (local, limit, id, older) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/timelines/public?limit=" + limit;
	if (id) {
		if (older) {
			url += "&max_id=" + id;
		} else {
			url += "&since_id=" + id;
		}
	}
	if (local) {
		url += "&local=true";
	} else {
		url += "&local=false";
	}

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Public timeline failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get bookmarks from server
 * @see https://docs.joinmastodon.org/methods/bookmarks/
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Bookmarks = function () {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/bookmarks?limit=40"

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Bookmarks failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get favourites from server
 * @see https://docs.joinmastodon.org/methods/favourites/
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/status/, an exception is thrown for an error
 */
Mastodon.prototype.Favourites = function () {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/favourites?limit=40"

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Bookmarks failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get notifications from server
 * @see https://docs.joinmastodon.org/methods/notifications/
 * 
 * @param {number} [limit] max number of entries to fetch, default: 10
 * @param {number} [id] last fetched id, if set only never entries will be fetched
 * @param {bool} [older] if true, entries older than id are fetched, if false entries newer than id.
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/notification/, an exception is thrown for an error
 */
Mastodon.prototype.Notifications = function (limit, id, older) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	limit = limit || 10;

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/notifications?limit=" + limit;
	if (id) {
		if (older) {
			url += "&max_id=" + id;
		} else {
			url += "&since_id=" + id;
		}
	}

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Notifications failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * get account relationships from the server
 * 
 * @param {string[]} ids the list of ids to fetch the status for
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/Relationship/
 */
Mastodon.prototype.GetRelationships = function (ids) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/accounts/relationships";
	for (var i = 0; i < ids.length; i++) {
		if (i == 0) {
			url += "?id[]=" + ids[i];
		} else {
			url += "&id[]=" + ids[i];
		}
	}

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("Relationships failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * run opration on account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * @param {string} op the opration.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.changeAccount = function (id, op) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];
	var postdata = [
		['dummy', "data"]
	];

	var resp = this.DoPost(headers, postdata, this.base_url + "/api/v1/accounts/" + id + "/" + op);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error(op + " failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * follow an account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.Follow = function (id) {
	return this.changeAccount(id, "follow");
}

/**
 * unfollow an account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.UnFollow = function (id) {
	return this.changeAccount(id, "unfollow");
}

/**
 * block an account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.Block = function (id) {
	return this.changeAccount(id, "block");
}

/**
 * unblock an account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.UnBlock = function (id) {
	return this.changeAccount(id, "unblock");
}

/**
 * mute an account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.Mute = function (id) {
	return this.changeAccount(id, "mute");
}

/**
 * unmute an account.
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Relationship/, an exception is thrown for an error
 */
Mastodon.prototype.UnMute = function (id) {
	return this.changeAccount(id, "unmute");
}

/**
 * get toot context (status).
 * @see https://docs.joinmastodon.org/methods/statuses/
 * 
 * @param {string} id the toot id.
 * 
 * @returns a https://docs.joinmastodon.org/entities/Context/, an exception is thrown for an error
 */
Mastodon.prototype.Context = function (id) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var resp = this.DoGet(headers, this.base_url + "/api/v1/statuses/" + id + "/context");

	if (resp[2] === 200) {
		var res = JSON.parse(resp[0].ToString());
		return res
	} else {
		throw new Error("Context failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * Find accounts on the server (max 80)
 * 
 * @param {string} q the query string
 * @param {boolean} following Limit the search to users you are following. Defaults to false.
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/Account/
 */
Mastodon.prototype.FindAccounts = function (q, following) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	// build URL
	var url = this.base_url + "/api/v1/accounts/search?q=" + encodeURIComponent(q);
	if (following) {
		url += "following=true";
	}
	url += "&limit=80";

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("FindAccounts failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * Get account follows/-er (80 max).
 * @see https://docs.joinmastodon.org/methods/accounts/
 * 
 * @param {string} id the account id.
 * @param {bool} following true to get the following, false to get followers
 * 
 * @returns an array of https://docs.joinmastodon.org/entities/Account/, an exception is thrown for an error
 */
Mastodon.prototype.GetFollow = function (id, following) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var op;
	if (following) {
		op = "following";
	} else {
		op = "followers";
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	var resp = this.DoGet(headers, this.base_url + "/api/v1/accounts/" + id + "/" + op + "?limit=80");

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error(op + " failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * Save timeline position.
 * 
 * @param {string} id the last-id to save
 * @param {*} home true for home timeline, false for notifications
 * 
 * @returns see https://docs.joinmastodon.org/methods/markers/#create
 */
Mastodon.prototype.SetMarker = function (id, home) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	var postdata = [];
	if (home) {
		postdata.push(['home[last_read_id]', id]);
	} else {
		postdata.push(['notifications[last_read_id]', id]);
	}

	var resp = this.DoPost(headers, postdata, this.base_url + "/api/v1/markers");

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("SetMarkers failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

/**
 * Get timeline marker.
 * 
 * @param {bool} home true to get the home marker, false for the notification marker
 * 
 * @returns see https://docs.joinmastodon.org/methods/markers/#get
 */
Mastodon.prototype.GetMarker = function (home) {
	if (!this.token) {
		throw new Error("No credential set");
	}

	var url = this.base_url + "/api/v1/markers?timeline[]=";

	if (home) {
		url += 'home';
	} else {
		url += 'notifications';
	}

	var headers = [
		['Authorization: Bearer ' + this.token]
	];

	var resp = this.DoGet(headers, url);

	if (resp[2] === 200) {
		return JSON.parse(resp[0].ToString());
	} else {
		throw new Error("GetMarkers failed: " + resp[2] + ": " + resp[0].ToString());
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Mastodon = Mastodon;
