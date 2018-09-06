## BOT Duplex Apartment

[demo](https://madsholten.github.io/BOT-Duplex-house/)

This repository consists of the following:
 
1) A compiled version of the [Revit-BOT-exporter](https://github.com/MadsHolten/revit-bot-exporter) with the following settings:
    * Units described using [CDT](https://ci.mines-stetienne.fr/lindt/v2/custom_datatypes.html#)
    * Properties described with [OPM](https://w3id.org/opm)
    * 2D geometry described as [WKT](https://en.wikipedia.org/wiki/Well-known_text) literals
    * 3D mesh geometry described as [OBJ](https://en.wikipedia.org/wiki/Wavefront_.obj_file) literals
    * Products described with the [PRODUCT](https://github.com/w3c-lbd-cg/product) ontology

2) Model files:
    * Revit version of the Common BIM file [Duplex Apartment](https://www.nibs.org/page/bsa_commonbimfiles#project1)
    * Converted files from the [Revit-BOT-exporter](https://github.com/MadsHolten/revit-bot-exporter)

3) A web application built on Angular 6 and custom developed libraries [ng-plan](https://www.npmjs.com/package/ng-plan) and [ng-mesh-viewer](https://www.npmjs.com/package/ng-mesh-viewer) for visualizing 2D and 3D geometry. Try the [demo](https://madsholten.github.io/BOT-Duplex-house/).

4) A test tool which loads the LBD file in a triplestore and performs a set of queries on it

The content of the repository is described in detail in an article entitled *The BOT ontology: standards within a decentralised web-based AEC industry* which is currently under review for publication in Automation in Construction.