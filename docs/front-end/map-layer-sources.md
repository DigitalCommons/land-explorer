## Map layer sources

Where the data behind each Mapbox overlay came from, and when it was last refreshed. Update this whenever a tileset is re-uploaded (see [how-to-add-a-new-layer.md](how-to-add-a-new-layer.md)).

Source files are backed up on the storage box under `mapbox-layer-sources`.

### Layers in scope for #258

| Layer | Tileset ID | Source layer | Last uploaded | Source | URL | Downloaded | Licence |
|---|---|---|---|---|---|---|---|
| Agricultural Land Classification | joolzt.ay7acj73 | Provisional_Agricultural_Land-ab795l | 2018-05-17 | Natural England | | | |
| Soils | joolzt.9edhyytu | NATIONAL_FOREST_ESTATE_SOIL_G-18j2ga | 2018-05-17 | Forestry Commission | | | |
| Greenbelt | joolzt.75llshed | Local_Authority_Greenbelt_bou-9r44t6 | 2018-05-30 | planning.data.gov.uk | | | |
| Brownfield | joolzt.4i2tzpgj | NCC_Brownfield_Sites | 2018-05-30 | planning.data.gov.uk | | | |
| Wards | joolzt.25vn26he | wards-cu4dni | 2023-02-15 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Counties | joolzt.6s8qdvfi | county-4ef4ik | 2023-02-15 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Westminster constituencies | joolzt.2d1u9n5a | westminster_const_region-8r33ph | 2023-02-15 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Districts / boroughs / unitaries | joolzt.c5ulw4oz | district_borough_unitary_regi-bquzqt | 2023-02-15 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Greater London constituencies | joolzt.6kicmrlr | greater_london_const_region-aplvbp | 2023-03-07 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Scotland and Wales | joolzt.b1kdveqs | scotland_and_wales-8wahad | 2023-03-13 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Parishes (1 of 4) | joolzt.cq0hagq5 | parish_1-bcfcla | 2023-03-13 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Parishes (2 of 4) | joolzt.dj4c79tf | parish_2-c6mbmy | 2023-03-13 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Parishes (3 of 4) | joolzt.0bha665k | parish_3-chtvqw | 2023-03-13 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |
| Parishes (4 of 4) | joolzt.b68bzxbu | parish_4-cwfy3j | 2023-03-13 | OS Boundary-Line | https://osdatahub.os.uk/downloads/open/BoundaryLine | | |

### Other land data layers (not listed in #258)

| Layer | Tileset ID | Source layer | Last uploaded |
|---|---|---|---|
| Historic flood map | joolzt.6dd4p92w | Historic_Flood_Map-5y05ao | 2018-05-17 |
| Flood risk zones | joolzt.flood-risk-zone | flood-risk-zone | 2026-04-30 |
| Sites of Special Scientific Interest | joolzt.50odxxr1 | Sites_of_Special_Scientific_I-09kaq4 | 2018-05-17 |
| Special Protection Areas | joolzt.cpacrvmx | Special_Protection_Areas_Engl-71pdjg | 2018-05-17 |
| Special Areas of Conservation | joolzt.c3j1rh4t | Special_Areas_of_Conservation-bm41zr | 2018-05-17 |

### Unused tilesets

These are in the composite URLs (`src/data/mapSources.ts`, and `MapLandDataLayers.tsx` for the 2019 wards) but no layer references them.

| Tileset ID | Source layer | Last uploaded |
|---|---|---|
| kingmob.8cgpa2xi | Wards_May_2019_Boundaries_UK_-d9ukjy | 2019-09-18 |
| kingmob.3mzcsn3y | 144348_St_Helens-1h7v6d | 2019-10-28 |
| kingmob.13t9w8d9 | 144350_-_Delgarno-26ei0o | 2019-10-28 |
| kingmob.cwck8dxg | 144351_Golborne-5qhq4t | 2019-10-28 |
| kingmob.4v2uu2el | 144347_Notting_Dale-13vbt0 | 2019-10-28 |
| kingmob.8jl57qha | 144349_Colville-8zqj2a | 2019-10-28 |
