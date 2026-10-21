import type { StaticImageData } from "next/image";

import culture from "@/assets/photos/culture.jpg";
import food from "@/assets/photos/food.jpg";
import heritage from "@/assets/photos/heritage.jpg";
import heroGokyo from "@/assets/photos/hero-gokyo.jpg";
import lakes from "@/assets/photos/lakes.jpg";
import terraces from "@/assets/photos/terraces.jpg";
import treks from "@/assets/photos/treks.jpg";
import villages from "@/assets/photos/villages.jpg";
import waterfalls from "@/assets/photos/waterfalls.jpg";

/**
 * Bundled photography. Every image comes from Wikimedia Commons under the
 * license recorded here; preserve attribution in the /credits directory.
 */
export type Photo = {
  src: StaticImageData;
  alt: string;
  caption: string;
  author: string;
  license: "CC BY 4.0" | "CC BY-SA 4.0";
  licenseUrl: string;
  sourceUrl: string;
};

const BY = "https://creativecommons.org/licenses/by/4.0/";
const BY_SA = "https://creativecommons.org/licenses/by-sa/4.0/";
const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${file}`;

export const PHOTOS = {
  hero: {
    src: heroGokyo,
    alt: "A turquoise glacial lake below snow-capped peaks, seen from a rocky summit with two hikers in the foreground.",
    caption: "Gokyo Lake from Gokyo Ri",
    author: "Vyacheslav Argenberg",
    license: "CC BY 4.0",
    licenseUrl: BY,
    sourceUrl: commons("Gokyo_Ri_summit,_Gokyo_Lake,_Nepal,_Himalayas.jpg"),
  },
  waterfalls: {
    src: waterfalls,
    alt: "A waterfall dropping into a river gorge, seen from above.",
    caption: "Bhorley waterfall and the Tamakoshi river, Dolakha",
    author: "Nammy Hang Kirat",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons(
      "Bhorley_waterfall_of_Dolakha_and_Tamakoshi_river_as_seen_from_above.jpg",
    ),
  },
  villages: {
    src: villages,
    alt: "A hillside village with houses scattered across green terraced fields.",
    caption: "Balthali village",
    author: "Sunil kawan",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons("Beautiful_Balthali_Village.jpg"),
  },
  lakes: {
    src: lakes,
    alt: "A still blue lake ringed by pine forest and hills.",
    caption: "Rara Lake",
    author: "Prabeshsdev, with additional fixes by Cart",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons("The_Heavenly_Rara_Lake_-_edited_2.jpg"),
  },
  treks: {
    src: treks,
    alt: "Hikers on a high mountain trail beneath rugged peaks.",
    caption: "Hikers near Machhermo",
    author: "Vyacheslav Argenberg",
    license: "CC BY 4.0",
    licenseUrl: BY,
    sourceUrl: commons("Machermo,_Hikers,_Nepal.jpg"),
  },
  heritage: {
    src: heritage,
    alt: "Tiered pagoda temples in a brick-paved royal square.",
    caption: "Bhaktapur Durbar Square",
    author: "Nabin K. Sapkota",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons("Bhaktapur_Durbar_Square_2018_13.jpg"),
  },
  food: {
    src: food,
    alt: "A platter of traditional Newari dishes served on a leaf plate.",
    caption: "Newari khaja set",
    author: "Gaurav Dhwaj Khadka",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons("Newari_Khaja_Set_1.jpg"),
  },
  culture: {
    src: culture,
    alt: "A woman lighting a small oil lamp during the Tihar festival.",
    caption: "Lighting a lamp during Tihar",
    author: "Mithun Kunwar; derivative work by Radomianin",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons(
      "Sister_lighting_traditional_lamp_during_Tihar_festival_(edited).jpg",
    ),
  },
  terraces: {
    src: terraces,
    alt: "Layered farming terraces stepping down a steep green hillside.",
    caption: "Terrace farming in Rakathum",
    author: "Bijay Chaurasia",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: commons("Terrace_Farming_in_Nepal_in_Rakathum_VDC-0369.jpg"),
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
