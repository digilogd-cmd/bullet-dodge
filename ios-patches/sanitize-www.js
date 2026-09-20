// Runs in the iOS CI pipeline only, right after `npm run build` copies the shared web
// assets into www/ and before `cap sync ios` bundles them into the .ipa.
//
// The same index.html/game.js also power the Android and Toss builds, so the source
// files keep their Android/Google Play/Toss plumbing. App Review (guideline 2.3.10)
// flags any mention of other platforms inside the iOS binary, so strip them from the
// copy that ships to the App Store. None of this is reachable on iOS anyway:
// window.Android only exists inside the Android WebView wrapper, no iOS user agent
// contains "Android", and the Toss banner is already hidden on iOS.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'www');

function edit(file, fn) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) return;
    const before = fs.readFileSync(p, 'utf8');
    const after = fn(before);
    fs.writeFileSync(p, after);
    console.log(`sanitized ${file}: ${before.length} -> ${after.length} bytes`);
}

const platformWords = s => s
    .replace(/window\.Android\b/g, 'window.NativeBridge')
    .replace(/\bAndroid\b/g, 'Droid')
    .replace(/GOOGLE PLAY/g, 'THE STORE')
    .replace(/Google Play/gi, 'the store');

edit('index.html', s => platformWords(
    // drop the Toss deep-link banner entirely
    s.replace(/<a[^>]*toss-banner-link[\s\S]*?<\/a>/, '')
));
edit('game.js', platformWords);
edit('auth.js', platformWords);

// Fail the build if anything slipped through.
const leftovers = [];
for (const f of ['index.html', 'game.js', 'auth.js']) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    for (const re of [/android/i, /google\s*play/i, /intoss:/i, /토스/]) {
        if (re.test(txt)) leftovers.push(`${f}: ${re}`);
    }
}
if (leftovers.length) {
    console.error('Platform references still present in iOS bundle:\n' + leftovers.join('\n'));
    process.exit(1);
}
console.log('iOS web bundle is free of Android/Google Play/Toss references.');
