# fonts/

`cinzel-title-800.woff2` and `cinzel-title-700.woff2` — the hero's title card (800) and the
slate line above it (700), owner 2026-10-02: "a better serif with FILM OS designs inside the
writing". Cinzel is Roman inscriptional capitals — the letter the film poster has used for a
century — and it has no lowercase of its own, which suits a title set in capitals. Each file
is a static instance cut to the capitals, digits and the punctuation a title uses
(`A–Z 0–9` and `. , : ; ! ? & ' ’ " “ ” - – — ( ) /`), about 5.8 KB a weight, loaded only on
the home page. Lowercase is deliberately absent: `.film-title` and `.slate-text` set
`text-transform: uppercase`, so a lowercase glyph is never drawn.

Cinzel is © 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) and
licensed under the SIL Open Font License 1.1 (`OFL-Cinzel.txt`), which allows subsetting and
instancing; it declares no Reserved Font Name.

Made with the Google Fonts API's own subsetter (a static instance per weight, the glyphs
above only):
`https://fonts.googleapis.com/css2?family=Cinzel:wght@800&text=<the characters above>`,
requested with a current browser's user agent so the response is woff2.

The film pattern drawn inside the title (`globals.css`, THE FILM IN THE LETTERS) is placed
on Cinzel's vertical metrics — ascent 0.969em, descent 0.375em, cap height 0.700em, so at
`line-height: 1` the capitals run from 0.097em to 0.797em of each line box. A different face
moves the capitals and the pattern must be re-placed with it.

Archivo (the previous title face, 2026-10-01) is retired and its files are removed.
