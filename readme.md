# UX Tracking Library


### Installation
Installing the UX-tracking library consists of 2 steps:

* creating a config file  
~~The config file is create at the projects' root, and should be called `ux-tracker.config.yml`. 
You can copy the .dist file from the lib's root.~~
> This way does not work with angular projects atm, becuase they have routers that prohibit our config file to be read.

current workaround is just to define the array of config above the inclusion of the library:
```javascript
<script lang="javascript">
      uxTrackingConfig = {
        appName: 'appnamehere',
        appKey: 'appkeyhere',                                            
        backendUrl: 'backendurlhere'
      };
</script>

//include the library here
```

* Referencing the library in you projects js/typescript/html file  
```javascript
<script lang="javascript" src="https://bundle.inuits-ux-tracker.tk/bundle.js"></script>
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

### Development
For developing with a file watcher to automatically build the bundle.js you can use `inotify-tools`
```bash
while inotifywait -e close_write .; do 
    browserify script.js -o bundle.js; 
done
```
