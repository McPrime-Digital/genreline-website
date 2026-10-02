# fonts/

`archivo-title.woff2` — the hero's title card face. A static instance of Archivo
(weight 800, width 125 — its widest), subset to Latin letters, digits and the
punctuation a title uses: under 6 KB instead of the 90 KB variable font, loaded only on the home
page. Archivo is © 2020 The Archivo Project Authors and licensed under the SIL Open Font
License 1.1 (`OFL-Archivo.txt`), which allows subsetting and instancing; it declares no
Reserved Font Name.

Rebuilt from the variable font with fontTools:
`instancer.instantiateVariableFont(font, {"wght": 800, "wdth": 125})`, then
`subset` with the text set listed in the commit that added it.
