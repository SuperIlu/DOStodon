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

// TODO: cache groesse!
var cache = {};
var blurhashes = {};

function GetHashedImage(hash) {
	if (blurhashes[hash]) {
		return blurhashes[hash];
	} else {
		var bm = new Bitmap(hash, LIST_IMG_SIZE, LIST_IMG_SIZE);
		blurhashes[hash] = bm;
		return bm;
	}
}

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
	//Println('GetImage fetching ' + url);
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
exports.GetHashedImage = GetHashedImage;
exports.GetScaledImage = GetScaledImage;
exports.FetchImage = FetchImage;
exports.GetCachedImage = GetCachedImage;
exports.NumCacheEntries = NumCacheEntries;
