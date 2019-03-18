build:
	yarn build

deploy: build
	npm pack
	aws s3 cp swagger-devkit-* s3://misc-tooling/swagger-devkit/
	rm swagger-devkit-*

