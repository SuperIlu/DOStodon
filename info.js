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

function Info() {
	this.mem_history = new IntArray();
	this.max_history = CONTENT_WIDTH - 2 * TEXT_START_OFFSET;
	this.graphHeight = 0;
	this.do_sample = 0;
}

Info.prototype.Draw = function () {
	var mem_info = MemoryInfo();

	var info = "";
	info += "Host name             : " + JSON.stringify(GetHostname()) + "\n";
	info += "\n";
	info += "Server name           : " + dstdn.creds.url + "\n";
	info += "Server IP address     : " + JSON.stringify(Resolve(dstdn.creds.url.substring("https://".length))) + "\n";
	info += "\n";
	info += "Number of requests    : " + dstdn.m.num_requests + "\n";
	info += "Number of errors      : " + dstdn.m.failed_requests + "\n";
	info += "Avg time/request [s]  : " + (dstdn.m.req_time / dstdn.m.num_requests) + "\n";
	info += "\n";
	info += "Loaded toots          : " + dstdn.all_screens[SCR_HOME].current_list.length + "\n";
	info += "Loaded notifications  : " + dstdn.all_screens[SCR_NOTI].current_list.length + "\n";
	info += "\n";
	info += "Small cache entries   : " + dstdn.cache.NumCacheEntries() + "/" + dstdn.c.Get("smallCacheSize") + "\n";
	info += "Profile cache entries : " + dstdn.cache.NumProfileEntries() + "/" + dstdn.c.Get("profileCacheSize") + "\n";
	info += "Large cache entries   : " + dstdn.cache.NumLargeEntries() + "/" + dstdn.c.Get("largeCacheSize") + "\n";
	info += "Disk cache entries    : " + dstdn.cache.NumDiskEntries() + "\n";
	info += "\n";
	info += "Total mem available   : " + mem_info.total + "\n";
	info += "Memory Remaining      : " + mem_info.remaining + "\n";

	var yPos = TEXT_START_OFFSET;
	var txtStartX = TEXT_START_OFFSET;
	yPos = DisplayMultilineText(txtStartX, yPos, EGA.LIGHT_GREEN, info, false, TXT_LINE_LENGTH);

	this.graphHeight = Height - yPos - 2 * TEXT_START_OFFSET;
	var oldX = TEXT_START_OFFSET;
	var oldY = Height - TEXT_START_OFFSET;
	for (var x = TEXT_START_OFFSET; (x < CONTENT_WIDTH - TEXT_START_OFFSET) && (x < this.mem_history.length); x++) {
		var y = this.mem_history.Get(x);
		Line(oldX, oldY, x, y, EGA.LIGHT_BLUE);
		oldX = x;
		oldY = y;
	}
	Line(TEXT_START_OFFSET, yPos + TEXT_START_OFFSET, CONTENT_WIDTH - TEXT_START_OFFSET, yPos + TEXT_START_OFFSET, EGA.BLUE); // max line
	Line(TEXT_START_OFFSET, yPos + TEXT_START_OFFSET, TEXT_START_OFFSET, Height - TEXT_START_OFFSET, EGA.LIGHT_RED); // y-axis
	Line(TEXT_START_OFFSET, Height - TEXT_START_OFFSET, CONTENT_WIDTH - TEXT_START_OFFSET, Height - TEXT_START_OFFSET, EGA.LIGHT_RED); // x-axis

	DisplaySidebar(null);

	return true;
}

Info.prototype.Update = function () {
	if (this.do_sample <= 0) {
		var mem_info = MemoryInfo();
		this.mem_history.Push(Height - TEXT_START_OFFSET - (mem_info.remaining / mem_info.total) * this.graphHeight);

		while (this.mem_history.length > this.max_history) {
			this.mem_history.Shift();
		}

		this.do_sample = 10;
	} else {
		this.do_sample--;
	}
}

Info.prototype.Input = function (key, keyCode, char, eventKey) {
	return false;
}

// export functions and version
exports.__VERSION__ = 1;
exports.Info = Info;
