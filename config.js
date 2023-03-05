var CONFIG_FILE = "CFG.JSN";

function Config() {
	this.DefConfig = {
		"lastTag": null,

		"autoReloadDelay": 300,
		"maxPoll": 30,

		"smallCacheSize": 50,
		"profileCacheSize": 15,
		"largeCacheSize": 15,

		"diskCacheMaxAge": 14
	};

	this.DiskConfig = {};

	try {
		this.DiskConfig = JSON.parse(Read(CONFIG_FILE));
	} catch (e) {
		Println("Could not load config: " + e);
	}
}

Config.prototype.Get = function (k) {
	if (k in this.DiskConfig) {
		return this.DiskConfig[k];
	}

	if (k in this.DefConfig) {
		return this.DefConfig[k];
	}

	throw new Error("Unknown config key: " + k);
}

Config.prototype.Set = function (k, v) {
	if (k in this.DefConfig) {
		this.DiskConfig[k] = v;
	} else {
		throw new Error("Unknown config key: " + k);
	}
}

Config.prototype.Save = function () {
	var storedConfig = {};
	var keys = Object.keys(this.DefConfig);

	for (var i = 0; i < keys.length; i++) {
		var k = keys[i];

		storedConfig[k] = this.Get(k);
	}

	var f = new File(CONFIG_FILE, FILE.WRITE);
	f.WriteString(JSON.stringify(storedConfig));
	f.Close();
}

// export functions and version
exports.__VERSION__ = 1;
exports.Config = Config;
