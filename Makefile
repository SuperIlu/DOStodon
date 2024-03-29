ZIP_FILES = \
	LICENSE \
	README.md \
	dostodon.bat \
	cacert.pem \
	WATTCP.CFG \
	MLOGO.PNG \
	splash.png \
	CWSDPMI.EXE \
	dojs.exe \
	JSBOOT.ZIP \
	dojs.ini \
	curl.DXE \
	jpeg.DXE \
	png.DXE \
	sqlite.DXE \
	config.js \
	dialogs.js \
	dstdn.js \
	home.js \
	imgcache.js \
	info.js \
	lrucache.js \
	mstdn.js \
	notific.js \
	profile.js \
	splash.js \
	toot.js \
	util.js \
	boost.wav \
	fav.wav \
	invplop.wav \
	plop.wav \
	toot.wav

all: zip

mastodon:
	cp mastodon-CREDS.JSN CREDS.JSN

local:
	cp local-CREDS.JSN CREDS.JSN

bitbang:
	cp bitbang-CREDS.JSN CREDS.JSN

zip: $(ZIP_FILES)
	rm -f DOSTODON.ZIP
	zip -9 -r DOSTODON.ZIP $(ZIP_FILES)

clean:
	rm -f DOSTODON.ZIP JSLOG.TXT W32DHCP.TMP
