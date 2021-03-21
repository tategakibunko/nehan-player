all:
	webpack
	sed -e '1d' nehan-player.js > tmp
	cat nehan-player.js.LICENSE.txt > ../dist/nehan-player.min.js
	cat tmp >> ../dist/nehan-player.min.js
	rm tmp
	make sync-doc

sync-doc:
	cp doc-demo.js ../docs/
	cp test-data/* ../docs/test-data/
	rm ../docs/themes/*.css
	cp themes/* ../docs/themes/

server:
	browser-sync start --server --index=advanced.html --files="*.js, *.css, *.html, themes/*.css, test-data/*.html, test-data/*.txt"
