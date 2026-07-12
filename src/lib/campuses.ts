export interface Landmark {
  id: string;
  label: string;
  lat: number;
  lng: number;
  category: "campus" | "transit" | "city" | "town";
}

export interface CampusConfig {
  id: string;
  name: string;
  subdomain: string;
  emailDomains: string[];
  defaultCollegeName: string;
  defaultCoordinates: { lat: number; lng: number };
  landmarks: Landmark[];
}

export const ALLOWED_EMAIL_DOMAINS = [
  "vit.ac.in",
  "vitstudent.ac.in",
  "vitap.ac.in",
  "vitapstudent.ac.in",
  "srmist.edu.in",
  "srmap.edu.in",
  "annauniv.edu",
  "iitm.ac.in",
  "ssn.edu.in",
  "svce.ac.in",
  "rajalakshmi.edu.in",
  "sathyabama.ac.in",
  "hindustanuniv.ac.in",
  "saveetha.ac.in",
  "veltech.edu.in",
  "crescent.education",
  "stjosephstechnology.ac.in",
  "jeppiaarcollege.org",
  "panimalar.ac.in",
  "sairam.edu.in",
  "sairamit.edu.in",
  "loyolacollege.edu",
  "mcc.edu.in",
  "dgvaishnavcollege.edu.in",
  "ethirajcollege.edu.in",
  "wcc.edu.in",
  "madrasuniversity.ac.in",
  "iitb.ac.in",
  "iitd.ac.in",
  "iitk.ac.in",
  "iitkgp.ac.in",
  "iitg.ac.in",
  "iitr.ac.in",
  "iith.ac.in",
  "iitbbs.ac.in",
  "iitj.ac.in",
  "iitmandi.ac.in",
  "iitgn.ac.in",
  "iiit.ac.in",
  "iiitb.ac.in",
  "iiitd.ac.in",
  "iiitl.ac.in",
  "iiitdm.ac.in",
  "iiitkottayam.ac.in",
  "iiitnr.edu.in",
  "iisc.ac.in",
  "rvce.edu.in",
  "bmsce.ac.in",
  "bmsit.in",
  "msrit.edu",
  "pes.edu",
  "christuniversity.in",
  "reva.edu.in",
  "cmrit.ac.in",
  "nmit.ac.in",
  "newhorizonindia.edu",
  "jainuniversity.ac.in",
  "alliance.edu.in",
  "presidencyuniversity.in",
  "acsce.edu.in",
  "dayanandasagar.edu",
  "uohyd.ac.in",
  "osmania.ac.in",
  "jntuh.ac.in",
  "cbit.ac.in",
  "griet.ac.in",
  "cvr.ac.in",
  "vnrvjiet.in",
  "mgit.ac.in",
  "mahindrauniversity.edu.in",
  "anurag.edu.in",
  "mlrinstitutions.ac.in",
  "woxsen.edu.in",
  "ifheindia.org",
  "kluniversity.in",
  "vignan.ac.in",
  "gitam.edu",
  "rgukt.in",
  "srkr.edu.in",
  "aditya.ac.in",
  "aec.edu.in",
  "pvpsiddhartha.ac.in",
  "rvrjc.ac.in",
  "vrsiddhartha.ac.in",
  "svuniversity.edu.in",
  "jntuku.edu.in",
  "andhrauniversity.edu.in",
  "nist.edu",
  "bits-pilani.ac.in",
  "manipal.edu",
  "amity.edu",
  "amity.edu.in",
  "dtu.ac.in",
  "nitt.edu",
  "nitk.edu.in",
  "nitw.ac.in",
  "nitc.ac.in",
  "nitrkl.ac.in",
  "mnit.ac.in",
  "iiita.ac.in",
  "jadavpuruniversity.in",
  "kiit.ac.in",
  "soa.ac.in",
  "thapar.edu",
  "chitkara.edu.in",
  "lnmiit.ac.in",
  "vitbhopal.ac.in",
  "sharda.ac.in",
  "galgotiasuniversity.edu.in",
  "lpu.in",
  "cuonline.ac.in",
  "symbiosis.ac.in",
  "mitwpu.edu.in",
  "coep.org.in",
  "pccoepune.com",
  "nxtwave.co.in"
];

export const CAMPUSES: CampusConfig[] = [
  {
    id: "vitap",
    name: "VIT-AP",
    subdomain: "vitap",
    emailDomains: ["vitap.ac.in", "vitapstudent.ac.in"],
    defaultCollegeName: "VIT-AP",
    defaultCoordinates: { lat: 16.4936, lng: 80.5006 },
    landmarks: [
      { id: "vitap-main-gate", label: "VIT-AP Main Gate", lat: 16.4933, lng: 80.5006, category: "campus" },
      { id: "vitap-mens-hostel", label: "VIT-AP Men's Hostel", lat: 16.4941, lng: 80.5028, category: "campus" },
      { id: "vitap-womens-hostel", label: "VIT-AP Women's Hostel", lat: 16.4925, lng: 80.4990, category: "campus" },
      { id: "vitap-ab1", label: "VIT-AP AB-1 Academic Block", lat: 16.4938, lng: 80.5015, category: "campus" },
      { id: "vjw-railway-station", label: "Vijayawada Railway Station", lat: 16.5175, lng: 80.6188, category: "transit" },
      { id: "vjw-bus-stand", label: "Pandit Nehru Bus Station (PNBS)", lat: 16.5069, lng: 80.6237, category: "transit" },
      { id: "vjw-airport", label: "Vijayawada Airport (Gannavaram)", lat: 16.5304, lng: 80.7968, category: "transit" },
      { id: "vjw-benz-circle", label: "Benz Circle, Vijayawada", lat: 16.5006, lng: 80.6480, category: "city" },
    ],
  },
  {
    id: "vit",
    name: "VIT Vellore",
    subdomain: "vit",
    emailDomains: ["vit.ac.in", "vitstudent.ac.in"],
    defaultCollegeName: "VIT",
    defaultCoordinates: { lat: 12.9692, lng: 79.1559 },
    landmarks: [
      { id: "vit-main-gate", label: "VIT Main Gate", lat: 12.9718, lng: 79.1601, category: "campus" },
      { id: "vit-chittoor-gate", label: "VIT Chittoor Gate", lat: 12.9723, lng: 79.1524, category: "campus" },
      { id: "vit-sjt", label: "SJT Academic Block", lat: 12.9702, lng: 79.1565, category: "campus" },
      { id: "vit-tt", label: "Technology Tower (TT)", lat: 12.9696, lng: 79.1585, category: "campus" },
      { id: "katpadi-junction", label: "Katpadi Railway Station", lat: 12.9772, lng: 79.1386, category: "transit" },
      { id: "vellore-new-bus-stand", label: "Vellore New Bus Stand", lat: 12.9348, lng: 79.1478, category: "transit" },
      { id: "vellore-cmc", label: "CMC Hospital Vellore", lat: 12.9254, lng: 79.1352, category: "transit" },
    ],
  },
  {
    id: "srm",
    name: "SRM Kattankulathur",
    subdomain: "srm",
    emailDomains: ["srmist.edu.in", "srmuniv.ac.in"],
    defaultCollegeName: "SRM",
    defaultCoordinates: { lat: 12.8230, lng: 80.0444 },
    landmarks: [
      { id: "srm-main-gate", label: "SRM Main Gate", lat: 12.8202, lng: 80.0416, category: "campus" },
      { id: "srm-tech-park", label: "SRM Tech Park", lat: 12.8252, lng: 80.0425, category: "campus" },
      { id: "srm-est", label: "SRM EST Block", lat: 12.8239, lng: 80.0435, category: "campus" },
      { id: "srm-java-hostel", label: "SRM Java Hostel", lat: 12.8215, lng: 80.0465, category: "campus" },
      { id: "potheri-station", label: "Potheri Railway Station", lat: 12.8222, lng: 80.0402, category: "transit" },
      { id: "tambaram-station", label: "Tambaram Railway Station", lat: 12.9249, lng: 80.1197, category: "transit" },
      { id: "chennai-airport", label: "Chennai Intl Airport (MAA)", lat: 12.9806, lng: 80.1632, category: "transit" },
    ],
  },
  {
    id: "other",
    name: "Partner Universities",
    subdomain: "partner",
    emailDomains: [
      "srmap.edu.in", "annauniv.edu", "iitm.ac.in", "ssn.edu.in", "svce.ac.in",
      "rajalakshmi.edu.in", "sathyabama.ac.in", "hindustanuniv.ac.in", "saveetha.ac.in",
      "veltech.edu.in", "crescent.education", "stjosephstechnology.ac.in", "jeppiaarcollege.org",
      "panimalar.ac.in", "sairam.edu.in", "sairamit.edu.in", "loyolacollege.edu",
      "mcc.edu.in", "dgvaishnavcollege.edu.in", "ethirajcollege.edu.in", "wcc.edu.in",
      "madrasuniversity.ac.in", "iitb.ac.in", "iitd.ac.in", "iitk.ac.in",
      "iitkgp.ac.in", "iitg.ac.in", "iitr.ac.in", "iith.ac.in", "iitbbs.ac.in",
      "iitj.ac.in", "iitmandi.ac.in", "iitgn.ac.in", "iiit.ac.in", "iiitb.ac.in",
      "iiitd.ac.in", "iiitl.ac.in", "iiitdm.ac.in", "iiitkottayam.ac.in", "iiitnr.edu.in",
      "iisc.ac.in", "rvce.edu.in", "bmsce.ac.in", "bmsit.in", "msrit.edu",
      "pes.edu", "christuniversity.in", "reva.edu.in", "cmrit.ac.in", "nmit.ac.in",
      "newhorizonindia.edu", "jainuniversity.ac.in", "alliance.edu.in", "presidencyuniversity.in",
      "acsce.edu.in", "dayanandasagar.edu", "uohyd.ac.in", "osmania.ac.in",
      "jntuh.ac.in", "cbit.ac.in", "griet.ac.in", "cvr.ac.in", "vnrvjiet.in",
      "mgit.ac.in", "mahindrauniversity.edu.in", "anurag.edu.in", "mlrinstitutions.ac.in",
      "woxsen.edu.in", "ifheindia.org", "kluniversity.in", "vignan.ac.in",
      "gitam.edu", "rgukt.in", "srkr.edu.in", "aditya.ac.in", "aec.edu.in",
      "pvpsiddhartha.ac.in", "rvrjc.ac.in", "vrsiddhartha.ac.in", "svuniversity.edu.in",
      "jntuku.edu.in", "andhrauniversity.edu.in", "nist.edu", "bits-pilani.ac.in",
      "manipal.edu", "amity.edu", "amity.edu.in", "dtu.ac.in", "nitt.edu",
      "nitk.edu.in", "nitw.ac.in", "nitc.ac.in", "nitrkl.ac.in", "mnit.ac.in",
      "iiita.ac.in", "jadavpuruniversity.in", "kiit.ac.in", "soa.ac.in",
      "thapar.edu", "chitkara.edu.in", "lnmiit.ac.in", "vitbhopal.ac.in",
      "sharda.ac.in", "galgotiasuniversity.edu.in", "lpu.in", "cuonline.ac.in",
      "symbiosis.ac.in", "mitwpu.edu.in", "coep.org.in", "pccoepune.com", "nxtwave.co.in"
    ],
    defaultCollegeName: "Partner Universities",
    defaultCoordinates: { lat: 13.0827, lng: 80.2707 },
    landmarks: [
      { id: "iitm-gate", label: "IIT Madras Main Gate", lat: 12.9915, lng: 80.2425, category: "campus" },
      { id: "anna-univ-gate", label: "Anna University Main Gate", lat: 13.0125, lng: 80.2352, category: "campus" },
      { id: "chennai-central", label: "Chennai Central Railway Station", lat: 13.0822, lng: 80.2755, category: "transit" },
      { id: "egmore-station", label: "Egmore Railway Station", lat: 13.0792, lng: 80.2618, category: "transit" },
      { id: "cmbt-bus-stand", label: "Koyambedu CMBT Bus Stand", lat: 13.0674, lng: 80.2052, category: "transit" },
    ],
  },
];

export function getActiveCampus(profileCollege?: string): CampusConfig {
  if (typeof window === "undefined") {
    if (profileCollege) {
      const match = CAMPUSES.find((c) => c.defaultCollegeName === profileCollege);
      if (match) return match;
    }
    return CAMPUSES[0];
  }

  // 1. Try subdomain from hostname
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 1) {
    const subdomain = parts[0];
    const match = CAMPUSES.find((c) => c.subdomain === subdomain);
    if (match) return match;
  }

  // 2. Try user profile college name
  if (profileCollege) {
    const match = CAMPUSES.find((c) => c.defaultCollegeName === profileCollege);
    if (match) return match;
  }

  // 3. Try localStorage
  const saved = localStorage.getItem("campuspool_active_campus");
  if (saved) {
    const match = CAMPUSES.find((c) => c.id === saved);
    if (match) return match;
  }

  return CAMPUSES[0];
}
