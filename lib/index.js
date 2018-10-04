var express = require('express');
var request = require('request');
var cors = require('cors');
var chalk = require('chalk');
var proxy = express();
var bodyParser = require('body-parser');

var startProxy = function(port, proxyUrl, proxyPartial) {
  proxy.use(cors());
  proxy.options('*', cors());
  proxy.use(bodyParser.json());
  proxy.use(bodyParser.urlencoded({ extended: false }));

  // remove trailing slash
  var cleanProxyUrl = proxyUrl.replace(/\/$/, '');
  // remove all forward slashes
  var cleanProxyPartial = proxyPartial.replace(/\//g, '');

  proxy.use(express.static('public'));

  proxy.use('/' + cleanProxyPartial, function(req, res) {
    try {
      console.log(chalk.green('Request Proxied -> ' + req.url));
    } catch (e) {}
    //req.pipe(request(cleanProxyUrl + req.url)).pipe(res);
      var formParams =  /^application\/x-www-form-urlencoded\b/.test(req.header('content-type'));
      let options = {
      url: cleanProxyUrl + req.url,
          method: req.method,
          headers: req.headers,
          rejectUnauthorized: false,
          followAllRedirects: true

      };
      if (formParams) {
          options.form = req.body;
      } else if(req.method === "POST"){
          options.body = req.body;
          options.json = true;
      }

      var urlObject = require("url").parse(cleanProxyUrl);
      options.headers["host"] = urlObject.host + (urlObject.port ? ":" + urlObject.port: "");
      delete options.headers["accept-encoding"];

      console.log(JSON.stringify(options, null, 2));

      request(options,function (err, response, body) {
          if(err) {
              console.log(chalk.red(err));
              res.status(500).send(err.message);
          }else {
              res.set(response.headers).status(response.statusCode).send(body);
          }

      });


  });

  proxy.listen(port);

  // Welcome Message
  console.log(chalk.bgGreen.black.bold.underline('\n Proxy Active \n'));
  console.log(chalk.blue('Proxy Url: ' + chalk.green(cleanProxyUrl)));
  console.log(chalk.blue('Proxy Partial: ' + chalk.green(cleanProxyPartial)));
  console.log(chalk.blue('PORT: ' + chalk.green(port) + '\n'));
  console.log(
    chalk.cyan(
      'To start using the proxy simply replace the proxied part of your url with: ' +
        chalk.bold('http://localhost:' + port + '/' + cleanProxyPartial + '\n')
    )
  );
};

exports.startProxy = startProxy;
