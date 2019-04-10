build:
	yarn build

deploy: build
	npm pack
	aws s3 cp swagger-devkit-* s3://swagger-devkit-package/ --acl public-read
	rm swagger-devkit-*

