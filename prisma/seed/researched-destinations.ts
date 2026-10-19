import dataset from "../../data/nepal-tourism-destinations.json";
import { NEPAL_BOUNDS, type DestinationInput } from "@/features/destinations/validation";
import type { ActivitySlug } from "@/features/destinations/activities";
import type { CategorySlug } from "@/features/experiences/categories";
import type { ProvinceSlug } from "@/features/regions/provinces";

const RESEARCHED_AT = new Date(`${dataset.metadata.research_date}T00:00:00.000Z`);

const PROVINCE_SLUGS: Record<string, ProvinceSlug> = {
  "Koshi Province": "koshi",
  "Madhesh Province": "madhesh",
  "Bagmati Province": "bagmati",
  "Gandaki Province": "gandaki",
  "Lumbini Province": "lumbini",
  "Karnali Province": "karnali",
  "Sudurpashchim Province": "sudurpashchim",
};

const CROSS_PROVINCE_DEFAULTS: Record<string, ProvinceSlug> = {
  "chitwan-national-park": "bagmati",
  "koshi-tappu-wildlife-reserve": "koshi",
};

const FEATURED_SLUGS = new Set([
  "sagarmatha-national-park",
  "janakpur",
  "kathmandu-valley",
  "pokhara",
  "chitwan-national-park",
  "lumbini",
]);

const CURATED_IMAGES: Record<string, NonNullable<DestinationInput["images"]>> = {
  "mount-everest": [
    {
      url: "/images/destinations/mount-everest.jpg",
      alt: "Everest summit and Himalayan landscape, Nepal",
      caption: "Everest high above the Himalayas in Nepal.",
      credit: "Vyacheslav Argenberg",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Everest,_Himalayas.jpg",
    },
  ],
  "sagarmatha-national-park": [
    {
      url: "/images/destinations/sagarmatha-national-park.jpg",
      alt: "Sagarmatha National Park mountain landscape and Himalayan valley",
      caption: "The Everest region landscape inside Sagarmatha National Park.",
      credit: "Faj2323",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:120408_Pheriche_Pano_4k.jpg",
    },
  ],
  "kathmandu-valley": [
    {
      url: "/images/destinations/kathmandu-valley.jpg",
      alt: "Kathmandu Durbar Square with historic heritage architecture and a sadhu",
      caption: "Historic palace square in Kathmandu Valley.",
      credit: "Anton Gutmann / Aristeas",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Saddhu_at_Durbar_Square,_Kathmandu_(edited).jpg",
    },
  ],
  "boudhanath-stupa": [
    {
      url: "/images/destinations/boudhanath-stupa.jpg",
      alt: "Boudhanath Stupa Buddhist monument in Kathmandu, Nepal",
      caption: "Boudhanath Stupa, one of Nepal's most iconic Buddhist landmarks.",
      credit: "User:Ggia",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:20110725_Budha_eyes_closeup_Bodhnath_Stupa_Kathmandu_Nepal.jpg",
    },
  ],
  "pashupatinath-temple": [
    {
      url: "/images/destinations/pashupatinath-temple.jpg",
      alt: "Pashupatinath Temple during Maha Shivaratri festival in Kathmandu",
      caption: "The sacred Pashupatinath temple complex during a festival gathering.",
      credit: "Bijay Chaurasia",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sadhu_Giving_Blessings_to_a_Devotee_During_Maha_Shivaratri_at_Pashupatinath_Temple,_Kathmandu,_Nepal-070A6924.jpg",
    },
  ],
  "pokhara": [
    {
      url: "/images/destinations/pokhara.jpg",
      alt: "Phewa Lake and mountain scenery in Pokhara, Nepal",
      caption: "Phewa Lake framed by Annapurna-range mountains in Pokhara.",
      credit: "Iamavinashk",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Phewa_Lake_of_Pokhara_city.jpg",
    },
  ],
  "phewa-lake": [
    {
      url: "/images/destinations/phewa-lake.jpg",
      alt: "Sunset over Phewa Lake in Pokhara, Nepal",
      caption: "Sunset reflections over Phewa Lake.",
      credit: "Lurey Rohit",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sunset_over_Phewa_Lake_2.jpg",
    },
  ],
  "lumbini": [
    {
      url: "/images/destinations/lumbini.jpg",
      alt: "Lumbini sacred garden and Maitreya Temple, Nepal",
      caption: "The Buddhist pilgrimage site of Lumbini in southern Nepal.",
      credit: "Vyacheslav Argenberg",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Lumbini,_Maitreya_Temple,_Nepal.jpg",
    },
  ],
  "chitwan-national-park": [
    {
      url: "/images/destinations/chitwan-national-park.jpg",
      alt: "White-rumped vulture in Chitwan National Park, Nepal",
      caption: "Wildlife-rich landscapes are a major draw in Chitwan National Park.",
      credit: "Mildeep",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:White-rumped_vulture_in_Chitwan_National_Park.jpg",
    },
  ],
  "janakpur": [
    {
      url: "/images/destinations/janakpur.jpg",
      alt: "Janaki Mandir in Janakpur, Nepal",
      caption: "Janaki Mandir, an important cultural and pilgrimage landmark in Janakpur.",
      credit: "Bijaya 2043",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Janaki_Temple_Janakpur-Janakpur030315_MG_36680059.jpg",
    },
  ],
  "janaki-mandir": [
    {
      url: "/images/destinations/janaki-mandir.jpg",
      alt: "Pilgrim and devotional scene at Janaki Mandir, Janakpur",
      caption: "Janaki Mandir during a devotional visit.",
      credit: "Bijay chaurasia",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sadhu_in_Janaki_Temple,_Janakpur-September_22,_2016-IMG_7437.jpg",
    },
  ],
  "rara-lake": [
    {
      url: "/images/destinations/rara-lake.jpg",
      alt: "Rara Lake turquoise water in northwestern Nepal",
      caption: "The famous turquoise Rara Lake in western Nepal.",
      credit: "Chandra Chakradhar",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Rara_Lake,_Mugu,_Nepal.jpg",
    },
  ],
  "gokyo-lakes": [
    {
      url: "/images/destinations/gokyo-lakes.jpg",
      alt: "Gokyo Lake and Ngozumpa Glacier beneath Himalayan peaks",
      caption: "Gokyo Lake and the Ngozumpa Glacier from Gokyo Ri.",
      credit: "Vyacheslav Argenberg",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Gokyo_Ri_summit,_Gokyo_Lake,_Nepal,_Himalayas.jpg",
    },
  ],
  ilam: [
    {
      url: "/images/destinations/ilam-kanyam-tea-garden.jpg",
      alt: "Kanyam tea garden in Ilam, Nepal",
      caption: "Tea garden scenery at Kanyam in Ilam.",
      credit: "Kankai Desk",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kanyam_tea_garden_Nepal.jpg",
    },
  ],
  "pathibhara-devi-temple": [
    {
      url: "/images/destinations/pathibhara-temple-view.jpg",
      alt: "Mountain view from Pathibhara Temple in Taplejung District",
      caption: "A Himalayan view from the Pathibhara Temple area.",
      credit: "Rabinika",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:The_view_seen_from_Pathibhara_Temple_of_Taplejung_District_Nepal_01.jpg",
    },
  ],
  "halesi-mahadev-temple": [
    {
      url: "/images/destinations/halesi-maratika-cave.jpg",
      alt: "Interior of the Maratika or Halesi cave in Nepal",
      caption: "The sacred Maratika (Halesi) cave.",
      credit: "Christopher J. Fynn",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Maratika_cave_1.jpg",
    },
  ],
  "patan-durbar-square": [
    {
      url: "/images/destinations/patan-durbar-square.jpg",
      alt: "Historic architecture at Patan Durbar Square, Nepal",
      caption: "Historic architecture in Patan Durbar Square.",
      credit: "Alexander Shafir",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Nepal_Patan_Durbar_Square_20_(full_res).jpg",
    },
  ],
  "everest-base-camp": [
    {
      url: "/images/destinations/everest-base-camp.jpg",
      alt: "Everest Base Camp from Kala Patther",
      caption: "Everest Base Camp from Kala Patther",
      credit: "Goutam1962",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Everest_Base_Camp_from_Kala_Patther.jpg",
    },
  ],
  "kanchenjunga-conservation-area": [
    {
      url: "/images/destinations/kanchenjunga-conservation-area.jpg",
      alt: "Kanchenjunga range seen from the trek to Pathivara Temple, Nepal",
      caption: "The Kanchenjunga range seen from the Pathivara trek.",
      credit: "Nikeshparajuli",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kanchenjunga_Conservation_Area.jpeg",
    },
  ],
  "koshi-tappu-wildlife-reserve": [
    {
      url: "/images/destinations/koshi-tappu-wildlife-reserve.jpg",
      alt: "Koshi Tappu Wildlife Reserve, Nepal",
      caption: "Koshi Tappu Wildlife Reserve, Nepal.",
      credit: "बिप्लब आनन्द",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Koshi_Tappu.JPG",
    },
  ],
  "ponds-of-janakpur": [
    {
      url: "/images/destinations/ponds-of-janakpur.jpg",
      alt: "A lake in Janakpur, Nepal",
      caption: "A lake in Janakpur.",
      credit: "श्रेष्ठ भूपेन्द्र",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Lake_of_Janakpur_City.jpg",
    },
  ],
  "mithila-art": [
    {
      url: "/images/destinations/mithila-art.jpg",
      alt: "A Mithila wall painting for the Tulsi Puja festival in Nepal",
      caption: "A Mithila wall painting for the Tulsi Puja festival.",
      credit: "Shravan012",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mithila_Painting.jpg",
    },
  ],
  "gadhimai-temple": [
    {
      url: "/images/destinations/gadhimai-temple.jpg",
      alt: "Gadhimai Temple, Nepal",
      caption: "Gadhimai Temple, Nepal.",
      credit: "बिप्लब आनन्द",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Gadhimai_Temple_(2).JPG",
    },
  ],
  "kathmandu-durbar-square": [
    {
      url: "/images/destinations/kathmandu-durbar-square.jpg",
      alt: "Basantapur Tower at Kathmandu Durbar Square.",
      caption: "Basantapur Tower at Kathmandu Durbar Square.",
      credit: "Artha at English Wikipedia",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Basantapurpalace.JPG",
    },
  ],
  "bhaktapur-durbar-square": [
    {
      url: "/images/destinations/bhaktapur-durbar-square.jpg",
      alt: "An early morning view of Bhaktapur Durbar Square",
      caption: "An early morning view of Bhaktapur Durbar Square",
      credit: "Bikram Pratap Singh",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:View_of_Bhaktapur_Durbar_Square.jpg",
    },
  ],
  "swayambhunath": [
    {
      url: "/images/destinations/swayambhunath.jpg",
      alt: "Swayambhu, Swayambhunath, ancient religious complex atop a hill in the Kathmandu Valley, Kathmandu, Nepal.",
      caption: "Swayambhu, Swayambhunath, ancient religious complex atop a hill in the Kathmandu Valley, Kathmandu, Nepal.",
      credit: "Vyacheslav Argenberg",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Swayambhu,_Kathmandu,_Nepal.jpg",
    },
  ],
  "changu-narayan-temple": [
    {
      url: "/images/destinations/changu-narayan-temple.jpg",
      alt: "Changu Narayan Temple",
      caption: "Changu Narayan Temple",
      credit: "Greg Willis from Denver, CO, usa",
      license: "CC BY-SA 2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Changu_Narayan_(5244433170).jpg",
    },
  ],
  "langtang-national-park": [
    {
      url: "/images/destinations/langtang-national-park.jpg",
      alt: "Around Kyanjin Valley, Langtang National Park, Rasuwa, Nepal",
      caption: "Around Kyanjin Valley, Langtang National Park, Rasuwa, Nepal",
      credit: "pnepalensis",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kyanjin_Valley,_Langtang_National_Park,_Rasuwa,_Nepal_13.jpg",
    },
  ],
  "gosaikunda-lake": [
    {
      url: "/images/destinations/gosaikunda-lake.jpg",
      alt: "Gosaikunda Lake, Nepal",
      caption: "Gosaikunda Lake, Nepal.",
      credit: "Bharat2",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Gosaikunda_of_Rasuwa.jpg",
    },
  ],
  "namo-buddha": [
    {
      url: "/images/destinations/namo-buddha.jpg",
      alt: "Namo Buddha, Nepal",
      caption: "Namo Buddha, Nepal.",
      credit: "Creepanta",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Namobuddha_Stupa,_Namobuddha.jpg",
    },
  ],
  "panch-pokhari": [
    {
      url: "/images/destinations/panch-pokhari.jpg",
      alt: "Five ponds at the height of 4100 M",
      caption: "Five ponds at the height of 4100 M",
      credit: "Vijay0191",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Paach_pokhri.jpg",
    },
  ],
  "beeshazar-and-associated-lakes": [
    {
      url: "/images/destinations/beeshazar-and-associated-lakes.jpg",
      alt: "Beeshazar Lake in Chitwan, Nepal",
      caption: "Beeshazar Lake inside Chitwan National Park.",
      credit: "Nischal Tiwari",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Beeshazar_Lake_in_Chitwan.JPG",
    },
  ],
  "annapurna-base-camp": [
    {
      url: "/images/destinations/annapurna-base-camp.jpg",
      alt: "Annapurna Base Camp, Nepal",
      caption: "Annapurna Base Camp, Nepal.",
      credit: "Bijay Chaurasia",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Annapurna_Massif-IMG_5221-Pano.jpg",
    },
  ],
  "annapurna-circuit": [
    {
      url: "/images/destinations/annapurna-circuit.jpg",
      alt: "Thorong La, Damodar Himal, Himalaya, Nepal.",
      caption: "Thorong La, Damodar Himal, Himalaya, Nepal.",
      credit: "Vyacheslav Argenberg",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Thorong_La_2,_Himalaya,_Nepal.jpg",
    },
  ],
  "muktinath-temple": [
    {
      url: "/images/destinations/muktinath-temple.jpg",
      alt: "Muktinath Temple, Nepal",
      caption: "Muktinath Temple, Nepal.",
      credit: "Faj2323",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Muktinath_Temple_(1).jpg",
    },
  ],
  "tilicho-lake": [
    {
      url: "/images/destinations/tilicho-lake.jpg",
      alt: "The reflection of Tilicho peak on Tilicho lake.",
      caption: "The reflection of Tilicho peak on Tilicho lake.",
      credit: "Roman Yahodka",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Tilicho_lake_and_Tilicho_peak.jpg",
    },
  ],
  "ghandruk": [
    {
      url: "/images/destinations/ghandruk.jpg",
      alt: "Village of Ghandruk in Nepal",
      caption: "Village of Ghandruk in Nepal",
      credit: "Gerd Eichmann",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ghandruk-234-Ortsbild-2013-gje.jpg",
    },
  ],
  "bandipur": [
    {
      url: "/images/destinations/bandipur.jpg",
      alt: "Bandipur, Nepal",
      caption: "Bandipur, Nepal.",
      credit: "Bijay Chaurasia",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Bandipur,_Nepal-WLV-1911.jpg",
    },
  ],
  "manakamana-temple": [
    {
      url: "/images/destinations/manakamana-temple.jpg",
      alt: "Manakamana Temple in Gorkha, Nepal",
      caption: "Manakamana Temple in Gorkha, rebuilt after the 2015 earthquake.",
      credit: "Bhupendra Shrestha",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Gorkha_Manakamana_Temple_(cropped).jpg",
    },
  ],
  "maya-devi-temple": [
    {
      url: "/images/destinations/maya-devi-temple.jpg",
      alt: "Maya Devi Temple, Nepal",
      caption: "Maya Devi Temple, Nepal.",
      credit: "Shadow Ayush",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Maya_Devi_Temple_and_Ashoka_Pillar,_Lumbini,_Rupandehi,_Nepal.jpg",
    },
  ],
  "tilaurakot": [
    {
      url: "/images/destinations/tilaurakot.jpg",
      alt: "The east gate of King Suddhodana's Palace at Tilaurakot archaeological site in Taulihawa, Kapilvastu District, Nepal",
      caption: "The east gate of King Suddhodana's Palace at Tilaurakot archaeological site in Taulihawa, Kapilvastu District, Nepal",
      credit: "DiverDave",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Suddhodana_Palace-east_gate.JPG",
    },
  ],
  "bardiya-national-park": [
    {
      url: "/images/destinations/bardiya-national-park.jpg",
      alt: "The gate of Bardiya National Park in western Nepal",
      caption: "The gate of Bardiya National Park in western Nepal",
      credit: "Ganesh Paudel",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Bardia_National_Park.JPG",
    },
  ],
  "rani-mahal": [
    {
      url: "/images/destinations/rani-mahal.jpg",
      alt: "Ranighat Palace, Rani Mahal, Palpa, Nepal.",
      caption: "Ranighat Palace, Rani Mahal, Palpa, Nepal.",
      credit: "Vyacheslav Argenberg",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Palpa,_Ranighat_Palace,_Nepal.jpg",
    },
  ],
  "swargadwari": [
    {
      url: "/images/destinations/swargadwari.jpg",
      alt: "Swargadwari temple in Pyuthan district, Nepal",
      caption: "Swargadwari temple in Pyuthan district.",
      credit: "Niraj Subedi",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Swargadwari_temple.jpg",
    },
  ],
  "ramagrama-stupa": [
    {
      url: "/images/destinations/ramagrama-stupa.jpg",
      alt: "Ramagrama stupa, Nepal",
      caption: "Ramagrama stupa, Nepal",
      credit: "Sukrat Gaud",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ramgram_Stupa_2.jpg",
    },
  ],
  "rara-national-park": [
    {
      url: "/images/destinations/rara-national-park.jpg",
      alt: "View of Rara Lake in Rara National Park, Nepal",
      caption: "View of Rara Lake in Rara National Park, Nepal",
      credit: "Patrick.drown",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Rara_lake_from_afar.jpg",
    },
  ],
  "shey-phoksundo-national-park": [
    {
      url: "/images/destinations/shey-phoksundo-national-park.jpg",
      alt: "Shey Phoksundo Lake in Dolpa, Nepal",
      caption: "Shey Phoksundo Lake inside Shey Phoksundo National Park.",
      credit: "Sunuwargr",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Shey-Phoksundo_Lake_in_Dolpa.jpg",
    },
  ],
  "phoksundo-lake": [
    {
      url: "/images/destinations/phoksundo-lake.jpg",
      alt: "Phoksundo Lake, Nepal",
      caption: "Phoksundo Lake, Nepal.",
      credit: "Tsering wongel",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Shey_Phoksundo_Lake.jpg",
    },
  ],
  "sinja-valley": [
    {
      url: "/images/destinations/sinja-valley.jpg",
      alt: "Sinja Valley, Nepal",
      caption: "Sinja Valley, Nepal.",
      credit: "Soraj Shahi",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Narakot_Sinja_Valley.JPG",
    },
  ],
  "kankre-bihar": [
    {
      url: "/images/destinations/kankre-bihar.jpg",
      alt: "Kankre Bihar, Nepal",
      caption: "Kankre Bihar, Nepal.",
      credit: "Geetakrawal",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kakrebihar_Temple.jpg",
    },
  ],
  "jumla": [
    {
      url: "/images/destinations/jumla.jpg",
      alt: "Jumla, Nepal",
      caption: "Jumla, Nepal.",
      credit: "Soraj Shahi",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Tila_Valley_Jumla.JPG",
    },
  ],
  "chandannath-temple": [
    {
      url: "/images/destinations/chandannath-temple.jpg",
      alt: "Chandannath and Bhairabnath Temple in Jumla, Nepal",
      caption: "Chandannath and Bhairabnath Temple in Jumla.",
      credit: "Prashant Shahi",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Channdannath_and_Bhairabnath.jpg",
    },
  ],
  "shuklaphanta-national-park": [
    {
      url: "/images/destinations/shuklaphanta-national-park.jpg",
      alt: "Rani Tal lake inside Shuklaphanta National Park, Nepal",
      caption: "Rani Tal inside Shuklaphanta National Park.",
      credit: "Ganesh Paudel",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ranitaal1.JPG",
    },
  ],
  "api-nampa-conservation-area": [
    {
      url: "/images/destinations/api-nampa-conservation-area.jpg",
      alt: "Api Nampa Conservation Area, Nepal",
      caption: "Api Nampa Conservation Area, Nepal.",
      credit: "Sunuwargr",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mt._Api_Himal_and_Scenic_Views_of_Api_Nampa_Conservation_Area,_Sudurpaschim.jpg",
    },
  ],
  "badimalika-temple": [
    {
      url: "/images/destinations/badimalika-temple.jpg",
      alt: "Badimalika Temple, Bajura, Nepal",
      caption: "Badimalika Temple, Bajura, Nepal",
      credit: "sigdelsanjog",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Badimalika_Temple,_Bajura,_Nepal.jpg",
    },
  ],
  "ghodaghodi-lake-area": [
    {
      url: "/images/destinations/ghodaghodi-lake-area.jpg",
      alt: "Ghodaghodi Lake in Kailali district, Nepal",
      caption: "Ghodaghodi Lake in Kailali district.",
      credit: "Hopingyousuf",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ghodaghodi_Tal_.jpg",
    },
  ],
};

const CATEGORY_BY_RESEARCH_TAG: Record<string, CategorySlug> = {
  adventure: "treks",
  archaeology: "heritage",
  architecture: "heritage",
  base_camp: "treks",
  birdwatching: "culture",
  boating: "lakes",
  cave: "heritage",
  city: "villages",
  community_experience: "culture",
  conservation_area: "treks",
  cultural_landscape: "culture",
  culture: "culture",
  forest: "treks",
  grassland: "treks",
  heritage: "heritage",
  hill: "treks",
  hill_town: "villages",
  historical_site: "heritage",
  history: "heritage",
  homestay: "villages",
  jungle: "treks",
  lake: "lakes",
  landscape: "treks",
  living_culture: "culture",
  monastery: "heritage",
  mountain: "treks",
  mountain_view: "treks",
  mountaineering: "treks",
  mountains: "treks",
  museum: "heritage",
  national_park: "treks",
  palace: "heritage",
  pilgrimage: "heritage",
  pond: "lakes",
  river_landscape: "treks",
  stupa: "heritage",
  tea: "food",
  temple: "heritage",
  town: "villages",
  traditional_art: "culture",
  traditional_town: "villages",
  trekking: "treks",
  trekking_gateway: "treks",
  trekking_route: "treks",
  valley: "treks",
  viewpoint: "treks",
  village: "villages",
  wetland: "lakes",
  wildlife: "treks",
  wildlife_reserve: "treks",
};

const ACTIVITY_BY_RESEARCH_TAG: Record<string, ActivitySlug> = {
  birdwatching: "birdwatching",
  boating: "boating",
  community_experience: "homestays",
  culture: "heritage-walks",
  heritage: "heritage-walks",
  homestay: "homestays",
  living_culture: "heritage-walks",
  monastery: "monastery-visits",
  mountaineering: "trekking",
  pilgrimage: "heritage-walks",
  tea: "local-food",
  traditional_art: "craft-workshops",
  trekking: "trekking",
  trekking_route: "trekking",
  village: "homestays",
  wildlife: "wildlife-watching",
  wildlife_reserve: "wildlife-watching",
};

const SEASONS = new Set(["SPRING", "MONSOON", "AUTUMN", "WINTER"]);

function makeSummary(shortDescription: string | null, description: string | null): string {
  if (shortDescription && shortDescription.length >= 20) return shortDescription;
  if (description) {
    const firstSentence = description.match(/^.{1,280}?(?:[.!?](?:\s|$)|$)/)?.[0]?.trim();
    if (firstSentence && firstSentence.length >= 20) return firstSentence;
    const excerpt = description.slice(0, 277).trimEnd();
    return excerpt.length >= 20 ? `${excerpt}...` : `${excerpt} Visitor details are being researched.`;
  }
  return "Visitor information for this destination is being researched; consult the cited sources for details.";
}

function categoryForResearchTag(tag: string): CategorySlug {
  const category = CATEGORY_BY_RESEARCH_TAG[tag];
  if (!category) throw new Error(`No website category mapping for researched tag ${tag}.`);
  return category;
}

function validCoordinates(
  latitude: number | null,
  longitude: number | null,
): DestinationInput["coordinates"] {
  if (latitude === null || longitude === null) return undefined;
  if (
    latitude < NEPAL_BOUNDS.minLatitude ||
    latitude > NEPAL_BOUNDS.maxLatitude ||
    longitude < NEPAL_BOUNDS.minLongitude ||
    longitude > NEPAL_BOUNDS.maxLongitude
  ) {
    return undefined;
  }
  return { latitude, longitude };
}

export const RESEARCHED_DESTINATIONS: DestinationInput[] = dataset.destinations.map((record) => {
  const regionSlug = record.province
    ? PROVINCE_SLUGS[record.province]
    : CROSS_PROVINCE_DEFAULTS[record.slug];
  if (!regionSlug) {
    throw new Error(`No website province mapping for researched destination ${record.slug}.`);
  }

  const categorySlugs = [...new Set(record.categories.map(categoryForResearchTag))];
  if (!categorySlugs.length) {
    throw new Error(`No website category mapping for researched destination ${record.slug}.`);
  }

  const activitySlugs = [
    ...new Set(
      record.categories
        .map((tag) => ACTIVITY_BY_RESEARCH_TAG[tag])
        .filter((slug): slug is ActivitySlug => Boolean(slug)),
    ),
  ];
  const seasons = record.best_season.filter((season) => SEASONS.has(season)) as (
    | "SPRING"
    | "MONSOON"
    | "AUTUMN"
    | "WINTER"
  )[];
  const status = "PUBLISHED";

  return {
    slug: record.slug,
    name: record.name,
    summary: makeSummary(record.short_description, record.description),
    description: record.description ?? undefined,
    status,
    ...(status === "PUBLISHED" && { publishedAt: RESEARCHED_AT }),
    isFeatured: FEATURED_SLUGS.has(record.slug),
    isHiddenGem: false,
    isSample: false,
    regionSlug,
    district: record.district ?? undefined,
    categorySlugs,
    coordinates: validCoordinates(record.latitude, record.longitude),
    accessInfo: record.access_info ?? undefined,
    seasons,
    bestSeasonNotes: seasons.length
      ? "Research lead only; seasonal suitability has not been verified for current conditions."
      : undefined,
    activitySlugs,
    practicalInfo: { status: "UNVERIFIED" },
    images: CURATED_IMAGES[record.slug] ?? [],
    sources: record.provenance.map((source) => ({
      title: `${source.publisher}: ${record.name}`,
      url: source.url,
      publisher: source.publisher,
      accessedAt: RESEARCHED_AT,
    })),
  };
});
