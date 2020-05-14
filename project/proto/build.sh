protoc --js_out=import_style=commonjs,binary:. playerpb.proto roompb.proto chatmsgpb.proto
browserify *.js > ../../public/javascripts/gserverpb.js