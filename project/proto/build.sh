protoc --js_out=import_style=commonjs,binary:. playerpb.proto roompb.proto message.proto
browserify -x *.js > ../../public/javascripts/gserverpb.js