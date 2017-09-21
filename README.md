node-gocanvas
==============

[![npm license](https://img.shields.io/npm/l/gocanvas.svg)](https://www.npmjs.com/package/gocanvas) [![npm version](https://img.shields.io/npm/v/gocanvas.svg)](https://www.npmjs.com/package/gocanvas) [![npm downloads](https://img.shields.io/npm/dm/gocanvas.svg)](https://www.npmjs.com/package/gocanvas)

A lightweight Canvas SDK

[Canvas Web Services API Documentation PDF](https://www.gocanvas.com/content/images/file-uploads/Canvas_Webservices.pdf)

Install
-------
```
# Latest Stable Release
$ npm install gocanvas

# Latest Commit
$ npm install tflanagan/node-gocanvas
```

Example
-------
```javascript
'use strict';

const GoCanvas = require('gocanvas');

const gc = new GoCanvas({
	service: {
		hostname: 'www.gocanvas.com',
		port: 443,
		path: '/apiv2'
	},

	options: {
		encoding: 'utf-8'
	},

	username: '',
	password: ''
});

gc.getForms().map((form) => {
	return gc.getSubmissions({
		form_id: form.Id
	d}).then((submissions) => {
		console.log(submissions);

		return submissions;
	});
}).catch((err) => {
	console.error(err);
});

```

Class
-----
```javascript
class GoCanvas {

	constructor([options = {}])

	getForms([querystring = {}])
	getSubmissions([querystring = {}])
	getImages([querystring = {}])
	postReferenceData(data[, querystring = {}])
	postCSVMetaData(data[, querystring = {}])
	getCSV([querystring = {}])
	// postDispatchItems(data[, querystring = {}])
	// getDepartments([querystring = {}])

	defaults

}
```

License
-------

Copyright 2017 Tristian Flanagan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
