# Iron Atlas cartography

Natural Earth (public domain), release 5.1.1. The admin-0 layer uses the Ukraine worldview. Countries, dependencies and other mapped territories appear in the game; the count is not a claim about sovereign-state recognition. Regional coverage and administrative levels vary by country. This is an approximate, simplified map, not a current conflict map. Military, construction and economic statistics are fictional game rules.

Primary source downloads:

- https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries_ukr.zip
- https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip
- https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_populated_places_simple.zip
- https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_coastline.zip

Documentation and license:

- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
- https://www.naturalearthdata.com/about/terms-of-use/

Rebuild: install `scripts/world-map-requirements.txt`, then run `python scripts/build-world-map.py`. It writes the local `world-map-data.js` atlas. Shared borders become province neighbors; the physical coastline determines sea access. Ukrainian ISO region codes keep Crimea and Sevastopol in Ukraine. Capital points identify the province containing the seat of government; names use the dataset's Ukrainian names when available.
