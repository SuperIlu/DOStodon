var TEXT_START_OFFSET = 10;

function Profile() {
	this.profile = null;
	this.image = null;
	this.note = null;
	this.fetch_image = false;
}

Profile.prototype.SetProfile = function (p) {
	this.profile = p;
	this.image = null;
	this.note = null;
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
		header = this.profile['display_name'] + " (@" + this.profile['username'] + ")";
	} else {
		header = this.profile['username'];
	}
	lfont.DrawStringLeft(txtStartX, yPos, header, EGA.YELLOW, NO_COLOR);
	yPos += lfont.height;
	yPos += sfont.height;

	if (!this.note) {
		this.note = RemoveHTML(this.profile['note'])
	}
	yPos = DisplayMultilineText(txtStartX, yPos, EGA.WHITE, this.note, false, 48);
	yPos += sfont.height;
	yPos += sfont.height;

	var joined = "Joined: " + new Date(this.profile['created_at']).toLocaleString("de-DE");
	lfont.DrawStringLeft(txtStartX, yPos, joined, EGA.WHITE, NO_COLOR);
	yPos += lfont.height;
	yPos += sfont.height;

	var stats = "Followers: " + this.profile['followers_count'];
	sfont.DrawStringLeft(txtStartX, yPos, stats, EGA.WHITE, NO_COLOR);
	yPos += sfont.height;
	stats = "Following: " + this.profile['following_count'];
	sfont.DrawStringLeft(txtStartX, yPos, stats, EGA.WHITE, NO_COLOR);
	yPos += sfont.height;
	stats = "Posts: " + this.profile['statuses_count'];
	sfont.DrawStringLeft(txtStartX, yPos, stats, EGA.WHITE, NO_COLOR);
	yPos += sfont.height;
	yPos += lfont.height;

	lfont.DrawStringLeft(txtStartX, yPos, "<Press any KEY to exit>", EGA.LIGHT_BLUE, NO_COLOR);

	// fetch image if possible, but try only once
	if (this.fetch_image) {
		this.fetch_image = false;
		var outer = this;
		this.netop = new NetworkOperation(function () {
			outer.image = GetScaledImage(outer.profile['avatar_static'], PROFILE_IMG_SIZE);
		});
	}
	if (this.netop && this.netop.Process()) {
		this.netop = null;
	}

	return true;
}

Profile.prototype.Input = function (key, keyCode, char) {
	this.SetProfile(null);
}

// export functions and version
exports.__VERSION__ = 1;
exports.Profile = Profile;

/*
Lorem ipsum blafasel hurtz nana
na ich will hier einnen langen text egal ob da fe
hler drinne sind!
*/
