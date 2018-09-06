## Install
Requires Revit Add-in manager

1) Copy "N_Shared_Parameters_GUID_TEST.txt" to "C:\Temp"
2) Load "NIRAS.Revit.TTL_Exporter.dll" with add-in manager

## Use
Under Add-Ins -> External Tools the Add-in manager can be found. Do the following steps to generate an LBD turtle file of your model:

1) If the model includes groups, these need to be exploded. This can be done by running  "NIRAS.Revit.TTL_Exporter.UngroupAll"
2) Run "NIRAS.Revit.TTL_Exporter.Addparameters" to add shared parameter "host", "siteID" and "buildingID" to project and "URI" to all objects
3) Enter Host, BuildingID, SiteID and Project Number in "Manage -> Project Information"
   Example host: "http://www.niras.dk/projects"
   Example Project Number: "P100100"
   Site- and Building IDs will be used when generating the URIs for the building and the site. For example: {{host}}/{{projectNo}}/site_{{siteID}}
4) Run "NIRAS.Revit.TTL_Exporter.Export_TTL_File_Main" to generate URIs and export ttl-file
5) Open files and validate content (for example by using "http://ttl.summerofcode.be/")

## Add-in manager
Install add-in manager:
1) Copy "Autodesk.AddInManager.addin" and "AddInManager.dll" to "C:\ProgramData\Autodesk\Revit\Addins\2018"
2) Open "Autodesk.AddInManager.addin" in text editor and change all three assembly definitions to <Assembly>C:\ProgramData\Autodesk\Revit\Addins\2018\AddInManager.dll</Assembly> (or where you put it)
3) Start Revit
4) If prompted for verification of the publisher, click "Always Load"
5) Confirm that the tool exists under Add-Ins -> External -> Add-In Manager