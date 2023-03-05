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
var HEADER_WITH = 440;
var HEADER_HEIGHT = 150;

function Profile() {
	this.profile = null;
	this.profile_image = null;
	this.header_image = null;
	this.note = null;
	this.relation = null;
	this.textOverlay = null;
}

Profile.prototype.SetProfile = function (p) {
	this.profile = p;
	this.profile_image = null;
	this.header_image = null;
	this.note = null;
	this.relation = null;
	if (p) {
		var outer = this;
		var chain = new EvalChain();

		// add fetch steps to chain
		chain.Add(function () {
			outer.profile_image = dstdn.cache.FetchProfileImage(outer.profile['avatar_static']);
		});
		chain.Add(function () {
			var header = dstdn.cache.FetchLargeImage(outer.profile['header_static']);

			// calculate resized dimensions for 440x150
			var factor = header.width / HEADER_WITH;
			var w = HEADER_WITH;
			var h = header.height / factor;

			// image is higher than 150px, we need to crop parts of it when rendering
			var cropY = 0;
			if (h > HEADER_HEIGHT) {
				var orig_max_y = 150 * factor;
				cropY = orig_max_y / 2;
			}

			outer.header_image = {
				"img": header,
				"width": w,
				"height": HEADER_HEIGHT,
				"cropY": cropY
			};
		});
		chain.Add(function () {
			outer.relation = dstdn.m.GetRelationships([outer.profile['id']]);
			if (outer.relation && outer.relation[0]) {
				outer.relation = outer.relation[0];
			}
		});

		// run the steps in the NetOp
		this.netop = new NetworkOperation(function () {
			while (chain.Step()) {
				;
			}
		});
	}
}

Profile.prototype.drawLeft = function () {
	// draw info
	if (this.profile_image) {
		this.profile_image.Draw(0, 0);
	} else {
		FilledBox(0, 0, PROFILE_IMG_SIZE, PROFILE_IMG_SIZE, EGA.LIGHT_GREY);
		Box(0, 0, PROFILE_IMG_SIZE, PROFILE_IMG_SIZE, EGA.GREY);
	}

	var txtStartX = TEXT_START_OFFSET;
	var yPos = TEXT_START_OFFSET + PROFILE_IMG_SIZE;

	var stats = "Followers <F1> : " + this.profile['followers_count'];
	yPos = DisplayText(txtStartX, yPos, EGA.WHITE, stats, dstdn.sfont);
	stats = "Following <F2> : " + this.profile['following_count'];
	yPos = DisplayText(txtStartX, yPos, EGA.WHITE, stats, dstdn.sfont);
	stats = "Posts     <F3> : " + this.profile['statuses_count'];
	yPos = DisplayText(txtStartX, yPos, EGA.WHITE, stats, dstdn.sfont);
	yPos += dstdn.lfont.height;

	var info = "Info: ";
	if (this.profile['bot']) {
		info += "BOT ";
	}
	if (this.profile['locked']) {
		info += "LOCKED ";
	}
	yPos = DisplayMultilineText(txtStartX, yPos, EGA.LIGHT_GREY, info, false, 48);

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

	return yPos;
}

Profile.prototype.drawRight = function () {
	if (this.header_image) {
		this.header_image.img.DrawAdvanced(
			0, this.header_image.cropY,
			this.header_image.img.width, this.header_image.img.height - this.header_image.cropY,
			PROFILE_IMG_SIZE, 0,
			this.header_image.width, this.header_image.height);
	}

	var yPos = TEXT_START_OFFSET + HEADER_HEIGHT;
	var txtStartX = PROFILE_IMG_SIZE + TEXT_START_OFFSET;

	var header;
	if (this.profile['display_name']) {
		header = this.profile['display_name'] + " (@" + this.profile['acct'] + ")";
	} else {
		header = this.profile['acct'];
	}
	yPos = DisplayText(txtStartX, yPos, EGA.YELLOW, header, dstdn.lfont);
	yPos += dstdn.sfont.height;

	if (!this.note) {
		this.note = RemoveHTML(this.profile['note'])
	}
	yPos = DisplayMultilineToot(txtStartX, yPos, EGA.WHITE, this.note, false, 48);
	yPos += dstdn.sfont.height;
	yPos += dstdn.sfont.height;

	var joined = "Joined: " + new Date(this.profile['created_at']).toLocaleString("de-DE");

	yPos = DisplayText(txtStartX, yPos, EGA.WHITE, joined, dstdn.sfont);
	yPos += dstdn.lfont.height;

	return yPos;
}

Profile.prototype.Draw = function () {
	// skip profile if none
	if (!this.profile) {
		return false;
	}

	var bothY = 0;
	bothY = Math.max(bothY, this.drawLeft());
	bothY = Math.max(bothY, this.drawRight());

	DisplayText(TEXT_START_OFFSET, bothY, EGA.LIGHT_BLUE, "<Press ENTER KEY to exit>", dstdn.lfont);

	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}

	if (this.textOverlay) {
		TextOverlay(this.textOverlay, EGA.WHITE);
	}

	return true;
}

Profile.prototype.Input = function (key, keyCode, char, eventKey) {
	if (this.profile != null) {
		if (this.textOverlay) {
			this.textOverlay = null;
		} else {
			var outer = this;
			switch (keyCode) {
				case KEY.Code.KEY_F1:
					this.netop = new NetworkOperation(function () {
						var res = dstdn.m.GetFollow(outer.profile['id'], false);
						res.forEach(function (e) {
							e['dstdn_list_name'] = RemoveHTML("@" + e['acct'] + " (" + e['display_name'] + ")").substring(0, 60);
						});
						dstdn.dialog = new ListField("Followers (locally known)", res,
							function (e) {
								return e['dstdn_list_name'];
							},
							function (e) {
								if (e) {
									outer.SetProfile(e);
								}
								dstdn.dialog = null;
							});
					});
					return true;
				case KEY.Code.KEY_F2:
					this.netop = new NetworkOperation(function () {
						var res = dstdn.m.GetFollow(outer.profile['id'], true);
						res.forEach(function (e) {
							e['dstdn_list_name'] = RemoveHTML("@" + e['acct'] + " (" + e['display_name'] + ")").substring(0, 60);
						});
						dstdn.dialog = new ListField("Following (locally known)", res,
							function (e) {
								return e['dstdn_list_name'];
							},
							function (e) {
								if (e) {
									outer.SetProfile(e);
								}
								dstdn.dialog = null;
							});
					});
					return true;
				case KEY.Code.KEY_F3:
					var prof = this.profile;
					var return_to = dstdn.current_screen;
					dstdn.current_screen = new Home(function (outer, max, id, older) { return dstdn.m.TimelineAccount(prof['id'], max, id, older); }, HOME_ACCOUNT);
					dstdn.current_screen.profile = prof;
					dstdn.current_screen.return_to = return_to;
					this.SetProfile(null);
					return true;
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
									outer.relation['following'] = false;
								});
							}
							break;
						case "f":
							// follow
							if (this.relation && !this.relation['following']) {
								this.netop = new NetworkOperation(function () {
									dstdn.m.Follow(outer.profile['id']);
									outer.relation['following'] = true;
								});
							}
							break;
						case "B":
							// unblock
							if (this.relation && this.relation['blocking']) {
								this.netop = new NetworkOperation(function () {
									dstdn.m.UnBlock(outer.profile['id']);
									outer.relation['blocking'] = false;
								});
							}
							break;
						case "b":
							// block
							if (this.relation && !this.relation['blocking']) {
								this.netop = new NetworkOperation(function () {
									dstdn.m.Block(outer.profile['id']);
									outer.relation['blocking'] = true;
								});
							}
							break;
						case "M":
							// unmute
							if (this.relation && this.relation['muting']) {
								this.netop = new NetworkOperation(function () {
									dstdn.m.UnMute(outer.profile['id']);
									outer.relation['muting'] = false;
								});
							}
							break;
						case "m":
							// mute
							if (this.relation && !this.relation['muting']) {
								this.netop = new NetworkOperation(function () {
									dstdn.m.Mute(outer.profile['id']);
									outer.relation['muting'] = true;
								});
							}
							break;
						case "t":
						case "T":
							dstdn.all_screens[SCR_TOOT].TootTo(this.profile);
							this.SetProfile(null);
							dstdn.current_screen = dstdn.all_screens[SCR_TOOT];
							return true;
							break;
						case "h":
						case "H":
						case "?":
							this.textOverlay = "Profile screen HELP\n\n";
							this.textOverlay += "- `F1`           : Show followers\n";
							this.textOverlay += "- `F2`           : Show following\n";
							this.textOverlay += "- `F3`           : Show timeline\n";
							this.textOverlay += "- `b`            : block\n";
							this.textOverlay += "- `B`            : unblock\n";
							this.textOverlay += "- `f`            : follow\n";
							this.textOverlay += "- `F`            : unfollow\n";
							this.textOverlay += "- `m`            : mute\n";
							this.textOverlay += "- `M`            : unmute\n";
							this.textOverlay += "- `T`/`t`        : toot to person\n";
							this.textOverlay += "- `CTRL-P`       : Search user\n";
							this.textOverlay += "- `CTRL-S`       : Save screenshot\n";
							this.textOverlay += "- `DEL`          : close/cancel dialog\n";
							this.textOverlay += "- `ENTER`        : close profile screen\n";
							break;
					}
					break;
			}
		}
		return this.profile != null;
	} else {
		return false;
	}
}

// export functions and version
exports.__VERSION__ = 1;
exports.Profile = Profile;
