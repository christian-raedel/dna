all: clean install test docs

install:
	@echo "************************"
	@echo "* INSTALL DEPENDENCIES *"
	@echo "************************"
	@npm install --python=/usr/bin/python2.7

test:
	@echo "************************"
	@echo "* TEST LIBRARY         *"
	@echo "************************"
	@cat .dev-id
	@./node_modules/.bin/mocha --recursive test/*.spec.js

docs:
	@echo "************************"
	@echo "* CREATE DOCUMENTATION *"
	@echo "************************"
	@./node_modules/.bin/jsdoc --recurse --destination ./doc lib/*.js README.md

github.io:
	@echo "************************"
	@echo "* CREATE DOCUMENTATION *"
	@echo "* FOR GITHUB.IO        *"
	@echo "************************"
	@./node_modules/.bin/jsdoc --recurse --destination ../christian-raedel.github.io/dna lib/*.js README.md

clean:
	@echo "************************"
	@echo "* CLEANUP DIRECTORY    *"
	@echo "************************"
	-@rm -rf ./node_modules
	-@rm -rf ./doc

.PHONY: all install test docs
