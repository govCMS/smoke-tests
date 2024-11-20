# govCMS smoke tests - ARCHIVED

This is a script that will load up the homepage of a bunch of sites on either TEST or PROD ACSF, to check for regressions. The ideal is to reduce manual effort by automating these checks as much as we can.

## Installation

First you will need to install PhantomJS, the [2.0 release](http://phantomjs.org/download.html) is preferred. If you are running Mac OSX there is a critical bug that effects this, you will need this [fork](https://github.com/eugene1g/phantomjs/releases) in the mean time. Once you have downloaded the binary, symlink this to <code>/usr/local/bin/phantomjs</code>.

Next is CasperJS, you can git clone this repo

```
git clone https://github.com/n1k0/casperjs.git
git checkout master
```

Then symlink the bin/casperjs script to <code>/usr/local/bin/casperjs</code>.

You can verify this works by running:

```
casperjs --version
phantomjs --version
```

From anywhere (as these should now be on your path).

## Run the script

This is simple.

```
./run.sh
```

You can also test the TEST ACSF instance with

```
./run.sh -e=TEST
```

CasperJS will report success or failure at the end of the test run. Tests can take upwards of 1 minute to run (depending on site speed).

## Debug

You can run the script with an optional parameter to get CasperJS debug output.

```
./run.sh -v
```
