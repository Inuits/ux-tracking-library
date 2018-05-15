# UX Tracking Library


### Installation
Installing the UX-tracking library consists of 2 steps:

* creating a config file  
The config file is create at the projects' root, and should be called `ux-tracker.config.yml`. 
You can copy the .dist file from the lib's root.

* Referencing the library in you projects js/typescript/html file  
```html
&lt;script lang="javascript" src="lib/ux-tracking-library/bundle.js">&lt;/script>
```


### Build
Building requires the Browserify package
```bash
npm install browserify -g
```

Then build the bundle.js from script.js
```bash
browserify script.js -o bundle.js
```