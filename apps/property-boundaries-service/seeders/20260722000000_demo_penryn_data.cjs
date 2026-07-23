"use strict";

// Demo dataset for dev/preview builds
// Meilisearch is indexed afterwards by the pbs-index one-shot service.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

module.exports = {
  async up(queryInterface) {
    const sql = zlib
      .gunzipSync(
        fs.readFileSync(path.join(__dirname, "data", "penryn-demo.sql.gz")),
      )
      .toString("utf8");
    for (const stmt of sql.split(/;\s*\n/)) {
      const s = stmt.trim();
      if (s) await queryInterface.sequelize.query(s);
    }
  },

  // Demo-only environments: drop everything the seed put in
  async down(queryInterface) {
    await queryInterface.sequelize.query("DELETE FROM land_ownerships");
    await queryInterface.sequelize.query("DELETE FROM land_ownership_polygons");
  },
};
