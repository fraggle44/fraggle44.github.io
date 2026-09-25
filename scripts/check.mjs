import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { CORE_SCHEMA, load } from "js-yaml";

const EXPECTED_CATEGORIES = [
  "maps-place",
  "spiritual",
  "science-wonder",
  "tools",
  "weather-sky",
  "travel-transit",
  "other",
];

const EXPECTED_LINKS = [
  ["true-size", "The True Size", "https://thetruesize.com/", "2026-09-02", "maps-place", "Compare real country sizes — a map projection wonder."],
  ["old-maps-online", "Old Maps Online", "https://www.oldmapsonline.org/", "2026-09-02", "maps-place", "Historical maps."],
  ["david-rumsey", "David Rumsey Map Collection", "https://www.davidrumsey.com/", "2026-09-03", "maps-place", "150k historic maps."],
  ["openstreetmap", "OpenStreetMap", "https://www.openstreetmap.org/", "2026-09-05", "maps-place", "Volunteer-drawn world map."],
  ["sacred-texts", "Internet Sacred Text Archive", "https://www.sacred-texts.com/", "2026-09-07", "spiritual", "Public-domain sacred texts across traditions."],
  ["bible-gateway", "Bible Gateway", "https://www.biblegateway.com/", "2026-09-08", "spiritual", "Scripture search and reading plans."],
  ["hallow", "Hallow", "https://www.hallow.com/", "2026-09-09", "spiritual", "Catholic prayer and meditation."],
  ["ignatian-spirituality", "Ignatian Spirituality", "https://www.ignatianspirituality.com/", "2026-09-12", "spiritual", "Jesuit examen, retreats, and prayer resources."],
  ["lectio-365", "Lectio 365", "https://www.lectio365.com/", "2026-09-14", "spiritual", "Daily lectio divina from 24-7 Prayer."],
  ["plough", "Plough", "https://www.plough.com/", "2026-09-16", "spiritual", "Faith, justice, and communal Christian essays."],
  ["virtual-vacation", "Virtual Vacation", "https://virtualvacation.us/", "2026-09-17", "travel-transit", "Virtual city walks — wander without leaving home."],
  ["atlas-obscura", "Atlas Obscura", "https://www.atlasobscura.com/", "2026-09-19", "maps-place", "Weird and wonderful places catalog."],
  ["scale-universe-2", "The Scale of the Universe 2", "https://htwins.net/scale2/", "2026-09-21", "science-wonder", "Atom-to-universe interactive scale."],
  ["nasa-eyes", "NASA Eyes", "https://eyes.nasa.gov/", "2026-09-22", "weather-sky", "3D solar system and spacecraft views."],
  ["stellarium-web", "Stellarium Web", "https://stellarium-web.org/", "2026-09-23", "weather-sky", "Browser sky map — stars where you are."],
  ["apod", "APOD", "https://apod.nasa.gov/", "2026-09-24", "weather-sky", "NASA astronomy picture of the day."],
];

const FORBIDDEN = [
  "mapcrunch",
  "neal.fun",
  "nasa image library",
  "images.nasa.gov",
  "window-swap.com",
  "window swap",
  "cac.org",
  "monastery icons",
  "monasteryicons.com",
  "zoom.earth",
  "zoom earth",
  "flightradar24",
  "marinetraffic",
  "windy.com",
  "lightningmaps.org",
  "submarinecablemap.com",
  "submarine cable map",
  "globalforestwatch.org",
  "global forest watch",
];

function readYaml(file) {
  return load(readFileSync(file, "utf8"), { schema: CORE_SCHEMA });
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const raw = readYaml("data/links.yml");
const categories = readYaml("data/categories.yml");

assert.deepEqual(raw.categories, EXPECTED_CATEGORIES, "links.yml category ids drifted from the seed");
assert.deepEqual(categories.map((category) => category.id), EXPECTED_CATEGORIES, "categories.yml order drifted");
assert.equal(raw.links.length, EXPECTED_LINKS.length, `seed must contain exactly ${EXPECTED_LINKS.length} keeps`);

const serialized = JSON.stringify(raw).toLowerCase();
for (const needle of FORBIDDEN) {
  assert.equal(serialized.includes(needle), false, `forbidden keep mentioned in data: ${needle}`);
}

raw.links.forEach((link, index) => {
  const expected = EXPECTED_LINKS[index];
  assert.deepEqual(
    [link.id, link.title, link.url, link.kept_on, link.category, link.blurb],
    expected,
    `link ${index} does not match the seed`,
  );
  assert.equal(link.status, "live");
  assert.equal(typeof link.kept_on, "string");
});

const siteRoot = "_site";
assert.equal(existsSync(path.join(siteRoot, "index.html")), true, "build _site before check");

const htmlFiles = walk(siteRoot).filter((file) => file.endsWith(".html"));
const corpus = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const lowerCorpus = corpus.toLowerCase();

for (const needle of FORBIDDEN) {
  assert.equal(lowerCorpus.includes(needle), false, `forbidden keep published: ${needle}`);
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  assert.equal(/<script\b/i.test(html), false, `${file} should browse without JavaScript`);
}

const home = readFileSync(path.join(siteRoot, "index.html"), "utf8");
const newestFirst = [...raw.links].sort((a, b) => String(b.kept_on).localeCompare(String(a.kept_on)));
let cursor = -1;
for (const link of newestFirst) {
  const at = home.indexOf(link.title);
  assert.ok(at > cursor, `home is not newest-first around ${link.title}`);
  cursor = at;
  assert.ok(home.includes(link.blurb), `home missing blurb for ${link.title}`);
}
assert.ok(home.includes("Recent keeps"));
assert.ok(home.includes(`${raw.links.length} on the shelf`));
assert.ok(home.includes(">Kept 24 Sep 2026<") || home.includes("Kept 24 Sep 2026"));
assert.ok(home.includes(">Kept 2 Sep 2026<") || home.includes("Kept 2 Sep 2026"));

for (const id of EXPECTED_CATEGORIES) {
  const page = path.join(siteRoot, id, "index.html");
  assert.equal(existsSync(page), true, `missing category page ${id}`);
  assert.ok(home.includes(`href="/${id}/"`), `home missing chip ${id}`);
}

const weather = readFileSync(path.join(siteRoot, "weather-sky/index.html"), "utf8");
assert.ok(weather.includes("<title>Weather &amp; sky — The Excellent Internet</title>"));
assert.equal(weather.includes("&amp;amp;"), false);
assert.ok(weather.includes("NASA Eyes"));
assert.ok(weather.includes("Stellarium Web"));
assert.ok(weather.includes("APOD"));
assert.equal(weather.includes("Plough"), false);

for (const id of ["tools", "other"]) {
  const page = readFileSync(path.join(siteRoot, id, "index.html"), "utf8");
  assert.ok(page.includes("This drawer is empty"), `${id} should explain the empty drawer`);
  for (const link of EXPECTED_LINKS) {
    assert.equal(page.includes(link[1]), false, `${id} should not list ${link[1]}`);
  }
}

const about = readFileSync(path.join(siteRoot, "about/index.html"), "utf8");
assert.ok(about.includes("actively agreed as a keep"));
assert.ok(/weekly/i.test(about));
assert.ok(about.includes("not a day-to-day feed"));

const spiritual = readFileSync(path.join(siteRoot, "spiritual/index.html"), "utf8");
assert.ok(spiritual.includes("https://www.plough.com/"));
assert.ok(spiritual.includes("www.plough.com"));
assert.ok(spiritual.includes('datetime="2026-09-16"'));
assert.ok(spiritual.includes("Internet Sacred Text Archive"));
assert.ok(spiritual.includes("Bible Gateway"));
assert.ok(spiritual.includes("Hallow"));
assert.ok(spiritual.includes("Ignatian Spirituality"));
assert.ok(spiritual.includes("Lectio 365"));

const maps = readFileSync(path.join(siteRoot, "maps-place/index.html"), "utf8");
assert.ok(maps.includes("The True Size"));
assert.ok(maps.includes("Old Maps Online"));
assert.ok(maps.includes("David Rumsey Map Collection"));
assert.ok(maps.includes("OpenStreetMap"));
assert.ok(maps.includes("Atlas Obscura"));
assert.ok(maps.includes('datetime="2026-09-02"'));

assert.equal(existsSync(path.join(siteRoot, "assets/site.css")), true);
assert.equal(existsSync(path.join(siteRoot, "favicon.svg")), true);
assert.equal(existsSync(path.join(siteRoot, "404.html")), true);

console.log(`check ok: ${raw.links.length} keeps, ${EXPECTED_CATEGORIES.length} categories, ${htmlFiles.length} html files, no client script`);
