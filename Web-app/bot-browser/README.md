# BotBrowser

This is a simple web viewer that demonstrates the content of a BOT/LBD compliant dataset.

Based on [ng-plan](https://www.npmjs.com/package/ng-plan) and [ng-mesh-viewer](https://www.npmjs.com/package/ng-mesh-viewer) by Mads Holten Rasmussen.

Uses library [wellknown](https://www.npmjs.com/package/wellknown) to parse 2D WKT geometry to GeoJSON.

Uses library [rdfstore](https://www.npmjs.com/package/rdfstore) to load triples into an in-momory triplestore and perform SPARQL queries on the dataset.

## Content

Main application located in `src/app/app.component.ts`

Communication with the triple-file happens in `src/app/app.service.ts`