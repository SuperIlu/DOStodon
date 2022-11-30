Include("blurhash");

var img;

function Setup() {
    // examples from https://blurha.sh/
    img1 = BluhashDecode("LEHLk~WB2yk8pyo0adR*.7kCMdnj", 64, 48);
    img2 = BluhashDecode("LKO2:N%2Tw=w]~RBVZRi};RPxuwH", 64, 48);
}

function Loop() {
    img1.Draw(0, 0);
    img2.Draw(70, 0);
}

function Input() { }
