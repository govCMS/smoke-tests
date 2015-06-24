var fs = require('fs');
var utils = require('utils');

casper.options.verbose = true;
casper.options.logLevel = casper.cli.get("logLevel") || 'debug';
casper.options.exitOnError = false; // Keep going on error.
casper.options.timeout = 10 * 60 * 1000; // 10 minutes.
casper.options.pageSettings = {
  javascriptEnabled: true,
  loadImages: true,
  loadPlugins: false,
  userAgent: 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36'
};
casper.options.viewportSize = {
  width: 1280,
  height: 800
};

// Do not track CasperJS in GA.
casper.options.onResourceRequested = function(casper, requestData, request) {
  if (requestData.url.match(/google-analytics\.com/)) {
    casper.log('Request to GA. Aborting: ' + requestData.url, 'debug');
    request.abort();
  }
};

// HTML logging.
casper.on('open', function (location) {
  this.echo(location + ' opened');
});

// Catch JS errors on the page.
casper.on('page.error', function(msg, trace) {
  this.test.fail('JavaScript Error: ' + msg);
});

// Catch load errors for the page resources.
casper.on('resource.error', function(resource) {
  if (resource.url != "" &&
    !resource.url.match(/.*google-analytics\.com.*/) &&
    !resource.url.match(/.*fonts\.net.*/) &&
    !resource.url.match(/.*pbs\.twimg\.com.*/) &&
    !resource.url.match(/.*twitter\.com.*/)
  ) {
    this.echo(resource.url + " not found.", "RED_BAR");
  }
});

// Screenshot fails.
casper.on('step.error', function(failure) {
  this.capture('fail.png');
});

var sites = casper.cli.get("sites").split(" ");
var siteURLs = [];
var limit = casper.cli.get("limit") || 20;
var timestamp = casper.cli.get("timestamp") || 1;
var numberOfSuccess = 10 * (limit + 1);

casper.each(sites, function (self, site) {
  casper.test.begin('Testing ' + site, numberOfSuccess, function suite(test) {
    casper.start(site + '?' + timestamp, function() {
      siteURLs = [];
      this.echo(this.getTitle());
      globalPageTests(this);

      var links = this.evaluate(function() {
        links = document.getElementsByTagName('a');
        links = Array.prototype.map.call(links,function(link){
          return link.getAttribute('href');
        });
        return links;
      });

      // Add common URLs to the front of the stack.
      var commonUrls = [
        '/user/login',
        '/search/government'
      ];
      Array.prototype.forEach.call(commonUrls, function(link) {
        links.unshift(link);
      });

      // Add newly found URLs to the stack
      var baseUrl = this.getGlobal('location').origin;
      Array.prototype.forEach.call(links, function(link) {
        var addLink = true;

        // Ensure this link is not an in-page hyperlink.
        if (link.match(/^#.*/)) {
          addLink = false;
        }

        // We have already tested the homepage.
        else if (link.match(/^\/$/)) {
          addLink = false;
        }

        // No RSS.
        else if (link.match(/\.xml$/)) {
          addLink = false;
        }

        // Ensure this link is on the same domain
        else if (link.match(/^https?:\/\/.*/) && link.indexOf(baseUrl) !== 0) {
          addLink = false;
        }

        if (addLink) {
          var newUrl = absoluteUri(baseUrl, link);
          if (siteURLs.indexOf(newUrl) == -1) {
            if (siteURLs.length < limit) {
              casper.echo(casper.colorizer.format('-> Pushed ' + newUrl + ' onto the stack', { fg: 'magenta' }));
              siteURLs.push(newUrl);
            }
          }
        }
      });
    });

    casper.then(function() {
      casper.each(siteURLs, function(self, link) {
        casper.thenOpen(link + '?' + timestamp, function(a) {
          globalPageTests(this);
        });
      });
    });

    casper.run(function() {
      test.done();
    });
  });
});
