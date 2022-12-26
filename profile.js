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

var TEXT_START_OFFSET = 10;

function Profile() {
	this.profile = null;
	this.image = null;
	this.note = null;
	this.relation = null;
	this.fetch_image = false;
}

Profile.prototype.SetProfile = function (p) {
	this.profile = p;
	this.image = null;
	this.note = null;
	this.relation = null;
	if (p) {
		this.fetch_image = true;
	}
}

Profile.prototype.Draw = function () {
	var txtStartX = PROFILE_IMG_SIZE + TEXT_START_OFFSET;
	// skip profile if none
	if (!this.profile) {
		return false;
	}

	// draw info
	if (this.image) {
		this.image.Draw(0, 0);
	} else {
		FilledBox(0, 0, PROFILE_IMG_SIZE, PROFILE_IMG_SIZE, EGA.LIGHT_GREY);
		Box(0, 0, PROFILE_IMG_SIZE, PROFILE_IMG_SIZE, EGA.GREY);
	}

	var yPos = TEXT_START_OFFSET;
	var header;

	if (this.profile['display_name']) {
		header = this.profile['display_name'] + " (@" + this.profile['acct'] + ")";
	} else {
		header = this.profile['acct'];
	}
	dstdn.lfont.DrawStringLeft(txtStartX, yPos, header, EGA.YELLOW, NO_COLOR);
	yPos += dstdn.lfont.height;
	yPos += dstdn.sfont.height;

	if (!this.note) {
		this.note = RemoveHTML(this.profile['note'])
	}
	yPos = DisplayMultilineText(txtStartX, yPos, EGA.WHITE, this.note, false, 48);
	yPos += dstdn.sfont.height;
	yPos += dstdn.sfont.height;

	var joined = "Joined: " + new Date(this.profile['created_at']).toLocaleString("de-DE");
	dstdn.lfont.DrawStringLeft(txtStartX, yPos, joined, EGA.WHITE, NO_COLOR);
	yPos += dstdn.lfont.height;
	yPos += dstdn.sfont.height;

	var stats = "Followers: " + this.profile['followers_count'];
	dstdn.sfont.DrawStringLeft(txtStartX, yPos, stats, EGA.WHITE, NO_COLOR);
	yPos += dstdn.sfont.height;
	stats = "Following: " + this.profile['following_count'];
	dstdn.sfont.DrawStringLeft(txtStartX, yPos, stats, EGA.WHITE, NO_COLOR);
	yPos += dstdn.sfont.height;
	stats = "Posts: " + this.profile['statuses_count'];
	dstdn.sfont.DrawStringLeft(txtStartX, yPos, stats, EGA.WHITE, NO_COLOR);
	yPos += dstdn.sfont.height;
	yPos += dstdn.lfont.height;

	var rel = "";
	if (this.relation) {
		if (this.relation['following']) {
			rel += "FOLLOWING\n";
		} else {
			rel += "\n";
		}
		if (this.relation['followed_by']) {
			rel += "FOLLOWS YOU\n";
		} else {
			rel += "\n";
		}
		if (this.relation['muting']) {
			rel += "MUTED\n";
		} else {
			rel += "\n";
		}
		if (this.relation['blocking']) {
			rel += "BLOCKED\n";
		} else {
			rel += "\n";
		}
		if (this.relation['blocked_by']) {
			rel += "BLOCKED YOU\n";
		} else {
			rel += "\n";
		}
	}
	yPos = DisplayMultilineText(txtStartX, yPos, EGA.YELLOW, rel, false, 48);

	dstdn.lfont.DrawStringLeft(txtStartX, yPos, "<Press ENTER KEY to exit>", EGA.LIGHT_BLUE, NO_COLOR);

	// fetch image if possible, but try only once
	if (this.fetch_image) {
		this.fetch_image = false;
		var outer = this;
		this.netop = new NetworkOperation(function () {
			outer.image = dstdn.cache.FetchProfileImage(outer.profile['avatar_static']);
			outer.relation = dstdn.m.GetRelationships([outer.profile['id']]);
			if (outer.relation && outer.relation[0]) {
				outer.relation = outer.relation[0];
			}
		});
	}
	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}

	return true;
}

Profile.prototype.Input = function (key, keyCode, char) {
	switch (keyCode) {
		case KEY.Code.KEY_ENTER:
			this.SetProfile(null);
			return true;
			break;
		default:
			switch (char) {
				case "F":
					// unfollow
					if (this.relation && this.relation['following']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.UnFollow(outer.profile['id']);
							this.relation['following'] = false;
						});
					}
					break;
				case "f":
					// follow
					if (this.relation && !this.relation['following']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.Follow(outer.profile['id']);
							this.relation['following'] = true;
						});
					}
					break;
				case "B":
					// unblock
					if (this.relation && this.relation['blocking']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.UnBlock(outer.profile['id']);
							this.relation['blocking'] = false;
						});
					}
					break;
				case "b":
					// block
					if (this.relation && !this.relation['blocking']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.Block(outer.profile['id']);
							this.relation['blocking'] = true;
						});
					}
					break;
				case "M":
					// unmute
					if (this.relation && this.relation['muting']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.UnMute(outer.profile['id']);
							this.relation['muting'] = false;
						});
					}
					break;
				case "m":
					// mute
					if (this.relation && !this.relation['muting']) {
						this.netop = new NetworkOperation(function () {
							dstdn.m.UnMute(outer.profile['id']);
							this.relation['muting'] = true;
						});
					}
					break;
			}
			break;
	}
	return this.profile != null;
}

// export functions and version
exports.__VERSION__ = 1;
exports.Profile = Profile;
