-- Sacramento — all marketplace credential links
-- Each activation credential individually + group certs + individual CE course keys.
-- Run in Supabase SQL editor after platform_cities.credential_resource_links exists.

UPDATE platform_cities
SET
  credential_resource_links = '{
    "govId": [
      {
        "url": "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/",
        "label": "California driver license or ID card — DMV"
      },
      {
        "url": "https://www.dmv.ca.gov/portal/locations/",
        "label": "Find a DMV office near Sacramento"
      }
    ],
    "coi": [
      {
        "url": "https://www.bsis.ca.gov/industries/security_guards.shtml",
        "label": "BSIS security guard requirements — insurance info"
      },
      {
        "url": "https://www.nextinsurance.com/business-insurance/general-liability/",
        "label": "Next Insurance — general liability (COI)"
      }
    ],
    "guardCard": [
      {
        "url": "https://www.bsis.ca.gov/industries/guard_card.shtml",
        "label": "Apply for a BSIS guard card — BSIS"
      },
      {
        "url": "https://www.guardcardcourses.com/sc101.asp",
        "label": "Guard Card Courses — includes guard card training path",
        "price": "$49"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online"
      }
    ],
    "ptaUof": [
      {
        "url": "https://www.guardcardcourses.com/sc101.asp",
        "label": "Guard Card Courses — 8-hour PTA/UOF providers",
        "price": "$49"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — 8-hour PTA/UOF providers"
      }
    ],
    "bsis-pta-uof-8hr": [
      {
        "url": "https://www.guardcardcourses.com/sc101.asp",
        "label": "Guard Card Courses — combined 8-hour certificate (group)",
        "price": "$49"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — combined 8-hour certificate (group)"
      }
    ],
    "bsis-power-to-arrest": [
      {
        "url": "https://www.guardcardcourses.com/sc101.asp",
        "label": "Guard Card Courses — Power to Arrest (individual cert)",
        "price": "$49"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Power to Arrest (individual cert)"
      }
    ],
    "bsis-appropriate-use-of-force": [
      {
        "url": "https://www.guardcardcourses.com/sc101.asp",
        "label": "Guard Card Courses — Appropriate Use of Force (individual cert)",
        "price": "$49"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Appropriate Use of Force (individual cert)"
      }
    ],
    "continuedEducation": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — 32-hour CE package (group)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — 32-hour CE package (group)"
      }
    ],
    "bsis-public-relations": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Public Relations (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Public Relations (4 hr)"
      }
    ],
    "bsis-observation-documentation": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Observation and Documentation (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Observation and Documentation (4 hr)"
      }
    ],
    "bsis-communication": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Communication and Its Significance (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Communication (4 hr)"
      }
    ],
    "bsis-liability-legal": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Liability / Legal Aspects (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Liability / Legal Aspects (4 hr)"
      }
    ],
    "bsis-officer-safety": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Officer Safety (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Officer Safety (4 hr)"
      }
    ],
    "bsis-trespass": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Trespass (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Trespass (4 hr)"
      }
    ],
    "bsis-evacuation-procedures": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Evacuation Procedures (2 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Evacuation Procedures (2 hr)"
      }
    ],
    "bsis-monitoring-crowd-control": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Monitoring Crowd Control (2 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Monitoring Crowd Control (2 hr)"
      }
    ],
    "bsis-arrest-search-seizure": [
      {
        "url": "https://www.guardcardcourses.com/pk102.asp",
        "label": "Guard Card Courses — Arrests, Search and Seizure (4 hr)",
        "price": "$65"
      },
      {
        "url": "https://www.valleyguardonline.com/",
        "label": "Valley Guard Online — Arrests, Search and Seizure (4 hr)"
      }
    ]
  }'::jsonb,
  updated_at = timezone('utc'::text, now())
WHERE id = 'sacramento'
   OR name = 'Sacramento';

-- Verify
SELECT id, name, status, jsonb_pretty(credential_resource_links) AS credential_resource_links
FROM platform_cities
WHERE id = 'sacramento';
