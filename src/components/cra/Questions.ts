export type Answer = "yes" | "partly" | "no" | "unsure";

type Text = { en: string; nl: string };

export interface Question {
  id: string;
  area: Text;
  question: Text;
  fix: Text;
  critical?: boolean;
}

export const answerScore: Record<Answer, number> = {
  yes: 2,
  partly: 1,
  no: 0,
  unsure: 0,
};

export const questions: Question[] = [
  {
    id: "reporting",
    critical: true,
    area: { en: "Vulnerability reporting", nl: "Kwetsbaarheden melden" },
    question: {
      en: "Could you send an early warning about an actively exploited vulnerability in your product within 24 hours?",
      nl: "Kunt u binnen 24 uur een eerste melding doen van een actief misbruikte kwetsbaarheid in uw product?",
    },
    fix: {
      en: "This obligation applies since 11 September 2026, also to products already on the market. Write a short runbook: who decides, who reports, and which information goes into the 24-hour, 72-hour and final reports.",
      nl: "Deze verplichting geldt sinds 11 september 2026, ook voor producten die al op de markt zijn. Schrijf een kort draaiboek: wie beslist, wie meldt en welke informatie in de meldingen na 24 uur, 72 uur en de eindrapportage komt.",
    },
  },
  {
    id: "disclosure",
    critical: true,
    area: { en: "Vulnerability reporting", nl: "Kwetsbaarheden melden" },
    question: {
      en: "Is there a public way for researchers and customers to report a vulnerability to you?",
      nl: "Is er een openbare manier waarop onderzoekers en klanten een kwetsbaarheid bij u kunnen melden?",
    },
    fix: {
      en: "Publish a coordinated vulnerability disclosure policy with a security contact (for example a security.txt file and a dedicated email address), and decide how reports are triaged.",
      nl: "Publiceer een beleid voor coordinated vulnerability disclosure met een beveiligingscontact (bijvoorbeeld een security.txt-bestand en een apart e-mailadres), en leg vast hoe meldingen worden beoordeeld.",
    },
  },
  {
    id: "updates",
    critical: true,
    area: { en: "Security updates", nl: "Beveiligingsupdates" },
    question: {
      en: "Can every device in the field receive a security update without a technician on site?",
      nl: "Kan elk apparaat in het veld een beveiligingsupdate ontvangen zonder dat er een monteur langs moet?",
    },
    fix: {
      en: "Add a remote update path (over the network, or through a companion app or gateway) before you ship more units. Devices that can’t be updated are hard to keep compliant.",
      nl: "Voeg een updatepad op afstand toe (via het netwerk, of via een app of gateway) voordat u meer apparaten levert. Apparaten die niet te updaten zijn, zijn lastig compliant te houden.",
    },
  },
  {
    id: "automatic",
    area: { en: "Security updates", nl: "Beveiligingsupdates" },
    question: {
      en: "Are security updates installed automatically by default, with a way for the user to opt out?",
      nl: "Worden beveiligingsupdates standaard automatisch geïnstalleerd, met een mogelijkheid voor de gebruiker om dat uit te zetten?",
    },
    fix: {
      en: "Make automatic security updates the default and add a clear opt-out setting. Notify users when an update is available or installed.",
      nl: "Maak automatische beveiligingsupdates de standaard en voeg een duidelijke instelling toe om dit uit te zetten. Laat gebruikers weten wanneer een update beschikbaar of geïnstalleerd is.",
    },
  },
  {
    id: "separate",
    area: { en: "Security updates", nl: "Beveiligingsupdates" },
    question: {
      en: "Can you ship a security fix without also shipping unrelated feature changes?",
      nl: "Kunt u een beveiligingsfix uitbrengen zonder ook niet-gerelateerde nieuwe functies mee te leveren?",
    },
    fix: {
      en: "Keep maintenance branches per released version so a fix can go out on its own. Where feasible, the CRA asks for security updates to be separate from feature updates.",
      nl: "Houd onderhoudsbranches per uitgebrachte versie bij, zodat een fix los kan worden uitgebracht. Waar mogelijk vraagt de CRA om beveiligingsupdates gescheiden te houden van functionele updates.",
    },
  },
  {
    id: "signed",
    critical: true,
    area: { en: "Update integrity", nl: "Integriteit van updates" },
    question: {
      en: "Are update images signed, and does the device check the signature before installing?",
      nl: "Zijn update-images ondertekend, en controleert het apparaat de handtekening vóór installatie?",
    },
    fix: {
      en: "Sign every release in CI with a key kept off developer machines, and verify the signature on the device before an image is written or booted.",
      nl: "Onderteken elke release in CI met een sleutel die niet op ontwikkelaarsmachines staat, en controleer de handtekening op het apparaat voordat een image wordt geschreven of gestart.",
    },
  },
  {
    id: "rollback",
    area: { en: "Update integrity", nl: "Integriteit van updates" },
    question: {
      en: "If an update fails or the new firmware won’t start, does the device recover on its own?",
      nl: "Als een update mislukt of de nieuwe firmware niet start, herstelt het apparaat zich dan zelf?",
    },
    fix: {
      en: "Use A/B slots (or a recovery partition) and switch back automatically after repeated failed boots. A security update that bricks devices won’t get installed twice.",
      nl: "Gebruik A/B-slots (of een herstelpartitie) en schakel automatisch terug na herhaaldelijk mislukte starts. Een beveiligingsupdate die apparaten brickt, wordt geen tweede keer geïnstalleerd.",
    },
  },
  {
    id: "secureboot",
    area: { en: "Update integrity", nl: "Integriteit van updates" },
    question: {
      en: "Does the device verify its own firmware at boot (secure boot)?",
      nl: "Controleert het apparaat zijn eigen firmware bij het opstarten (secure boot)?",
    },
    fix: {
      en: "Enable your chip’s secure boot or build a chain of trust from the bootloader, so modified firmware won’t run.",
      nl: "Zet secure boot van uw chip aan of bouw een vertrouwensketen vanaf de bootloader, zodat aangepaste firmware niet draait.",
    },
  },
  {
    id: "sbom",
    critical: true,
    area: { en: "Software bill of materials", nl: "Software bill of materials" },
    question: {
      en: "Do you have a machine-readable SBOM (CycloneDX or SPDX) for every firmware release?",
      nl: "Heeft u voor elke firmwarerelease een machineleesbare SBOM (CycloneDX of SPDX)?",
    },
    fix: {
      en: "Generate the SBOM in CI on every release, covering at least your top-level dependencies (RTOS, libraries, Linux packages), and store it with the release.",
      nl: "Genereer de SBOM in CI bij elke release, met ten minste uw directe afhankelijkheden (RTOS, libraries, Linux-pakketten), en bewaar die bij de release.",
    },
  },
  {
    id: "monitoring",
    area: { en: "Software bill of materials", nl: "Software bill of materials" },
    question: {
      en: "Are you told when a new vulnerability is published for one of your dependencies?",
      nl: "Krijgt u bericht wanneer er een nieuwe kwetsbaarheid wordt gepubliceerd in een van uw afhankelijkheden?",
    },
    fix: {
      en: "Feed your SBOMs into a vulnerability scanner that checks them against new CVEs, and route its alerts to someone who can act on them.",
      nl: "Laat een kwetsbaarhedenscanner uw SBOM’s controleren op nieuwe CVE’s, en stuur de meldingen naar iemand die er iets mee kan.",
    },
  },
  {
    id: "passwords",
    critical: true,
    area: { en: "Secure by default", nl: "Standaard veilig" },
    question: {
      en: "Do devices ship without default or shared passwords and keys?",
      nl: "Worden apparaten geleverd zonder standaard- of gedeelde wachtwoorden en sleutels?",
    },
    fix: {
      en: "Give every unit unique credentials at production, or force the user to set them on first use. Shared keys across a fleet turn one leak into a fleet-wide problem.",
      nl: "Geef elk apparaat unieke inloggegevens tijdens productie, of dwing de gebruiker die bij het eerste gebruik in te stellen. Gedeelde sleutels in een hele vloot maken van één lek een probleem voor alle apparaten.",
    },
  },
  {
    id: "debug",
    area: { en: "Secure by default", nl: "Standaard veilig" },
    question: {
      en: "Are debug interfaces (JTAG/SWD, UART consoles) and unused network services disabled on production units?",
      nl: "Zijn debuginterfaces (JTAG/SWD, UART-consoles) en ongebruikte netwerkdiensten uitgeschakeld op productie-apparaten?",
    },
    fix: {
      en: "Lock the debug port with your chip’s protection fuses or a production build flag, and close every port and service the product doesn’t need.",
      nl: "Vergrendel de debugpoort met de beveiligingsfuses van uw chip of een productie-buildoptie, en sluit elke poort en dienst die het product niet nodig heeft.",
    },
  },
  {
    id: "encryption",
    area: { en: "Secure by default", nl: "Standaard veilig" },
    question: {
      en: "Is communication with your backend and other devices encrypted and authenticated?",
      nl: "Is de communicatie met uw backend en andere apparaten versleuteld en geauthenticeerd?",
    },
    fix: {
      en: "Use TLS (or DTLS) with certificate verification for every connection, including MQTT, and don’t accept unauthenticated commands.",
      nl: "Gebruik TLS (of DTLS) met certificaatcontrole voor elke verbinding, ook MQTT, en accepteer geen niet-geauthenticeerde commando’s.",
    },
  },
  {
    id: "support",
    area: { en: "Support period", nl: "Ondersteuningsperiode" },
    question: {
      en: "Have you decided and documented how long each product will receive security updates?",
      nl: "Heeft u besloten en vastgelegd hoelang elk product beveiligingsupdates krijgt?",
    },
    fix: {
      en: "Set a support period per product (the CRA expects at least five years unless the product is used for less) and make sure your toolchain, keys and update servers will last that long.",
      nl: "Stel per product een ondersteuningsperiode vast (de CRA verwacht ten minste vijf jaar, tenzij het product korter wordt gebruikt) en zorg dat uw toolchain, sleutels en updateservers zo lang meegaan.",
    },
  },
  {
    id: "risk",
    area: { en: "Documentation", nl: "Documentatie" },
    question: {
      en: "Is there a written cybersecurity risk assessment for the product?",
      nl: "Is er een schriftelijke risicobeoordeling op het gebied van cybersecurity voor het product?",
    },
    fix: {
      en: "Write down what the product protects, who might attack it and how, and which measures address each risk. It becomes part of the technical documentation the CRA requires.",
      nl: "Leg vast wat het product beschermt, wie het zou kunnen aanvallen en hoe, en welke maatregelen elk risico afdekken. Dit wordt onderdeel van de technische documentatie die de CRA vereist.",
    },
  },
];
