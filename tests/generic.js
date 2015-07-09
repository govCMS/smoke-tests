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
