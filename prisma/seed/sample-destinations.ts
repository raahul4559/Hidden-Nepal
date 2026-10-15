/**
 * DEVELOPMENT SAMPLE DATA — NOT VERIFIED TRAVEL ADVICE.
 *
 * Names, provinces, districts and descriptive text reflect widely documented
 * facts about these places. Every practical figure (costs, coordinates,
 * elevation, difficulty, suggested days, seasons) is a development placeholder:
 * approximate or invented for UI work. They are stored with
 * `practicalInfoStatus: PLACEHOLDER` and `isSample: true`, and must be
 * researched and verified before any real use.
 *
 * Photos are from Wikimedia Commons; author and license were read from the
 * Commons API when this file was written.
 */
import type { DestinationInput } from "@/features/destinations/validation";

const PLACEHOLDER = "Development placeholder. Not researched or verified.";

const commonsThumb = (path: string, file: string) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/1920px-${file}`;
const commonsPage = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

// Fixed dates keep ordering reproducible across seed runs.
const published = (day: number) => new Date(Date.UTC(2026, 0, day));

export const SAMPLE_DESTINATIONS: DestinationInput[] = [
  {
    slug: "rara-lake",
    name: "Rara Lake",
    summary:
      "Nepal’s largest lake, ringed by conifer forest inside Rara National Park in the remote north-west.",
    description:
      "Rara is the largest lake in Nepal and the centrepiece of Rara National Park in Mugu district. Pine, spruce and juniper forest runs down to the shoreline, and the lake’s distance from Nepal’s main travel routes means it sees far fewer visitors than the lakes of central Nepal.",
    status: "PUBLISHED",
    publishedAt: published(4),
    isFeatured: true,
    isSample: true,
    regionSlug: "karnali",
    district: "Mugu",
    categorySlugs: ["lakes", "treks"],
    coordinates: { latitude: 29.53, longitude: 82.08 },
    elevationM: 2990,
    cost: { min: 40000, max: 90000, currency: "NPR" },
    costNotes: PLACEHOLDER,
    difficulty: "MODERATE",
    suggestedDays: 6,
    seasons: ["SPRING", "AUTUMN"],
    bestSeasonNotes: PLACEHOLDER,
    practicalInfo: { status: "PLACEHOLDER" },
    images: [
      {
        url: commonsThumb("b/bf", "Rara_Lake%2C_Mugu%2C_Nepal.jpg"),
        alt: "Morning mist over a calm lake, with forested hills behind and a wooden watchtower on the shore.",
        caption: "Rara Lake, Mugu",
        credit: "Chandra Chakradhar",
        license: "CC BY-SA 4.0",
        sourceUrl: commonsPage("Rara_Lake,_Mugu,_Nepal.jpg"),
      },
    ],
  },
  {
    slug: "tansen",
    name: "Tansen",
    summary:
      "A hill town of steep lanes and Newar architecture in Palpa, known for its handwoven dhaka cloth.",
    description:
      "Tansen is the headquarters of Palpa district, spread across a ridge in the middle hills. Its narrow lanes are lined with traditional Newar houses, and Palpa is closely associated with dhaka, the patterned handwoven cloth used for the Nepali topi. Rani Mahal, a riverside palace on the Kali Gandaki, lies within the district.",
    status: "PUBLISHED",
    publishedAt: published(3),
    isFeatured: true,
    isSample: true,
    regionSlug: "lumbini",
    district: "Palpa",
    categorySlugs: ["heritage", "culture", "food"],
    coordinates: { latitude: 27.867, longitude: 83.546 },
    elevationM: 1350,
    cost: { min: 8000, max: 20000, currency: "NPR" },
    costNotes: PLACEHOLDER,
    difficulty: "EASY",
    suggestedDays: 2,
    seasons: ["AUTUMN", "WINTER", "SPRING"],
    bestSeasonNotes: PLACEHOLDER,
    practicalInfo: { status: "PLACEHOLDER" },
    images: [
      {
        url: commonsThumb("9/9c", "Tansen%2C_Palpa%2C_Nepal.jpg"),
        alt: "A hillside town of white and brick houses among trees, with a broad valley and mountains beyond.",
        caption: "Tansen, Palpa",
        credit: "Vyacheslav Argenberg",
        license: "CC BY 4.0",
        sourceUrl: commonsPage("Tansen,_Palpa,_Nepal.jpg"),
      },
      {
        url: commonsThumb("3/3a", "Tansen_at_sunset%2C_Palpa%2C_Nepal.jpg"),
        alt: "Tansen’s rooftops at sunset.",
        caption: "Tansen at sunset",
        credit: "Vyacheslav Argenberg",
        license: "CC BY 4.0",
        sourceUrl: commonsPage("Tansen_at_sunset,_Palpa,_Nepal.jpg"),
      },
    ],
  },
  {
    slug: "khaptad-national-park",
    name: "Khaptad National Park",
    summary:
      "A high plateau of open grassland and forest in the far west, long associated with the hermit Khaptad Baba.",
    description:
      "Khaptad National Park spreads across a plateau in Sudurpashchim where the park meets the districts of Bajhang, Bajura, Achham and Doti. Rolling grasslands, known locally as patan, alternate with oak and rhododendron forest. The park is also known for the ashram of Khaptad Baba, a hermit who lived here for decades.",
    status: "PUBLISHED",
    publishedAt: published(2),
    isFeatured: false,
    isHiddenGem: true,
    isSample: true,
    regionSlug: "sudurpashchim",
    categorySlugs: ["treks", "culture"],
    coordinates: { latitude: 29.38, longitude: 81.13 },
    elevationM: 3000,
    cost: { min: 30000, max: 70000, currency: "NPR" },
    costNotes: PLACEHOLDER,
    difficulty: "MODERATE",
    suggestedDays: 5,
    seasons: ["SPRING", "AUTUMN"],
    bestSeasonNotes: PLACEHOLDER,
    practicalInfo: { status: "PLACEHOLDER" },
    images: [
      {
        url: commonsThumb("a/ac", "Khaptad_National_Park%2C_Nepal.jpg"),
        alt: "A green grassy slope rising to a bright blue sky with scattered clouds.",
        caption: "Grassland in Khaptad National Park",
        credit: "Anil Bhatta",
        license: "CC BY-SA 4.0",
        sourceUrl: commonsPage("Khaptad_National_Park,_Nepal.jpg"),
      },
    ],
  },
  {
    slug: "tsum-valley",
    name: "Tsum Valley",
    summary:
      "A secluded Himalayan valley in northern Gorkha with a living Tibetan Buddhist culture and old monasteries.",
    description:
      "Tsum Valley lies in the north of Gorkha district, close to the border with Tibet. Its villages follow Tibetan Buddhist traditions, and monasteries such as Rachen Gompa and Mu Gompa sit along the valley. Tsum is a restricted area for foreign visitors, so permit and guide requirements apply; check current rules with official sources before planning.",
    status: "PUBLISHED",
    publishedAt: published(1),
    isFeatured: false,
    isHiddenGem: true,
    isSample: true,
    regionSlug: "gandaki",
    district: "Gorkha",
    categorySlugs: ["treks", "villages", "culture"],
    coordinates: { latitude: 28.53, longitude: 85.03 },
    cost: { min: 120000, max: 250000, currency: "NPR" },
    costNotes: PLACEHOLDER,
    difficulty: "CHALLENGING",
    suggestedDays: 12,
    seasons: ["SPRING", "AUTUMN"],
    bestSeasonNotes: PLACEHOLDER,
    practicalInfo: { status: "PLACEHOLDER" },
    images: [
      {
        url: commonsThumb("4/4b", "Tsum_Valley.jpg"),
        alt: "A green valley floor with a winding river, small villages and yellow fields beneath steep, cloud-capped mountains.",
        caption: "Tsum Valley, Gorkha",
        credit: "Tsephu",
        license: "CC BY 4.0",
        sourceUrl: commonsPage("Tsum_Valley.jpg"),
      },
    ],
  },
];
