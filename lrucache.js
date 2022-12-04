//////
// ListEntry

function ListEntry(data) {
	this.__ll__ = {};
	this.__ll__.next = null;
	this.__ll__.prev = null;
	this.__ll__.data = data;
}
ListEntry.prototype.Next = function () { return this.__ll__.next };
ListEntry.prototype.Prev = function () { return this.__ll__.prev };
ListEntry.prototype.GetData = function () { return this.__ll__.data };

//////
// LinkedList

function LinkedList() {
	this.first = null;
	this.last = null;
	this.entries = 0;
}

LinkedList.prototype.AppendLast = function (e) {
	if (!e.__ll__) {
		throw new Error("Object is no list entry");
	}

	if (this.last) {
		// modify end of list
		this.last.__ll__.next = e;	// make successor of last eentry
		e.__ll__.prev = this.last;	// make last entry successor of new entry
		this.last = e;				// make entry the new last entry
	} else {
		// only list entry, modify first and last
		this.first = e;
		this.last = e;
	}
	this.entries++;
}

LinkedList.prototype.InsertFirst = function (e) {
	if (!e.__ll__) {
		throw new Error("Object is no list entry");
	}

	if (this.first) {
		this.first.__ll__.prev = e;	// make predecessor of first entry
		e.__ll__.next = this.first;	// make first entry predecessor of new entry
		this.first = e;				// make new entry the new first entry
	} else {
		// only list entry, modify first and last
		this.first = e;
		this.last = e;
	}
	this.entries++;
}

LinkedList.prototype.InsertAfter = function (e, existing) {
	if (!e.__ll__) {
		throw new Error("Object is no list entry!");
	}

	if (!existing.__ll__.prev && !existing.__ll__.next) {
		throw new Error("Predecessor is not in list!");
	}

	var old_next = existing.__ll__.next;	// keep old next entry
	existing.__ll__.next = e;				// make new entry the successor of the existing entry
	e.__ll__.prev = existing;				// and make the existing entry the predecessor of the new
	if (old_next) {							// check if there was a next entry
		old_next.__ll__.prev = e;			// yes-> link new entry and old next entry
		e.__ll__.next = old_next;
	} else {
		this.last = e;						// no-> make entry the new last list entry
	}
	this.entries++;
}

LinkedList.prototype.GetFirst = function () {
	return this.first;
}

LinkedList.prototype.GetLast = function () {
	return this.last;
}

LinkedList.prototype.Size = function () {
	return this.entries;
}

LinkedList.prototype.Remove = function (e) {
	if (!e.__ll__) {
		throw new Error("Object is no list entry!");
	}

	if (!e.__ll__.prev && !e.__ll__.next && (this.first !== e)) {
		throw new Error("Element is not in list!");
	}

	if (e.__ll__.next) {
		var next_entry = e.__ll__.next;
		next_entry.__ll__.prev = e.__ll__.prev;
	} else {
		this.last = e.__ll__.prev;
	}

	if (e.__ll__.prev) {
		var prev_entry = e.__ll__.prev;
		prev_entry.__ll__.next = e.__ll__.next;
	} else {
		this.first = e.__ll__.next;
	}

	e.__ll__.next = null;
	e.__ll__.prev = null;
	this.entries--;
}

//////
// LRUCache
function LRUCache(maxSize) {
	this.maxSize = maxSize;
	this.objects = {};
	this.lruList = new LinkedList();
}

LRUCache.prototype.Size = function () {
	return this.lruList.Size();
}

LRUCache.prototype.Get = function (key) {
	if (this.objects[key]) {
		var entry = this.objects[key];
		this.lruList.Remove(entry.list);		// remove from LRU
		this.lruList.InsertFirst(entry.list);	// queue as first LRU entry
		return entry.data;
	} else {
		return null;
	}
}

LRUCache.prototype.Remove = function (key) {
	if (this.objects[key]) {
		var entry = this.objects[key];
		this.lruList.Remove(entry.list);	// remove from LRU
		delete this.objects[key];			// and from cache
	}
}

LRUCache.prototype.Put = function (key, val) {
	var entry;
	var le;
	if (this.objects[key]) {
		// entry exists
		entry = this.objects[key];
		le = entry.list;
		this.lruList.Remove(le);
	} else {
		// new entry
		entry = {
			"data": val,
			"list": new ListEntry(key)
		};
		le = entry.list;
	}

	while (this.Size() > this.maxSize - 1) {
		this.Remove(this.lruList.GetLast().GetData());
	}

	this.objects[key] = entry;		// insert cache entry object
	this.lruList.InsertFirst(le);	// queue as first LRU entry
}

// export functions and version
exports.__VERSION__ = 1;
exports.ListEntry = ListEntry;
exports.LinkedList = LinkedList;
exports.LRUCache = LRUCache;

/*
function Setup() {
	var c = new LRUCache(5);

	for (var i = 0; i < 10; i++) {
		c.Put("" + i, "" + i);
	}

	Println(c.Size());
	printList(c.lruList);

	Println(c.Get("5"));
	Println(c.Get("6"));
	Println(c.Get("3"));
	Println(c.Get("2"));
	printList(c.lruList);

	Stop();
}

function SetupLL() {
	var ll = new LinkedList();

	for (var i = 0; i < 5; i++) {
		var e = new ListEntry("" + i);
		ll.AppendLast(e);
	}
	printList(ll);

	ll.InsertFirst(new ListEntry("A"));
	ll.AppendLast(new ListEntry("B"));
	printList(ll);

	var e = ll.GetFirst();
	e = e.Next();
	e = e.Next();
	e = e.Next();
	Println("Insert after " + e.GetData());
	ll.InsertAfter(new ListEntry("X"), e);
	printList(ll);

	Println("removing " + e.GetData());
	ll.Remove(e);
	printList(ll);

	ll.Remove(ll.GetFirst());
	printList(ll);

	ll.Remove(ll.GetLast());
	printList(ll);


	printList_rev(ll);

	Stop();
}
function Loop() { }
function Input() { }

function printList(ll) {
	Println("Iterating: " + ll.Size());
	var it = ll.GetFirst();
	while (it) {
		Println("  " + it.GetData());
		it = it.Next();
	}
}

function printList_rev(ll) {
	Println("Reverse Iterating: " + ll.Size());
	var it = ll.GetLast();
	while (it) {
		Println("  " + it.GetData());
		it = it.Prev();
	}
}
*/