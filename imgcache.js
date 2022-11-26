// TODO: cache groesse!
var cache = {};

function GetCachedImage(url) {
	if (cache[url]) {
		return cache[url];
	} else {
		return null;
	}
}

function FetchImage(url) {
	if (cache[url]) {
		return cache[url];
	} else {
		var ret = GetScaledImage(url, LIST_IMG_SIZE);
		cache[url] = ret;
		return ret;
	}
}

function GetScaledImage(url, size) {
	var ret = new Bitmap(size, size);
	SetRenderBitmap(ret);
	ClearScreen(EGA.BLACK);
	Line(0, 0, ret.width, ret.height, EGA.RED);
	Line(ret.width, 0, 0, ret.height, EGA.RED);
	var dl = GetImage(url);
	if (dl) {
		dl.DrawAdvanced(
			0, 0, dl.width, dl.height,
			0, 0, ret.width, ret.height
		);
	}
	SetRenderBitmap(null);
	return ret;
}

function GetImage(url) {
	Println('GetImage fetching ' + url);
	var resp = m.DoGet([], url);

	if (resp[2] === 200) {
		try {
			var fname = TMP_FILE;
			if (url.toLowerCase().endsWith('.png')) {
				fname += ".PNG";
			} else if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
				fname += ".JPG";
			}
			var f = new File(fname, FILE.WRITE);
			f.WriteInts(resp[0]);
			f.Close();
			return new Bitmap(fname);
		} catch (e) {
			Println(e);
			return null;
		}
	}
}

function NumCacheEntries() {
	return Object.keys(cache).length;
}

// export functions and version
exports.__VERSION__ = 1;
exports.GetImage = GetImage;
exports.GetScaledImage = GetScaledImage;
exports.FetchImage = FetchImage;
exports.GetCachedImage = GetCachedImage;
exports.NumCacheEntries = NumCacheEntries;
