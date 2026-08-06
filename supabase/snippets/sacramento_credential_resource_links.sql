-- Sacramento — marketplace credential links with verified prices (Aug 2026)
-- Sources: guardcardcourses.com (TwoProtect / partner locations), valleyguardonline.com / guardboss.com
-- Run in Supabase SQL editor.

UPDATE platform_cities
SET
  credential_resource_links = '{
    "govId": [
      {
        "url": "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/renewal-or-replacement/renewal-or-replacement/",
        "label": "California DMV — renew or replace driver license / ID"
      },
      {
        "url": "https://www.dmv.ca.gov/portal/locations/",
        "label": "Find a DMV office near Sacramento"
      }
    ],
    "coi": [
      {
        "url": "https://www.bsis.ca.gov/industries/security_guards.shtml",
        "label": "BSIS — security guard insurance requirements"
      },
      {
        "url": "https://www.nextinsurance.com/business-insurance/general-liability/",
        "label": "Next Insurance — general liability quote (COI)"
      }
    ],
    "guardCard": [
      {
        "url": "https://www.bsis.ca.gov/industries/guard_card.shtml",
        "label": "BSIS — apply for guard card ($50 application fee)"
      },
      {
        "url": "https://www.guardcardcourses.com/sc101.asp",
        "label": "Guard Card Courses — select Sacramento location for 8-hr training path"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/bundle/102",
        "label": "Valley Guard Online — 8-hour guard card bundle",
        "price": "$150"
      }
    ],
    "ptaUof": [
      {
        "url": "https://www.guardcardcourses.com/guard_card_branded.asp?company=SSTC",
        "label": "Guard Card Courses — Sacramento SSTC (Part A online + Part B in-person)",
        "price": "$29 Part A online + Part B in-person"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/bundle/102",
        "label": "Valley Guard Online — 8-hour PTA/UOF bundle (online + in-person)",
        "price": "$150"
      }
    ],
    "bsis-pta-uof-8hr": [
      {
        "url": "https://www.guardcardcourses.com/guard_card_branded.asp?company=SSTC",
        "label": "Guard Card Courses — combined 8-hour certificate (Sacramento SSTC)",
        "price": "$29 Part A + Part B in-person"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/bundle/102",
        "label": "Valley Guard Online — combined 8-hour certificate (group)",
        "price": "$150"
      }
    ],
    "bsis-power-to-arrest": [
      {
        "url": "https://www.guardcardcourses.com/guard_card_branded.asp?company=SSTC",
        "label": "Guard Card Courses — Power to Arrest Part A (online, Sacramento SSTC)",
        "price": "$29"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/bundle/102",
        "label": "Valley Guard Online — Powers to Arrest (in 8-hr bundle)",
        "price": "$150 bundle"
      }
    ],
    "bsis-appropriate-use-of-force": [
      {
        "url": "https://www.guardcardcourses.com/guard_card_branded.asp?company=SSTC",
        "label": "Guard Card Courses — Appropriate Use of Force Part B (in-person, Sacramento)",
        "price": "Part B fee at classroom (after $29 Part A)"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/bundle/102",
        "label": "Valley Guard Online — Appropriate Use of Force (in-person, in 8-hr bundle)",
        "price": "$150 bundle"
      }
    ],
    "continuedEducation": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — 32-hour CE package (group, all 9 courses)",
        "price": "$65"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/bundle/105",
        "label": "Valley Guard Online — 32-hour CE package (group)",
        "price": "$176"
      }
    ],
    "bsis-communication": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Communication and Its Significance (SC-102)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/137",
        "label": "Valley Guard Online — Communication (4 hr)",
        "price": "$22"
      }
    ],
    "bsis-public-relations": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Public Relations (SC-103)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/135",
        "label": "Valley Guard Online — Public Relations and Professionalism (4 hr)",
        "price": "$22"
      }
    ],
    "bsis-observation-documentation": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Observation and Documentation (SC-104)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/134",
        "label": "Valley Guard Online — Observation and Documentation (4 hr)",
        "price": "$22"
      }
    ],
    "bsis-liability-legal": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Liability / Legal Aspects (SC-105)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/136",
        "label": "Valley Guard Online — Liability and Legal Aspects (4 hr)",
        "price": "$22"
      }
    ],
    "bsis-officer-safety": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Officer Safety (SC-106)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/144",
        "label": "Valley Guard Online — Officer Safety (4 hr)",
        "price": "$22"
      }
    ],
    "bsis-trespass": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Trespass (SC-107)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/148",
        "label": "Valley Guard Online — Trespass (4 hr)",
        "price": "$22"
      }
    ],
    "bsis-evacuation-procedures": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Evacuation Procedures (SC-108)",
        "price": "$12"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/141",
        "label": "Valley Guard Online — Evacuation Procedures (2 hr)",
        "price": "$22"
      }
    ],
    "bsis-monitoring-crowd-control": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Monitoring Crowd Control (SC-110)",
        "price": "$12"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/155",
        "label": "Valley Guard Online — Crowd Control, Safety and Care (2 hr)",
        "price": "$22"
      }
    ],
    "bsis-arrest-search-seizure": [
      {
        "url": "https://www.guardcardcourses.com/courses_new.asp",
        "label": "Guard Card Courses — Arrests, Search and Seizure (SC-109)",
        "price": "$20"
      },
      {
        "url": "https://www.guardboss.com/valleyguardtraining/online/133",
        "label": "Valley Guard Online — Advanced Arrest, Search and Seizure (4 hr)",
        "price": "$22"
      }
    ]
  }'::jsonb,
  updated_at = timezone('utc'::text, now())
WHERE id = 'sacramento'
   OR name = 'Sacramento';

SELECT id, name, status, jsonb_pretty(credential_resource_links) AS credential_resource_links
FROM platform_cities
WHERE id = 'sacramento';
