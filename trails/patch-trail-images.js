const fs = require('fs');
const map = JSON.parse(fs.readFileSync('./trails/trail-image-map.json','utf8'));

const patches = {
  "west-harrison-stsailes-west-fsr-approach": {
    cardImage: "/images/trails/west-harrison-stsailes-west-fsr-approach.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: gravel road along Harrison Lake shoreline, mountains on opposite shore, FSR curves ahead.",
    needsBetterSource: false
  },
  "florence-lake-fsr": {
    cardImage: "/images/trails/florence-lake-fsr.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: elevated view overlooking Florence Lake and Stave reservoir, FSR on hillside, truck at viewpoint.",
    needsBetterSource: false
  },
  "eagle-mountain-access-area": {
    cardImage: "/images/trails/eagle-mountain-access-area.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: FSR entering dense forest with distant view of Vancouver Lower Mainland, forests vs cityscape.",
    needsBetterSource: false
  },
  "kookipi-creek-fsr": {
    cardImage: "/images/trails/kookipi-creek-fsr.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: narrow FSR through canyon with steep rocky slopes, lodgepole pine, small stream.",
    needsBetterSource: false
  },
  "mystery-creek-fsr-approach": {
    cardImage: "/images/trails/mystery-creek-fsr-approach.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: mossy nurse logs, ferns, mushrooms, forest floor macro beside gravel road, dense green rainforest.",
    needsBetterSource: false
  },
  "nahatlatch-fire-lookout-access": {
    cardImage: "/images/trails/nahatlatch-fire-lookout-access.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: high viewpoint looking down into Nahatlatch Valley, FSR switchbacks visible, Fraser River canyon distant.",
    needsBetterSource: false
  },
  "chipmunk-creek-fsr": {
    cardImage: "/images/trails/chipmunk-creek-fsr.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: open grassy meadow with FSR crossing valley, Chipmunk Creek meandering, mountains distant.",
    needsBetterSource: false
  },
  "statlu-lake-north-side-trailhead-via-mystery-creek-north-chehalis": {
    cardImage: "/images/trails/statlu-lake-north-side-trailhead-via-mystery-creek-north-chehalis.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: mirror-smooth Statlu Lake reflecting mountains, mist rising, rough FSR approaching north shore.",
    needsBetterSource: false
  },
  "mount-woodside-forest-service-road": {
    cardImage: "/images/trails/mount-woodside-forest-service-road.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: viewpoint overlooking Harrison Hot Springs village and lake, Jeep parked at overlook.",
    needsBetterSource: false
  },
  "owl-creek-fsr": {
    cardImage: "/images/trails/owl-creek-fsr.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: massive old-growth Douglas fir and cedar forest, tiny 4x4 on narrow road between giant trees.",
    needsBetterSource: false
  },
  "ford-mountain-fsr": {
    cardImage: "/images/trails/ford-mountain-fsr.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: open grassy mountainside with FSR switchbacks, view across Chilliwack valley, layered ridges.",
    needsBetterSource: false
  },
  "hale-creek-easy-way-access-area": {
    cardImage: "/images/trails/hale-creek-easy-way-access-area.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: clear creek over smooth stones beside FSR, small waterfall cascading into pool, rainforest.",
    needsBetterSource: false
  },
  "francis-lake-recreation-site-approach": {
    cardImage: "/images/trails/francis-lake-recreation-site-approach.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: FSR opening to lake campsite with picnic table, canoe, tent, golden hour reflections.",
    needsBetterSource: false
  },
  "borden-creek-fsr": {
    cardImage: "/images/trails/borden-creek-fsr.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: FSR carved into steep valley slope looking down at Borden Creek, bridge crossing side creek.",
    needsBetterSource: false
  },
  "marionette": {
    cardImage: "/images/trails/marionette.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: narrow single-track 4x4 trail through dense coastal forest, Jeep Wrangler in muddy ruts.",
    needsBetterSource: false
  },
  "come-as-you-are": {
    cardImage: "/images/trails/come-as-you-are.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: challenging rocky 4x4 section with boulders and water-filled potholes, muddy truck navigating.",
    needsBetterSource: false
  },
  "fern-turns": {
    cardImage: "/images/trails/fern-turns.png",
    imageKind: "gpt-image-2",
    notes: "GPT-Image-2 generated: lush fern bed along FSR edge, dappled forest light, sword ferns and deer ferns, green rainforest.",
    needsBetterSource: false
  }
};

let changed = 0;
for (const [slug, patch] of Object.entries(patches)) {
  if (!map[slug]) { console.log('MISSING:', slug); continue; }
  map[slug] = { ...map[slug], ...patch, locationContext: map[slug].locationContext };
  delete map[slug].sourcePage;
  delete map[slug].sourceImage;
  changed++;
}
fs.writeFileSync('./trails/trail-image-map.json', JSON.stringify(map, null, 2) + '\n');
console.log('Patched', changed, 'entries');
