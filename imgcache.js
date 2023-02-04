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

// caches
function ImageCache() {
	this.small = new LRUCache(dstdn.c.Get("smallCacheSize"));
	this.profile = new LRUCache(dstdn.c.Get("profileCacheSize"));
	this.large = new LRUCache(dstdn.c.Get("largeCacheSize"));

	// create disk cache and delete entries older than 4w
	this.sqlite = new SQLite("CACHE.DB");
	this.sqlite.Exec("PRAGMA auto_vacuum = FULL;");
	this.sqlite.Exec("CREATE TABLE IF NOT EXISTS images (key TEXT PRIMARY KEY, timestamp INTEGER, data BLOB);");
	this.sqlite.Exec("DELETE FROM images WHERE timestamp <= DATE('now','-" + dstdn.c.Get("diskCacheMaxAge") + " day');");
}

ImageCache.prototype.GetHashedImage = function (hash) {
	if (this.small.Get(hash)) {
		return this.small.Get(hash);
	} else {
		var bm = new Bitmap(hash, LIST_IMG_SIZE, LIST_IMG_SIZE);
		this.small.Put(hash, bm);
		return bm;
	}
}

ImageCache.prototype.GetCachedImage = function (url) {
	if (this.small.Get(url)) {
		return this.small.Get(url);
	} else {
		return null;
	}
}

ImageCache.prototype.FetchListImage = function (url) {
	if (this.small.Get(url)) {
		return this.small.Get(url);
	} else {
		var ret = this.GetScaledImage(url, LIST_IMG_SIZE);
		this.small.Put(url, ret);
		return ret;
	}
}

ImageCache.prototype.FetchProfileImage = function (url) {
	if (this.profile.Get(url)) {
		return this.profile.Get(url);
	} else {
		var ret = this.GetScaledImage(url, PROFILE_IMG_SIZE);
		this.profile.Put(url, ret);
		return ret;
	}
}

ImageCache.prototype.FetchLargeImage = function (url) {
	if (this.large.Get(url)) {
		return this.large.Get(url);
	} else {
		var ret = this.GetImage(url);
		this.large.Put(url, ret);
		return ret;
	}
}

ImageCache.prototype.GetScaledImage = function (url, size) {
	var ret = new Bitmap(size, size);
	SetRenderBitmap(ret);
	ClearScreen(EGA.BLACK);
	Line(0, 0, ret.width, ret.height, EGA.RED);
	Line(ret.width, 0, 0, ret.height, EGA.RED);
	var dl = this.GetImage(url);
	if (dl) {
		dl.DrawAdvanced(
			0, 0, dl.width, dl.height,
			0, 0, ret.width, ret.height
		);
	}
	SetRenderBitmap(null);
	return ret;
}

ImageCache.prototype.GetImage = function (url) {
	try {
		res = this.sqlite.Exec("SELECT data FROM images WHERE key=?;", [url]);

		if (res.length > 0) {
			// Println('GetImage from cache ' + url);
			return new Bitmap(res[0].data);
		} else {
			// Println('GetImage fetching ' + url);
			var resp = dstdn.m.DoGet([], url);

			if (resp[2] === 200) {
				this.sqlite.Exec("INSERT INTO images (key, timestamp, data) VALUES(?,CURRENT_DATE,?);", [url, resp[0]]);
				return new Bitmap(resp[0]);
			}
		}
	} catch (e) {
		Println(url + ": " + e);
		return null;
	}
}

ImageCache.prototype.NumCacheEntries = function () {
	return this.small.Size();
}
ImageCache.prototype.NumProfileEntries = function () {
	return this.profile.Size();
}
ImageCache.prototype.NumLargeEntries = function () {
	return this.large.Size();
}
ImageCache.prototype.NumDiskEntries = function () {
	return this.sqlite.Exec("SELECT COUNT(*) AS cnt FROM images")[0].cnt;
}

// export functions and version
exports.__VERSION__ = 1;
exports.ImageCache = ImageCache;
